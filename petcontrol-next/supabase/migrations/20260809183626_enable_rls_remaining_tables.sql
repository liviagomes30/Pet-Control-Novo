-- P0 crítico: 19 das 25 tabelas de public foram criadas sem Row Level
-- Security. Toda tabela do projeto já tem GRANT ALL para a role `anon`
-- (padrão do Supabase) — sem RLS, isso deixa a tabela inteira legível e
-- gravável por qualquer pessoa com a chave anônima (pública, embutida no
-- bundle do navegador), sem login algum, direto pela API REST do Supabase,
-- contornando o requireUser() da aplicação Next.js.
--
-- Mesma política já usada nas 6 tabelas que tinham RLS (adocao, animal,
-- estoque, pessoa, produto, usuario): sem multi-tenancy e com ~10
-- voluntários conhecidos, "qualquer autenticado pode tudo" é suficiente.
-- A role `anon` continua com GRANT a nível de tabela (necessário para o
-- PostgREST expor a tabela), mas sem nenhuma policy para `anon`, RLS
-- devolve zero linhas para quem não estiver autenticado.

ALTER TABLE public.acertoestoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.acertoestoque
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.agendamedicacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.agendamedicacao
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.agendavacinacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.agendavacinacao
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.evento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.evento
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.historico
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.itemacertoestoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.itemacertoestoque
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.itemmovimentacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.itemmovimentacao
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.medicacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.medicacao
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.medicamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.medicamento
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.motivomovimentacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.motivomovimentacao
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.movimentacaoestoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.movimentacaoestoque
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.posologia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.posologia
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.posologia_customizada ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.posologia_customizada
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.protocolo_vacinal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.protocolo_vacinal
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.receitamedicamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.receitamedicamento
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.tipoproduto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.tipoproduto
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.unidadedemedida ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.unidadedemedida
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.vacina ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.vacina
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.vacinacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para autenticados" ON public.vacinacao
  TO authenticated
  USING (true)
  WITH CHECK (true);
