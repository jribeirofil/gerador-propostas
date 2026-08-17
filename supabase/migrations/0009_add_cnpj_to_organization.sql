-- Add CNPJ field to organization table for marketplace isolation
alter table public.organization add column if not exists cnpj text unique;

-- Add comment for clarity
comment on column public.organization.cnpj is 'CNPJ único da empresa (validação contra duplicação em marketplace)';
