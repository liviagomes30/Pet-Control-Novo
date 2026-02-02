"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export type DashboardStats = {
  totalAnimais: number;
  animaisDisponiveis: number;
  animaisAdotados: number;
  animaisEmTratamento: number;
  vacinacoesPendentes: number;
  medicacoesPendentes: number;
  receitasAtivas: number;
  protocolosAtivos: number;
};

export type ProximoCompromisso = {
  id: string;
  tipo: "vacinacao" | "medicacao";
  animalNome: string;
  animalId: number;
  produtoNome: string;
  dataAgendada: string;
  hora?: string;
  dose?: string;
  urgencia: "hoje" | "amanha" | "semana" | "futuro" | "concluido";
  status: "pendente" | "concluido";
  numeroDose?: number;
  totalDoses?: number;
};

/**
 * Buscar estatísticas do dashboard
 */
export async function buscarEstatisticasDashboard(): Promise<
  ActionResponse<DashboardStats>
> {
  try {
    const supabase = await createClient();

    // Contagem de animais por status
    const { data: animais } = await supabase
      .from("animal")
      .select("idanimal, status");

    const totalAnimais = animais?.length || 0;
    const animaisDisponiveis =
      animais?.filter((a) => a.status === "Disponível").length || 0;
    const animaisAdotados =
      animais?.filter((a) => a.status === "Adotado").length || 0;
    const animaisEmTratamento =
      animais?.filter((a) => a.status === "Em Tratamento").length || 0;

    // Receitas ativas
    const { count: receitasAtivas } = await supabase
      .from("receitamedicamento")
      .select("*", { count: "exact", head: true })
      .eq("status", "Ativa");

    // Protocolos vacinais ativos
    const { count: protocolosAtivos } = await supabase
      .from("protocolo_vacinal")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true);

    // Vacinações pendentes (da nova tabela de agenda)
    const { count: vacinacoesPendentes } = await supabase
      .from("agendavacinacao")
      .select("*", { count: "exact", head: true })
      .eq("status", "agendada");

    // Medicações pendentes (da nova tabela de agenda)
    const { count: medicacoesPendentes } = await supabase
      .from("agendamedicacao")
      .select("*", { count: "exact", head: true })
      .eq("status", "agendada");

    return {
      success: true,
      message: "Estatísticas recuperadas",
      data: {
        totalAnimais,
        animaisDisponiveis,
        animaisAdotados,
        animaisEmTratamento,
        vacinacoesPendentes: vacinacoesPendentes || 0,
        medicacoesPendentes: medicacoesPendentes || 0,
        receitasAtivas: receitasAtivas || 0,
        protocolosAtivos: protocolosAtivos || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      data: {
        totalAnimais: 0,
        animaisDisponiveis: 0,
        animaisAdotados: 0,
        animaisEmTratamento: 0,
        vacinacoesPendentes: 0,
        medicacoesPendentes: 0,
        receitasAtivas: 0,
        protocolosAtivos: 0,
      },
    };
  }
}

/**
 * Buscar próximos compromissos (Agenda Unificada)
 * Otimizado: Busca diretamente das tabelas de agenda (V2)
 */
export async function buscarProximosCompromissos(): Promise<
  ActionResponse<ProximoCompromisso[]>
