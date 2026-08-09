export type DashboardStats = {
  totalAnimais: number;
  animaisDisponiveis: number;
  animaisAdotados: number;
  animaisEmTratamento: number;
  vacinacoesPendentes: number;
  medicacoesPendentes: number;
  receitasAtivas: number;
  protocolosAtivos: number;
};

export type ProximoCompromisso = {
  id: string;
  tipo: "vacinacao" | "medicacao";
  animalNome: string;
  animalId: number;
  produtoNome: string;
  dataAgendada: string;
  hora?: string;
  dose?: string;
  urgencia: "atrasado" | "hoje" | "amanha" | "semana" | "futuro" | "concluido";
  status: "pendente" | "concluido";
  numeroDose?: number;
  totalDoses?: number;
};

export const ESTATISTICAS_VAZIAS: DashboardStats = {
  totalAnimais: 0,
  animaisDisponiveis: 0,
  animaisAdotados: 0,
  animaisEmTratamento: 0,
  vacinacoesPendentes: 0,
  medicacoesPendentes: 0,
  receitasAtivas: 0,
  protocolosAtivos: 0,
};
