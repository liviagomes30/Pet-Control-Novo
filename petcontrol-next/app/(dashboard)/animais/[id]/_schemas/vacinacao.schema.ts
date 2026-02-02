import { z } from "zod";

/**
 * Tipos de protocolo vacinal disponíveis
 */
export const TIPOS_PROTOCOLO_VACINAL = {
  dose_unica: {
    label: "Dose Única",
    descricao: "Aplicada apenas uma vez, sem reforço programado",
    exemplo: "Campanhas específicas, situações pontuais",
  },
  protocolo_inicial: {
    label: "Protocolo Inicial (múltiplas doses)",
    descricao: "Exige mais de uma dose para imunização adequada",
    exemplo: "V8, V10 (3 doses), V4 felina",
  },
  reforco_anual: {
    label: "Reforço Anual",
    descricao: "Reaplicação a cada 12 meses após protocolo inicial",
    exemplo: "Antirrábica, V8/V10 manutenção",
  },
  reforco_semestral: {
    label: "Reforço Semestral",
    descricao: "Reaplicação a cada 6 meses",
    exemplo: "Protocolos específicos ou animais de risco",
  },
} as const;

export type TipoProtocoloVacinal = keyof typeof TIPOS_PROTOCOLO_VACINAL;

/**
 * Origens da vacinação
 */
export const ORIGENS_VACINACAO = {
  ong: {
    label: "Na ONG",
    descricao: "Aplicada nas instalações da ONG",
  },
  clinica_externa: {
    label: "Clínica Externa",
    descricao: "Aplicada em clínica veterinária parceira",
  },
  campanha_publica: {
    label: "Campanha Pública",
    descricao: "Campanha de vacinação municipal/estadual",
  },
  informada: {
    label: "Informada pelo Tutor",
    descricao: "Vacina aplicada anteriormente, informada pelo adotante",
  },
} as const;

export type OrigemVacinacao = keyof typeof ORIGENS_VACINACAO;

/**
 * Schema de validação para Protocolo Vacinal
 */
export const protocoloVacinalSchema = z.object({
  idanimal: z.number().positive("Selecione um animal"),
  idvacina: z.number().positive("Selecione uma vacina"),
  tipo_protocolo: z.enum([
    "dose_unica",
    "protocolo_inicial",
    "reforco_anual",
    "reforco_semestral",
  ]),
  
  // Campos condicionais
  total_doses: z.number().nullable(),
  intervalo_dias: z.number().nullable(),
  data_inicio: z.string().min(1, "Data é obrigatória"),
  observacoes: z.string().nullable(),
}).superRefine((data, ctx) => {
  switch (data.tipo_protocolo) {
    case "protocolo_inicial":
      if (!data.total_doses || data.total_doses < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Protocolo inicial exige pelo menos 2 doses",
          path: ["total_doses"],
        });
      }
      if (!data.intervalo_dias || data.intervalo_dias <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o intervalo entre doses",
          path: ["intervalo_dias"],
        });
      }
      break;
  }
});

/**
 * Schema para registrar vacinação aplicada
 */
export const vacinacaoAplicadaSchema = z.object({
  idanimal: z.number().positive("Selecione um animal"),
  idvacina: z.number().positive("Selecione uma vacina"),
  protocolo_idprotocolo: z.number().nullable(), // Pode ser vinculada a protocolo ou avulsa
  dose_numero: z.number().min(1),
  local: z.string().min(1, "Local de aplicação é obrigatório"),
  origem: z.enum(["ong", "clinica_externa", "campanha_publica", "informada"]),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Horário é obrigatório"),
  observacoes: z.string().nullable(),
  
  // Se for vacina informada (externa), não movimenta estoque
  // Campos adicionais para vacinas externas
  lote_externo: z.string().nullable(),
  aplicador_externo: z.string().nullable(),

  // Agendamento automático de próximo reforço
  criar_protocolo: z.boolean().optional(),
  tipo_novo_protocolo: z.enum([
    "dose_unica",
    "protocolo_inicial",
    "reforco_anual",
    "reforco_semestral",
  ]).optional().nullable(),
  total_doses_protocolo: z.number().optional().nullable(), // Para protocolo_inicial
  intervalo_novo_protocolo: z.number().optional().nullable(), // Para protocolo_inicial e personalizado
}).superRefine((data, ctx) => {
  if (data.criar_protocolo) {
    if (!data.tipo_novo_protocolo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o tipo de protocolo",
        path: ["tipo_novo_protocolo"],
      });
    }

    if (data.tipo_novo_protocolo === "protocolo_inicial") {
      if (!data.total_doses_protocolo || data.total_doses_protocolo < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Protocolo inicial exige pelo menos 2 doses",
          path: ["total_doses_protocolo"],
        });
      }
      if (!data.intervalo_novo_protocolo || data.intervalo_novo_protocolo <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o intervalo entre doses",
          path: ["intervalo_novo_protocolo"],
        });
      }
    }
  }
});

export type ProtocoloVacinalFormData = z.infer<typeof protocoloVacinalSchema>;
export type VacinacaoAplicadaFormData = z.infer<typeof vacinacaoAplicadaSchema>;
