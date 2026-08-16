-- Add dark mode logo URL to company_settings
alter table public.company_settings add column if not exists logo_url_dark text;
