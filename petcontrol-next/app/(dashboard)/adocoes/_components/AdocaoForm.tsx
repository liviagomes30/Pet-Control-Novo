"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adocaoSchema, AdocaoFormData } from "../_schemas/adocao.schema";
import {
  registrarAdocao,
  listarAnimaisDisponiveis,
  listarPessoas,
  type AnimalDisponivel,
  type PessoaResumo,
} from "../_actions/adocao.actions";
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
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Animal = AnimalDisponivel;
type Pessoa = PessoaResumo;

export function AdocaoForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<AdocaoFormData>({
    resolver: zodResolver(adocaoSchema),
    defaultValues: {
      dataadocao: hojeLocal(),
      obs: "",
    },
  });

  useEffect(() => {
    async function carregarDados() {
      const [animaisRes, pessoasRes] = await Promise.all([
        listarAnimaisDisponiveis(),
        listarPessoas(),
      ]);

      if (animaisRes.success) {
        setAnimais(animaisRes.data);
      }
      if (pessoasRes.success) {
        setPessoas(pessoasRes.data);
      }
      setLoading(false);
    }
    void carregarDados();
  }, []);

  async function onSubmit(data: AdocaoFormData) {
    setIsSubmitting(true);
    try {
      const response = await registrarAdocao(data);

      if (response.success) {
        toast.success(response.message);
        router.push("/adocoes");
      } else {
        toast.error(response.message);
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            form.setError(field as keyof AdocaoFormData, {
              message: messages[0],
            });
          });
        }
      }
    } catch {
      toast.error("Erro ao registrar adoção");
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
        <FormField
          control={form.control}
          name="idanimal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Animal *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o animal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {animais.map((animal) => (
                    <SelectItem
                      key={animal.idanimal}
                      value={animal.idanimal.toString()}
                    >
                      {animal.nome} - {animal.especie}
                      {animal.raca ? ` (${animal.raca})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="idadotante"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adotante *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o adotante" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pessoas.map((pessoa) => (
                    <SelectItem
                      key={pessoa.idpessoa}
                      value={pessoa.idpessoa.toString()}
                    >
                      {pessoa.nome} - {pessoa.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pessoa_idpessoa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável pela adoção *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pessoas.map((pessoa) => (
                    <SelectItem
                      key={pessoa.idpessoa}
                      value={pessoa.idpessoa.toString()}
                    >
                      {pessoa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dataadocao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Adoção *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="obs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informações adicionais sobre a adoção..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Adoção
          </Button>
        </div>
      </form>
    </Form>
  );
}
