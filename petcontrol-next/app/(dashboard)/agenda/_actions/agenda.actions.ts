"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export type CompromissoAgenda = {
  id: string;
  tipo: "medicacao" | "vacinacao";
  tipoPosologia: string;
  animal: { id: number; nome: string };
  produto: string;
  dose: string;
  dataAgendada: string;
  receita?: {
    id: number;
    medico: string;
  };
  observacoes?: string;
  status: "pendente" | "aplicado";
};

/**
 * Listar compromissos futuros (doses agendadas)
 * Calcula baseado nas receitas ativas e tipo de posologia
 */
export async function listarCompromissosFuturos(): Promise<
  ActionResponse<CompromissoAgenda[]>
> {
  try {
    const supabase = await createClient();

    // Buscar receitas ativas
    const { data: receitas, error: receitasError } = await supabase
      .from("receitamedicamento")
      .select("*")
      .eq("status", "Ativa");

    if (receitasError) {
      return { success: false, message: receitasError.message };
    }

    const compromissos: CompromissoAgenda[] = [];

    for (const receita of receitas || []) {
      // Buscar animal
      const { data: animal } = await supabase
        .from("animal")
        .select("idanimal, nome")
        .eq("idanimal", receita.animal_idanimal)
        .single();

      // Buscar posologias da receita
      const { data: posologias } = await supabase
        .from("posologia")
        .select("*")
        .eq("receitamedicamento_idreceita", receita.idreceita);

      for (const pos of posologias || []) {
        // Buscar nome do medicamento
        const { data: medicamento } = await supabase
          .from("medicamento")
          .select("idproduto")
          .eq("idproduto", pos.medicamento_idproduto)
          .single();

        let nomeProduto = "Medicamento";
        if (medicamento) {
          const { data: produto } = await supabase
            .from("produto")
            .select("nome")
            .eq("idproduto", medicamento.idproduto)
            .single();
          nomeProduto = produto?.nome || "Medicamento";
        }

        const tipoPosologia = pos.tipo_posologia || "padrao";

        // Pular tipos que não devem ser agendados
        if (tipoPosologia === "se_necessario" || tipoPosologia === "especial") {
          continue; // PRN e Especial não vão para agenda
        }

        // Contar doses já aplicadas
        const { data: medicacoesAplicadas } = await supabase
          .from("medicacao")
          .select("idmedicacao")
          .eq("idanimal", receita.animal_idanimal)
          .eq("posologia_receitamedicamento_idreceita", receita.idreceita)
          .eq("posologia_medicamento_idproduto", pos.medicamento_idproduto);

        const dosesAplicadas = medicacoesAplicadas?.length || 0;
        const dataInicio = new Date(receita.data);

        // Calcular doses baseado no tipo de posologia
        switch (tipoPosologia) {
          case "dose_unica": {
            // Apenas 1 dose
            if (dosesAplicadas === 0) {
              compromissos.push({
                id: `${receita.idreceita}-${pos.medicamento_idproduto}-0`,
                tipo: "medicacao",
                tipoPosologia: "Dose Única",
                animal: {
                  id: animal?.idanimal || 0,
                  nome: animal?.nome || "Animal",
                },
                produto: nomeProduto,
                dose: pos.dose,
                dataAgendada: dataInicio.toISOString(),
                receita: {
                  id: receita.idreceita,
                  medico: receita.medico,
                },
                status: "pendente",
              });
            }
            break;
          }

          case "periodico": {
            // Intervalo em DIAS (semanal, mensal)
            const totalDoses = pos.quantidadedias || 1;
            const intervaloDias = pos.intervalohoras || 30; // Usa campo intervalohoras como dias

            for (let i = dosesAplicadas; i < totalDoses && i < dosesAplicadas + 10; i++) {
              const diasDesdeInicio = i * intervaloDias;
              const dataAgendada = new Date(dataInicio);
              dataAgendada.setDate(dataAgendada.getDate() + diasDesdeInicio);

              compromissos.push({
                id: `${receita.idreceita}-${pos.medicamento_idproduto}-${i}`,
                tipo: "medicacao",
                tipoPosologia: `Periódico (${intervaloDias} dias)`,
                animal: {
                  id: animal?.idanimal || 0,
                  nome: animal?.nome || "Animal",
                },
                produto: nomeProduto,
                dose: pos.dose,
                dataAgendada: dataAgendada.toISOString(),
                receita: {
                  id: receita.idreceita,
                  medico: receita.medico,
                },
                status: "pendente",
              });
            }
            break;
          }

          case "continuo": {
            // Sem término - agenda próximos 30 dias
            const intervaloHoras = pos.intervalohoras || 24;
            const horasPor30Dias = 30 * 24;
            const dosesEm30Dias = Math.floor(horasPor30Dias / intervaloHoras);

            for (let i = dosesAplicadas; i < dosesAplicadas + dosesEm30Dias && i < dosesAplicadas + 30; i++) {
              const horasDesdeInicio = i * intervaloHoras;
              const dataAgendada = new Date(dataInicio);
              dataAgendada.setHours(dataAgendada.getHours() + horasDesdeInicio);

              // Só adicionar se for no futuro
              if (dataAgendada > new Date()) {
                compromissos.push({
                  id: `${receita.idreceita}-${pos.medicamento_idproduto}-${i}`,
                  tipo: "medicacao",
                  tipoPosologia: "Uso Contínuo",
                  animal: {
                    id: animal?.idanimal || 0,
                    nome: animal?.nome || "Animal",
                  },
                  produto: nomeProduto,
                  dose: pos.dose,
                  dataAgendada: dataAgendada.toISOString(),
                  receita: {
                    id: receita.idreceita,
                    medico: receita.medico,
                  },
                  observacoes: pos.observacoes,
                  status: "pendente",
                });
              }
            }
            break;
          }

          case "padrao":
          default: {
            // Comportamento padrão: X doses/dia por Y dias
            const frequenciaDiaria = pos.frequencia_diaria || 1;
            const quantidadeDias = pos.quantidadedias || 1;
            const totalDoses = frequenciaDiaria * quantidadeDias;
            const intervaloHoras = pos.intervalohoras || 24;

            for (let i = dosesAplicadas; i < totalDoses && i < dosesAplicadas + 10; i++) {
              const horasDesdeInicio = i * intervaloHoras;
              const dataAgendada = new Date(dataInicio);
              dataAgendada.setHours(dataAgendada.getHours() + horasDesdeInicio);

              compromissos.push({
                id: `${receita.idreceita}-${pos.medicamento_idproduto}-${i}`,
                tipo: "medicacao",
                tipoPosologia: "Padrão",
                animal: {
                  id: animal?.idanimal || 0,
                  nome: animal?.nome || "Animal",
                },
                produto: nomeProduto,
                dose: pos.dose,
                dataAgendada: dataAgendada.toISOString(),
                receita: {
                  id: receita.idreceita,
                  medico: receita.medico,
                },
                status: "pendente",
              });
            }
            break;
          }
        }
      }
    }

    // Ordenar por data
    compromissos.sort(
      (a, b) =>
        new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime()
    );

    // Filtrar apenas futuros e próximos 30 dias
    const agora = new Date();
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);

    const compromissosFuturos = compromissos.filter((c) => {
      const data = new Date(c.dataAgendada);
      return data >= agora && data <= em30Dias;
    });

    return {
      success: true,
      message: "Compromissos carregados",
      data: compromissosFuturos,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
