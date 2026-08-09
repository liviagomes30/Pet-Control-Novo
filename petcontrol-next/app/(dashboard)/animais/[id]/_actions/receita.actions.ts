"use server";

import { receitaSchema, ReceitaFormData } from "../_schemas/receita.schema";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { falha, invalido, sucesso, type ActionResult } from "@/lib/actions/result";
import type { ReceitaMedicamento } from "@/lib/database.types";

/**
 * Criar receita médica com posologias
 */
export async function criarReceita(
  formData: ReceitaFormData
): Promise<ActionResult<ReceitaMedicamento>> {
  const validacao = receitaSchema.safeParse(formData);
  if (!validacao.success) return invalido(validacao.error);

  try {
    const { supabase } = await requireUser();

    // 1. Criar receita
    const { data: receita, error: receitaError } = await supabase
      .from("receitamedicamento")
      .insert({
        data: validacao.data.data,
        medico: validacao.data.medico,
        clinica: validacao.data.clinica,
        animal_idanimal: validacao.data.idanimal,
        status: "Ativa",
      })
      .select()
      .single();

    if (receitaError) return falha(receitaError, "criarReceita:receita");

    // 2. Criar posologias para cada medicamento
    for (const med of validacao.data.medicamentos) {
      // Inserir posologia
      const { error: posologiaError } = await supabase
        .from("posologia")
        .insert({
          dose: med.dose,
          quantidadedias: med.quantidadedias,
          frequencia_diaria: med.frequencia_diaria,
          intervalohoras: med.intervalohoras,
          medicamento_idproduto: med.idproduto,
          receitamedicamento_idreceita: receita.idreceita,
          tipo_posologia: med.tipo_posologia,
          observacoes: med.observacoes,
        })
        .select()
        .single();

      if (posologiaError) return falha(posologiaError, "criarReceita:posologia");

      // --- PROCESSAR DOSES CUSTOMIZADAS (ESQUEMA ESPECIAL) ---
      if (med.tipo_posologia === "especial" && med.doses_customizadas && med.doses_customizadas.length > 0) {
        // Inserir doses customizadas
        const dosesParaInserir = med.doses_customizadas.map(dose => ({
          posologia_receitamedicamento_idreceita: receita.idreceita,
          posologia_medicamento_idproduto: med.idproduto,
          data_programada: dose.data_programada,
          horario: dose.horario,
          quantidade: dose.quantidade,
          observacao: dose.observacao || null,
        }));

        const { error: dosesError } = await supabase
          .from("posologia_customizada")
          .insert(dosesParaInserir);

        if (dosesError) return falha(dosesError, "criarReceita:dosesCustomizadas");

        // Criar agendamentos automáticos para cada dose customizada
        const agendamentosCustomizados = med.doses_customizadas.map((dose, index) => ({
          animal_idanimal: validacao.data.idanimal,
          medicamento_idproduto: med.idproduto,
          receita_idreceita: receita.idreceita,
          posologia_receitamedicamento_idreceita: receita.idreceita,
          posologia_medicamento_idproduto: med.idproduto,
          dose_numero: index + 1,
          data: dose.data_programada,
          hora: `${dose.horario}:00`,
          quantidade: dose.quantidade.toString(),
          status: 'agendada',
        }));

        const { error: agendaCustomError } = await supabase
          .from('agendamedicacao')
          .insert(agendamentosCustomizados);

        if (agendaCustomError) {
          console.error("Erro ao gerar agenda customizada:", agendaCustomError);
        }

        // Pular geração de agenda padrão para esquema especial
        continue;
      }

      // --- GERAR AGENDAMENTO DE MEDICAÇÃO ---
      const agendamentosMed = [];
      
      const intervaloHoras = med.intervalohoras || 24;
      const quantidadeDias = med.quantidadedias || 1;
      const frequenciaDiaria = med.frequencia_diaria || Math.floor(24 / (intervaloHoras || 24)) || 1;
      
      let totalDoses = 1;
      let intervaloEmHoras = intervaloHoras;
      
      if (med.tipo_posologia === "padrao") {
        totalDoses = frequenciaDiaria * quantidadeDias;
      } else if (med.tipo_posologia === "periodico") {
        totalDoses = quantidadeDias;
        // Para periódico, intervalohoras está em DIAS, converter para horas
        intervaloEmHoras = intervaloHoras * 24;
      } else if (med.tipo_posologia === "continuo") {
        totalDoses = 30; // Gera 30 dias iniciais
      }

      // Data de referência (sem hora definida ainda)
      const dataStr = validacao.data.data;
      const [baseAno, baseMes, baseDia] = dataStr.split("-").map(Number);
      
      // Assumir início às 08:00 se não especificado
      const baseHora = 8; 
      const baseMin = 0;

      for (let i = 0; i < totalDoses; i++) {
        // Calcular data/hora
        const totalMinutosDesdeInicio = i * intervaloEmHoras * 60;
        let minutosDaBase = baseHora * 60 + baseMin + totalMinutosDesdeInicio;
        
        const diasExtras = Math.floor(minutosDaBase / (24 * 60));
        minutosDaBase = minutosDaBase % (24 * 60);
        
        const novaHora = Math.floor(minutosDaBase / 60);
        const novoMin = minutosDaBase % 60;
        
        // Calcular nova data
        const dataReferencia = new Date(baseAno, baseMes - 1, baseDia);
        dataReferencia.setDate(dataReferencia.getDate() + diasExtras);
        
        const anoFinal = dataReferencia.getFullYear();
        const mesFinal = String(dataReferencia.getMonth() + 1).padStart(2, "0");
        const diaFinal = String(dataReferencia.getDate()).padStart(2, "0");
        const horaFinal = `${String(novaHora).padStart(2, "0")}:${String(novoMin).padStart(2, "0")}:00`;

        agendamentosMed.push({
          animal_idanimal: validacao.data.idanimal,
          medicamento_idproduto: med.idproduto,
          receita_idreceita: receita.idreceita,
          posologia_receitamedicamento_idreceita: receita.idreceita,
          posologia_medicamento_idproduto: med.idproduto,
          dose_numero: i + 1,
          data: `${anoFinal}-${mesFinal}-${diaFinal}`,
          hora: horaFinal,
          quantidade: med.dose,
          status: 'agendada'
        });
      }

      if (agendamentosMed.length > 0) {
        const { error: agendaError } = await supabase
          .from('agendamedicacao')
          .insert(agendamentosMed);
          
        if (agendaError) {
          console.error("Erro ao gerar agenda de medicação:", agendaError);
        }
      }


    }

    revalidatePath(`/animais/${validacao.data.idanimal}`);
    revalidatePath("/agenda");
    return sucesso(receita, "Receita criada com sucesso!");
  } catch (error) {
    return falha(error, "criarReceita");
  }
}

