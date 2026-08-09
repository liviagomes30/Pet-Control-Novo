import { z } from "zod";

/**
 * Schema de validação para Adoção
 * Baseado em AdocaoService.java e AdocaoModel.java
 */

export const adocaoSchema = z.object({
  idanimal: z.number().positive("Selecione um animal"),
  idadotante: z.number().positive("Selecione um adotante"),
  dataadocao: z
    .string()
    .refine(
      (val) => !val || new Date(val) <= new Date(),
      "Data de adoção não pode ser futura"
    ),
  pessoa_idpessoa: z.number().positive("Responsável é obrigatório"),
  obs: z.string().optional(),
  status_acompanhamento: z
    .enum(["Pendente", "Em andamento", "Concluído", "Cancelado"])
    .optional(),
  data_acompanhamento: z.string().optional(),
});

export type AdocaoFormData = z.infer<typeof adocaoSchema>;
