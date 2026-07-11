export type TipoCategoria = "RECEITA" | "DESPESA";

export const CATEGORIAS_PADRAO = [
  { nome: "Salário", tipo: "RECEITA" },
  { nome: "Freelance", tipo: "RECEITA" },
  { nome: "Investimentos", tipo: "RECEITA" },
  { nome: "Outros", tipo: "RECEITA" },
  { nome: "Moradia", tipo: "DESPESA" },
  { nome: "Alimentação", tipo: "DESPESA" },
  { nome: "Transporte", tipo: "DESPESA" },
  { nome: "Saúde", tipo: "DESPESA" },
  { nome: "Educação", tipo: "DESPESA" },
  { nome: "Lazer", tipo: "DESPESA" },
  { nome: "Assinaturas", tipo: "DESPESA" },
  { nome: "Outros", tipo: "DESPESA" },
] as const satisfies readonly { nome: string; tipo: TipoCategoria }[];
