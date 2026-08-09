import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "./_components/DashboardNav";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Defesa em profundidade: o middleware já redireciona quem não está
  // autenticado, mas este layout roda em qualquer acesso direto ao segmento.
  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userEmail={data.user.email} />
      <main>{children}</main>
    </div>
  );
}
