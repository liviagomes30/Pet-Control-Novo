"use server";

import { createClient } from "@/lib/supabase/server";
import { receitaSchema, ReceitaFormData } from "../_schemas/receita.schema";
import { revalidatePath } from "next/cache";

type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Criar receita médica com posologias
 */
export async function criarReceita(
  formData: ReceitaFormData
): Promise<ActionResponse> {
  const validacao = receitaSchema.safeParse(formData);

  if (!validacao.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: validacao.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();

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

    if (receitaError) {
      return {
        success: false,
        message: `Erro ao criar receita: ${receitaError.message}`,
      };
    }

    // 2. Criar posologias para cada medicamento
    for (const med of validacao.data.medicamentos) {
      // Inserir posologia
      const { data: novaPosologia, error: posologiaError } = await supabase
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

      if (posologiaError) {
        return {
          success: false,
          message: `Erro ao criar posologia: ${posologiaError.message}`,
        };
      }

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

        if (dosesError) {
          console.error("Erro ao inserir doses customizadas:", dosesError);
          return {
            success: false,
            message: `Erro ao criar doses customizadas: ${dosesError.message}`,
          };
        }

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
    return {
      success: true,
      message: "Receita criada com sucesso!",
      data: receita,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Listar receitas de um animal
 */
export async function listarReceitasPorAnimal(
  idAnimal: number
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: receitas, error } = await supabase
      .from("receitamedicamento")
      .select("*")
      .eq("animal_idanimal", idAnimal)
      .order("data", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

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

    return {
      success: true,
      message: "Receitas carregadas",
      data: receitasComPosologias,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Marcar receita como concluída
 */
export async function marcarReceitaConcluida(
  idReceita: number
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("receitamedicamento")
      .update({ status: "Concluída" })
      .eq("idreceita", idReceita);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/agenda");
    return { success: true, message: "Receita marcada como concluída" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Excluir receita médica (somente se nenhuma dose foi administrada)
 * Remove a receita e todas as posologias vinculadas
 */
export async function excluirReceita(
  idReceita: number
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

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

    if (posologiaError) {
      return { success: false, message: `Erro ao excluir posologias: ${posologiaError.message}` };
    }

    // 3. Excluir a receita
    const { error: receitaError } = await supabase
      .from("receitamedicamento")
      .delete()
      .eq("idreceita", idReceita);

    if (receitaError) {
      return { success: false, message: `Erro ao excluir receita: ${receitaError.message}` };
    }

    revalidatePath("/agenda");
    revalidatePath("/animais");
    return { success: true, message: "Receita excluída com sucesso" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Suspender receita médica
 * Mantém a receita e histórico de doses já administradas, mas impede novas doses
 */
export async function suspenderReceita(
  idReceita: number,
  motivo?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Atualizar status da receita para Suspensa
    const { error } = await supabase
      .from("receitamedicamento")
      .update({ 
        status: "Suspensa"
      })
      .eq("idreceita", idReceita);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/agenda");
    revalidatePath("/animais");
    return { 
      success: true, 
      message: "Receita suspensa. O histórico de doses administradas foi mantido." 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Verificar se uma receita pode ser excluída (não tem doses administradas)
 */
export async function verificarPodeExcluir(
  idReceita: number
): Promise<ActionResponse<{ podeExcluir: boolean; dosesAdministradas: number }>> {
  try {
    const supabase = await createClient();

    const { data: medicacoes } = await supabase
      .from("medicacao")
      .select("idmedicacao")
      .eq("posologia_receitamedicamento_idreceita", idReceita);

    const dosesAdministradas = medicacoes?.length || 0;

    return {
      success: true,
      message: dosesAdministradas > 0 
        ? `${dosesAdministradas} dose(s) já administrada(s)`
        : "Nenhuma dose administrada",
      data: {
        podeExcluir: dosesAdministradas === 0,
        dosesAdministradas,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
