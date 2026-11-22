const SM=[
 ['Quarks','#2a78d6','#3987e5',[['u','up','2.2 MeV','+2/3','½','Two in every proton, one in every neutron. Its partner in beta decay is the down quark.'],['d','down','4.7 MeV','−1/3','½','One in every proton, two in every neutron. Beta-minus decay turns a down quark into an up quark.'],['c','charm','1.27 GeV','+2/3','½','Heavier copy of the up quark. Found in particle collisions, not in ordinary atoms.'],['s','strange','93 MeV','−1/3','½','Heavier copy of the down quark. Kaons and hyperons contain it; kaonic atoms have been made.'],['t','top','173 GeV','+2/3','½','The heaviest known particle, about as heavy as a gold atom. Decays before it can form any bound state.'],['b','bottom','4.18 GeV','−1/3','½','Heavier copy of the down quark, studied in B-meson experiments.']]],
 ['Leptons','#1baf7a','#199e70',[['e','electron','0.511 MeV','−1','½','Fills the orbitals of every atom and does all of chemistry.'],['μ','muon','105.7 MeV','−1','½','A 207-times-heavier electron. Try it as the orbiting particle above. Cosmic-ray muons pass through you every second.'],['τ','tau','1.777 GeV','−1','½','A 3,477-times-heavier electron that decays in 0.3 picoseconds.'],['νe','electron neutrino','< 0.8 eV','0','½','Made in every beta decay. Trillions from the Sun pass through you each second.'],['νμ','muon neutrino','< 0.8 eV','0','½','Partner of the muon. Neutrinos change type as they travel, which proves they have mass.'],['ντ','tau neutrino','< 0.8 eV','0','½','Partner of the tau, first directly seen in 2000.']]],
 ['Force carriers','#eb6834','#d95926',[['g','gluon','0','0','1','Carries the strong force. Binds quarks into protons and neutrons; most of a proton’s mass is gluon field energy.'],['γ','photon','0','0','1','Carries the electromagnetic force. Holds electrons to the nucleus and is emitted when they change orbitals, giving each element its spectrum.'],['W','W boson','80.4 GeV','±1','1','Carries the weak force that changes quark type. Every beta decay goes through a W.'],['Z','Z boson','91.2 GeV','0','1','Neutral carrier of the weak force, behind neutrino scattering.']]],
 ['Higgs field','#eda100','#c98500',[['H','Higgs boson','125.2 GeV','0','0','Its field gives quarks, electrons and the W and Z their masses. Without it, electrons would be massless and atoms could not form. Discovered at CERN in 2012.']]]];
let smSel='u';
function renderSM(){const dk=isDark()?2:1;$('#smGrid').innerHTML=SM.map(g=>'<h3><span class="sw" style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;background:'+g[dk]+'"></span>'+g[0]+'</h3>'+g[3].map(p=>'<button class="pc" data-sm="'+p[0]+'" aria-pressed="'+(smSel===p[0])+'" style="'+(smSel===p[0]?'outline:2px solid var(--ink);outline-offset:1px;':'')+'border-left:4px solid '+g[dk]+';border-radius:0 12px 12px 0"><span class="sym2">'+p[0]+'</span><span class="pn">'+p[1]+'</span><span class="pm">'+p[2]+' · charge '+p[3]+'</span></button>').join('')).join('');
 let P=null,G=null;SM.forEach(g=>g[3].forEach(p=>{if(p[0]===smSel){P=p;G=g;}}));
 $('#smRead').innerHTML='<div class="nm">'+P[1][0].toUpperCase()+P[1].slice(1)+' <span style="font-size:var(--f3);color:var(--mut);font-weight:400">'+G[0].toLowerCase().replace(/s$/,'')+'</span></div><dl style="margin-top:8px"><dt>Mass</dt><dd>'+P[2]+'</dd><dt>Electric charge</dt><dd>'+P[3]+'</dd><dt>Spin</dt><dd>'+P[4]+'</dd><dt>Role</dt><dd>'+P[5]+'</dd></dl>';}
$('#smGrid').addEventListener('click',e=>{const b=e.target.closest('[data-sm]');if(b){smSel=b.dataset.sm;renderSM();}});
renderSM();new MutationObserver(renderSM).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

