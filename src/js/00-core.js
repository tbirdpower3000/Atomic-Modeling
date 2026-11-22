const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* ---- trust labels: every number says where it comes from ---- */
const TBK={m:['Measured','From experiment'],x:['Exact','Solved exactly from the equations'],c:['Computed','Calculated by this app or its Python solver, with a known error'],g:['Rough guess','A simple model: treat it as an estimate']};
const tb=k=>'<span class="tb tb-'+k+'" title="'+TBK[k][1]+'">'+TBK[k][0]+'</span>';
const PIK={cov:'m',ie:'m',en:'m',ea:'m',mp:'m',den:'m',zeff:'g',shell:'g',iepy:'c',iem:'g',val:'x',state:'g',block:'x'};
function dl(name,text,type){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);return true;}catch(e){return false;}}
/* ---- mobile / low-power profile ---- */
let GFX='auto';try{GFX=localStorage.getItem('gfx')||'auto';}catch(e){}
const MOB=GFX==='light'?true:GFX==='full'?false:(()=>{try{const coarse=matchMedia('(pointer:coarse)').matches,small=Math.min(screen.width,screen.height)<900,lowMem=(navigator.deviceMemory||8)<=4,save=!!(navigator.connection&&navigator.connection.saveData);return (coarse&&small)||lowMem||save||/[?&]mobile=1/.test(location.search);}catch(e){return false;}})();
{const mn=document.getElementById('manual');if(mn){let st=null;try{st=localStorage.getItem('manualOpen');}catch(e){}mn.open=st!=null?st==='1':!matchMedia('(max-width:700px)').matches;mn.addEventListener('toggle',()=>{try{localStorage.setItem('manualOpen',mn.open?'1':'0');}catch(e){}});}}
if(MOB){document.documentElement.classList.add('mob');const p=document.getElementById('pts');if(p){p.value=15000;document.getElementById('ptsV').textContent=(15000).toLocaleString();}}
const LET='spdfgh';
let EU='eV';try{EU=localStorage.getItem('eunit')||'eV';}catch(e){}
const SUPD={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const p10=x=>'10'+String(x).split('').map(c=>SUPD[c]||(c==='.'?'·':c)).join('');
const sci=(v,u)=>{if(v===0)return '0 '+u;const e=Math.floor(Math.log10(Math.abs(v))),mt=v/10**e;return mt.toFixed(2)+' × 10'+String(e).split('').map(c=>SUPD[c]).join('')+' '+u;};
function fE(ev,dg){if(ev==null||!isFinite(ev))return '—';dg=dg||3;const a=Math.abs(ev);if(EU==='J')return sci(ev*1.602176634e-19,'J');if(EU==='cal')return sci(ev*1.602176634e-19/4.184,'cal');if(EU==='kJmol'){const v=ev*96.4853;return (Math.abs(v)>=1e5?sci(v,'kJ/mol'):Number(v.toPrecision(dg)).toLocaleString()+' kJ/mol');}if(EU==='kcalmol'){const v=ev*23.0605;return (Math.abs(v)>=1e5?sci(v,'kcal/mol'):Number(v.toPrecision(dg)).toLocaleString()+' kcal/mol');}
 return a>=1e6?(ev/1e6).toPrecision(dg)+' MeV':a>=1e3?(ev/1e3).toPrecision(dg)+' keV':ev.toPrecision(dg)+' eV';}
let n=3,l=2,m=2,mode='cloud',nPts=MOB?15000:40000,quiz=null,score=0,tries=0;

function legendre(L,M,x){let pmm=1;const s=Math.sqrt(Math.max(0,1-x*x));let f=1;for(let i=1;i<=M;i++){pmm*=-f*s;f+=2;}if(L===M)return pmm;let p1=x*(2*M+1)*pmm;if(L===M+1)return p1;let pl=0;for(let k=M+2;k<=L;k++){pl=(x*(2*k-1)*p1-(k+M-1)*pmm)/(k-M);pmm=p1;p1=pl;}return pl;}
function Y(x,y,z){const P=legendre(l,Math.abs(m),z);if(m===0)return P;const ph=Math.atan2(y,x);return P*(m>0?Math.cos(m*ph):Math.sin(-m*ph));}
function lag(k,a,x){if(k===0)return 1;let L0=1,L1=1+a-x;for(let j=1;j<k;j++){const L2=((2*j+1+a-x)*L1-(j+a)*L0)/(j+1);L0=L1;L1=L2;}return L1;}
let pot='atom',jsg=1;
function Rnl(r){if(pot==='nuc')return Math.pow(r,l)*Math.exp(-r*r/2)*lag(n-1,l+0.5,r*r);const rho=2*r/n;return Math.pow(rho,l)*Math.exp(-rho/2)*lag(n-l-1,2*l+1,rho);}

let tab=null;
function radialTable(){const rmax=pot==='nuc'?Math.sqrt(4*n+2*l+8)+2.5:4*n*n+10,N=3000,r=new Float64Array(N),P=new Float64Array(N),R=new Float64Array(N),C=new Float64Array(N);let s=0;
 for(let i=0;i<N;i++){r[i]=i/(N-1)*rmax;R[i]=Rnl(r[i]);P[i]=r[i]*r[i]*R[i]*R[i];s+=P[i];C[i]=s;}
 for(let i=0;i<N;i++){C[i]/=s;}let i99=C.findIndex(c=>c>=0.995);if(i99<0)i99=N-1;
 const nodes=[];for(let i=2;i<N;i++){if(R[i-1]*R[i]<0)nodes.push(r[i]);}
 let pk=0;for(let i=0;i<N;i++)if(P[i]>P[pk])pk=i;
 tab={r,P,R,C,r99:r[i99],nodes,peak:r[pk],pmax:P[pk]};}

