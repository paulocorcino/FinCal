import { z } from "zod";
import { Papel } from "@prisma/client";

const papelValues = Object.values(Papel) as [Papel, ...Papel[]];

export const contaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  saldoInicial: z.coerce
    .number()
    .int("Saldo inicial deve ser um número inteiro"),
  papel: z.enum(papelValues, { message: "Papel inválido" }),
});

export type ContaFormData = z.infer<typeof contaSchema>;
