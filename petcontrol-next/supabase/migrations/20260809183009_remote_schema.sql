-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public.origem_vacinacao AS ENUM (
  'ong',
  'clinica_externa',
  'campanha_publica',
  'informada'
);

COMMENT ON TYPE public.origem_vacinacao IS 'Local/origem da aplicação da vacina';

CREATE TYPE public.status_vacinacao AS ENUM (
  'agendada',
  'aplicada',
  'atrasada',
  'cancelada',
  'pendente'
);

COMMENT ON TYPE public.status_vacinacao IS 'Status de cada dose de vacinação';

CREATE TYPE public.tipo_posologia_enum AS ENUM (
  'padrao',
  'dose_unica',
  'periodico',
  'continuo',
  'se_necessario',
  'especial'
);

COMMENT ON TYPE public.tipo_posologia_enum IS 'Tipos de posologia para receitas médicas veterinárias';

CREATE TYPE public.tipo_protocolo_vacinal AS ENUM (
  'dose_unica',
  'protocolo_inicial',
  'reforco_anual',
  'reforco_semestral',
  'personalizado'
);

COMMENT ON TYPE public.tipo_protocolo_vacinal IS 'Tipos de protocolo vacinal para animais';

CREATE SEQUENCE public.agendamedicacao_idagendamedicacao_seq AS integer;

CREATE SEQUENCE public.posologia_customizada_idposologia_custom_seq AS integer;

CREATE SEQUENCE public.protocolo_vacinal_idprotocolo_seq AS integer;

CREATE SEQUENCE public.seq_acertoestoque;

GRANT ALL ON SEQUENCE public.seq_acertoestoque TO anon;

GRANT ALL ON SEQUENCE public.seq_acertoestoque TO authenticated;

GRANT ALL ON SEQUENCE public.seq_acertoestoque TO service_role;

CREATE SEQUENCE public.seq_adocao;

GRANT ALL ON SEQUENCE public.seq_adocao TO anon;

GRANT ALL ON SEQUENCE public.seq_adocao TO authenticated;

GRANT ALL ON SEQUENCE public.seq_adocao TO service_role;

CREATE SEQUENCE public.seq_agendavacinacao;

GRANT ALL ON SEQUENCE public.seq_agendavacinacao TO anon;

GRANT ALL ON SEQUENCE public.seq_agendavacinacao TO authenticated;

GRANT ALL ON SEQUENCE public.seq_agendavacinacao TO service_role;

CREATE SEQUENCE public.seq_animal;

GRANT ALL ON SEQUENCE public.seq_animal TO anon;

GRANT ALL ON SEQUENCE public.seq_animal TO authenticated;

GRANT ALL ON SEQUENCE public.seq_animal TO service_role;

CREATE SEQUENCE public.seq_estoque;

GRANT ALL ON SEQUENCE public.seq_estoque TO anon;

GRANT ALL ON SEQUENCE public.seq_estoque TO authenticated;

GRANT ALL ON SEQUENCE public.seq_estoque TO service_role;

CREATE SEQUENCE public.seq_evento;

GRANT ALL ON SEQUENCE public.seq_evento TO anon;

GRANT ALL ON SEQUENCE public.seq_evento TO authenticated;

GRANT ALL ON SEQUENCE public.seq_evento TO service_role;

CREATE SEQUENCE public.seq_historico;

GRANT ALL ON SEQUENCE public.seq_historico TO anon;

GRANT ALL ON SEQUENCE public.seq_historico TO authenticated;

GRANT ALL ON SEQUENCE public.seq_historico TO service_role;

CREATE SEQUENCE public.seq_itemacertoestoque;

GRANT ALL ON SEQUENCE public.seq_itemacertoestoque TO anon;

GRANT ALL ON SEQUENCE public.seq_itemacertoestoque TO authenticated;

GRANT ALL ON SEQUENCE public.seq_itemacertoestoque TO service_role;

CREATE SEQUENCE public.seq_itemmovimentacao;

GRANT ALL ON SEQUENCE public.seq_itemmovimentacao TO anon;

GRANT ALL ON SEQUENCE public.seq_itemmovimentacao TO authenticated;

GRANT ALL ON SEQUENCE public.seq_itemmovimentacao TO service_role;

CREATE SEQUENCE public.seq_medicacao;

GRANT ALL ON SEQUENCE public.seq_medicacao TO anon;

GRANT ALL ON SEQUENCE public.seq_medicacao TO authenticated;

GRANT ALL ON SEQUENCE public.seq_medicacao TO service_role;

CREATE SEQUENCE public.seq_motivomovimentacao;

GRANT ALL ON SEQUENCE public.seq_motivomovimentacao TO anon;

GRANT ALL ON SEQUENCE public.seq_motivomovimentacao TO authenticated;

GRANT ALL ON SEQUENCE public.seq_motivomovimentacao TO service_role;

CREATE SEQUENCE public.seq_movimentacaoestoque;

GRANT ALL ON SEQUENCE public.seq_movimentacaoestoque TO anon;

GRANT ALL ON SEQUENCE public.seq_movimentacaoestoque TO authenticated;

GRANT ALL ON SEQUENCE public.seq_movimentacaoestoque TO service_role;

CREATE SEQUENCE public.seq_pessoa;

GRANT ALL ON SEQUENCE public.seq_pessoa TO anon;

GRANT ALL ON SEQUENCE public.seq_pessoa TO authenticated;

GRANT ALL ON SEQUENCE public.seq_pessoa TO service_role;

CREATE SEQUENCE public.seq_produto;

GRANT ALL ON SEQUENCE public.seq_produto TO anon;

GRANT ALL ON SEQUENCE public.seq_produto TO authenticated;

GRANT ALL ON SEQUENCE public.seq_produto TO service_role;