/* ---- particle detector simulation ---- */
const PX={e:{m:0.000511,q:-1,tau:Infinity,kind:'em',nm:'electron'},'μ':{m:0.10566,q:-1,tau:2.197e-6,kind:'mu',nm:'muon'},'τ':{m:1.777,q:-1,tau:2.903e-13,kind:'tau',nm:'tau'},
 'νe':{m:0,q:0,tau:Infinity,kind:'nu',nm:'neutrino'},'νμ':{m:0,q:0,tau:Infinity,kind:'nu',nm:'neutrino'},'ντ':{m:0,q:0,tau:Infinity,kind:'nu',nm:'neutrino'},
 'γ':{m:0,q:0,tau:Infinity,kind:'gam',nm:'photon'},u:{m:0.0022,kind:'jet',nm:'up quark'},d:{m:0.0047,kind:'jet',nm:'down quark'},s:{m:0.093,kind:'jet',nm:'strange quark'},c:{m:1.27,kind:'jet',nm:'charm quark'},b:{m:4.18,kind:'jet',nm:'bottom quark'},g:{m:0,kind:'jet',nm:'gluon'},
 t:{m:173,tau:5e-25,kind:'top',nm:'top quark'},W:{m:80.4,q:1,tau:3e-25,kind:'W',nm:'W boson'},Z:{m:91.2,q:0,tau:3e-25,kind:'Z',nm:'Z boson'},H:{m:125.2,q:0,tau:1.6e-22,kind:'H',nm:'Higgs boson'},'π':{m:0.1396,q:1,tau:2.6e-8,kind:'had',nm:'pion'},'π0':{m:0.135,q:0,tau:8e-17,kind:'had0',nm:'neutral hadron'}};
const DET={trk:1.1,ecal:[1.2,1.5],hcal:[1.5,2.2],coil:2.3,mu:[2.6,3.4],edge:3.6};
const SIM={tracks:[],t0:0,dur:1500,story:'',vis:false,last:0};
function simPick(list){let u=Math.random(),a=0;for(const [p,v] of list){a+=p;if(u<a)return v;}return list[list.length-1][1];}
function simBoost(par,th,M,kids){ // two-body decay of mass M moving with momentum par along th; kids=[sym,sym]
 const m1=PX[kids[0]].m||0,m2=PX[kids[1]].m||0,ps=Math.sqrt(Math.max(0,(M*M-(m1+m2)**2)*(M*M-(m1-m2)**2)))/(2*M),ph=Math.random()*2*Math.PI,E=Math.sqrt(par*par+M*M),g=E/M,bg=par/M;
 return kids.map((k,i)=>{const sg=i?-1:1,m=i?m2:m1,pl=sg*ps*Math.cos(ph),pt=sg*ps*Math.sin(ph),es=Math.sqrt(ps*ps+m*m),L=g*pl+bg*es,p=Math.hypot(L,pt);return [k,p,th+Math.atan2(pt,L)];});}
