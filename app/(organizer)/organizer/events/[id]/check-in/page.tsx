"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Scan, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type ScanResult = {
  success: boolean;
  message: string;
  attendee?: { firstName: string; lastName: string };
};

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${code.trim()}`);
      const data = await res.json();
      setResult(data);
      if (data.success) setCode("");
    } catch {
      setResult({ success: false, message: "Error de red. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-1">
          <Link href={`/organizer/events/${eventId}`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Check-in</h1>
          <p className="text-muted-foreground text-sm">Escanea o ingresa el código</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Scan className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Usa un lector de QR o ingresa el código manualmente
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 mb-6">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de entrada..."
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
          autoFocus
          className="font-mono"
        />
        <Button
          onClick={handleScan}
          disabled={loading || !code.trim()}
          className="gradient-brand-cta text-white border-0 hover:opacity-90 shrink-0"
        >
          Verificar
        </Button>
      </div>

      {result && (
        <Card
          className={`border-2 ${
            result.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
          }`}
        >
          <CardContent className="p-6 flex items-start gap-4">
            {result.success ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${result.success ? "text-emerald-800" : "text-red-800"}`}>
                {result.success ? "Entrada válida" : "Entrada inválida"}
              </p>
              {result.attendee && (
                <p className="text-emerald-700 font-medium mt-1">
                  {result.attendee.firstName} {result.attendee.lastName}
                </p>
              )}
              <p className={`text-sm mt-1 ${result.success ? "text-emerald-600" : "text-red-600"}`}>
                {result.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
