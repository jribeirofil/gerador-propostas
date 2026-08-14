# Fase 2 — Login real com Supabase Auth

## O que mudou

- Tela de **login** em `/login`
- Tela de **cadastro** em `/cadastro`
- `middleware.ts` protege `/dashboard` — sem login, redireciona para `/login`
- Sidebar agora mostra seu nome real e o papel (admin/manager/seller/viewer)
- Botão **Sair** na sidebar
- Trocado o pacote descontinuado `@supabase/auth-helpers-nextjs` pelo atual `@supabase/ssr`

## Passo a passo para aplicar no seu projeto local

### 1. Substituir os arquivos

Baixe os arquivos novos e substitua na sua pasta `fineandyou-propostas`, mantendo a mesma estrutura de pastas.

### 2. Reinstalar dependências

No Terminal, dentro da pasta do projeto:

```bash
npm install
```

Isso vai remover o pacote antigo e instalar o `@supabase/ssr`.

### 3. Conferir o `.env.local`

Confirme que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão preenchidos (Settings > API no painel do Supabase).

### 4. Rodar o projeto

```bash
npm run dev
```

### 5. Criar sua conta

1. Acesse `http://localhost:3000` — vai te jogar para `/login`
2. Clique em **Criar conta**
3. Preencha nome, e-mail e senha
4. Vai pedir para confirmar por e-mail. **Se o Supabase estiver com confirmação de e-mail desativada** (padrão em projetos novos costuma vir ativado), você recebe um e-mail de fato. Se quiser pular essa etapa em desenvolvimento, dá para desativar em **Authentication > Providers > Email > Confirm email**.

### 6. Se promover a admin

Por padrão todo cadastro novo entra como `seller`. Para virar `admin`:

1. No painel do Supabase, vá em **Table Editor**
2. Abra a tabela `profiles`
3. Encontre a linha com seu nome
4. Edite a coluna `role` de `seller` para `admin`
5. Salve

Pronto, sua conta agora é admin.

## Próxima fase

Fase 3: tela administrativa de produtos (CRUD de catálogo, benefícios, escopo, FAQ e diferenciais), visível só para quem tem `role = admin`.
