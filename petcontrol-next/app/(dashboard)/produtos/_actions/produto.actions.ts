"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export type ProdutoComEstoque = {
  idproduto: number;
  nome: string;
  idtipoproduto: number;
  idunidademedida: number;
  fabricante: string | null;
  preco: number | null;
  estoque_minimo: number | null;
  ativo: boolean | null;
  tipo: { descricao: string } | null;
  unidade: { descricao: string; sigla: string | null } | null;
  estoque: { quantidade: number } | null;
  isMedicamento: boolean;
  isVacina: boolean;
};

/**
 * Listar todos os produtos com estoque
 */
export async function listarProdutosComEstoque(): Promise<ActionResponse<ProdutoComEstoque[]>> {
  try {
    const supabase = await createClient();

    // Buscar produtos
    const { data: produtos, error: produtosError } = await supabase
      .from("produto")
      .select("*")
      .order("nome", { ascending: true });

    if (produtosError) {
      return { success: false, message: produtosError.message };
    }

    // Buscar dados relacionados para cada produto
    const produtosCompletos = await Promise.all(
      (produtos || []).map(async (produto) => {
        const [tipoRes, unidadeRes, estoqueRes, medicamentoRes, vacinaRes] = await Promise.all([
          supabase
            .from("tipoproduto")
            .select("descricao")
            .eq("idtipoproduto", produto.idtipoproduto)
            .single(),
          supabase
            .from("unidadedemedida")
            .select("descricao, sigla")
            .eq("idunidademedida", produto.idunidademedida)
            .single(),
          supabase
            .from("estoque")
            .select("quantidade")
            .eq("idproduto", produto.idproduto)
            .single(),
          supabase
            .from("medicamento")
            .select("idproduto")
            .eq("idproduto", produto.idproduto)
            .single(),
          supabase
            .from("vacina")
            .select("idproduto")
            .eq("idproduto", produto.idproduto)
            .single(),
        ]);

        return {
          ...produto,
          tipo: tipoRes.data,
          unidade: unidadeRes.data,
          estoque: estoqueRes.data,
          isMedicamento: !!medicamentoRes.data,
          isVacina: !!vacinaRes.data,
        };
      })
    );

    return {
      success: true,
      message: "Produtos carregados",
      data: produtosCompletos,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Filtrar produtos por nome ou tipo
 */
export async function filtrarProdutos(
  termo: string,
  campo: "nome" | "tipo"
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    if (campo === "nome") {
      const { data, error } = await supabase
        .from("produto")
        .select("*")
        .ilike("nome", `%${termo}%`)
        .order("nome", { ascending: true });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: "Produtos filtrados", data };
    }

    // Filtrar por tipo é mais complexo, precisa buscar o tipo primeiro
    return { success: true, message: "Filtro por tipo não implementado ainda", data: [] };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
