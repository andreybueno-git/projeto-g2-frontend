// Texto para o usuário quando uma gravação ou exclusão falha. Diferencia
// "não existe mais" (404), erro devolvido pela API e API fora do ar.
// Com dadosMantidos, avisa que o que a pessoa digitou continua na tela.
function statusHttp(erro: unknown): number | null {
  if (erro instanceof Error && "status" in erro && typeof erro.status === "number") {
    return erro.status;
  }
  return null;
}

export function mensagemFalha(erro: unknown, acao: string, dadosMantidos = false): string {
  const tentar = dadosMantidos ? " Seus dados foram mantidos. Tente novamente." : " Tente novamente.";

  // ErroApi (api.ts) é reconhecido pelo status HTTP. Sem importar a classe, esta
  // função fica pura e pode ser testada direto com node --test.
  const status = statusHttp(erro);
  if (status !== null) {
    if (status === 404) {
      return `Não foi possível ${acao}: o registro não existe mais. Ele pode ter sido excluído por outra pessoa.`;
    }
    return `Não foi possível ${acao}: a API respondeu com erro ${status}.${tentar}`;
  }
  // fetch rejeita com TypeError quando não consegue falar com o servidor.
  if (erro instanceof TypeError) {
    return `Não foi possível ${acao}: sem resposta da API. Confira se ela está ligada.${tentar}`;
  }
  return `Não foi possível ${acao}: ocorreu um erro inesperado.${tentar}`;
}
