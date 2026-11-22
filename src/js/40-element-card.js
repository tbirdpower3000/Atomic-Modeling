function showEl(Z){sel=Z;const c=config(Z),core=CORES.find(([z])=>z<Z),cnt=shellCounts();
 $$('.el').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.z===Z)));summary(Z);
 $('#elc').innerHTML='<div class="sym">'+SYM[Z-1]+'</div><div class="sub">'+NAMES[Z-1]+' · atomic number '+Z+' · '+c.block+' block</div>'+
 '<p class="cfg">'+(core?'['+core[1]+'] ':'')+shorthand(Z).map(sup).join(' ')+'</p>'+
 '<h2>Load a subshell</h2><div class="chips" id="subChips">'+c.list.map(s=>'<button data-sub="'+s.n+','+s.l+'" aria-pressed="'+(s.k===c.top)+'">'+s.k+'<span>'+s.e+'/'+(2*(2*s.l+1))+'</span></button>').join('')+'</div>'+
 '<p class="note">Electrons per shell: '+Object.keys(cnt).sort((a,b)=>a-b).map(k=>cnt[k]).join(' · ')+'</p>'+'<h2 style="margin-top:14px">Isotopes</h2><div id="isoSec"></div>'+'<h2 style="margin-top:14px">Properties</h2><div class="props" id="propBox"></div>'+
 (Z>=104?'<h2 style="margin-top:14px">Research</h2>'+(RES[Z]?'<div class="read" style="padding:12px 14px"><dl><dt>Discovered</dt><dd>'+RES[Z][0]+'</dd><dt>Named</dt><dd>'+RES[Z][1]+'</dd><dt>Made by</dt><dd>'+RES[Z][2]+'</dd></dl></div><p class="note">Only a handful of atoms of the heaviest of these have ever existed, and most last a second or less.</p>':'<p class="note" style="color:var(--ink)">'+HUNT[Z]+'</p>'):'')+
 (Z>103?'<p class="note">Configurations past lawrencium are predictions, not measurements.</p>':'')+
 '<p class="note">The 3D shapes are hydrogen’s. In '+NAMES[Z-1].toLowerCase()+' the same shapes are pulled tighter by the larger nuclear charge.</p>';
 showProps(Z);showAllIso=false;isoInit(Z);if(cby!=='block')drawTrend();const t=c.list.find(s=>s.k===c.top);n=t.n;l=t.l;m=0;endQuiz();rebuild();buildShells();}
