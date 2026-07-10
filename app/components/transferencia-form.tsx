export type TransferenciaFormDefaultValues = {
  origemId: string;
  destinoId: string;
  valor: number;
  data: string;
};

export function TransferenciaForm({
  contas,
  defaultValues,
  action,
}: {
  contas: { id: string; nome: string }[];
  defaultValues?: TransferenciaFormDefaultValues;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <label>
        Origem
        <select
          name="origemId"
          defaultValue={defaultValues?.origemId}
          required
        >
          <option value="">Selecione</option>
          {contas.map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Destino
        <select
          name="destinoId"
          defaultValue={defaultValues?.destinoId}
          required
        >
          <option value="">Selecione</option>
          {contas.map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Valor (centavos)
        <input
          type="number"
          name="valor"
          step="1"
          min="1"
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
      <button type="submit">Transferir</button>
    </form>
  );
}
