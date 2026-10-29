import type { FiltroPrioridade, FiltroStatus } from "../utils/filtrarTarefas";

// Único lugar onde ficam a busca e os filtros das tarefas. A lista e o quadro
// leem daqui, então as duas visões mostram sempre as mesmas tarefas.
// O valor continua ao navegar entre páginas e volta ao padrão ao recarregar.
class FiltrosTarefas {
  busca = $state("");
  status = $state<FiltroStatus>("todos");
  prioridade = $state<FiltroPrioridade>("todas");

  get ativos(): boolean {
    return (
      this.busca.trim() !== "" || this.status !== "todos" || this.prioridade !== "todas"
    );
  }

  limpar(): void {
    this.busca = "";
    this.status = "todos";
    this.prioridade = "todas";
  }
}

export const filtros = new FiltrosTarefas();
