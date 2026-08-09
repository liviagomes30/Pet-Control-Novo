"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { falha, invalido, type ActionResult } from "@/lib/actions/result";
import { loginSchema, type LoginFormData } from "../_schemas/login.schema";

export async function entrar(formData: LoginFormData): Promise<ActionResult> {
  const validacao = loginSchema.safeParse(formData);
  if (!validacao.success) return invalido(validacao.error);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validacao.data.email,
      password: validacao.data.password,
    });

    if (error) {
      return { success: false, message: "E-mail ou senha incorretos." };
    }

    return { success: true, message: "Login realizado com sucesso.", data: undefined };
  } catch (error) {
    return falha(error, "entrar");
  }
}

export async function sair(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
