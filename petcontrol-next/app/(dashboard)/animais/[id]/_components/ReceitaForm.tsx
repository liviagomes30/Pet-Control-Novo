"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  receitaSchema,
  ReceitaFormData,
  TIPOS_POSOLOGIA,
  TipoPosologia,
} from "../_schemas/receita.schema";
import { criarReceita } from "../_actions/receita.actions";
import { listarMedicamentos, type MedicamentoComEstoque } from "../_actions/medicacao.actions";
import { hojeLocal } from "@/lib/domain/data-local";
import type { Control } from "react-hook-form";
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
import { Loader2, Plus, Trash2, Info } from "lucide-react";
import { DosesCustomizadasInput } from "./DosesCustomizadasInput";

interface ReceitaFormProps {
  idAnimal: number;
  onSuccess?: () => void;
}

type Medicamento = MedicamentoComEstoque;

// Componente para campos condicionais de cada medicamento
function MedicamentoFields({
  index,
  control,
  remove,
  medicamentos,
  canRemove,
}: {
  index: number;
  control: Control<ReceitaFormData>;
  remove: (index: number) => void;
  medicamentos: Medicamento[];
  canRemove: boolean;
}) {
  const tipoPosologia = useWatch({
    control,
    name: `medicamentos.${index}.tipo_posologia`,
  }) as TipoPosologia;

  // Hook no topo — nunca dentro de callback (Rules of Hooks).
  const idProdutoSelecionado = useWatch({
    control,
    name: `medicamentos.${index}.idproduto`,
  });

  // Definir quais campos mostrar baseado no tipo
  const showIntervaloHoras = ["padrao", "continuo", "se_necessario"].includes(tipoPosologia);
  const showIntervaloDias = tipoPosologia === "periodico";
  const showQuantidadeDias = ["padrao", "periodico"].includes(tipoPosologia);
  const showObservacoes = ["se_necessario", "continuo"].includes(tipoPosologia);
  const obsObrigatoria = tipoPosologia === "se_necessario";
  const showDosesCustomizadas = tipoPosologia === "especial";

  return (
    <div className="border rounded-lg p-4 mb-4 bg-gray-50">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-medium">Medicamento {index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de Posologia - Sempre visível */}
        <FormField
          control={control}
          name={`medicamentos.${index}.tipo_posologia`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Tipo de Tratamento *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(TIPOS_POSOLOGIA).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tipoPosologia && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {TIPOS_POSOLOGIA[tipoPosologia].descricao}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Medicamento - Sempre visível */}
        <FormField
          control={control}
          name={`medicamentos.${index}.idproduto`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medicamento *</FormLabel>
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
                  {medicamentos.map((med) => (
                    <SelectItem
                      key={med.idproduto}
                      value={med.idproduto.toString()}
                    >
                      {med.produto?.nome ?? "Produto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dose - Sempre visível */}
        <FormField
          control={control}
          name={`medicamentos.${index}.dose`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dose *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 2 comprimidos, 5ml" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantidade de Dias - Condicional */}
        {showQuantidadeDias && (
          <FormField
            control={control}
            name={`medicamentos.${index}.quantidadedias`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {tipoPosologia === "periodico"
                    ? "Quantidade de Doses *"
                    : "Quantidade de Dias *"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder={
                      tipoPosologia === "periodico"
                        ? "Ex: 6 (6 doses mensais)"
                        : "Ex: 7 (7 dias de tratamento)"
                    }
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

        {/* Intervalo em HORAS - Condicional */}
        {showIntervaloHoras && (
          <FormField
            control={control}
            name={`medicamentos.${index}.intervalohoras`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {tipoPosologia === "se_necessario"
                    ? "Intervalo Mínimo (horas)"
                    : "Intervalo entre Doses (horas) *"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 12 (de 12 em 12h)"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <p className="text-xs text-gray-500 mt-1">
                  24h = 1x/dia, 12h = 2x/dia, 8h = 3x/dia
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Intervalo em DIAS - Para periódico */}
        {showIntervaloDias && (
          <FormField
            control={control}
            name={`medicamentos.${index}.intervalohoras`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intervalo entre Doses (dias) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 30 (mensal), 7 (semanal)"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <p className="text-xs text-gray-500 mt-1">
                  7 = semanal, 14 = quinzenal, 30 = mensal
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Observações - Condicional */}
        {showObservacoes && (
          <FormField
            control={control}
            name={`medicamentos.${index}.observacoes`}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  Observações {obsObrigatoria ? "*" : "(opcional)"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      tipoPosologia === "se_necessario"
                        ? "Ex: Administrar se apresentar dor ou febre. Máximo 3 doses em 24h."
                        : tipoPosologia === "especial"
                        ? "Ex: Dia 1-3: 2 comp. Dia 4-7: 1 comp. Administrar à noite."
                        : "Instruções adicionais..."
                    }
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Doses Customizadas - Para Esquema Especial */}
        {showDosesCustomizadas && (
          <FormField
            control={control}
            name={`medicamentos.${index}.doses_customizadas`}
            render={({ field }) => {
              const medicamentoSelecionado = medicamentos.find(
                m => m.idproduto === idProdutoSelecionado
              );

              return (
                <FormItem className="md:col-span-2">
                  <DosesCustomizadasInput
                    value={field.value || []}
                    onChange={field.onChange}
                    medicamento={medicamentoSelecionado?.produto?.nome}
                  />
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ReceitaForm({ idAnimal, onSuccess }: ReceitaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultMedicamento = {
    idproduto: 0,
    tipo_posologia: "padrao" as TipoPosologia,
    dose: "",
    quantidadedias: null as number | null,
    frequencia_diaria: null as number | null,
    intervalohoras: null as number | null,
    observacoes: null as string | null,
  };

  const form = useForm<ReceitaFormData>({
    resolver: zodResolver(receitaSchema),
    defaultValues: {
      idanimal: idAnimal,
      data: hojeLocal(),
      medico: "",
      clinica: "",
      medicamentos: [defaultMedicamento],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medicamentos",
  });

  useEffect(() => {
    async function carregarMedicamentos() {
      const response = await listarMedicamentos();
      if (response.success) {
        setMedicamentos(response.data);
      }
      setLoading(false);
    }
    void carregarMedicamentos();
  }, []);

  async function onSubmit(data: ReceitaFormData) {
    setIsSubmitting(true);
    try {
      const response = await criarReceita(data);

      if (response.success) {
        toast.success(response.message);
        form.reset();
        onSuccess?.();
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Erro ao criar receita");
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Receita *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medico"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico Veterinário *</FormLabel>
                <FormControl>
                  <Input placeholder="Dr. João Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clinica"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clínica</FormLabel>
                <FormControl>
                  <Input placeholder="Clínica Veterinária XYZ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Medicamentos</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(defaultMedicamento)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>
          </div>

          {fields.map((field, index) => (
            <MedicamentoFields
              key={field.id}
              index={index}
              control={form.control}
              remove={remove}
              medicamentos={medicamentos}
              canRemove={fields.length > 1}
            />
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Receita
        </Button>
      </form>
    </Form>
  );
}
