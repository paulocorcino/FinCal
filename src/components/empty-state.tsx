import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: ReactNode;
  description: string;
  action: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action.href ? (
        <Button size="lg" render={<Link href={action.href} />}>
          {action.label}
        </Button>
      ) : (
        <Button size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
