import { listarAdocoes } from "./_actions/adocao.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

export const metadata = {
  title: "Adoções | PetControl",
  description: "Gestão de adoções da ONG SalvaCão",
};

export default async function AdocoesPage() {
  const { data: adocoes } = await listarAdocoes();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adoções</h1>
          <p className="text-gray-600 mt-2">
            Histórico de adoções realizadas
          </p>
        </div>
        <Link href="/adocoes/novo">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Adoção
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Animal</TableHead>
              <TableHead>Adotante</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!adocoes || adocoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Nenhuma adoção registrada
                </TableCell>
              </TableRow>
            ) : (
              adocoes.map((adocao: any) => (
                <TableRow key={adocao.idadocao}>
                  <TableCell className="font-medium">
                    {adocao.animal?.nome || "N/A"}
                  </TableCell>
                  <TableCell>{adocao.adotante?.nome || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(adocao.dataadocao).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{adocao.adotante?.telefone || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {adocao.obs || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
