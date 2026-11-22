/* ---- Quantum Monte Carlo: Slater–Jastrow trial wavefunction, VMC and fixed-node DMC (hartree units) ---- */
const QMCA={
 2:{nm:'Helium',ref:-2.903724,ie:24.5874,hf:-2.861680,cfg:[['1s'],['1s']],ion:{cfg:[['1s'],[]],exact:-2.0},
    P:{mf:{z1:1.6875},vmc:{z1:1.8,b:0.5},dmc:{z1:2,b:1}},R:2.2},
 3:{nm:'Lithium',ref:-7.478060,ie:5.3917,hf:-7.432727,cfg:[['1s','2s'],['1s']],ion:{cfg:[['1s'],['1s']],ref:-7.279913,
    P:{mf:{z1:2.6875},vmc:{z1:2.7,b:0.5},dmc:{z1:3,b:1}}},P:{mf:{z1:2.7,z2:0.65},vmc:{z1:2.85,z2:0.8,b:0.5},dmc:{z1:3,z2:0.65,b:1}},R:5.5},
 4:{nm:'Beryllium',ref:-14.667356,ie:9.3227,hf:-14.573023,cfg:[['1s','2s'],['1s','2s']],ion:{cfg:[['1s','2s'],['1s']],ref:-14.324763,
    P:{mf:{z1:3.6,z2:0.9},vmc:{z1:3.8,z2:1.1,b:0.5},dmc:{z1:4,z2:0.9,b:1}}},P:{mf:{z1:3.8,z2:1.0},vmc:{z1:3.8,z2:1.2,b:1},dmc:{z1:4,z2:1.0,b:1}},R:4.5}};
function qmcMake(Z,cfg,o){
 const up=cfg[0],dn=cfg[1],nu=up.length,nd=dn.length,N=nu+nd,z1=o.z1,z2=o.z2||1,b=o.b||1,jas=!!o.jas,a2=1/(Z-z2);
 const orb=(k,R,i)=>{const r=Math.sqrt(R[3*i]*R[3*i]+R[3*i+1]*R[3*i+1]+R[3*i+2]*R[3*i+2]);return k==='1s'?Math.exp(-z1*r):(r-a2)*Math.exp(-z2*r);};
 const det=(L,R,s)=>L.length===0?1:L.length===1?orb(L[0],R,s):orb(L[0],R,s)*orb(L[1],R,s+1)-orb(L[1],R,s)*orb(L[0],R,s+1);
 function psi(R){let J=0;if(jas)for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const dx=R[3*i]-R[3*j],dy=R[3*i+1]-R[3*j+1],dz=R[3*i+2]-R[3*j+2],r=Math.sqrt(dx*dx+dy*dy+dz*dz);J+=((i<nu)===(j<nu)?0.25:0.5)*r/(1+b*r);}
  return det(up,R,0)*det(dn,R,nu)*Math.exp(J);}
 const h=1e-3;
 function local(R,g){const p0=psi(R);let lap=0;
  for(let c=0;c<3*N;c++){const s=R[c];R[c]=s+h;const pp=psi(R);R[c]=s-h;const pm=psi(R);R[c]=s;lap+=pp+pm-2*p0;g[c]=(pp-pm)/(2*h*p0);}
  let V=0;for(let i=0;i<N;i++){V-=Z/Math.hypot(R[3*i],R[3*i+1],R[3*i+2]);for(let j=i+1;j<N;j++)V+=1/Math.hypot(R[3*i]-R[3*j],R[3*i+1]-R[3*j+1],R[3*i+2]-R[3*j+2]);}
  return [-0.5*lap/(h*h*p0)+V,p0];}
 return {Z,N,nu,psi,local};
}
function qGauss(){let u=0;while(!u)u=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Math.random());}
function qmcNew(W,nw){const ws=[];for(let k=0;k<nw;k++){const R=new Float64Array(3*W.N);for(let c=0;c<3*W.N;c++)R[c]=qGauss()*(c<6?0.6:1.8);const g=new Float64Array(3*W.N),L=W.local(R,g);ws.push({R,g,E:L[0],ps:L[1]});}
 return {W,ws,target:nw,ET:null,Eest:null,es:[],n:0};}
