import QRCode from "qrcode";

/**
 * Server-side QR generation to a PNG data URL suitable for embedding
 * in an <img src="..."> inside an HTML email.
 */
export async function qrToDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, {
    width: 220,
    margin: 2,
    color: {
      dark: "#0d0d5c",
      light: "#ffffff",
    },
  });
}
