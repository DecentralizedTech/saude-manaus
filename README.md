# Saúde Manaus — MVP v2

Stack simplificada: React + Vite + Vercel Functions + Vercel KV. Deploy completo na Vercel, zero servidores externos.

---

## Estrutura do projeto

```
saude-manaus-v2/
├── api/                  ← Vercel Serverless Functions (backend)
│   ├── _kv.js            ← Helper Vercel KV (banco de dados)
│   ├── _score.js         ← Lógica de pontuação
│   ├── _auth.js          ← JWT com jose
│   ├── auth.js           ← POST /api/auth/social
│   ├── unidades.js       ← CRUD /api/unidades
│   ├── avaliacoes.js     ← POST/GET /api/avaliacoes
│   └── seed.js           ← GET /api/seed?secret=... (uma única vez)
├── src/                  ← Frontend React
│   ├── pages/            ← Home, Unidade, Avaliacao, Login, Admin
│   ├── components/       ← Navbar, UnidadeCard, ScoreBadge
│   ├── store/            ← Zustand (auth)
│   └── lib/              ← Axios client
├── vercel.json           ← Configuração de rotas
└── package.json
```

---

## Deploy na Vercel (passo a passo)

### 1. Crie o repositório

```bash
git init
git add .
git commit -m "Initial commit"
# Crie um repo no GitHub e faça push
git remote add origin https://github.com/seu-user/saude-manaus.git
git push -u origin main
```

### 2. Conecte à Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Selecione o repositório GitHub
3. Vercel detecta automaticamente Vite — clique em **Deploy**

### 3. Crie o banco Vercel KV

1. No dashboard do projeto → **Storage** → **Create Database** → **KV**
2. Nomeie como `saude-manaus-kv`
3. Clique em **Connect to Project** — as variáveis `KV_URL`, `KV_REST_API_URL` etc. são adicionadas automaticamente

### 4. Configure as variáveis de ambiente

No dashboard Vercel → **Settings** → **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `JWT_SECRET` | Uma string aleatória longa (ex: gere com `openssl rand -hex 32`) |
| `ADMIN_SECRET` | Uma senha que só você sabe |

> As variáveis do KV (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) já foram adicionadas automaticamente no passo anterior.

### 5. Popule o banco com as unidades de saúde

Após o deploy, acesse **uma única vez** no navegador:

```
https://seu-projeto.vercel.app/api/seed?secret=SUA_ADMIN_SECRET
```

Isso insere as 19 unidades reais de Manaus (8 hospitais, 2 UPAs, 9 SPAs).

### 6. Torne-se administrador

1. Faça login no site pelo Google ou Facebook
2. Pegue seu `userId` no localStorage do browser (DevTools → Application → Local Storage → `usuario` → campo `id`)
3. Faça uma chamada POST:

```bash
curl -X POST https://seu-projeto.vercel.app/api/auth/promote \
  -H "Content-Type: application/json" \
  -d '{"userId": "seu-user-id", "secret": "SUA_ADMIN_SECRET"}'
```

4. Faça logout e login novamente — o painel Admin aparecerá no menu.

---

## Desenvolvimento local

```bash
npm install
npx vercel dev   # Sobe frontend + functions juntos na porta 3000
```

> O `vercel dev` lê as env vars do Vercel automaticamente se você estiver logado no CLI (`npx vercel login`).
> Alternativamente, crie um `.env.local` com as variáveis do KV copiadas do dashboard.

---

## Próximos passos pós-MVP

- [ ] Integrar Google Identity Services SDK (substituir mock de login)
- [ ] Integrar Facebook Login SDK
- [ ] Gráfico de evolução do score ao longo do tempo
- [ ] Página de estatísticas por zona da cidade
- [ ] Rate limiting mais robusto com Vercel Edge Middleware
