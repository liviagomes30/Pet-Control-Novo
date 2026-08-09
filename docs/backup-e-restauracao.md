# Backup, keep-alive e migrations do Supabase

Este documento cobre a operação de infraestrutura decidida para a entrega à
ONG: por que existe, o que configurar uma única vez, e como restaurar um
backup em caso de emergência. Escrito para quem administra a conta, não
precisa ser desenvolvedor para seguir os passos de restauração.

## Por que isso existe

O plano Free do Supabase (recomendado para esta ONG — ver decisão registrada
na revisão do projeto) tem duas lacunas que a rotina abaixo cobre:

1. **Sem backup automático.** Um erro humano (`DELETE` sem `WHERE`) ou perda
   de acesso à conta apaga os dados sem volta.
2. **Pausa após ~7 dias de inatividade.** Um recesso prolongado pausa o
   projeto até alguém entrar no painel e clicar em restaurar.

Duas GitHub Actions resolvem isso sem custo:

- `.github/workflows/backup-supabase.yml` — toda segunda-feira, gera um
  `pg_dump` do schema `public`, criptografa (AES-256) e publica como
  [Release](../../releases) do repositório.
- `.github/workflows/keepalive-supabase.yml` — a cada 3 dias, faz uma
  consulta leve à API do Supabase só para o projeto não pausar.

## Configuração única (fazer antes da entrega)

### 1. Secrets do repositório

Em **GitHub → Settings → Secrets and variables → Actions → New repository
secret**, criar quatro secrets:

| Secret | Onde encontrar | Usado por |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | keep-alive |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key | keep-alive |
| `SUPABASE_DB_URL` | Supabase Dashboard → Settings → Database → Connection string → **Session pooler** (modo *Session*, não *Transaction*) | backup |
| `BACKUP_ENCRYPTION_PASSPHRASE` | Uma senha forte gerada agora (ex: `openssl rand -base64 32`) e guardada **também** no gerenciador de senhas da ONG | backup |

> **Por que "Session pooler" e não a conexão direta:** a conexão direta do
> Supabase é IPv6-only em muitos projetos, e os runners do GitHub Actions nem
> sempre têm saída IPv6. O pooler em modo *Session* funciona por IPv4 e é
> seguro para `pg_dump` (o modo *Transaction* não é — quebra em comandos que
> o `pg_dump` usa).

> **Guarde a `BACKUP_ENCRYPTION_PASSPHRASE` em um segundo lugar além do
> GitHub.** Se ela se perder, os backups antigos ficam permanentemente
> ilegíveis — a Release continua existindo, mas o conteúdo não.

### 2. Repositório precisa ser privado

Os backups contêm dados pessoais (CPF, telefone, e-mail de adotantes e
voluntários). Mesmo criptografados, confirme em **Settings → General** que o
repositório está como **Private**.

### 3. Testar antes de confiar

Depois de configurar os secrets:

1. Rode os dois workflows manualmente: **Actions → (nome do workflow) → Run
   workflow**.
2. Confira que o backup apareceu em **Releases** com um arquivo
   `.sql.gz.gpg`.
3. **Faça uma restauração de teste** (passo a passo abaixo) num Postgres
   local. Um backup nunca testado não é um backup.

## Como restaurar um backup (emergência)

Pré-requisito: `gpg` instalado (`brew install gnupg`, `apt install gnupg`, ou
já vem no Git Bash/WSL no Windows).

```bash
# 1. Baixe o arquivo .sql.gz.gpg da Release desejada (aba "Releases" do repo)

# 2. Descriptografe (peça a senha a quem administra a conta)
gpg --decrypt --batch --passphrase "SENHA_AQUI" -o backup.sql.gz petcontrol-backup-AAAA-MM-DD.sql.gz.gpg

# 3. Descompacte
gunzip backup.sql.gz

# 4. Restaure num banco Postgres (local via Docker, ou um projeto Supabase novo)
psql "postgresql://postgres:SENHA_DO_BANCO@HOST:5432/postgres" -f backup.sql
```

Para testar localmente sem afetar nada em produção:

```bash
docker run --name pg-teste -e POSTGRES_PASSWORD=teste -p 5433:5432 -d postgres:17
psql "postgresql://postgres:teste@localhost:5433/postgres" -f backup.sql
docker rm -f pg-teste   # depois de conferir
```

## Migrations versionadas (schema como código)

O schema real do banco vivia só no painel do Supabase — se a conta fosse
perdida, a *definição* do sistema (não só os dados) ia junto. O projeto já
tem o scaffolding do Supabase CLI (`petcontrol-next/supabase/`); falta rodar
uma vez, com as credenciais do projeto real, para puxar o schema atual:

```bash
cd petcontrol-next
npm run db:login      # abre o navegador para autenticar na sua conta Supabase
npm run db:link       # pede o project ref (Settings > General > Reference ID)
npm run db:pull       # baixa o schema atual para supabase/migrations/
```

Depois disso, **commite a pasta `supabase/migrations/`** — ela vira a fonte
da verdade do schema, versionada junto com o código. Qualquer alteração
futura de schema deve ser feita como uma nova migration
(`supabase migration new nome_da_mudanca`), não direto no SQL Editor do
painel.

> Não consegui rodar isso a partir do ambiente onde o restante das correções
> foi feito, porque exige login interativo na conta Supabase real. É o único
> passo desta lista que só você (ou quem tiver acesso à conta) pode executar.
