import Link from "next/link";
import {
  buscarEstatisticasDashboard,
  buscarProximosCompromissos,
  ProximoCompromisso,
} from "./_actions/dashboard.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PawPrint,
  Syringe,
  Pill,
  Calendar,
  FileText,
  Heart,
  AlertCircle,
  ChevronRight,
  Clock,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Dashboard | PetControl - ONG SalvaCão",
  description: "Painel de controle do sistema PetControl",
};

export default async function DashboardPage() {
  const [statsRes, compromissosRes] = await Promise.all([
    buscarEstatisticasDashboard(),
    buscarProximosCompromissos(),
  ]);

  const stats = statsRes.data;
  const compromissos = compromissosRes.data || [];

  const getUrgenciaBadge = (urgencia: ProximoCompromisso["urgencia"]) => {
    switch (urgencia) {
      case "hoje":
        return <Badge className="bg-red-500">Hoje</Badge>;
      case "amanha":
        return <Badge className="bg-orange-500">Amanhã</Badge>;
      case "semana":
        return <Badge className="bg-yellow-500">Esta Semana</Badge>;
      default:
        return <Badge variant="secondary">Futuro</Badge>;
    }
  };

  const getTipoIcon = (tipo: ProximoCompromisso["tipo"]) => {
    return tipo === "vacinacao" ? (
      <Syringe className="h-5 w-5 text-blue-500" />
    ) : (
      <Pill className="h-5 w-5 text-green-500" />
    );
  };

  const formatarData = (dataStr: string) => {
    const partes = dataStr.split("T")[0].split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo ao PetControl 🐾
        </h1>
        <p className="text-gray-600 mt-1">
          Painel de controle da ONG SalvaCão
        </p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/animais" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <PawPrint className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">{stats?.totalAnimais || 0}</span>
            </div>
            <p className="mt-2 text-sm opacity-90">Total de Animais</p>
          </div>
        </Link>

        <Link href="/animais?status=Disponível" className="block">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <Heart className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">{stats?.animaisDisponiveis || 0}</span>
            </div>
            <p className="mt-2 text-sm opacity-90">Para Adoção</p>
          </div>
        </Link>

        <Link href="/adocoes" className="block">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">{stats?.animaisAdotados || 0}</span>
            </div>
            <p className="mt-2 text-sm opacity-90">Adotados</p>
          </div>
        </Link>

        <Link href="/animais?status=Em%20Tratamento" className="block">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-8 w-8 opacity-80" />
              <span className="text-3xl font-bold">{stats?.animaisEmTratamento || 0}</span>
            </div>
            <p className="mt-2 text-sm opacity-90">Em Tratamento</p>
          </div>
        </Link>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Compromissos */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-lg">Próximos Compromissos</h2>
            </div>
            <Link href="/agenda">
              <Button variant="ghost" size="sm">
                Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="divide-y">
            {compromissos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum compromisso agendado</p>
              </div>
            ) : (
              compromissos.slice(0, 8).map((comp) => (
                <Link
                  key={comp.id}
                  href={`/animais/${comp.animalId}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getTipoIcon(comp.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {comp.animalNome}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {comp.produtoNome}
                      {comp.dose && ` - ${comp.dose}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {getUrgenciaBadge(comp.urgencia)}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatarData(comp.dataAgendada)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Painel Lateral */}
        <div className="space-y-6">
          {/* Resumo de Saúde */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Resumo de Saúde
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Protocolos Vacinais</span>
                </div>
                <span className="font-bold text-blue-600">
                  {stats?.protocolosAtivos || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Receitas Ativas</span>
                </div>
                <span className="font-bold text-green-600">
                  {stats?.receitasAtivas || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Medicações Pendentes</span>
                </div>
                <span className="font-bold text-orange-600">
                  {stats?.medicacoesPendentes || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/animais/novo">
                <Button variant="outline" className="w-full justify-start">
                  <PawPrint className="h-4 w-4 mr-2" />
                  Novo Animal
                </Button>
              </Link>
              <Link href="/adocoes/novo">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Nova Adoção
                </Button>
              </Link>
              <Link href="/animais">
                <Button variant="outline" className="w-full justify-start">
                  <Syringe className="h-4 w-4 mr-2" />
                  Vacinar
                </Button>
              </Link>
              <Link href="/produtos">
                <Button variant="outline" className="w-full justify-start">
                  <Pill className="h-4 w-4 mr-2" />
                  Estoque
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