function simEmit(sym,p,th,q,out,depth){const P=PX[sym],anti=q!=null&&P.q!=null&&q!==P.q;
 if(P.kind==='jet'){const n=Math.max(3,Math.min(12,Math.round(4+2.2*Math.log10(Math.max(p,0.2))+Math.random()*2)));let fr=[];for(let i=0;i<n;i++)fr.push(Math.random()**1.5+0.05);const sm=fr.reduce((a,b)=>a+b);
  for(let i=0;i<n;i++){const pp=p*fr[i]/sm,kt=0.35*(Math.random()+Math.random()-1),neutral=Math.random()<0.33;out.push({sym:neutral?'π0':'π',p:Math.max(0.03,pp),th:th+Math.atan2(kt,Math.max(pp,0.05)),q:neutral?0:(Math.random()<0.5?1:-1),kind:neutral?'had0':'had'});}return 'a jet of '+n+' hadrons';}
 if(P.kind==='top'){const k=simBoost(p,th,P.m,['b','W']);const a=simEmit('b',k[0][1],k[0][2],null,out,depth+1),b2=simEmit('W',k[1][1],k[1][2],q==null?1:q,out,depth+1);return 'a bottom-quark jet and a W boson, and the W became '+b2;}
 if(P.kind==='W'){const ch=q==null?(Math.random()<0.5?1:-1):q;const mode=simPick([[0.108,'e'],[0.106,'μ'],[0.113,'τ'],[0.673,'jj']]);
  if(mode==='jj'){const k=simBoost(p,th,P.m,['u','d']);simEmit('u',k[0][1],k[0][2],null,out,depth+1);simEmit('d',k[1][1],k[1][2],null,out,depth+1);return 'two jets (a quark and an antiquark)';}
  const k=simBoost(p,th,P.m,[mode,'ν'+mode]);const sub=simEmit(mode,k[0][1],k[0][2],ch,out,depth+1);simEmit('ν'+mode,k[1][1],k[1][2],0,out,depth+1);return (mode==='e'?'an electron':mode==='μ'?'a muon':'a tau (which became '+sub+')')+' and a neutrino';}
 if(P.kind==='Z'){const mode=simPick([[0.034,'e'],[0.034,'μ'],[0.034,'τ'],[0.2,'νμ'],[0.698,'jj']]);
  if(mode==='jj'){const k=simBoost(p,th,P.m,['d','d']);simEmit('d',k[0][1],k[0][2],null,out,depth+1);simEmit('d',k[1][1],k[1][2],null,out,depth+1);return 'two jets';}
  const k=simBoost(p,th,P.m,[mode,mode]);if(mode==='νμ'){simEmit(mode,k[0][1],k[0][2],0,out,depth+1);simEmit(mode,k[1][1],k[1][2],0,out,depth+1);return 'two neutrinos, so the detector sees nothing at all';}
  simEmit(mode,k[0][1],k[0][2],-1,out,depth+1);simEmit(mode,k[1][1],k[1][2],1,out,depth+1);return 'a pair of '+(mode==='e'?'electrons':mode==='μ'?'muons':'taus')+' with opposite charges';}
 if(P.kind==='H'){const mode=simPick([[0.582,'bb'],[0.214,'WW'],[0.082,'gg'],[0.063,'ττ'],[0.029,'cc'],[0.026,'ZZ'],[0.004,'γγ']]);
  const pr={bb:['b','b'],gg:['g','g'],cc:['c','c'],'γγ':['γ','γ'],'ττ':['τ','τ']}[mode];
  if(pr){const k=simBoost(p,th,P.m,pr);simEmit(pr[0],k[0][1],k[0][2],-1,out,depth+1);simEmit(pr[1],k[1][1],k[1][2],1,out,depth+1);return {bb:'two bottom-quark jets (its most common decay, 58%)',gg:'two gluon jets',cc:'two charm-quark jets','γγ':'two photons: rare (0.2%), but this is how it was discovered','ττ':'two taus'}[mode];}
  const V=mode==='WW'?'W':'Z',mv=PX[V].m*0.75,ps=Math.sqrt(Math.max(0,P.m*P.m/4-mv*mv)),ph=Math.random()*2*Math.PI,g=Math.hypot(p,P.m)/P.m,bg=p/P.m;
  [1,-1].forEach(sg=>{const pl=sg*ps*Math.cos(ph),pt=sg*ps*Math.sin(ph),L=g*pl+bg*Math.hypot(ps,mv);simEmit(V,Math.hypot(L,pt),th+Math.atan2(pt,L),V==='W'?sg:0,out,depth+1);});return 'two '+V+' bosons, which decayed in turn';}
 if(P.kind==='tau'){const mode=simPick([[0.178,'e'],[0.174,'μ'],[0.648,'π']]);const x=0.25+0.6*Math.random();
  if(mode==='π'){out.push({sym:'π',p:p*x,th:th+0.05*(Math.random()-0.5),q:q,kind:'had'});}else simEmit(mode,p*x,th+0.05*(Math.random()-0.5),q,out,depth+1);out.push({sym:'ντ',p:p*(1-x),th:th,q:0,kind:'nu'});return (mode==='e'?'an electron':mode==='μ'?'a muon':'a pion')+' and neutrinos';}
 out.push({sym,p,th,q:P.q===0?0:(q==null?P.q:q),kind:P.kind});return '';}
function simTrack(t,B){const pts=[[0,0]];let x=0,y=0,th=t.th,L=0,end='escape';const ds=0.012,k=t.q?-t.q*0.3*B/Math.max(t.p,1e-4):0;
 for(let i=0;i<6000;i++){const r=Math.hypot(x,y);if(r<DET.coil)th+=k*ds;x+=Math.cos(th)*ds;y+=Math.sin(th)*ds;L+=ds;pts.push([x,y]);const r2=Math.hypot(x,y);
  if((t.kind==='em'||t.kind==='gam'||t.kind==='had0'&&false)&&r2>=DET.ecal[0]+0.12){end='ecal';break;}
  if((t.kind==='had'||t.kind==='had0')&&r2>=DET.hcal[0]+0.25){end='hcal';break;}
  if(r2>=DET.edge){end='escape';break;}if(L>40){end='curl';break;}}
 return {pts,L,end};}
