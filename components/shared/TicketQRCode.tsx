"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface TicketQRCodeProps {
  code: string;
  size?: number;
}

export function TicketQRCode({ code, size = 200 }: TicketQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, code, {
      width: size,
      margin: 2,
      color: {
        dark: "#0d0d5c",
        light: "#ffffff",
      },
    });
  }, [code, size]);

  return (
    <div className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm border">
      <canvas ref={canvasRef} />
    </div>
  );
}
