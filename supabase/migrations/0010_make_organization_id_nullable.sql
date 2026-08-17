-- Make organization_id nullable to support users without organization
alter table public.profiles alter column organization_id drop not null;

comment on column public.profiles.organization_id is 'ID da organização do usuário (null enquanto não criar empresa)';
