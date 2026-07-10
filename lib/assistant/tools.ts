import { z } from "zod";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

const dateProperty = {
  type: "string",
  description: "Data no formato YYYY-MM-DD",
} as const;

export const criarLancamentoArgsSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  valorEmReais: z.coerce.number().positive("O valor deve ser maior que zero"),
  data: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
  contaNome: z.string().min(1, "Conta é obrigatória"),
  categoriaNome: z.string().min(1, "Categoria é obrigatória"),
});

export const criarRecorrenciaArgsSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  valorEmReais: z.coerce.number().positive("O valor deve ser maior que zero"),
  dataInicio: z
    .string()
    .regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
  dataFim: z
    .string()
    .regex(dataRegex, "Data deve estar no formato YYYY-MM-DD")
    .optional(),
  frequencia: z.enum(["MENSAL", "SEMANAL"]),
  dia: z.coerce.number().int().min(1).max(31),
  contaNome: z.string().min(1, "Conta é obrigatória"),
  categoriaNome: z.string().min(1, "Categoria é obrigatória"),
});

export const listarLancamentosArgsSchema = z.object({
  contaNome: z.string().optional(),
  start: z.string().regex(dataRegex).optional(),
  end: z.string().regex(dataRegex).optional(),
  status: z.enum(["PENDENTE", "EFETIVADO"]).optional(),
  somenteRecorrentes: z.boolean().optional(),
});

export const calcularSaldoProjetadoArgsSchema = z.object({
  contaNome: z.string().optional(),
  ate: z.string().regex(dataRegex).optional(),
});

export const marcarComoEfetivadoArgsSchema = z.object({
  lancamentoId: z.string().min(1, "ID do lançamento é obrigatório"),
});

export type CriarLancamentoArgs = z.infer<typeof criarLancamentoArgsSchema>;
export type CriarRecorrenciaArgs = z.infer<typeof criarRecorrenciaArgsSchema>;
export type ListarLancamentosArgs = z.infer<typeof listarLancamentosArgsSchema>;
export type CalcularSaldoProjetadoArgs = z.infer<
  typeof calcularSaldoProjetadoArgsSchema
>;
export type MarcarComoEfetivadoArgs = z.infer<
  typeof marcarComoEfetivadoArgsSchema
>;

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "criarLancamento",
      description:
        "Cria um lançamento pontual. Se a conta ou categoria não for informada ou não existir, pergunte ao usuário; nunca invente valores.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["RECEITA", "DESPESA"] },
          valorEmReais: { type: "number", description: "Valor em reais" },
          data: dateProperty,
          contaNome: { type: "string", description: "Nome da conta existente" },
          categoriaNome: {
            type: "string",
            description: "Nome da categoria existente",
          },
        },
        required: [
          "tipo",
          "valorEmReais",
          "data",
          "contaNome",
          "categoriaNome",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criarRecorrencia",
      description:
        "Cria uma recorrência. Se a conta ou categoria não for informada ou não existir, pergunte ao usuário; nunca invente valores.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["RECEITA", "DESPESA"] },
          valorEmReais: { type: "number", description: "Valor em reais" },
          dataInicio: dateProperty,
          dataFim: { ...dateProperty, description: "Data fim opcional" },
          frequencia: { type: "string", enum: ["MENSAL", "SEMANAL"] },
          dia: {
            type: "integer",
            description: "Dia do mês (1-31) ou dia da semana (0-6)",
          },
          contaNome: { type: "string", description: "Nome da conta existente" },
          categoriaNome: {
            type: "string",
            description: "Nome da categoria existente",
          },
        },
        required: [
          "tipo",
          "valorEmReais",
          "dataInicio",
          "frequencia",
          "dia",
          "contaNome",
          "categoriaNome",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listarLancamentos",
      description:
        "Lista lançamentos do usuário. Pergunte o nome da conta quando necessário; nunca invente contas ou categorias.",
      parameters: {
        type: "object",
        properties: {
          contaNome: {
            type: "string",
            description: "Nome exato da conta (opcional)",
          },
          start: dateProperty,
          end: dateProperty,
          status: { type: "string", enum: ["PENDENTE", "EFETIVADO"] },
          somenteRecorrentes: {
            type: "boolean",
            description: "Se true, retorna apenas lançamentos recorrentes",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calcularSaldoProjetado",
      description:
        "Calcula saldo atual e projetado. Pergunte o nome da conta quando necessário; nunca invente contas.",
      parameters: {
        type: "object",
        properties: {
          contaNome: {
            type: "string",
            description: "Nome exato da conta (opcional)",
          },
          ate: dateProperty,
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "marcarComoEfetivado",
      description: "Marca um lançamento pendente como efetivado.",
      parameters: {
        type: "object",
        properties: {
          lancamentoId: { type: "string", description: "ID do lançamento" },
        },
        required: ["lancamentoId"],
      },
    },
  },
];
