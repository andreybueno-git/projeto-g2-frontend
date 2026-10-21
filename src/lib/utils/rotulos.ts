import type { Status, Prioridade } from "../../tipos";

export const ROTULOS_STATUS: Record<Status, string> = {
  "a-fazer": "A fazer",
  "em-andamento": "Em andamento",
  "em-revisao": "Em revisão",
  "concluida": "Concluída",
};

export const ROTULOS_PRIORIDADE: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

// "2026-09-08" vira "08/09/2026". Não use new Date(prazo): ele lê a data como
// UTC e, no fuso do Brasil, mostra o dia anterior.
export function formatarPrazo(prazo: string): string {
  const [ano, mes, dia] = prazo.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return prazo;
  return `${dia}/${mes}/${ano}`;
}
