// Contrato de dados da disciplina (Aula 09).
// É o mesmo para todas as equipes: não mude nomes, ordem nem tipos.

export type Status = 'a-fazer' | 'em-andamento' | 'em-revisao' | 'concluida'
export type Prioridade = 'baixa' | 'media' | 'alta'

export interface Projeto {
  id: string
  nome: string
  descricao: string
  disciplina: string
  criadoEm: string
}

export interface Tarefa {
  id: string
  projetoId: string
  titulo: string
  descricao: string
  status: Status
  prioridade: Prioridade
  responsavel: string
  prazo: string
}

// Para criar uma tarefa sem id: quem gera o id é o json-server.
export type NovaTarefa = Omit<Tarefa, 'id'>

// A API gera o id; os demais campos do projeto vêm de quem faz o cadastro.
export type NovoProjeto = Omit<Projeto, 'id'>

// PATCH recebe somente os campos alterados, sem trocar o identificador.
export type AtualizacaoTarefa = Partial<NovaTarefa>
export type AtualizacaoProjeto = Partial<NovoProjeto>
