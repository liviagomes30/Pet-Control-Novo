"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listarAnimais, filtrarAnimais, deletarAnimal } from "../_actions/animal.actions";
import { Animal } from "@/lib/database.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, PlusCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type FiltroTipo = "nome" | "especie" | "raca";

interface AnimalListProps {
  initialData?: Animal[];
}

export function AnimalList({ initialData }: AnimalListProps) {
  const [filtro, setFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<FiltroTipo>("nome");
  const [debouncedFiltro, setDebouncedFiltro] = useState("");
  const queryClient = useQueryClient();

  // Debounce do filtro
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFiltro(filtro);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtro]);

  // Query para listar animais
  const { data: animais, isLoading } = useQuery({
    queryKey: ["animais", debouncedFiltro, tipoFiltro],
    queryFn: async () => {
      const response = debouncedFiltro
        ? await filtrarAnimais(debouncedFiltro, tipoFiltro)
        : await listarAnimais();

      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data as Animal[];
    },
    initialData: debouncedFiltro ? undefined : initialData,
  });

  // Mutation para deletar animal
  const deleteMutation = useMutation({
    mutationFn: deletarAnimal,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
        queryClient.invalidateQueries({ queryKey: ["animais"] });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar");
    },
  });

  // Helper para cor do status
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
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select
            value={tipoFiltro}
            onValueChange={(val) => setTipoFiltro(val as FiltroTipo)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome">Nome</SelectItem>
              <SelectItem value="especie">Espécie</SelectItem>
              <SelectItem value="raca">Raça</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-9 w-full sm:w-[250px]"
            />
          </div>
        </div>

        <Link href="/animais/novo">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Animal
          </Button>
        </Link>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Espécie</TableHead>
              <TableHead>Raça</TableHead>
              <TableHead>Porte</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Castrado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : animais?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Nenhum animal encontrado
                </TableCell>
              </TableRow>
            ) : (
              animais?.map((animal) => (
                <TableRow key={animal.idanimal}>
                  <TableCell className="font-medium">{animal.nome}</TableCell>
                  <TableCell>{animal.especie}</TableCell>
                  <TableCell>{animal.raca || "-"}</TableCell>
                  <TableCell>{animal.porte || "-"}</TableCell>
                  <TableCell>{animal.sexo}</TableCell>
                  <TableCell>{getStatusBadge(animal.status)}</TableCell>
                  <TableCell>{animal.castrado ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/animais/${animal.idanimal}`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir {animal.nome}? Esta
                              ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(animal.idanimal)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
