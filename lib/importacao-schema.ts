import { z } from "zod";
import { StatusLancamento, TipoLancamento } from "@prisma/client";

const tipoValues = Object.values(TipoLancamento) as [
  TipoLancamento,
  ...TipoLancamento[],
];
const statusValues = Object.values(StatusLancamento) as [
  StatusLancamento,
  ...StatusLancamento[],
];

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const uploadImportacaoSchema = z.object({
  contaId: z.string().min(1, "Conta é obrigatória"),
});

export const candidatoRawSchema = z.object({
  data: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
  valorEmReais: z.number(),
  descricao: z.string(),
  tipo: z.enum(tipoValues),
  categoriaSugerida: z.string(),
});

export const candidatosRawSchema = z.object({
  candidatos: z.array(candidatoRawSchema),
});

export const candidatoSchema = z.object({
  id: z.string(),
  data: z.date(),
  valor: z.number().int(),
  descricao: z.string(),
  tipo: z.enum(tipoValues),
  categoriaSugerida: z.string(),
  categoriaId: z.string(),
  duplicado: z.boolean(),
  selecionado: z.boolean(),
});

export const candidatoConfirmSchema = z.object({
  id: z.string(),
  data: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
  valor: z.number().int(),
  descricao: z.string(),
  tipo: z.enum(tipoValues),
  categoriaSugerida: z.string(),
  categoriaId: z.string().min(1, "Categoria é obrigatória"),
  selecionado: z.boolean(),
});

export const confirmacaoSchema = z.object({
  contaId: z.string().min(1, "Conta é obrigatória"),
  candidatos: z.array(candidatoConfirmSchema),
  status: z.enum(statusValues).default(StatusLancamento.EFETIVADO),
});

export type Candidato = z.infer<typeof candidatoSchema>;
export type CandidatoRaw = z.infer<typeof candidatoRawSchema>;
export type CandidatoConfirm = z.infer<typeof candidatoConfirmSchema>;

export const candidatosJsonSchema = {
  name: "candidatos",
  strict: true,
  schema: {
    type: "object",
    properties: {
      candidatos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            data: {
              type: "string",
              description: "Data do lançamento no formato YYYY-MM-DD",
            },
            valorEmReais: { type: "number" },
            descricao: { type: "string" },
            tipo: { type: "string", enum: ["RECEITA", "DESPESA"] },
            categoriaSugerida: { type: "string" },
          },
          required: [
            "data",
            "valorEmReais",
            "descricao",
            "tipo",
            "categoriaSugerida",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["candidatos"],
    additionalProperties: false,
  },
};
