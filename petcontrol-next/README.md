# petcontrol-next

Reescrita do sistema de gestão da ONG SalvaCão (Pet Control) em Next.js 16 (App Router + Server Actions), React 19 e Supabase (Postgres + Auth).

## Stack

- Next.js 16 / React 19 (Server Components + Server Actions)
- Supabase (Postgres, Auth) via `@supabase/ssr`
- react-hook-form + Zod para validação de formulários
- shadcn/ui + Tailwind CSS
- TanStack Query (client-side, quando necessário)

## Requisitos

- Node.js 20+
- Um projeto Supabase (URL + chave anônima)

## Setup

```bash
npm install
```

Crie `.env.local` na raiz de `petcontrol-next` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave-anonima>
```

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run lint     # ESLint
```

## Estrutura

Organização por feature (vertical slices) dentro de `app/`:

```
app/(auth)/login/           # autenticação
app/(dashboard)/            # área autenticada — layout.tsx checa sessão
  animais/_actions/         # Server Actions do módulo
  animais/_components/
  animais/_schemas/         # validação Zod
lib/auth/require-user.ts    # guarda de autenticação para toda Server Action
lib/actions/result.ts       # contrato único de retorno (ActionResult<T>)
lib/domain/                 # lógica de domínio pura (datas locais, etc.)
```

Toda Server Action de leitura/escrita começa chamando `requireUser()` (definido
em `lib/auth/require-user.ts`) e retorna `ActionResult<T>` (`lib/actions/result.ts`).
O `middleware.ts` na raiz cobre a navegação, mas a guarda na action é a camada
que realmente importa — Server Actions são endpoints HTTP públicos.

## Limitação conhecida: schema do banco

O schema real vive no painel do Supabase. O único SQL versionado
(`../Salvacao-Back-Antigo/.../petcontrol.sql`) é do sistema legado e **não**
inclui tabelas usadas por este projeto (`agendamedicacao`,
`posologia_customizada`, `protocolo_vacinal`, entre outras). Antes de recriar o
ambiente do zero, rode `supabase db pull` contra o projeto real e versione o
resultado em `supabase/migrations/`.

`lib/database.types.ts` foi escrito manualmente a partir do SQL legado e está
desatualizado em relação ao banco em uso — sirva-se dele com cautela até os
tipos serem gerados via `supabase gen types typescript`.

## Banco de dados, backup e keep-alive

Decisão registrada: continuar no **Supabase, plano Free**, para o perfil desta
ONG (~10 voluntários, uso esporádico, volume de dados pequeno) — trocar de
banco neste estágio custaria semanas de retrabalho (151 chamadas PostgREST,
auth, RLS planejado) para resolver um problema que este projeto não tem.

Os dois riscos reais do Free tier (pausa por inatividade e ausência de backup
automático) são cobertos por duas GitHub Actions já configuradas
(`.github/workflows/backup-supabase.yml` e `keepalive-supabase.yml`).
Setup dos secrets, teste de restauração e o passo de `supabase db pull` que
falta rodar contra o projeto real: **[`docs/backup-e-restauracao.md`](../docs/backup-e-restauracao.md)**.
