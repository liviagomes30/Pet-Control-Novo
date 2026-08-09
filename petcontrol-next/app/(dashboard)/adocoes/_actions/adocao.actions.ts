"use server";

import { adocaoSchema, AdocaoFormData } from "../_schemas/adocao.schema";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { falha, invalido, sucesso, type ActionResult } from "@/lib/actions/result";
import type { Adocao, Animal, Pessoa } from "@/lib/database.types";

export type AdocaoComRelacoes = Adocao & {
  animal: Pick<Animal, "nome" | "especie"> | null;
  adotante: Pick<Pessoa, "nome" | "cpf" | "telefone"> | null;
};

/**
 * Listar todas as adoções, com animal e adotante já resolvidos via join
 * (evita N+1: antes eram 1 + 2 queries por adoção).
 */
export async function listarAdocoes(): Promise<ActionResult<AdocaoComRelacoes[]>> {
  try {
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("adocao")
      .select(
        `
        *,
        animal:animal(nome, especie),
        adotante:pessoa!adocao_idadotante_fkey(nome, cpf, telefone)
      `,
      )
      .order("dataadocao", { ascending: false });

    if (error) return falha(error, "listarAdocoes");

    return sucesso(data ?? [], "Adoções carregadas");
  } catch (error) {
    return falha(error, "listarAdocoes");
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
): Promise<ActionResult<Adocao>> {
  const validacao = adocaoSchema.safeParse(formData);
  if (!validacao.success) return invalido(validacao.error);

  try {
    const { supabase } = await requireUser();

    // 1. Verificar se animal está disponível
    const { data: animal, error: animalError } = await supabase
      .from("animal")
      .select("status, nome")
      .eq("idanimal", validacao.data.idanimal)
      .maybeSingle();

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
      .maybeSingle();

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

    if (adocaoError) return falha(adocaoError, "registrarAdocao:inserirAdocao");

    // 4. Atualizar status do animal para "Adotado"
    const { error: updateError } = await supabase
      .from("animal")
      .update({ status: "Adotado" })
      .eq("idanimal", validacao.data.idanimal);

    if (updateError) return falha(updateError, "registrarAdocao:atualizarAnimal");

    // 5. Criar registro no histórico (best-effort: falha aqui não desfaz a adoção já registrada)
    const { error: historicoError } = await supabase.from("historico").insert({
      descricao: `Animal adotado por ${adotante?.nome || "adotante"}`,
      data: validacao.data.dataadocao,
      animal_idanimal: validacao.data.idanimal,
    });

    if (historicoError) {
      console.error("[registrarAdocao:historico]", historicoError);
    }

    revalidatePath("/adocoes");
    revalidatePath("/animais");
    return sucesso(novaAdocao, `${animal.nome} foi adotado com sucesso!`);
  } catch (error) {
    return falha(error, "registrarAdocao");
  }
}

/**
 * Listar animais disponíveis para adoção
 */
export type AnimalDisponivel = Pick<
  Animal,
  "idanimal" | "nome" | "especie" | "raca" | "porte" | "sexo"
>;

export async function listarAnimaisDisponiveis(): Promise<ActionResult<AnimalDisponivel[]>> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("animal")
      .select("idanimal, nome, especie, raca, porte, sexo")
      .eq("status", "Disponível")
      .order("nome", { ascending: true });

    if (error) return falha(error, "listarAnimaisDisponiveis");

    return sucesso(data ?? [], "Animais disponíveis carregados");
  } catch (error) {
    return falha(error, "listarAnimaisDisponiveis");
  }
}

/**
 * Listar pessoas (adotantes)
 */
export type PessoaResumo = Pick<
  Pessoa,
  "idpessoa" | "nome" | "cpf" | "telefone" | "email"
>;

export async function listarPessoas(): Promise<ActionResult<PessoaResumo[]>> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("pessoa")
      .select("idpessoa, nome, cpf, telefone, email")
      .order("nome", { ascending: true });

    if (error) return falha(error, "listarPessoas");

    return sucesso(data ?? [], "Pessoas carregadas");
  } catch (error) {
    return falha(error, "listarPessoas");
  }
}
