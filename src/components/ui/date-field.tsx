"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  formatarDataDDMMYYYY,
  normalizarDataFromFormDDMMYYYY,
} from "@/lib/data";

export interface DateFieldProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  name: string;
  value?: string;
  onChange?: (iso: string | null) => void;
}

function maskDDMMYYYY(digits: string): string {
  const d = digits.replace(/\D+/g, "").slice(0, 8);
  const dia = d.slice(0, 2);
  const mes = d.slice(2, 4);
  const ano = d.slice(4, 8);
  let out = dia;
  if (dia.length === 2) out += "/";
  out += mes;
  if (mes.length === 2) out += "/";
  out += ano;
  return out;
}

function displayToIso(display: string): string | null {
  const digits = display.replace(/\D+/g, "");
  if (digits.length !== 8) return null;
  return normalizarDataFromFormDDMMYYYY(digits);
}

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  function DateField({ name, value, onChange, ...props }, ref) {
    const [display, setDisplay] = useState(value ? formatarDataDDMMYYYY(value) : "");

    React.useEffect(() => {
      setDisplay(value ? formatarDataDDMMYYYY(value) : "");
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const masked = maskDDMMYYYY(e.target.value);
      setDisplay(masked);
      onChange?.(displayToIso(masked));
    }

    const iso = displayToIso(display);

    return (
      <>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder="dd/mm/aaaa"
          {...props}
        />
        <input type="hidden" name={name} value={iso ?? ""} />
      </>
    );
  }
);
