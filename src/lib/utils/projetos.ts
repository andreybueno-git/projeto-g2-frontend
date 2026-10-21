import type { NovoProjeto } from "../../tipos";

// Campos que a pessoa preenche no formulário. O id vem da API e o criadoEm é
// definido no cadastro.
export type CamposProjeto = Pick<NovoProjeto, "nome" | "descricao" | "disciplina">;

// Data de hoje no fuso do computador, no formato "2026-10-21".
// Não use new Date().toISOString(): ele usa UTC e, no Brasil, depois das 21h
// já devolve o dia seguinte.
export function hojeLocal(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
