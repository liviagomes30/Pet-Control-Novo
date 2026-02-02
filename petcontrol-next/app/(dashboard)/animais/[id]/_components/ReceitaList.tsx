"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, Ban, FileText, Clock, Pill } from "lucide-react";
import { toast } from "sonner";
import {
  listarReceitasPorAnimal,
  excluirReceita,
  suspenderReceita,
  verificarPodeExcluir,
} from "../_actions/receita.actions";

interface ReceitaListProps {
  readonly idAnimal: number;
  readonly onUpdate?: () => void;
}

type Receita = {
  idreceita: number;
  data: string;
  medico: string;
  clinica?: string;
  status: string;
  posologias: Array<{
    medicamento_idproduto: number;
    dose: string;
    medicamento?: { produto?: { nome: string } };
  }>;
};

export function ReceitaList({ idAnimal, onUpdate }: ReceitaListProps) {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadReceitas = async () => {
    setLoading(true);
    const response = await listarReceitasPorAnimal(idAnimal);
    if (response.success && response.data) {
      setReceitas(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReceitas();
  }, [idAnimal]);

  const handleExcluir = async (idReceita: number) => {
    setActionLoading(idReceita);
    
    // Verificar se pode excluir
    const checkResponse = await verificarPodeExcluir(idReceita);
    if (!checkResponse.data?.podeExcluir) {
      toast.error(checkResponse.message || "Não é possível excluir esta receita");
      setActionLoading(null);
      return;
    }

    const response = await excluirReceita(idReceita);
    if (response.success) {
      toast.success(response.message);
      loadReceitas();
      onUpdate?.();
    } else {
      toast.error(response.message);
    }
    setActionLoading(null);
  };

  const handleSuspender = async (idReceita: number) => {
    setActionLoading(idReceita);
    const response = await suspenderReceita(idReceita);
    if (response.success) {
      toast.success(response.message);
      loadReceitas();
      onUpdate?.();
    } else {
      toast.error(response.message);
    }
    setActionLoading(null);
  };

  const formatarData = (dataStr: string) => {
    if (dataStr.includes("T")) {
      const [datePart] = dataStr.split("T");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }
    const [year, month, day] = dataStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativa":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "Suspensa":
        return <Badge className="bg-orange-500">Suspensa</Badge>;
      case "Concluída":
        return <Badge className="bg-gray-500">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Carregando receitas...</div>;
  }

  if (receitas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma receita médica cadastrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {receitas.map((receita) => (
        <div
          key={receita.idreceita}
          className={`border rounded-lg p-4 ${
            receita.status === "Suspensa" ? "bg-orange-50 border-orange-200" :
            receita.status === "Concluída" ? "bg-gray-50 border-gray-200" :
            "bg-white"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Dr(a). {receita.medico}</span>
                {getStatusBadge(receita.status)}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatarData(receita.data)}
                </span>
                {receita.clinica && <span>{receita.clinica}</span>}
              </div>
            </div>

            {receita.status === "Ativa" && (
              <div className="flex gap-2">
                {/* Botão Suspender */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      disabled={actionLoading === receita.idreceita}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspender
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Suspender Receita?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao suspender, as doses futuras serão canceladas, mas o histórico
                        das doses já administradas será mantido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleSuspender(receita.idreceita)}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Suspender Receita
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Botão Excluir */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      disabled={actionLoading === receita.idreceita}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Receita?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação só é possível se nenhuma dose foi administrada.
                        A receita e todas as posologias serão permanentemente excluídas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleExcluir(receita.idreceita)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Lista de medicamentos */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-gray-500 mb-2">MEDICAMENTOS:</p>
            <div className="flex flex-wrap gap-2">
              {receita.posologias.map((pos, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-2 py-1 rounded"
                >
                  <Pill className="h-3 w-3" />
                  {pos.medicamento?.produto?.nome || `Medicamento #${pos.medicamento_idproduto}`}
                  <span className="text-xs">({pos.dose})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
