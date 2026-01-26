'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, Database } from 'lucide-react'
import { testSupabaseConnection } from '../_actions/test-connection'

export function TestConnectionButton() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    
    try {
      const response = await testSupabaseConnection()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao executar teste',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <Database className="h-10 w-10 text-blue-500 mb-2" />
        <CardTitle>Teste de Conexão Supabase</CardTitle>
        <CardDescription>
          Verifique se as credenciais estão corretas e o banco está acessível
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTest} 
          disabled={testing}
          className="w-full"
          size="lg"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Testando...
            </>
          ) : (
            'Testar Conexão'
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : result.connected
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${
                  result.success 
                    ? 'text-green-900' 
                    : result.connected
                    ? 'text-yellow-900'
                    : 'text-red-900'
                }`}>
                  {result.message}
                </p>
                {result.details && (
                  <p className="text-sm text-yellow-700 mt-2">
                    {result.details}
                  </p>
                )}
                {result.error && (
                  <p className="text-sm text-red-700 mt-2 font-mono">
                    {result.error}
                  </p>
                )}
                {result.success && result.data && (
                  <p className="text-sm text-green-700 mt-2">
                    ✅ Schema migrado corretamente! Encontrados dados na tabela 'animal'.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {result && !result.success && result.connected && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">📋 Próximo Passo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">Migrar o Schema SQL:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Abra o Supabase Dashboard: <a href="https://supabase.com/dashboard/project/adhtcndsvwohdypsizqz" target="_blank" className="text-blue-600 underline">Link direto</a></li>
                <li>Vá em <strong>SQL Editor</strong> no menu lateral</li>
                <li>Clique em <strong>New query</strong></li>
                <li>Copie o conteúdo de: <code className="bg-blue-100 px-1 rounded">Salvacao-Back/src/main/resources/database/petcontrol.sql</code></li>
                <li>Cole no editor e clique em <strong>Run</strong></li>
              </ol>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
