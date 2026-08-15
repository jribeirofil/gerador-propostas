-- Add style customization fields to proposal_template
ALTER TABLE proposal_template
ADD COLUMN IF NOT EXISTS default_font text,
ADD COLUMN IF NOT EXISTS base_font_size integer,
ADD COLUMN IF NOT EXISTS custom_css text;

-- Defaults for existing templates
UPDATE proposal_template
SET
  default_font = 'Inter',
  base_font_size = 13
WHERE default_font IS NULL;
