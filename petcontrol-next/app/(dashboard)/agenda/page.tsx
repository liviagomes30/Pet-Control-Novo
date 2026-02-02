import { buscarProximosCompromissos, ProximoCompromisso } from "../_actions/dashboard.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pill, Syringe, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Agenda de Compromissos | PetControl",
  description: "Agenda de medicações e vacinações futuras",
};

export default async function AgendaPage() {
  const { data: compromissos } = await buscarProximosCompromissos();

  const getIcon = (comp: ProximoCompromisso) => {
    if (comp.status === "concluido") {
      return <CheckCircle2 className="h-4 w-4 text-gray-400" />;
    }
    return comp.tipo === "medicacao" ? (
      <Pill className="h-4 w-4 text-green-500" />
    ) : (
      <Syringe className="h-4 w-4 text-blue-500" />
    );
  };

  const getTipoBadge = (comp: ProximoCompromisso) => {
    if (comp.status === "concluido") {
      return <Badge className="bg-gray-400">Concluído</Badge>;
    }
    return comp.tipo === "medicacao" ? (
      <Badge className="bg-green-500">Medicação</Badge>
    ) : (
      <Badge className="bg-blue-500">Vacinação</Badge>
    );
  };

  const getUrgenciaBadge = (comp: ProximoCompromisso) => {
    switch (comp.urgencia) {
      case "hoje":
        return <Badge className="bg-red-500">Hoje</Badge>;
      case "amanha":
        return <Badge className="bg-orange-500">Amanhã</Badge>;
      case "semana":
        return <Badge className="bg-yellow-500">Esta Semana</Badge>;
      case "concluido":
        return <Badge className="bg-gray-400">Concluído</Badge>;
      default:
        return <Badge variant="secondary">Futuro</Badge>;
    }
  };

  const formatarDataHora = (dataStr: string, hora?: string) => {
    const partes = dataStr.split("T")[0].split("-");
    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    
    if (hora) {
      return `${dataFormatada} ${hora}`;
    }
    
    // Se não tem hora separada, tentar extrair do timestamp
    if (dataStr.includes("T")) {
      const horaParte = dataStr.split("T")[1].substring(0, 5);
      return `${dataFormatada} ${horaParte}`;
    }
    
    return dataFormatada;
  };

  // Agrupar por data
  const compromissosPorData = (compromissos || []).reduce((acc, comp) => {
    const data = comp.dataAgendada.split("T")[0];
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(comp);
    return acc;
  }, {} as Record<string, ProximoCompromisso[]>);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-3">
        <Calendar className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Agenda de Compromissos
          </h1>
          <p className="text-gray-600 mt-1">
            Próximas medicações e vacinações agendadas
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total de Compromissos</p>
              <p className="text-2xl font-bold">{compromissos?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Pill className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Medicações</p>
              <p className="text-2xl font-bold">
                {compromissos?.filter((c) => c.tipo === "medicacao").length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Syringe className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Vacinações</p>
              <p className="text-2xl font-bold">
                {compromissos?.filter((c) => c.tipo === "vacinacao").length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Compromissos */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Dose</TableHead>
              <TableHead>Urgência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!compromissos || compromissos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Nenhum compromisso agendado nos próximos 30 dias
                </TableCell>
              </TableRow>
            ) : (
              compromissos.map((comp) => (
                <TableRow 
                  key={comp.id}
                  className={comp.status === "concluido" ? "opacity-60 bg-gray-50" : ""}
                >
                  <TableCell>{getIcon(comp)}</TableCell>
                  <TableCell className="font-medium">
                    {formatarDataHora(comp.dataAgendada, comp.hora)}
                    {comp.numeroDose && comp.totalDoses && (
                      <div className="text-xs text-gray-500">
                        Dose {comp.numeroDose}/{comp.totalDoses}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/animais/${comp.animalId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {comp.animalNome}
                    </Link>
                  </TableCell>
                  <TableCell>{getTipoBadge(comp)}</TableCell>
                  <TableCell>{comp.produtoNome}</TableCell>
                  <TableCell>{comp.dose || "-"}</TableCell>
                  <TableCell>{getUrgenciaBadge(comp)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
