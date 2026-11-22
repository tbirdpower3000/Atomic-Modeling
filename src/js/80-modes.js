function setMode(md){mode=md;if(typeof ctxUpdate==='function')setTimeout(ctxUpdate,0);NG2.visible=md==='nuc';if(typeof gVolMesh!=='undefined'&&gVolMesh)gVolMesh.visible=md==='gpu'&&GS.task!=='tdse';if(typeof tdMesh!=='undefined'&&tdMesh)tdMesh.visible=md==='gpu'&&GS.task==='tdse';if(md==='gpu'){dist=19;$('#volRow').hidden=false;}if(md==='nuc'){buildNuc();dist=16;}if(md==='shell')setTimeout(buildShells,0);else if(dist>45)dist=19;QG.visible=md==='quark';if(md==='quark'){buildQuarks();dist=15;}['rays','square','circles'].forEach(k=>{const cb=document.querySelector('[data-layer="'+k+'"]');Lg[k].visible=md!=='quark'&&cb.checked;});Lg.nucleus.visible=md!=='quark'&&md!=='nuc'&&md!=='gpu'&&md!=='qmc'&&document.querySelector('[data-layer="nucleus"]').checked;$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===md)));
 if(mesh)mesh.visible=md==='shape';if(cloud)cloud.visible=md==='cloud';if(volMesh)volMesh.visible=md==='vol';$('#volRow').hidden=md!=='vol'&&md!=='gpu';Lg.shells.visible=md==='shell';
 const oq=md==='shell'||md==='quark'||md==='nuc'||md==='gpu'||md==='qmc';$('#qmcPanel').hidden=md!=='qmc';if(Q.pts)Q.pts.visible=md==='qmc';if(md==='qmc'){dist=19;if(!Q.A)qReset();}$('#gpuPanel').hidden=md!=='gpu';$('#nucPanel').hidden=md!=='nuc';$('#shellPanel').hidden=md!=='shell';$('#quarkPanel').hidden=md!=='quark';$('#qnPanel').hidden=oq;$('#quiz').hidden=oq;$('#ptsRow').hidden=md!=='cloud';$('#radBox').hidden=oq;$('#read').hidden=oq;simLabel();}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$$('[data-q]').forEach(b=>b.addEventListener('click',()=>{if(quiz&&!quiz.done)return;const d=+b.dataset.d,q=b.dataset.q;
 if(pot==='nuc'){if(q==='n')n=Math.max(1,Math.min(5,n+d));if(q==='l')l=Math.max(0,Math.min(7,l+d));if(q==='m')m=Math.max(-l,Math.min(l,m+d));m=Math.max(-l,Math.min(l,m));if(l===0)setJ(1,true);rebuild();return;}
 if(q==='n'){n=Math.max(1,Math.min(8,n+d));}if(q==='l'){l=Math.max(0,Math.min(n-1,l+d));}if(q==='m'){m=Math.max(-l,Math.min(l,m+d));}
 l=Math.min(l,n-1);m=Math.max(-l,Math.min(l,m));rebuild();}));
