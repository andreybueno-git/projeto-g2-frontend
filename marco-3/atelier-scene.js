/* Cena do Marco 3: o mesmo notebook da Vereda (tampa, energia, tela projetada)
 * e, no lugar da luminária e da impressora, um json-server com as pilhas de
 * registros. Cartões de tarefa e projeto viajam do notebook até o servidor
 * conforme a rolagem: avançar grava, voltar desfaz. Nada aqui chama uma API. */
(function(){
  'use strict';
  if(!window.THREE){document.body.classList.add('no-webgl');window.dispatchEvent(new CustomEvent('vereda:asset',{detail:{name:'scene',status:'error'}}));return;}
  const T=THREE, canvas=document.querySelector('#atelier-canvas');
  let renderer;
  try { renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'}); } catch(e){document.body.classList.add('no-webgl');window.dispatchEvent(new CustomEvent('vereda:asset',{detail:{name:'scene',status:'error'}}));return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(), camera=new T.OrthographicCamera(-4,4,2.4,-2.4,.1,50);
  camera.position.set(0,3.25,9);camera.lookAt(0,1.32,0);
  scene.add(new T.HemisphereLight('#f8fbff','#8e98a8',.7));
  const key=new T.DirectionalLight('#fffaf0',2.1);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6});key.shadow.normalBias=.035;key.shadow.bias=-.0005;scene.add(key);
  const rim=new T.DirectionalLight('#dbe7ff',.75);rim.position.set(5,4,-4);scene.add(rim);
  const root=new T.Group();scene.add(root);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-.16;floor.receiveShadow=true;scene.add(floor);
  const notebook=new T.Group(),world=new T.Group();root.add(notebook,world);
  let screenMesh=null, screenCorners=[], notebookLid=null, powerSwitch=null;

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,t)=>a+(b-a)*t;
  function range(p,a,b){return smooth((p-a)/(b-a));}
  function presence(p,a,b){return range(p,a-.65,a)*(1-range(p,b,b+.65));}
  function scaleGroup(g,v){g.visible=v>.003;g.scale.setScalar(Math.max(.001,v));}
  function box(w,h,d,color,extra){return new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial(Object.assign({color:new T.Color(color).convertSRGBToLinear(),roughness:.55,metalness:.15},extra||{})));}
  function roundRect(x,X,y,w,h,r){x.beginPath();x.moveTo(X+r,y);x.arcTo(X+w,y,X+w,y+h,r);x.arcTo(X+w,y+h,X,y+h,r);x.arcTo(X,y+h,X,y,r);x.arcTo(X,y,X+w,y,r);x.closePath();}
  function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;const api={canvas:c,ctx:x,texture:t,draw(...a){x.clearRect(0,0,w,h);draw(x,w,h,...a);t.needsUpdate=true;}};return api;}
  const font=(weight,size)=>weight+' '+size+'px Manrope, system-ui, sans-serif';
  const brand=new Image();brand.src='assets/brand/marca.svg';

  // ---------- Tela do notebook (quando o desktop HTML não está projetado) ----------
  const display=document.createElement('canvas');display.width=1024;display.height=640;const dx=display.getContext('2d');const displayTexture=new T.CanvasTexture(display);displayTexture.encoding=T.sRGBEncoding;displayTexture.flipY=false;
  function drawScreen(){
    dx.fillStyle='#f8fafc';dx.fillRect(0,0,1024,640);dx.fillStyle='#1e293b';dx.fillRect(0,0,1024,64);
    if(brand.complete&&brand.naturalWidth)dx.drawImage(brand,26,12,40,40);
    dx.fillStyle='#ffffff';dx.font=font(700,24);dx.fillText('Gerenciador de Tarefas',80,41);
    dx.fillStyle='#2563eb';roundRect(dx,800,14,96,36,8);dx.fill();dx.fillStyle='#fff';dx.font=font(600,18);dx.fillText('Tarefas',816,38);dx.fillStyle='#cbd5e1';dx.fillText('Projetos',914,38);
    dx.fillStyle='#0f172a';dx.font=font(700,40);dx.fillText('Nova tarefa',60,130);
    const fields=[['Projeto','Interface Acadêmica'],['Título (obrigatório)',''],['Responsável','']];
    fields.forEach(([l,v],i)=>{const y=170+i*104;dx.fillStyle='#334155';dx.font=font(600,20);dx.fillText(l,60,y);dx.strokeStyle='#94a3b8';dx.lineWidth=2;roundRect(dx,60,y+12,600,52,8);dx.stroke();dx.fillStyle='#0f172a';dx.font=font(400,20);if(v)dx.fillText(v,78,y+46);});
    dx.fillStyle='#2563eb';roundRect(dx,60,500,200,56,10);dx.fill();dx.fillStyle='#fff';dx.font=font(700,22);dx.fillText('Salvar tarefa',86,536);
    dx.fillStyle='#64748b';dx.font=font(500,18);dx.fillText('POST /tarefas  ·  PATCH /tarefas/:id',700,536);
    displayTexture.needsUpdate=true;
  }
  drawScreen();brand.onload=()=>{drawScreen();drawEntryScreen(entryScreen,performance.now()/1000,true);};
  let entryScreen='',entryScreenAt=0;
  function drawEntryScreen(state,now,force){
    if(state==='story'||state==='ready'){if(entryScreen!==state||force){drawScreen();entryScreen=state;}return;}
    if(entryScreen===state&&state!=='booting'&&!force)return;
    if(entryScreen!==state){entryScreenAt=now;entryScreen=state;}
    dx.fillStyle='#0f172a';dx.fillRect(0,0,1024,640);
    if(state==='booting'||state==='transition'){
      if(brand.complete&&brand.naturalWidth)dx.drawImage(brand,447,170,130,130);
      dx.fillStyle='#e2e8f0';dx.font=font(500,22);dx.textAlign='center';dx.fillText(state==='booting'?'Carregando o Marco 3…':'Cadastro e edição.',512,360);dx.textAlign='left';
      dx.fillStyle='#334155';dx.fillRect(362,400,300,3);dx.fillStyle='#60a5fa';dx.fillRect(362,400,300*Math.min(1,(now-entryScreenAt)/1.1),3);
    }
    displayTexture.needsUpdate=true;
  }

  // ---------- Notebook (GLB real da Vereda) ----------
  const lapFallback=new T.Group();const lb=box(2.65,.09,1.75,'#8b8f98');lb.position.y=.1;lapFallback.add(lb);const fallbackHinge=new T.Group();fallbackHinge.position.set(0,.15,-.77);lapFallback.add(fallbackHinge);const lid=box(2.65,1.63,.08,'#2b3038');lid.position.y=.815;fallbackHinge.add(lid);const lscreen=new T.Mesh(new T.PlaneGeometry(2.46,1.43),new T.MeshBasicMaterial({map:displayTexture}));lscreen.position.set(0,.815,.045);fallbackHinge.add(lscreen);notebook.add(lapFallback);
  function prep(g){g.traverse(o=>{if(o.isMesh){o.castShadow=!(o.material?.transparent);o.receiveShadow=true;}});}
  new T.GLTFLoader().load('assets/atelier/atelier.glb',g=>{
    const n=g.scene.getObjectByName('Notebook');
    if(n){n.parent.remove(n);n.position.set(0,0,0);n.scale.multiplyScalar(8.2);prep(n);window.VeredaStickers?.apply(n);window.VeredaHardware?.attach(n,canvas,camera,()=>!!window.VeredaDesktop&&!VeredaDesktop.getElement().hidden&&!VeredaDesktop.isExpanded()&&(window.VeredaEntry?.state==='ready'||window.VeredaEntry?.state==='story'));notebook.add(n);lapFallback.visible=false;notebookLid=n.getObjectByName('Notebook_Lid');
      if(notebookLid){const emblem=n.getObjectByName('Notebook_BackEmblem');if(emblem)emblem.visible=false;const logoMap=new T.TextureLoader().load('assets/brand/marca.svg');logoMap.encoding=T.sRGBEncoding;const logo=new T.Mesh(new T.PlaneGeometry(.06,.06),new T.MeshBasicMaterial({map:logoMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));logo.position.set(0,.12,-.0055);logo.rotation.set(0,Math.PI,Math.PI);notebookLid.add(logo);}
      const pc=document.createElement('canvas');pc.width=pc.height=128;const px=pc.getContext('2d');px.strokeStyle='#dbeafe';px.lineWidth=9;px.lineCap='round';px.beginPath();px.arc(64,65,28,-Math.PI*.34,Math.PI*1.34);px.stroke();px.beginPath();px.moveTo(64,26);px.lineTo(64,59);px.stroke();
      powerSwitch=new T.Mesh(new T.CylinderGeometry(.0068,.0068,.0018,32),new T.MeshStandardMaterial({color:'#1e293b',emissive:'#3b82f6',emissiveIntensity:.25}));powerSwitch.position.set(.15,.026,-.091);n.add(powerSwitch);const symbol=new T.Mesh(new T.PlaneGeometry(.01,.01),new T.MeshBasicMaterial({map:new T.CanvasTexture(pc),transparent:true,depthWrite:false}));symbol.rotation.x=-Math.PI/2;symbol.position.y=.001;powerSwitch.add(symbol);
      const s=n.getObjectByName('Notebook_Screen');if(s){s.material=new T.MeshBasicMaterial({map:displayTexture,side:T.DoubleSide});screenMesh=s;const pos=s.geometry.attributes.position,seen=new Set();for(let j=0;j<pos.count;j++){const v=new T.Vector3().fromBufferAttribute(pos,j),k=v.toArray().map(n=>n.toFixed(5)).join(',');if(!seen.has(k)){screenCorners.push(v);seen.add(k);}}}}
    document.body.dataset.assets='loaded';window.dispatchEvent(new CustomEvent('vereda:asset',{detail:{name:'scene',status:'loaded'}}));
  },undefined,()=>{document.body.dataset.assets='fallback';window.dispatchEvent(new CustomEvent('vereda:asset',{detail:{name:'scene',status:'error'}}));});

  // ---------- json-server e as pilhas do db.json ----------
  const SERVER_X=.95, NOTE_X=-1.32;
  const server=new T.Group();server.position.x=SERVER_X;world.add(server);
  const base=box(1.5,.46,.95,'#1e293b',{roughness:.45,metalness:.35});base.position.y=.23;base.castShadow=true;base.receiveShadow=true;server.add(base);
  const front=canvasTexture(768,224,(x,w,h)=>{x.fillStyle='#0f172a';x.fillRect(0,0,w,h);x.fillStyle='#e2e8f0';x.font=font(700,56);x.fillText('json-server',36,92);x.fillStyle='#93c5fd';x.font=font(600,40);x.fillText(':3000 · db.json',36,160);x.fillStyle='#22c55e';x.beginPath();x.arc(w-60,72,16,0,Math.PI*2);x.fill();});front.draw();
  const frontPlane=new T.Mesh(new T.PlaneGeometry(1.36,.4),new T.MeshBasicMaterial({map:front.texture}));frontPlane.position.set(0,.23,.476);server.add(frontPlane);
  const STACK={tarefas:{x:-.36,color:'#dbeafe',edge:'#2563eb',base:9},projetos:{x:.4,color:'#ffedd5',edge:'#ea580c',base:4}};
  const SLAB=.052;
  Object.entries(STACK).forEach(([name,st])=>{
    st.slabs=[];for(let i=0;i<12;i++){const s=box(.56,SLAB*.82,.4,i%2?st.color:'#ffffff',{roughness:.7,metalness:0});s.position.set(st.x,.46+SLAB*(i+.5),0);s.castShadow=true;s.visible=false;server.add(s);st.slabs.push(s);}
    const lab=canvasTexture(320,96,(x,w,h,count)=>{x.fillStyle=st.edge;roundRect(x,0,8,w,h-16,24);x.fill();x.fillStyle='#fff';x.font=font(700,42);x.textAlign='center';x.fillText(name+' · '+count,w/2,62);});lab.draw(st.base);st.label=lab;st.shown=-1;
    st.tag=new T.Mesh(new T.PlaneGeometry(.8,.24),new T.MeshBasicMaterial({map:lab.texture,transparent:true,depthWrite:false}));st.tag.position.set(st.x,0,.05);server.add(st.tag);
  });
  function setStack(name,count){const st=STACK[name];st.slabs.forEach((s,i)=>s.visible=i<count);st.tag.position.y=.46+SLAB*count+.2;if(st.shown!==count){st.shown=count;st.label.draw(count);}}

  // ---------- Cartões ----------
  const STATUS={'a-fazer':['A fazer','#e2e8f0','#334155'],'em-andamento':['Em andamento','#dbeafe','#1d4ed8'],'erro':['Título vazio','#ffedd5','#9a3412']};
  function drawCard(x,w,h,d){
    x.fillStyle='#ffffff';roundRect(x,6,6,w-12,h-12,26);x.fill();x.lineWidth=d.invalid?9:5;x.strokeStyle=d.invalid?'#ea580c':d.kind==='projeto'?'#ea580c':'#2563eb';x.stroke();
    x.fillStyle=d.kind==='projeto'?'#9a3412':'#1d4ed8';x.font=font(700,30);x.fillText(d.kicker,34,58);
    x.fillStyle=d.invalid?'#9a3412':'#0f172a';x.font=font(700,d.title.length>22?36:44);x.fillText(d.title,34,120,w-68);
    if(d.status){const [lbl,bg,fg]=STATUS[d.status];x.font=font(700,28);const tw=x.measureText(lbl).width;x.fillStyle=bg;roundRect(x,34,150,tw+40,48,24);x.fill();x.fillStyle=fg;x.fillText(lbl,54,184);}
    x.fillStyle='#475569';x.font=font(500,28);x.fillText(d.foot,34,h-40,w-68);
  }
  function makeCard(w,h,data){const tex=canvasTexture(512,320,drawCard);tex.draw(data);const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex.texture,transparent:true,side:T.DoubleSide,roughness:.6,metalness:0}));m.castShadow=true;m.userData.tex=tex;m.visible=false;world.add(m);return m;}
  const task={kicker:'POST /tarefas',title:'Estudar rotas do SvelteKit',status:'a-fazer',foot:'Pedro · prioridade média · 31/10'};
  const taskEdited={kicker:'PATCH /tarefas/eQxa…',title:'Estudar rotas do SvelteKit',status:'em-andamento',foot:'Pedro · prioridade média · 31/10'};
  const taskCard=makeCard(1.2,.76,task);
  const projectCard=makeCard(1.2,.76,{kind:'projeto',kicker:'POST /projetos',title:'Projeto G2',foot:'Desenvolvimento Front-end · hoje'});
  const invalidCard=makeCard(.9,.57,{invalid:true,kicker:'Validação',title:'"      "',status:'erro',foot:'Só espaços não passam'});
  const fixedCard=makeCard(.9,.57,{kicker:'POST /tarefas',title:'Revisar acessibilidade',status:'a-fazer',foot:'Rayane · prioridade alta · 05/11'});
  const flyCard=makeCard(.7,.44,{kicker:'POST · simulação',title:'Tarefa do notebook',status:'a-fazer',foot:'Formulário do notebook'});
  let taskFlipped=false;
  function cardOnPath(m,u,lift,toX,toY){
    const a=new T.Vector3(NOTE_X+.05,1.0,.35),b=new T.Vector3(SERVER_X+toX,toY,.1);
    m.position.lerpVectors(a,b,u);m.position.y+=Math.sin(Math.PI*u)*lift;
    const land=range(u,.82,1);m.rotation.set(mix(-.18,-Math.PI/2,land),mix(-.12,0,u),0);
    m.scale.setScalar(mix(1,.46,land));
  }

  // ---------- Entregas: oito issues ----------
  const ISSUES=[['#16','API de escrita','Andrey'],['#17','Formulário de tarefa','Pedro'],['#18','Nova tarefa','Andrey'],['#19','Edição de tarefa','Pedro'],['#20','Validação','Andrey'],['#21','Acessibilidade','Rayane'],['#22','Projetos','Gabriel'],['#23','Apresentação','Rayane']];
  const issueCards=ISSUES.map(([n,t,who],i)=>{const m=makeCard(.9,.57,{kicker:'Issue '+n+' · entregue',title:t,foot:who});m.userData.slot=new T.Vector3(-1.38+(i%4)*.92,2.18-Math.floor(i/4)*.66,.3-Math.floor(i/4)*.1);return m;});

  // ---------- Validação: a barreira ----------
  // O portão fica entre o notebook e o servidor, virado para a câmera: um anel visto de frente, não de lado.
  const BARRIER_X=-.18;const barrier=new T.Group();barrier.position.set(BARRIER_X,1.08,.25);world.add(barrier);
  const ring=new T.Mesh(new T.TorusGeometry(.4,.045,14,90),new T.MeshStandardMaterial({color:'#ea580c',emissive:'#ea580c',emissiveIntensity:.35,roughness:.4}));ring.rotation.y=-.62;barrier.add(ring);
  const ringTag=canvasTexture(420,96,(x,w,h)=>{x.fillStyle='#9a3412';roundRect(x,0,8,w,h-16,24);x.fill();x.fillStyle='#fff';x.font=font(700,40);x.textAlign='center';x.fillText('validarObrigatorios',w/2,62);});ringTag.draw();
  const ringLabel=new T.Mesh(new T.PlaneGeometry(.7,.16),new T.MeshBasicMaterial({map:ringTag.texture,transparent:true,depthWrite:false}));ringLabel.position.set(0,.62,.05);barrier.add(ringLabel);

  // ---------- Testes: 22 marcas ----------
  const tickTex=canvasTexture(128,128,(x,w,h)=>{x.fillStyle='#2563eb';roundRect(x,6,6,w-12,h-12,26);x.fill();x.strokeStyle='#fff';x.lineWidth=13;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(34,66);x.lineTo(56,88);x.lineTo(96,42);x.stroke();});tickTex.draw();
  const ticks=[];for(let i=0;i<22;i++){const m=new T.Mesh(new T.PlaneGeometry(.2,.2),new T.MeshBasicMaterial({map:tickTex.texture,transparent:true,depthWrite:false}));m.position.set(-1.3+(i%11)*.25,2.05-Math.floor(i/11)*.28,.3);m.visible=false;world.add(m);ticks.push(m);}

  // ---------- Estado e controles ----------
  let current=0,target=0,progressInitialized=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,paused=false,last=0,sendTime=-10,drag=0,dragTarget=0,framing=1,aimX=0,aimY=0,leanX=0,leanY=0;
  function resize(){const bounds=canvas.getBoundingClientRect(),w=bounds.width||innerWidth,h=bounds.height||innerHeight;renderer.setSize(w,h,false);const span=w<=760?4.6:4.65;camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();root.position.y=w<=760?.05:0;root.scale.setScalar(w<=760?.8:1);}
  resize();addEventListener('resize',resize);addEventListener('vereda:entry',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas);
  addEventListener('pointermove',e=>{if(e.pointerType==='touch'||e.buttons||paused||reduced)return;aimX=clamp(e.clientX/innerWidth*2-1,-1,1);aimY=clamp(e.clientY/innerHeight*2-1,-1,1);},{passive:true,capture:true});
  document.documentElement.addEventListener('pointerleave',()=>{aimX=aimY=0;});
  const ray=new T.Raycaster(),pointer=new T.Vector2();canvas.addEventListener('click',e=>{
    const state=window.VeredaEntry?.state||'story';const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
    if(state==='closed'&&ray.intersectObject(notebook,true).length){VeredaEntry.open();return;}
    if(state==='off'&&powerSwitch&&ray.intersectObject(powerSwitch,true).length){VeredaEntry.power();return;}
  });
  const outputs={};function out(id,text){const el=outputs[id]||(outputs[id]=document.getElementById(id));if(el&&el.textContent!==text)el.textContent=text;}
  function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  projectCard.userData.tex.draw({kind:'projeto',kicker:'POST /projetos',title:'Projeto G2',foot:'criadoEm: '+today()});
  window.VeredaScene={setProgress(p){target=p;if(!progressInitialized){current=p;progressInitialized=true;}},setPaused(v){paused=v;},setReduced(v){reduced=v;},setLight(){},setColor(){},turn(v){dragTarget+=v;},send(){sendTime=performance.now()/1000;},resize};

  let frame=0;
  function render(ms){frame=requestAnimationFrame(render);if(document.hidden)return;const now=ms/1000,dt=Math.min(.06,(ms-last)/1000||.016);last=ms;current=reduced?target:current+(target-current)*(1-Math.exp(-dt*8));drag+=(dragTarget-drag)*.12;
    const entry=window.VeredaEntry?.state||'story',intro=entry!=='story',p=intro?0:current,opening=1-range(p,.72,1.15);
    // L = o notebook ocupa a cena (abertura, nova tarefa, acessibilidade): o desktop HTML é projetado na tela.
    const L=clamp(opening+presence(p,3,3.45)+presence(p,7,7.45)),W=1-L;
    const side=document.body.dataset.layout==='reverse'?-1:1;framing=reduced?side:framing+(side-framing)*(1-Math.exp(-dt*5));
    const rect=canvas.getBoundingClientRect(),cw=rect.width,ch=rect.height,narrow=innerWidth<=760;
    root.position.x=intro||narrow?0:4.65*cw/ch*(.245-.075*opening)*framing;
    const lidProgress=smooth(window.VeredaEntry?.lidProgress??1);
    const desiredLid=Math.PI/2+(-.2094395-Math.PI/2)*lidProgress;
    if(notebookLid){notebookLid.rotation.x=desiredLid;notebookLid.position.y=.025+.0085*(1-lidProgress);}fallbackHinge.rotation.x=desiredLid;
    const cameraClosed=intro?1-lidProgress:0;
    camera.position.set(0,3.25+cameraClosed*3,9);camera.lookAt(0,1.32-cameraClosed*.85,0);
    const transition=entry==='transition'?(window.VeredaEntry?.transitionProgress||0):0;camera.zoom=1+transition*2;camera.updateProjectionMatrix();
    drawEntryScreen(entry,now);
    if(powerSwitch)powerSwitch.material.emissiveIntensity=entry==='off'?.8:entry==='ready'||entry==='story'?.5:.04;

    // Notebook: grande e centralizado quando é o assunto; pequeno à esquerda quando o assunto é o servidor.
    const fit=narrow?Math.min(.76,cw/ch/1.18):Math.min(1,cw/ch/1.7);
    const big=(1+opening*.4)*(intro&&!narrow?1-.1*lidProgress:1)*fit,small=.52*fit;
    notebook.scale.setScalar(mix(small,big,L));
    notebook.position.set(mix(NOTE_X,intro||narrow?.30*notebook.scale.x:0,L),-.14*opening+.05+(intro?(narrow?.5:.12)*lidProgress:0),.15);
    if(reduced){leanX=leanY=0;}else if(!paused){leanX+=(aimX-leanX)*(1-Math.exp(-dt*4));leanY+=(aimY-leanY)*(1-Math.exp(-dt*4));}
    notebook.rotation.y=mix(.32,-.11,L)+(intro?0:drag*.12)+leanX*.12;notebook.rotation.x=-leanY*.04;notebook.rotation.z=-leanX*.008;

    // Mundo de dados: servidor e cartões somem quando o notebook ocupa a cena.
    server.visible=W>.01;server.scale.setScalar(Math.max(.001,smooth(W)));server.rotation.y=-.28+drag*.3+leanX*.05;
    const posted=p>=2.95?1:0,fixed=p>=6.9?1:0;
    setStack('tarefas',STACK.tarefas.base+posted+fixed);setStack('projetos',STACK.projetos.base+(p>=5.6?1:0));
    const tTop=k=>.46+SLAB*(STACK.tarefas.base+k)+.04;

    // 01 · Entregas: oito issues aparecem em sequência e saem antes da API.
    issueCards.forEach((m,i)=>{const v=presence(p,1+i*.035,1.42)*W;m.visible=v>.01;if(!m.visible)return;const from=new T.Vector3(NOTE_X,.9,.3);m.position.lerpVectors(from,m.userData.slot,smooth(v));m.scale.setScalar(Math.max(.001,v));m.rotation.set(-.14,(i%4-1.5)*-.05+leanX*.04,0);});

    // 02 · API: POST leva o cartão ao db.json; 04 · Edição: PATCH vira o mesmo cartão.
    let tv=false;
    if(p>2&&p<2.95){const u=range(p,2.08,2.82);cardOnPath(taskCard,u,.95,STACK.tarefas.x,tTop(0));tv=true;if(taskFlipped){taskCard.userData.tex.draw(task);taskFlipped=false;}}
    if(p>3.95&&p<4.95){const up=range(p,4.05,4.35),flip=range(p,4.35,4.62),down=range(p,4.62,4.88);tv=true;
      taskCard.position.set(SERVER_X+STACK.tarefas.x,tTop(0)+up*.95*(1-down),.1+up*.25*(1-down));taskCard.rotation.set(mix(-Math.PI/2,-.18,up*(1-down)),flip*Math.PI*2,0);taskCard.scale.setScalar(mix(.46,1,up*(1-down)));
      const shouldFlip=flip>.25;if(shouldFlip!==taskFlipped){taskFlipped=shouldFlip;taskCard.userData.tex.draw(shouldFlip?taskEdited:task);}}
    taskCard.visible=tv&&W>.05;
    out('http-log',p<2.08?'aguardando envio':p<2.82?'POST /tarefas  →  enviando…':'201 Created  ·  id "eQxabfUaS3o" gerado pela API');
    out('edit-log',p<4.35?'GET /tarefas/eQxabfUaS3o  →  200':p<4.62?'PATCH /tarefas/eQxabfUaS3o  →  { …os 7 campos, status: "em-andamento" }':'200 OK  ·  goto("/tarefas/eQxabfUaS3o")');

    // 05 · Projetos: o cartão de projeto entra na outra pilha, com criadoEm do dia.
    const pv=p>4.95&&p<5.65;projectCard.visible=pv&&W>.05;if(pv)cardOnPath(projectCard,range(p,5.08,5.6),.9,STACK.projetos.x,.46+SLAB*STACK.projetos.base+.04);
    out('project-log',p<5.6?'POST /projetos  ·  criadoEm: '+today():'201 Created  ·  projetos: '+(STACK.projetos.base+1));

    // 06 · Validação: o vazio é barrado no anel e volta; o texto real passa.
    const vOn=presence(p,6,6.95)*W;barrier.visible=vOn>.01;barrier.scale.setScalar(Math.max(.001,vOn));ring.material.emissiveIntensity=.35+.9*presence(p,6.25,6.32);
    const bad=p>5.95&&p<6.5,good=p>=6.5&&p<6.95;invalidCard.visible=bad&&W>.05;fixedCard.visible=good&&W>.05;
    if(bad){const ax=NOTE_X+.05,bx=SERVER_X+STACK.tarefas.x,stop=clamp((BARRIER_X-.36-.45*.9-ax)/(bx-ax),.05,.9),go=range(p,6.05,6.25),back=range(p,6.32,6.48),u=stop*go*(1-back);cardOnPath(invalidCard,u,.25,STACK.tarefas.x,tTop(1));invalidCard.position.z+=.15;invalidCard.position.x+=(!reduced&&!paused&&go>.98&&back<.02)?Math.sin(now*40)*.02:0;}
    if(good)cardOnPath(fixedCard,range(p,6.52,6.88),.35,STACK.tarefas.x,tTop(1));
    out('valid-log',p<6.25?'título: "      "':p<6.5?'bloqueado · Erro: Preencha este campo com texto, sem usar somente espaços.':p<6.88?'título: "Revisar acessibilidade"  →  POST':'201 Created  ·  nada vazio chegou à API');

    // 08 · Testes: 22 marcas acendem com a rolagem.
    let shown=0;ticks.forEach((m,i)=>{const v=range(p,8.04+i*.03,8.1+i*.03)*(1-range(p,8.8,8.97))*W;m.visible=v>.01;m.scale.setScalar(Math.max(.001,v));if(range(p,8.04+i*.03,8.1+i*.03)>.5)shown++;});
    out('test-count',String(Math.min(22,shown)));

    // Envio feito no app Formulário do notebook: um cartão sai da tela (simulação local).
    const age=now-sendTime;flyCard.visible=age>=0&&age<1.8&&!reduced;if(flyCard.visible){const u=age/1.8;flyCard.position.set(notebook.position.x+u*2.6,1.3+Math.sin(u*Math.PI)*.9,.6);flyCard.rotation.set(-.15,-u*.6,0);flyCard.scale.setScalar(1-u*.5);flyCard.material.opacity=1-range(u,.7,1);}

    renderer.render(scene,camera);projectDesktop(L);
  }
  function projectDesktop(visible){
    if(!window.VeredaDesktop)return;
    if(VeredaDesktop.isExpanded()){VeredaDesktop.setVisible(true);return;}
    const entry=window.VeredaEntry?.state||'story';
    const show=!document.body.classList.contains('no-webgl')&&(entry==='ready'||(entry==='story'&&innerWidth>760))&&visible>.97&&screenMesh&&screenCorners.length>=4;
    VeredaDesktop.setVisible(!!show);
    if(!show)return;
    const rect=canvas.getBoundingClientRect(),h=rect.height,w=rect.width;
    const pts=screenCorners.map(v=>{const p=v.clone().applyMatrix4(screenMesh.matrixWorld).project(camera);return{x:rect.left+(p.x+1)*w/2,y:rect.top+(1-p.y)*h/2};}).sort((a,b)=>a.y-b.y);
    const top=pts.slice(0,2).sort((a,b)=>a.x-b.x),bottom=pts.slice(-2).sort((a,b)=>a.x-b.x);const [a,b,c,d]=[top[0],top[1],bottom[1],bottom[0]];
    const dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y,det=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/det,hh=(dx1*dy3-dx3*dy1)/det;
    const m=[(b.x-a.x+g*b.x)/960,(b.y-a.y+g*b.y)/960,0,g/960,(d.x-a.x+hh*d.x)/600,(d.y-a.y+hh*d.y)/600,0,hh/600,0,0,1,0,a.x,a.y,0,1];
    if(m.every(Number.isFinite))VeredaDesktop.getElement().style.transform='matrix3d('+m.join(',')+')';
  }
  frame=requestAnimationFrame(render);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);document.body.classList.add('no-webgl');window.VeredaDesktop?.setVisible(false);});
})();
