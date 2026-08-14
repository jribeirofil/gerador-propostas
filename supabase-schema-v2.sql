-- ============================================================
-- FineAndYou — Motor de Propostas
-- FASE 1: Schema de arquitetura modular
-- Banco limpo — primeira execução
-- ============================================================

create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. PERFIS DE USUÁRIO E PERMISSÕES (RBAC)
-- ────────────────────────────────────────────────────────────
-- O Supabase já gerencia login em auth.users.
-- Esta tabela "profiles" estende esse usuário com o papel dele
-- dentro do sistema (admin, manager, seller, viewer).

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'seller'
              check (role in ('admin', 'manager', 'seller', 'viewer')),
  created_at  timestamptz default now()
);

-- Cria o profile automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 2. CLIENTES
-- ────────────────────────────────────────────────────────────

create table public.clients (
  id              uuid primary key default uuid_generate_v4(),
  empresa         text not null,
  cnpj            text,
  contato         text not null,
  cargo           text,
  email           text,
  whatsapp        text,
  colaboradores   integer,
  segmento        text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 3. CATÁLOGO DE PRODUTOS (administrável, sem hardcode)
-- ────────────────────────────────────────────────────────────

create table public.product (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table public.product_benefit (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.product(id) on delete cascade,
  title       text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

create table public.product_scope (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.product(id) on delete cascade,
  title       text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

create table public.product_faq (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.product(id) on delete cascade,
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

create table public.product_differential (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.product(id) on delete cascade,
  title       text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true
);


-- ────────────────────────────────────────────────────────────
-- 4. TEMPLATES DE PROPOSTA (estrutura preparada, sem editor ainda)
-- ────────────────────────────────────────────────────────────

create table public.proposal_template (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  is_default  boolean not null default false,
  created_at  timestamptz default now()
);

insert into public.proposal_template (name, description, is_default)
values ('Padrão FineAndYou', 'Template padrão com todos os blocos habilitados', true);


-- ────────────────────────────────────────────────────────────
-- 5. PROPOSTAS (1 proposta = N produtos)
-- ────────────────────────────────────────────────────────────

create table public.proposal (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid references public.clients(id),
  template_id         uuid references public.proposal_template(id),

  title               text not null default 'Nova proposta',
  status              text not null default 'draft'
                      check (status in ('draft','generated','sent','approved','lost')),

  diagnosis           text,
  objectives          text,
  commercial_notes    text,

  discount_percent    numeric(5,2) default 0,
  discount_value      numeric(12,2) default 0,
  total_setup         numeric(12,2) default 0,
  total_monthly       numeric(12,2) default 0,
  total_amount        numeric(12,2) default 0,

  created_by          uuid references public.profiles(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 6. PRODUTOS DENTRO DE UMA PROPOSTA (com snapshot)
-- ────────────────────────────────────────────────────────────
-- snapshot guarda uma cópia fiel do produto no momento em que
-- a proposta foi montada: nome, descrição, benefícios, escopo,
-- faq, diferenciais e valores. Mudanças futuras no catálogo
-- (product e tabelas relacionadas) NÃO afetam propostas já
-- criadas, porque a proposta lê do snapshot, não do catálogo.

create table public.proposal_product (
  id                uuid primary key default uuid_generate_v4(),
  proposal_id       uuid not null references public.proposal(id) on delete cascade,
  product_id        uuid references public.product(id),

  quantity          integer not null default 1,
  pricing_type      text not null default 'monthly'
                    check (pricing_type in ('monthly','one_time','per_employee','per_project')),

  unit_value        numeric(12,4),
  monthly_value     numeric(12,2),
  setup_value       numeric(12,2) default 0,
  discount_percent  numeric(5,2) default 0,
  discount_value    numeric(12,2) default 0,
  subtotal          numeric(12,2),

  notes             text,
  snapshot          jsonb not null default '{}'::jsonb,

  sort_order        integer not null default 0,
  created_at        timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 7. BLOCOS DA PROPOSTA (peça central da arquitetura)
-- ────────────────────────────────────────────────────────────
-- Cada seção visível da proposta (capa, cenário, solução,
-- investimento, faq etc) é uma linha aqui, com conteúdo em JSON,
-- posição e estado de habilitado/oculto.

create table public.proposal_block (
  id            uuid primary key default uuid_generate_v4(),
  proposal_id   uuid not null references public.proposal(id) on delete cascade,

  type          text not null check (type in (
                  'cover','scenario','objectives','solution','benefits',
                  'scope','differentials','investment','faq','next_steps',
                  'about','signature','future_cases','future_terms','future_attachments'
                )),
  title         text,
  content_json  jsonb not null default '{}'::jsonb,
  sort_order    integer not null default 0,
  enabled       boolean not null default true,

  created_at    timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 8. HISTÓRICO DE EVENTOS
-- ────────────────────────────────────────────────────────────

create table public.proposal_event (
  id            uuid primary key default uuid_generate_v4(),
  proposal_id   uuid not null references public.proposal(id) on delete cascade,
  event_type    text not null check (event_type in (
                  'created','edited','pdf_generated','sent','approved','lost'
                )),
  created_by    uuid references public.profiles(id),
  created_at    timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
-- Por enquanto: qualquer usuário autenticado pode ler e escrever.
-- O recorte fino por papel (admin/manager/seller/viewer) entra
-- na Fase 2, junto com o login funcionando de verdade.

alter table public.profiles               enable row level security;
alter table public.clients                enable row level security;
alter table public.product                enable row level security;
alter table public.product_benefit        enable row level security;
alter table public.product_scope          enable row level security;
alter table public.product_faq            enable row level security;
alter table public.product_differential   enable row level security;
alter table public.proposal_template      enable row level security;
alter table public.proposal               enable row level security;
alter table public.proposal_product       enable row level security;
alter table public.proposal_block         enable row level security;
alter table public.proposal_event         enable row level security;

create policy "auth read own profile" on public.profiles for select to authenticated using (true);

create policy "auth all" on public.clients                for all to authenticated using (true);
create policy "auth all" on public.product                for all to authenticated using (true);
create policy "auth all" on public.product_benefit        for all to authenticated using (true);
create policy "auth all" on public.product_scope           for all to authenticated using (true);
create policy "auth all" on public.product_faq             for all to authenticated using (true);
create policy "auth all" on public.product_differential    for all to authenticated using (true);
create policy "auth all" on public.proposal_template        for all to authenticated using (true);
create policy "auth all" on public.proposal                 for all to authenticated using (true);
create policy "auth all" on public.proposal_product          for all to authenticated using (true);
create policy "auth all" on public.proposal_block             for all to authenticated using (true);
create policy "auth all" on public.proposal_event              for all to authenticated using (true);


-- ────────────────────────────────────────────────────────────
-- 10. updated_at automático
-- ────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger product_updated_at
  before update on public.product
  for each row execute function public.set_updated_at();

create trigger proposal_updated_at
  before update on public.proposal
  for each row execute function public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 11. SEED — catálogo inicial de produtos FineAndYou
-- ────────────────────────────────────────────────────────────

insert into public.product (name, slug, description, sort_order) values
  ('Plataforma NR-1', 'nr1',
   'Sistema para mapeamento, gestão e acompanhamento de riscos psicossociais, com relatórios e planos de ação em conformidade com a NR-1.', 1),
  ('Canal de Denúncias', 'canal-denuncias',
   'Canal anônimo, adequado à LGPD, com dashboard de gestão em tempo real, relatórios auditáveis e estrutura para recebimento e tratamento de denúncias.', 2),
  ('Marketplace Gestão de Vida', 'marketplace-gestao-vida',
   'Benefício corporativo de bem-estar que conecta colaboradores a uma rede multidisciplinar: psicólogos, nutricionistas, coaches, consultores financeiros e capelães.', 3),
  ('Palestras e Treinamentos', 'palestras-treinamentos',
   'Programas educativos para lideranças e colaboradores sobre saúde mental, prevenção, cultura organizacional e riscos psicossociais.', 4),
  ('Pacote Ecossistema FineAndYou', 'ecossistema',
   'Combinação estratégica entre diagnóstico, prevenção, educação, canal de denúncia e intervenção humana qualificada.', 5);

-- Exemplo de benefícios para o Canal de Denúncias (o time edita o resto pela tela admin, na Fase 3)
insert into public.product_benefit (product_id, title, sort_order)
select id, benefit, ord
from public.product,
  lateral (values
    ('Ativação em até 24 horas, sem burocracia técnica', 1),
    ('Zero taxa de setup', 2),
    ('100% anônimo e em conformidade com a LGPD', 3),
    ('Dashboard de gestão em tempo real', 4)
  ) as b(benefit, ord)
where slug = 'canal-denuncias';
