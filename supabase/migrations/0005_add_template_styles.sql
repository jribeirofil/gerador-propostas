-- Add style customization fields to proposal_template
ALTER TABLE proposal_template
ADD COLUMN IF NOT EXISTS default_font text,
ADD COLUMN IF NOT EXISTS base_font_size integer,
ADD COLUMN IF NOT EXISTS heading_size integer,
ADD COLUMN IF NOT EXISTS heading_color text,
ADD COLUMN IF NOT EXISTS heading_bold boolean,
ADD COLUMN IF NOT EXISTS text_color text,
ADD COLUMN IF NOT EXISTS text_line_height text,
ADD COLUMN IF NOT EXISTS background_color text,
ADD COLUMN IF NOT EXISTS accent_color text,
ADD COLUMN IF NOT EXISTS custom_css text;

-- Defaults for existing templates
UPDATE proposal_template
SET
  default_font = 'Inter',
  base_font_size = 13,
  heading_size = 28,
  heading_color = null,
  heading_bold = true,
  text_color = null,
  text_line_height = '1.6',
  background_color = null,
  accent_color = null
WHERE default_font IS NULL;
