import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Heart, Users, Package, Calendar } from "lucide-react";
import Link from "next/link";
import { TestConnectionButton } from "./_components/TestConnectionButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">PetControl</h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema de Gestão para ONG SalvaCão
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">Entrar</Button>
            </Link>
          </div>
        </div>

        {/* Teste de Conexão Supabase */}
        <div className="mb-16">
          <TestConnectionButton />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Heart className="h-10 w-10 text-red-500 mb-2" />
              <CardTitle>Animais</CardTitle>
              <CardDescription>
                Gestão completa de resgate e cadastro
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-blue-500 mb-2" />
              <CardTitle>Adoções</CardTitle>
              <CardDescription>Controle de processos de adoção</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Package className="h-10 w-10 text-green-500 mb-2" />
              <CardTitle>Estoque</CardTitle>
              <CardDescription>Gerenciamento de medicamentos</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle>Eventos</CardTitle>
              <CardDescription>Agenda de vacinação</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
