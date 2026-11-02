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

async function requisitarResposta(caminho: string, opcoes?: RequestInit): Promise<Response> {
  const resposta = await fetch(`${API_URL}${caminho}`, opcoes);
  if (!resposta.ok) {
    throw new ErroApi(resposta.status, `Erro ${resposta.status} em ${caminho}`);
  }
  return resposta;
}

async function requisitar<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  const resposta = await requisitarResposta(caminho, opcoes);
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

export async function excluirTarefa(id: string): Promise<void> {
  // DELETE pode responder com o registro (200) ou sem conteúdo (204).
  // O sucesso depende do status HTTP, sem tentar ler um JSON vazio.
  await requisitarResposta(`/tarefas/${encodeURIComponent(id)}`, { method: "DELETE" });
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
