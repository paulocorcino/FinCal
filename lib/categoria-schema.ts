import { z } from "zod";

export const categoriaTipoValues = ["RECEITA", "DESPESA"] as const;

export const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(categoriaTipoValues, { message: "Tipo deve ser RECEITA ou DESPESA" }),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;
