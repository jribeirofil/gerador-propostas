# FineAndYou Propostas

MVP para geração de propostas comerciais em PDF.

---

## Rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Sem Supabase, o app roda com dados mockados em memória.
Com Supabase, preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Configurar Supabase (opcional para MVP)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase-schema.sql`
3. Copie as credenciais em **Settings > API** para o `.env.local`

---

## Deploy na Vercel

```bash
npx vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel.

---

## Estrutura do projeto

```
src/
  app/
    dashboard/           # Páginas autenticadas
      page.tsx           # Lista de propostas
      nova/page.tsx      # Formulário multi-etapas
      propostas/[id]/pdf # Prévia e exportação do PDF
    api/proposals/       # API Route — salvar proposta + gerar HTML
  components/
    layout/              # Sidebar
    ui/                  # StatusBadge, StepIndicator
    proposal/            # Formulário em 5 etapas
  lib/
    supabase.ts          # Client e funções de DB
    pdf-template.ts      # HTML do documento PDF
    mock-data.ts         # Dados de exemplo para dev
  types/
    index.ts             # Tipos + dados estáticos (produtos, dores)
```

---

## Geração de PDF

O MVP usa `iframe.contentWindow.print()` para exportar via navegador (Ctrl+P → Salvar como PDF).

Para geração server-side com Puppeteer no futuro:

```ts
// app/api/proposals/[id]/pdf/route.ts
import puppeteer from 'puppeteer'
const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setContent(html)
const pdf = await page.pdf({ format: 'A4', printBackground: true })
await browser.close()
return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } })
```

---

## Próximas evoluções

- [ ] Login com Supabase Auth
- [ ] Geração server-side de PDF com Puppeteer
- [ ] Link público da proposta com aceite online
- [ ] Envio via WhatsApp ou e-mail
- [ ] Templates diferentes por produto
- [ ] Dashboard comercial com funil
