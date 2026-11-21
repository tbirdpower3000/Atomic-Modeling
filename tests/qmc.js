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
if(typeof module!=='undefined')module.exports={QMCA,qmcMake,qmcNew,qmcStep,qmcStats};
