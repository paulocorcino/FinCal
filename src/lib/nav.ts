export const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Agenda", href: "/agenda" },
  { label: "Contas", href: "/contas" },
  { label: "Categorias", href: "/categorias" },
  { label: "Importação Assistida", href: "/importacao" },
  { label: "Diagnóstico", href: "/diagnostico" },
] as const;

export type NavItem = (typeof navItems)[number];