export type PosologiaComProduto = {
  medicamento_idproduto: number;
  dose: string;
  quantidadedias: number | null;
  intervalohoras: number | null;
  frequencia_diaria: number | null;
  produto?: string;
};

export type ReceitaComPosologias = ReceitaMedicamento & {
  posologias: PosologiaComProduto[];
};

/**
 * Listar receitas de um animal
 */
export async function listarReceitasPorAnimal(
  idAnimal: number
): Promise<ActionResult<ReceitaComPosologias[]>> {
  try {
    const { supabase } = await requireUser();

    const { data: receitas, error } = await supabase
      .from("receitamedicamento")
      .select("*")
      .eq("animal_idanimal", idAnimal)
      .order("data", { ascending: false });

    if (error) return falha(error, "listarReceitasPorAnimal");

    // Buscar posologias para cada receita
    const receitasComPosologias = await Promise.all(
      (receitas || []).map(async (receita) => {
        const { data: posologias } = await supabase
          .from("posologia")
          .select("*")
          .eq("receitamedicamento_idreceita", receita.idreceita);

        // Buscar nomes dos medicamentos
        const posologiasComNomes = await Promise.all(
          (posologias || []).map(async (pos) => {
            const { data: medicamento } = await supabase
              .from("medicamento")
              .select("idproduto")
              .eq("idproduto", pos.medicamento_idproduto)
              .single();

            if (medicamento) {
              const { data: produto } = await supabase
                .from("produto")
                .select("nome")
                .eq("idproduto", medicamento.idproduto)
                .single();

              return { ...pos, produto: produto?.nome };
            }
            return pos;
          })
        );

        return { ...receita, posologias: posologiasComNomes };
      })
    );

    return sucesso(receitasComPosologias, "Receitas carregadas");
  } catch (error) {
    return falha(error, "listarReceitasPorAnimal");
  }
}