> {
  try {
    const supabase = await createClient();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Início do dia
    
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 365); // Mostrar agenda do ano todo

    const dataHojeISO = hoje.toISOString().split("T")[0];
    const dataLimiteISO = em30Dias.toISOString().split("T")[0];

    // 1. Buscar Agenda de Vacinação
    const { data: agendaVacinas, error: erroVacina } = await supabase
      .from("agendavacinacao")
      .select(`
        idagendavacinacao,
        data,
        hora,
        dose_numero,
        status,
        animal:animal_idanimal(nome, idanimal),
        vacina:vacina_idproduto(
          produto:produto(nome)
        ),
        protocolo:protocolo_idprotocolo(total_doses)
      `)
      .or(`status.eq.agendada,status.eq.aplicada`) // Trazer pendentes e realizadas
      .gte("data", dataHojeISO)
      .lte("data", dataLimiteISO)
      .order("data", { ascending: true });

    if (erroVacina) {
      console.error("Erro ao buscar vacinas:", erroVacina);
    }

    // 2. Buscar Agenda de Medicação
    const { data: agendaMed, error: erroMed } = await supabase
      .from("agendamedicacao")
      .select(`
        idagendamedicacao,
        data,
        hora,
        dose_numero,
        quantidade,
        status,
        animal:animal_idanimal(nome, idanimal),
        medicamento:medicamento_idproduto(
          produto:produto(nome)
        )
      `)
      .or(`status.eq.agendada,status.eq.aplicada`)
      .gte("data", dataHojeISO)
      .lte("data", dataLimiteISO)
      .order("data", { ascending: true });

    if (erroMed) {
      console.error("Erro ao buscar medicações:", erroMed);
    }

    const compromissos: ProximoCompromisso[] = [];

    // Processar Vacinas
    (agendaVacinas || []).forEach((item: any) => {
      // Ajustar formato da data/hora para o componente
      // Se hora vier nula, usar 08:00
      const horaStr = item.hora || "08:00:00";
      const dataAgendada = `${item.data}T${horaStr}`;
      
      const urgencia = item.status === "aplicada" 
        ? "concluido" 
        : getUrgencia(new Date(dataAgendada));

      compromissos.push({
        id: `vac-${item.idagendavacinacao}`,
        tipo: "vacinacao",
        animalNome: item.animal?.nome || "Animal",
        animalId: item.animal?.idanimal,
        produtoNome: item.vacina?.produto?.nome || "Vacina",
        dataAgendada: dataAgendada,
        hora: horaStr.substring(0, 5),
        dose: `Dose ${item.dose_numero}${item.protocolo?.total_doses ? '/' + item.protocolo.total_doses : ''}`,
        urgencia: urgencia as any,
        status: item.status === "aplicada" ? "concluido" : "pendente",
        numeroDose: item.dose_numero,
        totalDoses: item.protocolo?.total_doses
      });
    });

    // Processar Medicações
    (agendaMed || []).forEach((item: any) => {
      const horaStr = item.hora || "08:00:00";
      const dataAgendada = `${item.data}T${horaStr}`;
      
      const urgencia = item.status === "aplicada"
        ? "concluido"
        : getUrgencia(new Date(dataAgendada));

      compromissos.push({
        id: `med-${item.idagendamedicacao}`,
        tipo: "medicacao",
        animalNome: item.animal?.nome || "Animal",
        animalId: item.animal?.idanimal,
        produtoNome: item.medicamento?.produto?.nome || "Medicamento",
        dataAgendada: dataAgendada,
        hora: horaStr.substring(0, 5),
        dose: item.quantidade || `Dose ${item.dose_numero}`,
        urgencia: urgencia as any,
        status: item.status === "aplicada" ? "concluido" : "pendente",
        numeroDose: item.dose_numero,
      });
    });

    // Ordenar final por data/hora
    compromissos.sort((a, b) => {
      // Concluídos sempre no final
      if (a.urgencia === "concluido" && b.urgencia !== "concluido") return 1;
      if (a.urgencia !== "concluido" && b.urgencia === "concluido") return -1;
      
      // Ordenar por data
      const dataA = new Date(a.dataAgendada).getTime();
      const dataB = new Date(b.dataAgendada).getTime();
      return dataA - dataB;
    });

    return {
      success: true,
      message: `${compromissos.length} compromissos encontrados`,
      data: compromissos,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

function getUrgencia(dataComp: Date): "hoje" | "amanha" | "semana" | "futuro" {
  const agora = new Date();
  
  // Normalizar datas para início do dia (00:00:00) para comparação correta de dias
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dataItem = new Date(dataComp.getFullYear(), dataComp.getMonth(), dataComp.getDate());
  
  const diffTime = dataItem.getTime() - hoje.getTime();
  const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "hoje"; // Atrasado considera hoje (urgente)
  if (diffDias === 0) return "hoje";
  if (diffDias === 1) return "amanha";
  if (diffDias <= 7) return "semana";
  return "futuro";
}
