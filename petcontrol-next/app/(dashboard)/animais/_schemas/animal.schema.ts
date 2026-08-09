import { z } from "zod";

/**
 * Schema de validação para Animal
 * Baseado nas validações do AnimalService.java legado:
 * - Nome, espécie e sexo são obrigatórios
 * - Datas não podem ser futuras
 * - Data de nascimento não pode ser maior que data de resgate
 */

const baseSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  especie: z.string().min(1, "Espécie é obrigatória"),
  sexo: z.enum(["Macho", "Fêmea"], {
    error: () => "Selecione o sexo",
  }),
  datanascimento: z
    .string()
    .nullable()
    .refine(
      (val) => !val || new Date(val) <= new Date(),
      "Data de nascimento não pode ser futura"
    ),
  dataresgate: z
    .string()
    .nullable()
    .refine(
      (val) => !val || new Date(val) <= new Date(),
      "Data de resgate não pode ser futura"
    ),
  raca: z.string().nullable().optional(),
  porte: z.enum(["Pequeno", "Médio", "Grande"]).nullable().optional(),
  status: z
    .enum(["Disponível", "Adotado", "Em tratamento", "Falecido"])
    .default("Disponível"),
  foto: z.string().url("URL inválida").nullable().optional(),
  castrado: z.boolean().default(false),
  cor: z.string().nullable().optional(),
});

export const animalSchema = baseSchema.refine(
  (data) => {
    if (data.datanascimento && data.dataresgate) {
      return new Date(data.datanascimento) <= new Date(data.dataresgate);
    }
    return true;
  },
  {
    message: "Data de nascimento não pode ser maior que data de resgate",
    path: ["datanascimento"],
  }
);

export type AnimalFormData = z.infer<typeof animalSchema>;

// Schema para update (todos campos opcionais exceto id - remove refines de objeto)
export const animalUpdateSchema = baseSchema.partial().extend({
  idanimal: z.number(),
});

export type AnimalUpdateData = z.infer<typeof animalUpdateSchema>;
