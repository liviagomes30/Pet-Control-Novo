// Tipos gerados manualmente baseados no schema petcontrol.sql
// Última atualização: 2026-01-26

export type Database = {
  public: {
    Tables: {
      acertoestoque: {
        Row: {
          idacerto: number;
          data: string;
          usuario_pessoa_id: number;
          motivo: string;
          observacao: string | null;
        };
        Insert: {
          idacerto?: number;
          data: string;
          usuario_pessoa_id: number;
          motivo: string;
          observacao?: string | null;
        };
        Update: {
          idacerto?: number;
          data?: string;
          usuario_pessoa_id?: number;
          motivo?: string;
          observacao?: string | null;
        };
      };
      adocao: {
        Row: {
          idadocao: number;
          idadotante: number;
          idanimal: number;
          dataadocao: string;
          pessoa_idpessoa: number;
          obs: string | null;
          status_acompanhamento: string | null;
          data_acompanhamento: string | null;
        };
        Insert: {
          idadocao?: number;
          idadotante: number;
          idanimal: number;
          dataadocao: string;
          pessoa_idpessoa: number;
          obs?: string | null;
          status_acompanhamento?: string | null;
          data_acompanhamento?: string | null;
        };
        Update: {
          idadocao?: number;
          idadotante?: number;
          idanimal?: number;
          dataadocao?: string;
          pessoa_idpessoa?: number;
          obs?: string | null;
          status_acompanhamento?: string | null;
          data_acompanhamento?: string | null;
        };
      };
      agendavacinacao: {
        Row: {
          idagendavacinacao: number;
          animal_idanimal: number;
          vacina_idproduto: number;
          data: string | null;
          motivo: string | null;
          usuario_pessoa_idpessoa: number;
        };
        Insert: {
          idagendavacinacao?: number;
          animal_idanimal: number;
          vacina_idproduto: number;
          data?: string | null;
          motivo?: string | null;
          usuario_pessoa_idpessoa: number;
        };
        Update: {
          idagendavacinacao?: number;
          animal_idanimal?: number;
          vacina_idproduto?: number;
          data?: string | null;
          motivo?: string | null;
          usuario_pessoa_idpessoa?: number;
        };
      };
      animal: {
        Row: {
          idanimal: number;
          nome: string | null;
          especie: string | null;
          datanascimento: string | null;
          raca: string | null;
          porte: string | null;
          sexo: string | null;
          status: string | null;
          dataresgate: string | null;
          foto: string | null;
          castrado: boolean | null;
          cor: string | null;
        };
        Insert: {
          idanimal?: number;
          nome?: string | null;
          especie?: string | null;
          datanascimento?: string | null;
          raca?: string | null;
          porte?: string | null;
          sexo?: string | null;
          status?: string | null;
          dataresgate?: string | null;
          foto?: string | null;
          castrado?: boolean | null;
          cor?: string | null;
        };
        Update: {
          idanimal?: number;
          nome?: string | null;
          especie?: string | null;
          datanascimento?: string | null;
          raca?: string | null;
          porte?: string | null;
          sexo?: string | null;
          status?: string | null;
          dataresgate?: string | null;
          foto?: string | null;
          castrado?: boolean | null;
          cor?: string | null;
        };
      };
      estoque: {
        Row: {
          idestoque: number;
          idproduto: number;
          quantidade: number;
        };
        Insert: {
          idestoque?: number;
          idproduto: number;
          quantidade: number;
        };
        Update: {
          idestoque?: number;
          idproduto?: number;
          quantidade?: number;
        };
      };
      evento: {
        Row: {
          idevento: number;
          descricao: string | null;
          data: string | null;
          foto: string | null;
          animal_idanimal: number;
          local: string | null;
          responsavel: string | null;
          status: string | null;
        };
        Insert: {
          idevento?: number;
          descricao?: string | null;
          data?: string | null;
          foto?: string | null;
          animal_idanimal: number;
          local?: string | null;
          responsavel?: string | null;
          status?: string | null;
        };
        Update: {
          idevento?: number;
          descricao?: string | null;
          data?: string | null;
          foto?: string | null;
          animal_idanimal?: number;
          local?: string | null;
          responsavel?: string | null;
          status?: string | null;
        };
      };
      historico: {
        Row: {
          idhistorico: number;
          descricao: string;
          data: string | null;
          animal_idanimal: number;
          vacinacao_idvacinacao: number | null;
          medicacao_idmedicacao: number | null;
        };
        Insert: {
          idhistorico?: number;
          descricao: string;
          data?: string | null;
          animal_idanimal: number;
          vacinacao_idvacinacao?: number | null;
          medicacao_idmedicacao?: number | null;
        };
        Update: {
          idhistorico?: number;
          descricao?: string;
          data?: string | null;
          animal_idanimal?: number;
          vacinacao_idvacinacao?: number | null;
          medicacao_idmedicacao?: number | null;
        };
      };
      itemacertoestoque: {
        Row: {
          iditem: number;
          acerto_id: number;
          produto_id: number;
          quantidade_antes: number;
          quantidade_depois: number;
          tipoajuste: "ENTRADA" | "SAIDA";
        };
        Insert: {
          iditem?: number;
          acerto_id: number;
          produto_id: number;
          quantidade_antes: number;
          quantidade_depois: number;
          tipoajuste: "ENTRADA" | "SAIDA";
        };
        Update: {
          iditem?: number;
          acerto_id?: number;
          produto_id?: number;
          quantidade_antes?: number;
          quantidade_depois?: number;
          tipoajuste?: "ENTRADA" | "SAIDA";
        };
      };
      itemmovimentacao: {
        Row: {
          iditem: number;
          movimentacao_id: number;
          produto_id: number;
          quantidade: number;
          motivomovimentacao_id: number | null;
        };
        Insert: {
          iditem?: number;
          movimentacao_id: number;
          produto_id: number;
          quantidade: number;
          motivomovimentacao_id?: number | null;
        };
        Update: {
          iditem?: number;
          movimentacao_id?: number;
          produto_id?: number;
          quantidade?: number;
          motivomovimentacao_id?: number | null;
        };
      };
      medicacao: {
        Row: {
          idmedicacao: number;
          idanimal: number;
          idhistorico: number;
          posologia_medicamento_idproduto: number;
          posologia_receitamedicamento_idreceita: number | null;
          data: string | null;
          quantidade_administrada: number | null;
        };
        Insert: {
          idmedicacao?: number;
          idanimal: number;
          idhistorico: number;
          posologia_medicamento_idproduto: number;
          posologia_receitamedicamento_idreceita?: number | null;
          data?: string | null;
          quantidade_administrada?: number | null;
        };
        Update: {
          idmedicacao?: number;
          idanimal?: number;
          idhistorico?: number;
          posologia_medicamento_idproduto?: number;
          posologia_receitamedicamento_idreceita?: number | null;
          data?: string | null;
          quantidade_administrada?: number | null;
        };
      };
      medicamento: {
        Row: {
          idproduto: number;
          composicao: string;
        };
        Insert: {
          idproduto: number;
          composicao: string;
        };
        Update: {
          idproduto?: number;
          composicao?: string;
        };
      };
      motivomovimentacao: {
        Row: {
          idmotivo: number;
          descricao: string;
          tipo: "AMBOS" | "ENTRADA" | "SAIDA";
        };
        Insert: {
          idmotivo?: number;
          descricao: string;
          tipo: "AMBOS" | "ENTRADA" | "SAIDA";
        };
        Update: {
          idmotivo?: number;
          descricao?: string;
          tipo?: "AMBOS" | "ENTRADA" | "SAIDA";
        };
      };
      movimentacaoestoque: {
        Row: {
          idmovimentacao: number;
          tipomovimentacao: "ENTRADA" | "SAIDA";
          data: string;
          usuario_pessoa_id: number;
          obs: string | null;
          fornecedor: string | null;
        };
        Insert: {
          idmovimentacao?: number;
          tipomovimentacao: "ENTRADA" | "SAIDA";
          data: string;
          usuario_pessoa_id: number;
          obs?: string | null;
          fornecedor?: string | null;
        };
        Update: {
          idmovimentacao?: number;
          tipomovimentacao?: "ENTRADA" | "SAIDA";
          data?: string;
          usuario_pessoa_id?: number;
          obs?: string | null;
          fornecedor?: string | null;
        };
      };
      pessoa: {
        Row: {
          idpessoa: number;
          nome: string;
          cpf: string;
          endereco: string | null;
          telefone: string | null;
          email: string | null;
        };
        Insert: {
          idpessoa?: number;
          nome: string;
          cpf: string;
          endereco?: string | null;
          telefone?: string | null;
          email?: string | null;
        };
        Update: {
          idpessoa?: number;
          nome?: string;
          cpf?: string;
          endereco?: string | null;
          telefone?: string | null;
          email?: string | null;
        };
      };
      posologia: {
        Row: {
          dose: string;
          quantidadedias: number;
          intervalohoras: number;
          frequencia_diaria: number | null;
          medicamento_idproduto: number;
          receitamedicamento_idreceita: number;
        };
        Insert: {
          dose: string;
          quantidadedias: number;
          intervalohoras: number;
          frequencia_diaria?: number | null;
          medicamento_idproduto: number;
          receitamedicamento_idreceita: number;
        };
        Update: {
          dose?: string;
          quantidadedias?: number;
          intervalohoras?: number;
          frequencia_diaria?: number | null;
          medicamento_idproduto?: number;
          receitamedicamento_idreceita?: number;
        };
      };
      produto: {
        Row: {
          idproduto: number;
          nome: string;
          idtipoproduto: number;
          idunidademedida: number;
          fabricante: string | null;
          preco: number | null;
          estoque_minimo: number | null;
          data_cadastro: string | null;
          ativo: boolean | null;
        };
        Insert: {
          idproduto?: number;
          nome: string;
          idtipoproduto: number;
          idunidademedida: number;
          fabricante?: string | null;
          preco?: number | null;
          estoque_minimo?: number | null;
          data_cadastro?: string | null;
          ativo?: boolean | null;
        };
        Update: {
          idproduto?: number;
          nome?: string;
          idtipoproduto?: number;
          idunidademedida?: number;
          fabricante?: string | null;
          preco?: number | null;
          estoque_minimo?: number | null;
          data_cadastro?: string | null;
          ativo?: boolean | null;
        };
      };
      receitamedicamento: {
        Row: {
          idreceita: number;
          data: string | null;
          medico: string | null;
          clinica: string | null;
          animal_idanimal: number;
          status: string;
        };
        Insert: {
          idreceita?: number;
          data?: string | null;
          medico?: string | null;
          clinica?: string | null;
          animal_idanimal: number;
          status?: string;
        };
        Update: {
          idreceita?: number;
          data?: string | null;
          medico?: string | null;
          clinica?: string | null;
          animal_idanimal?: number;
          status?: string;
        };
      };
      tipoproduto: {
        Row: {
          idtipoproduto: number;
          descricao: string;
        };
        Insert: {
          idtipoproduto?: number;
          descricao: string;
        };
        Update: {
          idtipoproduto?: number;
          descricao?: string;
        };
      };
      unidadedemedida: {
        Row: {
          idunidademedida: number;
          descricao: string;
          sigla: string | null;
        };
        Insert: {
          idunidademedida?: number;
          descricao: string;
          sigla?: string | null;
        };
        Update: {
          idunidademedida?: number;
          descricao?: string;
          sigla?: string | null;
        };
      };
      usuario: {
        Row: {
          login: string | null;
          senha: string | null;
          pessoa_idpessoa: number;
        };
        Insert: {
          login?: string | null;
          senha?: string | null;
          pessoa_idpessoa: number;
        };
        Update: {
          login?: string | null;
          senha?: string | null;
          pessoa_idpessoa?: number;
        };
      };
      vacina: {
        Row: {
          idproduto: number;
          lote: string;
          validade: string;
        };
        Insert: {
          idproduto: number;
          lote: string;
          validade: string;
        };
        Update: {
          idproduto?: number;
          lote?: string;
          validade?: string;
        };
      };
      vacinacao: {
        Row: {
          idvacinacao: number;
          idvacina: number;
          idanimal: number;
          idhistorico: number;
          data: string | null;
          local: string | null;
        };
        Insert: {
          idvacinacao?: number;
          idvacina: number;
          idanimal: number;
          idhistorico: number;
          data?: string | null;
          local?: string | null;
        };
        Update: {
          idvacinacao?: number;
          idvacina?: number;
          idanimal?: number;
          idhistorico?: number;
          data?: string | null;
          local?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Helper types para facilitar uso
export type Animal = Database["public"]["Tables"]["animal"]["Row"];
export type AnimalInsert = Database["public"]["Tables"]["animal"]["Insert"];
export type AnimalUpdate = Database["public"]["Tables"]["animal"]["Update"];

export type Pessoa = Database["public"]["Tables"]["pessoa"]["Row"];
export type Adocao = Database["public"]["Tables"]["adocao"]["Row"];
export type Produto = Database["public"]["Tables"]["produto"]["Row"];
export type Estoque = Database["public"]["Tables"]["estoque"]["Row"];
export type Evento = Database["public"]["Tables"]["evento"]["Row"];
export type Historico = Database["public"]["Tables"]["historico"]["Row"];
export type Usuario = Database["public"]["Tables"]["usuario"]["Row"];