export type RecorrenciaFormDefaultValues = {
  tipo: string;
  valor: number;
  dataInicio: string;
  dataFim?: string;
  frequencia: string;
  dia: number;
  contaId: string;
  categoriaId: string;
};

export function RecorrenciaForm({
  id,
  contas,
  categorias,
  defaultValues,
  action,
}: {
  id?: string;
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
  defaultValues?: RecorrenciaFormDefaultValues;
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
        Frequência
        <select
          name="frequencia"
          defaultValue={defaultValues?.frequencia ?? "MENSAL"}
        >
          <option value="MENSAL">MENSAL</option>
          <option value="SEMANAL">SEMANAL</option>
        </select>
      </label>
      <label>
        Dia (do mês ou da semana: 0=Dom, 6=Sáb)
        <input
          type="number"
          name="dia"
          step="1"
          min={0}
          max={31}
          defaultValue={defaultValues?.dia ?? 1}
          required
        />
      </label>
      <label>
        Início
        <input
          type="date"
          name="dataInicio"
          defaultValue={defaultValues?.dataInicio}
          required
        />
      </label>
      <label>
        Fim (opcional)
        <input type="date" name="dataFim" defaultValue={defaultValues?.dataFim} />
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
