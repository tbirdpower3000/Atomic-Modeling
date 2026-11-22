/* ---- spectra ---- */
const SPL={H:[656.28,486.13,434.05,410.17,397.01],He:[388.86,447.15,471.31,492.19,501.57,587.56,667.82,706.52],Li:[460.29,610.36,670.78],N:[742.36,744.23,746.83],O:[615.82,777.19],Ne:[540.06,585.25,588.19,594.48,609.62,614.31,626.65,633.44,640.22,650.65,667.83,692.95,703.24],
 Na:[498.28,568.82,588.995,589.592,616.07],Mg:[383.83,516.73,517.27,518.36],Al:[394.40,396.15],Ar:[415.86,420.07,696.54,706.72,738.40,750.39,763.51,772.38],K:[404.41,404.72,766.49,769.90],Ca:[422.67,445.48,558.88,616.22,643.91,646.26],
 Cr:[425.43,427.48,428.97,520.45,520.60,520.84],Mn:[403.08,403.31,403.45],Fe:[404.58,438.35,440.48,495.76,516.75,526.95,532.80,537.15],Cu:[510.55,515.32,521.82,578.21],Zn:[468.01,472.22,481.05,636.23],Ga:[403.30,417.20],Kr:[427.40,431.96,557.03,587.09,760.15],
 Rb:[420.18,421.55,780.03],Sr:[460.73,640.85,650.40,687.84],Ag:[520.91,546.55],Cd:[467.82,479.99,508.58,643.85],In:[410.18,451.13],Xe:[450.10,462.43,467.12,473.42,480.70],Cs:[455.53,459.32],Ba:[553.55],Hg:[404.66,435.83,546.07,576.96,579.07],Tl:[535.05],Pb:[405.78]};
const SPK={H:'The red line at 656 nm is why hydrogen clouds in space glow pink-red.',He:'Helium was found in the Sun’s spectrum (the yellow 588 nm line) before anyone found it on Earth.',Li:'The red 671 nm line gives lithium its crimson flame.',Na:'The two orange lines at 589 nm are why sodium street lamps and salty flames glow orange.',K:'Potassium burns lilac: deep red plus violet lines.',Ca:'Calcium gives a brick-red to orange flame.',Sr:'Strontium makes fireworks red.',Ba:'Barium makes fireworks green.',Cu:'Copper’s green lines give blue-green flames and fireworks.',Ne:'All those red and orange lines add up to the glow of a neon sign.',Hg:'Mercury lamps look blue-white: violet, blue, green and yellow lines together.',Ar:'Argon glows violet-blue in a tube; most of its strong lines are deep red.',Cs:'Caesium is named after its sky-blue lines.',Rb:'Rubidium is named after its deep red lines.',Tl:'Thallium is named after its single bright green line.',In:'Indium is named after its indigo line.'};
let spMode='ref';
function nmRGB(w){let r=0,g=0,b=0;if(w<380||w>780)return [120,120,120];if(w<440){r=-(w-440)/60;b=1;}else if(w<490){g=(w-440)/50;b=1;}else if(w<510){g=1;b=-(w-510)/20;}else if(w<580){r=(w-510)/70;g=1;}else if(w<645){r=1;g=-(w-645)/65;}else r=1;
 const f=w<420?0.3+0.7*(w-380)/40:w>700?0.3+0.7*(780-w)/80:1;return [r,g,b].map(v=>Math.round(255*Math.pow(v*f,0.8)));}
function hLines(Z,A){const M=(A||1)*1822.888,R=10973731.568/(1+1/M),out=[];for(let lo=1;lo<=6;lo++)for(let hi=lo+1;hi<=lo+7;hi++){const vac=1e9/(R*Z*Z*(1/(lo*lo)-1/(hi*hi)));out.push({lo,hi,nm:vac>200?vac/1.000277:vac,vac});}return out;}
const SERIES=['','Lyman','Balmer','Paschen','Brackett','Pfund','Humphreys'];
function drawSpec(){const cv=$('#specCv');if(!cv)return;const Z=sel&&sel<=118?sel:1,sym=SYM[Z-1],A=selIso&&selIso.z===Z?selIso.a:(ISOZ[Z]&&ISOZ[Z].length?ISOZ[Z].slice().sort((a,b)=>(b[2]||0)-(a[2]||0))[0][1]:Z*2),ref=SPL[sym]||[],hl=hLines(Z,A),W=cv.clientWidth,H=cv.clientHeight;if(!W)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle='#000';x.fillRect(0,0,W,H);const X=w=>(w-380)/400*W;
 const rows=spMode==='both'?[['ref',0,H/2-2],['h',H/2+2,H]]:[[spMode,0,H]];
 rows.forEach(([k,y0,y1])=>{(k==='ref'?ref.map(w=>({nm:w})):hl.filter(q=>q.nm>=380&&q.nm<=780)).forEach(q=>{const c=nmRGB(q.nm),px=X(q.nm);const g=x.createLinearGradient(px-5,0,px+5,0);g.addColorStop(0,'rgba('+c+',0)');g.addColorStop(0.5,'rgba('+c+',0.55)');g.addColorStop(1,'rgba('+c+',0)');x.fillStyle=g;x.fillRect(px-5,y0,10,y1-y0);x.fillStyle='rgb('+c+')';x.fillRect(px-1,y0,2,y1-y0);if(k==='h'&&q.hi===n&&q.lo<n){x.strokeStyle='#fff';x.lineWidth=1;x.strokeRect(px-4,y0+2,8,y1-y0-4);}});
  x.fillStyle='rgba(255,255,255,0.75)';x.font='11px "Instrument Sans",sans-serif';x.textAlign='left';if(spMode==='both')x.fillText(k==='ref'?'measured':'one-electron ion, exact',6,y0+13);});
 x.fillStyle='rgba(255,255,255,0.6)';x.font='11px "Instrument Sans",sans-serif';x.textAlign='center';for(let w=400;w<=760;w+=(W<520?80:40))x.fillText(w+' nm',X(w),H-5);
 const sw=w=>'<i style="background:rgb('+nmRGB(w)+')"></i>',ion=Z===1?'hydrogen atom':NAMEZ(Z).toLowerCase()+' with all but one electron removed';let h='<div class="nm" style="font-size:var(--f5)">'+NAMEZ(Z)+'</div>';
 if(spMode!=='h'){h+='<div class="tbrow">'+tb('m')+'Strongest visible lines of the neutral atom, wavelengths in air (NIST Atomic Spectra Database). A short reference list, not the full spectrum.</div>';
  h+=ref.length?(SPK[sym]?'<p style="margin:4px 0 6px">'+SPK[sym]+'</p>':'')+'<p style="margin:0;line-height:1.9">'+ref.map(w=>'<span style="white-space:nowrap;margin-right:12px">'+sw(w)+w.toFixed(1)+' nm</span>').join(' ')+'</p>':'<p class="note">No reference lines are stored for '+NAMEZ(Z).toLowerCase()+' yet. Try H, He, Li, Na, K, Ca, Cu, Sr, Ne, Ar or Hg, or switch to the one-electron ion.</p>';}
 if(spMode!=='ref'){const vis=hl.filter(q=>q.nm>=380&&q.nm<=780),cur=hl.filter(q=>q.hi===n&&q.lo<n);h+='<div class="tbrow" style="margin-top:10px">'+tb('x')+'Lines of a '+ion+', from the Rydberg formula with the mass-'+A+' nucleus. Exact apart from tiny relativistic shifts.</div>';
  h+='<table class="spectab"><tr><th>Jump</th><th>Series</th><th>Wavelength</th><th>Photon energy</th></tr>'+(cur.length?cur:vis.length?vis:hl.slice(0,5)).slice(0,8).map(q=>'<tr><td>'+q.hi+' → '+q.lo+'</td><td>'+(SERIES[q.lo]||'')+'</td><td>'+(q.nm>=380&&q.nm<=780?sw(q.nm):'')+(q.nm>=10?q.nm.toFixed(2)+' nm':q.nm.toFixed(4)+' nm')+(q.nm<380?(q.nm<10?' (X-ray)':' (ultraviolet)'):q.nm>780?' (infrared)':'')+'</td><td>'+fE(1239.841984/q.vac)+'</td></tr>').join('')+'</table>';
  h+='<p class="note">'+(cur.length?'These are the jumps down from n = '+n+', the shell shown in the 3D view (white boxes on the strip when visible). ':'')+(Z>1?'With '+Z+' protons the lines are '+Z*Z+'× more energetic than hydrogen’s, so most fall in the ultraviolet or X-ray. ':'Compare with the measured lines: Balmer’s red line comes out at '+hl.find(q=>q.lo===2&&q.hi===3).nm.toFixed(2)+' nm against 656.28 nm measured. ')+'Pick a heavier isotope and every line shifts slightly: that isotope shift is how deuterium was discovered.</p>';}
 $('#specOut').innerHTML=h;}
