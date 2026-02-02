import { AnimalForm } from "../_components/AnimalForm";

export const metadata = {
  title: "Novo Animal | PetControl",
  description: "Cadastrar novo animal na ONG SalvaCão",
};

export default function NovoAnimalPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Novo Animal</h1>
        <p className="text-gray-600 mt-2">
          Cadastre um novo animal na ONG
        </p>
      </div>

      <AnimalForm />
    </div>
  );
}
