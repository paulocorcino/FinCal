"use server";

import { auth } from "@/lib/auth";
import type { Alerta } from "@/lib/alertas";
import { getAlertasForUser } from "@/lib/alertas-service";

export async function getAlertasAction(
  diasProximos?: number,
): Promise<Alerta[] | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return getAlertasForUser(session.user.id, diasProximos);
}
