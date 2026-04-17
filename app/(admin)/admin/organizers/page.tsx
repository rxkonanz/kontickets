import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatRelative } from "@/lib/utils";
import { Users } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  SUSPENDED: "Suspendido",
};

export default async function AdminOrganizersPage() {
  const organizers = await prisma.organizer.findMany({
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      _count: { select: { events: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Organizadores</h1>
        <p className="text-muted-foreground mt-1">{organizers.length} organizadores registrados</p>
      </div>

      {organizers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="Sin organizadores"
          description="Aún no hay organizadores registrados."
        />
      ) : (
        <div className="space-y-3">
          {organizers.map((org) => (
            <Card key={org.id}>
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{org.name}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[org.status]}`}>
                      {STATUS_LABELS[org.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{org.user.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {org._count.events} eventos · Registrado {formatRelative(org.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {org.status === "PENDING" && (
                    <>
                      <form action={`/api/admin/organizers/${org.id}/approve`} method="POST">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Aprobar
                        </Button>
                      </form>
                      <form action={`/api/admin/organizers/${org.id}/suspend`} method="POST">
                        <Button size="sm" variant="destructive">
                          Rechazar
                        </Button>
                      </form>
                    </>
                  )}
                  {org.status === "APPROVED" && (
                    <form action={`/api/admin/organizers/${org.id}/suspend`} method="POST">
                      <Button size="sm" variant="outline">
                        Suspender
                      </Button>
                    </form>
                  )}
                  {org.status === "SUSPENDED" && (
                    <form action={`/api/admin/organizers/${org.id}/approve`} method="POST">
                      <Button size="sm" variant="outline">
                        Reactivar
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
