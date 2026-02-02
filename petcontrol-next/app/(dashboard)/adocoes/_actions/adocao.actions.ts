"use server";

import { createClient } from "@/lib/supabase/server";
import { adocaoSchema, AdocaoFormData } from "../_schemas/adocao.schema";
import { revalidatePath } from "next/cache";

type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Listar todas as adoções
 */
export async function listarAdocoes(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    
    // Buscar adoções com joins manuais
    const { data: adocoesData, error } = await supabase
      .from("adocao")
      .select("*")
      .order("dataadocao", { ascending: false });

    if (error) {
      console.error("Erro ao listar adoções:", error);
      return { success: false, message: error.message };
    }

    // Se não há adoções, retornar array vazio
    if (!adocoesData || adocoesData.length === 0) {
      return { success: true, message: "Adoções carregadas", data: [] };
    }

    // Buscar dados relacionados manualmente
    const adocoesComRelacoes = await Promise.all(
      adocoesData.map(async (adocao) => {
        const [animalRes, adotanteRes] = await Promise.all([
          supabase
            .from("animal")
            .select("nome, especie")
            .eq("idanimal", adocao.idanimal)
            .single(),
          supabase
            .from("pessoa")
            .select("nome, cpf, telefone")
            .eq("idpessoa", adocao.idadotante)
            .single(),
        ]);

        return {
          ...adocao,
          animal: animalRes.data,
          adotante: adotanteRes.data,
        };
      })
    );

    return { success: true, message: "Adoções carregadas", data: adocoesComRelacoes };
  } catch (error) {
    console.error("Erro ao listar adoções:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Buscar adoção por ID
 */
export async function buscarAdocaoPorId(id: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("adocao")
      .select(`
        *,
        animal:animal(nome, especie),
        adotante:pessoa!adocao_idadotante_fkey(nome, cpf, telefone)
      `)
      .eq("idadocao", id)
      .single();

    if (error) {
      return { success: false, message: "Adoção não encontrada" };
    }

    return { success: true, message: "Adoção encontrada", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Registrar nova adoção
 * Regras de negócio:
 * 1. Animal deve estar "Disponível"
 * 2. Atualiza status do animal para "Adotado"
 * 3. Cria registro no histórico
 */
export async function registrarAdocao(
  formData: AdocaoFormData
): Promise<ActionResponse> {
  const validacao = adocaoSchema.safeParse(formData);

  if (!validacao.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: validacao.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Verificar se animal está disponível
    const { data: animal, error: animalError } = await supabase
      .from("animal")
      .select("status, nome")
      .eq("idanimal", validacao.data.idanimal)
      .single();

    if (animalError || !animal) {
      return { success: false, message: "Animal não encontrado" };
    }

    if (animal.status !== "Disponível") {
      return {
        success: false,
        message: `Animal não está disponível para adoção. Status atual: ${animal.status}`,
      };
    }

    // 2. Buscar nome do adotante para o histórico
    const { data: adotante } = await supabase
      .from("pessoa")
      .select("nome")
      .eq("idpessoa", validacao.data.idadotante)
      .single();

    // 3. Inserir adoção
    const { data: novaAdocao, error: adocaoError } = await supabase
      .from("adocao")
      .insert({
        idadotante: validacao.data.idadotante,
        idanimal: validacao.data.idanimal,
        dataadocao: validacao.data.dataadocao,
        pessoa_idpessoa: validacao.data.pessoa_idpessoa,
        obs: validacao.data.obs,
        status_acompanhamento: validacao.data.status_acompanhamento,
        data_acompanhamento: validacao.data.data_acompanhamento,
      })
      .select()
      .single();

    if (adocaoError) {
      return {
        success: false,
        message: `Erro ao registrar adoção: ${adocaoError.message}`,
      };
    }

    // 4. Atualizar status do animal para "Adotado"
    const { error: updateError } = await supabase
      .from("animal")
      .update({ status: "Adotado" })
      .eq("idanimal", validacao.data.idanimal);

    if (updateError) {
      return {
        success: false,
        message: `Erro ao atualizar status do animal: ${updateError.message}`,
      };
    }

    // 5. Criar registro no histórico
    const { error: historicoError } = await supabase.from("historico").insert({
      descricao: `Animal adotado por ${adotante?.nome || "adotante"}`,
      data: new Date().toISOString(),
      animal_idanimal: validacao.data.idanimal,
    });

    if (historicoError) {
      console.error("Erro ao criar histórico:", historicoError);
      // Não falha a operação se o histórico não for criado
    }

    revalidatePath("/adocoes");
    revalidatePath("/animais");
    return {
      success: true,
      message: `${animal.nome} foi adotado com sucesso!`,
      data: novaAdocao,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Listar animais disponíveis para adoção
 */
export async function listarAnimaisDisponiveis(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("animal")
      .select("idanimal, nome, especie, raca, porte, sexo")
      .eq("status", "Disponível")
      .order("nome", { ascending: true });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Animais disponíveis carregados", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Listar pessoas (adotantes)
 */
export async function listarPessoas(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pessoa")
      .select("idpessoa, nome, cpf, telefone, email")
      .order("nome", { ascending: true });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Pessoas carregadas", data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
