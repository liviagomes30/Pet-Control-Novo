import { z } from "zod";
import { UnauthorizedError } from "@/lib/auth/require-user";

/**
 * Contrato único de retorno para toda Server Action.
 * União discriminada por `success`: dentro de `if (result.success)`,
 * o TypeScript estreita `data` automaticamente, sem `as`.
 *
 * Nome do campo de erro de validação (`errors`) segue a convenção já em uso
 * nos componentes e definida em .github/instructions/agent.instructions.md.
 */
export type ActionResult<T = void> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

/**
 * Loga o erro real no servidor e devolve uma mensagem genérica ao cliente.
 * Nunca propague `error.message` do banco para a UI: ele pode conter nomes
 * de tabela/coluna/constraint, e as Server Actions são endpoints públicos.
 */
export function falha(erro: unknown, contexto: string): ActionResult<never> {
  if (erro instanceof UnauthorizedError) {
    return { success: false, message: erro.message };
  }
  console.error(`[${contexto}]`, erro);
  return {
    success: false,
    message: "Não foi possível concluir a operação. Tente novamente.",
  };
}

/** Traduz um erro de validação Zod para o formato de campo do ActionResult. */
export function invalido(erro: z.ZodError): ActionResult<never> {
  return {
    success: false,
    message: "Dados inválidos",
    errors: z.flattenError(erro).fieldErrors as Record<string, string[]>,
  };
}

export function sucesso<T>(data: T, message: string): ActionResult<T> {
  return { success: true, message, data };
}
