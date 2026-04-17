import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizerNav } from "@/components/layout/OrganizerNav";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  if (role !== "organizer" && role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <OrganizerNav />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