function simFire(){const sym=smSel,P=PX[sym];if(!P)return;const p=10**(+$('#smP').value),B=+$('#smB').value,anti=$('#smAnti').checked,th0=(Math.random()-0.5)*1.2-(Math.random()<0.5?0:Math.PI),out=[];
 const q0=P.q==null?null:(anti?-P.q:P.q);const what=simEmit(sym,p,th0,q0,out,0);
 SIM.tracks=out.map(t=>Object.assign(t,simTrack(t,B)));SIM.t0=performance.now();SIM.last=SIM.t0;
 const E=Math.hypot(p,P.m),beta=p/E,gam=P.m>0?E/P.m:Infinity,R=P.q?p/(0.3*Math.abs(P.q)*Math.max(B,1e-9)):Infinity,dl=P.tau===Infinity||P.tau==null?Infinity:(P.m>0?p/P.m:1)*2.998e8*P.tau;
 const f3=v=>v>=100?Math.round(v).toLocaleString():v.toPrecision(3),dist=d=>d===Infinity?'never decays':d>=1000?f3(d/1000)+' km':d>=1?f3(d)+' m':d>=1e-3?f3(d*1e3)+' mm':d>=1e-6?f3(d*1e6)+' µm':d>=1e-9?f3(d*1e9)+' nm':sci(d,'m');
 const K=P.kind,nm=(anti&&P.q?'anti-':'')+P.nm;let story;
 if(K==='em')story='The '+nm+' curves in the magnet, then stops in the first thick layer (the electromagnetic calorimeter) in a small shower.';
 else if(K==='mu')story='The '+nm+' curves in the magnet and then goes straight through every layer. Muons are the only charged particles that reach the outer chambers.';
 else if(K==='nu')story='The neutrino flies out without touching anything. Detectors never see it; they only notice that some momentum is missing.';
 else if(K==='gam')story='The photon has no charge, so it leaves no track and does not bend. It shows up only when it hits the calorimeter.';
 else if(K==='jet')story=(/^[aeiou]/.test(nm)?'An ':'A ')+nm+' can never be seen alone. The strong force turns it into '+what+', which stop in the outer calorimeter.';
 else story='The '+nm+' is far too short-lived to see: it travels about '+dist(dl)+' and decays. This time it became '+what+'.';
 $('#smOut').innerHTML='<div class="sub">'+nm[0].toUpperCase()+nm.slice(1)+' at '+f3(p)+' GeV/c</div><p style="margin:6px 0">'+story+'</p><dl>'+(K==='jet'?'':'<dt>Speed</dt><dd>'+(P.m>0?(beta>0.99999?'99.999+% of the':(100*beta).toFixed(beta>0.999?3:beta>0.99?2:1)+'% of the'):'exactly the')+' speed of light</dd>'+(P.m>0?'<dt>Time stretch (γ)</dt><dd>'+f3(gam)+'×</dd>':''))+(P.q?'<dt>Curve radius in the magnet</dt><dd>'+(B>0?dist(R):'no magnet, straight line')+'</dd>':'')+'<dt>Distance before decaying</dt><dd>'+(K==='jet'?'never exists alone':dist(dl))+'</dd></dl>';}
