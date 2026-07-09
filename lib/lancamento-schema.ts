import { z } from "zod";
import { StatusLancamento, TipoLancamento } from "@prisma/client";

const tipoValues = Object.values(TipoLancamento) as [TipoLancamento, ...TipoLancamento[]];
const statusValues = Object.values(StatusLancamento) as [StatusLancamento, ...StatusLancamento[]];

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const lancamentoSchema = z.object({
  tipo: z.enum(tipoValues, { message: "Tipo deve ser RECEITA ou DESPESA" }),
  valor: z.coerce.number().int("Valor deve ser um número inteiro"),
  data: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
  contaId: z.string().min(1, "Conta é obrigatória"),
  categoriaId: z.string().min(1, "Categoria é obrigatória"),
});

export const efetivarLancamentoSchema = z.object({
  valor: z.coerce.number().int("Valor deve ser um número inteiro").optional(),
});

export const lancamentoFiltersSchema = z.object({
  start: z.string().regex(dataRegex).optional(),
  end: z.string().regex(dataRegex).optional(),
  contaId: z.string().optional(),
  status: z.enum(statusValues).optional(),
});

export type LancamentoFormData = z.infer<typeof lancamentoSchema>;
export type EfetivarLancamentoFormData = z.infer<typeof efetivarLancamentoSchema>;
export type LancamentoFilters = z.infer<typeof lancamentoFiltersSchema>;