function qmcStep(S,tau,dmc){
 const W=S.W,n3=3*W.N,Rn=new Float64Array(n3),gn=new Float64Array(n3),lim=1/Math.sqrt(tau),cl=v=>v>lim?lim:v<-lim?-lim:v,next=[];let acc=0,eS=0,wS=0;
 if(dmc&&S.ET==null){S.Eest=S.ws.reduce((a,x)=>a+x.E,0)/S.ws.length;S.ET=S.Eest;}
 for(const x of S.ws){
  for(let c=0;c<n3;c++)Rn[c]=x.R[c]+tau*cl(x.g[c])+Math.sqrt(tau)*qGauss();
  const L=W.local(Rn,gn);let ok=L[1]*x.ps>0&&isFinite(L[0]);
  if(ok){let lg=0;for(let c=0;c<n3;c++){const f=Rn[c]-x.R[c]-tau*cl(x.g[c]),bk=x.R[c]-Rn[c]-tau*cl(gn[c]);lg+=(f*f-bk*bk)/(2*tau);}ok=Math.random()<(L[1]/x.ps)**2*Math.exp(lg);}
  const Eo=x.E;if(ok){acc++;x.R.set(Rn);x.g.set(gn);x.E=L[0];x.ps=L[1];}
  if(dmc){const c2=e=>Math.max(S.ET-5/Math.sqrt(tau)*0.1,Math.min(S.ET+5/Math.sqrt(tau)*0.1,e)),wt=Math.exp(-tau*(0.5*(c2(x.E)+c2(Eo))-S.ET)),m=Math.floor(wt+Math.random());
   for(let k=0;k<m&&next.length<3*S.target;k++)next.push(k===0?x:{R:Float64Array.from(x.R),g:Float64Array.from(x.g),E:x.E,ps:x.ps});eS+=wt*x.E;wS+=wt;}
  else{eS+=x.E;wS++;}}
 if(dmc){if(next.length)S.ws=next;const em=eS/wS;S.Eest=0.98*S.Eest+0.02*em;S.ET=S.Eest-Math.log(S.ws.length/S.target)/(20*tau);}
 S.n++;return [eS/wS,acc/S.ws.length];
}
function qmcStats(es,B){const bl=[];for(let i=0;i+B<=es.length;i+=B){let s=0;for(let k=i;k<i+B;k++)s+=es[k];bl.push(s/B);}if(bl.length<4)return null;const m=bl.reduce((a,b)=>a+b)/bl.length;return [m,Math.sqrt(bl.reduce((a,b)=>a+(b-m)**2,0)/(bl.length-1)/bl.length)];}

const QMN={mf:'no dodging (one determinant, close to Hartree–Fock)',vmc:'dodging electrons (variational Monte Carlo)',dmc:'full Monte Carlo (fixed-node diffusion Monte Carlo)'};
const QW={mf:'Each electron sits in its own orbital with no knowledge of where the others are, so they bump into each other too often. This is close to the Hartree–Fock limit.',vmc:'A Jastrow factor makes the wavefunction smaller whenever two electrons get close, so the walkers learn to keep apart. This catches part of the correlation energy.',dmc:'The walkers diffuse, and copies of them multiply where the energy is low and die out where it is high. That projects out the true ground state; the only approximation left is where the wavefunction changes sign (the nodes), which does not matter for helium and only slightly for lithium and beryllium.'};
const Q={Z:3,m:'dmc',run:false,A:null,I:null,ph:'eq',k:0,cap:MOB?36000:90000,pts:null,geo:null,ni:0,cnt:0,trace:[]};
const QCOL=[new THREE.Color('#2a78d6'),new THREE.Color('#eb6834')];
function qTau(){return Q.m==='dmc'?0.02/Q.Z:0.05;}
function qReset(){const A=QMCA[Q.Z],o=Object.assign({},A.P[Q.m],{jas:Q.m!=='mf'}),nw=MOB?(Q.m==='dmc'?200:150):(Q.m==='dmc'?400:300);
 Q.A=qmcNew(qmcMake(Q.Z,A.cfg,o),nw);Q.I=null;
 if($('#qIon').checked&&A.ion.exact==null){const oi=Object.assign({},A.ion.P[Q.m],{jas:Q.m!=='mf'});Q.I=qmcNew(qmcMake(Q.Z,A.ion.cfg,oi),nw);}
 Q.ph='eq';Q.k=0;Q.trace=[];Q.ni=0;Q.cnt=0;if(Q.geo)Q.geo.setDrawRange(0,0);qEnsurePts();Q.sc=5/A.R;qRender();simLabel();}
