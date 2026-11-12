// Ação do Svelte (use:focarAoAparecer): leva o foco ao elemento assim que ele
// aparece. Usada nos avisos de erro, para que teclado e leitor de tela os
// encontrem depois que o botão de envio volta a ficar disponível.
// O elemento precisa de tabindex="-1" para poder receber foco.
export function focarAoAparecer(elemento: HTMLElement) {
  elemento.focus();
}
