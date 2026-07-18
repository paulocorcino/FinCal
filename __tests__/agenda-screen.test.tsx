import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LancamentoRow } from "@/lib/lancamento-actions";
import { AgendaScreen } from "@/components/agenda/agenda-screen";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  criarLancamento: vi.fn(),
  editarLancamento: vi.fn(),
  excluirLancamento: vi.fn(),
  efetivarLancamento: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/lancamento-actions", () => ({
  criarLancamento: (...args: unknown[]) => mocks.criarLancamento(...args),
  editarLancamento: (...args: unknown[]) => mocks.editarLancamento(...args),
  excluirLancamento: (...args: unknown[]) => mocks.excluirLancamento(...args),
  efetivarLancamento: (...args: unknown[]) => mocks.efetivarLancamento(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const contas = [{ id: "c1", nome: "Nubank" }];
const categorias = [{ id: "cat1", nome: "Moradia", tipo: "DESPESA" }];

function lancamento(overrides: Partial<LancamentoRow> = {}): LancamentoRow {
  return {
    id: "l1",
    userId: "u1",
    contaId: "c1",
    categoriaId: "cat1",
    tipo: "DESPESA",
    valor: 10000,
    data: "2026-07-13",
    status: "PENDENTE",
    recorrenciaId: null,
    transferenciaId: null,
    createdAt: new Date("2026-07-13"),
    updatedAt: new Date("2026-07-13"),
    ...overrides,
  };
}

function namedField(name: string): HTMLElement | null {
  return document.querySelector(`[name="${name}"]`);
}

describe("AgendaScreen", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    mocks.criarLancamento.mockReset();
    mocks.editarLancamento.mockReset();
    mocks.excluirLancamento.mockReset();
    mocks.efetivarLancamento.mockReset();
  });

  it("renderiza grade com 7 cabeçalhos de coluna", () => {
    render(
      <AgendaScreen
        lancamentosMes={[lancamento({ id: "l1" })]}
        contas={contas}
        categorias={categorias}
        filtros={{}}
        mesAnoInicial="2026-07"
        hoje="2026-07-13"
      />
    );
    const grid = screen.getByRole("grid", { name: /grade mensal/i });
    const headers = within(grid).getAllByRole("columnheader");
    expect(headers).toHaveLength(7);
    expect(headers[0]).toHaveTextContent(/Dom/i);
    expect(headers[6]).toHaveTextContent(/Sáb/i);
  });

  it("exibe no máximo 3 chips por dia e '+N mais'", () => {
    const lancs = Array.from({ length: 5 }, (_, i) =>
      lancamento({ id: `l${i}`, data: "2026-07-13" })
    );
    render(
      <AgendaScreen
        lancamentosMes={lancs}
        contas={contas}
        categorias={categorias}
        filtros={{}}
        mesAnoInicial="2026-07"
        hoje="2026-07-13"
      />
    );
    const grid = screen.getByRole("grid", { name: /grade mensal/i });
    const cell = within(grid).getByRole("gridcell", { name: /13\/07\/2026/ });
    const chips = within(cell).getAllByRole("button");
    expect(chips).toHaveLength(3);
    expect(cell).toHaveTextContent("+2 mais");
  });

  it("clique no dia abre detalhe com título e botão 'Novo Lançamento' preenche data", async () => {
    const user = userEvent.setup();
    const lancs = [lancamento({ id: "l1", data: "2026-07-13" })];
    render(
      <AgendaScreen
        lancamentosMes={lancs}
        contas={contas}
        categorias={categorias}
        filtros={{}}
        mesAnoInicial="2026-07"
        hoje="2026-07-13"
      />
    );

    const grid = screen.getByRole("grid", { name: /grade mensal/i });
    await user.click(within(grid).getByRole("gridcell", { name: /13\/07\/2026/ }));
    const detailTitle = screen.getByRole("heading", { name: "13/07/2026" });
    expect(detailTitle).toBeInTheDocument();

    const detailDialog = detailTitle.closest(
      '[data-slot="dialog-content"]'
    ) as HTMLElement;
    const novoBtn = within(detailDialog).getByRole("button", {
      name: /novo lançamento/i,
    });
    expect(novoBtn).toBeInTheDocument();

    await user.click(novoBtn);
    expect(
      screen.getByRole("heading", { name: "Novo Lançamento" })
    ).toBeInTheDocument();

    const dataInput = namedField("data") as HTMLInputElement | null;
    expect(dataInput).not.toBeNull();
    expect(dataInput?.value).toBe("2026-07-13");
  });

  it("clique no chip abre formulário em edição", async () => {
    const user = userEvent.setup();
    const lancs = [lancamento({ id: "l1", data: "2026-07-13" })];
    render(
      <AgendaScreen
        lancamentosMes={lancs}
        contas={contas}
        categorias={categorias}
        filtros={{}}
        mesAnoInicial="2026-07"
        hoje="2026-07-13"
      />
    );

    const grid = screen.getByRole("grid", { name: /grade mensal/i });
    const cell = within(grid).getByRole("gridcell", { name: /13\/07\/2026/ });
    await user.click(within(cell).getByRole("button"));
    expect(
      screen.getByRole("heading", { name: "Editar Lançamento" })
    ).toBeInTheDocument();
  });

  it("filtro status=atrasado exibe apenas lançamentos atrasados", () => {
    const lancs: LancamentoRow[] = [
      lancamento({ id: "a", status: "PENDENTE", data: "2026-07-10" }),
      lancamento({ id: "b", status: "PENDENTE", data: "2026-07-12" }),
      lancamento({ id: "c", status: "PENDENTE", data: "2026-07-20" }),
      lancamento({ id: "d", status: "EFETIVADO", data: "2026-07-01" }),
      lancamento({ id: "e", status: "PENDENTE", data: "2026-07-13" }),
    ];
    render(
      <AgendaScreen
        lancamentosMes={lancs}
        contas={contas}
        categorias={categorias}
        filtros={{ status: "atrasado" }}
        mesAnoInicial="2026-07"
        hoje="2026-07-13"
      />
    );
    const grid = screen.getByRole("grid", { name: /grade mensal/i });
    const chips = within(grid)
      .queryAllByRole("button")
      .filter((b) => b.hasAttribute("data-tipo"));
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveAttribute("data-atrasado", "true");
    expect(chips[1]).toHaveAttribute("data-atrasado", "true");
  });

  it("mantém grade e lista no DOM para alternância mobile/desktop", () => {
    render(
      <AgendaScreen
        lancamentosMes={[lancamento({ id: "l1" })]}
        contas={contas}
        categorias={categorias}
        filtros={{}}
        mesAnoInicial="2026-07"
        hoje="2026-07-13"
      />
    );
    expect(screen.getByRole("grid", { name: /grade mensal/i })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /lista diária/i })).toBeInTheDocument();
  });
});