function qEnsurePts(){if(Q.pts)return;Q.geo=new THREE.BufferGeometry();Q.geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(3*Q.cap),3));Q.geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(3*Q.cap),3));Q.geo.setDrawRange(0,0);
 Q.pts=new THREE.Points(Q.geo,new THREE.PointsMaterial({size:0.07,vertexColors:true,transparent:true,opacity:0.3,depthWrite:false}));Q.pts.frustumCulled=false;Q.pts.visible=mode==='qmc';scene.add(Q.pts);}
function qAccum(){const S=Q.A,W=S.W,P=Q.geo.attributes.position.array,C=Q.geo.attributes.color.array,sc=Q.sc,step=Math.max(1,Math.floor(S.ws.length/120));
 for(let k=0;k<S.ws.length;k+=step){const R=S.ws[k].R;for(let e=0;e<W.N;e++){const j=Q.ni;P[3*j]=R[3*e]*sc;P[3*j+1]=R[3*e+2]*sc;P[3*j+2]=R[3*e+1]*sc;const c=QCOL[e<W.nu?0:1];C[3*j]=c.r;C[3*j+1]=c.g;C[3*j+2]=c.b;Q.ni=(Q.ni+1)%Q.cap;Q.cnt=Math.min(Q.cap,Q.cnt+1);}}
 Q.geo.attributes.position.needsUpdate=true;Q.geo.attributes.color.needsUpdate=true;Q.geo.setDrawRange(0,Q.cnt);}
function qStep(){if(!Q.A)qReset();const t0=performance.now(),dmc=Q.m==='dmc';
 while(performance.now()-t0<(MOB?6:11)){
  if(Q.ph==='eq'){qmcStep(Q.A,0.05,false);if(Q.I)qmcStep(Q.I,0.05,false);if(++Q.k>=250){Q.ph='run';Q.k=0;}}
  else{const r=qmcStep(Q.A,qTau(),dmc);Q.A.es.push(r[0]);Q.A.acc=r[1];if(Q.I){const ri=qmcStep(Q.I,qTau(),dmc);Q.I.es.push(ri[0]);}Q.k++;}}
 qAccum();if(Q.ph==='run'&&Q.k%5===0){const st=qmcStats(Q.A.es,dmc?100:50);if(st)Q.trace.push([Q.k,st[0],st[1]]);if(Q.trace.length>300)Q.trace=Q.trace.filter((_,i)=>i%2===0);}
 if(Q.frame=(Q.frame||0)+1,Q.frame%6===0)qRender();}
function qChart(){const T=Q.trace;if(T.length<2)return '';const A=QMCA[Q.Z],W=300,H=130,ys=T.flatMap(t=>[t[1]-t[2],t[1]+t[2]]).concat([A.ref]),lo=Math.min(...ys),hi=Math.max(...ys),pad=(hi-lo)*0.1||0.01,y0=lo-pad,y1=hi+pad,X=k=>8+(k/T[T.length-1][0])*(W-16),Y=v=>H-16-(v-y0)/(y1-y0)*(H-28);
 const band=T.map(t=>X(t[0]).toFixed(1)+','+Y(t[1]+t[2]).toFixed(1)).join(' ')+' '+T.slice().reverse().map(t=>X(t[0]).toFixed(1)+','+Y(t[1]-t[2]).toFixed(1)).join(' ');
 return '<div class="sub">Running average energy (hartree) with its error bar, against the exact value</div><svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:130px" role="img" aria-label="Energy converging toward the exact value"><polygon points="'+band+'" fill="var(--acc)" opacity="0.18"/><polyline fill="none" stroke="var(--acc)" stroke-width="2" points="'+T.map(t=>X(t[0]).toFixed(1)+','+Y(t[1]).toFixed(1)).join(' ')+'"/><line x1="8" x2="'+(W-8)+'" y1="'+Y(A.ref).toFixed(1)+'" y2="'+Y(A.ref).toFixed(1)+'" stroke="var(--ink)" stroke-dasharray="4 3" stroke-width="1"/><text x="'+(W-8)+'" y="'+(Y(A.ref)-4).toFixed(1)+'" font-size="11" text-anchor="end" fill="var(--mut)">exact '+A.ref.toFixed(4)+'</text><text x="'+(W-8)+'" y="'+(H-2)+'" font-size="11" text-anchor="end" fill="var(--mut)">'+T[T.length-1][0]+' steps</text></svg>';}
