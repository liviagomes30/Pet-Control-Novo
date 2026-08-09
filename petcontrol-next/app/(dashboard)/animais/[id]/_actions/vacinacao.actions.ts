"use server";

import {
  protocoloVacinalSchema,
  ProtocoloVacinalFormData,
  vacinacaoAplicadaSchema,
  VacinacaoAplicadaFormData,
} from "../_schemas/vacinacao.schema";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { falha, invalido, sucesso, type ActionResult } from "@/lib/actions/result";
import { dataParaISOLocal } from "@/lib/domain/data-local";

// As tabelas `protocolo_vacinal` e `agendavacinacao` (colunas hora/status/
// dose_numero) não estão no schema versionado — ver P0 #3 do relatório de
// revisão. Tipo local até a migration existir.
export type ProtocoloVacinal = {
  idprotocolo: number;
  animal_idanimal: number;
  vacina_idproduto: number;
  tipo_protocolo: string;
  total_doses: number;
  intervalo_dias: number | null;
  data_inicio: string;
  data_proximo_reforco: string | null;
  doses_aplicadas: number;
  status: string;
  observacoes: string | null | undefined;
  [key: string]: unknown;
};

/**
 * Criar protocolo vacinal (agenda futura de vacinas)
 */
export async function criarProtocoloVacinal(
  formData: ProtocoloVacinalFormData
): Promise<ActionResult<ProtocoloVacinal>> {
  const validacao = protocoloVacinalSchema.safeParse(formData);
  if (!validacao.success) return invalido(validacao.error);

  try {
    const { supabase, user } = await requireUser();

    // Definir intervalo padrão baseado no tipo
    let intervaloDias = validacao.data.intervalo_dias;
    if (!intervaloDias) {
      switch (validacao.data.tipo_protocolo) {
        case "reforco_anual":
          intervaloDias = 365;
          break;
        case "reforco_semestral":
          intervaloDias = 180;
          break;
        case "dose_unica":
          intervaloDias = null;
          break;
      }
    }

    // Calcular data do próximo reforço
    let dataProximoReforco = null;
    if (intervaloDias && validacao.data.tipo_protocolo !== "dose_unica") {
      const dataInicio = new Date(validacao.data.data_inicio);
      dataProximoReforco = new Date(dataInicio);
      dataProximoReforco.setDate(dataProximoReforco.getDate() + intervaloDias);
    }

    // Criar protocolo
    const { data: protocolo, error } = await supabase
      .from("protocolo_vacinal")
      .insert({
        animal_idanimal: validacao.data.idanimal,
        vacina_idproduto: validacao.data.idvacina,
        tipo_protocolo: validacao.data.tipo_protocolo,
        total_doses: validacao.data.total_doses || 1,
        intervalo_dias: intervaloDias,
        data_inicio: validacao.data.data_inicio,
        data_proximo_reforco: dataProximoReforco?.toISOString().split("T")[0],
        doses_aplicadas: 0,
        status: "ativo",
        observacoes: validacao.data.observacoes,
      })
      .select()
      .single();

    if (error) return falha(error, "criarProtocoloVacinal");

    // Buscar idpessoa do usuário logado (assumindo tabela usuario vinculada ao auth.users ou similar)
    // Se não tiver auth configurado ainda, usar um ID padrão ou buscar da tabela usuario pelo email
    // Como fallback rápido, vamos buscar o primeiro usuário do sistema se não tiver auth user
    let usuarioId = 1; // Fallback temporário
    
    if (user?.email) {
      const { data: usuarioDados } = await supabase
        .from("usuario")
        .select("pessoa_idpessoa")
        .eq("login", user.email) // Assumindo login = email ou ajustar conforme base
        .single();
        
      if (usuarioDados) {
        usuarioId = usuarioDados.pessoa_idpessoa;
      }
    } else {
        // Tentar pegar um usuário qualquer válido para não quebrar a FK
         const { data: usuarioDados } = await supabase
        .from("usuario")
        .select("pessoa_idpessoa")
        .limit(1)
        .single();
        
         if (usuarioDados) {
            usuarioId = usuarioDados.pessoa_idpessoa;
        }
    }

    const totalDoses = validacao.data.total_doses || 1;
    const agendamentos = [];

    // Parse da data de início para evitar problemas de fuso
    const [ano, mes, dia] = validacao.data.data_inicio.split('-').map(Number);
    // Criar data base meio dia para evitar problemas de virada de dia
    const dataBase = new Date(ano, mes - 1, dia, 12, 0, 0);

    for (let i = 1; i <= totalDoses; i++) {
        // ... (cálculo de data igual)
      // Calcular data da dose
      const dataDose = new Date(dataBase);
      // Se tiver intervalo, somar dias
      if (intervaloDias && i > 1) {
        dataDose.setDate(dataBase.getDate() + ((i - 1) * intervaloDias));
      }

      const dataFormatada = dataDose.toISOString().split('T')[0];

      agendamentos.push({
        animal_idanimal: validacao.data.idanimal,
        vacina_idproduto: validacao.data.idvacina,
        protocolo_idprotocolo: protocolo.idprotocolo,
        dose_numero: i,
        data: dataFormatada,
        hora: '08:00:00',
        status: 'agendada',
        usuario_pessoa_idpessoa: usuarioId // Adicionado ID obrigatório
      });
    }

    // Inserir agendamentos em lote
    if (agendamentos.length > 0) {
      const { error: agendamentoError } = await supabase
        .from('agendavacinacao')
        .insert(agendamentos);

      if (agendamentoError) {
        console.error('Erro ao gerar agendamentos:', agendamentoError);
        // Não falhar a request principal, apenas logar
      }
    }

    revalidatePath(`/animais/${validacao.data.idanimal}`);
    revalidatePath("/agenda");

    return sucesso(protocolo, "Protocolo vacinal criado com sucesso!");
  } catch (error) {
    return falha(error, "criarProtocoloVacinal");
  }
}

