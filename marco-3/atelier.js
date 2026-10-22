(function(){
  'use strict';
  document.documentElement.classList.remove('no-js');
  const chapters=window.VEREDA_CONTENT,els=[...document.querySelectorAll('.chapter')],dots=[...document.querySelectorAll('.timeline-dots button')],indexButtons=[...document.querySelectorAll('.index-grid button')],LAST=els.length-1;
  const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)'),indexDialog=document.querySelector('#index-dialog'),contentDialog=document.querySelector('#content-dialog');
  const captions=['Notebook interativo','Oito issues entregues','POST e PATCH no db.json','Notebook interativo','PATCH no mesmo registro','Duas pilhas no db.json','A barreira de validarObrigatorios','Notebook interativo','22 testes','Svelte 5 no projeto','24 arquivos do marco','json-server e notebook'];
  const subtitles={0:'Clique na tela para usar o computador',2:'Role para enviar o cartão',3:'Abra o formulário no notebook',4:'Role para editar a tarefa',6:'Role: o vazio volta, o texto passa',7:'Envie vazio e ouça os erros',8:'Role para acender os testes'};
  let active=0,paused=false,raf=0,positions=[],resizeTimer=0,toastTimer=0,scrollSafety=0;
  function refreshPositions(){positions=els.map(e=>e.offsetTop);update();}
  function update(){raf=0;const focus=scrollY+innerHeight*.43;let i=0;for(let k=0;k<positions.length;k++){if(positions[k]<=focus)i=k;}
    let p=i+(scrollY-positions[i])/Math.max(1,els[i].offsetHeight);p=Math.max(0,Math.min(LAST,p));
    window.VeredaScene?.setProgress(p);
    if(i!==active||!document.body.dataset.ready){active=i;document.body.dataset.ready='true';document.body.dataset.tone=els[i].dataset.tone||'light';document.body.dataset.layout=els[i].dataset.layout||'normal';document.body.dataset.chapter=String(i);document.querySelector('#active-name').textContent=els[i].dataset.short;document.querySelector('#current-count').textContent=String(i+1).padStart(2,'0');document.querySelector('#scene-title').textContent=captions[i]||'';document.querySelector('#scene-subtitle').textContent=subtitles[i]||'Simulação local';dots.forEach((b,k)=>{b.setAttribute('aria-current',String(k===i));b.classList.toggle('past',k<i);});indexButtons.forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.go)===i)));document.querySelector('#previous').disabled=i===0;document.querySelector('#next').disabled=i===LAST;history.replaceState(null,'','#'+chapters[i].id);}
  }
  function go(i){clearTimeout(resizeTimer);i=Math.max(0,Math.min(LAST,i));window.scrollTo({top:els[i].offsetTop,behavior:reducedQuery.matches||paused?'instant':'smooth'});}
  function showDetails(i){const c=chapters[i];document.querySelector('#content-title').textContent=c.title;document.querySelector('#content-body').innerHTML=c.details;document.querySelectorAll('#content-body table').forEach(t=>{if(t.parentElement.classList.contains('table-wrap'))return;const w=document.createElement('div');w.className='table-wrap';w.tabIndex=0;w.setAttribute('role','region');w.setAttribute('aria-label','Tabela, role horizontalmente');t.before(w);w.append(t);});contentDialog.showModal();contentDialog.scrollTop=0;}
  function showComputer(app){if(app)window.VeredaDesktop?.openApp(app);window.VeredaDesktop?.expand();}
  function toast(text){const t=document.querySelector('#toast');t.textContent=text;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,6500);}
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{if(indexDialog.open)indexDialog.close();go(Number(b.dataset.go));}));
  document.querySelectorAll('[data-details]').forEach(b=>b.addEventListener('click',()=>showDetails(Number(b.dataset.details))));
  document.querySelectorAll('[data-studio]').forEach(b=>b.addEventListener('click',()=>showComputer(null)));
  document.querySelectorAll('[data-desktop]').forEach(b=>b.addEventListener('click',()=>{showComputer(b.dataset.desktop);if(b.dataset.desktop==='testes')window.VeredaDesktop?.runCommand?.('node --test tests/*.test.mjs');}));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  document.querySelectorAll('[data-index]').forEach(b=>b.addEventListener('click',()=>indexDialog.showModal()));
  document.querySelector('#previous').addEventListener('click',()=>go(active-1));document.querySelector('#next').addEventListener('click',()=>go(active+1));
  document.querySelector('#motion').addEventListener('click',e=>{paused=!paused;document.body.classList.toggle('motion-paused',paused);e.currentTarget.setAttribute('aria-pressed',String(paused));e.currentTarget.innerHTML=paused?'Retomar movimento':'Pausar movimento';window.VeredaScene?.setPaused(paused);});
  document.querySelector('#fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>toast('Use a opção de tela cheia do navegador.'));});
  document.querySelector('#replay')?.addEventListener('click',()=>go(0));
  document.addEventListener('keydown',e=>{if(window.VeredaEntry&&VeredaEntry.state!=='story')return;if(window.MarcoCode?.isOpen)return;if(e.target.closest('#notebook-ui')||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(active+1);}if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(active-1);}if(e.key==='Home'){e.preventDefault();go(0);}if(e.key==='End'){e.preventDefault();go(LAST);}if(e.key.toLowerCase()==='i')indexDialog.showModal();if(e.key.toLowerCase()==='n')showDetails(active);});
  addEventListener('hashchange',()=>{const i=chapters.findIndex(c=>c.id===decodeURIComponent(location.hash.slice(1)));if(i>=0){clearTimeout(resizeTimer);window.scrollTo({top:els[i].offsetTop,behavior:'instant'});update();}});
  // Uma segunda checagem depois da rolagem garante o capítulo certo mesmo se um quadro de animação se perder.
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update);clearTimeout(scrollSafety);scrollSafety=setTimeout(()=>{if(raf)cancelAnimationFrame(raf);update();},140);},{passive:true});
  addEventListener('resize',()=>{const keep=active;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{positions=els.map(e=>e.offsetTop);window.scrollTo({top:positions[keep],behavior:'instant'});update();},150);});
  reducedQuery.addEventListener('change',e=>window.VeredaScene?.setReduced(e.matches));
  const interactionCallbacks={onChange(){},onExpand(){window.VeredaDesktop?.expand();},onPresent(){if(window.VeredaEntry)VeredaEntry.present(()=>go(0));else go(0);},onChapter(i){showDetails(i);}};
  window.VeredaDesktop?.init(interactionCallbacks);
  const hash=decodeURIComponent(location.hash.slice(1));const initial=chapters.findIndex(c=>c.id===hash);positions=els.map(e=>e.offsetTop);if(initial>0)window.scrollTo({top:els[initial].offsetTop,behavior:'instant'});update();let initialMoved=false;addEventListener('wheel',()=>initialMoved=true,{once:true,passive:true});addEventListener('touchmove',()=>initialMoved=true,{once:true,passive:true});document.fonts.ready.then(()=>{if(initial>0&&!initialMoved){positions=els.map(e=>e.offsetTop);window.scrollTo({top:els[initial].offsetTop,behavior:'instant'});}refreshPositions();});
  // As posições dos capítulos mudam depois do carregamento (trechos de código, fontes, fim da abertura).
  // Recalcular sempre que o conteúdo muda de tamanho mantém rolagem e animação sincronizadas.
  const story=document.querySelector('#story');
  if(window.ResizeObserver&&story)new ResizeObserver(()=>{positions=els.map(e=>e.offsetTop);if(!raf)raf=requestAnimationFrame(update);}).observe(story);
  addEventListener('vereda:entry',()=>{positions=els.map(e=>e.offsetTop);if(raf)cancelAnimationFrame(raf);update();});
  addEventListener('load',refreshPositions);
  window.VeredaStory={go,showDetails,get active(){return active;},get positions(){return positions.slice();}};
  window.VeredaEntry?.init({onReady(){window.VeredaDesktop?.setVisible(true);window.VeredaDesktop?.openApp('terminal');if(document.body.classList.contains('no-webgl')||document.body.dataset.assets!=='loaded')window.VeredaDesktop?.expand();}});
})();
