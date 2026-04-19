import { Resend } from "resend";

const key = process.env.RESEND_API_KEY ?? "";

export const resendEnabled =
  key.startsWith("re_") && !key.includes("placeholder");

export const resend = resendEnabled ? new Resend(key) : null;

// Using Resend's default sandbox sender until a custom domain is verified.
// Replace with "Kontickets <noreply@kontickets.com>" once DNS is set up.
export const FROM_ADDRESS = "Kontickets <onboarding@resend.dev>";
