type Campo = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Complementa a validação nativa: mantém o foco no primeiro campo inválido
// e deixa o erro disponível em texto, inclusive depois que o balão fecha.
export function acessibilidadeFormulario(formulario: HTMLFormElement) {
  const mensagens = new Map<Campo, HTMLParagraphElement>();

  function ehCampo(alvo: EventTarget | null): alvo is Campo {
    return alvo instanceof HTMLInputElement || alvo instanceof HTMLSelectElement
      || alvo instanceof HTMLTextAreaElement;
  }

  function limpar(campo: Campo) {
    const mensagem = mensagens.get(campo);
    if (!mensagem) return;
    const descricoes = (campo.getAttribute('aria-describedby') ?? '')
      .split(/\s+/).filter((id) => id && id !== mensagem.id);
    if (descricoes.length) campo.setAttribute('aria-describedby', descricoes.join(' '));
    else campo.removeAttribute('aria-describedby');
    campo.removeAttribute('aria-invalid');
    mensagem.remove();
    mensagens.delete(campo);
  }

  function mostrar(campo: Campo) {
    let mensagem = mensagens.get(campo);
    if (!mensagem) {
      mensagem = document.createElement('p');
      mensagem.id = `${campo.id}-erro`;
      mensagem.dataset.erroCampo = '';
      mensagem.setAttribute('role', 'alert');
      campo.insertAdjacentElement('afterend', mensagem);
      mensagens.set(campo, mensagem);
      const descricoes = campo.getAttribute('aria-describedby');
      campo.setAttribute('aria-describedby', [descricoes, mensagem.id].filter(Boolean).join(' '));
    }
    campo.setAttribute('aria-invalid', 'true');
    mensagem.textContent = campo.validity.valueMissing
      ? (campo instanceof HTMLSelectElement ? 'Erro: selecione uma opção.' : 'Erro: preencha este campo.')
      : `Erro: ${campo.validationMessage}`;
  }

  function aoInvalidar(evento: Event) {
    if (ehCampo(evento.target)) mostrar(evento.target);
  }

  function aoCorrigir(evento: Event) {
    const campo = evento.target;
    if (!ehCampo(campo) || !mensagens.has(campo)) return;
    if (campo.validity.valid) limpar(campo);
    else mostrar(campo);
  }

  // invalid não propaga: a captura atende todos os campos do formulário.
  formulario.addEventListener('invalid', aoInvalidar, true);
  formulario.addEventListener('input', aoCorrigir);
  formulario.addEventListener('change', aoCorrigir);

  return {
    destroy() {
      formulario.removeEventListener('invalid', aoInvalidar, true);
      formulario.removeEventListener('input', aoCorrigir);
      formulario.removeEventListener('change', aoCorrigir);
      for (const campo of mensagens.keys()) limpar(campo);
    }
  };
}
