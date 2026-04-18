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
  // Use findMany to avoid Prisma DataLoader transactions (unsupported in HTTP mode)
  const users = await prisma.user.findMany({
    where: { clerkId: userId },
    include: { organizer: true },
    take: 1,
  });
  const user = users[0] ?? null;

  if (!user?.organizer || user.organizer.id !== organizerId) {
    throw new Error("No autorizado");
  }

  // Generate unique slug
  let slug = slugify(title);
  const existingSlugs = await prisma.event.findMany({ where: { slug }, take: 1 });
  if (existingSlugs.length > 0) slug = `${slug}-${nanoid(4).toLowerCase()}`;

  // Create event first, then session separately — nested creates trigger transactions
  const event = await prisma.event.create({
    data: {
      organizerId,
      title,
      slug,
      description: description || null,
      category,
      status: "DRAFT",
    },
  });

  await prisma.eventSession.create({
    data: {
      eventId: event.id,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      timezone: "America/Guayaquil",
    },
  });

  redirect(`/organizer/events/${event.id}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const users2 = await prisma.user.findMany({
    where: { clerkId: userId },
    include: { organizer: true },
    take: 1,
  });
  const user = users2[0] ?? null;

  if (!user?.organizer) throw new Error("No autorizado");

  // Use findMany instead of findFirst — findFirst triggers internal transactions
  const events = await prisma.event.findMany({
    where: { id: eventId, organizerId: user.organizer.id },
    take: 1,
  });
  const event = events[0] ?? null;

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