/**
 * Marcar receita como concluída
 */
export async function marcarReceitaConcluida(
  idReceita: number
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("receitamedicamento")
      .update({ status: "Concluída" })
      .eq("idreceita", idReceita);

    if (error) return falha(error, "marcarReceitaConcluida");

    revalidatePath("/agenda");
    return sucesso(undefined, "Receita marcada como concluída");
  } catch (error) {
    return falha(error, "marcarReceitaConcluida");
  }
}

/**
 * Excluir receita médica (somente se nenhuma dose foi administrada)
 * Remove a receita e todas as posologias vinculadas
 */
export async function excluirReceita(
  idReceita: number
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

    // 1. Verificar se há medicações administradas
    const { data: medicacoes } = await supabase
      .from("medicacao")
      .select("idmedicacao")
      .eq("posologia_receitamedicamento_idreceita", idReceita);

    if (medicacoes && medicacoes.length > 0) {
      return {
        success: false,
        message: "Não é possível excluir: já existem doses administradas. Use a opção 'Suspender' para manter o histórico.",
      };
    }

    // 2. Excluir posologias vinculadas
    const { error: posologiaError } = await supabase
      .from("posologia")
      .delete()
      .eq("receitamedicamento_idreceita", idReceita);

    if (posologiaError) return falha(posologiaError, "excluirReceita:posologia");

    // 3. Excluir a receita
    const { error: receitaError } = await supabase
      .from("receitamedicamento")
      .delete()
      .eq("idreceita", idReceita);

    if (receitaError) return falha(receitaError, "excluirReceita:receita");

    revalidatePath("/agenda");
    revalidatePath("/animais");
    return sucesso(undefined, "Receita excluída com sucesso");
  } catch (error) {
    return falha(error, "excluirReceita");
  }
}

/**
 * Suspender receita médica
 * Mantém a receita e histórico de doses já administradas, mas impede novas doses
 */
export async function suspenderReceita(
  idReceita: number
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

    // 1. Atualizar status da receita para Suspensa
    const { error } = await supabase
      .from("receitamedicamento")
      .update({
        status: "Suspensa"
      })
      .eq("idreceita", idReceita);

    if (error) return falha(error, "suspenderReceita");

    revalidatePath("/agenda");
    revalidatePath("/animais");
    return sucesso(
      undefined,
      "Receita suspensa. O histórico de doses administradas foi mantido."
    );
  } catch (error) {
    return falha(error, "suspenderReceita");
  }
}

/**
 * Verificar se uma receita pode ser excluída (não tem doses administradas)
 */
export async function verificarPodeExcluir(
  idReceita: number
): Promise<ActionResult<{ podeExcluir: boolean; dosesAdministradas: number }>> {
  try {
    const { supabase } = await requireUser();

    const { data: medicacoes, error } = await supabase
      .from("medicacao")
      .select("idmedicacao")
      .eq("posologia_receitamedicamento_idreceita", idReceita);

    if (error) return falha(error, "verificarPodeExcluir");

    const dosesAdministradas = medicacoes?.length || 0;

    return sucesso(
      { podeExcluir: dosesAdministradas === 0, dosesAdministradas },
      dosesAdministradas > 0
        ? `${dosesAdministradas} dose(s) já administrada(s)`
        : "Nenhuma dose administrada"
    );
  } catch (error) {
    return falha(error, "verificarPodeExcluir");
  }
}
