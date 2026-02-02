"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export type HistoricoItem = {
  id: number;
  tipo: "adocao" | "vacinacao" | "medicacao" | "evento" | "geral";
  descricao: string;
  data: string;
  detalhes?: any;
};

/**
 * Buscar histórico completo do animal
 * Retorna timeline unificada de todas as ações
 */
export async function listarHistoricoPorAnimal(
  idAnimal: number
): Promise<ActionResponse<HistoricoItem[]>> {
  try {
    const supabase = await createClient();

    // Buscar registros da tabela historico
    const { data: historicos, error } = await supabase
      .from("historico")
      .select(
        `
        idhistorico,
        descricao,
        data,
        vacinacao_idvacinacao,
        medicacao_idmedicacao
      `
      )
      .eq("animal_idanimal", idAnimal)
      .order("data", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    // Buscar detalhes de medicações e vacinações
    const timelinePromises = (historicos || []).map(async (h) => {
      let tipo: HistoricoItem["tipo"] = "geral";
      let detalhesExtras: any = {};

      if (h.medicacao_idmedicacao) {
        tipo = "medicacao";
        // Buscar detalhes da medicação
        const { data: medicacao } = await supabase
          .from("medicacao")
          .select("quantidade_administrada, posologia_medicamento_idproduto")
          .eq("idmedicacao", h.medicacao_idmedicacao)
          .single();

        if (medicacao) {
          // Buscar nome do medicamento
          const { data: medicamento } = await supabase
            .from("medicamento")
            .select("idproduto")
            .eq("idproduto", medicacao.posologia_medicamento_idproduto)
            .single();

          if (medicamento) {
            const { data: produto } = await supabase
              .from("produto")
              .select("nome")
              .eq("idproduto", medicamento.idproduto)
              .single();

            detalhesExtras = {
              medicamento: produto?.nome,
              quantidade: medicacao.quantidade_administrada,
            };
          }
        }
      } else if (h.vacinacao_idvacinacao) {
        tipo = "vacinacao";
        // Buscar detalhes da vacinação
        const { data: vacinacao } = await supabase
          .from("vacinacao")
          .select("idvacina, local")
          .eq("idvacinacao", h.vacinacao_idvacinacao)
          .single();

        if (vacinacao) {
          // Buscar nome da vacina
          const { data: vacina } = await supabase
            .from("vacina")
            .select("idproduto, lote")
            .eq("idproduto", vacinacao.idvacina)
            .single();

          if (vacina) {
            const { data: produto } = await supabase
              .from("produto")
              .select("nome")
              .eq("idproduto", vacina.idproduto)
              .single();

            detalhesExtras = {
              vacina: produto?.nome,
              local: vacinacao.local,
              lote: vacina.lote,
            };
          }
        }
      }

      return {
        id: h.idhistorico,
        tipo,
        descricao: h.descricao,
        data: h.data || new Date().toISOString(),
        detalhes: { ...h, ...detalhesExtras },
      };
    });

    const timeline: HistoricoItem[] = await Promise.all(timelinePromises);

    // Buscar adoções (que podem não estar no histórico ainda)
    const { data: adocoes } = await supabase
      .from("adocao")
      .select("idadocao, dataadocao, adotante:pessoa!adocao_idadotante_fkey(nome)")
      .eq("idanimal", idAnimal);

    if (adocoes) {
      adocoes.forEach((adocao: any) => {
        timeline.push({
          id: adocao.idadocao,
          tipo: "adocao",
          descricao: `Adotado por ${adocao.adotante?.nome || "adotante"}`,
          data: adocao.dataadocao,
          detalhes: adocao,
        });
      });
    }

    // Buscar eventos
    const { data: eventos } = await supabase
      .from("evento")
      .select("idevento, descricao, data, local, status")
      .eq("animal_idanimal", idAnimal);

    if (eventos) {
      eventos.forEach((evento: any) => {
        timeline.push({
          id: evento.idevento,
          tipo: "evento",
          descricao: evento.descricao,
          data: evento.data,
          detalhes: evento,
        });
      });
    }

    // Ordenar por data (mais recente primeiro)
    timeline.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    return {
      success: true,
      message: "Histórico carregado",
      data: timeline,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