$$('[data-sp]').forEach(b=>b.addEventListener('click',()=>{spMode=b.dataset.sp;$$('[data-sp]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawSpec();}));
new IntersectionObserver(es=>{if(es[0].isIntersecting)drawSpec();},{rootMargin:'250px 0px'}).observe($('#spec'));window.addEventListener('resize',drawSpec);
/* ---- export ---- */
function gCube(){const st=GS.states[GS.view];if(!st)return;let G=Math.round(Math.cbrt(st.psi.length)),psi=st.psi;const pr=gParams();let h=2*pr.L/G;if(G>128){const g=G/2,o=new Float32Array(g*g*g);for(let k=0;k<g;k++)for(let j=0;j<g;j++)for(let i=0;i<g;i++)o[(k*g+j)*g+i]=psi[((2*k)*G+2*j)*G+2*i]*2.828;psi=o;G=g;h*=2;}
 const o0=(-pr.L+0.5*h).toFixed(6),f=h.toFixed(6),nz=gPotK==='scf'?pr.a:gPotK==='h'?Math.round(pr.a):1,L=['Atomic Modeling: '+GPOT[gPotK].nm+', state '+(GS.view+1)+', E = '+(st.E*pr.P.unit).toPrecision(6)+(gPotK==='ws'?' eV (nuclear units: lengths in fm)':' eV (lengths in bohr)'),'wavefunction psi on a '+G+'^3 grid; loop order x outer, z inner','    1 '+o0+' '+o0+' '+o0,'  '+G+' '+f+' 0.000000 0.000000','  '+G+' 0.000000 '+f+' 0.000000','  '+G+' 0.000000 0.000000 '+f,'    '+nz+' '+nz.toFixed(6)+' 0.000000 0.000000 0.000000'],sc=1/Math.pow(h,1.5),row=[];
 for(let i=0;i<G;i++)for(let j=0;j<G;j++)for(let k=0;k<G;k++){row.push((psi[(k*G+j)*G+i]*sc).toExponential(5));if(row.length===6||k===G-1){L.push(row.join(' '));row.length=0;}}
 dl('state-'+(GS.view+1)+'-'+G+'.cube',L.join('\n')+'\n');}
$('#shCsv').addEventListener('click',()=>{const keys=Object.keys(PI).filter(k=>DATA[k]),q=v=>v==null?'':v;const rows=[['Z','symbol','name','configuration'].concat(keys.map(k=>k+(PI[k].u?' ['+PI[k].u+']':'')+' ('+TBK[PIK[k]||'m'][0].toLowerCase()+')')).join(',')];SYM.forEach((sy,i)=>{if(i<118)rows.push([i+1,sy,NAMEZ(i+1),'"'+config(i+1).list.map(x=>x.n+LET[x.l]+x.e).join(' ')+'"'].concat(keys.map(k=>q(DATA[k][i]))).join(','));});$('#shNote').textContent=dl('elements.csv',rows.join('\n')+'\n','text/csv')?'Saved elements.csv':'This browser blocked the download.';});
$('#shIso').addEventListener('click',()=>{const rows=['Z,symbol,A,N,natural_abundance_percent,half_life_seconds,decay_mode,binding_energy_per_nucleon_MeV,spin_parity'];ISO.forEach(r=>{const d=NUCD?NUCD[r[0]+'-'+r[1]]:null;rows.push([r[0],SYM[r[0]-1],r[1],r[1]-r[0],r[2]==null?'':r[2],r[3]==null?'stable':(10**r[3]).toPrecision(4),r[4]||'',d?d[0]:'',d&&d[3]?d[3]:''].join(','));});$('#shNote').textContent=dl('isotopes.csv','# half-lives: NUBASE2020; binding energies and spins: AME2020 / NUBASE2020\n'+rows.join('\n')+'\n','text/csv')?'Saved isotopes.csv':'This browser blocked the download.';});
$('#shPng').addEventListener('click',()=>{try{renderer.render(scene,cam);const a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='atomic-modeling.png';document.body.appendChild(a);a.click();a.remove();$('#shNote').textContent='Saved atomic-modeling.png';}catch(e){$('#shNote').textContent='This browser blocked the download.';}});
/* ---- share links: the address remembers the view ---- */
function viewState(){const o={tab:TAB,z:sel||1,mode,n,l,m,by:$('#cby').value,eu:EU};if(selIso&&selIso.z===sel&&!selIso.pred)o.a=selIso.a;if(part&&part!=='e')o.p=part;return Object.keys(o).map(k=>k+'='+encodeURIComponent(o[k])).join('&');}
function applyState(str){const o={};str.replace(/^#/,'').split('&').forEach(kv=>{const i=kv.indexOf('=');if(i>0)o[kv.slice(0,i)]=decodeURIComponent(kv.slice(i+1));});if(!Object.keys(o).length)return;
 try{const Z=+o.z;if(Z>=1&&Z<=120)showEl(Z);if(o.a&&ISO.some(r=>r[0]===Z&&r[1]===+o.a)){selIso={z:Z,a:+o.a,pred:null};renderIso();}
  const N=+o.n,Lq=+o.l,M=+o.m;if(N>=1&&N<=7&&Lq>=0&&Lq<N&&Math.abs(M)<=Lq){n=N;l=Lq;m=M;rebuild();}
  if(o.by){const c=$('#cby');if([...c.options].some(x=>x.value===o.by)){c.value=o.by;c.dispatchEvent(new Event('change'));}}
  if(o.eu){const b=document.querySelector('[data-eu="'+o.eu+'"]');if(b)b.click();}
  if(o.p){const b=document.querySelector('[data-part="'+o.p+'"]');if(b)b.click();}
  if(o.mode){const b=document.querySelector('[data-mode="'+o.mode+'"]');if(b)b.click();}
  if(o.tab)setTab(o.tab,{instant:true});}catch(e){console.error('could not restore the shared view',e);}}
$('#shLink').addEventListener('click',()=>{let base='https://tbirdpower3000.github.io/Atomic-Modeling/';try{if(window.top===window.self&&/^https?:/.test(location.protocol))base=location.origin+location.pathname;}catch(e){}const url=base+'#'+viewState();
 const done=ok=>{$('#shNote').innerHTML=ok?'Link copied. Anyone who opens it sees this element, view and orbital.':'Copy this link: <input readonly value="'+url+'" style="width:min(100%,420px)" onfocus="this.select()">';};
 try{navigator.clipboard.writeText(url).then(()=>done(true),()=>done(false));}catch(e){done(false);}try{if(window.top===window.self)history.replaceState(null,'','#'+viewState());}catch(e){}});



/* ---- fuse and split: where nuclear energy comes from ---- */
const uMeV=1.602176634e-13,NAv=6.02214076e23;
function Btot(z,a){if(z===0&&a===1)return 0;if(z===1&&a===1)return 0;return Bt(z,a);}
function Qof(re,pr){let q=0;for(const [z,a] of re){const b=Btot(z,a);if(b==null)return null;q-=b;}for(const [z,a] of pr){const b=Btot(z,a);if(b==null)return null;q+=b;}return q;}
const Vcoul=(z1,a1,z2,a2)=>1.43996*z1*z2/(1.4*(Math.cbrt(a1)+Math.cbrt(a2)));
const FUSE=[
 {id:'dt',nm:'D + T',re:[[1,2],[1,3]],pr:[[2,4],[0,1]],T:150,Tsrc:'m',
  why:'The easiest fusion reaction there is, and the one every fusion reactor on Earth uses. It needs the lowest temperature because both nuclei carry only one proton, so they push each other apart the least.'},
 {id:'dd1',nm:'D + D → helium-3',re:[[1,2],[1,2]],pr:[[2,3],[0,1]],T:400,Tsrc:'m',
  why:'Two deuterium nuclei fuse about half the time into helium-3 and a neutron. Deuterium can be taken straight from seawater, but this needs several times the temperature of D + T.'},
 {id:'dd2',nm:'D + D → tritium',re:[[1,2],[1,2]],pr:[[1,3],[1,1]],T:400,Tsrc:'m',
  why:'The other half of the time the same collision makes tritium and a proton instead. The two branches are almost equally likely.'},
 {id:'dhe3',nm:'D + helium-3',re:[[1,2],[2,3]],pr:[[2,4],[1,1]],T:600,Tsrc:'m',
  why:'Releases more energy than D + T and makes no neutron at all, so nothing around it becomes radioactive. The catch is the temperature, and that helium-3 is rare on Earth.'},
 {id:'pli',nm:'proton + lithium-7',re:[[1,1],[3,7]],pr:[[2,4],[2,4]],T:600,Tsrc:'g',
  why:'The first nuclear reaction ever driven by an accelerator, by Cockcroft and Walton in 1932. One proton splits a lithium nucleus into two alpha particles.'},
 {id:'pb',nm:'proton + boron-11',re:[[1,1],[5,11]],pr:[[2,4],[2,4],[2,4]],T:3000,Tsrc:'g',
  why:'Three alpha particles and no neutrons: the cleanest fusion known. Boron has five protons, so the push-apart is far stronger and the temperature needed is enormous.'},
 {id:'3a',nm:'three helium-4 → carbon',re:[[2,4],[2,4],[2,4]],pr:[[6,12]],T:100,Tsrc:'m',
  why:'The triple-alpha process. Every carbon atom in your body was made this way, inside a red giant star. Three helium nuclei have to meet almost at once, which is why it needs a dense, hot stellar core.'},
 {id:'cc',nm:'carbon + carbon',re:[[6,12],[6,12]],pr:[[12,23],[0,1]],T:800,Tsrc:'g',
  why:'Carbon burning, late in the life of a star at least eight times the mass of the Sun. Stars run through heavier and heavier fuels like this until they reach iron, where fusion stops paying.'},
 {id:'pp',nm:'the Sun: 4 protons → helium-4',re:[[1,1],[1,1],[1,1],[1,1]],pr:[[2,4]],T:15.7,Tsrc:'m',fixedQ:26.73,
  why:'The proton–proton chain, which powers the Sun. Two of the four protons must turn into neutrons through the weak force, and that is so unlikely that an average proton waits billions of years. That slowness is why the Sun burns steadily instead of exploding.'}];
const FISS=[
 {id:'u235',Z:92,A:235,nu:2.42,bar:6.0,nm:'uranium-235 + a slow neutron',
  why:'The fuel of almost every nuclear reactor. A slow neutron is enough to split it, so a reactor can run a controlled chain reaction.'},
 {id:'u238',Z:92,A:238,nu:2.7,bar:6.3,nm:'uranium-238 + a fast neutron',
  why:'Over 99% of natural uranium is this isotope, but a slow neutron cannot split it. It mostly absorbs neutrons instead, which is how plutonium gets made.'},
 {id:'pu239',Z:94,A:239,nu:2.88,bar:6.0,nm:'plutonium-239 + a slow neutron',
  why:'Made inside reactors from uranium-238. It splits more easily than uranium-235 and gives out more neutrons per split.'},
 {id:'th232',Z:90,A:232,nu:2.3,bar:6.5,nm:'thorium-232 + a fast neutron',
  why:'Three times as common as uranium. On its own it is poor fuel, but absorbing a neutron turns it into uranium-233, which is excellent fuel.'},
 {id:'cf252',Z:98,A:252,nu:3.76,bar:5.3,spont:true,nm:'californium-252, splitting on its own',
  why:'So heavy that it splits without being hit at all: about 3% of its decays are spontaneous fission. It is used as a portable neutron source.'}];
let ffMode='fuse',fuSel='dt',fiSel='u235',ffSlow=false;
const FF={t:0,ph:0,run:false,vis:false,parts:[],E:0,cap:'',chain:[],last:0};
function fissility(Z,A){const I=(A-2*Z)/A;return (Z*Z/A)/(50.883*(1-1.7826*I*I));}
/* which fragments appear: the heavy one sits near mass 140 whatever you split, because 82 neutrons
   and 50 protons form closed shells there. The light one is whatever is left. */
function fragments(Z,A,nu){const AH=Math.max(118,Math.round(139+gauss()*5.5)),AL=A-Math.round(nu)-AH;
 const ZH=Math.round(Z*AH/A),ZL=Z-ZH;return [[ZL,AL],[ZH,AH]];}
function gauss(){let u=0;while(!u)u=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Math.random());}
function ffCur(){return ffMode==='fuse'?FUSE.find(x=>x.id===fuSel):FISS.find(x=>x.id===fiSel);}
function ffSetup(){const C=ffCur();if(!C||!NUCD)return;FF.t=0;FF.ph=0;FF.parts=[];FF.chain=[];
 if(ffMode==='fuse'){FF.re=C.re.map(x=>x.slice());FF.pr=C.pr.map(x=>x.slice());FF.Q=C.fixedQ!=null?C.fixedQ:Qof(C.re,C.pr);}
 else{const [f1,f2]=fragments(C.Z,C.A+(C.spont?0:1),C.nu),n=Math.round(C.nu);
  FF.re=C.spont?[[C.Z,C.A]]:[[C.Z,C.A],[0,1]];FF.pr=[f1,f2].concat(Array(n).fill([0,1]));FF.Q=Qof(FF.re,FF.pr);}
 FF.run=true;ffRead();}
/* ---- the binding energy curve: the one picture behind all of it ---- */
function beDraw(){const cv=$('#beCv');if(!cv||!NUCD)return;const W=cv.clientWidth,H=cv.clientHeight;if(W<80)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);
 const pl=44,pr=12,pt=26,pb=26,X=a=>pl+(a/250)*(W-pl-pr),Y=b=>H-pb-(b/9.2)*(H-pt-pb),dk=isDark(),mut=getComputedStyle($('#probeMut')).color,ink=getComputedStyle($('#probeInk')).color;
 x.fillStyle=dk?'rgba(76,196,186,0.10)':'rgba(11,111,104,0.07)';x.fillRect(pl,pt,X(62)-pl,H-pt-pb);
 x.fillStyle=dk?'rgba(240,153,123,0.10)':'rgba(222,95,55,0.08)';x.fillRect(X(62),pt,W-pr-X(62),H-pt-pb);
 if(!beDraw.pts){const m={};for(const k in NUCD){const [z,a]=k.split('-').map(Number),b=NUCD[k][0];if(b>0&&a<=250&&(!m[a]||b>m[a]))m[a]=b;}
  beDraw.pts=Object.keys(m).map(a=>[+a,m[a]]).sort((p,q)=>p[0]-q[0]);}
 x.strokeStyle=mut;x.globalAlpha=0.35;x.lineWidth=1;for(let b=2;b<=8;b+=2){x.beginPath();x.moveTo(pl,Y(b));x.lineTo(W-pr,Y(b));x.stroke();}x.globalAlpha=1;
 x.strokeStyle=ink;x.lineWidth=2;x.beginPath();beDraw.pts.forEach((p,i)=>{const px=X(p[0]),py=Y(p[1]);i?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();
 const peak=[62,8.7944];x.fillStyle=dk?'#4cc4ba':'#0b6f68';x.beginPath();x.arc(X(peak[0]),Y(peak[1]),4,0,7);x.fill();
 x.font='600 '+(W<520?11:12)+'px "Instrument Sans",sans-serif';x.textAlign='center';
 const lab=(t,px,py,col)=>{x.lineWidth=4;x.lineJoin='round';x.strokeStyle=dk?'rgba(11,13,16,.9)':'rgba(255,255,255,.92)';x.strokeText(t,px,py);x.fillStyle=col;x.fillText(t,px,py);};
 lab(W<520?'nickel-62: most tightly bound':'nickel-62: the most tightly bound nucleus',X(62)+(W<520?34:12),Y(peak[1])-11,ink);
 lab('fusion releases energy →',X(31),H-pb-10,dk?'#4cc4ba':'#0b6f68');
 lab('← fission releases energy',X(160),H-pb-10,dk?'#f0997b':'#a9401f');
 const Z=sel&&sel<=118?sel:null,A=Z?(selIso&&selIso.z===Z?selIso.a:(ISOZ[Z]&&ISOZ[Z].length?ISOZ[Z].slice().sort((p,q)=>(q[2]||0)-(p[2]||0))[0][1]:Math.round(2.2*Z))):null;
 if(A&&A<=250&&NUCD[Z+'-'+A]){const b=NUCD[Z+'-'+A][0];x.strokeStyle=ink;x.setLineDash([3,3]);x.lineWidth=1.2;x.beginPath();x.moveTo(X(A),pt);x.lineTo(X(A),H-pb);x.stroke();x.setLineDash([]);
  x.fillStyle=dk?'#f0997b':'#a9401f';x.beginPath();x.arc(X(A),Y(b),5,0,7);x.fill();lab(SYM[Z-1]+'-'+A,X(A),Y(b)-11,ink);}
 x.fillStyle=mut;x.font=(W<520?11:12)+'px "Instrument Sans",sans-serif';x.textAlign='right';for(let b=2;b<=8;b+=2)x.fillText(b,pl-6,Y(b)+4);
 x.textAlign='center';for(let a=0;a<=200;a+=50)x.fillText(a,X(a),H-8);x.fillText('mass number',X(233),H-8);
 x.save();x.translate(12,H/2);x.rotate(-Math.PI/2);x.fillText('MeV per nucleon',0,0);x.restore();
 }
/* ---- the animation ---- */
const NR=a=>Math.max(5,2.6*Math.cbrt(a));
function ffDrawNuc(x,px,py,z,a,R,alpha){const dk=true;x.globalAlpha=alpha==null?1:alpha;
 x.beginPath();x.arc(px,py,R,0,7);x.fillStyle='rgba(120,140,160,0.18)';x.fill();
 const n=Math.min(a,60),rng=(i)=>{const t=Math.sin(i*12.9898+z*78.233)*43758.5453;return t-Math.floor(t);};
 for(let i=0;i<n;i++){const u=rng(i),v=rng(i+100),rr=R*0.86*Math.sqrt(u),th=v*6.2832;
  x.beginPath();x.arc(px+rr*Math.cos(th),py+rr*Math.sin(th),Math.max(1.1,R*0.13),0,7);x.fillStyle=i<n*z/Math.max(a,1)?'#4a8fe0':'#9aa3ab';x.fill();}
 x.globalAlpha=1;}
function ffDrawPeanut(x,px,py,R,sep,z,a){const d=sep*R;
 x.fillStyle='rgba(120,140,160,0.18)';x.beginPath();x.arc(px-d,py,R*0.92,0,7);x.fill();x.beginPath();x.arc(px+d,py,R*0.92,0,7);x.fill();
 if(sep<0.9){x.beginPath();x.rect(px-d,py-R*0.92*(1-sep),2*d,2*R*0.92*(1-sep));x.fill();}
 const n=Math.min(a,60),rng=i=>{const t=Math.sin(i*12.9898+z*78.233)*43758.5453;return t-Math.floor(t);};
 for(let i=0;i<n;i++){const u=rng(i),v=rng(i+100),side=i%2?1:-1,rr=R*0.8*Math.sqrt(u),th=v*6.2832;
  x.beginPath();x.arc(px+side*d+rr*Math.cos(th),py+rr*Math.sin(th),Math.max(1.1,R*0.12),0,7);x.fillStyle=i<n*z/Math.max(a,1)?'#4a8fe0':'#9aa3ab';x.fill();}}
function ffDraw(){const cv=$('#ffCv');if(!cv)return;const W=cv.clientWidth,H=cv.clientHeight;if(W<80)return;
 const dpr=Math.min(window.devicePixelRatio||1,MOB?1.5:2);if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
 const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);const cx=W/2,cy=H/2,sp=ffSlow?0.42:1,t=FF.t*sp,C=ffCur();if(!C)return;
 x.font='600 13px "Instrument Sans",sans-serif';x.textAlign='center';
 const tag=(t2,px,py)=>{x.fillStyle='rgba(233,231,226,0.92)';x.fillText(t2,px,py);};
 const nm=(z,a)=>z===0?'n':(SYM[z-1]||'?')+'-'+a;
 if(ffMode==='fuse'){
  const R=Math.min(W,H)*0.085,arrive=1.5,merge=2.2,fly=2.2;
  if(t<arrive){const f=t/arrive,d=W*0.36*(1-f*f);
   FF.re.forEach((p,i)=>{const sgn=i===0?-1:1,off=FF.re.length>2?(i-(FF.re.length-1)/2)*0.9:sgn*0.5;
    const px=cx+off*2*d,py=cy+(FF.re.length>2?Math.sin(i*2.1)*H*0.14*(1-f):0);
    ffDrawNuc(x,px,py,p[0],p[1],R*Math.cbrt(p[1]/3));tag(nm(p[0],p[1]),px,py+R*Math.cbrt(p[1]/3)+16);});
   FF.cap=f<0.75?'They repel each other: both are positively charged. Only speed (heat) gets them close enough.':'Close enough for the strong force to grab — it wins only at about a million-millionth of a millimetre.';}
  else if(t<merge){const f=(t-arrive)/(merge-arrive),Rt=R*Math.cbrt(FF.pr.reduce((q,p)=>q+p[1],0)/3);
   x.globalAlpha=1;ffDrawNuc(x,cx,cy,FF.re.reduce((q,p)=>q+p[0],0),FF.re.reduce((q,p)=>q+p[1],0),Rt*(1+0.18*Math.sin(f*22)));
   x.globalAlpha=0.35+0.65*Math.sin(f*3.14);x.beginPath();x.arc(cx,cy,Rt*(1.3+f*1.6),0,7);x.strokeStyle='#ffd27f';x.lineWidth=3;x.stroke();x.globalAlpha=1;
   FF.cap='Fused. The new nucleus is more tightly bound than the pieces were, and the leftover binding energy comes out.';}
  else{const f=Math.min(1,(t-merge)/fly);
   FF.pr.forEach((p,i)=>{const ang=i*(6.2832/FF.pr.length)+0.3,sc=p[0]===0?1.9:1,px=cx+Math.cos(ang)*W*0.42*f*sc,py=cy+Math.sin(ang)*H*0.38*f*sc;
    if(p[0]===0){x.beginPath();x.arc(px,py,5,0,7);x.fillStyle='#9aa3ab';x.fill();}else ffDrawNuc(x,px,py,p[0],p[1],R*Math.cbrt(p[1]/3));
    tag(nm(p[0],p[1]),px,py+(p[0]===0?16:R*Math.cbrt(p[1]/3)+16));});
   FF.cap='The products fly apart carrying '+fE(FF.Q*1e6)+'. In a reactor or a star that energy becomes heat and light.';
   if(f>=1&&t>merge+fly+0.8)FF.t=0;}
 }else{
  const A0=C.A+(C.spont?0:1),R=Math.min(W,H)*0.17,hit=C.spont?0:1.1,wob=hit+1.1,neck=wob+1.0,fly=neck+2.2;
  if(t<hit){const f=t/hit;const px=cx-W*0.45*(1-f);x.beginPath();x.arc(px,cy,5,0,7);x.fillStyle='#9aa3ab';x.fill();tag('neutron',px,cy-14);
   ffDrawNuc(x,cx,cy,C.Z,C.A,R);tag(nm(C.Z,C.A),cx,cy+R+18);FF.cap='A neutron drifts in. It has no charge, so nothing pushes it away.';}
  else if(t<wob){const f=(t-hit)/(wob-hit);ffDrawNuc(x,cx,cy,C.Z,A0,R*(1+0.1*Math.sin(f*26)));tag(nm(C.Z,A0)+'*',cx,cy+R+18);
   FF.cap='Absorbed. The nucleus is now hot and wobbling, with '+(C.spont?'enough energy to climb the barrier by tunnelling':fE((NUCD[C.Z+'-'+A0]?NUCD[C.Z+'-'+A0][1]:0)*1e6)+' of extra energy')+'.';}
  else if(t<neck){const f=(t-wob)/(neck-wob);ffDrawPeanut(x,cx,cy,R,0.15+f*0.78,C.Z,A0);
   FF.cap='Stretching. Surface tension pulls it back into a ball, but the protons push the two ends apart. Past a certain stretch the pushing wins.';}
  else{const f=Math.min(1,(t-neck)/fly),fr=FF.pr.filter(p=>p[0]>0),ns=FF.pr.filter(p=>p[0]===0);
   fr.forEach((p,i)=>{const sgn=i?1:-1,sc=Math.cbrt((fr[1-i]?fr[1-i][1]:1)/p[1]),px=cx+sgn*W*0.42*f*sc,py=cy;
    ffDrawNuc(x,px,py,p[0],p[1],R*Math.cbrt(p[1]/A0));tag(nm(p[0],p[1]),px,py+R*Math.cbrt(p[1]/A0)+18);});
   ns.forEach((p,i)=>{const ang=-0.9+i*(1.8/Math.max(1,ns.length-1)||0.6),px=cx+Math.cos(ang)*W*0.5*f*1.3,py=cy+Math.sin(ang)*H*0.6*f*1.3;
    x.beginPath();x.arc(px,py,5,0,7);x.fillStyle='#9aa3ab';x.fill();});
   if($('#fiChain')&&$('#fiChain').checked&&f>0.45){ns.forEach((p,i)=>{const ang=-0.9+i*(1.8/Math.max(1,ns.length-1)||0.6),g=Math.min(1,(f-0.45)/0.55);
     const tx=cx+Math.cos(ang)*W*0.46,ty=cy+Math.sin(ang)*H*0.52;x.globalAlpha=g*0.85;ffDrawNuc(x,tx,ty,C.Z,C.A,R*0.42);x.globalAlpha=1;});}
   FF.cap=($('#fiChain')&&$('#fiChain').checked?'Each loose neutron can split another nucleus, and those give out more neutrons again: a chain reaction. ':'')+'The fragments fly apart with '+fE(FF.Q*1e6)+' between them.';
   if(f>=1&&t>fly+1.0)FF.t=0;}
 }
 x.textAlign='left';x.fillStyle='rgba(233,231,226,0.55)';x.font='12px "Instrument Sans",sans-serif';x.fillText(ffMode==='fuse'?'fusion':'fission',12,20);
 const cap=$('#ffCap');if(cap&&cap.textContent!==FF.cap)cap.textContent=FF.cap;}
/* ---- the numbers ---- */
const NUCNM={'0-1':'neutron','1-1':'proton','1-2':'deuterium','1-3':'tritium'};
function ffRead(){const C=ffCur(),o=$('#ffOut');if(!C||!o||!NUCD)return;const nm=(z,a)=>NUCNM[z+'-'+a]||NAMEZ(z).toLowerCase()+'-'+a;const grp=L=>{const c={},o2=[];L.forEach(p=>{const k=nm(p[0],p[1]);if(!(k in c)){c[k]=0;o2.push(k);}c[k]++;});return o2.map(k=>(c[k]>1?c[k]+' \u00d7 ':'')+k).join(' + ');};
 const perKg=(Q,A)=>Q*uMeV*NAv/A*1000,fmtJ=j=>j>=1e12?(j/1e12).toPrecision(3)+' TJ':j>=1e9?(j/1e9).toPrecision(3)+' GJ':(j/1e6).toPrecision(3)+' MJ';
 let h='',Q=FF.Q;
 if(ffMode==='fuse'){const [z1,a1]=C.re[0],[z2,a2]=C.re[1]||C.re[0],V=Vcoul(z1,a1,z2,a2),Am=C.re.reduce((q,p)=>q+p[1],0);
  h='<div class="nm" class="ffnm" style="font-size:var(--f5)">'+grp(C.re)+' → '+grp(C.pr)+'</div>';
  h+='<p style="margin:6px 0">'+C.why+'</p><dl>';
  h+='<dt>Energy released</dt><dd>'+fE(Q*1e6)+' per reaction'+(C.fixedQ?' <small>(including the weak-force steps and what the neutrinos carry away)</small>':'')+'</dd>';
  h+='<dt>Per kilogram of fuel</dt><dd>'+fmtJ(perKg(Q,Am))+' — about '+Math.round(perKg(Q,Am)/24e6/1000).toLocaleString()+'× the same mass of coal</dd>';
  h+='<dt>Push-apart barrier</dt><dd>'+fE(V*1e6)+' <small>(the electrical repulsion they must get through)</small></dd>';
  h+='<dt>Temperature needed</dt><dd>'+(C.T>=1000?(C.T/1000).toFixed(1)+' billion':C.T<100?C.T+' million':Math.round(C.T)+' million')+' °C'+(C.Tsrc==='g'?' <small>(rough)</small>':'')+'</dd></dl>';
  const kT=C.T*1e6*8.617e-5;h+='<p class="note">At that temperature an average nucleus carries only about '+fE(kT)+' of heat energy, roughly '+Math.round(V*1e6/kT)+' times less than the barrier. They get through anyway by <b>quantum tunnelling</b>: a wave can leak through a wall it has not the energy to climb. Without tunnelling the Sun would not shine.</p>';}
 else{const A0=C.A+(C.spont?0:1),xf=fissility(C.Z,A0),Sn=NUCD[C.Z+'-'+A0]?NUCD[C.Z+'-'+A0][1]:null,fr=FF.pr.filter(p=>p[0]>0),nn=FF.pr.length-fr.length;
  h='<div class="nm" class="ffnm" style="font-size:var(--f5)">'+nm(C.Z,C.A)+(C.spont?'':' + neutron')+' → '+fr.map(p=>nm(p[0],p[1])).join(' + ')+' + '+nn+' neutrons</div>';
  h+='<p style="margin:6px 0">'+C.why+'</p><dl>';
  h+='<dt>Energy released</dt><dd>'+fE(Q*1e6)+' this time <small>(the split is different every time; the average is about 200 MeV)</small></dd>';
  h+='<dt>Per kilogram</dt><dd>'+fmtJ(perKg(200,C.A))+' — about '+Math.round(perKg(200,C.A)/24e6/1000).toLocaleString()+'× the same mass of coal</dd>';
  h+='<dt>Neutrons per split</dt><dd>'+nn+' now, '+C.nu+' on average</dd>';
  if(!C.spont&&Sn!=null){const go=Sn>C.bar;
   h+='<dt>Does a slow neutron work?</dt><dd>'+(go?'<b>Yes.</b> ':'<b>No.</b> ')+'Catching a neutron gives this nucleus '+fE(Sn*1e6)+', and it needs about '+fE(C.bar*1e6)+' to break. '+(go?'The neutron brings enough on its own, so it can be as slow as you like.':'The neutron must arrive carrying the missing '+fE((C.bar-Sn)*1e6)+' as speed.')+'</dd>';}
  h+='<dt>How close to falling apart</dt><dd>'+xf.toFixed(2)+' of the way <small>(the fissility: at 1.00 a nucleus cannot hold together at all)</small></dd></dl>';
  h+='<p class="note">The two pieces are almost never equal. One comes out near mass 140 whatever you split, because 82 neutrons and 50 protons fill complete shells there and that shape is cheapest. Whatever is left becomes the lighter piece — which is why heavier fuels give a heavier light fragment.</p>';}
 o.innerHTML=h;}
/* ---- wiring ---- */
$('#fuPre').innerHTML=FUSE.map(f=>'<button data-fu="'+f.id+'" aria-pressed="'+(f.id===fuSel)+'">'+f.nm+'</button>').join('');
$('#fiPre').innerHTML=FISS.map(f=>'<button data-fi="'+f.id+'" aria-pressed="'+(f.id===fiSel)+'">'+(SYM[f.Z-1]+'-'+f.A)+'</button>').join('');
$$('[data-fu]').forEach(b=>b.addEventListener('click',()=>{fuSel=b.dataset.fu;$$('[data-fu]').forEach(y=>y.setAttribute('aria-pressed',String(y===b)));ffSetup();}));
$$('[data-fi]').forEach(b=>b.addEventListener('click',()=>{fiSel=b.dataset.fi;$$('[data-fi]').forEach(y=>y.setAttribute('aria-pressed',String(y===b)));ffSetup();}));
$$('[data-ff]').forEach(b=>b.addEventListener('click',()=>{ffMode=b.dataset.ff;$$('[data-ff]').forEach(y=>y.setAttribute('aria-pressed',String(y===b)));
 $('#ffFuseBox').hidden=ffMode!=='fuse';$('#ffSplitBox').hidden=ffMode==='fuse';ffSetup();}));
$('#ffGo').addEventListener('click',ffSetup);
$('#fiChain').addEventListener('change',ffSetup);
$('#ffSlow').addEventListener('click',e=>{ffSlow=!ffSlow;e.currentTarget.setAttribute('aria-pressed',String(ffSlow));});
new IntersectionObserver(es=>{FF.vis=es[0].isIntersecting;if(FF.vis){beDraw();if(!FF.pr)ffSetup();}},{rootMargin:'200px 0px'}).observe($('#ff'));
(function ffLoop(){if(FF.vis&&!document.hidden){const now=performance.now();FF.t+=Math.min(0.05,(now-(FF.last||now))/1000);FF.last=now;try{ffDraw();}catch(e){}}else FF.last=0;requestAnimationFrame(ffLoop);})();
window.addEventListener('resize',()=>{if(FF.vis)beDraw();});
/* ---- tabs: one instrument, six sections ---- */
const TABS=['atom','pt','spec','nuc','ff','trans','sm'];
let TAB='atom';
function tabRedraw(t){
 try{
  if(t==='atom'){if(typeof rebuild==='function'&&mode!=='gpu'&&mode!=='qmc')rebuild();}
  if(t==='pt'){paint();if(!$('#trend').hidden&&PI[cby]&&DATA[cby])drawTrend();}
  if(t==='spec')drawSpec();
  if(t==='nuc'){drawNuc();if(typeof drawStab==='function')drawStab();}
  if(t==='ff'){beDraw();if(!FF.pr)ffSetup();}
  if(t==='trans'&&NUCD)runTR();
  if(t==='sm'){SIM.dirty=null;if(!SIM.tracks.length)simFire();}
 }catch(e){console.error(e);}
}
function setTab(t,opt){if(!TABS.includes(t))t='atom';TAB=t;
 $$('.tabpanel').forEach(p=>p.hidden=p.dataset.panel!==t);
 $$('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===t)));
 if(!opt||!opt.keepScroll)window.scrollTo({top:0,behavior:opt&&opt.instant?'auto':'smooth'});
 window.dispatchEvent(new Event('resize'));
 requestAnimationFrame(()=>requestAnimationFrame(()=>tabRedraw(t)));
 ctxUpdate();}
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
/* what is loaded right now, always on screen */
function ctxUpdate(){const c=$('#ctxChip');if(!c)return;const Z=sel&&sel<=118?sel:1,a=selIso&&selIso.z===Z?selIso.a:null;
 c.innerHTML='<b>'+SYM[Z-1]+(a?'-'+a:'')+'</b> <small>'+(mode==='nuc'?'nucleus':mode==='shell'?'shells':mode==='qmc'?'Monte Carlo':mode==='gpu'?'solver':orbName(n,l,m))+'</small>';
 c.title=NAMEZ(Z)+(a?'-'+a:'')+' · open in the Atom view';}
$('#ctxChip').addEventListener('click',()=>setTab('atom'));
/* help and settings */
$('#helpBtn').addEventListener('click',()=>{const d=$('#helpDlg');d.showModal?d.showModal():d.setAttribute('open','');});
$('#helpDlg').addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();const t=a.getAttribute('href').slice(1);$('#helpDlg').close&&$('#helpDlg').close();setTab(t);});
const setPanel=$('#setPanel'),setBtn=$('#setBtn');
function setOpen(v){setPanel.hidden=!v;setBtn.setAttribute('aria-expanded',String(v));}
setBtn.addEventListener('click',e=>{e.stopPropagation();setOpen(setPanel.hidden);});
document.addEventListener('click',e=>{if(!setPanel.hidden&&!setPanel.contains(e.target)&&e.target!==setBtn)setOpen(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
/* ---- Learn / Lab level ---- */
let ULV='learn';try{ULV=localStorage.getItem('lvl')||'learn';}catch(e){}
function setLvl(v,save){ULV=v;document.documentElement.classList.toggle('learn',v==='learn');$$('[data-lvl]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lvl===v)));
 $('#lvlNote').textContent=v==='learn'?'Learn shows the essentials. Switch to Lab for the solvers, Monte Carlo, hardware settings and data downloads.':'Lab shows every tool.';
 if(v==='learn'&&['vol','gpu','qmc'].includes(mode)){const b=document.querySelector('[data-mode="cloud"]');if(b)b.click();}
 if(save){try{localStorage.setItem('lvl',v);}catch(e){}}if(typeof msRender==='function')msRender();}
$$('[data-lvl]').forEach(b=>b.addEventListener('click',()=>setLvl(b.dataset.lvl,true)));
/* ---- guided missions ---- */
const MSF={island:false,spec:false};
const GOTAB={'#fig':'atom','#pt':'pt','#spec':'spec','#nuc':'nuc','#stab':'nuc','#ff':'ff','#trans':'trans','#sm':'sm'};
const go=id=>{const t=GOTAB[id];if(t)setTab(t);const e=document.querySelector(id);if(e&&t&&t!=='atom')setTimeout(()=>e.scrollIntoView({behavior:'smooth',block:'start'}),60);};
const MS=[
 {id:'atom',t:'Meet an atom',goal:'Find carbon, the element all living things are built from.',steps:['Open the Table tab.','Tap the square marked C (number 6).'],go:()=>go('#pt'),ok:()=>sel===6,
  won:'Carbon has 6 protons in its nucleus and 6 electrons around it. The number on each square is its proton count, and that number alone decides which element it is.'},
 {id:'cloud',t:'Where is the electron?',goal:'Make a dumbbell-shaped electron cloud.',steps:['In the Atom tab, choose “Dot cloud” under Show.','Set the shape number l to 1 (a p orbital).','Drag the picture to turn it around.'],go:()=>go('#fig'),ok:()=>l===1&&(mode==='cloud'||mode==='shape'),
  won:'An electron is not a tiny ball on a track. Each dot is one place it could turn up, and more dots mean more likely. The two colours are the two halves of its wave, not two electrons.'},
 {id:'shells',t:'Count the shells',goal:'See why sodium is so reactive.',steps:['In the Table tab, pick sodium (Na, number 11).','Back in the Atom tab, choose the “Shells” view.','Count the electrons in each ring.'],go:()=>go('#pt'),ok:()=>sel===11&&mode==='shell',
  won:'Sodium’s electrons sit 2, 8, 1. That one lonely outer electron is easy to give away, which is why sodium reacts so fiercely and why it pairs up with chlorine to make salt.'},
 {id:'light',t:'Fingerprints of light',goal:'Find a metal that makes fireworks green.',steps:['Open the Light tab.','Pick elements in the Table tab and come back to watch the lines.','Look for one whose lines are mostly green: try barium (Ba) or copper (Cu).'],go:()=>go('#spec'),ok:()=>MSF.spec&&(sel===56||sel===29),
  won:'Every element glows in its own exact colours. That is how firework makers choose their metals, and how astronomers know what stars are made of without ever visiting one.'},
 {id:'iso',t:'Heavy hydrogen',goal:'Find the hydrogen that weighs twice as much.',steps:['In the Table tab, pick hydrogen (H, number 1).','Scroll to its card below the table and find the isotope list.','Choose hydrogen-2 (deuterium).'],go:()=>go('#pt'),ok:()=>!!selIso&&selIso.z===1&&selIso.a===2,
  won:'Isotopes are the same element with extra neutrons. Deuterium has one proton and one neutron, so it weighs twice as much as ordinary hydrogen but behaves almost the same chemically.'},
 {id:'gold',t:'The alchemist’s dream',goal:'Turn mercury into gold.',steps:['Open the Transmute tab.','Set the start to mercury (Hg) and the target to gold (Au).','Read the route it finds.'],go:()=>go('#trans'),ok:()=>!!ROUTE&&ROUTE[0][0]===80&&ROUTE[ROUTE.length-1][0]===79,
  won:'It really can be done: knock one proton out of a mercury nucleus and it becomes gold. But each atom needs millions of times more energy than a chemical reaction, so the gold costs far more than it is worth.'},
 {id:'island',t:'Find the island',goal:'Visit a place on the map that nobody has reached.',steps:['Open the Nuclei tab.','Tap “Island of stability”.','Tap inside the shaded oval.'],go:()=>go('#nuc'),ok:()=>MSF.island,
  won:'The heaviest atoms ever made fall apart in less than a second. Scientists predict that a little further on, around 184 neutrons, some could last much longer. Nobody has got there yet: we are about 7 neutrons short.'},
 {id:'muon',t:'Catch a muon',goal:'Fire a muon through a particle detector.',steps:['Open the Particles tab.','Tap the muon (μ).','Watch its track in the detector, then try an electron and compare.'],go:()=>go('#sm'),ok:()=>smSel==='μ'&&SIM.tracks.length>0&&SIM.vis,
  won:'A muon is a heavy cousin of the electron. It punches through every layer of the detector, while an electron stops in the first thick one. That difference is how detectors tell them apart.'},
 {id:'grid',lab:true,t:'Solve the atom yourself',goal:'Make the computer find hydrogen’s ground state.',steps:['Switch to Lab under ⚙.','In the Atom tab, choose “Solve on GPU” and press Solve.','Compare its answer with the exact −13.6 eV.'],go:()=>go('#fig'),ok:()=>gPotK==='h'&&GS.states.length>0,
  won:'The solver knew nothing about orbitals: it only followed the Schrödinger equation on a grid, and the 1s cloud appeared on its own. The small error comes from the grid being too coarse near the nucleus.'},
 {id:'mc',lab:true,t:'Beat the textbook',goal:'Get helium’s energy right to three decimal places.',steps:['Switch to Lab under ⚙, then open “Monte Carlo electrons” in the Atom tab.','Choose Helium and Full Monte Carlo, then press Run.','Wait until the result is within 0.005 hartree of the exact value.'],go:()=>go('#fig'),ok:()=>{if(Q.Z!==2||!Q.A)return false;const st=qmcStats(Q.A.es,Q.m==='dmc'?100:50);return !!st&&Math.abs(st[0]-QMCA[2].ref)<0.005&&st[1]<0.005;},
  won:'The simple textbook picture, where each electron ignores the other, is off by about 1 eV. By tracking both electrons at once and letting them dodge each other, you recovered nearly all of it.'}];
let msDone=[],msCur=null;try{msDone=JSON.parse(localStorage.getItem('missions')||'[]');}catch(e){}
function msNext(){return MS.find(x=>!msDone.includes(x.id)&&(!x.lab||ULV==='lab'))||MS.find(x=>!msDone.includes(x.id))||null;}
function msRender(){const el=$('#msCard');if(!el)return;if(!msCur||(msDone.includes(msCur.id)&&!msCur.just))msCur=msNext();const M=msCur,avail=MS.filter(x=>!x.lab||ULV==='lab');
 $('#msProg').textContent=msDone.length+' of '+MS.length+' done';
 $('#msLine').textContent=M?((M.just||msDone.includes(M.id))?'✓ '+M.t:'Mission: '+M.t):'All missions complete';
 $('#msList').innerHTML=MS.map((x,i)=>'<button data-ms="'+x.id+'" class="'+(msDone.includes(x.id)?'ok':'')+'" aria-pressed="'+(M&&M.id===x.id)+'">'+(msDone.includes(x.id)?'✓ ':'')+(i+1)+'. '+x.t+(x.lab?' (Lab)':'')+'</button>').join('');
 if(!M){el.innerHTML='<h3>All missions complete</h3><p>You have explored electrons, light, isotopes, nuclei and particles. Everything is open to you now: switch to Lab and experiment.</p>';return;}
 if(M.just||msDone.includes(M.id)){el.innerHTML='<h3>'+M.t+'</h3><p class="done">✓ Mission complete</p><p>'+M.won+'</p><div class="chips"><button id="msGoNext">'+(msNext()?'Next mission':'Finish')+'</button></div>';$('#msGoNext').onclick=()=>{M.just=false;msCur=msNext();msRender();};return;}
 el.innerHTML='<h3>'+M.t+'</h3><p>'+M.goal+'</p><ol>'+M.steps.map(x=>'<li>'+x+'</li>').join('')+'</ol><div class="chips"><button id="msGo">Take me there</button>'+(M.lab&&ULV!=='lab'?'<button id="msLab">Switch to Lab</button>':'')+'</div>';
 $('#msGo').onclick=()=>M.go();const lb=$('#msLab');if(lb)lb.onclick=()=>setLvl('lab',true);}
$('#msOpen').addEventListener('click',()=>{const b=$('#msBody');b.hidden=!b.hidden;$('#msOpen').setAttribute('aria-expanded',String(!b.hidden));});
$('#msList').addEventListener('click',e=>{const b=e.target.closest('[data-ms]');if(!b)return;if(msCur)msCur.just=false;msCur=MS.find(x=>x.id===b.dataset.ms);msRender();});
$('#msReset').addEventListener('click',()=>{msDone=[];MS.forEach(x=>x.just=false);MSF.island=false;msCur=null;try{localStorage.removeItem('missions');}catch(e){}msRender();});
new IntersectionObserver(es=>{if(es[0].isIntersecting)MSF.spec=true;}).observe($('#specCv'));
setInterval(()=>{const M=msCur;if(!M||msDone.includes(M.id)||document.hidden)return;let ok=false;try{ok=M.ok();}catch(e){}if(ok){msDone.push(M.id);M.just=true;try{localStorage.setItem('missions',JSON.stringify(msDone));}catch(e){}const b=$('#msBody');if(b.hidden){b.hidden=false;$('#msOpen').setAttribute('aria-expanded','true');}msRender();}},500);
cv.addEventListener('webglcontextlost',e=>{e.preventDefault();GS.run=false;Q.run=false;const n=document.createElement('div');n.id='ctxLost';n.className='ctxlost';n.innerHTML='<p>The browser reset the graphics (this happens on phones when the app is in the background or memory runs low).</p><button>Reload the 3D view</button>';n.querySelector('button').onclick=()=>location.reload();fig.appendChild(n);},false);
try{if(location.hash.length>1){if(/mode=(vol|gpu|qmc)/.test(location.hash))ULV='lab';applyState(location.hash);}}catch(e){}
setLvl(ULV,false);
try{setTab(TAB,{instant:true,keepScroll:true});ctxUpdate();}catch(e){console.error(e);}
tick();
