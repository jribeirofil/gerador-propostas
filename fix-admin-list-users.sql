-- FIX admin_list_users: corpo totalmente qualificado (sem colunas ambíguas)
-- + garantia de EXECUTE para authenticated/service_role.

begin;

drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  job_title text,
  phone text,
  active boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.organization_id = public.current_org_id()
  ) then
    raise exception 'Access denied';
  end if;

  return query
  select
    p.id,
    p.full_name,
    u.email::text,
    p.role::text,
    p.job_title,
    p.phone,
    p.active,
    u.created_at,
    u.last_sign_in_at,
    count(pr.id)::bigint
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.proposal pr on pr.created_by = p.id
  where p.organization_id = public.current_org_id()
  group by p.id, p.full_name, u.email, p.role, p.job_title, p.phone, p.active,
           u.created_at, u.last_sign_in_at
  order by u.created_at desc;
end; $$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_list_users() to service_role;

commit;

-- Diagnóstico (rodar após o commit, fora da transação):
-- select proname, prosecdef, pg_get_functiondef(oid) from pg_proc
--   where proname = 'admin_list_users';
