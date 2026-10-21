import type {
  Tarefa, Projeto, NovaTarefa, NovoProjeto, AtualizacaoTarefa, AtualizacaoProjeto,
} from "../../tipos";

// Endereço do json-server. No Marco 6 isso vira variável de ambiente.
const API_URL = "http://localhost:3000";

export class ErroApi extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

async function requisitar<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, opcoes);
  if (!resposta.ok) {
    throw new ErroApi(resposta.status, `Erro ${resposta.status} em ${caminho}`);
  }
  return (await resposta.json()) as T;
}

export type ProjetoComTarefas = Projeto & { tarefas: Tarefa[] };

export function listarTarefas(): Promise<Tarefa[]> {
  return requisitar<Tarefa[]>("/tarefas");
}

export function criarTarefa(dados: NovaTarefa): Promise<Tarefa> {
  return requisitar<Tarefa>("/tarefas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}

export function atualizarTarefa(id: string, dados: AtualizacaoTarefa): Promise<Tarefa> {
  return requisitar<Tarefa>(`/tarefas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}

export function buscarTarefa(id: string): Promise<Tarefa> {
  return requisitar<Tarefa>(`/tarefas/${encodeURIComponent(id)}`);
}

export function listarProjetos(): Promise<Projeto[]> {
  return requisitar<Projeto[]>("/projetos");
}

export function criarProjeto(dados: NovoProjeto): Promise<Projeto> {
  return requisitar<Projeto>("/projetos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}

export function atualizarProjeto(id: string, dados: AtualizacaoProjeto): Promise<Projeto> {
  return requisitar<Projeto>(`/projetos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}

export function buscarProjeto(id: string): Promise<Projeto> {
  return requisitar<Projeto>(`/projetos/${encodeURIComponent(id)}`);
}

// As tarefas de um projeto vêm pelo _embed. Não use /tarefas?projetoId=1,
// porque volta vazio (o json-server compara número com texto).
export function buscarProjetoComTarefas(id: string): Promise<ProjetoComTarefas> {
  return requisitar<ProjetoComTarefas>(
    `/projetos/${encodeURIComponent(id)}?_embed=tarefas`
  );
}
