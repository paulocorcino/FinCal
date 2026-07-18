import { hojeAmericaSaoPaulo } from "@/lib/data";
import { parseAgendaFiltros } from "@/lib/agenda";
import { listarContas } from "@/lib/conta-actions";
import { listarCategorias } from "@/lib/categoria-actions";
import { listarLancamentosDaAgenda } from "@/lib/lancamento-actions";
import { AgendaScreen } from "@/components/agenda/agenda-screen";

interface AgendaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const sp = await searchParams;
  const urlsp = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") {
      urlsp.set(key, value);
    }
  }

  const filtros = parseAgendaFiltros(urlsp);

  let mesAno = urlsp.get("mes") ?? hojeAmericaSaoPaulo().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(mesAno)) {
    mesAno = hojeAmericaSaoPaulo().slice(0, 7);
  }

  const [lancamentosMes, contas, categorias] = await Promise.all([
    listarLancamentosDaAgenda({ mesAno, contaId: filtros.contaId }),
    listarContas(),
    listarCategorias(),
  ]);

  return (
    <AgendaScreen
      lancamentosMes={lancamentosMes}
      contas={contas}
      categorias={categorias}
      filtros={filtros}
      mesAnoInicial={mesAno}
      hoje={hojeAmericaSaoPaulo()}
    />
  );
}
