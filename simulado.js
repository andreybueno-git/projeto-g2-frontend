'use strict';

(() => {
  const form = document.getElementById('quiz-form');
  const questions = JSON.parse(document.getElementById('quiz-gabarito').textContent);
  const result = document.getElementById('quiz-resultado');
  const progress = document.getElementById('quiz-progresso');
  const fields = [...form.querySelectorAll('fieldset')];

  function clearFeedback() {
    fields.forEach((field, index) => {
      delete field.dataset.correction;
      const feedback = document.getElementById(`feedback-${index + 1}`);
      feedback.hidden = true;
      feedback.textContent = '';
    });
  }

  form.addEventListener('change', () => {
    const answered = fields.filter(field => field.querySelector('input:checked')).length;
    progress.textContent = `Respondidas: ${answered} de ${questions.length}.`;
    clearFeedback();
    result.textContent = 'Escolhas atualizadas. Clique em Conferir respostas quando terminar.';
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const answers = new FormData(form);
    const missing = fields.filter(field => !answers.has(field.dataset.question));
    if (missing.length) {
      clearFeedback();
      result.textContent = `Faltam ${missing.length} questões. Marque uma alternativa em cada questão antes de conferir.`;
      missing[0].querySelector('input').focus();
      return;
    }

    let correct = 0;
    questions.forEach((question, index) => {
      const field = fields[index];
      const right = Number(answers.get(field.dataset.question)) === question.answer;
      if (right) correct += 1;
      field.dataset.correction = right ? 'right' : 'wrong';
      const feedback = document.getElementById(`feedback-${index + 1}`);
      feedback.textContent = `${right ? 'Você acertou.' : 'Reveja esta questão.'} Resposta correta: ${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]} ${question.explanation}`;
      feedback.hidden = false;
    });

    result.textContent = `Você acertou ${correct} de ${questions.length} questões (${Math.round(correct / questions.length * 100)}%). Leia as explicações abaixo de cada questão para revisar. Você pode mudar as alternativas e conferir novamente.`;
    result.focus();
  });

  form.addEventListener('reset', () => {
    clearFeedback();
    progress.textContent = `Respondidas: 0 de ${questions.length}.`;
    result.textContent = 'Simulado reiniciado. Escolha suas respostas novamente.';
    fields[0].querySelector('input').focus();
  });
})();
