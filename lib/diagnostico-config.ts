export const DIAGNOSTICO_CONFIG = {
  PREMISSA_JUROS_MESES: 120,
  TAXA_REFERENCIA_POUPANCA: 0.1,
  RESERVA_MESES: 6,
  CARTAO_META_REDUCAO: 0.3,
  DISTRIBUICAO_NECESSIDADES_WANTS_RATIO: 1.66,
  DISTRIBUICAO_ALVO: {
    necessidades: 60,
    desejos: 30,
    poupanca: 10,
  },
  DISTRIBUICAO_REFERENCIA: {
    necessidades: 50,
    desejos: 30,
    poupanca: 20,
  },
} as const;
