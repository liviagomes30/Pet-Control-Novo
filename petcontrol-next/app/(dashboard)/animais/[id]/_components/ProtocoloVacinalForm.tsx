"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  protocoloVacinalSchema,
  ProtocoloVacinalFormData,
  TIPOS_PROTOCOLO_VACINAL,
  TipoProtocoloVacinal,
} from "../_schemas/vacinacao.schema";
import {
  criarProtocoloVacinal,
  listarVacinas,
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
import { Loader2, CalendarPlus, Info } from "lucide-react";

interface ProtocoloVacinalFormProps {
  idAnimal: number;
  onSuccess?: () => void;
}

interface Vacina {
  idproduto: number;
  lote: string;
  validade: string;
  produto: { nome: string };
}

export function ProtocoloVacinalForm({
  idAnimal,
  onSuccess,
}: ProtocoloVacinalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<ProtocoloVacinalFormData>({
    resolver: zodResolver(protocoloVacinalSchema),
    defaultValues: {
      idanimal: idAnimal,
      idvacina: 0,
      tipo_protocolo: "dose_unica",
      total_doses: null,
      intervalo_dias: null,
      data_inicio: new Date().toISOString().split("T")[0],
      observacoes: null,
    },
  });

  const tipoProtocolo = useWatch({
    control: form.control,
    name: "tipo_protocolo",
  }) as TipoProtocoloVacinal;

  // Definir campos visíveis por tipo
  const showTotalDoses = tipoProtocolo === "protocolo_inicial";
  const showIntervaloDias = ["protocolo_inicial", "personalizado"].includes(
    tipoProtocolo
  );

  // Sugestões de intervalo
  const intervalosComuns = {
    protocolo_inicial: [
      { valor: 21, label: "21 dias" },
      { valor: 30, label: "30 dias" },
    ],
    personalizado: [
      { valor: 30, label: "30 dias (mensal)" },
      { valor: 90, label: "90 dias (trimestral)" },
      { valor: 180, label: "180 dias (semestral)" },
      { valor: 365, label: "365 dias (anual)" },
    ],
  };

  useEffect(() => {
    async function carregarVacinas() {
      const response = await listarVacinas();
      if (response.success) {
        setVacinas(response.data as Vacina[]);
      }
      setLoading(false);
    }
    carregarVacinas();
  }, []);

  async function onSubmit(data: ProtocoloVacinalFormData) {
    setIsSubmitting(true);
    try {
      const response = await criarProtocoloVacinal(data);

      if (response.success) {
        toast.success(response.message);
        form.reset();
        onSuccess?.();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Erro ao criar protocolo");
    } finally {
      setIsSubmitting(false);
    }
  }

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
        {/* Explicação */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CalendarPlus className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">
                Criar Protocolo de Vacinação
              </p>
              <p className="text-sm text-purple-700">
                Define um esquema vacinal com agendamento automático de doses.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Protocolo */}
          <FormField
            control={form.control}
            name="tipo_protocolo"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Tipo de Protocolo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TIPOS_PROTOCOLO_VACINAL).map(
                      ([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {tipoProtocolo && (
                  <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {TIPOS_PROTOCOLO_VACINAL[tipoProtocolo].descricao} (
                    {TIPOS_PROTOCOLO_VACINAL[tipoProtocolo].exemplo})
                  </p>
                )}
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
                  value={field.value?.toString()}
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
                        {vac.produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Início */}
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Total de Doses - Condicional */}
          {showTotalDoses && (
            <FormField
              control={form.control}
              name="total_doses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total de Doses *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="2"
                      placeholder="Ex: 3 (protocolo de 3 doses)"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Intervalo em Dias - Condicional */}
          {showIntervaloDias && (
            <FormField
              control={form.control}
              name="intervalo_dias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intervalo entre Doses (dias) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 21, 30, 365"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <div className="flex gap-2 mt-2">
                    {intervalosComuns[
                      tipoProtocolo as keyof typeof intervalosComuns
                    ]?.map((int) => (
                      <Button
                        key={int.valor}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(int.valor)}
                      >
                        {int.label}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    placeholder="Observações sobre o protocolo..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CalendarPlus className="mr-2 h-4 w-4" />
          Criar Protocolo Vacinal
        </Button>
      </form>
    </Form>
  );
}
