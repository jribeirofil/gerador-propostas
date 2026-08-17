#!/bin/bash

# Script para sincronizar dados do Supabase online para o banco local

echo "🔄 Sincronizando dados do banco online para local..."

# URLs do banco
REMOTE_DB_URL="postgresql://postgres:$(grep SUPABASE_DB_PASSWORD .env.local | cut -d'=' -f2):jmmpxdcihbqqqwjfyulr.db.supabase.co/postgres"
LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "1️⃣ Fazendo dump das tabelas principais do banco online..."
# Dump apenas dados (sem schema, pois schema já existe localmente)
pg_dump "$REMOTE_DB_URL" \
  --data-only \
  --table=public.organization \
  --table=public.profiles \
  --table=public.company_settings \
  --table=public.product \
  --table=public.category \
  --table=public.proposal \
  --table=public.proposal_product \
  --table=public.proposal_block \
  --table=public.proposal_template \
  --table=public.template_block \
  --table=public.clients \
  > /tmp/supabase_data_dump.sql 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Dump criado com sucesso"

  echo "2️⃣ Restaurando dados no banco local..."
  psql "$LOCAL_DB_URL" -f /tmp/supabase_data_dump.sql > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "✅ Dados restaurados com sucesso!"
    echo "🎉 Sincronização completa! Seu banco local agora tem os mesmos dados do online."
  else
    echo "❌ Erro ao restaurar dados. Verifique a conexão com o banco local."
  fi
else
  echo "❌ Erro ao fazer dump. Verifique as credenciais do banco online."
  echo "💡 Dica: Você tem psql/pg_dump instalado?"
fi

rm -f /tmp/supabase_data_dump.sql
