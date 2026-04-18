"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutRow() {
  return (
    <div className="flex justify-center">
      <SignOutButton redirectUrl="/">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Cerrar sesión
        </Button>
      </SignOutButton>
    </div>
  );
}
