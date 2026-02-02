"use server";

import { createClient } from "@/lib/supabase/server";
import { medicacaoSchema, MedicacaoFormData } from "../_schemas/medicacao.schema";
import { revalidatePath } from "next/cache";

type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Registrar medicação
 * Regras:
 * 1. MOVIMENTA estoque (decrementa quantidade)
 * 2. Valida se há estoque suficiente
 * 3. Cria registro no histórico
 */
export async function registrarMedicacao(
  formData: MedicacaoFormData
): Promise<ActionResponse> {
  const validacao = medicacaoSchema.safeParse(formData);

  if (!validacao.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: validacao.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();

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
    const medicamento = medicamentoRes.data as any;
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

    if (historicoError) {
      return {
        success: false,
        message: `Erro ao criar histórico: ${historicoError.message}`,
      };
    }

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

    if (medicacaoError) {
      return {
        success: false,
        message: `Erro ao registrar medicação: ${medicacaoError.message}`,
      };
    }

    // 5. Atualizar histórico com ID da medicação
    await supabase
      .from("historico")
      .update({ medicacao_idmedicacao: novaMedicacao.idmedicacao })
      .eq("idhistorico", historico.idhistorico);

    // 6. DECREMENTAR ESTOQUE
    const novaQuantidade = estoque.quantidade - validacao.data.quantidade_administrada;
    const { error: estoqueError } = await supabase
      .from("estoque")
      .update({ quantidade: novaQuantidade })
      .eq("idproduto", validacao.data.medicamento_idproduto);

    if (estoqueError) {
      return {
        success: false,
        message: `Erro ao atualizar estoque: ${estoqueError.message}`,
      };
    }

    revalidatePath(`/animais/${validacao.data.idanimal}`);
    return {
      success: true,
      message: `Medicação de ${animal.nome} registrada com sucesso! Estoque atualizado.`,
      data: novaMedicacao,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Listar medicamentos disponíveis
 */
export async function listarMedicamentos(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    
    // Buscar medicamentos com estoque
    const { data: medicamentos, error } = await supabase
      .from("medicamento")
      .select("idproduto, composicao");

    if (error) {
      return { success: false, message: error.message };
    }

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

    return {
      success: true,
      message: "Medicamentos carregados",
      data: medicamentosDisponiveis,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Listar medicamentos já administrados de uma receita
 */
export async function listarMedicacoesAdministradasPorReceita(
  idReceita: number
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: medicacoes, error } = await supabase
      .from("medicacao")
      .select("posologia_medicamento_idproduto")
      .eq("posologia_receitamedicamento_idreceita", idReceita);

    if (error) {
      return { success: false, message: error.message };
    }

    // Retornar apenas os IDs dos medicamentos já administrados
    const idsAdministrados = (medicacoes || []).map(
      (m) => m.posologia_medicamento_idproduto
    );

    return {
      success: true,
      message: "Medicações administradas carregadas",
      data: idsAdministrados,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Buscar agendamento de medicação mais próximo
 */
export async function buscarAgendamentoMedicacao(
  idAnimal: number,
  idMedicamento: number
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const dataFiltro = new Date().toISOString().split("T")[0];

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

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "Agendamento encontrado",
      data: agendamento,
    };
  } catch (error) {
    return {
      success: false,
      message: "Erro ao buscar agendamento",
    };
  }
}
