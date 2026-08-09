"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicacaoSchema, MedicacaoFormData } from "../_schemas/medicacao.schema";
import {
  registrarMedicacao,
  listarMedicamentos,
  listarMedicacoesAdministradasPorReceita,
  buscarAgendamentoMedicacao,
  type MedicamentoComEstoque,
  type AgendamentoMedicacao,
} from "../_actions/medicacao.actions";
import { listarReceitasPorAnimal, type ReceitaComPosologias } from "../_actions/receita.actions";
import { hojeLocal } from "@/lib/domain/data-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, FileText, CheckCircle2, TriangleAlert } from "lucide-react";

interface MedicacaoFormProps {
  idAnimal: number;
  onSuccess?: () => void;
}

type Medicamento = MedicamentoComEstoque;
type Receita = ReceitaComPosologias;

export function MedicacaoForm({ idAnimal, onSuccess }: MedicacaoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  // Map: idReceita -> array de IDs de medicamentos administrados
  const [medicacoesPorReceita, setMedicacoesPorReceita] = useState<Map<number, number[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoMedicacao | null>(null);

  const form = useForm<MedicacaoFormData>({
    resolver: zodResolver(medicacaoSchema),
    defaultValues: {
      idanimal: idAnimal,
      quantidade_administrada: 0,
      data: hojeLocal(),
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      descricao: "",
      receita_idreceita: null,
    },
  });

  const receitaSelecionada = form.watch("receita_idreceita");

  useEffect(() => {
    async function carregarDados() {
      const [medicamentosRes, receitasRes] = await Promise.all([
        listarMedicamentos(),
        listarReceitasPorAnimal(idAnimal),
      ]);
      
      if (medicamentosRes.success) {
        setMedicamentos(medicamentosRes.data);
      }
      if (receitasRes.success) {
        const receitasData = receitasRes.data;
        setReceitas(receitasData);

        // Carregar medicações administradas de TODAS as receitas
        const mapMedicacoes = new Map<number, number[]>();
        for (const receita of receitasData) {
          const medRes = await listarMedicacoesAdministradasPorReceita(receita.idreceita);
          if (medRes.success) {
            mapMedicacoes.set(receita.idreceita, medRes.data);
          }
        }
        setMedicacoesPorReceita(mapMedicacoes);
      }
      setLoading(false);
    }
    void carregarDados();
  }, [idAnimal]);

  // Atualizar medicações administradas quando selecionar uma receita específica
  useEffect(() => {
    async function carregarMedicacoesAdministradas() {
      if (receitaSelecionada) {
        const response = await listarMedicacoesAdministradasPorReceita(receitaSelecionada);
        if (response.success) {
          setMedicacoesPorReceita(prev => {
            const newMap = new Map(prev);
            newMap.set(receitaSelecionada, response.data);
            return newMap;
          });
        }
      }
    }
    if (receitaSelecionada) {
      void carregarMedicacoesAdministradas();
    }
  }, [receitaSelecionada]);

  // Buscar agendamento quando selecionar medicamento
  const medicamentoSelecionado = form.watch("medicamento_idproduto");
  useEffect(() => {
    async function buscarAgendamento() {
      if (medicamentoSelecionado) {
        const response = await buscarAgendamentoMedicacao(idAnimal, medicamentoSelecionado);
        if (response.success && response.data) {
          setAgendamentoSelecionado(response.data);
        } else {
          setAgendamentoSelecionado(null);
        }
      } else {
        setAgendamentoSelecionado(null);
      }
    }
    void buscarAgendamento();
  }, [medicamentoSelecionado, idAnimal]);

  async function onSubmit(data: MedicacaoFormData) {
    setIsSubmitting(true);
    try {
      const response = await registrarMedicacao(data);

      if (response.success) {
        toast.success(response.message);
        form.reset({
          idanimal: idAnimal,
          quantidade_administrada: 0,
          data: hojeLocal(),
          hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          descricao: "",
          receita_idreceita: null,
        });
        onSuccess?.();
      } else {
        toast.error(response.message);
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            form.setError(field as keyof MedicacaoFormData, {
              message: messages[0],
            });
          });
        }
      }
    } catch {
      toast.error("Erro ao registrar medicação");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Detectar divergência entre data/hora agendada e real
  const dataAdministracao = form.watch("data");
  const horaAdministracao = form.watch("hora");
  
  const temDivergencia = Boolean(agendamentoSelecionado) && (
    agendamentoSelecionado!.data !== dataAdministracao ||
    (agendamentoSelecionado!.hora ?? "").substring(0, 5) !== horaAdministracao
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (medicamentos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum medicamento disponível em estoque</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Receita Médica (Opcional) */}
        {receitas.length > 0 && (
          <FormField
            control={form.control}
            name="receita_idreceita"
            render={({ field }) => {
              // Filtrar receitas que ainda têm medicamentos não administrados
              const receitasDisponiveis = receitas.filter(receita => {
                // Se não temos posologias, não mostrar
                if (!receita.posologias || receita.posologias.length === 0) return false;
                
                // Buscar medicações administradas desta receita específica
                const medicacoesDestaReceita = medicacoesPorReceita.get(receita.idreceita) || [];
                
                // Verificar se há pelo menos um medicamento não administrado
                const medicamentosReceita = receita.posologias.map(p => p.medicamento_idproduto);
                const temMedicamentoPendente = medicamentosReceita.some(
                  idMed => !medicacoesDestaReceita.includes(idMed)
                );
                
                return temMedicamentoPendente;
              });

              // Se não há receitas disponíveis, não mostrar o campo
              if (receitasDisponiveis.length === 0) return <></>;

              return (
                <FormItem>
                  <FormLabel>
                    <FileText className="inline h-4 w-4 mr-1" />
                    Receita Médica (Opcional)
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? null : Number(value));
                      // Limpar medicamento selecionado ao trocar receita
                      form.setValue("medicamento_idproduto", 0);
                    }}
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma receita (ou deixe em branco)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem receita (medicação avulsa)</SelectItem>
                      {receitasDisponiveis.map((receita) => {
                        // Calcular quantos medicamentos faltam
                        const medicacoesDestaReceita = medicacoesPorReceita.get(receita.idreceita) || [];
                        const totalMedicamentos = receita.posologias.length;
                        const medicamentosAdministrados = receita.posologias.filter(p =>
                          medicacoesDestaReceita.includes(p.medicamento_idproduto)
                        ).length;
                        const medicamentosPendentes = totalMedicamentos - medicamentosAdministrados;

                        return (
                          <SelectItem
                            key={receita.idreceita}
                            value={receita.idreceita.toString()}
                          >
                            {(receita.data ?? '').split('T')[0].split('-').reverse().join('/')} - Dr(a). {receita.medico}
                            {` (${medicamentosPendentes}/${totalMedicamentos} pendente${medicamentosPendentes > 1 ? 's' : ''})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {receitaSelecionada 
                      ? "Medicamentos filtrados pela receita selecionada"
                      : "Todos os medicamentos em estoque disponíveis"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}

        <FormField
          control={form.control}
          name="medicamento_idproduto"
          render={({ field }) => {
            // Filtrar medicamentos baseado na receita selecionada
            const receitaAtual = receitas.find(r => r.idreceita === receitaSelecionada);
            const medicamentosFiltrados = receitaSelecionada && receitaAtual
              ? medicamentos.filter(med => 
                  receitaAtual.posologias.some(pos => pos.medicamento_idproduto === med.idproduto)
                )
              : medicamentos;

            // Buscar medicações administradas da receita selecionada
            const medicacoesAdministradas = receitaSelecionada 
              ? (medicacoesPorReceita.get(receitaSelecionada) || [])
              : [];

            return (
              <FormItem>
                <FormLabel>Medicamento *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o medicamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {medicamentosFiltrados.map((med) => {
                      const jaAdministrado = medicacoesAdministradas.includes(med.idproduto);
                      
                      return (
                        <SelectItem
                          key={med.idproduto}
                          value={med.idproduto.toString()}
                          disabled={jaAdministrado}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={jaAdministrado ? "line-through text-gray-400" : ""}>
                              {med.produto?.nome ?? "Produto"} (Estoque: {med.estoque})
                            </span>
                            {jaAdministrado && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {receitaSelecionada && receitaAtual && (
                  <FormDescription className="text-blue-600">
                    Posologia: {receitaAtual.posologias.find(p => p.medicamento_idproduto === field.value)?.dose}
                  </FormDescription>
                )}
                {medicacoesAdministradas.length > 0 && receitaSelecionada && (
                  <FormDescription className="text-green-600">
                    ✓ {medicacoesAdministradas.length} medicamento(s) já administrado(s) desta receita
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="quantidade_administrada"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade Administrada *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hora"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário da Administração *</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormDescription>
                Horário em que esta dose foi administrada
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informações adicionais sobre a medicação..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Alerta de Divergência de Data/Hora */}
        {temDivergencia && (
          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200 animate-in fade-in slide-in-from-top-1">
            <div className="flex">
              <div className="flex-shrink-0">
                <TriangleAlert className="h-5 w-5 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Diferente do agendado</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    <strong>Agendado:</strong> {new Date(agendamentoSelecionado!.data + 'T00:00:00').toLocaleDateString('pt-BR')} às {(agendamentoSelecionado!.hora ?? "").substring(0, 5) || "horário não definido"}
                  </p>
                  <p>
                    <strong>Administração:</strong> {new Date(dataAdministracao + 'T00:00:00').toLocaleDateString('pt-BR')} às {horaAdministracao}
                  </p>
                  <p className="mt-1 font-bold">
                    O registro será salvo assim mesmo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Medicação
        </Button>
      </form>
    </Form>
  );
}
