<script lang="ts">
  import type { Tarefa } from "../../tipos";
  import { ROTULOS_STATUS, ROTULOS_PRIORIDADE, formatarPrazo } from "../rotulos";

  let { tarefa }: { tarefa: Tarefa } = $props();
</script>

<article class="cartao">
  <h3>{tarefa.titulo}</h3>

  <div class="selos">
    <span class="selo status">{ROTULOS_STATUS[tarefa.status]}</span>
    <span class="selo prioridade {tarefa.prioridade}">
      Prioridade {ROTULOS_PRIORIDADE[tarefa.prioridade].toLowerCase()}
    </span>
  </div>

  <dl>
    <div>
      <dt>Responsável</dt>
      <dd>{tarefa.responsavel}</dd>
    </div>
    <div>
      <dt>Prazo</dt>
      <dd>{formatarPrazo(tarefa.prazo)}</dd>
    </div>
  </dl>
</article>

<style>
  .cartao {
    border: 1px solid #c9ced6;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
    color: #1f2328;
  }
  h3 {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
  }
  .selos {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .selo {
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    border: 1px solid #c9ced6;
  }
  .prioridade.alta {
    background: #ffe3e3;
    border-color: #d1242f;
  }
  .prioridade.media {
    background: #fff4d6;
    border-color: #bf8700;
  }
  .prioridade.baixa {
    background: #e6f4ea;
    border-color: #1a7f37;
  }
  dl {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  dt {
    font-size: 0.75rem;
    color: #59636e;
  }
  dd {
    margin: 0;
  }
</style>
