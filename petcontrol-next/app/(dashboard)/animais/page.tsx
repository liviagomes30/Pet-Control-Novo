import { createClient } from "@/lib/supabase/server";
import { AnimalList } from "./_components/AnimalList";
import { Animal } from "@/lib/database.types";

export const metadata = {
  title: "Animais | PetControl",
  description: "Gestão de animais da ONG SalvaCão",
};

export default async function AnimaisPage() {
  // Server Component - busca inicial no servidor
  const supabase = await createClient();
  const { data: animais } = await supabase
    .from("animal")
    .select("*")
    .order("nome", { ascending: true });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Animais</h1>
        <p className="text-gray-600 mt-2">
          Gerencie os animais cadastrados na ONG
        </p>
      </div>

      <AnimalList initialData={(animais as Animal[]) || []} />
    </div>
  );
}
