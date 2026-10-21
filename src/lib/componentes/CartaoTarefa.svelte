
<script lang="ts">
  import type { Tarefa } from "../../tipos";
  import {
    ROTULOS_STATUS,
    ROTULOS_PRIORIDADE,
    formatarPrazo
  } from "../utils/rotulos";

  let { tarefa }: { tarefa: Tarefa } = $props();

  // Identifica o status pelo rótulo definido no projeto
  const classeStatus = (status: Tarefa["status"]) => {
    const rotulo = ROTULOS_STATUS[status]
      .toLowerCase()
      .trim();

    if (rotulo === "a fazer") return "afazer";
    if (rotulo === "em andamento") return "andamento";
    if (rotulo === "em revisão" || rotulo === "em revisao") {
      return "revisao";
    }
    if (rotulo === "concluída" || rotulo === "concluida") {
      return "concluida";
    }

    return "padrao";
  };
</script>

<article class="cartao">
  <h3>{tarefa.titulo}</h3>

  <div class="selos">
    <!-- Status da tarefa -->
    <span class="selo status {classeStatus(tarefa.status)}">
      {ROTULOS_STATUS[tarefa.status]}
    </span>

    <!-- Prioridade da tarefa -->
    <span class="selo prioridade {tarefa.prioridade}">
      Prioridade {ROTULOS_PRIORIDADE[tarefa.prioridade].toLowerCase()}
    </span>
  </div>

  <dl>
    <div class="informacao">
      <dt>Responsável</dt>
      <dd>{tarefa.responsavel}</dd>
    </div>

    <div class="informacao">
      <dt>Prazo</dt>
      <dd>{formatarPrazo(tarefa.prazo)}</dd>
    </div>
  </dl>
</article>

<style>
  /* Estrutura principal */
  .cartao {
    height: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid #c9ced6;
    border-radius: 10px;
    padding: 1.25rem;
    background-color: #ffffff;
    color: #1f2328;
    overflow-wrap: anywhere;
  }

  /* Título */
  h3 {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.5;
  }

  /* Indicadores */
  .selos {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .selo {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.25rem 0.65rem;
    border: 1px solid #c9ced6;
    border-radius: 999px;
    font-size: 0.8rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  /* Cores dos status */
  .status.afazer {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }

  .status.andamento {
    background-color: #dbeafe;
    border-color: #60a5fa;
    color: #1d4ed8;
  }

  .status.revisao {
    background-color: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
  }

  .status.concluida {
    background-color: #dcfce7;
    border-color: #4ade80;
    color: #166534;
  }

  .status.padrao {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    color: #334155;
  }

  /* Cores das prioridades */
  .prioridade.alta {
    background-color: #ffe3e3;
    border-color: #d1242f;
    color: #8b1e27;
  }

  .prioridade.media {
    background-color: #fff4d6;
    border-color: #bf8700;
    color: #805900;
  }

  .prioridade.baixa {
    background-color: #e6f4ea;
    border-color: #1a7f37;
    color: #17652e;
  }

  /* Informações */
  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin: 0;
  }

  .informacao {
    min-width: 0;
  }

  dt {
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    color: #59636e;
  }

  dd {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  /* Responsividade */
  @media (max-width: 480px) {
    .cartao {
      padding: 1rem;
      border-radius: 8px;
    }

    h3 {
      font-size: 1rem;
    }

    .selos {
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }

    .selo {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

    dl {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    dd {
      font-size: 0.9rem;
    }
  }
</style>
