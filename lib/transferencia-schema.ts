import { z } from "zod";

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const transferenciaSchema = z.object({
  origemId: z.string().min(1, "Conta de origem é obrigatória"),
  destinoId: z.string().min(1, "Conta de destino é obrigatória"),
  valor: z.coerce.number().int("Valor deve ser um número inteiro").positive("Valor deve ser maior que zero"),
  data: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
});

export type TransferenciaFormData = z.infer<typeof transferenciaSchema>;
