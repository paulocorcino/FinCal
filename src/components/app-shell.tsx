"use client";

import { useState } from "react";
import { Sidebar, SidebarContent, type SidebarUser } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface AppShellProps {
  children: React.ReactNode;
  user?: SidebarUser;
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
}

export function AppShell({
  children,
  user,
  contas,
  categorias,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          contas={contas}
          categorias={categorias}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <SidebarContent
            user={user}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
