import {
  criarTarefa, atualizarTarefa, criarProjeto, atualizarProjeto,
} from '../src/lib/servicos/api';
import type {
  NovaTarefa, NovoProjeto, Tarefa, Projeto,
} from '../src/tipos';

// Este arquivo é verificado pelo TypeScript, sem executar requisições.
function verificarContratos() {
  const tarefa: NovaTarefa = {
    projetoId: '1', titulo: 'Estudar tipos', descricao: 'Conferir os contratos',
    status: 'a-fazer', prioridade: 'media', responsavel: 'Andrey', prazo: '2026-10-31',
  };
  const projeto: NovoProjeto = {
    nome: 'Frontend', descricao: 'Projeto da disciplina',
    disciplina: 'Frameworks', criadoEm: '2026-10-21',
  };
  const novaTarefa: Promise<Tarefa> = criarTarefa(tarefa);
  const tarefaAtualizada: Promise<Tarefa> = atualizarTarefa('1', { status: 'concluida' });
  const novoProjeto: Promise<Projeto> = criarProjeto(projeto);
  const projetoAtualizado: Promise<Projeto> = atualizarProjeto('1', { nome: 'Outro nome' });

  // @ts-expect-error O id é gerado pela API, não faz parte do cadastro.
  criarTarefa({ ...tarefa, id: 'inventado' });
  // @ts-expect-error Também não se envia id na criação de projeto.
  criarProjeto({ ...projeto, id: 'inventado' });
  // @ts-expect-error O id não pode ser trocado pelo corpo do PATCH.
  atualizarTarefa('1', { id: 'outro' });
  // @ts-expect-error O id do projeto também pertence à URL.
  atualizarProjeto('1', { id: 'outro' });
  // @ts-expect-error Apenas os status do contrato são válidos.
  atualizarTarefa('1', { status: 'feito' });
  // @ts-expect-error Campos desconhecidos não pertencem ao contrato.
  atualizarProjeto('1', { cor: 'azul' });
  // @ts-expect-error criadoEm continua obrigatório na criação de projeto.
  criarProjeto({ nome: 'Projeto', descricao: 'Descrição', disciplina: 'Frontend' });

  return { novaTarefa, tarefaAtualizada, novoProjeto, projetoAtualizado };
}
void verificarContratos;
