"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ECUADOR_CITIES } from "@/lib/constants";
import type { Role } from "@/types";

type State = { error?: string; success?: boolean } | null;

export async function updateUserName(
  _prev: State,
  formData: FormData
): Promise<State> {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado" };

  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string | null)?.trim() ?? "";

  if (!firstName || !lastName) {
    return { error: "Nombre y apellido son requeridos" };
  }

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, { firstName, lastName });
    revalidatePath("/account");
    return { success: true };
  } catch {
    return { error: "No se pudo actualizar el nombre. Intenta de nuevo." };
  }
}

export async function completeOnboarding(
  _prev: State,
  formData: FormData
): Promise<State> {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado" };

  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string | null)?.trim() ?? "";
  const city = (formData.get("city") as string | null)?.trim() ?? "";

  if (!firstName) return { error: "El nombre es requerido" };
  if (!lastName) return { error: "El apellido es requerido" };
  if (!city) return { error: "Selecciona tu ciudad" };
  if (!ECUADOR_CITIES.includes(city as (typeof ECUADOR_CITIES)[number])) {
    return { error: "Ciudad no válida" };
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return { error: "No se encontró tu correo" };

  const role = ((user?.publicMetadata?.role as string | undefined) ?? "BUYER") as Role;

  try {
    // Push name to Clerk (webhook, if configured, will echo to DB without touching city)
    const client = await clerkClient();
    await client.users.updateUser(userId, { firstName, lastName });

    // Upsert DB user (webhook may not be configured yet)
    await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        email,
        firstName,
        lastName,
        city,
        imageUrl: user?.imageUrl ?? null,
        role,
      },
      update: {
        email,
        firstName,
        lastName,
        city,
        imageUrl: user?.imageUrl ?? null,
      },
    });
  } catch {
    return { error: "No se pudo guardar tu perfil. Intenta de nuevo." };
  }

  revalidatePath("/account");
  revalidatePath("/onboarding");
  redirect("/account");
}
