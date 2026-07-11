"use client";

import { useState } from "react";
import { Sidebar, SidebarContent, type SidebarUser } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: SidebarUser;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
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
