const cv=$('#cv'),fig=$('#fig');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:!MOB,alpha:true,powerPreference:MOB?'default':'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,MOB?1.5:2));
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(38,1,0.1,3000);
scene.add(new THREE.AmbientLight(0xffffff,0.55));
const d1=new THREE.DirectionalLight(0xffffff,0.75);d1.position.set(5,9,7);scene.add(d1);
const d2=new THREE.DirectionalLight(0xffffff,0.3);d2.position.set(-6,-5,-4);scene.add(d2);
const cPos=new THREE.Color('#12958b'),cNeg=new THREE.Color('#de5f37');
const RS=3.6,R2=4*Math.SQRT2,FIT=R2;
const Lg={rays:new THREE.Group(),square:new THREE.Group(),circles:new THREE.Group(),rosette:new THREE.Group(),planes:new THREE.Group(),shells:new THREE.Group()};
Lg.nucleus=new THREE.Group();Object.values(Lg).forEach(g=>scene.add(g));Lg.rosette.visible=false;Lg.planes.visible=false;Lg.shells.visible=false;
const col=id=>new THREE.Color(getComputedStyle($(id)).color);
let ink,mut,acc;
function disposeObj(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material){(Array.isArray(c.material)?c.material:[c.material]).forEach(mm=>{if(mm.map)mm.map.dispose();mm.dispose();});}if(c.isInstancedMesh&&c.dispose)c.dispose();});}
function clear(g){while(g.children.length){const c=g.children.pop();disposeObj(c);}}
function lineOf(pts,mat,closed){const g=new THREE.BufferGeometry().setFromPoints(pts);const o=closed?new THREE.LineLoop(g,mat):new THREE.Line(g,mat);if(mat.isLineDashedMaterial)o.computeLineDistances();return o;}
function ring(r,cx,cz,mat,pl){const p=[];for(let i=0;i<128;i++){const a=i/128*Math.PI*2,u=cx+r*Math.cos(a),v=cz+r*Math.sin(a);p.push(pl==='xy'?new THREE.Vector3(u,v,0):pl==='yz'?new THREE.Vector3(0,v,u):new THREE.Vector3(u,0,v));}return lineOf(p,mat,true);}
function label(txt,size,c){const cn=document.createElement('canvas'),fs=64,x=cn.getContext('2d'),f='500 '+fs+'px "Instrument Sans",sans-serif';x.font=f;cn.width=Math.ceil(x.measureText(txt).width)+20;cn.height=fs+20;x.font=f;x.fillStyle='#'+c.getHexString();x.textBaseline='middle';x.fillText(txt,10,cn.height/2);const t=new THREE.CanvasTexture(cn);t.minFilter=THREE.LinearFilter;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(cn.width/cn.height*size,size,1);return s;}

function buildFrame(){
 ink=col('#probeInk');mut=col('#probeMut');acc=col('#probeAcc');
 ['rays','square','circles','rosette','planes'].forEach(k=>clear(Lg[k]));
 const solid=new THREE.LineBasicMaterial({color:ink,transparent:true,opacity:0.55});
 const faint=new THREE.LineBasicMaterial({color:mut,transparent:true,opacity:0.35});
 const dash=new THREE.LineDashedMaterial({color:mut,dashSize:0.22,gapSize:0.16,transparent:true,opacity:0.6});
 for(let k=0;k<32;k++){const a=k*Math.PI/16;Lg.rays.add(lineOf([new THREE.Vector3(),new THREE.Vector3(Math.cos(a)*6.1,0,-Math.sin(a)*6.1)],k%8===0?solid:dash,false));}
 Lg.square.add(lineOf([[4,4],[4,-4],[-4,-4],[-4,4]].map(([a,b])=>new THREE.Vector3(a,0,b)),dash,true));
 [['N₁',4,0],['N₂',0,-4],['N₃',-4,0],['N₄',0,4]].forEach(([t,a,b])=>{const s=label(t,0.5,ink);s.position.set(a*1.09,0.28,b*1.09);Lg.square.add(s);});
 Lg.circles.add(ring(4,0,0,solid));Lg.circles.add(ring(R2,0,0,solid));
 const s4=label('r = 4',0.42,mut);s4.position.set(2.5,0.25,3.45);Lg.circles.add(s4);
 const s5=label('r = 5.7',0.42,mut);s5.position.set(3.5,0.25,4.75);Lg.circles.add(s5);
 for(let k=0;k<8;k++){const a=k*Math.PI/4;Lg.rosette.add(ring(2,2*Math.cos(a),-2*Math.sin(a),faint));}
 ['xy','yz'].forEach(p=>{Lg.planes.add(ring(4,0,0,faint,p));Lg.planes.add(ring(R2,0,0,faint,p));});
 buildShells();drawRadial();
}
function shellCounts(z=sel){const c={};if(z)config(z).list.forEach(s=>{c[s.n]=(c[s.n]||0)+s.e;});return c;}
let shellK=4,shellAuto=true,sp='real';
const NSTAR=[0,1,2,3,3.7,4.0,4.2,4.4,4.5,4.6,4.7];
function slaterR(Z){const gs={};config(Z).list.forEach(s=>{const t=s.l<=1?'sp':LET[s.l],k=s.n+t;if(!gs[k])gs[k]={n:s.n,t,e:0,o:s.n*10+(t==='sp'?0:t==='d'?1:2)};gs[k].e+=s.e;});
 const G=Object.values(gs),R={};
 G.forEach(g=>{let S=0;G.forEach(h=>{if(h===g){S+=(g.e-1)*(g.n===1?0.30:0.35);return;}if(h.o>g.o)return;
  if(g.t==='sp'){S+=h.e*(h.n===g.n-1?0.85:h.n<=g.n-2?1:0.35);}else S+=h.e;});
  const r=NSTAR[g.n]*NSTAR[g.n]/(Z-S);g.z=Z-S;R[g.n]=Math.max(R[g.n]||0,r);});
 return R;}
