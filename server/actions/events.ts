"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { nanoid } from "nanoid";
import type { EventCategory } from "@/types";

export async function createEvent(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const organizerId = formData.get("organizerId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const category = formData.get("category") as EventCategory;
  const startAt = formData.get("startAt") as string;
  const endAt = formData.get("endAt") as string | null;

  if (!title || !category || !startAt || !organizerId) {
    throw new Error("Faltan campos requeridos");
  }

  // Ensure organizer belongs to user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organizer: true },
  });

  if (!user?.organizer || user.organizer.id !== organizerId) {
    throw new Error("No autorizado");
  }

  // Generate unique slug
  let slug = slugify(title);
  const existing = await prisma.event.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${nanoid(4).toLowerCase()}`;

  const event = await prisma.event.create({
    data: {
      organizerId,
      title,
      slug,
      description: description || null,
      category,
      status: "DRAFT",
      sessions: {
        create: {
          startAt: new Date(startAt),
          endAt: endAt ? new Date(endAt) : null,
          timezone: "America/Guayaquil",
        },
      },
    },
  });

  redirect(`/organizer/events/${event.id}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organizer: true },
  });

  if (!user?.organizer) throw new Error("No autorizado");

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: user.organizer.id },
  });

  if (!event) throw new Error("Evento no encontrado");

  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(title && { title }),
      ...(description !== null && { description }),
    },
  });

  redirect(`/organizer/events/${eventId}`);
}
