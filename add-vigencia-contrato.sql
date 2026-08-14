-- Add vigencia_contrato to proposal table
ALTER TABLE proposal ADD COLUMN IF NOT EXISTS vigencia_contrato text;
