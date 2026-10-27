import type { Prioridade, Status, Tarefa } from "../../tipos";

export type FiltroStatus = Status | "todos";
export type FiltroPrioridade = Prioridade | "todas";

export interface CriteriosFiltro {
  busca: string;
  status: FiltroStatus;
  prioridade: FiltroPrioridade;
}

// Minúsculas, sem acentos e sem espaços nas pontas: "Relatório " casa com "relatorio".
export function normalizarTexto(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

// Busca por título, status e prioridade ao mesmo tempo: a tarefa só aparece se
// passar por todos os critérios. Devolve uma lista nova e não altera a original.
export function filtrarTarefas(tarefas: Tarefa[], criterios: CriteriosFiltro): Tarefa[] {
  const termo = normalizarTexto(criterios.busca);

  return tarefas.filter(
    (tarefa) =>
      (criterios.status === "todos" || tarefa.status === criterios.status) &&
      (criterios.prioridade === "todas" || tarefa.prioridade === criterios.prioridade) &&
      (termo === "" || normalizarTexto(tarefa.titulo).includes(termo))
  );
}
