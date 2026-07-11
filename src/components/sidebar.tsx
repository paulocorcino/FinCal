"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth-actions";
import { ChevronDown, LogOut, User, Wallet } from "lucide-react";

type SidebarUser = { name?: string | null; email?: string | null };

function initials(user?: SidebarUser) {
  const src = user?.name?.trim() || user?.email?.trim();
  if (!src) return null;
  const first = src.charAt(0).toUpperCase();
  const rest = src.split(/\s+/)[1]?.charAt(0)?.toUpperCase();
  return rest ? `${first}${rest}` : first;
}

export function SidebarContent({
  onNavigate,
  user,
}: {
  onNavigate?: () => void;
  user?: SidebarUser;
}) {
  const pathname = usePathname();
  const label = user?.email ?? "Conta";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Wallet className="size-5" />
        <span className="font-heading text-base font-medium">FinCal AI</span>
      </div>
      <nav
        className="flex flex-1 flex-col gap-1 p-3"
        aria-label="Navegação principal"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>
                {initials(user) ?? <User className="size-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-left text-sm">{label}</span>
            <ChevronDown className="size-4 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {label}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={logout}>
                <DropdownMenuItem
                  variant="destructive"
                  render={<button type="submit" className="w-full" />}
                >
                  <LogOut className="size-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </form>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user?: SidebarUser }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
      <SidebarContent user={user} />
    </aside>
  );
}
