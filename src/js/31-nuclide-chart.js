let NVW=null,ISL=null;
function islBuild(){if(ISL)return ISL;const have=new Set(ISO.map(r=>r[0]+'-'+r[1]).concat(PRED.map(r=>r[0]+'-'+r[1])));ISL=[];
 for(let Z=108;Z<=126;Z++)for(let N=176;N<=194;N++){const A=Z+N;if(have.has(Z+'-'+A))continue;const q=massE(Z,A)-massE(Z-2,A-4)-(2*mH+2*mN-28.296);if(!(q>0.3))continue;const v=[Z/Math.sqrt(q),1/Math.sqrt(q),Z,1,(Z%2)*(1-N%2),(N%2)*(1-Z%2),(Z%2)*(N%2)],lh=v.reduce((a,x,i)=>a+x*VSC[i],0);
  const dx=(N-184)/7,dz=(Z-117)/6;if(dx*dx+dz*dz>1.15)continue;ISL.push([Z,A,lh,q,0,'isl']);}return ISL;}
function nucPreset(k){const W=$('#nucFig').clientWidth,nar=W<560;
 const C={whole:null,island:nar?{n0:154,n1:190,z0:100,z1:127}:{n0:138,n1:194,z0:98,z1:128},og:{c:[176,118],w:nar?22:34,h:nar?18:22},fl:{c:[184,114],w:nar?22:34,h:nar?18:22},next:{c:[176,120],w:nar?22:34,h:nar?16:20}}[k];
 NVW=C&&C.c?{n0:C.c[0]-C.w/2,n1:C.c[0]+C.w/2,z0:C.c[1]-C.h/2,z1:C.c[1]+C.h/2}:C?Object.assign({},C):null;
 $$('[data-nz]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.nz===k)));$('#nucZoomNote').hidden=!NVW;nucCv.style.touchAction=NVW?'none':'pan-y';drawNuc();}
function drawNuc(){const fig=$('#nucFig');if(!fig||!nucCv)return;const W=fig.clientWidth,H=fig.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);nucCv.width=W*dpr;nucCv.height=H*dpr;const x=nucCv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);
 const nar=W<560,Zm=!!NVW,VV=NVW||{n0:0,n1:196,z0:0,z1:134},n0=VV.n0,n1=VV.n1,z0=VV.z0,z1=VV.z1,pl=Zm?(nar?62:74):40,pb=Zm?38:34,pt=Zm?30:14,pr=Zm?18:14,cw=(W-pl-pr)/(n1-n0+1),ch=(H-pt-pb)/(z1-z0+1),X=n=>pl+(n-n0)*cw,Y=z=>H-pb-(z-z0+1)*ch;NG={pl,pb,pt,pr,cw,ch,W,H,n0,z0};
 const css=getComputedStyle($('#probeMut')).color,ink=getComputedStyle($('#probeInk')).color,dk=isDark(),cor=dk?'#f0997b':'#a9401f',corL=dk?'#f0997b':'#c4532c',fs=Zm&&W<520?11:12;x.font=fs+'px "Instrument Sans",sans-serif';x.fillStyle=css;x.strokeStyle=css;
 x.save();x.beginPath();x.rect(pl,pt,W-pl-pr,H-pt-pb);x.clip();
 // magic numbers (known), plus predicted ones in the zoom
 x.globalAlpha=0.2;x.lineWidth=1;[2,8,20,28,50,82,126].forEach(m=>{if(m>=n0&&m<=n1){x.beginPath();x.moveTo(X(m+0.5),pt);x.lineTo(X(m+0.5),H-pb);x.stroke();}if(m>=z0&&m<=z1){x.beginPath();x.moveTo(pl,Y(m)+ch/2);x.lineTo(W-pr,Y(m)+ch/2);x.stroke();}});x.globalAlpha=1;
 if(!Zm){x.globalAlpha=0.2;x.setLineDash([5,4]);x.beginPath();x.moveTo(X(0),Y(0)+ch);x.lineTo(X(Zmax0),Y(Zmax0));x.stroke();x.setLineDash([]);x.globalAlpha=1;
  x.fillStyle=dk?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.035)';x.fillRect(pl,Y(z1),W-pl-pr,Y(103)-Y(z1));}
 // island oval
 const ix=X(184)+cw/2,iy=Y(117)+ch/2,rx=Zm?7*cw:10*cw,ry=Zm?6*ch:9*ch;x.beginPath();x.ellipse(ix,iy,rx,ry,0,0,7);x.fillStyle=dk?'rgba(240,153,123,0.16)':'rgba(222,95,55,0.12)';x.fill();x.setLineDash([4,3]);x.strokeStyle=corL;x.lineWidth=1.4;x.stroke();x.setLineDash([]);
 if(Zm){x.globalAlpha=0.55;x.setLineDash([6,4]);x.strokeStyle=corL;x.lineWidth=1.2;x.beginPath();x.moveTo(X(184.5),pt);x.lineTo(X(184.5),H-pb);x.stroke();[114,120,126].forEach(z=>{x.beginPath();x.moveTo(pl,Y(z)+ch/2);x.lineTo(W-pr,Y(z)+ch/2);x.stroke();});
  x.strokeStyle=css;x.beginPath();x.moveTo(X(162.5),pt);x.lineTo(X(162.5),H-pb);x.stroke();x.beginPath();x.moveTo(pl,Y(108)+ch/2);x.lineTo(W-pr,Y(108)+ch/2);x.stroke();x.setLineDash([]);x.globalAlpha=1;}
 else{x.globalAlpha=0.35;x.setLineDash([2,3]);x.strokeStyle=css;x.beginPath();x.moveTo(X(184.5),pt);x.lineTo(X(184.5),H-pb);x.stroke();x.setLineDash([]);x.globalAlpha=1;}
 if(sel&&sel>=z0&&sel<=z1){x.fillStyle=dk?'rgba(76,196,186,0.12)':'rgba(11,111,104,0.08)';x.fillRect(pl,Y(sel),W-pl-pr,ch);}
 const big=cw>=15&&ch>=13;
 ISO.forEach(r=>{const n=r[1]-r[0];if(n<n0-1||n>n1+1||r[0]<z0-1||r[0]>z1+1)return;const c=nucCol(r);x.fillStyle=rgbs(c);x.fillRect(X(n),Y(r[0]),Math.max(1,cw*0.92),Math.max(1,ch*0.92));
  if(big){const l=0.299*c[0]+0.587*c[1]+0.114*c[2];x.fillStyle=l>140?'#1a1a1a':'#ffffff';x.font=Math.min(11,cw*0.48)+'px "Instrument Sans",sans-serif';x.textAlign='center';x.fillText(r[1],X(n)+cw*0.46,Y(r[0])+ch*0.46+Math.min(11,cw*0.48)*0.36);}});
 PRED.forEach(r=>{const n=r[1]-r[0];if(n<n0-1||n>n1+1||r[0]<z0-1||r[0]>z1+1)return;const c=nucCol([r[0],r[1],null,r[2]]);x.strokeStyle=rgbs(c);x.lineWidth=Zm?1.6:1.3;x.strokeRect(X(n)+0.8,Y(r[0])+0.8,Math.max(1,cw*0.92-1.6),Math.max(1,ch*0.92-1.6));
  if(r[4]){const cx=X(n)+cw/2,cy=Y(r[0])+ch/2,R=Math.max(5,Zm?cw*0.75:cw*1.1);x.strokeStyle=corL;x.lineWidth=1.6;x.beginPath();x.moveTo(cx,cy-R);x.lineTo(cx+R,cy);x.lineTo(cx,cy+R);x.lineTo(cx-R,cy);x.closePath();x.stroke();}});
 islBuild().forEach(r=>{const n=r[1]-r[0];if(n<n0-1||n>n1+1||r[0]<z0-1||r[0]>z1+1)return;const c=nucCol([r[0],r[1],null,r[2]]);x.globalAlpha=0.3;x.fillStyle=rgbs(c);x.fillRect(X(n),Y(r[0]),Math.max(1,cw*0.92),Math.max(1,ch*0.92));x.globalAlpha=1;x.strokeStyle=rgbs(c);x.lineWidth=Zm?1.4:1;x.setLineDash([2,2]);x.strokeRect(X(n)+1,Y(r[0])+1,Math.max(1,cw*0.92-2),Math.max(1,ch*0.92-2));x.setLineDash([]);
  if(big){x.fillStyle=css;x.font=Math.min(11,cw*0.48)+'px "Instrument Sans",sans-serif';x.textAlign='center';x.fillText(r[1],X(n)+cw*0.46,Y(r[0])+ch*0.46+Math.min(11,cw*0.48)*0.36);}});
 // frontier: most neutron-rich nucleus made so far, for each Z >= 100
 if(Zm){const fr={};ISO.forEach(r=>{if(r[0]>=100)fr[r[0]]=Math.max(fr[r[0]]||0,r[1]-r[0]);});x.strokeStyle=ink;x.lineWidth=2.5;x.beginPath();let first=true;for(let z=100;z<=118;z++){if(fr[z]==null)continue;const xx=X(fr[z]+1)-cw*0.04;if(first){x.moveTo(xx,Y(z)+ch);first=false;}else x.lineTo(xx,Y(z)+ch);x.lineTo(xx,Y(z));}x.stroke();}
 const ring=(z,a,col,w)=>{const n=a-z;if(n<n0||n>n1||z<z0||z>z1)return;x.strokeStyle=col;x.lineWidth=w;const cx=X(n)+cw/2,cy=Y(z)+ch/2;x.beginPath();x.arc(cx,cy,Math.max(6,Zm?cw*0.8:cw*1.6),0,7);x.stroke();};
 if(typeof ROUTE!=='undefined'&&ROUTE){x.strokeStyle=corL;x.lineWidth=2;x.beginPath();ROUTE.forEach((q,i)=>{const px=X(q[1]-q[0])+cw/2,py=Y(q[0])+ch/2;i?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();}
 if(selIso)ring(selIso.z,selIso.a,ink,2.5);if(nucHover)ring(nucHover[0],nucHover[1],ink,1.5);
 x.restore();
 // labels (drawn after clipping so they stay crisp, with a halo so they read over cells)
 const lab=(t,px,py,al,col,bold)=>{x.font=(bold?'600 ':'')+fs+'px "Instrument Sans",sans-serif';const tw=x.measureText(t).width,lo=al==='left'?px:al==='right'?px-tw:px-tw/2;if(lo+tw>W-4)px-=lo+tw-(W-4);if(lo<4)px+=4-lo;x.textAlign=al;x.lineWidth=4;x.lineJoin='round';x.strokeStyle=dk?'rgba(20,22,24,0.9)':'rgba(255,255,255,0.92)';x.strokeText(t,px,py);x.fillStyle=col;x.fillText(t,px,py);};
 const vis=(n,z)=>n>=n0&&n<=n1&&z>=z0&&z<=z1;
 if(Zm){if(vis(184,124))lab(nar?'Island of stability?':'Predicted island of stability',ix,Y(124)+ch/2-2,'center',cor,true);if(vis(184,z0))lab(nar?'N = 184':'N = 184 (predicted magic)',X(184.5),pt-10,'center',cor);
  if(vis(162,z0))lab(nar?'N = 162':'N = 162 (deformed shell)',X(162.5),pt-10,'center',css);
  [114,120,126].forEach(z=>{if(vis(n0,z))lab('Z = '+z,W-pr-4,Y(z)+ch/2-4,'right',cor);});
  const fr={};ISO.forEach(r=>{if(r[0]>=100)fr[r[0]]=Math.max(fr[r[0]]||0,r[1]-r[0]);});const fz=114,fn=fr[fz];if(fn&&vis(fn,fz)&&vis(184,fz)){const gx=X(fn+1),gy=Y(fz)+ch/2;x.strokeStyle=ink;x.lineWidth=1.2;x.setLineDash([3,3]);x.beginPath();x.moveTo(gx+3,gy);x.lineTo(X(184)-2,gy);x.stroke();x.setLineDash([]);lab((nar?'gap: ':'gap: ')+(184-fn-1)+(nar?' neutrons':' more neutrons'),(gx+X(184))/2+(nar?0:16),gy-7,'center',ink,true);}
  {const fz2=103,fn2=fr[fz2];if(fn2!=null&&vis(fn2+4,fz2))lab(nar?'← made so far':'← edge of what has been made',X(fn2+1)+8,Y(fz2)+ch/2+4,'left',ink,true);}if(vis(n0,126))lab(nar?'◇ 119, 120: next targets':'◇ elements 119 and 120: search targets',pl+4,Y(126)+ch/2+4,'left',cor);
  x.fillStyle=css;x.font=fs+'px "Instrument Sans",sans-serif';const nS=[1,2,4,5,10,20,40].find(st=>st*cw>=(nar?34:40))||40,zS=[1,2,5,10,20].find(st=>st*ch>=15)||20;for(let n=Math.ceil(n0/nS)*nS;n<=n1;n+=nS){x.textAlign='center';x.fillText(n,X(n)+cw/2,H-pb+15);}
  for(let z=Math.ceil(z0/zS)*zS;z<=z1;z+=zS){if(z<1)continue;x.textAlign='right';x.fillText((zS<=2&&SYM[z-1]?SYM[z-1]+' ':'')+z,pl-6,Y(z)+ch/2+4);}
  x.textAlign='center';x.fillText('Neutrons (N)',pl+(W-pl-pr)/2,H-4);}
 else{lab('Superheavy research (Z ≥ 104)',pl+6,Y(106)+ch,'left',css);lab('Predicted island',ix-rx-6,iy-4,'right',cor,true);lab('of stability →',ix-rx-6,iy+11,'right',cor,true);
  lab('◇ 119, 120',X(172),Y(124)+ch/2,'right',cor);lab('184?',X(184.5),H-pb-4,'center',css);
  x.fillStyle=css;x.font=fs+'px "Instrument Sans",sans-serif';[0,20,40,60,80,100,120,140,160,180].forEach(n=>{x.textAlign='center';x.fillText(n,X(n)+cw/2,H-pb+16);});[0,20,40,60,80,100,120,130].forEach(z=>{x.textAlign='right';x.fillText(z,pl-6,Y(z)+ch/2+4);});
  x.textAlign='center';x.fillText('Neutrons (N)',pl+(W-pl-pr)/2,H-4);x.save();x.translate(12,pt+(H-pt-pb)/2);x.rotate(-Math.PI/2);x.fillText('Protons (Z)',0,0);x.restore();}}
const Zmax0=134;
function nucAt(e){if(!NG)return null;const r=nucCv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,n=Math.floor((px-NG.pl)/NG.cw+NG.n0),z=Math.floor((NG.H-NG.pb-py)/NG.ch+NG.z0);let best=null,bd=9;(ISL||[]).forEach(p=>{const dn=p[1]-p[0]-n,dz=p[0]-z;const d=dn*dn+dz*dz;if(d<bd){bd=d;best=[p[0],p[1],null,p[2],'',p];}});PRED.forEach(p=>{const dn=p[1]-p[0]-n,dz=p[0]-z;const d=dn*dn+dz*dz;if(d<bd){bd=d;best=[p[0],p[1],null,p[2],'',p];}});ISO.forEach(q=>{const dn=q[1]-q[0]-n,dz=q[0]-z;const d=dn*dn+dz*dz;if(d<=bd){bd=d;best=q;}});return bd<=4?best:null;}
function kidHL(lh){if(lh==null)return 'never decays: it lasts forever';const t=10**lh;return t<1e-3?'is gone in a blink (less than a thousandth of a second)':t<1?'is gone in under a second':t<10?'lasts a few seconds':t<60?'lasts under a minute':t<3600?'lasts minutes':t<86400?'lasts hours':t<yr?'lasts days to months':t<1e3*yr?'lasts years':t<1e9*yr?'lasts thousands to millions of years':'lasts billions of years or more';}
function nucTipHTML(q){const Z=q[0],A=q[1],N=A-Z,nm=NAMEZ(Z)+'-'+A,p=q[5];let k,d;
 if(p&&p[5]==='isl'){k='<b>Inside the predicted island.</b> Nobody has made it yet. Our rough model guesses it '+kidHL(p[2])+'.';d='Model alpha half-life ≈ '+fmtHL(p[2])+', alpha energy ≈ '+p[3].toFixed(1)+' MeV. A rough guess: real theories range from microseconds to years here.';}
 else if(p){k='<b>Not made yet.</b> Our model guesses it '+kidHL(p[2])+'.';d='Predicted alpha half-life ≈ '+fmtHL(p[2])+' (rough model, typically within about ×6)'+(p[4]?' · a target in the hunt for new elements':'')+'.';}
 else{k=q[3]==null?'<b>Stable:</b> it never decays.':'<b>Radioactive:</b> half of it is gone after '+fmtHL(q[3])+(10**q[3]<1e-3?', faster than a blink.':'.');d=(q[2]!=null?q[2]+'% of natural '+NAMEZ(Z).toLowerCase()+'. ':'')+(USE[Z+'-'+A]?'★ '+USE[Z+'-'+A].split('. ')[0]+'.':'');}
 return '<b>'+nm+'</b> · '+Z+' protons, '+N+' neutrons<br>'+tb(p?'g':'m')+k+(d?'<br><small>'+d+'</small>':'')+(p?'':'<br><small>Half-life from NUBASE2020.</small>');}
const ISLTXT='<b>The island of stability</b><br>Scientists think nuclei with about 114–126 protons and 184 neutrons could last much longer than their neighbours, because their protons and neutrons fill complete shells, like every seat on a bus being taken.<br><small>Nobody has reached it yet: the most neutron-rich superheavy nuclei made so far are about 7 neutrons short. Dotted squares inside show this page’s rough guesses.</small>';
function nucTip(html,px,py){const t=$('#nucTip');if(!html){t.hidden=true;return;}t.innerHTML=html;t.hidden=false;const F=$('#nucFig'),W=F.clientWidth,H=F.clientHeight,tw=t.offsetWidth,th=t.offsetHeight;let lx=px+14,ly=py+14;if(lx+tw>W-6)lx=px-tw-14;if(lx<6)lx=6;if(ly+th>H-6)ly=py-th-14;if(ly<6)ly=6;t.style.left=lx+'px';t.style.top=ly+'px';}
function nucInIsland(e){if(!NG)return false;const r=nucCv.getBoundingClientRect(),n=(e.clientX-r.left-NG.pl)/NG.cw+NG.n0,z=(NG.H-NG.pb-(e.clientY-r.top))/NG.ch+NG.z0;const a=(n-184.5)/(NVW?7:10),b=(z-117.5)/(NVW?6:9);return a*a+b*b<=1;}
function nucShow(e){const q=nucAt(e),r=nucCv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;nucHover=q;
 if(q){const h=nucTipHTML(q);$('#nucInfo').innerHTML=h.replace(/<br>/g,' · ');nucTip(h,px,py);}else if(nucInIsland(e)){$('#nucInfo').innerHTML=ISLTXT.replace(/<br>/g,' ');nucTip(ISLTXT,px,py);}else{nucTip(null);$('#nucInfo').textContent=NVW?'Drag to move around, pinch or scroll to zoom, tap a square to learn about it.':'Hover over the chart to see an isotope, or tap “Zoom to the island”.';}drawNuc();}
// zoom and pan
function nucZoomAt(px,py,f){if(!NG)return;const W0=NVW||{n0:0,n1:196,z0:0,z1:134},n=(px-NG.pl)/NG.cw+NG.n0,z=(NG.H-NG.pb-py)/NG.ch+NG.z0;let w=(W0.n1-W0.n0)*f,h=(W0.z1-W0.z0)*f;
 if(w>=190){nucPreset('whole');return;}if(w<10){h*=10/w;w=10;}const fx=(n-W0.n0)/(W0.n1-W0.n0),fz=(z-W0.z0)/(W0.z1-W0.z0);NVW={n0:n-fx*w,n1:n-fx*w+w,z0:z-fz*h,z1:z-fz*h+h};nucClamp();
 $$('[data-nz]').forEach(x=>x.setAttribute('aria-pressed','false'));$('#nucZoomNote').hidden=false;nucCv.style.touchAction='none';drawNuc();}
function nucClamp(){const w=NVW.n1-NVW.n0,h=NVW.z1-NVW.z0;if(NVW.n0<-2){NVW.n0=-2;NVW.n1=w-2;}if(NVW.n1>200){NVW.n1=200;NVW.n0=200-w;}if(NVW.z0<-2){NVW.z0=-2;NVW.z1=h-2;}if(NVW.z1>136){NVW.z1=136;NVW.z0=136-h;}}
const NP=new Map();let nDrag=null,nPinch=null,nMoved=false;
nucCv.addEventListener('pointerdown',e=>{NP.set(e.pointerId,{x:e.clientX,y:e.clientY});nMoved=false;if(NP.size===1)nDrag={x:e.clientX,y:e.clientY};if(NP.size===2&&NVW){const [a,b]=[...NP.values()];nPinch=Math.hypot(a.x-b.x,a.y-b.y);}if(NVW)nucCv.setPointerCapture(e.pointerId);});
nucCv.addEventListener('pointermove',e=>{if(NP.has(e.pointerId)){const pv=NP.get(e.pointerId);NP.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(NP.size===2&&nPinch&&NVW){const [a,b]=[...NP.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=nucCv.getBoundingClientRect();nucZoomAt((a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top,nPinch/d);nPinch=d;nMoved=true;return;}
  if(NVW&&nDrag&&(nMoved||Math.hypot(e.clientX-nDrag.x,e.clientY-nDrag.y)>6)){nMoved=true;const dx=(e.clientX-pv.x)/NG.cw,dz=(e.clientY-pv.y)/NG.ch;NVW.n0-=dx;NVW.n1-=dx;NVW.z0+=dz;NVW.z1+=dz;nucClamp();nucTip(null);drawNuc();return;}}
 if(e.pointerType==='mouse')nucShow(e);});
nucCv.addEventListener('pointerup',e=>{NP.delete(e.pointerId);if(NP.size<2)nPinch=null;if(!NP.size)nDrag=null;});
nucCv.addEventListener('pointercancel',e=>{NP.delete(e.pointerId);nPinch=null;nDrag=null;});
nucCv.addEventListener('wheel',e=>{if(!NVW&&!e.ctrlKey)return;e.preventDefault();const r=nucCv.getBoundingClientRect();nucZoomAt(e.clientX-r.left,e.clientY-r.top,Math.exp(e.deltaY*0.0015));},{passive:false});
$$('[data-nz]').forEach(b=>b.addEventListener('click',()=>{nucTip(null);nucPreset(b.dataset.nz);if(b.dataset.nz==='og'){const q=ISO.find(r=>r[0]===118&&r[1]===294);if(q){selIso={z:118,a:294,pred:null};if(sel!==118)showEl(118);renderIso();$('#nucInfo').innerHTML=nucTipHTML(q).replace(/<br>/g,' · ')+' · the heaviest nucleus ever made.';}}
 if(b.dataset.nz==='fl'){$('#nucInfo').innerHTML=ISLTXT.replace(/<br>/g,' ');}}));
$$('[data-nzb]').forEach(b=>b.addEventListener('click',()=>{const F=$('#nucFig');if(b.dataset.nzb==='r'){nucPreset('whole');return;}nucZoomAt(F.clientWidth/2,F.clientHeight/2,b.dataset.nzb==='+'?0.6:1/0.6);}));
nucCv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){nucHover=null;nucTip(null);drawNuc();}});
nucCv.addEventListener('click',e=>{if(nMoved){nMoved=false;return;}nucShow(e);const q=nucAt(e);if(!q||(q[5]&&q[5][5]==='isl'))return;if(sel!==q[0])showEl(q[0]);selIso={z:q[0],a:q[1],pred:q[5]||null};if(q[5])showAllIso=true;renderIso();});
function nucLegend(){const g=[];for(let i=0;i<=10;i++)g.push(rgbs(interp(SEQ[isDark()?'dark':'light'],0.12+0.88*i/10)));const tk=[['1 µs',-6],['1 s',0],['1 day',4.94],['30 y',9],['1 Gyr+',16.5]];
 $('#nucLegend').innerHTML='<span><i style="display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px;background:var(--ink)"></i>Stable</span><span style="display:inline-flex;flex-direction:column;gap:2px">Half-life<span class="grad" style="background:linear-gradient(90deg,'+g.join(',')+')"></span><span class="tk" style="position:relative;height:16px;display:block">'+tk.map(([l,v])=>{const t=(v+6)/24;return '<span style="position:absolute;left:'+(t*100)+'%;transform:translateX('+(t<0.05?'0':t>0.9?'-100%':'-50%')+');white-space:nowrap">'+l+'</span>';}).join('')+'</span></span><span>Magic numbers: thin lines · N = Z: dashed</span>';}
nucLegend();
new ResizeObserver(drawNuc).observe($('#nucFig'));
new MutationObserver(()=>{drawNuc();nucLegend();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
DATA.nst=SYM.map((_,i)=>(ISOZ[i+1]||[]).filter(r=>r[2]!=null&&r[3]==null).length);
PI.nst={nm:'Number of stable isotopes',u:'',d:0,what:'Most elements have one to a few stable isotopes. Tin has the most, 10. Technetium, promethium and every element past lead have none.',why:'Nuclei with even numbers of protons and neutrons pair up and hold together best, so even-numbered elements tend to have more stable isotopes. Magic numbers help too: tin has a magic 50 protons. Past lead, the electric repulsion between so many protons wins, and nothing is permanently stable.',src:'mendeleev isotope data'};

