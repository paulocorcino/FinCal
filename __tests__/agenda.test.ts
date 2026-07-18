import { describe, it, expect } from "vitest";
import {
  parseAgendaFiltros,
  filtrarLancamentos,
  agruparPorDia,
  inicioFimMesISO,
  MAX_CHIPS_POR_DIA,
} from "@/lib/agenda";
import type { LancamentoRow } from "@/lib/lancamento-actions";

type L = { id: string; status: string; data: string; contaId: string };

function row(overrides: Partial<L>): L {
  return { id: "x", status: "PENDENTE", data: "2026-07-13", contaId: "c1", ...overrides };
}

function fullRow(overrides: Partial<LancamentoRow>): LancamentoRow {
  return {
    id: "x",
    userId: "u1",
    contaId: "c1",
    categoriaId: "cat1",
    tipo: "DESPESA",
    valor: 100,
    data: "2026-07-13",
    status: "PENDENTE",
    recorrenciaId: null,
    transferenciaId: null,
    createdAt: new Date("2026-07-13"),
    updatedAt: new Date("2026-07-13"),
    ...overrides,
  };
}

describe("parseAgendaFiltros", () => {
  it("lê status=atrasado, conta, proximos=1", () => {
    const sp = new URLSearchParams("status=atrasado&conta=c1&proximos=1");
    expect(parseAgendaFiltros(sp)).toEqual({
      status: "atrasado",
      contaId: "c1",
      proximos: true,
    });
  });

  it("ignora status desconhecido", () => {
    const sp = new URLSearchParams("status=foo");
    expect(parseAgendaFiltros(sp)).toEqual({});
  });

  it("ignora proximos != '1'", () => {
    const sp = new URLSearchParams("proximos=true");
    expect(parseAgendaFiltros(sp)).toEqual({});
  });
});

describe("filtrarLancamentos", () => {
  const hoje = "2026-07-13";

  it("status=atrasado mantém só PENDENTE-past", () => {
    const lancs: L[] = [
      row({ id: "a", status: "PENDENTE", data: "2026-07-10" }),
      row({ id: "b", status: "PENDENTE", data: "2026-07-20" }),
      row({ id: "c", status: "EFETIVADO", data: "2026-07-01" }),
      row({ id: "d", status: "PENDENTE", data: "2026-07-12" }),
      row({ id: "e", status: "EFETIVADO", data: "2026-07-25" }),
    ];
    const out = filtrarLancamentos(lancs, { status: "atrasado" }, hoje);
    expect(out.map((l) => l.id)).toEqual(["a", "d"]);
  });

  it("contaId filtra por conta", () => {
    const lancs: L[] = [
      row({ id: "a", contaId: "c1" }),
      row({ id: "b", contaId: "c2" }),
      row({ id: "c", contaId: "c1" }),
    ];
    const out = filtrarLancamentos(lancs, { contaId: "c1" }, hoje);
    expect(out.map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("proximos=true mantém hoje ≤ data ≤ hoje+7", () => {
    const lancs: L[] = [
      row({ id: "a", data: "2026-07-12" }),
      row({ id: "b", data: "2026-07-13" }),
      row({ id: "c", data: "2026-07-20" }),
      row({ id: "d", data: "2026-07-21" }),
      row({ id: "e", data: "2026-08-01" }),
    ];
    const out = filtrarLancamentos(lancs, { proximos: true }, hoje);
    expect(out.map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("sem filtros retorna tudo", () => {
    const lancs: L[] = [row({ id: "a" }), row({ id: "b" })];
    const out = filtrarLancamentos(lancs, {}, hoje);
    expect(out).toHaveLength(2);
  });
});

describe("agruparPorDia", () => {
  it("5 lançamentos no mesmo dia → 1 dia com max chips e extra=2", () => {
    const lancs: L[] = Array.from({ length: 5 }, (_, i) =>
      row({ id: `l${i}`, data: "2026-07-13" })
    );
    const dias = agruparPorDia(lancs, "2026-07");
    expect(dias).toHaveLength(1);
    expect(dias[0].data).toBe("2026-07-13");
    expect(dias[0].lancamentos).toHaveLength(MAX_CHIPS_POR_DIA);
    expect(dias[0].extra).toBe(2);
  });

  it("descarta lançamentos fora do mesAno", () => {
    const lancs: L[] = [
      row({ id: "a", data: "2026-07-13" }),
      row({ id: "b", data: "2026-08-13" }),
    ];
    const dias = agruparPorDia(lancs, "2026-07");
    expect(dias).toHaveLength(1);
    expect(dias[0].data).toBe("2026-07-13");
  });

  it("ordena dias asc", () => {
    const lancs: L[] = [
      row({ id: "a", data: "2026-07-20" }),
      row({ id: "b", data: "2026-07-05" }),
    ];
    const dias = agruparPorDia(lancs, "2026-07");
    expect(dias.map((d) => d.data)).toEqual(["2026-07-05", "2026-07-20"]);
  });

  it("aceita LancamentoRow (com categoriaNome via spread)", () => {
    const lancs = [
      fullRow({ id: "a", data: "2026-07-10" }),
      fullRow({ id: "b", data: "2026-07-10" }),
    ];
    const dias = agruparPorDia(lancs, "2026-07");
    expect(dias[0].lancamentos).toHaveLength(2);
  });
});

describe("inicioFimMesISO", () => {
  it("janeiro 31 dias", () => {
    expect(inicioFimMesISO("2026-01")).toEqual({
      inicio: "2026-01-01",
      fim: "2026-01-31",
    });
  });

  it("fevereiro não-bissexto 28 dias", () => {
    expect(inicioFimMesISO("2026-02")).toEqual({
      inicio: "2026-02-01",
      fim: "2026-02-28",
    });
  });

  it("julho 31 dias", () => {
    expect(inicioFimMesISO("2026-07")).toEqual({
      inicio: "2026-07-01",
      fim: "2026-07-31",
    });
  });
});
