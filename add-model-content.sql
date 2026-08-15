-- Modelo de conteúdo da proposta (docs/DECISOES-MODELO-DE-CONTEUDO.md)
-- Dono único por texto: produto (fatos), empresa (identidade/termos), proposta (negócio).

-- "Sobre a empresa" agora é config da organização (não mais bloco da proposta).
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company_about text;

-- Condições comerciais específicas de um produto (cadastradas na página do produto).
ALTER TABLE product ADD COLUMN IF NOT EXISTS commercial_conditions text;

-- Condições comerciais negociadas da proposta (passo "Condições", editáveis pelo vendedor).
ALTER TABLE proposal ADD COLUMN IF NOT EXISTS commercial_conditions text;
