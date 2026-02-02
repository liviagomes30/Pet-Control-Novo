import { AdocaoForm } from "../_components/AdocaoForm";

export const metadata = {
  title: "Nova Adoção | PetControl",
  description: "Registrar nova adoção",
};

export default function NovaAdocaoPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nova Adoção</h1>
        <p className="text-gray-600 mt-2">
          Registre a adoção de um animal disponível
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <AdocaoForm />
      </div>
    </div>
  );
}
