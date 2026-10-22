type CampoTexto = HTMLInputElement | HTMLTextAreaElement;

export function textoObrigatorioValido(valor: string): boolean {
  return valor.trim().length > 0;
}

// Complementa required sem substituir a validação nativa e os erros acessíveis.
export function validarObrigatorios(formulario: HTMLFormElement) {
  const mensagem = 'Preencha este campo com texto, sem usar somente espaços.';
  const camposComErro = new Set<CampoTexto>();

  function ehTexto(alvo: EventTarget | null): alvo is CampoTexto {
    return alvo instanceof HTMLTextAreaElement
      || (alvo instanceof HTMLInputElement && alvo.type === 'text');
  }

  function validar(campo: CampoTexto) {
    // O campo vazio já é tratado por required. Aqui cobrimos texto só com espaços.
    if (campo.required && campo.value !== '' && !textoObrigatorioValido(campo.value)) {
      campo.setCustomValidity(mensagem);
      camposComErro.add(campo);
    } else if (camposComErro.has(campo)) {
      if (campo.validationMessage === mensagem) campo.setCustomValidity('');
      camposComErro.delete(campo);
    }
  }

  function aoAlterar(evento: Event) {
    if (ehTexto(evento.target)) validar(evento.target);
  }

  // Captura atualiza validity antes de o auxiliar de acessibilidade ler o campo.
  formulario.addEventListener('input', aoAlterar, true);
  formulario.addEventListener('change', aoAlterar, true);
  for (const campo of formulario.elements) {
    if (ehTexto(campo)) validar(campo);
  }

  return {
    destroy() {
      formulario.removeEventListener('input', aoAlterar, true);
      formulario.removeEventListener('change', aoAlterar, true);
      for (const campo of camposComErro) {
        if (campo.validationMessage === mensagem) campo.setCustomValidity('');
      }
    }
  };
}
