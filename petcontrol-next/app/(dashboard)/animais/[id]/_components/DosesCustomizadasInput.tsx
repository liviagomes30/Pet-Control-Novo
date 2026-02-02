"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Calendar, Clock } from "lucide-react";
import { DoseCustomizada } from "../_schemas/receita.schema";

interface DosesCustomizadasInputProps {
  value: DoseCustomizada[];
  onChange: (doses: DoseCustomizada[]) => void;
  medicamento?: string;
}

export function DosesCustomizadasInput({
  value = [],
  onChange,
  medicamento,
}: DosesCustomizadasInputProps) {
  const adicionarDose = () => {
    const novaDose: DoseCustomizada = {
      data_programada: new Date().toISOString().split("T")[0],
      horario: "08:00",
      quantidade: 1,
      observacao: "",
    };
    onChange([...value, novaDose]);
  };

  const removerDose = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const atualizarDose = (index: number, campo: keyof DoseCustomizada, valor: any) => {
    const novasDoses = [...value];
    novasDoses[index] = { ...novasDoses[index], [campo]: valor };
    onChange(novasDoses);
  };

  const adicionarProximos3Dias = () => {
    const hoje = new Date();
    const novasDoses: DoseCustomizada[] = [];
    
    for (let i = 0; i < 3; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      novasDoses.push({
        data_programada: data.toISOString().split("T")[0],
        horario: "08:00",
        quantidade: 1,
        observacao: "",
      });
    }
    
    onChange([...value, ...novasDoses]);
  };

  const adicionarSemanal4Semanas = () => {
    const hoje = new Date();
    const novasDoses: DoseCustomizada[] = [];
    
    for (let i = 0; i < 4; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + (i * 7));
      novasDoses.push({
        data_programada: data.toISOString().split("T")[0],
        horario: "08:00",
        quantidade: 1,
        observacao: `Semana ${i + 1}`,
      });
    }
    
    onChange([...value, ...novasDoses]);
  };

  // Ordenar doses por data e horário
  const dosesOrdenadas = [...value].sort((a, b) => {
    const dataA = new Date(`${a.data_programada}T${a.horario}`);
    const dataB = new Date(`${b.data_programada}T${b.horario}`);
    return dataA.getTime() - dataB.getTime();
  });

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm text-gray-900">
            Doses Customizadas {medicamento && `- ${medicamento}`}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Adicione datas e horários específicos para cada dose
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarProximos3Dias}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Próximos 3 dias
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarSemanal4Semanas}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            1x/semana (4 sem)
          </Button>
        </div>
      </div>

      {/* Lista de Doses */}
      {dosesOrdenadas.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">Nenhuma dose adicionada</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarDose}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Primeira Dose
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {dosesOrdenadas.map((dose, index) => {
            const originalIndex = value.findIndex(d => d === dose);
            return (
              <div
                key={originalIndex}
                className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Data */}
                <div className="col-span-3">
                  <label className="text-xs text-gray-600 block mb-1">Data</label>
                  <Input
                    type="date"
                    value={dose.data_programada}
                    onChange={(e) =>
                      atualizarDose(originalIndex, "data_programada", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>

                {/* Horário */}
                <div className="col-span-2">
                  <label className="text-xs text-gray-600 block mb-1">Horário</label>
                  <Input
                    type="time"
                    value={dose.horario}
                    onChange={(e) =>
                      atualizarDose(originalIndex, "horario", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>

                {/* Quantidade */}
                <div className="col-span-2">
                  <label className="text-xs text-gray-600 block mb-1">Qtd</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={dose.quantidade}
                    onChange={(e) =>
                      atualizarDose(
                        originalIndex,
                        "quantidade",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>

                {/* Observação */}
                <div className="col-span-4">
                  <label className="text-xs text-gray-600 block mb-1">Observação</label>
                  <Input
                    type="text"
                    placeholder="Ex: Manhã, com comida..."
                    value={dose.observacao || ""}
                    onChange={(e) =>
                      atualizarDose(originalIndex, "observacao", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>

                {/* Botão Remover */}
                <div className="col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerDose(originalIndex)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Botão Adicionar Mais */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarDose}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Dose
          </Button>
        </div>
      )}

      {/* Resumo */}
      {dosesOrdenadas.length > 0 && (
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
          <strong>{dosesOrdenadas.length}</strong> dose(s) programada(s) •
          Primeira: {new Date(dosesOrdenadas[0].data_programada).toLocaleDateString("pt-BR")} •
          Última: {new Date(dosesOrdenadas[dosesOrdenadas.length - 1].data_programada).toLocaleDateString("pt-BR")}
        </div>
      )}
    </div>
  );
}
