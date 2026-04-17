"use client";

import { useActionState } from "react";
import { updateUserName } from "@/server/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function UpdateNameForm({
  defaultFirstName = "",
  defaultLastName = "",
}: {
  defaultFirstName?: string;
  defaultLastName?: string;
}) {
  const [state, formAction, isPending] = useActionState(updateUserName, null);

  if (state?.success) {
    return (
      <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        ¡Nombre actualizado correctamente!
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs font-medium">
            Nombre
          </Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultFirstName}
            placeholder="Tu nombre"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs font-medium">
            Apellido
          </Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultLastName}
            placeholder="Tu apellido"
            required
          />
        </div>
      </div>

      {state?.error && (
        <p className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        className="gradient-brand-cta text-white border-0 hover:opacity-90"
      >
        {isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar nombre"
        )}
      </Button>
    </form>
  );
}
