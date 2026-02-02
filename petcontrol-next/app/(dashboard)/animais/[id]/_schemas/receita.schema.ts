import { z } from "zod";

/**
 * Tipos de posologia disponíveis
 */
export const TIPOS_POSOLOGIA = {
  padrao: {
    label: "Padrão (X doses/dia por Y dias)",
    descricao: "Ex: 2 comprimidos de 12 em 12h por 7 dias",
  },
  dose_unica: {
    label: "Dose Única",
    descricao: "Ex: vermífugos, vacinas, antiparasitários",
  },
  periodico: {
    label: "Periódico (semanal/mensal)",
    descricao: "Ex: antipulgas a cada 30 dias",
  },
  continuo: {
    label: "Uso Contínuo",
    descricao: "Ex: doenças crônicas (cardíacos, renais) - sem término",
  },
  se_necessario: {
    label: "Se Necessário (PRN)",
    descricao: "Ex: analgésicos, antieméticos - depende de sinais clínicos",
  },
  especial: {
    label: "Esquema Especial",
    descricao: "Ex: doses escalonadas, horários específicos",
  },
} as const;

export type TipoPosologia = keyof typeof TIPOS_POSOLOGIA;

/**
 * Schema para dose customizada (Esquema Especial)
 */
export const doseCustomizadaSchema = z.object({
  data_programada: z.string().min(1, "Data obrigatória"),
  horario: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de horário inválido (HH:MM)"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  observacao: z.string().optional(),
});

export type DoseCustomizada = z.infer<typeof doseCustomizadaSchema>;

/**
 * Schema de validação para Medicamento na Receita
 * Validação condicional baseada no tipo de posologia
 */
const medicamentoSchema = z.object({
  idproduto: z.number().positive("Selecione um medicamento"),
  tipo_posologia: z.enum([
    "padrao",
    "dose_unica",
    "periodico",
    "continuo",
    "se_necessario",
    "especial",
  ]),
  dose: z.string().min(1, "Dose é obrigatória"),
  // Campos condicionais (podem ser null dependendo do tipo)
  quantidadedias: z.number().nullable(),
  frequencia_diaria: z.number().nullable(),
  intervalohoras: z.number().nullable(),
  observacoes: z.string().nullable(),
  // Doses customizadas para tipo 'especial'
  doses_customizadas: z.array(doseCustomizadaSchema).optional(),
}).superRefine((data, ctx) => {
  // Validações específicas por tipo
  switch (data.tipo_posologia) {
    case "padrao":
      if (!data.quantidadedias || data.quantidadedias <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quantidade de dias é obrigatória para tratamento padrão",
          path: ["quantidadedias"],
        });
      }
      if (!data.intervalohoras || data.intervalohoras <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intervalo entre doses é obrigatório",
          path: ["intervalohoras"],
        });
      }
      break;

    case "periodico":
      if (!data.quantidadedias || data.quantidadedias <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quantidade de doses é obrigatória",
          path: ["quantidadedias"],
        });
      }
      if (!data.intervalohoras || data.intervalohoras <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intervalo em dias é obrigatório",
          path: ["intervalohoras"],
        });
      }
      break;

    case "continuo":
      if (!data.intervalohoras || data.intervalohoras <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intervalo entre doses é obrigatório",
          path: ["intervalohoras"],
        });
      }
      break;

    case "se_necessario":
      if (!data.observacoes || data.observacoes.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Observações são obrigatórias para PRN",
          path: ["observacoes"],
        });
      }
      break;

    case "especial":
      if (!data.doses_customizadas || data.doses_customizadas.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Adicione pelo menos uma dose customizada",
          path: ["doses_customizadas"],
        });
      }
      break;
  }
});

/**
 * Schema de validação para Receita Médica
 */
export const receitaSchema = z.object({
  idanimal: z.number().positive("Selecione um animal"),
  data: z.string(),
  medico: z.string().min(1, "Nome do médico é obrigatório"),
  clinica: z.string().optional(),
  medicamentos: z.array(medicamentoSchema).min(1, "Adicione pelo menos um medicamento"),
});

export type ReceitaFormData = z.infer<typeof receitaSchema>;
export type MedicamentoFormData = z.infer<typeof medicamentoSchema>;
