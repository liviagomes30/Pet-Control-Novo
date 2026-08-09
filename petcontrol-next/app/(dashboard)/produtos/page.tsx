import { listarProdutosComEstoque, ProdutoComEstoque } from "./_actions/produto.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";

export const metadata = {
  title: "Produtos e Estoque | PetControl",
  description: "Gestão de produtos e estoque da ONG SalvaCão",
};

export default async function ProdutosPage() {
  const resultado = await listarProdutosComEstoque();
  const produtos = resultado.success ? resultado.data : [];

  const getEstoqueBadge = (produto: ProdutoComEstoque) => {
    const quantidade = produto.estoque?.quantidade || 0;
    const minimo = produto.estoque_minimo || 0;

    if (quantidade === 0) {
      return <Badge className="bg-red-500">Sem estoque</Badge>;
    }
    if (quantidade <= minimo) {
      return <Badge className="bg-yellow-500">Estoque baixo</Badge>;
    }
    return <Badge className="bg-green-500">Disponível</Badge>;
  };

  const getTipoBadge = (produto: ProdutoComEstoque) => {
    if (produto.isMedicamento) {
      return <Badge variant="outline" className="bg-blue-50">Medicamento</Badge>;
    }
    if (produto.isVacina) {
      return <Badge variant="outline" className="bg-purple-50">Vacina</Badge>;
    }
    return <Badge variant="outline">{produto.tipo?.descricao || "Outro"}</Badge>;
  };

  // Estatísticas
  const totalProdutos = produtos?.length || 0;
  const produtosSemEstoque = produtos?.filter(p => (p.estoque?.quantidade || 0) === 0).length || 0;
  const produtosEstoqueBaixo = produtos?.filter(p => {
    const qtd = p.estoque?.quantidade || 0;
    const min = p.estoque_minimo || 0;
    return qtd > 0 && qtd <= min;
  }).length || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Produtos e Estoque</h1>
        <p className="text-gray-600 mt-2">
          Gestão de medicamentos, vacinas e outros produtos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total de Produtos</p>
              <p className="text-2xl font-bold">{totalProdutos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Estoque Baixo</p>
              <p className="text-2xl font-bold">{produtosEstoqueBaixo}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Sem Estoque</p>
              <p className="text-2xl font-bold">{produtosSemEstoque}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fabricante</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!produtos || produtos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Nenhum produto cadastrado
                </TableCell>
              </TableRow>
            ) : (
              produtos.map((produto) => (
                <TableRow key={produto.idproduto}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell>{getTipoBadge(produto)}</TableCell>
                  <TableCell>{produto.fabricante || "-"}</TableCell>
                  <TableCell>
                    {produto.unidade?.sigla || produto.unidade?.descricao || "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {produto.estoque?.quantidade || 0}
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {produto.estoque_minimo || "-"}
                  </TableCell>
                  <TableCell>{getEstoqueBadge(produto)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
