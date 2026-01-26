#!/bin/bash

# Script para exibir o conteúdo do SQL para migração

echo "================================================"
echo "📋 Script SQL para Migração Supabase"
echo "================================================"
echo ""
echo "📂 Arquivo: Salvacao-Back/src/main/resources/database/petcontrol.sql"
echo ""
echo "🔗 URL do SQL Editor:"
echo "https://supabase.com/dashboard/project/adhtcndsvwohdypsizqz/sql/new"
echo ""
echo "================================================"
echo ""

# Caminho relativo ao petcontrol-next
SQL_FILE="../Salvacao-Back/src/main/resources/database/petcontrol.sql"

if [ -f "$SQL_FILE" ]; then
    echo "✅ Arquivo encontrado! Conteúdo:"
    echo ""
    echo "--- INÍCIO DO SCRIPT SQL ---"
    echo ""
    cat "$SQL_FILE"
    echo ""
    echo "--- FIM DO SCRIPT SQL ---"
    echo ""
    echo "================================================"
    echo "📋 Instruções:"
    echo "1. Copie todo o conteúdo acima (desde CREATE TABLE até o final)"
    echo "2. Acesse o SQL Editor do Supabase"
    echo "3. Cole o conteúdo"
    echo "4. Clique em 'Run' (▶)"
    echo "5. Volte para http://localhost:3000 e teste a conexão"
    echo "================================================"
else
    echo "❌ Erro: Arquivo não encontrado em $SQL_FILE"
    echo ""
    echo "Verifique se você está no diretório correto:"
    echo "  cd /c/PetControl/PetControl-main/petcontrol-next"
fi
