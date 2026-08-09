"use server";

import { animalSchema, animalUpdateSchema, AnimalFormData } from "../_schemas/animal.schema";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { falha, invalido, sucesso, type ActionResult } from "@/lib/actions/result";
import type { Animal } from "@/lib/database.types";

/**
 * Buscar todos os animais
 */
export async function listarAnimais(): Promise<ActionResult<Animal[]>> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("animal")
      .select("*")
      .order("nome", { ascending: true });

    if (error) return falha(error, "listarAnimais");

    return sucesso(data ?? [], "Animais carregados");
  } catch (error) {
    return falha(error, "listarAnimais");
  }
}

/**
 * Buscar animal por ID
 */
export async function buscarAnimalPorId(id: number): Promise<ActionResult<Animal>> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("animal")
      .select("*")
      .eq("idanimal", id)
      .maybeSingle();

    if (error || !data) {
      return { success: false, message: "Animal não encontrado" };
    }

    return sucesso(data, "Animal encontrado");
  } catch (error) {
    return falha(error, "buscarAnimalPorId");
  }
}

/**
 * Filtrar animais por nome, espécie ou raça
 * Substitui os métodos getNome, getEspecie, getRaca do AnimalService.java
 */
export async function filtrarAnimais(
  termo: string,
  campo: "nome" | "especie" | "raca"
): Promise<ActionResult<Animal[]>> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("animal")
      .select("*")
      .ilike(campo, `%${termo}%`)
      .order("nome", { ascending: true });

    if (error) return falha(error, "filtrarAnimais");

    return sucesso(data ?? [], "Animais filtrados");
  } catch (error) {
    return falha(error, "filtrarAnimais");
  }
}

/**
 * Criar novo animal
 * Substitui o método addAnimal do AnimalService.java
 */
export async function criarAnimal(
  formData: AnimalFormData
): Promise<ActionResult<Animal>> {
  const validacao = animalSchema.safeParse(formData);
  if (!validacao.success) return invalido(validacao.error);

  try {
    const { supabase } = await requireUser();
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

    if (error) return falha(error, "criarAnimal");

    revalidatePath("/animais");
    return sucesso(data, "Animal cadastrado com sucesso!");
  } catch (error) {
    return falha(error, "criarAnimal");
  }
}

/**
 * Atualizar animal existente
 * Substitui o método uptAnimal do AnimalService.java
 */
export async function atualizarAnimal(
  id: number,
  formData: Partial<AnimalFormData>
): Promise<ActionResult> {
  const validacao = animalUpdateSchema.safeParse({ ...formData, idanimal: id });
  if (!validacao.success) return invalido(validacao.error);

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("animal")
      .update({
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
      .eq("idanimal", id);

    if (error) return falha(error, "atualizarAnimal");

    revalidatePath("/animais");
    revalidatePath(`/animais/${id}`);
    return sucesso(undefined, "Animal atualizado com sucesso!");
  } catch (error) {
    return falha(error, "atualizarAnimal");
  }
}

/**
 * Deletar animal
 * Substitui o método apagarAnimal do AnimalService.java
 * Verifica dependências antes de deletar (mesmas regras do Java)
 */
export async function deletarAnimal(id: number): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

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

    const resultados = await Promise.all(
      verificacoes.map((verificacao) =>
        supabase
          .from(verificacao.tabela)
          .select("*", { count: "exact", head: true })
          .eq(verificacao.campo, id),
      ),
    );

    const dependenciaEncontrada = resultados.findIndex(
      (resultado) => (resultado.count ?? 0) > 0,
    );
    if (dependenciaEncontrada !== -1) {
      return { success: false, message: verificacoes[dependenciaEncontrada].erro };
    }

    const { error } = await supabase.from("animal").delete().eq("idanimal", id);

    if (error) return falha(error, "deletarAnimal");

    revalidatePath("/animais");
    return sucesso(undefined, "Animal removido com sucesso!");
  } catch (error) {
    return falha(error, "deletarAnimal");
  }
}