export type VacinacaoComRelacoes = {
  idvacinacao: number;
  [key: string]: unknown;
};

/**
 * Registrar vacinação aplicada
 * IMPORTANTE: Vacinas NÃO movimentam estoque
 */
export async function registrarVacinacao(
  formData: VacinacaoAplicadaFormData
): Promise<ActionResult<VacinacaoComRelacoes>> {
  const validacao = vacinacaoAplicadaSchema.safeParse(formData);
  if (!validacao.success) return invalido(validacao.error);

  try {
    const { supabase } = await requireUser();

    // Buscar dados para descrição
    const { data: vacina } = await supabase
      .from("vacina")
      .select("idproduto, lote")
      .eq("idproduto", validacao.data.idvacina)
      .single();

    let nomeVacina = "Vacina";
    if (vacina) {
      const { data: produto } = await supabase
        .from("produto")
        .select("nome")
        .eq("idproduto", vacina.idproduto)
        .single();
      nomeVacina = produto?.nome || "Vacina";
    }

    // 1. Combinar data + hora do formulário (SEM conversão para UTC!)
    // Armazenar como ISO local: YYYY-MM-DDTHH:MM:SS (sem Z no final = sem UTC)
    const dataHoraVacinacao = `${validacao.data.data}T${validacao.data.hora}:00`;
    
    const origemTexto = validacao.data.origem === "ong" 
      ? "aplicada na ONG" 
      : validacao.data.origem === "informada"
      ? "informada (aplicação externa)"
      : `aplicada em ${validacao.data.local}`;

    const { data: historico, error: historicoError } = await supabase
      .from("historico")
      .insert({
        descricao: `Vacinação: ${nomeVacina} ${origemTexto}`,
        data: dataHoraVacinacao,
        animal_idanimal: validacao.data.idanimal,
      })
      .select()
      .single();

    if (historicoError) return falha(historicoError, "registrarVacinacao:historico");

    // 2. Inserir vacinação
    const { data: novaVacinacao, error: vacinacaoError } = await supabase
      .from("vacinacao")
      .insert({
        idvacina: validacao.data.idvacina,
        idanimal: validacao.data.idanimal,
        idhistorico: historico.idhistorico,
        data: dataHoraVacinacao,
        local: validacao.data.local,
        protocolo_idprotocolo: validacao.data.protocolo_idprotocolo,
        dose_numero: validacao.data.dose_numero,
        status: "aplicada",
        origem: validacao.data.origem,
        observacoes: validacao.data.observacoes,
      })
      .select()
      .single();

    if (vacinacaoError) return falha(vacinacaoError, "registrarVacinacao:vacinacao");

    // 3. Atualizar histórico com ID da vacinação
    const { error: vinculoError } = await supabase
      .from("historico")
      .update({ vacinacao_idvacinacao: novaVacinacao.idvacinacao })
      .eq("idhistorico", historico.idhistorico);

    if (vinculoError) {
      console.error("[registrarVacinacao:vincularHistorico]", vinculoError);
    }

    // 4. Se vinculada a protocolo, atualizar contador
    if (validacao.data.protocolo_idprotocolo) {
      const { data: protocolo } = await supabase
        .from("protocolo_vacinal")
        .select("*")
        .eq("idprotocolo", validacao.data.protocolo_idprotocolo)
        .single();

      if (protocolo) {
        const novasDosesAplicadas = (protocolo.doses_aplicadas || 0) + 1;
        const protocoloConcluido = novasDosesAplicadas >= (protocolo.total_doses || 1);

        // Calcular próximo reforço
        let dataProximoReforco: string | undefined;
        if (!protocoloConcluido && protocolo.intervalo_dias) {
          const base = new Date();
          base.setDate(base.getDate() + protocolo.intervalo_dias);
          dataProximoReforco = dataParaISOLocal(base);
        }

        await supabase
          .from("protocolo_vacinal")
          .update({
            doses_aplicadas: novasDosesAplicadas,
            data_proximo_reforco: dataProximoReforco,
            status: protocoloConcluido ? "concluido" : "ativo",
          })
          .eq("idprotocolo", validacao.data.protocolo_idprotocolo);
      }
    }

    // 5. Se solicitado criar novo protocolo
    if (validacao.data.criar_protocolo && validacao.data.tipo_novo_protocolo) {
      
      let dataInicioProtocolo = validacao.data.data;
      const tipo = validacao.data.tipo_novo_protocolo!;
      let isRecorrente = false;

      // Se for recorrente (anual/semestral), o protocolo começa no FUTURO
      if (tipo === "reforco_anual" || tipo === "reforco_semestral") {
        isRecorrente = true;
        const dataRef = new Date(validacao.data.data + "T12:00:00");
        const dias = tipo === "reforco_anual" ? 365 : 180;
        dataRef.setDate(dataRef.getDate() + dias);
        dataInicioProtocolo = dataRef.toISOString().split("T")[0];
      }

      const respProtocolo = await criarProtocoloVacinal({
        idanimal: validacao.data.idanimal,
        idvacina: validacao.data.idvacina,
        tipo_protocolo: tipo,
        data_inicio: dataInicioProtocolo,
        intervalo_dias: validacao.data.intervalo_novo_protocolo || null,
        total_doses: validacao.data.total_doses_protocolo || 1, // Recorrente geralmente é 1 dose por vez
        observacoes: "Agendamento automático de reforço",
      });

      // Se NÃO for recorrente (ex: protocolo inicial com multidoses começando hoje),
      // precisamos vincular a vacina atual como sendo a primeira dose.
      if (!isRecorrente && respProtocolo.success) {
        const novoProtocolo = respProtocolo.data;

        // A. Vincular vacinação ao protocolo novo
        await supabase
          .from("vacinacao")
          .update({ protocolo_idprotocolo: novoProtocolo.idprotocolo })
          .eq("idvacinacao", novaVacinacao.idvacinacao);

        // B. Atualizar a PRIMEIRA dose da agenda para 'aplicada'
        await supabase
          .from('agendavacinacao')
          .update({ status: 'aplicada' })
          .eq('protocolo_idprotocolo', novoProtocolo.idprotocolo)
          .eq('dose_numero', 1);

        // C. Atualizar contadores do protocolo
        await supabase
          .from('protocolo_vacinal')
          .update({ doses_aplicadas: 1 })
          .eq('idprotocolo', novoProtocolo.idprotocolo);
      }
    }

    revalidatePath(`/animais/${validacao.data.idanimal}`);
    revalidatePath("/agenda");

    return sucesso(novaVacinacao, `Vacinação registrada com sucesso! (${nomeVacina})`);
  } catch (error) {
    return falha(error, "registrarVacinacao");
  }
}

