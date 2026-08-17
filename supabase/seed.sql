-- Seed: criar usuários e dados de teste
-- Nota: auth.users deve ser criado via Supabase UI ou via supabase auth admin commands
-- Este seed apenas cria profiles para usuários que já existem em auth.users

-- Insert test users in auth.users (você vai precisar fazer isso manualmente no Supabase Studio)
-- OU rodamos isso via CLI:
-- supabase auth admin create-user --email jayme.led@fineandyou.com.br --password 123456
-- supabase auth admin create-user --email jayme.ribeiro@fineandyou.com.br --password 123456

-- Para agora, vamos apenas garantir que a organização padrão existe
INSERT INTO public.organization (id, name, created_by)
VALUES ('2acf492a-c3a6-4372-ba74-75389a4aa776', 'FineAndYou', NULL)
ON CONFLICT DO NOTHING;

-- Criar company_settings para a org
INSERT INTO public.company_settings (id, organization_id, company_name)
VALUES (gen_random_uuid(), '2acf492a-c3a6-4372-ba74-75389a4aa776', 'FineAndYou')
ON CONFLICT DO NOTHING;
