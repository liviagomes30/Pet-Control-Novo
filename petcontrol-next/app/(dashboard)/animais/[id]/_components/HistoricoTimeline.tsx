"use client";

import { HistoricoItem } from "../_actions/historico.actions";
import { Heart, Syringe, Pill, Calendar, FileText } from "lucide-react";

interface HistoricoTimelineProps {
  items: HistoricoItem[];
}

export function HistoricoTimeline({ items }: HistoricoTimelineProps) {
  const getIcon = (tipo: HistoricoItem["tipo"]) => {
    switch (tipo) {
      case "adocao":
        return <Heart className="h-5 w-5 text-pink-500" />;
      case "vacinacao":
        return <Syringe className="h-5 w-5 text-blue-500" />;
      case "medicacao":
        return <Pill className="h-5 w-5 text-green-500" />;
      case "evento":
        return <Calendar className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTipoLabel = (tipo: HistoricoItem["tipo"]) => {
    switch (tipo) {
      case "adocao":
        return "Adoção";
      case "vacinacao":
        return "Vacinação";
      case "medicacao":
        return "Medicação";
      case "evento":
        return "Evento";
      default:
        return "Registro";
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum registro no histórico ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.tipo}-${item.id}`} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-white border-2 border-gray-200 p-2">
              {getIcon(item.tipo)}
            </div>
            {index < items.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 my-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {getTipoLabel(item.tipo)}
                  </span>
                  <h3 className="font-medium text-gray-900 mt-1">
                    {item.descricao}
                  </h3>
                </div>
                <time className="text-sm text-gray-500">
                  {(() => {
                    const dateStr = item.data;
                    
                    // Verificar se tem timestamp completo (YYYY-MM-DDTHH:MM:SS)
                    if (dateStr.includes("T")) {
                      // Parse manual para evitar conversão de timezone
                      const [datePart, timePart] = dateStr.split("T");
                      const [year, month, day] = datePart.split("-");
                      const [hour, minute] = timePart.split(":");
                      
                      return `${day}/${month}/${year} ${hour}:${minute}`;
                    }
                    
                    // Data sem horário - apenas data
                    const [year, month, day] = dateStr.split("-");
                    return `${day}/${month}/${year}`;
                  })()}
                </time>
              </div>

              {/* Detalhes específicos por tipo */}
              {item.tipo === "medicacao" && item.detalhes?.medicamento && (
                <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Medicamento:</span>
                      <p className="font-medium text-gray-900">
                        {item.detalhes.medicamento}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Dose aplicada:</span>
                      <p className="font-medium text-gray-900">
                        {item.detalhes.quantidade}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {item.tipo === "vacinacao" && item.detalhes?.vacina && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Vacina:</span>
                      <p className="font-medium text-gray-900">
                        {item.detalhes.vacina}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Local:</span>
                      <p className="font-medium text-gray-900">
                        {item.detalhes.local}
                      </p>
                    </div>
                    {item.detalhes.lote && (
                      <div>
                        <span className="text-gray-600">Lote:</span>
                        <p className="font-medium text-gray-900">
                          {item.detalhes.lote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.tipo === "evento" && item.detalhes?.local && (
                <p className="text-sm text-gray-600 mt-2">
                  Local: {item.detalhes.local}
                </p>
              )}
              {item.tipo === "evento" && item.detalhes?.status && (
                <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-gray-100">
                  {item.detalhes.status}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