function simDraw(now){const cv=$('#smCv'),W=cv.clientWidth,H=cv.clientHeight;if(!W)return;const dpr=Math.min(window.devicePixelRatio||1,MOB?1.5:2);if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
 const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);const dk=isDark(),sc=W/(2*DET.edge),cx=W/2,cy=H/2,mut=getComputedStyle($('#probeMut')).color,X=v=>cx+v*sc,Y=v=>cy-v*sc;
 const TAU=Math.PI*2,ring=(r0,r1,fill)=>{x.beginPath();x.arc(cx,cy,r1*sc,0,TAU);x.moveTo(cx+r0*sc,cy);x.arc(cx,cy,r0*sc,0,TAU,true);x.fillStyle=fill;x.fill('evenodd');};
 ring(DET.ecal[0],DET.ecal[1],dk?'rgba(57,135,229,0.20)':'rgba(42,120,214,0.14)');ring(DET.hcal[0],DET.hcal[1],dk?'rgba(217,89,38,0.20)':'rgba(235,104,52,0.13)');ring(DET.mu[0],DET.mu[1],dk?'rgba(25,158,112,0.20)':'rgba(27,175,122,0.14)');
 x.strokeStyle=mut;x.globalAlpha=0.5;x.lineWidth=1;x.beginPath();x.arc(cx,cy,DET.trk*sc,0,7);x.stroke();x.setLineDash([3,3]);x.beginPath();x.arc(cx,cy,DET.coil*sc,0,7);x.stroke();x.setLineDash([]);x.globalAlpha=1;
 x.fillStyle=mut;x.font=(W<420?10:12)+'px "Instrument Sans",sans-serif';x.textAlign='center';[['tracker',0.55],['stops electrons and photons',1.35],['stops hadrons',1.85],['magnet coil',2.42],['muon chambers',3.0]].forEach(([t,r])=>x.fillText(t,cx,Y(r)+4));
 const el=Math.min(1,(now-SIM.t0)/SIM.dur),Lmax=Math.max(...SIM.tracks.map(t=>t.L),1),cP=dk?'#3987e5':'#2a78d6',cN=dk?'#d95926':'#eb6834',cZ=dk?'#199e70':'#1baf7a',inv=$('#smInv').checked;
 SIM.tracks.forEach(t=>{if(t.kind==='nu'&&!inv)return;const n=Math.max(2,Math.floor(t.pts.length*Math.min(1,el*Lmax/Math.min(t.L,DET.edge*1.3)*0.9+0.02)));x.beginPath();for(let i=0;i<n&&i<t.pts.length;i++){const q=t.pts[i];i?x.lineTo(X(q[0]),Y(q[1])):x.moveTo(X(q[0]),Y(q[1]));}
  x.strokeStyle=t.q>0?cP:t.q<0?cN:cZ;x.lineWidth=t.kind==='nu'?1:t.kind==='mu'?2.4:1.8;x.globalAlpha=t.kind==='nu'?0.45:1;x.setLineDash(t.q===0?(t.kind==='nu'?[1,5]:[5,4]):[]);x.stroke();x.setLineDash([]);x.globalAlpha=1;
  if(n>=t.pts.length&&(t.end==='ecal'||t.end==='hcal')){const q=t.pts[t.pts.length-1],a=Math.atan2(q[1],q[0]);x.strokeStyle=t.q>0?cP:t.q<0?cN:cZ;x.lineWidth=1.2;for(let k=-3;k<=3;k++){const a2=a+k*0.11,l=(t.end==='ecal'?0.2:0.42)*(1-Math.abs(k)/5);x.beginPath();x.moveTo(X(q[0]),Y(q[1]));x.lineTo(X(q[0]+Math.cos(a2)*l),Y(q[1]+Math.sin(a2)*l));x.stroke();}}});
 x.fillStyle=getComputedStyle($('#probeInk')).color;x.beginPath();x.arc(cx,cy,3,0,7);x.fill();}
(()=>{const key=()=>{const dk=isDark();$('#smKey').innerHTML='<span><i style="background:'+(dk?'#3987e5':'#2a78d6')+'"></i>positive charge</span><span><i style="background:'+(dk?'#d95926':'#eb6834')+'"></i>negative charge</span><span><i style="background:'+(dk?'#199e70':'#1baf7a')+'"></i>no charge (dashed, no bending)</span>';};key();new MutationObserver(key).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 const lab=()=>{const p=10**(+$('#smP').value);$('#smPo').textContent=(p>=1?p.toPrecision(3)+' GeV/c':(p*1000).toPrecision(3)+' MeV/c');$('#smBo').textContent=(+$('#smB').value).toFixed(1)+' tesla';};lab();
 ['smP','smB'].forEach(id=>$('#'+id).addEventListener('input',()=>{lab();simFire();}));$('#smAnti').addEventListener('change',simFire);$('#smFire').addEventListener('click',simFire);$('#smGrid').addEventListener('click',e=>{if(e.target.closest('[data-sm]'))simFire();});
 // runs only while on screen (with a 250 px buffer), and replays every few seconds
 const still=matchMedia('(prefers-reduced-motion: reduce)').matches;new IntersectionObserver(es=>{SIM.vis=es[0].isIntersecting;if(SIM.vis&&!SIM.tracks.length)simFire();},{rootMargin:'250px 0px'}).observe($('#smSim'));
 (function loop(){if(SIM.vis){const now=performance.now();if(now-SIM.t0<SIM.dur+400||SIM.dirty!==isDark()){simDraw(still?SIM.t0+SIM.dur:now);SIM.dirty=isDark();}}requestAnimationFrame(loop);})();
 window.addEventListener('resize',()=>{SIM.t0=performance.now()-SIM.dur;SIM.dirty=null;});})();
