import {
  createLancamento,
  getLancamentosByUser,
  parseDataLancamento,
} from "@/lib/lancamentos";
import {
  createRecorrencia,
  type RecorrenciaInput,
} from "@/lib/recorrencias";
import { efetivarLancamento } from "@/lib/lancamentos";
import { getContasByUser } from "@/lib/contas";
import { getCategoriesByUser } from "@/lib/categories";
import { getSaldoForUser } from "@/lib/saldo-service";
import {
  FrequenciaRecorrencia,
  TipoLancamento,
  type StatusLancamento,
} from "@prisma/client";
import type {
  AssistantToolName,
  ToolCallResult,
} from "@/lib/assistant/types";
import {
  calcularSaldoProjetadoArgsSchema,
  criarLancamentoArgsSchema,
  criarRecorrenciaArgsSchema,
  listarLancamentosArgsSchema,
  marcarComoEfetivadoArgsSchema,
} from "@/lib/assistant/tools";

function reaisParaCentavos(valor: number | string): number {
  const numero = typeof valor === "string" ? Number(valor.replace(",", ".")) : Number(valor);
  return Math.round(numero * 100);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function encontrarPorNome<T extends { nome: string }>(
  itens: T[],
  nome: string,
): T | undefined {
  const normalizado = nome.trim().toLowerCase();
  return itens.find((item) => item.nome.trim().toLowerCase() === normalizado);
}

async function resolverConta(
  userId: string,
  contaNome: string | undefined,
): Promise<{ contaId: string; nome: string } | { pergunta: string }> {
  if (!contaNome?.trim()) {
    return { pergunta: "Qual conta você quer usar?" };
  }
  const contas = await getContasByUser(userId);
  const conta = encontrarPorNome(contas, contaNome);
  if (!conta) {
    return {
      pergunta: `Não encontrei a conta "${contaNome}". Qual conta você quer usar?`,
    };
  }
  return { contaId: conta.id, nome: conta.nome };
}

async function resolverCategoria(
  userId: string,
  categoriaNome: string | undefined,
  tipo?: TipoLancamento,
): Promise<{ categoriaId: string; nome: string } | { pergunta: string }> {
  if (!categoriaNome?.trim()) {
    return { pergunta: "Qual categoria você quer usar?" };
  }
  const categorias = await getCategoriesByUser(userId);
  const categoria = encontrarPorNome(categorias, categoriaNome);
  if (!categoria) {
    return {
      pergunta: `Não encontrei a categoria "${categoriaNome}". Qual categoria você quer usar?`,
    };
  }
  if (tipo && categoria.tipo !== tipo) {
    return {
      pergunta: `A categoria "${categoria.nome}" é do tipo ${categoria.tipo}, mas o lançamento é ${tipo}. Escolha uma categoria compatível.`,
    };
  }
  return { categoriaId: categoria.id, nome: categoria.nome };
}

async function executarCriarLancamento(
  userId: string,
  args: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolCallResult> {
  const parsed = criarLancamentoArgsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      type: "error",
      message: `Para criar o lançamento, preciso dos dados corretos: ${parsed.error.errors.map((e) => e.message).join("; ")}.`,
    };
  }

  const { tipo, valorEmReais, data, contaNome, categoriaNome } = parsed.data;

  const conta = await resolverConta(userId, contaNome);
  if ("pergunta" in conta) {
    return { type: "error", message: conta.pergunta };
  }

  const categoria = await resolverCategoria(userId, categoriaNome, tipo);
  if ("pergunta" in categoria) {
    return { type: "error", message: categoria.pergunta };
  }

  const valor = reaisParaCentavos(valorEmReais);
  const dataDate = parseDataLancamento(data);
  const summary = `${tipo === "RECEITA" ? "Receita" : "Despesa"} de ${formatCurrency(valor)} em ${conta.nome} (${categoria.nome}) para ${data}`;

  if (!confirmed) {
    return {
      type: "needs_confirmation",
      summary,
      tool: "criarLancamento",
      args: parsed.data,
    };
  }

  await createLancamento(userId, {
    tipo,
    valor,
    data: dataDate,
    contaId: conta.contaId,
    categoriaId: categoria.categoriaId,
  });

  return { type: "success", content: `Lançamento criado: ${summary}` };
}

