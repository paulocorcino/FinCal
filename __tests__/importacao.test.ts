import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import {
  extractTextFromBuffer,
  parseCandidatosFromAIResponse,
  detectarDuplicados,
  extrairCandidatos,
  resolverCategoria,
  normalizarTexto,
} from "../lib/importacao";
import { parseDataLancamento } from "../lib/lancamentos";
import type { Categoria, Lancamento } from "@prisma/client";

vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "Hello PDF" }),
}));

function categoriaFactory(
  overrides: Partial<Categoria> = {},
): Categoria {
  return {
    id: "cat-1",
    nome: "Alimentação",
    tipo: "DESPESA",
    userId: "user-1",
    ...overrides,
  };
}

function lancamentoFactory(
  overrides: Partial<Lancamento> = {},
): Lancamento {
  return {
    id: "lanc-1",
    tipo: "DESPESA",
    valor: 12345,
    data: parseDataLancamento("2026-07-08"),
    status: "EFETIVADO",
    userId: "user-1",
    contaId: "conta-1",
    categoriaId: "cat-1",
    recorrenciaId: null,
    transferenciaId: null,
    modificado: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("importacao", () => {
  it("extracts text from a PDF buffer", async () => {
    const buffer = Buffer.from("fake-pdf");
    const texto = await extractTextFromBuffer(buffer, "application/pdf", "demo.pdf");
    expect(texto).toBe("Hello PDF");
  });

  it("extracts text from a CSV string", async () => {
    const csv = "data,valor,descricao\n2026-07-08,123.45,Supermarket";
    const buffer = Buffer.from(csv);
    const texto = await extractTextFromBuffer(buffer, "text/csv", "demo.csv");
    expect(texto).toContain("data | valor | descricao");
    expect(texto).toContain("2026-07-08 | 123.45 | Supermarket");
  });

  it("extracts text from an OFX string", async () => {
    const ofx = `
      <STMTTRN>
        <DTPOSTED>20260708120000
        <TRNAMT>-123.45
        <NAME>Supermarket</NAME>
        <MEMO>groceries</MEMO>
      </STMTTRN>
    `;
    const buffer = Buffer.from(ofx);
    const texto = await extractTextFromBuffer(buffer, "application/x-ofx", "demo.ofx");
    expect(texto).toContain("2026-07-08");
    expect(texto).toContain("-123.45");
    expect(texto).toContain("Supermarket");
  });

  it("parses a fixed AI response into typed candidates with valor in cents", () => {
    const categorias = [categoriaFactory()];
    const raw = {
      candidatos: [
        {
          data: "2026-07-08",
          valorEmReais: 123.45,
          descricao: "Supermarket",
          tipo: "DESPESA",
          categoriaSugerida: "Alimentação",
        },
      ],
    };

    const candidatos = parseCandidatosFromAIResponse(raw, categorias);

    expect(candidatos).toHaveLength(1);
    expect(candidatos[0].valor).toBe(12345);
    expect(candidatos[0].descricao).toBe("Supermarket");
    expect(candidatos[0].tipo).toBe("DESPESA");
    expect(candidatos[0].categoriaSugerida).toBe("Alimentação");
    expect(candidatos[0].categoriaId).toBe("cat-1");
    expect(candidatos[0].selecionado).toBe(true);
    expect(candidatos[0].duplicado).toBe(false);
  });

  it("resolves categories by normalized, case-insensitive name", () => {
    const categorias = [categoriaFactory({ nome: "Alimentação" })];
    expect(resolverCategoria("alimentacao", "DESPESA", categorias)).toBe(
      "cat-1",
    );
    expect(resolverCategoria("Não existe", "DESPESA", categorias)).toBe("");
  });

  it("normalizes text removing accents and lowercasing", () => {
    expect(normalizarTexto(" Alimentação ")).toBe("alimentacao");
  });

  it("detects duplicates only by same conta + SP date + valor", () => {
    const contaId = "conta-1";
    const lancamentos = [lancamentoFactory()];

    const candidatos = [
      {
        ...parseCandidatosFromAIResponse(
          {
            candidatos: [
              {
                data: "2026-07-08",
                valorEmReais: 123.45,
                descricao: "Supermarket",
                tipo: "DESPESA",
                categoriaSugerida: "Alimentação",
              },
            ],
          },
          [categoriaFactory()],
        )[0],
        id: "c1",
      },
      {
        ...parseCandidatosFromAIResponse(
          {
            candidatos: [
              {
                data: "2026-07-09",
                valorEmReais: 123.45,
                descricao: "Other",
                tipo: "DESPESA",
                categoriaSugerida: "Alimentação",
              },
            ],
          },
          [categoriaFactory()],
        )[0],
        id: "c2",
      },
    ];

    const resultado = detectarDuplicados(candidatos, lancamentos, contaId);

    expect(resultado.find((c) => c.id === "c1")?.duplicado).toBe(true);
    expect(resultado.find((c) => c.id === "c2")?.duplicado).toBe(false);
  });

  it("extracts candidates from text using a mocked OpenAI client", async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              candidatos: [
                {
                  data: "2026-07-08",
                  valorEmReais: 50,
                  descricao: "Cafe",
                  tipo: "DESPESA",
                  categoriaSugerida: "Alimentação",
                },
              ],
            }),
          },
        },
      ],
    });

    const openai = {
      chat: {
        completions: {
          create,
        },
      },
    } as unknown as OpenAI;

    const categorias = [categoriaFactory()];
    const candidatos = await extrairCandidatos(
      "extrato de cafe R$ 50",
      categorias,
      openai,
    );

    expect(candidatos).toHaveLength(1);
    expect(candidatos[0].valor).toBe(5000);
    expect(candidatos[0].descricao).toBe("Cafe");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: expect.objectContaining({ type: "json_schema" }),
      }),
    );
  });
});
