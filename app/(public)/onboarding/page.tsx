export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const clerkFirst = user.firstName?.trim() ?? "";
  const clerkLast = user.lastName?.trim() ?? "";

  // Lookup DB user via findMany (HTTP-mode safe — no findUnique)
  const dbUsers = await prisma.user.findMany({
    where: { clerkId: userId },
    select: { firstName: true, lastName: true, city: true },
    take: 1,
  });
  const dbUser = dbUsers[0] ?? null;

  const firstName = dbUser?.firstName?.trim() || clerkFirst;
  const lastName = dbUser?.lastName?.trim() || clerkLast;
  const city = dbUser?.city?.trim() ?? "";

  // If all three are already set, skip onboarding
  if (firstName && lastName && city) {
    redirect("/account");
  }

  const hasNameFromGoogle = !!(clerkFirst && clerkLast);

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#0d0d5c]">
          {hasNameFromGoogle ? `¡Bienvenido, ${clerkFirst}!` : "¡Casi listo!"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {hasNameFromGoogle
            ? "Solo necesitamos un detalle más antes de continuar."
            : "Completa tu perfil para continuar."}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <OnboardingForm
            defaultFirstName={firstName}
            defaultLastName={lastName}
            defaultCity={city}
          />
        </CardContent>
      </Card>
    </div>
  );
}
