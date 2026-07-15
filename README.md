# DM System Recruit — Versão 1.0

Sistema interno completo de RH e recrutamento para operação por uma única pessoa. Não há dados de demonstração: todas as telas leem e gravam dados reais no Supabase.

## Funcionalidades concluídas

- Portão de senha única por `APP_PASSWORD`, cookie `HttpOnly`, `SameSite=Lax` e expiração em 12 horas.
- Dashboard com funcionários ativos, vagas, onboardings, treinamentos vencidos, aniversários e entrevistas.
- Diretório de funcionários, departamentos, foto por URL ou upload e gestor direto.
- Organograma recursivo baseado no gestor direto.
- Templates e tarefas de onboarding; ao criar um onboarding, as tarefas do template são copiadas automaticamente.
- Ciclos, perguntas e avaliações 360°, incluindo resumo com Gemini Flash.
- Turnos, calendário de escalas e solicitações de férias/folga.
- ATS com vagas, candidatos, upload privado de currículo, Kanban, score de match por IA e entrevistas.
- Agendamento rápido de entrevista e criação de sala em `meet.google.com/new`.
- Treinamentos, matrículas, validade, status e certificados.
- Tema claro/escuro e interface em português/inglês.
- Layout responsivo, animações leves e suporte a `prefers-reduced-motion`.
- APIs e arquivos privados sem cache compartilhado.

## Stack

- Next.js 16 App Router, React 19 e TypeScript
- Tailwind CSS
- Supabase Postgres + Storage
- Google Gemini Flash
- Recharts
- React Hook Form + Zod
- Vercel

## 1. Configurar o banco Supabase

O projeto Supabase precisa receber a migration antes do primeiro uso. A Service Role permite CRUD, mas não permite criar tabelas.

### Opção A — SQL Editor

1. Abra **Supabase Dashboard → SQL Editor → New query**.
2. Cole todo o conteúdo de `supabase/schema.sql`.
3. Clique em **Run**.
4. Execute `supabase/verify.sql`. Todas as consultas devem funcionar.

### Opção B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref bniayecyhtxtqcjsqvvk
npx supabase db push
```

A migration oficial está em `supabase/migrations/20260715000000_dm_system_recruit_v1.sql`.

O schema cria 18 tabelas relacionais, índices, triggers de `updated_at`, RLS e o bucket privado `hr-files`.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
APP_PASSWORD=
```

Nunca envie `.env.local` ao Git. Troque a Service Role e a chave Gemini caso tenham sido compartilhadas fora de um cofre seguro. Use uma senha forte em produção.

## 3. Executar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

Validações de produção:

```bash
npm run lint
npm run build
npm start
```

## 4. Publicar pelo CMD na Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Adicione as cinco variáveis no painel do projeto ou pelo CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY
vercel env add APP_PASSWORD
```

Publicação de produção:

```bash
vercel --prod
```

## Rotas funcionais

| URI | Função |
| --- | --- |
| `/` | Dashboard |
| `/employees` | Funcionários, departamentos e organograma |
| `/onboarding` | Templates, jornadas e checklists |
| `/performance` | Ciclos, perguntas, avaliações e IA |
| `/attendance` | Escalas, calendário, férias e folgas |
| `/recruitment` | ATS, vagas, candidatos e entrevistas |
| `/training` | Treinamentos e certificados |
| `/login` | Portão de senha única |
| `/api/data/[resource]` | CRUD server-side com lista branca |
| `/api/dashboard` | Métricas reais do dashboard |
| `/api/upload` | Upload privado ao Supabase Storage |
| `/api/files/[...path]` | Entrega autenticada de arquivo privado |
| `/api/ai/resume` | Resumo e match de currículo |
| `/api/ai/review` | Resumo de avaliação 360° |

## Modelo de dados

- `departments`, `employees`
- `onboarding_templates`, `onboarding_template_tasks`, `onboardings`, `onboarding_tasks`
- `review_cycles`, `review_questions`, `reviews`
- `shifts`, `shift_assignments`, `leave_requests`
- `jobs`, `candidates`, `applications`, `interviews`
- `trainings`, `training_enrollments`

Todos usam UUID e timestamps de criação/atualização. O navegador nunca recebe a Service Role; todas as operações passam por Route Handlers protegidos.

## Status

- Aplicação: **Versão 1.0 funcional**
- Build de produção: validado
- Deploy alvo: Vercel
- Banco: Supabase `bniayecyhtxtqcjsqvvk` — schema aplicado e CRUD validado
- Storage: bucket privado `hr-files` criado e upload validado
- IA: Gemini 3.1 Flash Lite validado
- Dados fake: nenhum

## Próximos passos recomendados

- Rotacionar as credenciais antes da publicação final.
- Configurar domínio próprio e monitoramento de erros no Vercel.