function qRender(){const A=QMCA[Q.Z],S=Q.A;$('#qWhat').textContent=QW[Q.m];
 $$('[data-qz]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.qz===Q.Z)));$$('[data-qm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qm===Q.m)));
 if(!S){$('#qRes').innerHTML='';return;}
 $('#qStat').textContent=(Q.run?(Q.ph==='eq'?'Warming up the walkers (these steps are thrown away)…':'Running'):'Paused')+' · '+S.ws.length+' walkers · '+(Q.ph==='run'?Q.k+' steps':'')+(S.acc!=null?' · '+Math.round(100*S.acc)+'% of moves accepted':'');
 const dmc=Q.m==='dmc',st=qmcStats(S.es,dmc?100:50),Ha=27.211386;let h='<div class="sub">'+A.nm+' · '+S.W.N+' electrons · '+QMN[Q.m]+'</div>';
 if(!st){$('#qRes').innerHTML=h+'<p class="note">Collecting samples… an error bar appears after a few hundred steps.</p>';return;}
 const cc=100*(A.hf-st[0])/(A.hf-A.ref);
 h+='<dl><dt>Total energy</dt><dd>'+st[0].toFixed(4)+' ± '+st[1].toFixed(4)+' hartree<br><small>'+fE(st[0]*Ha)+'</small></dd><dt>Exact (non-relativistic)</dt><dd>'+A.ref.toFixed(4)+' hartree</dd><dt>Off by</dt><dd>'+fE((st[0]-A.ref)*Ha)+' ('+(Math.abs(st[0]-A.ref)<=2*st[1]?'within the error bar':Math.abs((st[0]-A.ref)/st[1]).toFixed(1)+' error bars')+')</dd>';
 h+='<dt>Correlation energy captured</dt><dd>'+Math.max(-50,Math.min(150,cc)).toFixed(0)+'%</dd>';
 let ion=A.ion.exact!=null?[A.ion.exact,0]:(Q.I?qmcStats(Q.I.es,dmc?100:50):null);
 if(ion){const ie=(ion[0]-st[0])*Ha,ee=Math.hypot(st[1],ion[1])*Ha;h+='<dt>Ionization energy</dt><dd>'+fE(ie,4)+' ± '+fE(ee,2)+'<br><small>measured '+fE(A.ie,4)+(A.ion.exact!=null?' · the ion has one electron, so its energy is exact':'')+'</small></dd>';}
 h+='</dl>'+qChart();
 h+='<p class="note">“Correlation energy” is the part of the energy that comes from electrons dodging each other: 0% means no dodging (Hartree–Fock), 100% the exact answer. The ionization energy is the energy of the ion minus the energy of the atom, both simulated the same way.</p>';
 $('#qRes').innerHTML='<div class="tbrow">'+tb('c')+'Monte Carlo result. The ± is its statistical error and shrinks the longer it runs.</div>'+h+'<div class="chips" style="margin-top:8px"><button id="qJson">Download results (JSON)</button></div>';$('#qJson').onclick=()=>{const A=QMCA[Q.Z],st2=qmcStats(Q.A.es,Q.m==='dmc'?100:50);dl('monte-carlo-'+A.nm.toLowerCase()+'.json',JSON.stringify({atom:A.nm,Z:Q.Z,method:QMN[Q.m],walkers:Q.A.ws.length,steps:Q.k,energy_hartree:st2?st2[0]:null,error_hartree:st2?st2[1]:null,exact_hartree:A.ref,measured_ionization_eV:A.ie,trace:Q.trace},null,1),'application/json');};}
$$('[data-qz]').forEach(b=>b.addEventListener('click',()=>{Q.Z=+b.dataset.qz;qReset();}));
$$('[data-qm]').forEach(b=>b.addEventListener('click',()=>{Q.m=b.dataset.qm;qReset();}));
$('#qIon').addEventListener('change',qReset);
$('#qGo').addEventListener('click',()=>{if(!Q.A)qReset();Q.run=true;qRender();});
$('#qStop').addEventListener('click',()=>{Q.run=false;qRender();});
$('#qReset').addEventListener('click',()=>{const r=Q.run;qReset();Q.run=r;});

