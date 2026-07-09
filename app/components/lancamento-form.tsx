export type LancamentoFormDefaultValues = {
  tipo: string;
  valor: number;
  data: string;
  contaId: string;
  categoriaId: string;
};

export function LancamentoForm({
  id,
  contas,
  categorias,
  defaultValues,
  action,
}: {
  id?: string;
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
  defaultValues?: LancamentoFormDefaultValues;
  action: (formData: FormData) => Promise<void>;
}) {
  const categoriaTipo = defaultValues?.categoriaId
    ? categorias.find((c) => c.id === defaultValues.categoriaId)?.tipo ??
      "DESPESA"
    : "DESPESA";

  return (
    <form action={action}>
      {id && <input type="hidden" name="id" value={id} />}
      <label>
        Tipo
        <select name="tipo" defaultValue={defaultValues?.tipo ?? "DESPESA"}>
          <option value="RECEITA">RECEITA</option>
          <option value="DESPESA">DESPESA</option>
        </select>
      </label>
      <label>
        Valor (centavos)
        <input
          type="number"
          name="valor"
          step="1"
          defaultValue={defaultValues?.valor ?? 0}
          required
        />
      </label>
      <label>
        Data
        <input
          type="date"
          name="data"
          defaultValue={defaultValues?.data}
          required
        />
      </label>
      <label>
        Conta
        <select name="contaId" defaultValue={defaultValues?.contaId} required>
          <option value="">Selecione</option>
          {contas.map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Categoria
        <select
          name="categoriaId"
          defaultValue={defaultValues?.categoriaId}
          required
        >
          <option value="">Selecione</option>
          {categorias
            .filter((c) => c.tipo === categoriaTipo)
            .map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
        </select>
      </label>
      <button type="submit">{id ? "Salvar" : "Criar"}</button>
    </form>
  );
}
