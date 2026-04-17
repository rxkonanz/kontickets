"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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
