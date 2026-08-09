"use server";

import { medicacaoSchema, MedicacaoFormData } from "../_schemas/medicacao.schema";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { falha, invalido, sucesso, type ActionResult } from "@/lib/actions/result";
import type { Medicacao } from "@/lib/database.types";
import { hojeLocal } from "@/lib/domain/data-local";

/**
 * Registrar medicação
 * Regras:
 * 1. MOVIMENTA estoque (decrementa quantidade)
 * 2. Valida se há estoque suficiente
 * 3. Cria registro no histórico
 *
 * Nota: esta operação faz 4 chamadas sequenciais sem transação (herdado).
 * Uma falha entre elas pode deixar histórico órfão ou estoque não debitado.
 * Migrar para uma função Postgres é trabalho de Fase 2 (requer acesso ao
 * projeto Supabase real para escrever a migration).
 */
export async function registrarMedicacao(
  formData: MedicacaoFormData
): Promise<ActionResult<Medicacao>> {
  const validacao = medicacaoSchema.safeParse(formData);
  if (!validacao.success) return invalido(validacao.error);

  try {
    const { supabase } = await requireUser();

    // 1. Buscar nome do animal e medicamento
    const [animalRes, medicamentoRes, estoqueRes] = await Promise.all([
      supabase
        .from("animal")
        .select("nome")
        .eq("idanimal", validacao.data.idanimal)
        .single(),
      supabase
        .from("medicamento")
        .select("idproduto, produto:produto(nome)")
        .eq("idproduto", validacao.data.medicamento_idproduto)
        .single(),
      supabase
        .from("estoque")
        .select("quantidade")
        .eq("idproduto", validacao.data.medicamento_idproduto)
        .single(),
    ]);

    const animal = animalRes.data;
    const medicamento = medicamentoRes.data as { idproduto: number; produto: { nome: string } | null } | null;
    const estoque = estoqueRes.data;

    if (!animal) {
      return { success: false, message: "Animal não encontrado" };
    }

    if (!medicamento) {
      return { success: false, message: "Medicamento não encontrado" };
    }

    // 2. Validar estoque
    if (!estoque || estoque.quantidade < validacao.data.quantidade_administrada) {
      return {
        success: false,
        message: `Estoque insuficiente. Disponível: ${estoque?.quantidade || 0}`,
      };
    }

    // 3. Combinar data + hora do formulário (SEM conversão para UTC!)
    // Armazenar como ISO local: YYYY-MM-DDTHH:MM:SS (sem Z no final = sem UTC)
    const dataHoraAdministracao = `${validacao.data.data}T${validacao.data.hora}:00`;
    
    // 4. Criar histórico primeiro
    const { data: historico, error: historicoError } = await supabase
      .from("historico")
      .insert({
        descricao:
          validacao.data.descricao ||
          `Medicação: ${medicamento.produto?.nome || "medicamento"} administrada às ${validacao.data.hora} (${validacao.data.quantidade_administrada} unidades)`,
        data: dataHoraAdministracao,
        animal_idanimal: validacao.data.idanimal,
      })
      .select()
      .single();

    if (historicoError) return falha(historicoError, "registrarMedicacao:historico");

    // 5. Inserir medicação vinculada ao histórico
    const { data: novaMedicacao, error: medicacaoError } = await supabase
      .from("medicacao")
      .insert({
        idanimal: validacao.data.idanimal,
        idhistorico: historico.idhistorico,
        posologia_medicamento_idproduto: validacao.data.medicamento_idproduto,
        posologia_receitamedicamento_idreceita: validacao.data.receita_idreceita || null,
        quantidade_administrada: validacao.data.quantidade_administrada,
        data: dataHoraAdministracao,
      })
      .select()
      .single();

    if (medicacaoError) return falha(medicacaoError, "registrarMedicacao:medicacao");

    // 5. Atualizar histórico com ID da medicação
    const { error: vinculoError } = await supabase
      .from("historico")
      .update({ medicacao_idmedicacao: novaMedicacao.idmedicacao })
      .eq("idhistorico", historico.idhistorico);

    if (vinculoError) {
      console.error("[registrarMedicacao:vincularHistorico]", vinculoError);
    }

    // 6. DECREMENTAR ESTOQUE
    const novaQuantidade = estoque.quantidade - validacao.data.quantidade_administrada;
    const { error: estoqueError } = await supabase
      .from("estoque")
      .update({ quantidade: novaQuantidade })
      .eq("idproduto", validacao.data.medicamento_idproduto);

    if (estoqueError) return falha(estoqueError, "registrarMedicacao:estoque");

    revalidatePath(`/animais/${validacao.data.idanimal}`);
    return sucesso(
      novaMedicacao,
      `Medicação de ${animal.nome} registrada com sucesso! Estoque atualizado.`
    );
  } catch (error) {
    return falha(error, "registrarMedicacao");
  }
}

