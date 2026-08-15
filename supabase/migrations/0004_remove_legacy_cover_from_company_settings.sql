-- Remove legacy cover columns from company_settings
-- Capa agora vem exclusivamente de proposal_template.cover_image_url
ALTER TABLE company_settings
DROP COLUMN IF EXISTS cover_bg_url,
DROP COLUMN IF EXISTS cover_video_url;
