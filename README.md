# DM System Recruit — Versão 2.0 Beta

Cockpit completo de RH, recrutamento e gestão de pessoas para uma operação individual. Interface premium, autenticação exclusiva, perfil profissional personalizável, dados reais no Supabase e deploy pronto para Vercel.

## Novidades da versão 2.0

- Login corrigido: acesso pelo único e-mail autorizado **ou** pela senha configurada.
- Fallback inicial solicitado: e-mail `dmmsb19@gmail.com` e senha `123456`.
- Menu de perfil completo no canto superior direito.
- Tela **Meu Perfil** com foto por upload/URL, nome, cargo, bio, contatos e redes sociais.
- Marca própria com upload/URL de logotipo.
- Tema claro, escuro ou automático, cor de destaque, idioma e fuso horário.
- Alteração do e-mail autorizado e da senha dentro do sistema.
- Assinatura automática de e-mail com visualização, cópia HTML e download.
- Exportação do perfil em JSON.
- Login com background animado, HUD visual, microinterações e animações otimizadas.
- Update log flutuante no canto inferior.
- Dashboard com métricas e gráficos reais.
- Layout responsivo e suporte a `prefers-reduced-motion`.

## Módulos concluídos

- Dashboard executivo com headcount, vagas, onboarding, treinamentos, aniversários e entrevistas.
- Funcionários, departamentos e organograma recursivo.
- Templates, jornadas e tarefas de onboarding.
- Ciclos, perguntas, avaliações 360° e resumo por Gemini.
- Turnos, escalas, calendário, folgas e férias.
- ATS com vagas, candidatos, currículos, Kanban, match por IA e entrevistas.
- Treinamentos, matrículas, validade e certificados.
- Upload privado pelo Supabase Storage.
- Perfil, identidade visual, acesso e assinatura automática.

## Stack

- Next.js 16 App Router, React 19 e TypeScript
- Tailwind CSS e CSS otimizado
- Supabase Postgres + Storage
- Google Gemini
- Recharts
- Vercel

## 1. Preparar o Supabase

Antes de usar o perfil v2, aplique o schema atualizado:

1. Acesse **Supabase Dashboard → SQL Editor → New query**.
2. Cole todo o conteúdo de `supabase/schema.sql`.
3. Clique em **Run**.
4. Execute `supabase/verify.sql` para validar.

Para um banco que já recebeu a versão 1.0, também é possível executar apenas:

```text
supabase/migrations/20260716000000_dm_system_recruit_v2.sql
```

O schema é idempotente: pode ser executado novamente sem apagar registros.

## 2. Variáveis de ambiente

Copie o modelo:

```bash
cp .env.example .env.local
```

Preencha localmente e também no painel da Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
APP_PASSWORD=123456
APP_LOGIN_EMAIL=dmmsb19@gmail.com
```

`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` e `APP_PASSWORD` são segredos de servidor. Nunca use o prefixo `NEXT_PUBLIC_` neles e nunca envie `.env.local` ao Git.

## 3. Executar e validar

```bash
npm install
npm run dev
```

Validação de produção:

```bash
npm run lint
npm run build
npm start
```

Acesse `http://localhost:3000` e entre com o e-mail autorizado ou a senha.

## 4. Hospedar direto na Vercel

### Opção A — importar o ZIP baixado

1. Extraia o ZIP.
2. Envie os arquivos para um repositório GitHub privado.
3. Na Vercel, clique em **Add New → Project** e importe o repositório.
4. Framework: **Next.js** (detectado automaticamente).
5. Em **Environment Variables**, cadastre as seis variáveis da seção anterior.
6. Clique em **Deploy**.

### Opção B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Cadastre as variáveis:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY
vercel env add APP_PASSWORD
vercel env add APP_LOGIN_EMAIL
```

Publicação final:

```bash
vercel --prod
```

O arquivo `vercel.json` já configura o build Next.js.

## Rotas

| URI | Função |
| --- | --- |
| `/` | Dashboard executivo |
| `/employees` | Funcionários, departamentos e organograma |
| `/onboarding` | Templates, jornadas e checklists |
| `/performance` | Ciclos, avaliações e IA |
| `/attendance` | Escalas, calendário e ausências |
| `/recruitment` | ATS, vagas, candidatos e entrevistas |
| `/training` | Treinamentos e certificados |
| `/profile` | Perfil, marca, acesso e assinatura |
| `/login` | Acesso por e-mail exclusivo ou senha |
| `/api/profile` | Preferências persistidas do perfil |
| `/api/data/[resource]` | CRUD protegido server-side |
| `/api/dashboard` | Métricas reais |
| `/api/upload` | Upload privado |
| `/api/ai/resume` | Match de currículo |
| `/api/ai/review` | Resumo de avaliação 360° |

## Segurança

- Cookie de sessão `HttpOnly`, `SameSite=Lax`, `Secure` em produção e validade de 12 horas.
- Service Role e Gemini usados apenas no servidor.
- RLS habilitado nas tabelas; navegador não acessa dados diretamente.
- Uploads guardados em bucket privado e servidos por rota autenticada.
- Lista branca de tabelas e campos em todas as operações CRUD.
- Arquivos de ambiente, builds e dependências são excluídos do pacote e do Git.

> Recomendação: como credenciais foram compartilhadas durante a configuração, rotacione a Service Role e a chave Gemini antes do deploy público e atualize os valores na Vercel.

## Status

- Aplicação: **2.0.0-beta.1**
- TypeScript: validado
- Build de produção: validado
- Deploy alvo: Vercel
- Dados fictícios: nenhum
