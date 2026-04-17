import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkEnabled = clerkKey.startsWith("pk_") && !clerkKey.includes("placeholder");

// Middleware only activates Clerk when real keys are present
export default async function middleware(req: NextRequest) {
  if (!clerkEnabled) {
    // No real Clerk keys — let everything through for UI preview
    return NextResponse.next();
  }

  // Dynamic import to avoid crashing when Clerk is not configured
  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");

  const isPublicRoute = createRouteMatcher([
    "/",
    "/events(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/api/events(.*)",
  ]);

  const isOrganizerRoute = createRouteMatcher(["/organizer(.*)"]);
  const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

  return clerkMiddleware(async (auth, request) => {
    if (isPublicRoute(request)) return NextResponse.next();

    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

    if (isAdminRoute(request) && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isOrganizerRoute(request) && role !== "organizer" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  })(req, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