$('#ptg').addEventListener('click',e=>{const b=e.target.closest('[data-z]');if(b)showEl(+b.dataset.z);});
$('#elc').addEventListener('click',e=>{const b=e.target.closest('[data-sub]');if(!b)return;const [a,q]=b.dataset.sub.split(',').map(Number);
 $$('#subChips button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));loadSub(a,q);fig.scrollIntoView({behavior:'smooth',block:'center'});});

const GLSL_WF=`
uniform float uN,uL,uM,uPot;
float powz(float x,float e){return e<0.5?1.0:pow(max(x,1e-6),e);}
float lagu(float k,float a,float x){if(k<0.5)return 1.0;float L0=1.0,L1=1.0+a-x;for(int j=1;j<14;j++){float fj=float(j);if(fj>=k-0.01)break;float L2=((2.0*fj+1.0+a-x)*L1-(fj+a)*L0)/(fj+1.0);L0=L1;L1=L2;}return L1;}
float legP(float l,float m,float x){float pmm=1.0;float s=sqrt(max(0.0,1.0-x*x));float f=1.0;for(int i=1;i<10;i++){if(float(i)>m+0.01)break;pmm*=-f*s;f+=2.0;}if(abs(l-m)<0.5)return pmm;float p1=x*(2.0*m+1.0)*pmm;if(abs(l-m-1.0)<0.5)return p1;float pl=0.0;for(int k=2;k<12;k++){float fk=m+float(k);if(fk>l+0.01)break;pl=(x*(2.0*fk-1.0)*p1-(fk+m-1.0)*pmm)/(fk-m);pmm=p1;p1=pl;}return pl;}
float Yr(vec3 d){float am=abs(uM);float P=legP(uL,am,clamp(d.z,-1.0,1.0));if(am<0.5)return P;float ph=atan(d.y,d.x);return P*(uM>0.0?cos(am*ph):sin(am*ph));}
float Rr(float r){if(uPot>0.5)return powz(r,uL)*exp(-r*r*0.5)*lagu(uN-1.0,uL+0.5,r*r);float rho=2.0*r/uN;return powz(rho,uL)*exp(-rho*0.5)*lagu(uN-uL-1.0,2.0*uL+1.0,rho);}
`;
const WF={uN:{value:3},uL:{value:2},uM:{value:2},uPot:{value:0}};
const cPosV=new THREE.Vector3(cPos.r,cPos.g,cPos.b),cNegV=new THREE.Vector3(cNeg.r,cNeg.g,cNeg.b);
function syncWF(){WF.uN.value=n;WF.uL.value=l;WF.uM.value=m;WF.uPot.value=pot==='nuc'?1:0;}
let mesh=null,cloud=null,volMesh=null,ymax=1;
const shapeU=Object.assign({uYmax:{value:1},uRS:{value:RS},uPosC:{value:cPosV},uNegC:{value:cNegV}},WF);
function computeYmax(){let mx=0;for(let i=0;i<6000;i++){const z=1-2*(i+0.5)/6000,rr=Math.sqrt(1-z*z),ph=i*2.399963;mx=Math.max(mx,Math.abs(Y(rr*Math.cos(ph),rr*Math.sin(ph),z)));}ymax=mx||1;}
function buildShape(){syncWF();computeYmax();shapeU.uYmax.value=ymax;
 if(!mesh){mesh=new THREE.Mesh(new THREE.SphereGeometry(1,200,150),new THREE.ShaderMaterial({uniforms:shapeU,side:THREE.DoubleSide,
  vertexShader:GLSL_WF+`uniform float uYmax,uRS;varying float vS;varying vec3 vN;varying vec3 vV;
   vec3 disp(vec3 d){vec3 pd=vec3(d.x,-d.z,d.y);float y=Yr(pd);return d*abs(y)/uYmax*uRS;}
   void main(){vec3 d=normalize(position);vec3 pd=vec3(d.x,-d.z,d.y);vS=Yr(pd);vec3 p=disp(d);
    vec3 t1=normalize(cross(d,abs(d.y)<0.99?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0)));vec3 t2=cross(d,t1);float e=0.004;
    vec3 a=disp(normalize(d+e*t1)),b=disp(normalize(d+e*t2));vec3 nn=cross(a-p,b-p);if(length(nn)<1e-9)nn=d;nn=normalize(nn);if(dot(nn,p)<0.0)nn=-nn;
    vN=normalize(normalMatrix*nn);vec4 mv=modelViewMatrix*vec4(p,1.0);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 uPosC,uNegC;varying float vS;varying vec3 vN;varying vec3 vV;
   void main(){vec3 nrm=normalize(vN);if(!gl_FrontFacing)nrm=-nrm;vec3 c=vS>=0.0?uPosC:uNegC;vec3 v=normalize(vV);
    vec3 L1=normalize(vec3(0.4,0.7,0.6)),L2=normalize(vec3(-0.5,-0.4,-0.3));float d1=max(dot(nrm,L1),0.0),d2=max(dot(nrm,L2),0.0);
    float sp=pow(max(dot(reflect(-L1,nrm),v),0.0),35.0);gl_FragColor=vec4(c*(0.5+0.6*d1+0.25*d2)+vec3(0.18)*sp,1.0);}`}));
  mesh.frustumCulled=false;scene.add(mesh);}
 mesh.visible=mode==='shape';}
const MAXSEED=320000;let seedGeo=null,acceptFrac=0.3;
const cloudU=Object.assign({uInv:{value:new Float32Array(256)},uScale:{value:1},uYm2:{value:1},uSize:{value:0.055},uPx:{value:400},uPosC:{value:cPosV},uNegC:{value:cNegV}},WF);
function buildCloud(){syncWF();
 if(!seedGeo){seedGeo=new THREE.BufferGeometry();const sd=new Float32Array(MAXSEED*4);for(let i=0;i<sd.length;i++)sd[i]=Math.random();seedGeo.setAttribute('seed',new THREE.BufferAttribute(sd,4));seedGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(MAXSEED*3),3));
  cloud=new THREE.Points(seedGeo,new THREE.ShaderMaterial({uniforms:cloudU,transparent:true,depthWrite:false,
   vertexShader:GLSL_WF+`attribute vec4 seed;uniform float uInv[256];uniform float uScale,uYm2,uSize,uPx;varying float vS;varying float vK;
    void main(){float z=2.0*seed.x-1.0,ph=6.2831853*seed.y,s=sqrt(max(0.0,1.0-z*z));vec3 pd=vec3(s*cos(ph),s*sin(ph),z);
     float f=seed.z*254.999;int i=int(floor(f));float fr=fract(f);float r=mix(uInv[i],uInv[i+1],fr);
     float y=Yr(pd);vK=step(seed.w,y*y/uYm2);vS=Rr(r)*y;vec3 p=vec3(pd.x,pd.z,-pd.y)*r*uScale;
     vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=vK*uSize*uPx/max(-mv.z,0.1);}`,
   fragmentShader:`uniform vec3 uPosC,uNegC;varying float vS;varying float vK;void main(){if(vK<0.5)discard;vec2 q=gl_PointCoord-0.5;if(dot(q,q)>0.25)discard;gl_FragColor=vec4(vS>=0.0?uPosC:uNegC,0.8);}`}));
  cloud.frustumCulled=false;scene.add(cloud);}
 const C=tab.C,N=C.length,inv=cloudU.uInv.value;let j=0;for(let q=0;q<256;q++){const u=q/255;while(j<N-1&&C[j]<u)j++;inv[q]=tab.r[j];}
 let acc=0;for(let i=0;i<3000;i++){const z=1-2*Math.random(),rr=Math.sqrt(1-z*z),ph=6.2831853*Math.random(),y=Y(rr*Math.cos(ph),rr*Math.sin(ph),z);acc+=y*y/(ymax*ymax);}acceptFrac=Math.max(0.02,acc/3000);
 cloudU.uScale.value=FIT/tab.r99;cloudU.uYm2.value=ymax*ymax;seedGeo.setDrawRange(0,Math.min(MAXSEED,Math.round(nPts/acceptFrac)));cloud.visible=mode==='cloud';buildVol();}
const volU=Object.assign({uRad:{value:FIT*1.05},uScale:{value:1},uDmax:{value:1},uGain:{value:3},uPosC:{value:cPosV},uNegC:{value:cNegV}},WF);
function buildVol(){syncWF();
 if(!volMesh){volMesh=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.ShaderMaterial({uniforms:volU,transparent:true,depthWrite:false,side:THREE.BackSide,premultipliedAlpha:true,
  vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:GLSL_WF+`uniform float uRad,uScale,uDmax,uGain;uniform vec3 uPosC,uNegC;varying vec3 vW;
   void main(){vec3 ro=cameraPosition,rd=normalize(vW-ro);float b=dot(ro,rd),c=dot(ro,ro)-uRad*uRad,h=b*b-c;if(h<0.0)discard;h=sqrt(h);float t0=max(0.0,-b-h),t1=-b+h;
    float dt=(t1-t0)/${MOB?48:96}.0;vec3 col=vec3(0.0);float a=0.0;float ign=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))));float t=t0+ign*dt;
    for(int i=0;i<${MOB?48:96};i++){vec3 p=ro+rd*t;vec3 pd=vec3(p.x,-p.z,p.y)/uScale;float r=length(pd);float y=Yr(pd/max(r,1e-5));float ps=Rr(r)*y;float d=ps*ps/uDmax;
     float al=1.0-exp(-d*uGain*dt*2.0);col+=(1.0-a)*al*(ps>=0.0?uPosC:uNegC);a+=(1.0-a)*al;if(a>0.97)break;t+=dt;}
    gl_FragColor=vec4(col,a);}`}));
  volMesh.frustumCulled=false;scene.add(volMesh);}
 volMesh.scale.setScalar(FIT*1.05);volU.uRad.value=FIT*1.05;volU.uScale.value=FIT/tab.r99;let rm=0;for(let i=0;i<tab.R.length;i++)rm=Math.max(rm,tab.R[i]*tab.R[i]);volU.uDmax.value=(rm*ymax*ymax)||1;volMesh.visible=mode==='vol';}