CREATE SEQUENCE public.seq_receitamedicamento;

GRANT ALL ON SEQUENCE public.seq_receitamedicamento TO anon;

GRANT ALL ON SEQUENCE public.seq_receitamedicamento TO authenticated;

GRANT ALL ON SEQUENCE public.seq_receitamedicamento TO service_role;

CREATE SEQUENCE public.seq_tipoproduto;

GRANT ALL ON SEQUENCE public.seq_tipoproduto TO anon;

GRANT ALL ON SEQUENCE public.seq_tipoproduto TO authenticated;

GRANT ALL ON SEQUENCE public.seq_tipoproduto TO service_role;

CREATE SEQUENCE public.seq_unidadedemedida;

GRANT ALL ON SEQUENCE public.seq_unidadedemedida TO anon;

GRANT ALL ON SEQUENCE public.seq_unidadedemedida TO authenticated;

GRANT ALL ON SEQUENCE public.seq_unidadedemedida TO service_role;

CREATE SEQUENCE public.seq_vacinacao;

GRANT ALL ON SEQUENCE public.seq_vacinacao TO anon;

GRANT ALL ON SEQUENCE public.seq_vacinacao TO authenticated;

GRANT ALL ON SEQUENCE public.seq_vacinacao TO service_role;

CREATE FUNCTION public.atualizar_data_administracao_customizada()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  IF NEW.administrada = TRUE AND OLD.administrada = FALSE THEN
    NEW.data_administracao = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.atualizar_data_administracao_customizada() TO anon;

GRANT ALL ON FUNCTION public.atualizar_data_administracao_customizada() TO authenticated;

GRANT ALL ON FUNCTION public.atualizar_data_administracao_customizada() TO service_role;

CREATE FUNCTION public.atualizar_doses_aplicadas_protocolo()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  IF NEW.protocolo_idprotocolo IS NOT NULL THEN
    UPDATE protocolo_vacinal
    SET doses_aplicadas = (
      SELECT COUNT(*) FROM vacinacao WHERE protocolo_idprotocolo = NEW.protocolo_idprotocolo
    ),
    status = CASE 
      WHEN (SELECT COUNT(*) FROM vacinacao WHERE protocolo_idprotocolo = NEW.protocolo_idprotocolo) >= total_doses 
      THEN 'concluido' ELSE 'ativo'
    END
    WHERE idprotocolo = NEW.protocolo_idprotocolo;
  END IF;
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.atualizar_doses_aplicadas_protocolo() TO anon;

GRANT ALL ON FUNCTION public.atualizar_doses_aplicadas_protocolo() TO authenticated;

GRANT ALL ON FUNCTION public.atualizar_doses_aplicadas_protocolo() TO service_role;

CREATE FUNCTION public.atualizar_status_agendamedicacao()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  -- Update corresponding schedule to 'aplicada'
  -- Match by receita, medicamento, and approx time (same day) using CTE for precise targeting
  WITH target_agenda AS (
    SELECT idagendamedicacao
    FROM agendamedicacao
    WHERE posologia_receitamedicamento_idreceita = NEW.posologia_receitamedicamento_idreceita
      AND posologia_medicamento_idproduto = NEW.posologia_medicamento_idproduto
      AND animal_idanimal = (SELECT animal_idanimal FROM receitamedicamento WHERE idreceita = NEW.posologia_receitamedicamento_idreceita)
      AND DATE(data) = DATE(NEW.data)
      AND status = 'agendada'
    ORDER BY ABS(EXTRACT(EPOCH FROM (hora::TIME - CAST(NEW.data AS TIME))))
    LIMIT 1
  )
  UPDATE agendamedicacao
  SET status = 'aplicada'
  WHERE idagendamedicacao = (SELECT idagendamedicacao FROM target_agenda);
  
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.atualizar_status_agendamedicacao() TO anon;

GRANT ALL ON FUNCTION public.atualizar_status_agendamedicacao() TO authenticated;

GRANT ALL ON FUNCTION public.atualizar_status_agendamedicacao() TO service_role;

CREATE FUNCTION public.atualizar_status_agendavacinacao()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  UPDATE agendavacinacao
  SET status = 'aplicada'
  WHERE protocolo_idprotocolo = NEW.protocolo_idprotocolo
    AND vacina_idproduto = NEW.idvacina
    AND animal_idanimal = NEW.idanimal
    AND dose_numero = NEW.dose_numero
    AND status = 'agendada';
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.atualizar_status_agendavacinacao() TO anon;

GRANT ALL ON FUNCTION public.atualizar_status_agendavacinacao() TO authenticated;

GRANT ALL ON FUNCTION public.atualizar_status_agendavacinacao() TO service_role;

CREATE FUNCTION public.update_agendamedicacao_timestamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.update_agendamedicacao_timestamp() TO anon;

GRANT ALL ON FUNCTION public.update_agendamedicacao_timestamp() TO authenticated;

GRANT ALL ON FUNCTION public.update_agendamedicacao_timestamp() TO service_role;

CREATE TABLE public.acertoestoque (
  idacerto          integer                DEFAULT nextval('public.seq_acertoestoque'::regclass) NOT NULL,
  data              date                   NOT NULL,
  usuario_pessoa_id integer                NOT NULL,
  motivo            character varying(500) NOT NULL,
  observacao        character varying(500)
);

COMMENT ON TABLE public.acertoestoque IS 'Registra operações de acerto de estoque';

ALTER TABLE public.acertoestoque
  ADD CONSTRAINT acertoestoque_pkey PRIMARY KEY (idacerto);

GRANT ALL ON public.acertoestoque TO anon;

GRANT ALL ON public.acertoestoque TO authenticated;

GRANT ALL ON public.acertoestoque TO service_role;

