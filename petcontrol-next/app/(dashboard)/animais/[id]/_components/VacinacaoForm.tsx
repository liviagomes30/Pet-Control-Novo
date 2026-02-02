"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vacinacaoAplicadaSchema,
  ORIGENS_VACINACAO,
  OrigemVacinacao,
  TIPOS_PROTOCOLO_VACINAL,
} from "../_schemas/vacinacao.schema";
import {
  registrarVacinacao,
  listarVacinas,
  listarProtocolosAnimal,
} from "../_actions/vacinacao.actions";
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
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Syringe, Info, ExternalLink, CalendarPlus, TriangleAlert } from "lucide-react";

interface VacinacaoFormProps {
  idAnimal: number;
  onSuccess?: () => void;
}

interface Vacina {
  idproduto: number;
  lote: string;
  validade: string;
  produto: { nome: string };
}

interface Protocolo {
  idprotocolo: number;
  vacina_idproduto: number;
  vacina_nome: string;
  tipo_protocolo: string;
  doses_aplicadas: number;
  total_doses: number;
  status: string;
  data_proximo_reforco?: string;
}

export function VacinacaoForm({ idAnimal, onSuccess }: VacinacaoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(vacinacaoAplicadaSchema),
    defaultValues: {
      idanimal: idAnimal,
      idvacina: undefined,
      protocolo_idprotocolo: null,
      dose_numero: 1,
      local: "ONG SalvaCão",
      origem: "ong",
      data: new Date().toISOString().split("T")[0],
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      observacoes: "",
      criar_protocolo: false,
      tipo_novo_protocolo: undefined,
      lote_externo: "",
      aplicador_externo: "",
      total_doses_protocolo: null,
      intervalo_novo_protocolo: null
    },
  });

  const criarProtocolo = form.watch("criar_protocolo");
  const origemMap = form.watch("origem");
  const isVacinaExterna = origemMap !== "ong";

  useEffect(() => {
    async function carregarDados() {
      const [vacinasRes, protocolosRes] = await Promise.all([
        listarVacinas(),
        listarProtocolosAnimal(idAnimal),
      ]);

      if (vacinasRes.success) {
        setVacinas(vacinasRes.data as Vacina[]);
      }
      if (protocolosRes.success) {
        setProtocolos(
          (protocolosRes.data as Protocolo[]).filter((p) => p.status === "ativo")
        );
      }
      setLoading(false);
    }
    carregarDados();
  }, [idAnimal]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      // Ajuste para garantir tipos corretos
      if (!data.idvacina) {
         toast.error("Selecione uma vacina");
         setIsSubmitting(false);
         return;
      }
      
      const response = await registrarVacinacao(data);

      if (response.success) {
        toast.success(response.message);
        form.reset();
        onSuccess?.();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Erro ao registrar vacinação");
    } finally {
      setIsSubmitting(false);
    }
  }

  const protocoloSelecionadoId = form.watch("protocolo_idprotocolo");
  const protocoloSelecionado = protocolos.find(p => p.idprotocolo === protocoloSelecionadoId);
  const dataAplicacao = form.watch("data");
  
  const temDivergenciaData = protocoloSelecionado?.data_proximo_reforco && dataAplicacao && 
    protocoloSelecionado.data_proximo_reforco !== dataAplicacao;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Aviso importante */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Syringe className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                Vacinas NÃO movimentam estoque
              </p>
              <p className="text-sm text-blue-700">
                O registro é apenas para histórico e controle de protocolo vacinal.
              </p>
            </div>
          </div>
        </div>

        {/* Protocolos ativos (se houver) */}
        {protocolos.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">
              📋 Protocolos Vacinais Ativos
            </h4>
            <div className="space-y-2">
              {protocolos.map((prot) => (
                <div
                  key={prot.idprotocolo}
                  className={`flex justify-between items-center text-sm p-2 rounded border ${
                    form.watch("protocolo_idprotocolo") === prot.idprotocolo
                      ? "bg-green-100 border-green-300"
                      : "bg-white border-transparent"
                  }`}
                >
                  <span className="text-green-800">
                    {prot.vacina_nome} - Dose {prot.doses_aplicadas + 1}/
                    {prot.total_doses}
                  </span>
                  <Button
                    type="button"
                    variant={
                      form.watch("protocolo_idprotocolo") === prot.idprotocolo
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className={
                      form.watch("protocolo_idprotocolo") === prot.idprotocolo
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                    onClick={() => {
                      if (
                        form.watch("protocolo_idprotocolo") === prot.idprotocolo
                      ) {
                        // Desvincular se já selecionado
                        form.setValue("protocolo_idprotocolo", null);
                        form.setValue("dose_numero", 1);
                      } else {
                        // Vincular (Preencher dados do protocolo)
                        form.setValue("protocolo_idprotocolo", prot.idprotocolo);
                        form.setValue("dose_numero", prot.doses_aplicadas + 1);
                        form.setValue("idvacina", prot.vacina_idproduto); 
                        form.setValue("origem", "ong");
                        
                        // Auto-preencher data se disponível no protocolo
                        if (prot.data_proximo_reforco) {
                            // Opcional: form.setValue("data", prot.data_proximo_reforco);
                            // Mantemos a data de hoje para o usuário conferir, mas o alerta avisa.
                        }
                      }
                    }}
                  >
                    {form.watch("protocolo_idprotocolo") === prot.idprotocolo
                      ? "Vinculado ✓"
                      : "Vincular"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origem */}
          <FormField
            control={form.control}
            name="origem"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Origem da Vacinação *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Onde foi aplicada?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ORIGENS_VACINACAO).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label} - {value.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vacina */}
          <FormField
            control={form.control}
            name="idvacina"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vacina *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString() || ""}
                  disabled={!!form.watch("protocolo_idprotocolo")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vacinas.map((vac) => (
                      <SelectItem
                        key={vac.idproduto}
                        value={vac.idproduto.toString()}
                      >
                        {vac.produto.nome} (Lote: {vac.lote})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data */}
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Aplicação *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hora */}
          <FormField
            control={form.control}
            name="hora"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário da Aplicação *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Local */}
          <FormField
            control={form.control}
            name="local"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local de Aplicação *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      isVacinaExterna
                        ? "Ex: Clínica VetCare, Campanha Municipal"
                        : "Ex: Sala de procedimentos"
                    }
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campos extras para vacina externa */}
          {isVacinaExterna && (
            <>
              <FormField
                control={form.control}
                name="lote_externo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote (se conhecido)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Lote da vacina aplicada"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aplicador_externo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veterinário/Aplicador</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do profissional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Observações */}
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações adicionais, reações adversas, etc."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Criação de Protocolo Automático */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
          <FormField
            control={form.control}
            name="criar_protocolo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-purple-900 font-semibold cursor-pointer">
                    Agendar próximas doses (Criar Protocolo)
                  </FormLabel>
                  <p className="text-sm text-purple-700">
                    Calcula automaticamente a data do próximo reforço
                  </p>
                </div>
              </FormItem>
            )}
          />

          {criarProtocolo && (
            <div className="pt-2 pl-7 space-y-4 animate-in fade-in slide-in-from-top-2">
              <FormField
                control={form.control}
                name="tipo_novo_protocolo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Protocolo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione o tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TIPOS_PROTOCOLO_VACINAL)
                          .filter(([key]) => key !== "dose_unica")
                          .map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-purple-600 mt-1">
                      {form.watch("tipo_novo_protocolo") && 
                        TIPOS_PROTOCOLO_VACINAL[form.watch("tipo_novo_protocolo") as keyof typeof TIPOS_PROTOCOLO_VACINAL]?.descricao}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos específicos para protocolo_inicial */}
              {form.watch("tipo_novo_protocolo") === "protocolo_inicial" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="total_doses_protocolo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Doses *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2"
                            placeholder="Ex: 3"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : null)
                            }
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Número de doses necessárias (ex: V8 = 3 doses)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intervalo_novo_protocolo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo entre Doses (dias) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Ex: 21 ou 30"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : null)
                            }
                          />
                        </FormControl>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => form.setValue("intervalo_novo_protocolo", 21)}
                          >
                            21 dias
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => form.setValue("intervalo_novo_protocolo", 30)}
                          >
                            30 dias
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Informação para reforços fixos */}
              {(form.watch("tipo_novo_protocolo") === "reforco_anual" ||
                form.watch("tipo_novo_protocolo") === "reforco_semestral") && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <p className="font-medium">
                    ✓ Intervalo automático:{" "}
                    {form.watch("tipo_novo_protocolo") === "reforco_anual"
                      ? "365 dias (anual)"
                      : "180 dias (semestral)"}
                  </p>
                  <p className="text-xs mt-1">
                    O próximo reforço será agendado automaticamente
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alerta de Divergência de Data */}
        {temDivergenciaData && (
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200 animate-in fade-in slide-in-from-top-1">
            <div className="flex">
              <div className="flex-shrink-0">
                <TriangleAlert className="h-5 w-5 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Diferente do agendado</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    A data ({new Date(dataAplicacao + 'T00:00:00').toLocaleDateString('pt-BR')}) é diferente da prevista no protocolo 
                    ({new Date(protocoloSelecionado?.data_proximo_reforco! + 'T00:00:00').toLocaleDateString('pt-BR')}).
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
          <Syringe className="mr-2 h-4 w-4" />
          Registrar Vacinação
        </Button>
      </form>
    </Form>
  );
}