async function executarCriarRecorrencia(
  userId: string,
  args: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolCallResult> {
  const parsed = criarRecorrenciaArgsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      type: "error",
      message: `Para criar a recorrência, preciso dos dados corretos: ${parsed.error.errors.map((e) => e.message).join("; ")}.`,
    };
  }

  const {
    tipo,
    valorEmReais,
    dataInicio,
    dataFim,
    frequencia,
    dia,
    contaNome,
    categoriaNome,
  } = parsed.data;

  const conta = await resolverConta(userId, contaNome);
  if ("pergunta" in conta) {
    return { type: "error", message: conta.pergunta };
  }

  const categoria = await resolverCategoria(userId, categoriaNome, tipo);
  if ("pergunta" in categoria) {
    return { type: "error", message: categoria.pergunta };
  }

  const valor = reaisParaCentavos(valorEmReais);
  const input: RecorrenciaInput = {
    tipo,
    valor,
    dataInicio,
    dataFim,
    frequencia: frequencia as FrequenciaRecorrencia,
    dia,
    contaId: conta.contaId,
    categoriaId: categoria.categoriaId,
  };
  const summary = `Recorrência de ${tipo === "RECEITA" ? "receita" : "despesa"} de ${formatCurrency(valor)} em ${conta.nome} (${categoria.nome}), ${frequencia.toLowerCase()}, dia ${dia}, a partir de ${dataInicio}`;

  if (!confirmed) {
    return {
      type: "needs_confirmation",
      summary,
      tool: "criarRecorrencia",
      args: parsed.data,
    };
  }

  await createRecorrencia(userId, input);

  return { type: "success", content: `Recorrência criada: ${summary}` };
}

async function executarListarLancamentos(
  userId: string,
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const parsed = listarLancamentosArgsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      type: "error",
      message: `Não entendi os filtros: ${parsed.error.errors.map((e) => e.message).join("; ")}.`,
    };
  }

  const { contaNome, start, end, status, somenteRecorrentes } = parsed.data;

  let contaId: string | undefined;
  if (contaNome) {
    const conta = await resolverConta(userId, contaNome);
    if ("pergunta" in conta) {
      return { type: "error", message: conta.pergunta };
    }
    contaId = conta.contaId;
  }

  const lancamentos = await getLancamentosByUser(userId, {
    start,
    end,
    contaId,
    status: status as StatusLancamento | undefined,
    excluirTransferencias: true,
  });

  const filtrados = somenteRecorrentes
    ? lancamentos.filter((l) => l.recorrenciaId !== null)
    : lancamentos;

  const content = JSON.stringify(
    filtrados.map((l) => ({
      id: l.id,
      tipo: l.tipo,
      valor: l.valor,
      data: l.data.toISOString().slice(0, 10),
      status: l.status,
      conta: l.conta.nome,
      categoria: l.categoria?.nome,
      recorrente: l.recorrenciaId !== null,
    })),
  );

  return { type: "success", content };
}

async function executarCalcularSaldoProjetado(
  userId: string,
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const parsed = calcularSaldoProjetadoArgsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      type: "error",
      message: `Não entendi os parâmetros: ${parsed.error.errors.map((e) => e.message).join("; ")}.`,
    };
  }

  const { contaNome, ate } = parsed.data;

  let contaId: string | undefined;
  if (contaNome) {
    const conta = await resolverConta(userId, contaNome);
    if ("pergunta" in conta) {
      return { type: "error", message: conta.pergunta };
    }
    contaId = conta.contaId;
  }

  const saldo = await getSaldoForUser(userId, { contaId, ate });

  const content = JSON.stringify({
    saldoAtual: saldo.saldoAtual,
    saldoProjetadoNoFim: saldo.serieProjetada.at(-1)?.saldo ?? saldo.saldoAtual,
    primeiroDiaNegativo: saldo.primeiroDiaNegativo,
  });

  return { type: "success", content };
}

async function executarMarcarComoEfetivado(
  userId: string,
  args: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolCallResult> {
  const parsed = marcarComoEfetivadoArgsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      type: "error",
      message: `Para efetivar, preciso do ID do lançamento: ${parsed.error.errors.map((e) => e.message).join("; ")}.`,
    };
  }

  const { lancamentoId } = parsed.data;
  const summary = `Efetivar o lançamento ${lancamentoId}`;

  if (!confirmed) {
    return {
      type: "needs_confirmation",
      summary,
      tool: "marcarComoEfetivado",
      args: parsed.data,
    };
  }

  await efetivarLancamento(userId, lancamentoId);

  return { type: "success", content: `Lançamento ${lancamentoId} efetivado.` };
}

export async function executeTool(
  userId: string,
  toolName: AssistantToolName,
  args: Record<string, unknown>,
  confirmed = false,
): Promise<ToolCallResult> {
  switch (toolName) {
    case "criarLancamento":
      return executarCriarLancamento(userId, args, confirmed);
    case "criarRecorrencia":
      return executarCriarRecorrencia(userId, args, confirmed);
    case "listarLancamentos":
      return executarListarLancamentos(userId, args);
    case "calcularSaldoProjetado":
      return executarCalcularSaldoProjetado(userId, args);
    case "marcarComoEfetivado":
      return executarMarcarComoEfetivado(userId, args, confirmed);
    default:
      return { type: "error", message: "Tool não reconhecida" };
  }
}