const fmt=(x,d=1)=>Number(x).toFixed(d);
function orbName(N,Lq,Mq){if(pot==='nuc')return N+LETN(Lq)+(2*Lq+jsg)+'/2'+(Lq?' (m = '+Mq+')':'');return N+LET[Lq]+(Lq?' (m = '+Mq+')':'');}
const LETN=q=>'spdfghij'[q];
function drawRadial(){
 const s=$('#radSvg');if(!tab||!s)return;const W=s.clientWidth||300,H=s.clientHeight||150,pl=8,pr=8,pt=8,pb=26;
 const xmax=tab.r99*1.15,X=r=>pl+r/xmax*(W-pl-pr),Yp=p=>H-pb-p/tab.pmax*(H-pb-pt);
 let d='';const st=Math.max(1,Math.floor(tab.r.length/400));for(let i=0;i<tab.r.length;i+=st){if(tab.r[i]>xmax)break;d+=(d?'L':'M')+X(tab.r[i]).toFixed(1)+','+Yp(tab.P[i]).toFixed(1);}
 const sc=FIT/tab.r99,r4=4/sc,step=xmax>60?20:xmax>25?10:xmax>10?5:xmax>4?2:1;let ticks='';
 for(let t=0;t<=xmax;t+=step){ticks+='<line x1="'+X(t)+'" x2="'+X(t)+'" y1="'+(H-pb)+'" y2="'+(H-pb+4)+'" stroke="var(--mut)"/>'+(W>420||t%(step*2)===0?'<text x="'+X(t)+'" y="'+(H-8)+'" font-size="12" text-anchor="middle" fill="var(--mut)">'+t+'</text>':'');}
 const nodes=tab.nodes.filter(r=>r<xmax).map(r=>'<line x1="'+X(r)+'" x2="'+X(r)+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="var(--neg)" stroke-dasharray="4 4"/>').join('');
 const r4x=X(r4),lab=W>380?'your r = 4 ≈ '+fmt(r4)+(pot==='nuc'?' b':' a₀'):'r = 4';
 let extra='';if(pot==='nuc'){const o=nucOrb(),fp=shellFill(o.Z),fn=shellFill(o.N),M=200,rs=[],tot=new Float64Array(M),ws=new Float64Array(M);const sv=[n,l];for(let i=0;i<M;i++)rs.push(i/(M-1)*xmax);
  LVL.forEach((lv,i)=>{const occ=fp[i]+fn[i];if(!occ)return;n=+lv[0][0];l=LET.indexOf(lv[0][1])>=0?LET.indexOf(lv[0][1]):'spdfghij'.indexOf(lv[0][1]);let nn=0;const v=rs.map(r=>{const R=Rnl(r);return r*r*R*R;});v.forEach(x=>nn+=x);v.forEach((x,k)=>tot[k]+=occ*x/(nn||1));});n=sv[0];l=sv[1];
  const c=(1.12*Math.cbrt(o.A)-0.86/Math.cbrt(o.A))/o.b,a=0.54/o.b;rs.forEach((r,k)=>{ws[k]=r*r/(1+Math.exp((r-c)/a));});
  const nrm=arr=>{let sm=0;arr.forEach(x=>sm+=x);return arr.map(x=>x/(sm||1));};const T=nrm(Array.from(tot)),Wd=nrm(Array.from(ws));let sm=0;const Pn=[];for(let i=0;i<tab.r.length;i++){if(tab.r[i]>xmax)break;}
  const pk=Math.max(...T,...Wd),path=arr=>arr.map((v,k)=>(k?'L':'M')+X(rs[k]).toFixed(1)+','+(H-pb-v/pk*(H-pb-pt)*0.95).toFixed(1)).join('');
  extra='<path d="'+path(T)+'" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="5 3"/><path d="'+path(Wd)+'" fill="none" stroke="var(--neg)" stroke-width="1.5" stroke-dasharray="2 3"/><text x="'+(W-pr)+'" y="'+(pt+26)+'" font-size="12" text-anchor="end" fill="var(--ink)">- - all filled orbitals</text><text x="'+(W-pr)+'" y="'+(pt+40)+'" font-size="12" text-anchor="end" fill="var(--neg)">··· measured density shape</text>';}
 s.innerHTML='<path d="'+d+'L'+X(Math.min(xmax,tab.r[tab.r.length-1]))+','+(H-pb)+'L'+pl+','+(H-pb)+'Z" fill="var(--pos)" fill-opacity="0.15"/><path d="'+d+'" fill="none" stroke="var(--pos)" stroke-width="2"/>'+nodes+'<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+(H-pb)+'" y2="'+(H-pb)+'" stroke="var(--mut)"/>'+ticks+'<line x1="'+r4x+'" x2="'+r4x+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="var(--ink)" stroke-opacity="0.5"/><text x="'+(r4x>W*0.6?r4x-6:r4x+6)+'" y="'+(pt+12)+'" font-size="12" fill="var(--ink)" text-anchor="'+(r4x>W*0.6?'end':'start')+'">'+lab+'</text>'+extra;}

const PART={e:{nm:'electron',m:0.51099895,life:'stable',note:'Ordinary atoms. The electron sets the size of every atom and does all of chemistry.'},
 mu:{nm:'muon',m:105.6583755,life:'2.2 µs',note:'A real exotic atom. Muons from accelerators are captured by atoms and cascade down to the innermost orbit in about a nanosecond, long before they decay. Muonic hydrogen experiments (2010 onward) measured the proton’s radius as about 0.84 fm, smaller than earlier values. That “proton radius puzzle” led to new, more precise measurements that now agree on the smaller value.'},
 tau:{nm:'tau',m:1776.93,life:'0.29 ps',note:'Hypothetical. The tau decays in about 0.3 picoseconds, too fast to be captured and settle into an orbit, so no tauonic atom has been made.'},
 pbar:{nm:'antiproton',m:938.27209,life:'stable, until it meets matter',note:'Real exotic atoms: protonium and antiprotonic helium have been made at CERN. In tight orbits the antiproton soon annihilates with the nucleus.'}};
let part='e';
function fmtLen(fm){return fm<1000?fm.toPrecision(3)+' fm':fm<1e6?(fm/1000).toPrecision(3)+' pm':(fm/1e5).toPrecision(3)+' Å';}
function fmtE(eV){return fE(eV);}
function exotic(){const Zc=sel&&sel<=118?sel:1;let A=1;if(Zc>1){if(selIso&&selIso.z===Zc)A=selIso.a;else{const ab=(ISOZ[Zc]||[]).filter(r=>r[2]!=null).sort((a,b)=>b[2]-a[2]);A=ab.length?ab[0][1]:Math.round(2.5*Zc);}}
 const M=Zc===1&&A===1?938.27209:A*931.494,mp=PART[part].m,mu=mp*M/(mp+M),me=0.51099895,rf=tab.peak*52917.721*(me/mu)/Zc,E=13.6057*(mu/me)*Zc*Zc/(n*n),Rn=Zc===1&&A===1?0.84:1.2*Math.cbrt(A);
 return {Zc,A,mu,rf,E,Rn,inside:rf<3*Rn};}
$$('[data-part]').forEach(b=>b.addEventListener('click',()=>{part=b.dataset.part;$$('[data-part]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));readout();simLabel();}));
