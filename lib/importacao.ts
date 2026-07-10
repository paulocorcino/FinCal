import pdfParse from "pdf-parse";
import Papa from "papaparse";
import type { Categoria, Lancamento } from "@prisma/client";
import type OpenAI from "openai";
import { parseDataLancamento } from "@/lib/lancamentos";
import { toSPDateString } from "@/lib/saldo";
import {
  candidatosRawSchema,
  candidatosJsonSchema,
  type Candidato,
  type CandidatoRaw,
} from "@/lib/importacao-schema";
import {
  createOpenAIClient,
  getOpenAIModel,
} from "@/lib/assistant/openai";

function makeId(): string {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function resolverCategoria(
  sugestao: string,
  tipo: "RECEITA" | "DESPESA",
  categorias: Categoria[],
): string {
  const normal = normalizarTexto(sugestao);
  const match = categorias.find(
    (c) => c.tipo === tipo && normalizarTexto(c.nome) === normal,
  );
  return match?.id ?? "";
}

function extrairTextoOFX(texto: string): string {
  const transacoes: string[] = [];
  const blocos = texto.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g) ?? [];

  for (const bloco of blocos) {
    const dataMatch = bloco.match(/<DTPOSTED>([^<]+)/);
    const valorMatch = bloco.match(/<TRNAMT>([^<]+)/);
    const nomeMatch = bloco.match(/<NAME>([^<]+)/);
    const memoMatch = bloco.match(/<MEMO>([^<]+)/);

    const dataRaw = dataMatch?.[1]?.trim() ?? "";
    const data = dataRaw.length >= 8
      ? `${dataRaw.slice(0, 4)}-${dataRaw.slice(4, 6)}-${dataRaw.slice(6, 8)}`
      : "";
    const valor = valorMatch?.[1]?.trim() ?? "";
    const nome = nomeMatch?.[1]?.trim() ?? "";
    const memo = memoMatch?.[1]?.trim() ?? "";

    if (data && valor) {
      transacoes.push(`${data} | ${valor} | ${nome} | ${memo}`.trim());
    }
  }

  return transacoes.join("\n");
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName?: string,
): Promise<string> {
  try {
    if (mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      return parsed.text ?? "";
    }

    if (
      mimeType === "text/csv" ||
      fileName?.toLowerCase().endsWith(".csv")
    ) {
      const csvText = buffer.toString("utf-8");
      const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
      return (parsed.data as string[][])
        .map((row) => row.join(" | "))
        .join("\n");
    }

    if (
      mimeType.includes("ofx") ||
      fileName?.toLowerCase().endsWith(".ofx") ||
      fileName?.toLowerCase().endsWith(".qfx")
    ) {
      return extrairTextoOFX(buffer.toString("utf-8"));
    }
  } catch {
    return "";
  }

  return "";
}

export function parseCandidatosFromAIResponse(
  raw: unknown,
  categorias: Categoria[],
): Candidato[] {
  const parsed = candidatosRawSchema.parse(raw);

  return parsed.candidatos.map((item: CandidatoRaw) => {
    const valorEmCentavos = Math.round(item.valorEmReais * 100);

    return {
      id: makeId(),
      data: parseDataLancamento(item.data),
      valor: valorEmCentavos,
      descricao: item.descricao,
      tipo: item.tipo,
      categoriaSugerida: item.categoriaSugerida,
      categoriaId: resolverCategoria(
        item.categoriaSugerida,
        item.tipo,
        categorias,
      ),
      duplicado: false,
      selecionado: true,
    };
  });
}

const SYSTEM_PROMPT = `Você é um extrator de lançamentos financeiros. A partir do texto de um extrato ou fatura, identifique cada lançamento e retorne um objeto JSON com uma propriedade "candidatos" contendo um array de objetos. Cada objeto deve ter:
- data: string no formato YYYY-MM-DD
- valorEmReais: número positivo com a magnitude do valor (nunca negativo)
- descricao: string curta
- tipo: "RECEITA" para entradas/créditos ou "DESPESA" para saídas/débitos
- categoriaSugerida: string com o nome da categoria mais próxima

Se não houver lançamentos, retorne {"candidatos": []}.`;

export async function extrairCandidatos(
  texto: string,
  categorias: Categoria[],
  openai: OpenAI = createOpenAIClient(),
): Promise<Candidato[]> {
  if (!texto.trim()) {
    return [];
  }

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto },
      ],
      response_format: { type: "json_schema", json_schema: candidatosJsonSchema },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const raw = JSON.parse(content);
    return parseCandidatosFromAIResponse(raw, categorias);
  } catch (e) {
    console.error("extrairCandidatos failed:", e);
    return [];
  }
}

export function detectarDuplicados(
  candidatos: Candidato[],
  lancamentos: Lancamento[],
  contaId: string,
): Candidato[] {
  const chavesExistentes = new Set(
    lancamentos
      .filter((l) => l.contaId === contaId)
      .map((l) => `${contaId}|${toSPDateString(l.data)}|${l.valor}`),
  );

  return candidatos.map((candidato) => {
    const chave = `${contaId}|${toSPDateString(candidato.data)}|${candidato.valor}`;
    return { ...candidato, duplicado: chavesExistentes.has(chave) };
  });
}