let C_OUT=0,C_UNIT=0;
function shellRadii(el,K){if(!C_OUT){C_OUT=slaterR(6)[2];C_UNIT=4/C_OUT;}const out=[];const R=el?slaterR(el):{};for(let k=1;k<=K;k++){
 if(sp==='lin')out.push(k*4/K);else if(sp==='sq')out.push(k*k*4/(K*K));else out.push((R[k]||NSTAR[Math.min(k,10)]**2)*C_UNIT);}return out;}
function neededShells(){const c=shellCounts();return Math.max(1,...Object.keys(c).map(Number));}
function buildShells(){clear(Lg.shells);setTimeout(simLabel,0);
 const el=sel||(sp==='real'?6:0);
 if(shellAuto)shellK=el?Math.max(1,...Object.keys(shellCounts(el)).map(Number)):4;
 const cnt=shellCounts(el),K=shellK,rad=shellRadii(el,K),Rmax=Math.max(...rad),ls=0.34*Math.max(1,Rmax/6),full=new THREE.LineBasicMaterial({color:acc,transparent:true,opacity:0.75}),part=new THREE.LineBasicMaterial({color:cNeg,transparent:true,opacity:0.85}),none=new THREE.LineBasicMaterial({color:mut,transparent:true,opacity:0.25});
 for(let k=1;k<=K;k++){const r=rad[k-1],e=cnt[k]||0,cap=2*k*k,st=!el?'full':e===0?'none':e>=cap?'full':'part';
  Lg.shells.add(new THREE.Mesh(new THREE.SphereGeometry(r,48,32),new THREE.MeshBasicMaterial({color:st==='part'?cNeg:acc,transparent:true,opacity:st==='none'?0.015:0.05,depthWrite:false})));
  const mat=st==='full'?full:st==='part'?part:none;['xz','xy','yz'].forEach(p=>Lg.shells.add(ring(r,0,0,mat,p)));
  if(r>=Rmax*0.14||sp!=='real'){const s=label('n='+k+' · '+(el?e+'/':'')+cap,ls,ink),a=0.5+k*0.42;s.position.set(Math.cos(a)*r*0.72+0.3*ls/0.34,r*0.62+0.12,Math.sin(a)*r*0.72);Lg.shells.add(s);}}
 if(sp==='real'&&el!==6){const cr=label('carbon outer shell = 4',0.36*Math.max(1,Rmax/10),mut);cr.position.set(-4.2,0.35,0.6);Lg.shells.add(cr);}
 if(mode==='shell'&&sp==='real')dist=clamp(Math.max(19,Rmax*3.4),7,400);
 const subs=k=>el?config(el).list.filter(x=>x.n===k).map(x=>x.k+'<sup>'+x.e+'</sup>').join(' '):Array.from({length:Math.min(k,6)},(_,j)=>k+LET[j]).join(' ')+(k>6?' …':'');
 $('#shellList').innerHTML=Array.from({length:K},(_,i)=>i+1).map(k=>{const e=cnt[k]||0,cap=2*k*k,st=e===0?'none':e>=cap?'full':'part',rr=rad[k-1]/C_UNIT;
  return '<li><span>n = '+k+'<span class="sub2">'+(subs(k)||'empty')+(sp==='real'?' · '+fmt(rr/C_OUT,2)+' × carbon, '+fmt(rr*0.529,2)+' Å':'')+'</span></span><span style="white-space:nowrap">'+(el?e+' of '+cap+'<span class="st '+st+'">'+(st==='full'?'full':st==='part'?'partial':'empty')+'</span>':'holds '+cap)+'</span></li>';}).join('');
 $('#vK').textContent=K;
 $('#kInfo').textContent=el?SYM[el-1]+' needs '+Math.max(1,...Object.keys(cnt).map(Number))+' shell'+(Object.keys(cnt).length>1?'s':''):'Pick an element to fit';
 $('#shellNote').textContent=(sp==='real'?'Real size, normalised so carbon’s outer shell sits on r = 4. Radii are estimated with Slater’s rules (n*² ÷ effective nuclear charge), which get the trends right but are approximate. '+(sel?'':'Showing carbon until you pick an element. '):'')+'Teal shells are full, coral ones are partly filled, and dashed ones are empty.';}

