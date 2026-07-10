import { z } from "zod";

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const rendaLiquidaSchema = z.object({
  valor: z.coerce.number().int("Valor deve ser um número inteiro").positive("Valor deve ser maior que zero"),
  vigenteDesde: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
});

export type RendaLiquidaFormData = z.infer<typeof rendaLiquidaSchema>;
