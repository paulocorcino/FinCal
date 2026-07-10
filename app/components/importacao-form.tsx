"use client";

import { useState } from "react";
import type { Conta, Categoria } from "@prisma/client";
import {
  extrairCandidatosAction,
  confirmarImportacaoAction,
  type ExtrairCandidatosResult,
  type ConfirmarImportacaoResult,
} from "@/app/actions/importacao";
import type { Candidato } from "@/lib/importacao-schema";
import { toSPDateString } from "@/lib/saldo";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function reaisParaCentavos(valor: string): number {
  const parsed = Number.parseFloat(valor.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

function dataParaInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function inputParaData(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function atualizarCandidato(
  candidatos: Candidato[],
  id: string,
  patch: Partial<Candidato>,
): Candidato[] {
  return candidatos.map((c) => (c.id === id ? { ...c, ...patch } : c));
}

interface ImportacaoFormProps {
  contas: Conta[];
  categorias: Categoria[];
}

export function ImportacaoForm({ contas, categorias }: ImportacaoFormProps) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [contaId, setContaId] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");
  const [erro, setErro] = useState<string>("");
  const [carregando, setCarregando] = useState(false);

  async function handleExtrair(formData: FormData) {
    setCarregando(true);
    setErro("");
    setMensagem("");

    const result: ExtrairCandidatosResult = await extrairCandidatosAction(
      formData,
    );

    setCarregando(false);

    if (result.success) {
      setContaId((formData.get("contaId") as string) ?? "");
      setCandidatos(result.candidatos);
      setMensagem(`${result.candidatos.length} candidato(s) encontrado(s).`);
    } else {
      setErro(result.error);
    }
  }

  async function handleConfirmar(formData: FormData) {
    setErro("");
    setMensagem("");

    const confirmForm = new FormData();
    confirmForm.append("contaId", formData.get("contaId") as string);
    confirmForm.append(
      "candidatos",
      JSON.stringify(
        candidatos.map((c) => ({ ...c, data: toSPDateString(c.data) })),
      ),
    );

    const result: ConfirmarImportacaoResult =
      await confirmarImportacaoAction(confirmForm);

    if (result.success) {
      setCandidatos([]);
      setMensagem(`${result.count} lançamento(s) importado(s).`);
    } else {
      setErro(result.error);
    }
  }

  return (
    <div>
      <form action={handleExtrair}>
        <label>
          Conta de destino
          <select name="contaId" required defaultValue="">
            <option value="" disabled>
              Selecione uma conta
            </option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Arquivo (PDF texto, CSV ou OFX)
          <input
            type="file"
            name="arquivo"
            accept=".pdf,.csv,.ofx,.qfx"
            required
          />
        </label>

        <button type="submit" disabled={carregando}>
          {carregando ? "Extraindo..." : "Extrair candidatos"}
        </button>
      </form>

      {erro && <p role="alert">{erro}</p>}
      {mensagem && <p role="status">{mensagem}</p>}

      {candidatos.length > 0 && (
        <form action={handleConfirmar}>
          <input type="hidden" name="contaId" value={contaId} />
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Duplicado</th>
                <th>Selecionar</th>
              </tr>
            </thead>
            <tbody>
              {candidatos.map((candidato) => {
                const categoriasDisponiveis = categorias.filter(
                  (c) => c.tipo === candidato.tipo,
                );

                return (
                  <tr
                    key={candidato.id}
                    style={{
                      backgroundColor: candidato.duplicado
                        ? "#fff3cd"
                        : undefined,
                    }}
                  >
                    <td>
                      <input
                        type="date"
                        value={dataParaInput(candidato.data)}
                        onChange={(e) =>
                          setCandidatos((prev) =>
                            atualizarCandidato(prev, candidato.id, {
                              data: inputParaData(e.target.value),
                            }),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={(candidato.valor / 100).toFixed(2)}
                        onChange={(e) =>
                          setCandidatos((prev) =>
                            atualizarCandidato(prev, candidato.id, {
                              valor: reaisParaCentavos(e.target.value),
                            }),
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={candidato.tipo}
                        onChange={(e) =>
                          setCandidatos((prev) =>
                            atualizarCandidato(prev, candidato.id, {
                              tipo: e.target.value as "RECEITA" | "DESPESA",
                              categoriaId: "",
                            }),
                          )
                        }
                      >
                        <option value="DESPESA">Despesa</option>
                        <option value="RECEITA">Receita</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={candidato.descricao}
                        onChange={(e) =>
                          setCandidatos((prev) =>
                            atualizarCandidato(prev, candidato.id, {
                              descricao: e.target.value,
                            }),
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={candidato.categoriaId}
                        onChange={(e) =>
                          setCandidatos((prev) =>
                            atualizarCandidato(prev, candidato.id, {
                              categoriaId: e.target.value,
                            }),
                          )
                        }
                      >
                        <option value="">Selecione...</option>
                        {categoriasDisponiveis.map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{candidato.duplicado ? "Duplicado" : "—"}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={candidato.selecionado}
                        onChange={(e) =>
                          setCandidatos((prev) =>
                            atualizarCandidato(prev, candidato.id, {
                              selecionado: e.target.checked,
                            }),
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p>Total selecionado: {formatCurrency(candidatos.filter(c => c.selecionado).reduce((sum, c) => sum + c.valor, 0))}</p>

          <button type="submit">Confirmar importação</button>
        </form>
      )}
    </div>
  );
}
