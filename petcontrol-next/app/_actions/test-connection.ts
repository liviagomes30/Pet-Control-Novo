'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Testa a conexão com o Supabase
 * Retorna informações sobre o banco de dados
 */
export async function testSupabaseConnection() {
  try {
    const supabase = await createClient()
    
    // Tenta buscar as tabelas do banco
    const { data, error } = await supabase
      .from('animal')
      .select('*')
      .limit(1)
    
    if (error) {
      // Se erro for "relation does not exist", significa que a tabela não existe ainda
      if (error.code === '42P01') {
        return {
          success: false,
          connected: true,
          message: 'Conexão estabelecida, mas o schema SQL ainda não foi migrado.',
          details: 'Execute o script petcontrol.sql no SQL Editor do Supabase.'
        }
      }
      
      return {
        success: false,
        connected: false,
        message: 'Erro ao conectar com Supabase',
        error: error.message
      }
    }
    
    return {
      success: true,
      connected: true,
      message: 'Conexão com Supabase estabelecida com sucesso!',
      data
    }
  } catch (error) {
    return {
      success: false,
      connected: false,
      message: 'Erro ao testar conexão',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}