export type VacinaComProduto = {
  idproduto: number;
  lote: string | null;
  validade: string | null;
  produto: { nome: string } | null;
};

/**
 * Listar vacinas disponíveis
 */
export async function listarVacinas(): Promise<ActionResult<VacinaComProduto[]>> {
  try {
    const { supabase } = await requireUser();

    const { data: vacinas, error } = await supabase
      .from("vacina")
      .select("idproduto, lote, validade");

    if (error) return falha(error, "listarVacinas");

    // Buscar nomes dos produtos
    const vacinasComNomes = await Promise.all(
      (vacinas || []).map(async (vac) => {
        const { data: produto } = await supabase
          .from("produto")
          .select("nome")
          .eq("idproduto", vac.idproduto)
          .single();

        return {
          ...vac,
          produto: produto,
        };
      })
    );

    return sucesso(
      vacinasComNomes.filter((v) => v.produto),
      "Vacinas carregadas"
    );
  } catch (error) {
    return falha(error, "listarVacinas");
  }
}

export type ProtocoloComNomeVacina = ProtocoloVacinal & { vacina_nome: string };

/**
 * Listar protocolos ativos de um animal
 */
export async function listarProtocolosAnimal(
  idAnimal: number
): Promise<ActionResult<ProtocoloComNomeVacina[]>> {
  try {
    const { supabase } = await requireUser();

    const { data: protocolos, error } = await supabase
      .from("protocolo_vacinal")
      .select("*")
      .eq("animal_idanimal", idAnimal)
      .order("data_inicio", { ascending: false });

    if (error) return falha(error, "listarProtocolosAnimal");

    // Buscar nomes das vacinas
    const protocolosComNomes = await Promise.all(
      (protocolos || []).map(async (prot) => {
        const { data: produto } = await supabase
          .from("produto")
          .select("nome")
          .eq("idproduto", prot.vacina_idproduto)
          .single();

        return {
          ...prot,
          vacina_nome: produto?.nome || "Vacina",
        };
      })
    );

    return sucesso(protocolosComNomes, "Protocolos carregados");
  } catch (error) {
    return falha(error, "listarProtocolosAnimal");
  }
}
