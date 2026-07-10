import type OpenAI from "openai";
import { getOpenAIModel } from "@/lib/assistant/openai";
import type { DiagnosticoMetrics } from "@/lib/diagnostico-service";
import { DIAGNOSTICO_CONFIG } from "@/lib/diagnostico-config";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function buildPrompt(metrics: DiagnosticoMetrics): string {
  return `Você é um consultor financeiro educativo do FinCal.

Abaixo estão as métricas EXATAS do usuário para o mês ${metrics.mes}. Você deve NARRAR recomendações com base APENAS nesses números. É PROIBIDO inventar valores, contas, categorias ou projeções que não estejam nos dados fornecidos.

Premissa explícita: ao estimar o efeito de longo prazo da taxa de poupança, usamos o multiplicador ×${DIAGNOSTICO_CONFIG.PREMISSA_JUROS_MESES} (~${Math.round(DIAGNOSTICO_CONFIG.TAXA_REFERENCIA_POUPANCA * 100)}% a.a.; a 4% a.a. o multiplicador seria ~×300).

Métricas (em centavos, exceto percentuais):
${JSON.stringify(metrics, null, 2)}

Instruções:
1. Comece com um breve resumo da saúde financeira do mês.
2. Comente a taxa de poupança e compare com a referência de ${Math.round(DIAGNOSTICO_CONFIG.TAXA_REFERENCIA_POUPANCA * 100)}%.
3. Compare a reserva atual (${formatCurrency(metrics.reservaAtual)}) com a meta (${formatCurrency(metrics.metaReserva)}).
4. Analise a distribuição real (necessidades/desejos/poupança) e os alvos 60/30/10 e referência 50/30/20.
5. Se houver gastos no cartão, comente as top categorias e sugira uma meta de redução.
6. Finalize com um disclaimer educacional claro, informando que as recomendações são de natureza educacional e não substituem aconselhamento financeiro profissional.`;
}

export type NarradorDeps = {
  openai?: OpenAI;
};

function fallbackNarrativa(metrics: DiagnosticoMetrics): string {
  return `Resumo do diagnóstico de ${metrics.mes}: renda líquida ${formatCurrency(
    metrics.rendaLiquida,
  )}, sobra ${formatCurrency(metrics.sobra)} (taxa de poupança ${(
    metrics.taxaPoupanca * 100
  ).toFixed(1)}%).

Reserva atual: ${formatCurrency(
    metrics.reservaAtual,
  )} — meta sugerida: ${formatCurrency(metrics.metaReserva)}.

Premissa: projeção de longo prazo usa ×${
    DIAGNOSTICO_CONFIG.PREMISSA_JUROS_MESES
  } (~${Math.round(
    DIAGNOSTICO_CONFIG.TAXA_REFERENCIA_POUPANCA * 100,
  )}% a.a.; 4% a.a. seria ~×300).

Distribuição real: necessidades ${metrics.distribuicaoReal.necessidades.toFixed(
    1,
  )}%, desejos ${metrics.distribuicaoReal.desejos.toFixed(
    1,
  )}%, poupança ${metrics.distribuicaoReal.poupanca.toFixed(1)}%.

Disclaimer: este conteúdo é educacional e não substitui orientação financeira profissional.`;
}

export async function narrarDiagnostico(
  metrics: DiagnosticoMetrics,
  deps: NarradorDeps = {},
): Promise<string> {
  if (!deps.openai) {
    return fallbackNarrativa(metrics);
  }

  try {
    const response = await deps.openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: "system",
          content:
            "Você é um consultor financeiro educativo que fala português do Brasil. Nunca invente números; use apenas os dados fornecidos. Sempre inclua a premissa do ×120 e um disclaimer educacional.",
        },
        { role: "user", content: buildPrompt(metrics) },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return fallbackNarrativa(metrics);
    }
    return content;
  } catch (e) {
    console.error("narrarDiagnostico failed:", e);
    return fallbackNarrativa(metrics);
  }
}