CREATE TABLE public.adocao (
  idadocao              integer                DEFAULT nextval('public.seq_adocao'::regclass) NOT NULL,
  idadotante            integer                NOT NULL,
  idanimal              integer                NOT NULL,
  dataadocao            date                   NOT NULL,
  pessoa_idpessoa       integer                NOT NULL,
  obs                   character varying(500),
  status_acompanhamento character varying(50),
  data_acompanhamento   date
);

ALTER TABLE public.adocao
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adocao
  ADD CONSTRAINT adocao_pkey PRIMARY KEY (idadocao);

GRANT ALL ON public.adocao TO anon;

GRANT ALL ON public.adocao TO authenticated;

GRANT ALL ON public.adocao TO service_role;

CREATE INDEX idx_adocao_animal ON public.adocao (idanimal);

CREATE POLICY "Permitir tudo para autenticados" ON public.adocao
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.agendamedicacao (
  idagendamedicacao                      integer                     DEFAULT nextval('public.agendamedicacao_idagendamedicacao_seq'::regclass) NOT NULL,
  animal_idanimal                        integer                     NOT NULL,
  medicamento_idproduto                  integer                     NOT NULL,
  receita_idreceita                      integer                     NOT NULL,
  posologia_receitamedicamento_idreceita integer                     NOT NULL,
  posologia_medicamento_idproduto        integer                     NOT NULL,
  dose_numero                            integer                     DEFAULT 1 NOT NULL,
  data                                   date                        NOT NULL,
  hora                                   time without time zone,
  quantidade                             character varying(50),
  status                                 character varying(20)       DEFAULT 'agendada'::character varying NOT NULL,
  observacoes                            text,
  criado_em                              timestamp without time zone DEFAULT now(),
  atualizado_em                          timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.agendamedicacao_idagendamedicacao_seq OWNED BY public.agendamedicacao.idagendamedicacao;

GRANT ALL ON SEQUENCE public.agendamedicacao_idagendamedicacao_seq TO anon;

GRANT ALL ON SEQUENCE public.agendamedicacao_idagendamedicacao_seq TO authenticated;

GRANT ALL ON SEQUENCE public.agendamedicacao_idagendamedicacao_seq TO service_role;

COMMENT ON COLUMN public.agendamedicacao.hora IS 'Hora do agendamento. NULL até a primeira dose ser administrada.';

ALTER TABLE public.agendamedicacao
  ADD CONSTRAINT agendamedicacao_pkey PRIMARY KEY (idagendamedicacao);

ALTER TABLE public.agendamedicacao
  ADD CONSTRAINT agendamedicacao_status_check
    CHECK (status::text = ANY (ARRAY['agendada'::character varying, 'aplicada'::character varying, 'cancelada'::character varying, 'reagendada'::character varying]::text[]));

GRANT ALL ON public.agendamedicacao TO anon;

GRANT ALL ON public.agendamedicacao TO authenticated;

GRANT ALL ON public.agendamedicacao TO service_role;

CREATE INDEX idx_agendamedicacao_receita ON public.agendamedicacao (receita_idreceita);

CREATE INDEX idx_agendamedicacao_status ON public.agendamedicacao (status);

CREATE INDEX idx_agendamedicacao_status_data ON public.agendamedicacao (status, DATA)
  WHERE status::text = 'agendada'::text;

CREATE INDEX idx_agendamedicacao_data ON public.agendamedicacao (DATA);

CREATE INDEX idx_agendamedicacao_animal ON public.agendamedicacao (animal_idanimal);

CREATE TRIGGER trigger_update_agendamedicacao_timestamp
  BEFORE UPDATE ON public.agendamedicacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agendamedicacao_timestamp();

CREATE TABLE public.agendavacinacao (
  idagendavacinacao       integer                 DEFAULT nextval('public.seq_agendavacinacao'::regclass) NOT NULL,
  animal_idanimal         integer                 NOT NULL,
  vacina_idproduto        integer                 NOT NULL,
  data                    date,
  motivo                  character varying(500),
  usuario_pessoa_idpessoa integer                 NOT NULL,
  protocolo_idprotocolo   integer,
  dose_numero             integer                 DEFAULT 1,
  status                  public.status_vacinacao DEFAULT 'agendada'::public.status_vacinacao,
  hora                    time without time zone  DEFAULT '08:00:00'::time WITHOUT time zone
);

COMMENT ON COLUMN public.agendavacinacao.hora IS 'Horário agendado para aplicação da vacina';

ALTER TABLE public.agendavacinacao
  ADD CONSTRAINT agendavacinacao_pkey PRIMARY KEY (idagendavacinacao);

GRANT ALL ON public.agendavacinacao TO anon;

GRANT ALL ON public.agendavacinacao TO authenticated;

GRANT ALL ON public.agendavacinacao TO service_role;

CREATE INDEX idx_agendavacinacao_status_data ON public.agendavacinacao (status, DATA)
  WHERE status = 'agendada'::public.status_vacinacao;

CREATE INDEX idx_agendavacinacao_animal_status ON public.agendavacinacao (animal_idanimal, status);

CREATE TABLE public.animal (
  idanimal       integer                DEFAULT nextval('public.seq_animal'::regclass) NOT NULL,
  nome           character varying(255),
  especie        character varying(100),
  datanascimento date,
  raca           character varying(100),
  porte          character varying(50),
  sexo           character varying(10),
  status         character varying(50),
  dataresgate    date,
  foto           character varying(500),
  castrado       boolean                DEFAULT false,
  cor            character varying(50)
);

ALTER TABLE public.animal
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.animal
  ADD CONSTRAINT animal_pkey PRIMARY KEY (idanimal);

ALTER TABLE public.adocao
  ADD CONSTRAINT adocao_idanimal_fkey FOREIGN KEY (idanimal) REFERENCES public.animal(idanimal);

ALTER TABLE public.agendamedicacao
  ADD CONSTRAINT agendamedicacao_animal_fkey FOREIGN KEY (animal_idanimal) REFERENCES public.animal(idanimal) ON DELETE CASCADE;

ALTER TABLE public.agendavacinacao
  ADD CONSTRAINT agendavacinacao_animal_idanimal_fkey FOREIGN KEY (animal_idanimal) REFERENCES public.animal(idanimal);

GRANT ALL ON public.animal TO anon;

GRANT ALL ON public.animal TO authenticated;

GRANT ALL ON public.animal TO service_role;

CREATE POLICY "Permitir tudo para autenticados" ON public.animal
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.estoque (
  idestoque  integer       DEFAULT nextval('public.seq_estoque'::regclass) NOT NULL,
  idproduto  integer       NOT NULL,
  quantidade numeric(10,2) NOT NULL
);

ALTER TABLE public.estoque
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.estoque
  ADD CONSTRAINT estoque_pkey PRIMARY KEY (idestoque);

GRANT ALL ON public.estoque TO anon;

GRANT ALL ON public.estoque TO authenticated;

GRANT ALL ON public.estoque TO service_role;

CREATE POLICY "Permitir tudo para autenticados" ON public.estoque
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.evento (
  idevento        integer                DEFAULT nextval('public.seq_evento'::regclass) NOT NULL,
  descricao       character varying(500),
  data            date,
  foto            character varying(500),
  animal_idanimal integer                NOT NULL,
  local           character varying(255),
  responsavel     character varying(255),
  status          character varying(50)
);

ALTER TABLE public.evento
  ADD CONSTRAINT evento_animal_idanimal_fkey FOREIGN KEY (animal_idanimal) REFERENCES public.animal(idanimal);

ALTER TABLE public.evento
  ADD CONSTRAINT evento_pkey PRIMARY KEY (idevento);

GRANT ALL ON public.evento TO anon;

GRANT ALL ON public.evento TO authenticated;

GRANT ALL ON public.evento TO service_role;

CREATE TABLE public.historico (
  idhistorico           integer                     DEFAULT nextval('public.seq_historico'::regclass) NOT NULL,
  descricao             character varying(1000)     NOT NULL,
  data                  timestamp without time zone,
  animal_idanimal       integer                     NOT NULL,
  vacinacao_idvacinacao integer,
  medicacao_idmedicacao integer
);

ALTER TABLE public.historico
  ADD CONSTRAINT historico_animal_idanimal_fkey FOREIGN KEY (animal_idanimal) REFERENCES public.animal(idanimal);

ALTER TABLE public.historico
  ADD CONSTRAINT historico_pkey PRIMARY KEY (idhistorico);

GRANT ALL ON public.historico TO anon;

GRANT ALL ON public.historico TO authenticated;

GRANT ALL ON public.historico TO service_role;

CREATE INDEX idx_historico_animal_data ON public.historico (animal_idanimal, DATA DESC);

CREATE TABLE public.itemacertoestoque (
  iditem            integer               DEFAULT nextval('public.seq_itemacertoestoque'::regclass) NOT NULL,
  acerto_id         integer               NOT NULL,
  produto_id        integer               NOT NULL,
  quantidade_antes  numeric(10,2)         NOT NULL,
  quantidade_depois numeric(10,2)         NOT NULL,
  tipoajuste        character varying(10) NOT NULL
);

COMMENT ON TABLE public.itemacertoestoque IS 'Detalhes dos produtos envolvidos em cada acerto de estoque';

ALTER TABLE public.itemacertoestoque
  ADD CONSTRAINT chk_tipoajuste CHECK (tipoajuste::text = ANY (ARRAY['ENTRADA'::character varying, 'SAIDA'::character varying]::text[]));

ALTER TABLE public.itemacertoestoque
  ADD CONSTRAINT itemacertoestoque_acerto_id_fkey FOREIGN KEY (acerto_id) REFERENCES public.acertoestoque(idacerto);

ALTER TABLE public.itemacertoestoque
  ADD CONSTRAINT itemacertoestoque_pkey PRIMARY KEY (iditem);

GRANT ALL ON public.itemacertoestoque TO anon;

GRANT ALL ON public.itemacertoestoque TO authenticated;

GRANT ALL ON public.itemacertoestoque TO service_role;

CREATE TABLE public.itemmovimentacao (
  iditem                integer       DEFAULT nextval('public.seq_itemmovimentacao'::regclass) NOT NULL,
  movimentacao_id       integer       NOT NULL,
  produto_id            integer       NOT NULL,
  quantidade            numeric(10,2) NOT NULL,
  motivomovimentacao_id integer
);

COMMENT ON TABLE public.itemmovimentacao IS 'Itens de produtos envolvidos em cada movimentação';

ALTER TABLE public.itemmovimentacao
  ADD CONSTRAINT itemmovimentacao_pkey PRIMARY KEY (iditem);

GRANT ALL ON public.itemmovimentacao TO anon;

GRANT ALL ON public.itemmovimentacao TO authenticated;

GRANT ALL ON public.itemmovimentacao TO service_role;

CREATE TABLE public.medicacao (
  idmedicacao                            integer                     DEFAULT nextval('public.seq_medicacao'::regclass) NOT NULL,
  idanimal                               integer                     NOT NULL,
  idhistorico                            integer                     NOT NULL,
  posologia_medicamento_idproduto        integer                     NOT NULL,
  posologia_receitamedicamento_idreceita integer,
  data                                   timestamp without time zone,
  quantidade_administrada                numeric(10,2),
  criado_em                              timestamp without time zone DEFAULT now(),
  atualizado_em                          timestamp without time zone DEFAULT now()
);

COMMENT ON COLUMN public.medicacao.posologia_receitamedicamento_idreceita IS 'ID da receita médica. NULL para medicações sem prescrição.';

COMMENT ON COLUMN public.medicacao.quantidade_administrada IS 'Quantidade exata do medicamento que foi administrada na aplicação.';

ALTER TABLE public.medicacao
  ADD CONSTRAINT medicacao_idanimal_fkey FOREIGN KEY (idanimal) REFERENCES public.animal(idanimal);

ALTER TABLE public.medicacao
  ADD CONSTRAINT medicacao_idhistorico_fkey FOREIGN KEY (idhistorico) REFERENCES public.historico(idhistorico);

ALTER TABLE public.medicacao
  ADD CONSTRAINT medicacao_pkey PRIMARY KEY (idmedicacao);

ALTER TABLE public.historico
  ADD CONSTRAINT historico_medicacao_idmedicacao_fkey FOREIGN KEY (medicacao_idmedicacao) REFERENCES public.medicacao(idmedicacao);

GRANT ALL ON public.medicacao TO anon;

GRANT ALL ON public.medicacao TO authenticated;

GRANT ALL ON public.medicacao TO service_role;

CREATE INDEX idx_medicacao_animal ON public.medicacao (idanimal);

CREATE INDEX idx_medicacao_posologia ON public.medicacao (posologia_medicamento_idproduto, posologia_receitamedicamento_idreceita);

CREATE TRIGGER trigger_atualizar_agendamedicacao
  AFTER INSERT ON public.medicacao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_status_agendamedicacao();

CREATE TABLE public.medicamento (
  idproduto  integer               NOT NULL,
  composicao character varying(50) NOT NULL
);

ALTER TABLE public.medicamento
  ADD CONSTRAINT medicamento_pkey PRIMARY KEY (idproduto);

ALTER TABLE public.agendamedicacao
  ADD CONSTRAINT agendamedicacao_medicamento_fkey FOREIGN KEY (medicamento_idproduto) REFERENCES public.medicamento(idproduto) ON DELETE RESTRICT;

ALTER TABLE public.medicacao
  ADD CONSTRAINT medicacao_posologia_medicamento_idproduto_fkey FOREIGN KEY (posologia_medicamento_idproduto) REFERENCES public.medicamento(idproduto);

GRANT ALL ON public.medicamento TO anon;

GRANT ALL ON public.medicamento TO authenticated;

GRANT ALL ON public.medicamento TO service_role;

CREATE TABLE public.motivomovimentacao (
  idmotivo  integer                DEFAULT nextval('public.seq_motivomovimentacao'::regclass) NOT NULL,
  descricao character varying(255) NOT NULL,
  tipo      character varying(10)  NOT NULL
);

COMMENT ON TABLE public.motivomovimentacao IS 'Categoriza os motivos de entrada e saída de produtos';

ALTER TABLE public.motivomovimentacao
  ADD CONSTRAINT chk_tipomotivo CHECK (tipo::text = ANY (ARRAY['AMBOS'::character varying, 'ENTRADA'::character varying, 'SAIDA'::character varying]::text[]));

ALTER TABLE public.motivomovimentacao
  ADD CONSTRAINT motivomovimentacao_pkey PRIMARY KEY (idmotivo);

ALTER TABLE public.itemmovimentacao
  ADD CONSTRAINT itemmovimentacao_motivomovimentacao_id_fkey FOREIGN KEY (motivomovimentacao_id) REFERENCES public.motivomovimentacao(idmotivo);

GRANT ALL ON public.motivomovimentacao TO anon;

GRANT ALL ON public.motivomovimentacao TO authenticated;

GRANT ALL ON public.motivomovimentacao TO service_role;

CREATE TABLE public.movimentacaoestoque (
  idmovimentacao    integer                DEFAULT nextval('public.seq_movimentacaoestoque'::regclass) NOT NULL,
  tipomovimentacao  character varying(10)  NOT NULL,
  data              date                   NOT NULL,
  usuario_pessoa_id integer                NOT NULL,
  obs               character varying(500),
  fornecedor        character varying(20)
);

COMMENT ON TABLE public.movimentacaoestoque IS 'Registra todas as movimentações de estoque (entradas e saídas)';

ALTER TABLE public.movimentacaoestoque
  ADD CONSTRAINT chk_tipomovimento CHECK (tipomovimentacao::text = ANY (ARRAY['ENTRADA'::character varying, 'SAIDA'::character varying]::text[]));

ALTER TABLE public.movimentacaoestoque
  ADD CONSTRAINT movimentacaoestoque_pkey PRIMARY KEY (idmovimentacao);

ALTER TABLE public.itemmovimentacao
  ADD CONSTRAINT itemmovimentacao_movimentacao_id_fkey FOREIGN KEY (movimentacao_id) REFERENCES public.movimentacaoestoque(idmovimentacao);

GRANT ALL ON public.movimentacaoestoque TO anon;

GRANT ALL ON public.movimentacaoestoque TO authenticated;

GRANT ALL ON public.movimentacaoestoque TO service_role;

CREATE TABLE public.pessoa (
  idpessoa integer                DEFAULT nextval('public.seq_pessoa'::regclass) NOT NULL,
  nome     character varying(255) NOT NULL,
  cpf      character varying(14)  NOT NULL,
  endereco character varying(500),
  telefone character varying(20),
  email    character varying(255)
);

ALTER TABLE public.pessoa
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pessoa
  ADD CONSTRAINT pessoa_cpf_key UNIQUE (cpf);

ALTER TABLE public.pessoa
  ADD CONSTRAINT pessoa_pkey PRIMARY KEY (idpessoa);

ALTER TABLE public.adocao
  ADD CONSTRAINT adocao_pessoa_idpessoa_fkey FOREIGN KEY (pessoa_idpessoa) REFERENCES public.pessoa(idpessoa);

GRANT ALL ON public.pessoa TO anon;

GRANT ALL ON public.pessoa TO authenticated;

GRANT ALL ON public.pessoa TO service_role;

CREATE POLICY "Permitir tudo para autenticados" ON public.pessoa
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.posologia (
  dose                         character varying(50)      NOT NULL,
  quantidadedias               integer,
  intervalohoras               integer,
  frequencia_diaria            integer,
  medicamento_idproduto        integer                    NOT NULL,
  receitamedicamento_idreceita integer                    NOT NULL,
  tipo_posologia               public.tipo_posologia_enum DEFAULT 'padrao'::public.tipo_posologia_enum NOT NULL,
  observacoes                  character varying(500),
  hora_primeira_dose           time without time zone,
  horarios_calculados          boolean                    DEFAULT false
);

ALTER TABLE public.agendamedicacao
  ADD CONSTRAINT agendamedicacao_posologia_fkey FOREIGN KEY (posologia_receitamedicamento_idreceita, posologia_medicamento_idproduto)
    REFERENCES public.posologia(receitamedicamento_idreceita, medicamento_idproduto) ON DELETE CASCADE;

COMMENT ON COLUMN public.posologia.hora_primeira_dose IS 'Hora em que a primeira dose foi administrada. Usada para calcular os próximos horários.';

COMMENT ON COLUMN public.posologia.horarios_calculados IS 'Indica se os horários dos agendamentos já foram calculados com base na primeira dose.';

ALTER TABLE public.posologia
  ADD CONSTRAINT posologia_medicamento_idproduto_fkey FOREIGN KEY (medicamento_idproduto) REFERENCES public.medicamento(idproduto);

ALTER TABLE public.posologia
  ADD CONSTRAINT posologia_pkey PRIMARY KEY (medicamento_idproduto, receitamedicamento_idreceita);

GRANT ALL ON public.posologia TO anon;

GRANT ALL ON public.posologia TO authenticated;

GRANT ALL ON public.posologia TO service_role;

CREATE TABLE public.posologia_customizada (
  idposologia_custom                     integer                  DEFAULT nextval('public.posologia_customizada_idposologia_custom_seq'::regclass) NOT NULL,
  posologia_receitamedicamento_idreceita integer                  NOT NULL,
  posologia_medicamento_idproduto        integer                  NOT NULL,
  data_programada                        date                     NOT NULL,
  horario                                time without time zone   NOT NULL,
  quantidade                             numeric(10,2)            NOT NULL,
  observacao                             character varying(200),
  administrada                           boolean                  DEFAULT false,
  data_administracao                     timestamp with time zone,
  criado_em                              timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.posologia_customizada_idposologia_custom_seq OWNED BY public.posologia_customizada.idposologia_custom;

GRANT ALL ON SEQUENCE public.posologia_customizada_idposologia_custom_seq TO anon;

GRANT ALL ON SEQUENCE public.posologia_customizada_idposologia_custom_seq TO authenticated;

GRANT ALL ON SEQUENCE public.posologia_customizada_idposologia_custom_seq TO service_role;

ALTER TABLE public.posologia_customizada
  ADD CONSTRAINT posologia_customizada_pkey PRIMARY KEY (idposologia_custom);

ALTER TABLE public.posologia_customizada
  ADD CONSTRAINT posologia_customizada_posologia_fkey FOREIGN KEY (posologia_receitamedicamento_idreceita, posologia_medicamento_idproduto)
    REFERENCES public.posologia(receitamedicamento_idreceita, medicamento_idproduto) ON DELETE CASCADE;

ALTER TABLE public.posologia_customizada
  ADD CONSTRAINT posologia_customizada_quantidade_check CHECK (quantidade > 0::numeric);

GRANT ALL ON public.posologia_customizada TO anon;

GRANT ALL ON public.posologia_customizada TO authenticated;

GRANT ALL ON public.posologia_customizada TO service_role;

CREATE INDEX idx_posologia_customizada_posologia ON public.posologia_customizada (posologia_receitamedicamento_idreceita, posologia_medicamento_idproduto);

CREATE INDEX idx_posologia_customizada_pendentes ON public.posologia_customizada (administrada)
  WHERE administrada = false;

CREATE INDEX idx_posologia_customizada_data ON public.posologia_customizada (data_programada);

CREATE TABLE public.produto (
  idproduto       integer                DEFAULT nextval('public.seq_produto'::regclass) NOT NULL,
  nome            character varying(255) NOT NULL,
  idtipoproduto   integer                NOT NULL,
  idunidademedida integer                NOT NULL,
  fabricante      character varying(255),
  preco           numeric(10,2),
  estoque_minimo  integer                DEFAULT 0,
  data_cadastro   date                   DEFAULT CURRENT_DATE,
  ativo           boolean                DEFAULT true
);

ALTER TABLE public.produto
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.produto
  ADD CONSTRAINT produto_pkey PRIMARY KEY (idproduto);

ALTER TABLE public.estoque
  ADD CONSTRAINT estoque_idproduto_fkey FOREIGN KEY (idproduto) REFERENCES public.produto(idproduto);

ALTER TABLE public.itemacertoestoque
  ADD CONSTRAINT itemacertoestoque_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produto(idproduto);

ALTER TABLE public.itemmovimentacao
  ADD CONSTRAINT itemmovimentacao_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.produto(idproduto);

ALTER TABLE public.medicamento
  ADD CONSTRAINT medicamento_idproduto_fkey FOREIGN KEY (idproduto) REFERENCES public.produto(idproduto);

GRANT ALL ON public.produto TO anon;

GRANT ALL ON public.produto TO authenticated;

GRANT ALL ON public.produto TO service_role;

CREATE POLICY "Permitir tudo para autenticados" ON public.produto
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.protocolo_vacinal (
  idprotocolo          integer                       DEFAULT nextval('public.protocolo_vacinal_idprotocolo_seq'::regclass) NOT NULL,
  animal_idanimal      integer                       NOT NULL,
  vacina_idproduto     integer                       NOT NULL,
  tipo_protocolo       public.tipo_protocolo_vacinal DEFAULT 'dose_unica'::public.tipo_protocolo_vacinal NOT NULL,
  total_doses          integer                       DEFAULT 1,
  intervalo_dias       integer,
  data_inicio          date                          NOT NULL,
  data_proximo_reforco date,
  doses_aplicadas      integer                       DEFAULT 0,
  status               character varying(20)         DEFAULT 'ativo'::character varying,
  observacoes          character varying(500),
  criado_em            timestamp without time zone   DEFAULT now(),
  usuario_idpessoa     integer
);

ALTER SEQUENCE public.protocolo_vacinal_idprotocolo_seq OWNED BY public.protocolo_vacinal.idprotocolo;

GRANT ALL ON SEQUENCE public.protocolo_vacinal_idprotocolo_seq TO anon;

GRANT ALL ON SEQUENCE public.protocolo_vacinal_idprotocolo_seq TO authenticated;

GRANT ALL ON SEQUENCE public.protocolo_vacinal_idprotocolo_seq TO service_role;

COMMENT ON TABLE public.protocolo_vacinal IS 'Protocolos de vacinação com agendamento de doses';

ALTER TABLE public.protocolo_vacinal
  ADD CONSTRAINT protocolo_vacinal_animal_idanimal_fkey FOREIGN KEY (animal_idanimal) REFERENCES public.animal(idanimal);

ALTER TABLE public.protocolo_vacinal
  ADD CONSTRAINT protocolo_vacinal_pkey PRIMARY KEY (idprotocolo);

ALTER TABLE public.agendavacinacao
  ADD CONSTRAINT agendavacinacao_protocolo_idprotocolo_fkey FOREIGN KEY (protocolo_idprotocolo) REFERENCES public.protocolo_vacinal(idprotocolo);

GRANT ALL ON public.protocolo_vacinal TO anon;

GRANT ALL ON public.protocolo_vacinal TO authenticated;

GRANT ALL ON public.protocolo_vacinal TO service_role;

CREATE INDEX idx_protocolo_vacina ON public.protocolo_vacinal (vacina_idproduto);

CREATE INDEX idx_protocolo_status ON public.protocolo_vacinal (status);

CREATE INDEX idx_protocolo_animal ON public.protocolo_vacinal (animal_idanimal);

CREATE TABLE public.receitamedicamento (
  idreceita       integer                     DEFAULT nextval('public.seq_receitamedicamento'::regclass) NOT NULL,
  data            date,
  medico          character varying(255),
  clinica         character varying(255),
  animal_idanimal integer                     NOT NULL,
  status          character varying(20)       DEFAULT 'ATIVA'::character varying NOT NULL,
  hora_inicio     time without time zone      DEFAULT '08:00:00'::time WITHOUT time zone,
  criado_em       timestamp without time zone DEFAULT now(),
  atualizado_em   timestamp without time zone DEFAULT now()
);

COMMENT ON COLUMN public.receitamedicamento.status IS 'Status da receita (ATIVA, CONCLUIDA)';

ALTER TABLE public.receitamedicamento
  ADD CONSTRAINT receitamedicamento_animal_idanimal_fkey FOREIGN KEY (animal_idanimal) REFERENCES public.animal(idanimal);

ALTER TABLE public.receitamedicamento
  ADD CONSTRAINT receitamedicamento_pkey PRIMARY KEY (idreceita);

ALTER TABLE public.agendamedicacao
  ADD CONSTRAINT agendamedicacao_receita_fkey FOREIGN KEY (receita_idreceita) REFERENCES public.receitamedicamento(idreceita) ON DELETE CASCADE;

ALTER TABLE public.medicacao
  ADD CONSTRAINT medicacao_posologia_receitamedicamento_idreceita_fkey FOREIGN KEY (posologia_receitamedicamento_idreceita) REFERENCES public.receitamedicamento(idreceita);

ALTER TABLE public.posologia
  ADD CONSTRAINT posologia_receitamedicamento_idreceita_fkey FOREIGN KEY (receitamedicamento_idreceita) REFERENCES public.receitamedicamento(idreceita);

GRANT ALL ON public.receitamedicamento TO anon;

GRANT ALL ON public.receitamedicamento TO authenticated;

GRANT ALL ON public.receitamedicamento TO service_role;

CREATE TABLE public.tipoproduto (
  idtipoproduto integer                DEFAULT nextval('public.seq_tipoproduto'::regclass) NOT NULL,
  descricao     character varying(255) NOT NULL
);

ALTER TABLE public.tipoproduto
  ADD CONSTRAINT tipoproduto_pkey PRIMARY KEY (idtipoproduto);

ALTER TABLE public.produto
  ADD CONSTRAINT produto_idtipoproduto_fkey FOREIGN KEY (idtipoproduto) REFERENCES public.tipoproduto(idtipoproduto);

GRANT ALL ON public.tipoproduto TO anon;

GRANT ALL ON public.tipoproduto TO authenticated;

GRANT ALL ON public.tipoproduto TO service_role;

CREATE TABLE public.unidadedemedida (
  idunidademedida integer                DEFAULT nextval('public.seq_unidadedemedida'::regclass) NOT NULL,
  descricao       character varying(255) NOT NULL,
  sigla           character varying(10)
);

ALTER TABLE public.unidadedemedida
  ADD CONSTRAINT unidadedemedida_pkey PRIMARY KEY (idunidademedida);

ALTER TABLE public.produto
  ADD CONSTRAINT produto_idunidademedida_fkey FOREIGN KEY (idunidademedida) REFERENCES public.unidadedemedida(idunidademedida);

GRANT ALL ON public.unidadedemedida TO anon;

GRANT ALL ON public.unidadedemedida TO authenticated;

GRANT ALL ON public.unidadedemedida TO service_role;

CREATE TABLE public.usuario (
  login           character varying(50),
  senha           character varying(255),
  pessoa_idpessoa integer                NOT NULL
);

ALTER TABLE public.usuario
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_pessoa_idpessoa_fkey FOREIGN KEY (pessoa_idpessoa) REFERENCES public.pessoa(idpessoa);

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_pkey PRIMARY KEY (pessoa_idpessoa);

ALTER TABLE public.acertoestoque
  ADD CONSTRAINT acertoestoque_usuario_pessoa_id_fkey FOREIGN KEY (usuario_pessoa_id) REFERENCES public.usuario(pessoa_idpessoa);

ALTER TABLE public.agendavacinacao
  ADD CONSTRAINT agendavacinacao_usuario_pessoa_idpessoa_fkey FOREIGN KEY (usuario_pessoa_idpessoa) REFERENCES public.usuario(pessoa_idpessoa);

ALTER TABLE public.movimentacaoestoque
  ADD CONSTRAINT movimentacaoestoque_usuario_pessoa_id_fkey FOREIGN KEY (usuario_pessoa_id) REFERENCES public.usuario(pessoa_idpessoa);

ALTER TABLE public.protocolo_vacinal
  ADD CONSTRAINT protocolo_vacinal_usuario_idpessoa_fkey FOREIGN KEY (usuario_idpessoa) REFERENCES public.usuario(pessoa_idpessoa);

GRANT ALL ON public.usuario TO anon;

GRANT ALL ON public.usuario TO authenticated;

GRANT ALL ON public.usuario TO service_role;

CREATE POLICY "Permitir tudo para autenticados" ON public.usuario
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.vacina (
  idproduto integer               NOT NULL,
  lote      character varying(50) NOT NULL,
  validade  date                  NOT NULL
);

ALTER TABLE public.vacina
  ADD CONSTRAINT vacina_idproduto_fkey FOREIGN KEY (idproduto) REFERENCES public.produto(idproduto);

ALTER TABLE public.vacina
  ADD CONSTRAINT vacina_pkey PRIMARY KEY (idproduto);

ALTER TABLE public.agendavacinacao
  ADD CONSTRAINT agendavacinacao_vacina_idproduto_fkey FOREIGN KEY (vacina_idproduto) REFERENCES public.vacina(idproduto);

ALTER TABLE public.protocolo_vacinal
  ADD CONSTRAINT protocolo_vacinal_vacina_idproduto_fkey FOREIGN KEY (vacina_idproduto) REFERENCES public.vacina(idproduto);

GRANT ALL ON public.vacina TO anon;

GRANT ALL ON public.vacina TO authenticated;

GRANT ALL ON public.vacina TO service_role;

CREATE TABLE public.vacinacao (
  idvacinacao           integer                     DEFAULT nextval('public.seq_vacinacao'::regclass) NOT NULL,
  idvacina              integer                     NOT NULL,
  idanimal              integer                     NOT NULL,
  idhistorico           integer                     NOT NULL,
  data                  date,
  local                 character varying(255),
  protocolo_idprotocolo integer,
  dose_numero           integer                     DEFAULT 1,
  status                public.status_vacinacao     DEFAULT 'aplicada'::public.status_vacinacao,
  origem                public.origem_vacinacao     DEFAULT 'ong'::public.origem_vacinacao,
  aplicada_em           timestamp without time zone DEFAULT now(),
  observacoes           character varying(500),
  criado_em             timestamp without time zone DEFAULT now(),
  atualizado_em         timestamp without time zone DEFAULT now()
);

ALTER TABLE public.vacinacao
  ADD CONSTRAINT vacinacao_idanimal_fkey FOREIGN KEY (idanimal) REFERENCES public.animal(idanimal);

ALTER TABLE public.vacinacao
  ADD CONSTRAINT vacinacao_idvacina_fkey FOREIGN KEY (idvacina) REFERENCES public.vacina(idproduto);

ALTER TABLE public.vacinacao
  ADD CONSTRAINT vacinacao_pkey PRIMARY KEY (idvacinacao);

ALTER TABLE public.historico
  ADD CONSTRAINT historico_vacinacao_idvacinacao_fkey FOREIGN KEY (vacinacao_idvacinacao) REFERENCES public.vacinacao(idvacinacao);

ALTER TABLE public.vacinacao
  ADD CONSTRAINT vacinacao_protocolo_idprotocolo_fkey FOREIGN KEY (protocolo_idprotocolo) REFERENCES public.protocolo_vacinal(idprotocolo);

GRANT ALL ON public.vacinacao TO anon;

GRANT ALL ON public.vacinacao TO authenticated;

GRANT ALL ON public.vacinacao TO service_role;

CREATE INDEX idx_vacinacao_protocolo ON public.vacinacao (protocolo_idprotocolo);

CREATE INDEX idx_vacinacao_animal ON public.vacinacao (idanimal);

CREATE TRIGGER trigger_atualizar_agendavacinacao
  AFTER INSERT ON public.vacinacao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_status_agendavacinacao();

CREATE TRIGGER trigger_atualizar_doses_protocolo
  AFTER INSERT ON public.vacinacao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_doses_aplicadas_protocolo();