let nucT='p';const QG=new THREE.Group();scene.add(QG);QG.visible=false;let quarks=[],gl=[];
function buildQuarks(){clear(QG);quarks=[];gl=[];const fl=nucT==='p'?['u','u','d']:['u','d','d'],cols=[0xe24b4a,0x3b9d4a,0x378add];
 const shell=new THREE.Mesh(new THREE.SphereGeometry(3,48,32),new THREE.MeshPhongMaterial({color:nucT==='p'?0xde5f37:0x9aa3ab,transparent:true,opacity:0.12,depthWrite:false}));QG.add(shell);
 fl.forEach((f,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(0.42,24,16),new THREE.MeshPhongMaterial({color:cols[i],shininess:60}));const a=i*2*Math.PI/3;m.userData={base:new THREE.Vector3(Math.cos(a)*1.3,(i-1)*0.3,Math.sin(a)*1.3),ph:i*1.7};QG.add(m);quarks.push(m);
  const lb=label(f+(f==='u'?' +⅔':' −⅓'),0.42,ink);m.add(lb);lb.position.set(0,0.75,0);});
 for(let i=0;i<3;i++){const g=new THREE.BufferGeometry().setFromPoints(Array.from({length:40},()=>new THREE.Vector3()));const ln=new THREE.Line(g,new THREE.LineBasicMaterial({color:isDark()?0xeda100:0xb07a00}));QG.add(ln);gl.push(ln);}
 const sum=nucT==='p'?2.2+2.2+4.7:2.2+4.7+4.7,M=nucT==='p'?938.27:939.57,pct=sum/M*100;
 $('#quarkRead').innerHTML='<div class="nm">'+(nucT==='p'?'Proton':'Neutron')+'</div><div class="sub">'+(nucT==='p'?'up + up + down: +⅔ +⅔ −⅓ = +1':'up + down + down: +⅔ −⅓ −⅓ = 0')+' · mass '+M+' MeV</div>'+
 '<div class="massbar" role="img" aria-label="Mass budget"><span style="width:'+pct+'%;background:#2a78d6"></span><span style="flex:1;background:'+(isDark()?'#c98500':'#eda100')+'"></span></div><div class="key" style="margin-top:0"><span><i style="background:#2a78d6;border-radius:3px"></i>quark masses, '+sum.toFixed(1)+' MeV ('+pct.toFixed(1)+'%)</span><span><i style="background:#eda100;border-radius:3px"></i>gluon field and quark motion energy ('+(100-pct).toFixed(1)+'%)</span></div>'+
 '<dl style="margin-top:10px"><dt>Colour charge</dt><dd>Each quark carries one of three strong-force “colours” (shown red, green and blue). Together they cancel, like white light, which is why quarks are never seen alone.</dd><dt>Gluons</dt><dd>The yellow springs. They pull harder the farther quarks separate, so pulling a quark out just makes new quark pairs.</dd><dt>Size</dt><dd>About 0.84 fm across, roughly 100,000 times smaller than the atom around it.</dd>'+(nucT==='n'?'<dt>Beta decay</dt><dd>A free neutron lasts about 15 minutes: one down quark turns into an up quark by emitting a W⁻ boson, which becomes an electron and an antineutrino. The neutron becomes a proton.</dd>':'')+'</dl><p class="note">Quark masses are only rough values, and the quark positions here are a cartoon: inside a real proton they are smeared-out quantum clouds with many short-lived extra quark pairs.</p>';}
