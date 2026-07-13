"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatarBRL, parseCentavos } from "@/lib/format";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: number;
  onValueChange: (cents: number) => void;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(function CurrencyInput({ value, onValueChange, ...props }, ref) {
  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={formatarBRL(value)}
      onChange={(e) => onValueChange(parseCentavos(e.target.value))}
      {...props}
    />
  );
});
