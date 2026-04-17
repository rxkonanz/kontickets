import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { createEvent } from "@/server/actions/events";
import { prisma } from "@/lib/prisma";

export default async function NewEventPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organizer: true },
  });

  if (!user?.organizer) redirect("/organizer/dashboard");

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Crear nuevo evento</h1>
        <p className="text-muted-foreground mt-1">
          Completa la información de tu evento para publicarlo.
        </p>
      </div>

      <form action={createEvent}>
        <input type="hidden" name="organizerId" value={user.organizer.id} />

        <div className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Nombre del evento *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ej: Concierto de Rock Quito 2026"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe tu evento..."
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select name="category" required>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fecha y hora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startAt">Fecha de inicio *</Label>
                  <Input
                    id="startAt"
                    name="startAt"
                    type="datetime-local"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="endAt">Fecha de fin</Label>
                  <Input
                    id="endAt"
                    name="endAt"
                    type="datetime-local"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" formAction="">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-brand-cta text-white border-0 hover:opacity-90"
            >
              Crear evento
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
