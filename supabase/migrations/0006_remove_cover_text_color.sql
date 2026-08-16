-- Remove cover_text_color column (simplify: use heading_color + text_color instead)
alter table public.proposal_template drop column if exists cover_text_color;
