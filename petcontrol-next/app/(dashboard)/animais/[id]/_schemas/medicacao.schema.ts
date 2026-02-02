import { z } from "zod";

/**
 * Schema de validação para Medicação
 * Regra: Medicação MOVIMENTA estoque (diferente de vacinação)
 */

export const medicacaoSchema = z.object({
  idanimal: z.number().positive("Selecione um animal"),
  medicamento_idproduto: z.number().positive("Selecione um medicamento"),
  quantidade_administrada: z
    .number()
    .positive("Quantidade deve ser maior que zero"),
  data: z
    .string()
    .refine(
      (val) => !val || new Date(val) <= new Date(),
      "Data não pode ser futura"
    ),
  hora: z.string().min(1, "Informe o horário da administração"),
  descricao: z.string().optional(),
  
  // Vincular a receita médica (opcional)
  receita_idreceita: z.number().nullable().optional(),
});

export type MedicacaoFormData = z.infer<typeof medicacaoSchema>;
