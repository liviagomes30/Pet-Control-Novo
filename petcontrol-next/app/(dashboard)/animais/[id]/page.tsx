import { createClient } from "@/lib/supabase/server";
import { AnimalForm } from "../_components/AnimalForm";
import { Animal } from "@/lib/database.types";
import { notFound } from "next/navigation";
import { listarHistoricoPorAnimal } from "./_actions/historico.actions";
import { HistoricoTimeline } from "./_components/HistoricoTimeline";
import { MedicacaoForm } from "./_components/MedicacaoForm";
import { VacinacaoForm } from "./_components/VacinacaoForm";
import { ProtocoloVacinalForm } from "./_components/ProtocoloVacinalForm";
import { ReceitaForm } from "./_components/ReceitaForm";
import { ReceitaList } from "./_components/ReceitaList";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditarAnimalPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditarAnimalPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: animal } = await supabase
    .from("animal")
    .select("nome")
    .eq("idanimal", parseInt(resolvedParams.id))
    .single();

  return {
    title: animal ? `${animal.nome} | PetControl` : "Animal não encontrado",
  };
}

export default async function EditarAnimalPage({ params }: EditarAnimalPageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: animal, error } = await supabase
    .from("animal")
    .select("*")
    .eq("idanimal", id)
    .single();

  if (error || !animal) {
    notFound();
  }

  // Buscar histórico
  const { data: historico } = await listarHistoricoPorAnimal(id);

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      Disponível: "bg-green-500",
      Adotado: "bg-blue-500",
      "Em tratamento": "bg-yellow-500",
      Falecido: "bg-gray-500",
    };
    return (
      <Badge className={statusColors[status || ""] || "bg-gray-400"}>
        {status || "N/A"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{animal.nome}</h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-gray-600">
            {animal.especie} {animal.raca ? `• ${animal.raca}` : ""}
          </p>
          {getStatusBadge(animal.status)}
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="receita">Receita Médica</TabsTrigger>
          <TabsTrigger value="medicacao">Medicação</TabsTrigger>
          <TabsTrigger value="vacinacao">Vacinação</TabsTrigger>
          <TabsTrigger value="editar">Editar</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-gray-500">Espécie</span>
                <p className="font-medium">{animal.especie}</p>
              </div>

              {animal.raca && (
                <div>
                  <span className="text-sm text-gray-500">Raça</span>
                  <p className="font-medium">{animal.raca}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-500">Sexo</span>
                <p className="font-medium">{animal.sexo}</p>
              </div>

              {animal.porte && (
                <div>
                  <span className="text-sm text-gray-500">Porte</span>
                  <p className="font-medium">{animal.porte}</p>
                </div>
              )}

              {animal.cor && (
                <div>
                  <span className="text-sm text-gray-500">Cor</span>
                  <p className="font-medium">{animal.cor}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-500">Castrado</span>
                <p className="font-medium">{animal.castrado ? "Sim" : "Não"}</p>
              </div>

              {animal.datanascimento && (
                <div>
                  <span className="text-sm text-gray-500">Data de Nascimento</span>
                  <p className="font-medium">
                    {new Date(animal.datanascimento).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}

              {animal.dataresgate && (
                <div>
                  <span className="text-sm text-gray-500">Data de Resgate</span>
                  <p className="font-medium">
                    {new Date(animal.dataresgate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <HistoricoTimeline items={historico || []} />
          </div>
        </TabsContent>

        <TabsContent value="receita" className="mt-6">
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Criar Receita Médica</h2>
            <ReceitaForm idAnimal={id} />
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Receitas Cadastradas</h2>
            <ReceitaList idAnimal={id} />
          </div>
        </TabsContent>

        <TabsContent value="medicacao" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Registrar Medicação</h2>
            <MedicacaoForm idAnimal={id} />
          </div>
        </TabsContent>

        <TabsContent value="vacinacao" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Registrar Vacinação</h2>
            <VacinacaoForm idAnimal={id} />
          </div>
        </TabsContent>

        <TabsContent value="editar" className="mt-6">
          <AnimalForm animal={animal as Animal} isEditing />
        </TabsContent>
      </Tabs>
    </div>
  );
}

