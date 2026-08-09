"use server";

import { requireUser } from "@/lib/auth/require-user";
import { falha, sucesso, type ActionResult } from "@/lib/actions/result";
import { dataParaISOLocal } from "@/lib/domain/data-local";
import type { DashboardStats, ProximoCompromisso } from "./dashboard.types";

/**
 * Buscar estatísticas do dashboard
 */
export async function buscarEstatisticasDashboard(): Promise<
  ActionResult<DashboardStats>
> {
  try {
    const { supabase } = await requireUser();

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
      animais?.filter((a) => a.status === "Em tratamento").length || 0;

    // Receitas ativas
    const { count: receitasAtivas } = await supabase
      .from("receitamedicamento")
      .select("*", { count: "exact", head: true })
      .eq("status", "Ativa");

    // Protocolos vacinais ativos (coluna `status` é texto — ver vacinacao.actions.ts)
    const { count: protocolosAtivos } = await supabase
      .from("protocolo_vacinal")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo");

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

    return sucesso(
      {
        totalAnimais,
        animaisDisponiveis,
        animaisAdotados,
        animaisEmTratamento,
        vacinacoesPendentes: vacinacoesPendentes || 0,
        medicacoesPendentes: medicacoesPendentes || 0,
        receitasAtivas: receitasAtivas || 0,
        protocolosAtivos: protocolosAtivos || 0,
      },
      "Estatísticas recuperadas"
    );
  } catch (error) {
    return falha(error, "buscarEstatisticasDashboard");
  }
}

/**
 * Buscar próximos compromissos (Agenda Unificada)
 * Otimizado: Busca diretamente das tabelas de agenda (V2)
 */
export async function buscarProximosCompromissos(): Promise<
  ActionResult<ProximoCompromisso[]>
> {
  try {
    const { supabase } = await requireUser();

    // Janela de 90 dias para trás: mostra doses atrasadas em vez de escondê-las
    // (uma dose de anos atrás não é útil, então não removemos o limite por completo).
    const dataMinima = new Date();
    dataMinima.setDate(dataMinima.getDate() - 90);

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 365); // Mostrar agenda do ano todo

    const dataMinimaISO = dataParaISOLocal(dataMinima);
    const dataLimiteISO = dataParaISOLocal(dataLimite);

    // Sem o client tipado com `Database` (P0 #3 do relatório de revisão — o
    // schema real não é o versionado), o supabase-js não sabe que estes joins
    // são N:1 e infere arrays. `.returns<T>()` corrige a forma para o shape
    // real de uma FK simples.
    type AgendaVacinaRow = {
      idagendavacinacao: number;
      data: string;
      hora: string | null;
      dose_numero: number;
      status: string;
      animal: { nome: string; idanimal: number } | null;
      vacina: { produto: { nome: string } | null } | null;
      protocolo: { total_doses: number } | null;
    };

    type AgendaMedRow = {
      idagendamedicacao: number;
      data: string;
      hora: string | null;
      dose_numero: number;
      quantidade: string | null;
      status: string;
      animal: { nome: string; idanimal: number } | null;
      medicamento: { produto: { nome: string } | null } | null;
    };

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
      .gte("data", dataMinimaISO)
      .lte("data", dataLimiteISO)
      .order("data", { ascending: true })
      .returns<AgendaVacinaRow[]>();

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
      .gte("data", dataMinimaISO)
      .lte("data", dataLimiteISO)
      .order("data", { ascending: true })
      .returns<AgendaMedRow[]>();

    if (erroMed) {
      console.error("Erro ao buscar medicações:", erroMed);
    }

    const compromissos: ProximoCompromisso[] = [];

    // Processar Vacinas
    for (const item of agendaVacinas ?? []) {
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
        animalId: item.animal?.idanimal ?? 0,
        produtoNome: item.vacina?.produto?.nome || "Vacina",
        dataAgendada: dataAgendada,
        hora: horaStr.substring(0, 5),
        dose: `Dose ${item.dose_numero}${item.protocolo?.total_doses ? '/' + item.protocolo.total_doses : ''}`,
        urgencia,
        status: item.status === "aplicada" ? "concluido" : "pendente",
        numeroDose: item.dose_numero,
        totalDoses: item.protocolo?.total_doses
      });
    }

    // Processar Medicações
    for (const item of agendaMed ?? []) {
      const horaStr = item.hora || "08:00:00";
      const dataAgendada = `${item.data}T${horaStr}`;

      const urgencia = item.status === "aplicada"
        ? "concluido"
        : getUrgencia(new Date(dataAgendada));

      compromissos.push({
        id: `med-${item.idagendamedicacao}`,
        tipo: "medicacao",
        animalNome: item.animal?.nome || "Animal",
        animalId: item.animal?.idanimal ?? 0,
        produtoNome: item.medicamento?.produto?.nome || "Medicamento",
        dataAgendada: dataAgendada,
        hora: horaStr.substring(0, 5),
        dose: item.quantidade || `Dose ${item.dose_numero}`,
        urgencia,
        status: item.status === "aplicada" ? "concluido" : "pendente",
        numeroDose: item.dose_numero,
      });
    }

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

    return sucesso(compromissos, `${compromissos.length} compromissos encontrados`);
  } catch (error) {
    return falha(error, "buscarProximosCompromissos");
  }
}

function getUrgencia(
  dataComp: Date
): "atrasado" | "hoje" | "amanha" | "semana" | "futuro" {
  const agora = new Date();

  // Normalizar datas para início do dia (00:00:00) para comparação correta de dias
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dataItem = new Date(dataComp.getFullYear(), dataComp.getMonth(), dataComp.getDate());

  const diffTime = dataItem.getTime() - hoje.getTime();
  const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "atrasado";
  if (diffDias === 0) return "hoje";
  if (diffDias === 1) return "amanha";
  if (diffDias <= 7) return "semana";
  return "futuro";
}