export type MedicamentoComEstoque = {
  idproduto: number;
  composicao: string;
  produto: { nome: string; idunidademedida: number } | null;
  estoque: number;
};

/**
 * Listar medicamentos disponíveis
 */
export async function listarMedicamentos(): Promise<ActionResult<MedicamentoComEstoque[]>> {
  try {
    const { supabase } = await requireUser();

    // Buscar medicamentos com estoque
    const { data: medicamentos, error } = await supabase
      .from("medicamento")
      .select("idproduto, composicao");

    if (error) return falha(error, "listarMedicamentos");

    // Buscar dados do produto e estoque para cada medicamento
    const medicamentosComEstoque = await Promise.all(
      (medicamentos || []).map(async (med) => {
        const [produtoRes, estoqueRes] = await Promise.all([
          supabase
            .from("produto")
            .select("nome, idunidademedida")
            .eq("idproduto", med.idproduto)
            .single(),
          supabase
            .from("estoque")
            .select("quantidade")
            .eq("idproduto", med.idproduto)
            .single(),
        ]);

        return {
          ...med,
          produto: produtoRes.data,
          estoque: estoqueRes.data?.quantidade || 0,
        };
      })
    );

    // Filtrar apenas medicamentos com produto válido e estoque > 0
    const medicamentosDisponiveis = medicamentosComEstoque.filter(
      (m) => m.produto && m.produto.nome && m.estoque > 0
    );

    return sucesso(medicamentosDisponiveis, "Medicamentos carregados");
  } catch (error) {
    return falha(error, "listarMedicamentos");
  }
}

/**
 * Listar medicamentos já administrados de uma receita
 */
export async function listarMedicacoesAdministradasPorReceita(
  idReceita: number
): Promise<ActionResult<number[]>> {
  try {
    const { supabase } = await requireUser();

    const { data: medicacoes, error } = await supabase
      .from("medicacao")
      .select("posologia_medicamento_idproduto")
      .eq("posologia_receitamedicamento_idreceita", idReceita);

    if (error) return falha(error, "listarMedicacoesAdministradasPorReceita");

    // Retornar apenas os IDs dos medicamentos já administrados
    const idsAdministrados = (medicacoes || []).map(
      (m) => m.posologia_medicamento_idproduto
    );

    return sucesso(idsAdministrados, "Medicações administradas carregadas");
  } catch (error) {
    return falha(error, "listarMedicacoesAdministradasPorReceita");
  }
}

// A tabela `agendamedicacao` não está no schema versionado (petcontrol.sql) —
// ver P0 #3 do relatório de revisão. Tipo local até a migration existir.
export type AgendamentoMedicacao = {
  idagendamedicacao: number;
  animal_idanimal: number;
  medicamento_idproduto: number;
  data: string;
  hora: string | null;
  status: string;
  [key: string]: unknown;
};

/**
 * Buscar agendamento de medicação mais próximo
 */
export async function buscarAgendamentoMedicacao(
  idAnimal: number,
  idMedicamento: number
): Promise<ActionResult<AgendamentoMedicacao | null>> {
  try {
    const { supabase } = await requireUser();
    const dataFiltro = hojeLocal();

    const { data: agendamento, error } = await supabase
      .from("agendamedicacao")
      .select("*")
      .eq("animal_idanimal", idAnimal)
      .eq("medicamento_idproduto", idMedicamento)
      .eq("status", "agendada")
      .gte("data", dataFiltro)
      .order("data", { ascending: true })
      .order("hora", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) return falha(error, "buscarAgendamentoMedicacao");

    return sucesso(agendamento, "Agendamento encontrado");
  } catch (error) {
    return falha(error, "buscarAgendamentoMedicacao");
  }
}