$$('[data-nuc]').forEach(b=>b.addEventListener('click',()=>{nucT=b.dataset.nuc;$$('[data-nuc]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));buildQuarks();simLabel();}));
function animQuarks(t){if(!QG.visible)return;quarks.forEach((q,i)=>{const b=q.userData.base,p=q.userData.ph;q.position.set(b.x+0.35*Math.sin(t*1.3+p),b.y+0.35*Math.sin(t*1.7+p*2),b.z+0.35*Math.cos(t*1.1+p));});
 gl.forEach((ln,i)=>{const A=quarks[i].position,B=quarks[(i+1)%3].position,pos=ln.geometry.attributes.position,d=new THREE.Vector3().subVectors(B,A),perp=new THREE.Vector3(-d.z,0.6,d.x).normalize();for(let k=0;k<40;k++){const f=k/39,w=0.16*Math.sin(f*Math.PI*10+t*6)*Math.sin(f*Math.PI);pos.setXYZ(k,A.x+d.x*f+perp.x*w,A.y+d.y*f+perp.y*w,A.z+d.z*f+perp.z*w);}pos.needsUpdate=true;});}
function nucOrb(){const [Z,A]=simIso(),N=A-Z,b=1.005*Math.pow(A,1/6),hw=41*Math.pow(A,-1/3),Nq=2*(n-1)+l,ls=jsg>0?l/2:-(l+1)/2,k=0.0637,mu=0.42;
 const e=Nq+1.5-k*(2*ls+mu*(l*(l+1)-Nq*(Nq+3)/2)),j2=2*l+jsg,key=n+LETN(l);let idx=LVL.findIndex(v=>v[0]===key&&v[1]===j2);const fp=shellFill(Z),fneu=shellFill(N);
 return {Z,A,N,b,hw,E:e*hw,j2,idx,fp:idx>=0?fp[idx]:null,fn:idx>=0?fneu[idx]:null};}
function readout(){readout0();const e=$('#read');if(e)e.insertAdjacentHTML('afterbegin','<div class="tbrow">'+(pot==='nuc'?tb('g')+'Shell-model estimate: a harmonic-oscillator well with spin-orbit shifts.':tb('x')+'Exact for one particle around a nucleus (ignoring relativity and the other electrons).')+'</div>');}
function readout0(){if(pot==='nuc'){const o=nucOrb(),sc=FIT/tab.r99,nm=NAMEZ(o.Z)+'-'+o.A,par=l%2?'−':'+';
 $('#read').innerHTML='<div class="nm">'+n+LETN(l)+'<sub>'+o.j2+'/2</sub> nucleon orbital</div><div class="sub">n = '+n+', l = '+l+', j = '+o.j2+'/2, m = '+m+' · parity '+par+' · in '+nm+'</div><dl>'+
 '<dt>Well</dt><dd>3D harmonic oscillator with spin–orbit coupling, oscillator length b = '+o.b.toFixed(2)+' fm, ħω = '+o.hw.toFixed(1)+' MeV</dd>'+
 '<dt>Radial nodes</dt><dd>'+(n-1)+' (in nuclei, n counts radial bumps, so 1d and 1f exist)</dd><dt>Angular nodes</dt><dd>'+l+', the same spherical-harmonic shapes as electron orbitals</dd>'+
 '<dt>Energy</dt><dd>about '+fE(o.E*1e6)+' above the bottom of the well (Nilsson formula). The spin–orbit force pushes j = l + ½ down and j = l − ½ up.</dd>'+
 '<dt>Most likely</dt><dd>'+fmt(tab.peak,2)+' b = '+(tab.peak*o.b).toFixed(1)+' fm from the centre; your r = 4 ≈ '+(4/sc*o.b).toFixed(1)+' fm</dd>'+
 '<dt>Holds</dt><dd>'+(o.j2+1)+' protons and '+(o.j2+1)+' neutrons (2j + 1 each)</dd>'+
 (o.idx>=0?'<dt>In '+nm+'</dt><dd>'+o.fp+' of '+(o.j2+1)+' proton slots and '+o.fn+' of '+(o.j2+1)+' neutron slots filled</dd>':'<dt>In '+nm+'</dt><dd>above the levels this simple model fills</dd>')+'</dl>'+
 '<p class="note">The teal curve below is this orbital. The dashed curves add up every filled orbital in '+nm+' and compare that total with the measured density shape (Woods–Saxon), a check on the whole model.</p>'+
 '<div class="key"><span><i style="background:var(--pos)"></i>+ sign</span><span><i style="background:var(--neg)"></i>− sign</span></div>';
 $('#vn').textContent=n;$('#vl').textContent=l;$('#vm').textContent=m;return;}
 const hide=quiz&&!quiz.done;
 const lobes=m===0?(l===0?'none, it is round':'none, it is symmetric around the vertical axis'):(2*Math.abs(m))+' petals, '+fmt(180/Math.abs(m),2).replace(/\.?0+$/,'')+'° apart';
 const sp=m===0?0:180/Math.abs(m),steps=sp/11.25,fit=m===0?'No in-page petals. Try the side view.':(Math.abs(steps-Math.round(steps))<1e-6?'= '+Math.round(steps)+' of your 11.25° steps, so it lands on your grid.':'= '+fmt(steps,2)+' steps, so it misses your grid.');
 const sc=FIT/tab.r99;
 $('#read').innerHTML=hide?'<div class="nm">?</div><div class="sub">Hidden during the round</div>':
 '<div class="nm">'+orbName(n,l,m)+'</div><div class="sub">n = '+n+', l = '+l+', m = '+m+' · energy '+fE(-exotic().E)+'</div><dl>'+
 '<dt>Radial nodes</dt><dd>'+(n-l-1)+' spheres (n − l − 1)</dd><dt>Angular nodes</dt><dd>'+l+' surfaces (l)</dd>'+
 '<dt>In your page</dt><dd>'+lobes+'</dd><dt>Grid fit</dt><dd>'+fit+'</dd>'+
 '<dt>Most likely</dt><dd>'+fmt(tab.peak)+' a₀ from the nucleus</dd><dt>Scale</dt><dd>your r = 4 ≈ '+fmt(4/sc)+' a₀</dd>'+
 '<dt>Subshell holds</dt><dd>'+(2*(2*l+1))+' electrons, shell holds '+(2*n*n)+'</dd>'+(()=>{const x=exotic(),P=PART[part];return '<dt>Orbiting</dt><dd>'+P.nm+(part!=='e'?' ('+Math.round(P.m/0.51099895).toLocaleString()+' × electron mass, lives '+P.life+')':'')+', around '+(x.Zc===1?'a proton':(/^[aeiou]/i.test(NAMEZ(x.Zc))?'an ':'a ')+NAMEZ(x.Zc).toLowerCase()+'-'+x.A+' nucleus (Z = '+x.Zc+', one particle only)')+'</dd><dt>Real size</dt><dd>most likely '+fmtLen(x.rf)+' out; the nucleus is about '+fmtLen(x.Rn)+'</dd><dt>Binding energy</dt><dd>'+fmtE(x.E)+'</dd>'+(x.inside?'<dt>Note</dt><dd style="color:var(--neg)">This orbit is about the size of the nucleus, so the particle spends real time inside it. The simple formula breaks down here, and that overlap is exactly what muonic-atom experiments use to measure nuclear sizes.</dd>':'')+(x.Zc>40&&part==='e'?'<dt>Relativity</dt><dd>For a nucleus this heavy, the inner orbits are relativistic, which shifts these numbers noticeably.</dd>':'')+'</dl><p class="note">'+P.note+'</p>';})()+
 '<div class="key"><span><i style="background:var(--pos)"></i>+ sign</span><span><i style="background:var(--neg)"></i>− sign</span></div>';
 $('#vn').textContent=hide?'?':n;$('#vl').textContent=hide?'?':l;$('#vm').textContent=hide?'?':m;}

let NUCD=null;fetch('nuclear.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(d=>{NUCD=d;try{if(mode==='nuc')buildNuc();setTR(82,208,79,197);}catch(err){console.error(err);}}).catch(err=>{console.error('nuclear.json failed to load',err);const m='Nuclear mass data could not be loaded, so binding energies and the transmutation lab are unavailable. Try reloading the page.';const tn=$('#trNote');if(tn)tn.textContent=m;const nr=$('#nucRead');if(nr)nr.insertAdjacentHTML('afterbegin','<p class="note" style="color:var(--neg)">'+m+'</p>');});
const LVL=[['1s',1,2],['1p',3,4],['1p',1,2],['1d',5,6],['2s',1,2],['1d',3,4],['1f',7,8],['2p',3,4],['1f',5,6],['2p',1,2],['1g',9,10],['1g',7,8],['2d',5,6],['2d',3,4],['3s',1,2],['1h',11,12],['1h',9,10],['2f',7,8],['2f',5,6],['3p',3,4],['3p',1,2],['1i',13,14],['2g',9,10],['1i',11,12],['1j',15,16],['3d',5,6],['4s',1,2],['2g',7,8],['3d',3,4]];
const LPAR={s:0,p:1,d:2,f:3,g:4,h:5,i:6,j:7},MAGIC=[2,8,20,28,50,82,126,184],SMACC={"all": [1652, 583], "near": [178, 77]};
function shellFill(k){let left=k;return LVL.map(l=>{const f=Math.max(0,Math.min(l[2],left));left-=f;return f;});}
function lastMagic(k,list){let m=0;list.forEach(x=>{if(x<=k)m=x;});return m;}
function nearMagicDist(k,list){return Math.min(...list.map(x=>Math.abs(k-x)));}
function simIso(){if(selIso&&!selIso.pred&&selIso.z<=118)return [selIso.z,selIso.a];if(selIso&&selIso.pred)return [selIso.z,selIso.a];if(sel&&sel<=118){const ab=(ISOZ[sel]||[]).filter(r=>r[2]!=null).sort((a,b)=>b[2]-a[2]);if(ab.length)return [sel,ab[0][1]];const all=(ISOZ[sel]||[]).slice().sort((a,b)=>(b[3]??99)-(a[3]??99));if(all.length)return [sel,all[0][1]];}return [6,12];}
const NG2=new THREE.Group();scene.add(NG2);NG2.visible=false;let nInst=[],nBase=[],nucInfo=null;
function jlabel(j2,l){return j2+'/2'+(LPAR[l]%2?'−':'+');}
function predJP(Z,A){const N=A-Z;if(Z%2===0&&N%2===0)return '0+';if(Z%2&&N%2)return null;const k=Z%2?Z:N;let c=0;for(const l of LVL){if(k<=c+l[2])return jlabel(l[1],l[0][1]);c+=l[2];}return null;}
