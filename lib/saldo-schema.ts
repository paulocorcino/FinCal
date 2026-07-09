import { z } from "zod";

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const saldoQuerySchema = z.object({
  contaId: z.string().optional(),
  ate: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD").optional(),
});

export type SaldoQuery = z.infer<typeof saldoQuerySchema>;
