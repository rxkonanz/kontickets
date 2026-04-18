"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "@/server/actions/user";
import { ECUADOR_CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";

export function OnboardingForm({
  defaultFirstName = "",
  defaultLastName = "",
  defaultCity = "",
}: {
  defaultFirstName?: string;
  defaultLastName?: string;
  defaultCity?: string;
}) {
  const [state, formAction, isPending] = useActionState(completeOnboarding, null);
  const [city, setCity] = useState(defaultCity);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-sm font-medium">
            Nombre
          </Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultFirstName}
            placeholder="Tu nombre"
            autoComplete="given-name"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Apellido
          </Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultLastName}
            placeholder="Tu apellido"
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city" className="text-sm font-medium">
          Ciudad
        </Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger id="city" className="w-full bg-white">
            <SelectValue placeholder="Selecciona tu ciudad" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className="bg-white border border-gray-200 shadow-xl text-gray-900"
          >
            {ECUADOR_CITIES.map((c) => (
              <SelectItem
                key={c}
                value={c}
                className="cursor-pointer focus:bg-[#3b82f6]/10 focus:text-[#0d0d5c]"
              >
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="city" value={city} />
        <p className="text-xs text-muted-foreground">
          Usaremos tu ciudad para mostrarte eventos cercanos.
        </p>
      </div>

      {state?.error && (
        <p className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full gradient-brand-cta text-white border-0 hover:opacity-90"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </form>
  );
}
