import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { formatarBRL } from "@/lib/format";
import { formatarDataDDMMYYYY } from "@/lib/data";
import type { SerieSaldos } from "@/lib/saldo-actions";

export function SaldoResumo({ serie }: { serie: SerieSaldos }) {
  const projetadoFinal =
    serie.projetado.length > 0
      ? serie.projetado[serie.projetado.length - 1].saldo
      : serie.atual;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Saldo Atual</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-medium">
          {formatarBRL(serie.atual)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            Saldo Projetado em {formatarDataDDMMYYYY(serie.horizonte)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-medium">
          {formatarBRL(projetadoFinal)}
        </CardContent>
      </Card>
      {serie.primeiroDiaNegativo && (
        <p
          role="alert"
          className="text-destructive text-sm sm:col-span-2"
        >
          Saldo negativo a partir de{" "}
          {formatarDataDDMMYYYY(serie.primeiroDiaNegativo)}
        </p>
      )}
    </div>
  );
}
