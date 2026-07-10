import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getContasByUser } from "@/lib/contas";
import { getCategoriesByUser } from "@/lib/categories";
import { getLancamentosByUserAction } from "@/app/actions/lancamento";
import { createLancamentoAction } from "@/app/actions/lancamento";
import { materializarRecorrenciasAction } from "@/app/actions/recorrencia";
import { LancamentoForm } from "@/app/components/lancamento-form";
import {
  addMonthsSP,
  mesAtualSP,
  primeiroDiaDoMesSP,
  ultimoDiaDoMesSP,
  diasDoMesSP,
} from "@/lib/agenda";
import { toSPDateString } from "@/lib/saldo";
import { isAtrasado } from "@/lib/lancamentos";
import { StatusLancamento } from "@prisma/client";

export const dynamic = "force-dynamic";

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function classForLancamento(lancamento: {
  tipo: string;
  status: StatusLancamento;
  data: Date;
}) {
  const classes = [lancamento.tipo.toLowerCase()];
  if (
    lancamento.status === StatusLancamento.PENDENTE &&
    isAtrasado(lancamento)
  ) {
    classes.push("atrasado");
  } else {
    classes.push(lancamento.status.toLowerCase());
  }
  return classes.join(" ");
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const mes = searchParams.mes ?? mesAtualSP();
  const diaSelecionado = searchParams.dia;

  await materializarRecorrenciasAction({
    start: primeiroDiaDoMesSP(mes),
    end: ultimoDiaDoMesSP(mes),
  });

  const [contas, categorias, lancamentos] = await Promise.all([
    getContasByUser(session.user.id),
    getCategoriesByUser(session.user.id),
    getLancamentosByUserAction({
      start: primeiroDiaDoMesSP(mes),
      end: ultimoDiaDoMesSP(mes),
      excluirTransferencias: true,
    }),
  ]);

  const porDia = new Map<string, typeof lancamentos>();
  for (const l of lancamentos) {
    const dataStr = toSPDateString(l.data);
    const lista = porDia.get(dataStr) ?? [];
    lista.push(l);
    porDia.set(dataStr, lista);
  }

  const dias = diasDoMesSP(mes);
  const mesAnterior = addMonthsSP(mes, -1);
  const mesProximo = addMonthsSP(mes, 1);

  async function handleCreate(formData: FormData) {
    "use server";
    await createLancamentoAction(formData);
    revalidatePath("/dashboard/agenda");
  }

  return (
    <main>
      <h1>Agenda</h1>
      <nav>
        <Link href={`/dashboard/agenda?mes=${mesAnterior}`}>
          ‹ Mês anterior
        </Link>
        <span>{mes}</span>
        <Link href={`/dashboard/agenda?mes=${mesProximo}`}>
          Próximo mês ›
        </Link>
      </nav>

      <div className="calendar-grid">
        {DIAS_DA_SEMANA.map((nome) => (
          <div key={nome} className="calendar-header">
            {nome}
          </div>
        ))}
        {Array.from({ length: dias[0]?.diaDaSemana ?? 0 }).map((_, i) => (
          <div key={`pad-${i}`} className="calendar-day empty" />
        ))}
        {dias.map((dia) => {
          const doDia = porDia.get(dia.data) ?? [];
          return (
            <div key={dia.data} className="calendar-day">
              <Link
                href={`/dashboard/agenda?mes=${mes}&dia=${dia.data}`}
                className="day-number"
              >
                {Number(dia.data.slice(8, 10))}
              </Link>
              <ul>
                {doDia.map((l) => (
                  <li key={l.id} className={classForLancamento(l)}>
                    {l.tipo === "RECEITA" ? "+" : "-"}{" "}
                    {formatCurrency(l.valor)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {diaSelecionado && (
        <section className="day-panel">
          <h2>Lançamentos de {diaSelecionado}</h2>
          <ul>
            {(porDia.get(diaSelecionado) ?? []).map((l) => (
              <li key={l.id} className={classForLancamento(l)}>
                <span>{l.tipo}</span>
                <span>{formatCurrency(l.valor)}</span>
                <span>{l.status}</span>
                {l.status === StatusLancamento.PENDENTE && isAtrasado(l) && (
                  <span className="atrasado">ATRASADO</span>
                )}
                <span>
                  {l.conta.nome} / {l.categoria?.nome ?? "Sem categoria"}
                </span>
              </li>
            ))}
          </ul>

          <h3>Novo lançamento</h3>
          <LancamentoForm
            contas={contas}
            categorias={categorias}
            defaultValues={{
              tipo: "DESPESA",
              valor: 0,
              data: diaSelecionado,
              contaId: "",
              categoriaId: "",
            }}
            action={handleCreate}
          />
        </section>
      )}

      {!diaSelecionado && (
        <p>Selecione um dia para ver os lançamentos e criar um novo.</p>
      )}
    </main>
  );
}
