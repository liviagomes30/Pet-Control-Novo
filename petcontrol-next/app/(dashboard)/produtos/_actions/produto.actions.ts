"use server";

import { requireUser } from "@/lib/auth/require-user";
import { falha, sucesso, type ActionResult } from "@/lib/actions/result";

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
export async function listarProdutosComEstoque(): Promise<ActionResult<ProdutoComEstoque[]>> {
  try {
    const { supabase } = await requireUser();

    // Buscar produtos
    const { data: produtos, error: produtosError } = await supabase
      .from("produto")
      .select("*")
      .order("nome", { ascending: true });

    if (produtosError) return falha(produtosError, "listarProdutosComEstoque");

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

    return sucesso(produtosCompletos, "Produtos carregados");
  } catch (error) {
    return falha(error, "listarProdutosComEstoque");
  }
}