function setJ(v,quiet){jsg=l===0?1:v;$$('[data-j]').forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.j===jsg)));if(!quiet)rebuild();}
$$('[data-j]').forEach(b=>b.addEventListener('click',()=>setJ(+b.dataset.j)));
$$('[data-pot]').forEach(b=>b.addEventListener('click',()=>{if(pot===b.dataset.pot)return;pot=b.dataset.pot;$$('[data-pot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));endQuiz();const nu=pot==='nuc';$('#jRow').hidden=!nu;$('#quiz').hidden=nu;$('#partBox').hidden=nu;Lg.nucleus.visible=!nu&&document.querySelector('[data-layer="nucleus"]').checked;if(nu){n=1;l=2;m=0;setJ(1,true);}else{n=3;l=2;m=0;}rebuild();}));
let ptsT=null;$('#pts').addEventListener('input',e=>{nPts=+e.target.value;$('#ptsV').textContent=nPts.toLocaleString();if(seedGeo)seedGeo.setDrawRange(0,Math.min(MAXSEED,Math.round(nPts/acceptFrac)));});
$('#glow').addEventListener('input',e=>{volU.uGain.value=+e.target.value;$('#glowV').textContent=(+e.target.value).toFixed(1);});

$('#kUp').addEventListener('click',()=>{shellAuto=false;shellK=Math.min(10,shellK+1);buildShells();});
$('#kDn').addEventListener('click',()=>{shellAuto=false;shellK=Math.max(1,shellK-1);buildShells();});
$('#kFit').addEventListener('click',()=>{shellAuto=true;if(!sel)shellK=4;buildShells();});
$$('[data-sp]').forEach(b=>b.addEventListener('click',()=>{sp=b.dataset.sp;$$('[data-sp]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(sp!=='real')dist=19;buildShells();}));
$$('[data-layer]').forEach(i=>i.addEventListener('change',()=>{Lg[i.dataset.layer].visible=i.checked;}));

const pool=[];for(let a=1;a<=4;a++)for(let b=0;b<a;b++)pool.push([a,b]);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function newRound(){const [a,b]=pool[Math.floor(Math.random()*pool.length)];n=a;l=b;m=b?Math.floor(Math.random()*(2*b+1))-b:0;
 const wrong=shuffle(pool.filter(([x,y])=>!(x===a&&y===b))).slice(0,3);const opts=shuffle([[a,b],...wrong]);
 quiz={a:n+LET[l],done:false};setMode('cloud');rebuild();
 $('#qText').textContent='Which orbital is this? Count the dashed radial nodes and the flat or cone-shaped gaps in the cloud.';
 $('#qOpts').innerHTML=opts.map(([x,y])=>'<button data-ans="'+x+LET[y]+'">'+x+LET[y]+'</button>').join('');
 $('#qStart').textContent='Next round';$('#qStop').hidden=false;}
$('#qOpts').addEventListener('click',e=>{const b=e.target.closest('[data-ans]');if(!b||!quiz||quiz.done)return;tries++;const ok=b.dataset.ans===quiz.a;if(ok)score++;quiz.done=true;
 b.setAttribute('aria-pressed','true');$('#qText').textContent=(ok?'Right. ':'Not quite, it is '+quiz.a+'. ')+'It has '+(n-l-1)+' radial and '+l+' angular nodes.';$('#qScore').textContent='Score '+score+' of '+tries;readout();});
$('#qStart').addEventListener('click',newRound);
function endQuiz(){if(!quiz)return;quiz=null;$('#qOpts').innerHTML='';$('#qText').textContent='Count the nodes in the dot cloud and the radial curve, then pick the orbital.';$('#qStart').textContent='Start a round';$('#qStop').hidden=true;}
$('#qStop').addEventListener('click',()=>{endQuiz();readout();});

let th=0.75,ph=0.95,dist=19,auto=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;$('#autoRot').checked=auto;
function place(){cam.position.set(dist*Math.sin(ph)*Math.sin(th),dist*Math.cos(ph),dist*Math.sin(ph)*Math.cos(th));cam.lookAt(0,0,0);}
const ptr=new Map();let pinch0=0,dist0=dist;const clamp=(a,b,c)=>Math.max(b,Math.min(c,a));
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.size===2){const [a,b]=[...ptr.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=dist;}cv.style.cursor='grabbing';});
cv.addEventListener('pointermove',e=>{const q=ptr.get(e.pointerId);if(!q)return;if(ptr.size===1){th-=(e.clientX-q.x)*0.008;ph=clamp(ph-(e.clientY-q.y)*0.008,0.02,Math.PI-0.02);}q.x=e.clientX;q.y=e.clientY;
 if(ptr.size===2){const [a,b]=[...ptr.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0>0&&d>0)dist=clamp(dist0*pinch0/d,7,400);}});
const up=e=>{ptr.delete(e.pointerId);if(!ptr.size)cv.style.cursor='grab';};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();dist=clamp(dist*(1+e.deltaY*0.001),7,400);},{passive:false});
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.view;if(v==='top'){ph=0.02;th=0;}else if(v==='side'){ph=Math.PI/2;th=0;}else{ph=0.95;th=0.75;}if(v!=='three'){auto=false;$('#autoRot').checked=false;}}));
$('#autoRot').addEventListener('change',e=>{auto=e.target.checked;});

const ro=new ResizeObserver(()=>{const w=fig.clientWidth,h=fig.clientHeight;renderer.setSize(w,h,false);cloudU.uPx.value=h*0.5*renderer.getPixelRatio();cam.aspect=w/h;cam.fov=w<520?48:38;cam.updateProjectionMatrix();drawRadial();});ro.observe(fig);
const mo=new MutationObserver(buildFrame);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
const mq=window.matchMedia('(prefers-color-scheme: dark)');if(mq.addEventListener)mq.addEventListener('change',buildFrame);
radialTable();buildFrame();buildShape();buildCloud();readout();setMode('cloud');
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(buildFrame);
let visible3d=true,lastT=performance.now(),ftAvg=16,dprCur=Math.min(window.devicePixelRatio||1,MOB?1.5:2),dprMax=dprCur;new IntersectionObserver(es=>{visible3d=es[0].isIntersecting;const p=!visible3d&&((GS.run&&mode==='gpu')||(Q.run&&mode==='qmc'));const el=mode==='qmc'?$('#qStat'):$('#gStat');if(el&&p&&!/off screen/.test(el.textContent))el.textContent+=' · paused while off screen';},{rootMargin:'300px 0px'}).observe(fig);
function adaptRes(){const now=performance.now(),ft=now-lastT;lastT=now;ftAvg=0.9*ftAvg+0.1*Math.min(ft,200);let want=dprCur;if(ftAvg>24&&dprCur>0.75)want=Math.max(0.75,dprCur-0.25);else if(ftAvg<14&&dprCur<dprMax)want=Math.min(dprMax,dprCur+0.25);if(want!==dprCur){dprCur=want;renderer.setPixelRatio(dprCur);renderer.setSize(fig.clientWidth,fig.clientHeight,false);cloudU.uPx.value=fig.clientHeight*0.5*dprCur;}}
let mobSkip=false;
function tick(){const tt=performance.now()/1000;if(MOB&&!ptr.size&&!(GS.run&&mode==='gpu')&&!(Q.run&&mode==='qmc')){mobSkip=!mobSkip;if(mobSkip){requestAnimationFrame(tick);return;}}if(!visible3d){requestAnimationFrame(tick);return;}if(Q.run&&mode==='qmc')qStep();adaptRes();if(GS.run&&mode==='gpu')gStep();animQuarks(tt);animNuc(tt);if(auto&&!ptr.size)th+=0.0025;place();renderer.render(scene,cam);requestAnimationFrame(tick);}
$$('[data-gfx]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.gfx===GFX));b.addEventListener('click',()=>{try{localStorage.setItem('gfx',b.dataset.gfx);}catch(e){}location.reload();});});
$('#gfxNote').textContent=(GFX==='auto'?'Auto picked ':'Using ')+(MOB?'Light':'Full')+(gpuOK()?'':' · this device can’t run the GPU solver, so it uses the built-in CPU solver')+'.';

