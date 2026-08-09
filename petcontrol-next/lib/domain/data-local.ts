/**
 * `new Date().toISOString().split("T")[0]` converte para UTC antes de fatiar
 * a data — depois das 21h em horário de Brasília (UTC-3), devolve o dia
 * seguinte. Esta função monta "YYYY-MM-DD" a partir dos componentes locais,
 * sem passar por UTC.
 */
export function hojeLocal(): string {
  return dataParaISOLocal(new Date());
}

export function dataParaISOLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
