"use server";

import { createClient } from "@/lib/supabase/server";
import { animalSchema, animalUpdateSchema, AnimalFormData } from "../_schemas/animal.schema";
import { revalidatePath } from "next/cache";

// Tipo de resposta padronizado para Server Actions
type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Buscar todos os animais
 */
export async function listarAnimais(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("animal")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Animais carregados", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Buscar animal por ID
 */
export async function buscarAnimalPorId(id: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("animal")
      .select("*")
      .eq("idanimal", id)
      .single();

    if (error) {
      return { success: false, message: "Animal não encontrado" };
    }

    return { success: true, message: "Animal encontrado", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Filtrar animais por nome, espécie ou raça
 * Substitui os métodos getNome, getEspecie, getRaca do AnimalService.java
 */
export async function filtrarAnimais(
  termo: string,
  campo: "nome" | "especie" | "raca"
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("animal")
      .select("*")
      .ilike(campo, `%${termo}%`)
      .order("nome", { ascending: true });

    console.log(`Filtrando animais por ${campo}: ${termo} -> Encontrados: ${data?.length}`);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Animais filtrados", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Criar novo animal
 * Substitui o método addAnimal do AnimalService.java
 */
export async function criarAnimal(
  formData: AnimalFormData
): Promise<ActionResponse> {
  // Validação com Zod
  const validacao = animalSchema.safeParse(formData);

  if (!validacao.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: validacao.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("animal")
      .insert({
        nome: validacao.data.nome,
        especie: validacao.data.especie,
        sexo: validacao.data.sexo,
        datanascimento: validacao.data.datanascimento,
        dataresgate: validacao.data.dataresgate,
        raca: validacao.data.raca,
        porte: validacao.data.porte,
        status: validacao.data.status,
        foto: validacao.data.foto,
        castrado: validacao.data.castrado,
        cor: validacao.data.cor,
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: `Erro ao criar animal: ${error.message}` };
    }

    revalidatePath("/animais");
    return { success: true, message: "Animal cadastrado com sucesso!", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Atualizar animal existente
 * Substitui o método uptAnimal do AnimalService.java
 */
export async function atualizarAnimal(
  id: number,
  formData: Partial<AnimalFormData>
): Promise<ActionResponse> {
  const validacao = animalUpdateSchema.safeParse({ ...formData, idanimal: id });

  if (!validacao.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: validacao.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("animal")
      .update({
        nome: formData.nome,
        especie: formData.especie,
        sexo: formData.sexo,
        datanascimento: formData.datanascimento,
        dataresgate: formData.dataresgate,
        raca: formData.raca,
        porte: formData.porte,
        status: formData.status,
        foto: formData.foto,
        castrado: formData.castrado,
        cor: formData.cor,
      })
      .eq("idanimal", id);

    if (error) {
      return { success: false, message: `Erro ao atualizar: ${error.message}` };
    }

    revalidatePath("/animais");
    revalidatePath(`/animais/${id}`);
    return { success: true, message: "Animal atualizado com sucesso!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Deletar animal
 * Substitui o método apagarAnimal do AnimalService.java
 * Verifica dependências antes de deletar (mesmas regras do Java)
 */
export async function deletarAnimal(id: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Verificar dependências (traduzido do AnimalService.java)
    const verificacoes = [
      { tabela: "adocao", campo: "idanimal", erro: "Animal possui adoção registrada" },
      { tabela: "agendavacinacao", campo: "animal_idanimal", erro: "Animal possui vacinação agendada" },
      { tabela: "evento", campo: "animal_idanimal", erro: "Animal está vinculado a eventos" },
      { tabela: "historico", campo: "animal_idanimal", erro: "Animal possui histórico médico" },
      { tabela: "medicacao", campo: "idanimal", erro: "Animal possui medicações registradas" },
      { tabela: "receitamedicamento", campo: "animal_idanimal", erro: "Animal possui receitas médicas" },
      { tabela: "vacinacao", campo: "idanimal", erro: "Animal possui vacinações registradas" },
    ];

    for (const verificacao of verificacoes) {
      const { data } = await supabase
        .from(verificacao.tabela)
        .select("*")
        .eq(verificacao.campo, id)
        .limit(1);

      if (data && data.length > 0) {
        return { success: false, message: verificacao.erro };
      }
    }

    // Se passou em todas verificações, deletar
    const { error } = await supabase.from("animal").delete().eq("idanimal", id);

    if (error) {
      return { success: false, message: `Erro ao deletar: ${error.message}` };
    }

    revalidatePath("/animais");
    return { success: true, message: "Animal removido com sucesso!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
