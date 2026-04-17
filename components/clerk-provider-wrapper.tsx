"use client";

import { ClerkProvider } from "@clerk/nextjs";

const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isValid = key.startsWith("pk_") && !key.includes("placeholder");

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isValid) {
    // No real Clerk key — render without auth for UI preview
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}
