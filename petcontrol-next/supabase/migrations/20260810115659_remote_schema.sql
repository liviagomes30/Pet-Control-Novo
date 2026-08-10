-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

ALTER TABLE public.agendamedicacao
  DROP CONSTRAINT agendamedicacao_status_check;

ALTER TABLE public.itemacertoestoque
  DROP CONSTRAINT chk_tipoajuste;

ALTER TABLE public.motivomovimentacao
  DROP CONSTRAINT chk_tipomotivo;

ALTER TABLE public.movimentacaoestoque
  DROP CONSTRAINT chk_tipomovimento;

ALTER ROLE postgres SET createrole_self_grant TO SET, INHERIT;

CREATE OR REPLACE FUNCTION public.atualizar_data_administracao_customizada()
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

CREATE OR REPLACE FUNCTION public.atualizar_doses_aplicadas_protocolo()
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

CREATE OR REPLACE FUNCTION public.atualizar_status_agendamedicacao()
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

CREATE OR REPLACE FUNCTION public.atualizar_status_agendavacinacao()
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

CREATE OR REPLACE FUNCTION public.update_agendamedicacao_timestamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$function$;

ALTER TABLE public.agendamedicacao
  ADD CONSTRAINT agendamedicacao_status_check
    CHECK (status::text = ANY (ARRAY['agendada'::character varying, 'aplicada'::character varying, 'cancelada'::character varying, 'reagendada'::character varying]::text[]));

ALTER TABLE public.itemacertoestoque
  ADD CONSTRAINT chk_tipoajuste CHECK (tipoajuste::text = ANY (ARRAY['ENTRADA'::character varying, 'SAIDA'::character varying]::text[]));

ALTER TABLE public.motivomovimentacao
  ADD CONSTRAINT chk_tipomotivo CHECK (tipo::text = ANY (ARRAY['AMBOS'::character varying, 'ENTRADA'::character varying, 'SAIDA'::character varying]::text[]));

ALTER TABLE public.movimentacaoestoque
  ADD CONSTRAINT chk_tipomovimento CHECK (tipomovimentacao::text = ANY (ARRAY['ENTRADA'::character varying, 'SAIDA'::character varying]::text[]));
