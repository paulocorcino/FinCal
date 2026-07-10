import { z } from "zod";

const mesRegex = /^\d{4}-\d{2}$/;

export const diagnosticoQuerySchema = z.object({
  mes: z.string().regex(mesRegex, "Mês deve estar no formato YYYY-MM"),
});

export type DiagnosticoQuery = z.infer<typeof diagnosticoQuerySchema>;
