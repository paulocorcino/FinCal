import { z } from "zod";
import { FrequenciaRecorrencia, TipoLancamento } from "@prisma/client";

const tipoValues = Object.values(TipoLancamento) as [
  TipoLancamento,
  ...TipoLancamento[],
];
const frequenciaValues = Object.values(FrequenciaRecorrencia) as [
  FrequenciaRecorrencia,
  ...FrequenciaRecorrencia[],
];

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const recorrenciaSchema = z.object({
  tipo: z.enum(tipoValues, {
    message: "Tipo deve ser RECEITA ou DESPESA",
  }),
  valor: z.coerce.number().int("Valor deve ser um número inteiro"),
  dataInicio: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
  dataFim: z
    .string()
    .regex(dataRegex, "Data deve estar no formato YYYY-MM-DD")
    .optional(),
  frequencia: z.enum(frequenciaValues, {
    message: "Frequência deve ser MENSAL ou SEMANAL",
  }),
  dia: z.coerce.number().int().min(0).max(31, "Dia deve estar entre 0 e 31"),
  contaId: z.string().min(1, "Conta é obrigatória"),
  categoriaId: z.string().min(1, "Categoria é obrigatória"),
});

export const editScopeSchema = z.enum(["SOMENTE_ESTA", "ESTA_E_FUTURAS"]);

export const ocorrenciaEditSchema = z.object({
  tipo: z.enum(tipoValues).optional(),
  valor: z.coerce.number().int().optional(),
  data: z.string().regex(dataRegex).optional(),
  contaId: z.string().optional(),
  categoriaId: z.string().optional(),
  escopo: editScopeSchema,
});

export type RecorrenciaFormData = z.infer<typeof recorrenciaSchema>;
export type OcorrenciaEditData = z.infer<typeof ocorrenciaEditSchema>;
