-- ────────────────────────────────────────────────────────────────
-- Fase 5 — Storage isolado por organização
--
-- Bucket 'assets' (público): leitura via URL pública permanece (a proposta
-- embute as URLs), mas inserir/atualizar/remover/listar objetos fica restrito
-- à organização dona do path. Todo upload novo deve usar o prefixo
-- '<organization_id>/...' — os componentes já fazem isso.
--
-- Usuários legados (sem organization_id no profile) caem na org raiz via
-- coalesce, então continuam podendo escrever em paths com o prefixo da raiz.
-- ────────────────────────────────────────────────────────────────

begin;

drop policy if exists assets_org_insert on storage.objects;
drop policy if exists assets_org_update on storage.objects;
drop policy if exists assets_org_delete on storage.objects;
drop policy if exists assets_org_select on storage.objects;

create policy assets_org_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );

create policy assets_org_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );

create policy assets_org_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );

create policy assets_org_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] =
        coalesce(public.current_org_id(), '00000000-0000-0000-0000-000000000001')::text
  );

commit;

-- IMPORTANTE: se o bucket 'assets' tiver policies permissivas criadas pelo
-- dashboard (ex: "Allow all" / "Authenticated users can upload"), remova-as.
-- Policies em storage.objects combinam com OR — uma policy permissiva anula a
-- restrição por org. Com apenas estas policies, um path sem o prefixo da org
-- do usuário (ou de outra org) é rejeitado em insert/update/delete/select.
