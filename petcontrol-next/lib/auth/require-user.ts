import { createClient } from "@/lib/supabase/server";

export class UnauthorizedError extends Error {
  constructor() {
    super("Usuário não autenticado.");
    this.name = "UnauthorizedError";
  }
}

/**
 * Guarda de autenticação para Server Actions.
 *
 * Server Actions compilam em endpoints HTTP públicos — o middleware por si só
 * não é suficiente (pode não cobrir todo `matcher`, e a action pode ser
 * invocada fora do fluxo de navegação normal). Toda action que lê ou escreve
 * dados sensíveis deve chamar isto como primeira linha.
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new UnauthorizedError();
  }

  return { supabase, user: data.user };
}
