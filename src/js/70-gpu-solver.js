const GS={G:64,run:false,task:'eig',states:[],view:-1,it:0,lastE:null,ok:null,hist:[]};
function gpuOK(){if(GS.ok!==null)return GS.ok;GS.ok=!!(renderer.capabilities.isWebGL2&&renderer.extensions.get('EXT_color_buffer_float'));return GS.ok;}
const GPOT={h:{nm:'hydrogen-like atom',A:['Nuclear charge Z',1,6,1,1],B:['Box half-width (bohr × 1/Z)',5,24,0.5,10],D:0.5,unit:27.211386,tu:24.189e-18,L:(a,b)=>b/a},
 h2:{nm:'H₂⁺',A:['Proton separation (bohr)',0.5,6,0.1,2],B:['Box half-width (bohr)',6,20,0.5,11],D:0.5,unit:27.211386,tu:24.189e-18,L:(a,b)=>b},
 ws:{nm:'deformed nucleus',A:['Mass number A',16,240,1,100],B:['Deformation β',-0.3,0.5,0.01,0],D:20.736,unit:1e6,tu:6.582e-22,L:a=>1.25*Math.cbrt(a)+7},
 ho:{nm:'harmonic oscillator',A:['ω (frequency)',0.5,2,0.05,1],B:null,D:0.5,unit:27.211386,tu:24.189e-18,L:a=>6/Math.sqrt(a)},
 scf:{nm:'many-electron atom',A:['Element (Z)',2,10,1,6],B:['Box half-width (bohr)',3,12,0.5,8],D:0.5,unit:27.211386,tu:24.189e-18,L:(a,b)=>b}};
let gPotK='h';
function gSetPot(k){gPotK=k;const P=GPOT[k];[['#gA','#gAo','#gParA',P.A],['#gB','#gBo','#gParB',P.B]].forEach(([i,o,row,d])=>{if(!d){$(row).hidden=true;return;}$(row).hidden=false;$(row).querySelector('label').textContent=d[0];const el=$(i);el.min=d[1];el.max=d[2];el.step=d[3];el.value=d[4];$(o).textContent=gParLabel(i,d[4]);});
 $('#gKRow').hidden=k==='scf';$('#gLatRow').hidden=k!=='scf';if(k==='scf'&&GS.G===64){/* finer grid helps atoms */}gStop();GS.states=[];GS.tdse=null;gRender();}
function gParLabel(id,v){return id==='#gA'&&gPotK==='scf'?v+' ('+SYM[v-1]+')':v;}
$('#gPot').addEventListener('change',e=>gSetPot(e.target.value));
[['#gA','#gAo'],['#gB','#gBo']].forEach(([i,o])=>$(i).addEventListener('input',e=>{$(o).textContent=gParLabel(i,e.target.value);gStop();if(GS.states.length)GS.warm={G:GS.G,pot:gPotK,states:GS.states.map(s2=>s2.psi)};GS.states=[];GS.tdse=null;gRender();}));
(()=>{const b=document.getElementById('gg256');try{const gl=renderer.getContext();if(MOB||gl.getParameter(gl.MAX_TEXTURE_SIZE)<4096)b.hidden=true;}catch(e){}})();
function gSetGrid(G){const dm=navigator.deviceMemory||8;if(G===256&&dm<8){G=128;$('#gStat').textContent='256³ needs about 8 GB of RAM; using 128³ on this device.';}GS.G=G;gStop();GS.states=[];GS.tdse=null;gDispose();}
$$('[data-gg]').forEach(b=>b.addEventListener('click',()=>{GS.chain=null;GS.up=null;gSetGrid(+b.dataset.gg);$$('[data-gg]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));gRender();}));
const gScene=new THREE.Scene(),gCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);let gRT=null,gMat=null,gTd=null,gCopy=null,gQuad=null,gTex=null,gBuf=null,GI=null;
function gDims(){const G=GS.G,T=G===64?8:16;return {G,T,Wx:T*G,Wy:(G/T)*G,N:G*G*G};}
function gDispose(){gRedFree();GS.await=null;if(gVrt){gVrt.dispose();gVrt=null;}if(gMat)gMat.uniforms.uUseV.value=0;if(gRT){gRT.forEach(r=>r.dispose());gRT=null;}if(gTex){gTex.dispose();gTex=null;}GI=null;if(gTex3){gTex3.dispose();gTex3=null;if(gVolMesh){scene.remove(gVolMesh);disposeObj(gVolMesh);gVolMesh=null;}}}
const GL_ATLAS=`uniform sampler2D uPsi;uniform float uG,uT,uWx,uWy;
vec2 atv(float i,float j,float k){if(i<0.0||j<0.0||k<0.0||i>uG-1.0||j>uG-1.0||k>uG-1.0)return vec2(0.0);float tx=mod(k,uT),ty=floor(k/uT);return texture2D(uPsi,vec2((tx*uG+i+0.5)/uWx,(ty*uG+j+0.5)/uWy)).rg;}
float at(float i,float j,float k){return atv(i,j,k).r;}`;
const GL_POT=`uniform float uH,uPt,uA,uB;uniform vec4 uVr[64];uniform float uRmax;
float tabV(float r){float f=clamp(r/uRmax,0.0,1.0)*254.999;int i=int(floor(f));float fr=f-float(i);int j=i+1;vec4 a=uVr[i/4],b=uVr[j/4];int ci=i-4*(i/4),cj=j-4*(j/4);float va=ci==0?a.x:ci==1?a.y:ci==2?a.z:a.w;float vb=cj==0?b.x:cj==1?b.y:cj==2?b.z:b.w;return mix(va,vb,fr);}
float pot(vec3 p){float r=length(p);if(uPt<0.5)return -uA/sqrt(r*r+0.04*uH*uH);
 if(uPt<1.5){vec3 d=vec3(0.0,0.0,0.5*uA);return -1.0/sqrt(dot(p-d,p-d)+0.04*uH*uH)-1.0/sqrt(dot(p+d,p+d)+0.04*uH*uH);}
 if(uPt<2.5){float R0=1.25*pow(uA,1.0/3.0);float ct=r>1e-6?p.z/r:1.0;float R=R0*(1.0+uB*0.6307831*(1.5*ct*ct-0.5));return -50.0/(1.0+exp((r-R)/0.65));}
 if(uPt<3.5)return 0.5*uA*uA*r*r;
 return -uA/sqrt(r*r+0.04*uH*uH)+tabV(r);}`;
const GL_LAP=`float lapc(float i,float j,float k,int ch){vec2 c=atv(i,j,k);
 vec2 s1=atv(i+1.0,j,k)+atv(i-1.0,j,k)+atv(i,j+1.0,k)+atv(i,j-1.0,k)+atv(i,j,k+1.0)+atv(i,j,k-1.0);vec2 s2=atv(i+2.0,j,k)+atv(i-2.0,j,k)+atv(i,j+2.0,k)+atv(i,j-2.0,k)+atv(i,j,k+2.0)+atv(i,j,k-2.0);
 vec2 l=(16.0*s1-s2-90.0*c)/(12.0*uH*uH);return ch==0?l.x:l.y;}
void vox(out float i,out float j,out float k){vec2 px=floor(gl_FragCoord.xy);float tx=floor(px.x/uG),ty=floor(px.y/uG);i=px.x-tx*uG;j=px.y-ty*uG;k=ty*uT+tx;}
vec3 posOf(float i,float j,float k){return (vec3(i,j,k)+0.5-0.5*uG)*uH;}`;
const gUni=()=>({uPsi:{value:null},uG:{value:64},uT:{value:8},uWx:{value:512},uWy:{value:512},uH:{value:1},uDt:{value:0.1},uD:{value:0.5},uPt:{value:0},uA:{value:1},uB:{value:0},uVr:{value:Array.from({length:64},()=>new THREE.Vector4())},uRmax:{value:10},uPass:{value:0},uAbs:{value:0},uMu:{value:0.8},uEs:{value:0},uVtex:{value:null},uUseV:{value:0}});
function gInit(){const d=gDims();if(gRT)return;const o={type:THREE.FloatType,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,stencilBuffer:false};gRT=[new THREE.WebGLRenderTarget(d.Wx,d.Wy,o),new THREE.WebGLRenderTarget(d.Wx,d.Wy,o)];
 if(!gMat){gMat=new THREE.ShaderMaterial({uniforms:gUni(),vertexShader:'void main(){gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:GL_ATLAS+GL_POT+GL_LAP+`uniform float uDt,uD,uMu,uEs,uUseV;uniform sampler2D uVtex;void main(){float i,j,k;vox(i,j,k);float tx2=mod(k,uT),ty2=floor(k/uT);vec4 raw=texture2D(uPsi,vec2((tx2*uG+i+0.5)/uWx,(ty2*uG+j+0.5)/uWy));float c=raw.r;float v=uUseV>0.5?texture2D(uVtex,gl_FragCoord.xy/vec2(uWx,uWy)).r:pot(posOf(i,j,k));float nw=c+uDt*(uD*lapc(i,j,k,0)-(v-uEs)*c)+uMu*(c-raw.b);gl_FragColor=vec4(nw,0.0,c,1.0);}`});
  gTd=new THREE.ShaderMaterial({uniforms:gMat.uniforms,vertexShader:'void main(){gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:GL_ATLAS+GL_POT+GL_LAP+`uniform float uDt,uD,uPass,uAbs;void main(){float i,j,k;vox(i,j,k);vec2 c=atv(i,j,k);vec3 p=posOf(i,j,k);float v=pot(p);
   vec3 e=min(vec3(i,j,k),uG-1.0-vec3(i,j,k));float m=min(e.x,min(e.y,e.z));float damp=uAbs>0.5?1.0-0.02*pow(max(0.0,1.0-m/8.0),2.0):1.0;
   if(uPass<0.5){float hi=-uD*lapc(i,j,k,1)+v*c.y;gl_FragColor=vec4((c.x+uDt*hi)*damp,c.y,0.0,1.0);}else{float hr=-uD*lapc(i,j,k,0)+v*c.x;gl_FragColor=vec4(c.x,(c.y-uDt*hr)*damp,0.0,1.0);}}`});
  gCopy=new THREE.ShaderMaterial({uniforms:{uSrc:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:'uniform sampler2D uSrc;varying vec2 vUv;void main(){gl_FragColor=texture2D(uSrc,vUv);}'});
  gQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),gMat);gScene.add(gQuad);}
 const u=gMat.uniforms;u.uG.value=d.G;u.uT.value=d.T;u.uWx.value=d.Wx;u.uWy.value=d.Wy;gBuf=new Float32Array(d.Wx*Math.min(d.Wy,256)*4);
 GI=(()=>{const X=new Int32Array(d.N),Yy=new Int32Array(d.N);for(let k=0;k<d.G;k++)for(let j=0;j<d.G;j++)for(let i=0;i<d.G;i++){const q=(k*d.G+j)*d.G+i;X[q]=(k%d.T)*d.G+i;Yy[q]=Math.floor(k/d.T)*d.G+j;}return {X,Yy};})();}
function gParams(){const P=GPOT[gPotK],a=+$('#gA').value,b=P.B?+$('#gB').value:0,L=P.L(a,b),h=2*L/GS.G,pt={h:0,h2:1,ws:2,ho:3,scf:4}[gPotK];
 const vmin=gPotK==='h'||gPotK==='scf'?a/(0.2*h):gPotK==='h2'?2/(0.2*h):gPotK==='ws'?50:0.5*a*a*L*L*3;const dt=1.5/(16*P.D/(h*h)+vmin);
 const dtR=0.9*2/(16*P.D/(h*h)+vmin);return {P,a,b,L,h,pt,dt,dtR};}
function gSetU(pr){const u=gMat.uniforms;u.uMu.value=$('#gMom').checked?0.8:0;u.uEs.value=u.uMu.value>0&&GS.lastE!=null?GS.lastE:0;u.uH.value=pr.h;u.uDt.value=pr.dt;u.uD.value=pr.P.D;u.uPt.value=pr.pt;u.uA.value=pr.a;u.uB.value=pr.b;}
function gUpload(re,im){const d=gDims();if(!gTex||gTex.image.width!==d.Wx){if(gTex)gTex.dispose();gTex=new THREE.DataTexture(new Float32Array(d.Wx*d.Wy*4),d.Wx,d.Wy,THREE.RGBAFormat,THREE.FloatType);}const t=gTex.image.data;t.fill(0);for(let q=0;q<d.N;q++){const o=(GI.Yy[q]*d.Wx+GI.X[q])*4;t[o]=re[q];if(im)t[o+1]=im[q];else t[o+2]=re[q];t[o+3]=1;}gTex.needsUpdate=true;
 gQuad.material=gCopy;gCopy.uniforms.uSrc.value=gTex;renderer.setRenderTarget(gRT[0]);renderer.render(gScene,gCam);renderer.setRenderTarget(null);gQuad.material=gMat;if(d.G>=128){gTex.dispose();gTex=null;}}
function gRead(both){const d=gDims(),re=new Float32Array(d.N),im=both?new Float32Array(d.N):null,G=d.G,T=d.T,rows=gBuf.length/(4*d.Wx);
 for(let y0=0;y0<d.Wy;y0+=rows){const nr=Math.min(rows,d.Wy-y0);renderer.readRenderTargetPixels(gRT[0],0,y0,d.Wx,nr,gBuf);
  for(let y=y0;y<y0+nr;y++){const ty=Math.floor(y/G),j=y-ty*G;for(let x=0;x<d.Wx;x++){const tx=Math.floor(x/G),i=x-tx*G,k=ty*T+tx,q=(k*G+j)*G+i,o=((y-y0)*d.Wx+x)*4;re[q]=gBuf[o];if(both)im[q]=gBuf[o+1];}}}
 return both?[re,im]:re;}
function potCPU(pr,x,y,z){const r=Math.hypot(x,y,z),h=pr.h;if(pr.pt===0)return -pr.a/Math.sqrt(r*r+0.04*h*h);if(pr.pt===1){const dz=0.5*pr.a;return -1/Math.sqrt(x*x+y*y+(z-dz)**2+0.04*h*h)-1/Math.sqrt(x*x+y*y+(z+dz)**2+0.04*h*h);}
 if(pr.pt===2){const R0=1.25*Math.cbrt(pr.a),ct=r>1e-6?z/r:1,R=R0*(1+pr.b*0.6307831*(1.5*ct*ct-0.5));return -50/(1+Math.exp((r-R)/0.65));}if(pr.pt===3)return 0.5*pr.a*pr.a*r*r;
 const V=GS.scf.Vtab,f=Math.min(1,r/GS.scf.rmax)*254.999,i=Math.floor(f);return -pr.a/Math.sqrt(r*r+0.04*h*h)+V[i]+(V[i+1]-V[i])*(f-i);}
function gEnergy(psi,pr){const G=GS.G,h=pr.h,D=pr.P.D,c0=0.5*G;let num=0,den=0;const at=(i,j,k)=>i<0||j<0||k<0||i>=G||j>=G||k>=G?0:psi[(k*G+j)*G+i];
 for(let k=0;k<G;k++)for(let j=0;j<G;j++)for(let i=0;i<G;i++){const c=psi[(k*G+j)*G+i];if(c===0)continue;const lap=(16*(at(i+1,j,k)+at(i-1,j,k)+at(i,j+1,k)+at(i,j-1,k)+at(i,j,k+1)+at(i,j,k-1))-(at(i+2,j,k)+at(i-2,j,k)+at(i,j+2,k)+at(i,j-2,k)+at(i,j,k+2)+at(i,j,k-2))-90*c)/(12*h*h);
  num+=c*(-D*lap+potCPU(pr,(i+0.5-c0)*h,(j+0.5-c0)*h,(k+0.5-c0)*h)*c);den+=c*c;}return num/den;}
function gOrtho(psi,list){(list||GS.states).forEach(st=>{let d=0;for(let q=0;q<psi.length;q++)d+=psi[q]*st.psi[q];for(let q=0;q<psi.length;q++)psi[q]-=d*st.psi[q];});let nn=0;for(let q=0;q<psi.length;q++)nn+=psi[q]*psi[q];nn=Math.sqrt(nn)||1;for(let q=0;q<psi.length;q++)psi[q]/=nn;return psi;}
function gSeed(idx){const G=GS.G,n=G*G*G,a=new Float32Array(n),c0=G/2-0.5,w=300*(G/64)**2;let sd=12345+idx*7919;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647-0.5;};for(let k=0;k<G;k++)for(let j=0;j<G;j++)for(let i=0;i<G;i++){const x=i-c0,y=j-c0,z=k-c0;a[(k*G+j)*G+i]=Math.exp(-(x*x+y*y+z*z)/w)*(1+rnd());}return a;}
function gCpu(){return GS.G===32;}
function gEigCPU(){const pr=GS.pr,G=GS.G,N=G*G*G,h=pr.h,D=pr.P.D,dt=pr.dt,mu=$('#gMom').checked?0.8:0,c0=0.5*G,t0=performance.now(),list=GS.task==='scf'?GS.scf.cur:GS.states;
 if(!GS.cV||GS.cVkey!==gKey()+'|'+(GS.scf?GS.scf.cycle:0)){GS.cV=new Float32Array(N);for(let k=0;k<G;k++)for(let j=0;j<G;j++)for(let i=0;i<G;i++)GS.cV[(k*G+j)*G+i]=potCPU(pr,(i+0.5-c0)*h,(j+0.5-c0)*h,(k+0.5-c0)*h);GS.cVkey=gKey()+'|'+(GS.scf?GS.scf.cycle:0);}
 const V=GS.cV,k12=D*dt/(12*h*h),G2=G*G,Es=mu>0&&GS.lastE!=null?GS.lastE:0;let a=GS.cpsi,b=GS.cprev,n=new Float32Array(N),steps=0;
 while(steps<8||performance.now()-t0<(MOB?10:14)){for(let k=0;k<G;k++)for(let j=0;j<G;j++){const row=(k*G+j)*G;for(let i=0;i<G;i++){const q=row+i,c=a[q];
    const s1=(i>0?a[q-1]:0)+(i<G-1?a[q+1]:0)+(j>0?a[q-G]:0)+(j<G-1?a[q+G]:0)+(k>0?a[q-G2]:0)+(k<G-1?a[q+G2]:0),s2=(i>1?a[q-2]:0)+(i<G-2?a[q+2]:0)+(j>1?a[q-2*G]:0)+(j<G-2?a[q+2*G]:0)+(k>1?a[q-2*G2]:0)+(k<G-2?a[q+2*G2]:0);
    n[q]=c+k12*(16*s1-s2-90*c)-dt*(V[q]-Es)*c+mu*(c-b[q]);}}const t=b;b=a;a=n;n=t;steps++;if(steps>=200)break;}
 GS.it+=steps;GS.itTot=(GS.itTot||0)+steps;
 list.forEach(st=>{let d=0,d2=0;for(let q=0;q<N;q++){d+=a[q]*st.psi[q];d2+=b[q]*st.psi[q];}for(let q=0;q<N;q++){a[q]-=d*st.psi[q];b[q]-=d2*st.psi[q];}});
 let nn=0;for(let q=0;q<N;q++)nn+=a[q]*a[q];nn=1/(Math.sqrt(nn)||1);for(let q=0;q<N;q++){a[q]*=nn;b[q]*=nn;}GS.cpsi=a;GS.cprev=b;
 const E=gEnergy(a,pr),tol=GS.task==='scf'?2e-5:2e-6,conv=GS.lastE!==null&&Math.abs(E-GS.lastE)<Math.max(1e-6,Math.abs(E)*tol)*Math.max(1,steps/40);GS.stable=conv?GS.stable+1:0;GS.lastE=E;
 const done=GS.stable>=(GS.task==='scf'?2:3)||GS.it>=40000,now=performance.now();if(done||now-(GS.lastVolT||0)>500){try{gVol(a);}catch(e){}GS.lastVolT=now;}
 return {psi:done?Float32Array.from(a):null,E,done};}
function gStart(){if(!gCpu()&&!gpuOK()){gSetGrid(32);$$('[data-gg]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.gg==='32')));}
 if(gCpu()){GS.chain=null;GS.up=null;GS.itTot=0;GS.states=[];GS.view=-1;GS.tdse=null;GS.run=true;GS.cV=null;GS.task=gPotK==='scf'?'scf':'eig';if(GS.task==='scf')scfInit();gBegin();return;}
 if(!GS.chain){GS.itTot=0;GS.up=null;if(GS.G>64&&$('#gUp').checked){const st=GS.G===256?[64,128,256]:[64,128];GS.chain={st,idx:0,its:[],t0:performance.now()};gSetGrid(64);}}
 gInit();GS.states=[];GS.view=-1;GS.tdse=null;GS.run=true;GS.task=gPotK==='scf'?'scf':'eig';if(GS.task==='scf'){scfInit();if(GS.up&&GS.up.vtab){GS.scf.Vtab=Float32Array.from(GS.up.vtab);scfSendV();}}gBegin();}
function gUpsample(a){const g=Math.round(Math.cbrt(a.length)),G=2*g,o=new Float32Array(G*G*G),cl=v=>v<0?0:v>g-1?g-1:v;for(let k=0;k<G;k++){const z=cl(k/2-0.25),z0=Math.floor(z),z1=Math.min(g-1,z0+1),fz=z-z0;for(let j=0;j<G;j++){const y=cl(j/2-0.25),y0=Math.floor(y),y1=Math.min(g-1,y0+1),fy=y-y0;for(let i=0;i<G;i++){const x=cl(i/2-0.25),x0=Math.floor(x),x1=Math.min(g-1,x0+1),fx=x-x0,A=(zz,yy,xx)=>a[(zz*g+yy)*g+xx];
 o[(k*G+j)*G+i]=(1-fz)*((1-fy)*((1-fx)*A(z0,y0,x0)+fx*A(z0,y0,x1))+fy*((1-fx)*A(z0,y1,x0)+fx*A(z0,y1,x1)))+fz*((1-fy)*((1-fx)*A(z1,y0,x0)+fx*A(z1,y0,x1))+fy*((1-fx)*A(z1,y1,x0)+fx*A(z1,y1,x1)));}}}return o;}
function gChainNext(){const C=GS.chain;if(!C)return false;C.its.push(GS.itTot);
 if(C.idx<C.st.length-1){const g0=C.st[C.idx],g1=C.st[C.idx+1];GS.up={G:g0,states:GS.states.map(x=>x.psi),vtab:GS.task==='scf'?Float32Array.from(GS.scf.Vtab):null};C.idx++;gSetGrid(g1);GS.itTot=0;$('#gStat').textContent=g0+'³ solve done; enlarging it to '+g1+'³ and refining…';setTimeout(gStart,30);return true;}
 const msg=' Upscaled '+C.st.map(g=>g+'³').join(' → ')+': '+C.its.map((n,k)=>n.toLocaleString()+' GPU steps on '+C.st[k]+'³').join(', ')+' ('+((performance.now()-C.t0)/1000).toFixed(0)+' s in all).';GS.chain=null;GS.up=null;$('#gStat').textContent+=msg;return true;}
function gBegin(seed){const pr=gParams();GS.pr=pr;GS.it=0;GS.lastE=null;GS.stable=0;GS.acc=0;GS.ck=null;GS.await=null;if(!gCpu()){gSetU(pr);gCacheV();}const list=GS.task==='scf'?GS.scf.cur:GS.states;GS.warmUsed=false;
 if(!seed&&GS.up&&GS.up.G*2===GS.G&&GS.up.states[list.length]){seed=gUpsample(GS.up.states[list.length]);GS.warmUsed=true;}
 if(!seed&&GS.task==='eig'&&$('#gWarm').checked&&GS.warm&&GS.warm.G===GS.G&&GS.warm.pot===gPotK&&GS.warm.states[list.length]){seed=GS.warm.states[list.length];GS.warmUsed=true;}
 const s0=gOrtho(seed&&seed.length===GS.G**3?Float32Array.from(seed):gSeed(list.length),list);if(gCpu()){GS.cpsi=s0;GS.cprev=Float32Array.from(s0);}else gUpload(s0);gRender();}
function gStop(){GS.run=false;GS.await=null;}
const ECACHE={};const gKey=()=>gPotK+'|'+$('#gA').value+'|'+($('#gB').value||'');
function gCacheE(i,E){const k=gKey();(ECACHE[k]=ECACHE[k]||{})[GS.G+':'+i]=E;}
function gRichPair(i){const c=ECACHE[gKey()];if(!c)return null;for(const [a,b] of [[128,256],[64,128]])if(c[a+':'+i]!=null&&c[b+':'+i]!=null)return [a,b,(16*c[b+':'+i]-c[a+':'+i])/15];return null;}
function gRich(i){const p=gRichPair(i);return p?p[2]:null;}
$('#gGo').addEventListener('click',gStart);$('#gStop').addEventListener('click',()=>{gStop();$('#gStat').textContent='Stopped.';});
function gEig(){const pr=GS.pr,u=gMat.uniforms,batch=MOB?(GS.G===128?20:15):GS.G===256?120:GS.G===128?60:40;gQuad.material=gMat;gSetU(pr);
 for(let s2=0;s2<batch;s2++){u.uPsi.value=gRT[0].texture;renderer.setRenderTarget(gRT[1]);renderer.render(gScene,gCam);gRT.reverse();}renderer.setRenderTarget(null);GS.it+=batch;GS.itTot=(GS.itTot||0)+batch;
 const list=GS.task==='scf'?GS.scf.cur:GS.states;let psi=gOrtho(gRead(),list);const E=gEnergy(psi,pr);gUpload(psi);gVol(psi);
 const tol=GS.task==='scf'?2e-5:2e-6,conv=GS.lastE!==null&&Math.abs(E-GS.lastE)<Math.max(1e-6,Math.abs(E)*tol);GS.stable=conv?GS.stable+1:0;GS.lastE=E;return {psi,E,done:GS.stable>=(GS.task==='scf'?2:3)||GS.it>=40000};}

/* ---- on-GPU reductions: energy, norm and orthogonalization without copying the field back ---- */
let gRed=null;
function gRedInit(){const d=gDims();if(gRed&&gRed.Wx===d.Wx)return;gRedFree();const o={type:THREE.FloatType,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,stencilBuffer:false};
 const VS='void main(){gl_Position=vec4(position.xy,0.0,1.0);}';const u=gMat.uniforms;
 const prod=new THREE.ShaderMaterial({uniforms:Object.assign({},u,{uMode:{value:0},uPack:{value:null}}),vertexShader:VS,fragmentShader:GL_ATLAS+GL_POT+GL_LAP+`uniform float uD,uMode,uUseV;uniform sampler2D uPack,uVtex;void main(){float i,j,k;vox(i,j,k);float c=at(i,j,k);
  if(uMode<0.5){float v=uUseV>0.5?texture2D(uVtex,gl_FragCoord.xy/vec2(uWx,uWy)).r:pot(posOf(i,j,k));gl_FragColor=vec4(c*(-uD*lapc(i,j,k,0)+v*c),c*c,0.0,0.0);}else gl_FragColor=c*texture2D(uPack,gl_FragCoord.xy/vec2(uWx,uWy));}`});
 const red=new THREE.ShaderMaterial({uniforms:{uSrc:{value:null},uIn:{value:new THREE.Vector2()},uMax:{value:0}},vertexShader:VS,fragmentShader:`uniform sampler2D uSrc;uniform vec2 uIn;uniform float uMax;void main(){vec2 b=floor(gl_FragCoord.xy)*4.0;vec4 s=vec4(0.0);for(int y=0;y<4;y++)for(int x=0;x<4;x++){vec2 p=b+vec2(float(x),float(y));if(p.x<uIn.x&&p.y<uIn.y){vec4 t=texture2D(uSrc,(p+0.5)/uIn);s=uMax>0.5?max(s,t):s+t;}}gl_FragColor=s;}`});
 const axpy=new THREE.ShaderMaterial({uniforms:{uPsi:{value:null},uPack:{value:null},uC:{value:new THREE.Vector4()},uS:{value:1},uWx:u.uWx,uWy:u.uWy},vertexShader:VS,fragmentShader:`uniform sampler2D uPsi,uPack;uniform vec4 uC;uniform float uS,uWx,uWy;void main(){vec2 t=gl_FragCoord.xy/vec2(uWx,uWy);vec4 r=texture2D(uPsi,t);float p=dot(uC,texture2D(uPack,t));gl_FragColor=vec4((r.r-p)*uS,0.0,(r.b-p)*uS,1.0);}`});
 const full=new THREE.WebGLRenderTarget(d.Wx,d.Wy,o),lv=[];let w=d.Wx,h=d.Wy;while(w>1||h>1){w=Math.ceil(w/4);h=Math.ceil(h/4);lv.push(new THREE.WebGLRenderTarget(w,h,o));}
 const zero=new THREE.DataTexture(new Float32Array(4),1,1,THREE.RGBAFormat,THREE.FloatType);zero.needsUpdate=true;gRed={Wx:d.Wx,prod,red,axpy,full,lv,zero,px:new Float32Array(4),packs:[],packKey:null};}
function gRedFree(){if(!gRed)return;[gRed.full,...gRed.lv].forEach(r=>r.dispose());[gRed.prod,gRed.red,gRed.axpy,gRed.zero].forEach(m=>m.dispose());gRed.packs.forEach(t=>t.dispose());gRed=null;}
function gReduce(mx){const d=gDims();let src=gRed.full.texture,w=d.Wx,h=d.Wy;gQuad.material=gRed.red;gRed.red.uniforms.uMax.value=mx?1:0;
 for(const rt of gRed.lv){gRed.red.uniforms.uSrc.value=src;gRed.red.uniforms.uIn.value.set(w,h);renderer.setRenderTarget(rt);renderer.render(gScene,gCam);src=rt.texture;w=rt.width;h=rt.height;}
 renderer.readRenderTargetPixels(gRed.lv[gRed.lv.length-1],0,0,1,1,gRed.px);renderer.setRenderTarget(null);return Array.from(gRed.px);}
function gProdReduce(mode,pack){const P=gRed.prod;P.uniforms.uPsi.value=gRT[0].texture;P.uniforms.uMode.value=mode;P.uniforms.uPack.value=pack||null;gQuad.material=P;renderer.setRenderTarget(gRed.full);renderer.render(gScene,gCam);return gReduce();}
function gAxpy(pack,c,sc){const A=gRed.axpy;A.uniforms.uPsi.value=gRT[0].texture;A.uniforms.uPack.value=pack;A.uniforms.uC.value.set(c[0],c[1],c[2],c[3]);A.uniforms.uS.value=sc;gQuad.material=A;renderer.setRenderTarget(gRT[1]);renderer.render(gScene,gCam);renderer.setRenderTarget(null);gRT.reverse();}
function gPacks(list){const key=GS.G+':'+list.map(x=>x.E).join(',');if(gRed.packKey===key)return gRed.packs;gRed.packs.forEach(t=>t.dispose());gRed.packs=[];const d=gDims();
 for(let p=0;p<list.length;p+=4){const a=new Float32Array(d.Wx*d.Wy*4);for(let c=0;c<4&&p+c<list.length;c++){const ps=list[p+c].psi;for(let q=0;q<d.N;q++)a[(GI.Yy[q]*d.Wx+GI.X[q])*4+c]=ps[q];}
  const t=new THREE.DataTexture(a,d.Wx,d.Wy,THREE.RGBAFormat,THREE.FloatType);t.minFilter=t.magFilter=THREE.NearestFilter;t.onUpdate=()=>{t.image.data=null;};t.needsUpdate=true;gRed.packs.push(t);}
 gRed.packKey=key;return gRed.packs;}
let gVrt=null;
function gCacheV(){const d=gDims(),u=gMat.uniforms;if(!gVrt||gVrt.width!==d.Wx){if(gVrt)gVrt.dispose();gVrt=new THREE.WebGLRenderTarget(d.Wx,d.Wy,{type:THREE.FloatType,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,stencilBuffer:false});}
 if(!gCacheV.mat)gCacheV.mat=new THREE.ShaderMaterial({uniforms:u,vertexShader:'void main(){gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:GL_ATLAS+GL_POT+GL_LAP+'void main(){float i,j,k;vox(i,j,k);gl_FragColor=vec4(pot(posOf(i,j,k)),0.0,0.0,1.0);}'});
 u.uUseV.value=0;gQuad.material=gCacheV.mat;renderer.setRenderTarget(gVrt);renderer.render(gScene,gCam);renderer.setRenderTarget(null);gQuad.material=gMat;u.uVtex.value=gVrt.texture;u.uUseV.value=1;}
/* non-blocking GPU -> CPU copy: the field is copied into a GPU-side buffer, and picked up a few frames later once the card has finished */
function gReadAsync(E){const d=gDims();if(d.G>128)return {E,sync:true};try{const gl=renderer.getContext(),pbo=gl.createBuffer();renderer.setRenderTarget(gRT[0]);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,pbo);gl.bufferData(gl.PIXEL_PACK_BUFFER,d.Wx*d.Wy*16,gl.STREAM_READ);gl.readPixels(0,0,d.Wx,d.Wy,gl.RGBA,gl.FLOAT,0);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);renderer.setRenderTarget(null);
  const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();return {E,pbo,fence,t0:performance.now(),frames:0};}catch(e){renderer.setRenderTarget(null);return {E,sync:true};}}
function gReadPoll(A){if(A.sync)return gRead();const gl=renderer.getContext(),st=gl.clientWaitSync(A.fence,0,0);A.frames++;if(st===gl.TIMEOUT_EXPIRED&&A.frames<600)return null;
 const d=gDims(),buf=new Float32Array(d.Wx*d.Wy*4);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,A.pbo);gl.getBufferSubData(gl.PIXEL_PACK_BUFFER,0,buf);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);gl.deleteSync(A.fence);gl.deleteBuffer(A.pbo);
 const re=new Float32Array(d.N);for(let q=0;q<d.N;q++)re[q]=buf[(GI.Yy[q]*d.Wx+GI.X[q])*4];GS.xfer={ms:performance.now()-A.t0,frames:A.frames,mb:d.Wx*d.Wy*16/1048576};return re;}
function gLive(dmax){ensureTdMesh();tdU.uPsi.value=gRT[0].texture;if(dmax>0)tdU.uDmax.value=dmax;tdMesh.visible=mode==='gpu';if(gVolMesh)gVolMesh.visible=false;}
function gEigGPU(){const pr=GS.pr,u=gMat.uniforms,t0=performance.now();gRedInit();
 const base=GS.G===256?120:GS.G===128?60:40;if(!GS.batch||GS.batchG!==GS.G){GS.batch=MOB?12:GS.G===256?8:GS.G===128?20:40;GS.batchG=GS.G;}
 // time budget for this frame: ~11 ms, stretched when drawing the page itself is slow, never while the tab is hidden
 const fd=GS.lastCall?t0-GS.lastCall:16;GS.lastCall=t0;GS.other=document.hidden?0:(GS.other!=null?0.7*GS.other+0.3*Math.min(150,Math.max(0,fd-(GS.prevMs||0))):0);const want=Math.max(MOB?7:11,2*GS.other);
 const list=GS.task==='scf'?GS.scf.cur:GS.states,packs=gPacks(list),tolB=GS.task==='scf'?2e-5:2e-6,need=base*(GS.task==='scf'?2:3);let E=GS.lastE,done=false,tot=0,mx=0,en=null;
 // several short bursts per frame, each followed by orthogonalization and normalization on the GPU, until the budget is used
 do{const sub=Math.max(4,Math.min(base,GS.batch)),ts=performance.now();gQuad.material=gMat;gSetU(pr);
  for(let s2=0;s2<sub;s2++){u.uPsi.value=gRT[0].texture;renderer.setRenderTarget(gRT[1]);renderer.render(gScene,gCam);gRT.reverse();}renderer.setRenderTarget(null);GS.it+=sub;GS.itTot=(GS.itTot||0)+sub;tot+=sub;
  for(const pk of packs){const dt=gProdReduce(1,pk);gAxpy(pk,dt,1);}
  en=gProdReduce(0);E=en[0]/en[1];GS.nb=(GS.nb||0)+1;if(GS.nb%6===1)mx=gReduce(true)[1]/en[1];gAxpy(gRed.zero,[0,0,0,0],1/Math.sqrt(en[1]));
  GS.lastE=E;if(!GS.ck||GS.ck.it>GS.it)GS.ck={it:0,E:null,ok:0};if(GS.it-GS.ck.it>=base){const conv=GS.ck.E!==null&&Math.abs(E-GS.ck.E)<Math.max(1e-6,Math.abs(E)*tolB);GS.ck={it:GS.it,E,ok:conv?GS.ck.ok+1:0};}done=GS.ck.ok>=(GS.task==='scf'?2:3)||GS.it>=40000;
  const ms=performance.now()-ts;GS.batch=Math.max(4,Math.min(base,Math.round(sub*Math.max(0.5,Math.min(2,want/Math.max(ms,0.3))))));
 }while(!done&&performance.now()-t0<want);
 gQuad.material=gMat;gLive(mx);GS.prevMs=performance.now()-t0;GS.spf=tot;return {psi:null,E,done};}
function gStep(){if(!GS.run||mode!=='gpu')return;
 if(GS.task==='tdse'){tdStep();return;}
 let r;const lst=GS.task==='scf'?GS.scf.cur:GS.states;
 if(GS.await){const raw=gReadPoll(GS.await);if(!raw){$('#gStat').textContent='Copying the finished state from the graphics card…';return;}const psi=gOrtho(raw,lst);r={psi,E:GS.await.E,done:true};GS.await=null;gVol(psi);}
 else{r=gCpu()?gEigCPU():$('#gOnGpu').checked?gEigGPU():gEig();if(r.done&&!r.psi){GS.await=gReadAsync(r.E);GS.acc=0;return;}}
 if(GS.task==='eig'){$('#gStat').textContent='Finding state '+(GS.states.length+1)+' of '+$('#gK').value+' · '+GS.it.toLocaleString()+' GPU steps · energy now '+fE(r.E*GS.pr.P.unit)+(!gCpu()&&$('#gOnGpu').checked&&GS.spf?' · '+GS.spf+' steps per frame':'')+(GS.xfer?' · last GPU → CPU copy: '+GS.xfer.mb.toFixed(0)+' MB in '+GS.xfer.ms.toFixed(0)+' ms, no stall':'');
  if(r.done){GS.states.push({psi:r.psi,E:r.E,steps:GS.it,mom:$('#gMom').checked,warm:!!GS.warmUsed});gCacheE(GS.states.length-1,r.E);GS.view=GS.states.length-1;gRender();if(GS.states.length>=+$('#gK').value){GS.run=false;$('#gStat').textContent='Done: '+GS.states.length+' states found.';gChainNext();}else gBegin();}return;}
 const S=GS.scf;$('#gStat').textContent='Self-consistency cycle '+(S.cycle+1)+' · orbital '+ORBN[S.cur.length]+' · '+GS.it.toLocaleString()+' GPU steps · ε = '+fE(r.E*27.211386);
 if(r.done){S.cur.push({psi:r.psi,E:r.E});if(S.cur.length<S.K){gBegin(S.prev[S.cur.length]&&S.prev[S.cur.length].psi);return;}scfUpdate();}}
/* ---- self-consistent field (Hartree + LDA exchange) ---- */
const ORBN=['1s','2s','2p','2p','2p'];
function scfOcc(Z){if(Z<=2)return [Z];if(Z<=4)return [2,Z-2];const p=(Z-4)/3;return [2,2,p,p,p];}
const SCFREF={"2":[14.07,20.21],"3":[2.15,5.27],"4":[4.63,7.01],"5":[2.72,5.3],"6":[4.3,6.95],"7":[6.01,8.77],"8":[7.88,10.73],"9":[9.89,12.83],"10":[12.06,15.08]};
function scfInit(){const pr=gParams(),Z=pr.a,occ=scfOcc(Z),rmax=pr.L*Math.sqrt(3)*1.01,Vtab=new Float32Array(256);
 for(let i=0;i<256;i++){const r=Math.max(1e-3,i/255*rmax);Vtab[i]=(Z-1)*(1-Math.exp(-2*r))/r;}/* start: inner electrons screen the nucleus */
 GS.scf={Z,occ,K:occ.length,rmax,Vtab,lat:($('#gLat').checked),cycle:0,cur:[],prev:[],eps:[],homo:[]};scfSendV();}
function scfSendV(){const S=GS.scf,u=gMat?gMat.uniforms:null;if(!u)return;for(let i=0;i<64;i++)u.uVr.value[i].set(S.Vtab[4*i],S.Vtab[4*i+1],S.Vtab[4*i+2],S.Vtab[4*i+3]);u.uRmax.value=S.rmax;}
function scfUpdate(){const S=GS.scf,pr=GS.pr,G=GS.G,h=pr.h,c0=0.5*G,NB=256,mass=new Float64Array(NB);
 S.cur.forEach((o,idx)=>{const w=S.occ[idx];for(let k=0;k<G;k++)for(let j=0;j<G;j++)for(let i=0;i<G;i++){const q=(k*G+j)*G+i,v=o.psi[q];if(v===0)continue;const r=Math.hypot(i+0.5-c0,j+0.5-c0,k+0.5-c0)*h,b=Math.min(NB-1,Math.floor(r/S.rmax*NB));mass[b]+=w*v*v;}});
 const dr=S.rmax/NB,rc=Array.from({length:NB},(_,b)=>(b+0.5)*dr),rho=rc.map((r,b)=>mass[b]/(4*Math.PI*r*r*dr));
 const inner=new Float64Array(NB),outer=new Float64Array(NB);let acc=0;for(let b=0;b<NB;b++){acc+=mass[b];inner[b]=acc;}acc=0;for(let b=NB-1;b>=0;b--){outer[b]=acc;acc+=mass[b]/rc[b];}
 const Vout=new Float64Array(256);for(let i=0;i<256;i++){const r=Math.max(1e-3,i/255*S.rmax),b=Math.min(NB-1,Math.floor(r/dr));Vout[i]=inner[b]/r+outer[b]-Math.cbrt(3*rho[b]/Math.PI);if(S.lat)Vout[i]=Math.min(Vout[i],(S.Z-1)/r);}
 const F=Vout.map((v,i)=>v-S.Vtab[i]),beta=0.5;let th=0;if(S.Fprev&&$('#gMom').checked){let num=0,den=0;for(let i=0;i<256;i++){const dF=F[i]-S.Fprev[i];num+=F[i]*dF;den+=dF*dF;}th=den>0?Math.max(-1.5,Math.min(1.5,num/den)):0;}
 const Vn=new Float32Array(256);for(let i=0;i<256;i++){const vin=S.Vtab[i]-th*(S.Vtab[i]-(S.Vprev?S.Vprev[i]:S.Vtab[i])),f=F[i]-th*(F[i]-(S.Fprev?S.Fprev[i]:F[i]));Vn[i]=vin+beta*f;}S.Vprev=Float64Array.from(S.Vtab);S.Fprev=F;
 S.Vtab=Vn;scfSendV();const homo=S.cur[S.K-1].E;S.homo.push(homo);S.eps=S.cur.map(o=>o.E);S.rho=rc.map((r,b)=>[r,4*Math.PI*r*r*rho[b]]);S.prev=S.cur;GS.states=S.cur.map(o=>({psi:o.psi,E:o.E}));GS.view=S.K-1;
 const dE=S.homo.length>1?Math.abs(S.homo[S.homo.length-1]-S.homo[S.homo.length-2]):1;S.cycle++;
 if(dE<3e-4||S.cycle>=12){GS.run=false;const ie=RAW.ie[S.Z-1];GS.hist=GS.hist.filter(x=>x[0]!==S.Z).concat([[S.Z,-homo*27.211386,ie]]).sort((a,b)=>a[0]-b[0]);$('#gStat').textContent='Converged after '+S.cycle+' cycles.';gRender();gChainNext();return;}
 S.cur=[];gRender();gBegin(S.prev[0].psi);}
/* ---- real-time evolution ---- */
function tdStart(kind){if(gCpu()||!gpuOK()){$('#gStat').textContent='Real-time evolution needs the GPU grids (64³ or larger).';return;}gInit();const pr=gParams(),G=GS.G,c0=0.5*G,N=G*G*G,re=new Float32Array(N),im=new Float32Array(N);
 if(kind==='sup'&&GS.states.length>=2){const a=GS.states[0].psi,b=GS.states[1].psi,s=Math.SQRT1_2;for(let q=0;q<N;q++)re[q]=s*(a[q]+b[q]);GS.tdInfo='equal mix of states 1 and 2; it should slosh back and forth with period '+fT(2*Math.PI/Math.abs(GS.states[1].E-GS.states[0].E)*pr.P.tu);}
 else{const sig=pr.L*0.12,z0=-pr.L*0.55,k=+$('#gKp').value/(pr.h*4);for(let kk=0;kk<G;kk++)for(let j=0;j<G;j++)for(let i=0;i<G;i++){const x=(i+0.5-c0)*pr.h,y=(j+0.5-c0)*pr.h,z=(kk+0.5-c0)*pr.h,env=Math.exp(-((x*x+y*y+(z-z0)**2)/(4*sig*sig))),q=(kk*G+j)*G+i;re[q]=env*Math.cos(k*z);im[q]=env*Math.sin(k*z);}
  let nn=0;for(let q=0;q<N;q++)nn+=re[q]*re[q]+im[q]*im[q];nn=Math.sqrt(nn);for(let q=0;q<N;q++){re[q]/=nn;im[q]/=nn;}GS.tdInfo='wave packet fired at the centre; the walls absorb what escapes';}
 GS.pr=pr;gSetU(pr);gUpload(re,im);GS.task='tdse';GS.run=true;GS.t=0;GS.frames=0;GS.zt=[];let mx=0;for(let q=0;q<N;q++)mx=Math.max(mx,re[q]*re[q]+im[q]*im[q]);tdU.uDmax.value=mx||1;tdU.uL.value=pr.L;ensureTdMesh();gRender();}
function fT(s){return s<1e-21?(s*1e24).toPrecision(3)+' ys':s<1e-18?(s*1e21).toPrecision(3)+' zs':s<1e-15?(s*1e18).toPrecision(3)+' as':s<1e-12?(s*1e15).toPrecision(3)+' fs':sci(s,'s');}
function tdStep(){const pr=GS.pr,u=gMat.uniforms;gQuad.material=gTd;u.uDt.value=pr.dtR;u.uAbs.value=1;const n=GS.G===256?8:GS.G===128?20:40;
 for(let s2=0;s2<n;s2++){for(let ps=0;ps<2;ps++){u.uPass.value=ps;u.uPsi.value=gRT[0].texture;renderer.setRenderTarget(gRT[1]);renderer.render(gScene,gCam);gRT.reverse();}}renderer.setRenderTarget(null);gQuad.material=gMat;u.uAbs.value=0;
 GS.t+=n*pr.dtR;GS.frames++;tdU.uPsi.value=gRT[0].texture;
 if(GS.frames%8===0){const [re,im]=gRead(true),G=GS.G,c0=0.5*G;let nn=0,zz=0;for(let k=0;k<G;k++){const z=(k+0.5-c0)*pr.h;for(let q=k*G*G;q<(k+1)*G*G;q++){const p=re[q]*re[q]+im[q]*im[q];nn+=p;zz+=p*z;}}GS.zt.push([GS.t,zz/(nn||1)]);if(GS.zt.length>200)GS.zt.shift();GS.norm=nn;gRender();}
 $('#gStat').textContent='Real-time evolution · t = '+fT(GS.t*pr.P.tu)+(GS.norm!=null?' · probability still in the box '+(100*GS.norm).toFixed(1)+'%':'');}
const tdU={uPsi:{value:null},uG:{value:64},uT:{value:8},uWx:{value:512},uWy:{value:512},uL:{value:10},uDmax:{value:1},uGain:volU.uGain,uPosC:{value:cPosV},uNegC:{value:cNegV}};let tdMesh=null;
function ensureTdMesh(){const d=gDims();tdU.uG.value=d.G;tdU.uT.value=d.T;tdU.uWx.value=d.Wx;tdU.uWy.value=d.Wy;tdU.uPsi.value=gRT[0].texture;
 if(!tdMesh){tdMesh=new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.ShaderMaterial({uniforms:tdU,transparent:true,depthWrite:false,side:THREE.BackSide,premultipliedAlpha:true,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:GL_ATLAS+`uniform float uL,uDmax,uGain;uniform vec3 uPosC,uNegC;varying vec3 vW;
   vec2 samp(vec3 g){vec3 b=floor(g),f=g-b;vec2 c00=mix(atv(b.x,b.y,b.z),atv(b.x+1.0,b.y,b.z),f.x),c10=mix(atv(b.x,b.y+1.0,b.z),atv(b.x+1.0,b.y+1.0,b.z),f.x),c01=mix(atv(b.x,b.y,b.z+1.0),atv(b.x+1.0,b.y,b.z+1.0),f.x),c11=mix(atv(b.x,b.y+1.0,b.z+1.0),atv(b.x+1.0,b.y+1.0,b.z+1.0),f.x);return mix(mix(c00,c10,f.y),mix(c01,c11,f.y),f.z);}
   void main(){vec3 ro=cameraPosition,rd=normalize(vW-ro);vec3 inv=1.0/rd;vec3 t0=(-5.0-ro)*inv,t1=(5.0-ro)*inv;vec3 tn=min(t0,t1),tx=max(t0,t1);float a0=max(max(tn.x,tn.y),max(tn.z,0.0)),a1=min(min(tx.x,tx.y),tx.z);if(a1<=a0)discard;
    float dt=(a1-a0)/${MOB?48:80}.0;vec3 col=vec3(0.0);float al=0.0;float t=a0+fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))*dt;for(int i=0;i<${MOB?48:80};i++){vec3 p=ro+rd*t;vec3 pp=vec3(p.x,-p.z,p.y);vec3 g=(pp/10.0+0.5)*uG-0.5;vec2 s=samp(g);float d=dot(s,s)/uDmax;
     float a=1.0-exp(-d*uGain*dt*0.6);col+=(1.0-al)*a*(s.x>=0.0?uPosC:uNegC);al+=(1.0-al)*a;if(al>0.97)break;t+=dt;}gl_FragColor=vec4(col,al);}`}));tdMesh.frustumCulled=false;scene.add(tdMesh);}
 tdMesh.visible=mode==='gpu';if(gVolMesh)gVolMesh.visible=false;}
$('#gTdSup').addEventListener('click',()=>tdStart('sup'));$('#gTdPk').addEventListener('click',()=>tdStart('pk'));$('#gKp').addEventListener('input',e=>{$('#gKpo').textContent=e.target.value;});
const EX={h:(a,i)=>{const lv=[1,2,2,2,2,3,3,3,3,3,3,3,3,3,3];return -0.5*a*a/(lv[i]**2);},ho:(a,i)=>{const lv=[0,1,1,1,2,2,2,2,2,2];return a*(lv[i]+1.5);}};
function gMem(){const d=gDims(),tex=d.Wx*d.Wy*16/1048576,st=GS.states.length+(GS.scf&&GS.scf.cur?GS.scf.cur.length:0)+(GS.up?GS.up.states.length/8:0);
 const gpu=gCpu()?0:tex*(2+1+1+(gRed?gRed.packs.length:0))+Math.min(d.N,128**3)*4/1048576,ram=st*d.N*4/1048576+(gCpu()?3*d.N*4/1048576:0)+(gBuf?gBuf.length*4/1048576:0);return {gpu,ram};}
function gRender(){const pr=gParams(),P=pr.P,un=gPotK==='ws'?' fm':' bohr';let h='<div class="nm" style="font-size:20px">'+P.nm[0].toUpperCase()+P.nm.slice(1)+(gPotK==='scf'?': '+NAMES[pr.a-1]:'')+'</div><div class="sub">Memory in use: about '+Math.round(gMem().gpu)+' MB on the graphics card, '+Math.round(gMem().ram)+' MB of RAM</div><div class="sub">'+GS.G+'³ grid'+(GS.G===32?' on the CPU (coarse, but runs anywhere)':'')+' · spacing '+pr.h.toFixed(3)+un+' · box ±'+pr.L.toFixed(1)+un+'</div>';
 $('#gTdBox').hidden=gPotK==='scf';$('#gTdSup').hidden=GS.states.length<2;
 if(GS.task==='tdse'&&GS.tdInfo){h+='<p class="note" style="color:var(--ink)">Real-time run: '+GS.tdInfo+'.</p>'+tdChart();}
 if(gPotK==='scf'){const S=GS.scf&&GS.scf.Z===pr.a?GS.scf:null;
  if(!S||!S.eps.length)h+='<p class="note">Press Solve. Each cycle the GPU finds the '+scfOcc(pr.a).length+' occupied orbital'+(scfOcc(pr.a).length>1?'s':'')+', then the main processor rebuilds the shared potential from all '+pr.a+' electrons. Use the 128³ grid for better accuracy near the nucleus.</p>';
  else{h+='<dl>'+S.eps.map((e,i)=>'<dt>'+ORBN[i]+' (holds '+(+S.occ[i].toFixed(2))+')</dt><dd>'+fE(e*27.211386)+'</dd>').join('')+'<dt>Cycles</dt><dd>'+S.cycle+'</dd></dl>';
   const ie=RAW.ie[S.Z-1],hm=-S.eps[S.K-1]*27.211386,rf=SCFREF[S.Z]?SCFREF[S.Z][S.lat?1:0]:null;h+='<p class="note" style="color:var(--ink)"><b>Experiment:</b> the highest orbital energy predicts the ionization energy (Koopmans’ rule): '+fE(hm)+' vs measured '+fE(ie)+' ('+(100*(hm-ie)/ie).toFixed(0)+'%)'+(rf?'. An exact radial solve of the same model gives '+fE(rf)+', so '+(100*(rf-ie)/ie).toFixed(0)+'% is the model and the rest ('+(100*(hm-rf)/rf).toFixed(0)+'%) is the grid':'')+'. Plain local exchange lets each electron repel its own charge, which badly underbinds the outermost one (lithium’s 2s comes out at 2.15 eV instead of 5.39 eV). The Latter tail (1955) fixes this far from the nucleus by making every electron see exactly one unit of nuclear charge out there, and brings lithium to 5.27 eV. Turn it off to compare. Outer orbitals like lithium’s 2s need a box of about 8 bohr; the 128³ grid then resolves the 1s core better.</p>'+rhoChart(S);}
  if(GS.hist.length)h+='<div class="sub" style="margin-top:8px">Runs so far (predicted vs measured ionization energy)</div><dl>'+GS.hist.map(x=>'<dt>'+SYM[x[0]-1]+'</dt><dd>'+fE(x[1])+' vs '+fE(x[2])+'</dd>').join('')+'</dl>';}
 else{if(!GS.states.length)h+='<p class="note">Press Solve. On a typical laptop graphics card each state takes a few seconds'+(GS.G===256?' (much longer on the 256³ grid: about 64× the work of 64³, so it needs a desktop graphics card with several GB of memory)':GS.G===128?' (several times longer on the 128³ grid)':'')+'.</p>';
  else h+='<dl>'+GS.states.map((st,i)=>{const ex=EX[gPotK]?EX[gPotK](pr.a,i):(gPotK==='h2'&&Math.abs(pr.a-2)<0.05&&i===0?-1.1026:null);const err=ex!=null?' · exact '+fE(ex*P.unit)+' ('+(100*(st.E-ex)/Math.abs(ex)).toFixed(1)+'% off)':'';
   const rc=gRich(i),rcs=rc!=null?'<br><b>Predicted for a perfect grid</b> (extrapolating '+gRichPair(i)[0]+'³ → '+gRichPair(i)[1]+'³): '+fE(rc*P.unit)+(ex!=null?' ('+(100*(rc-ex)/Math.abs(ex)).toFixed(1)+'% off)':''):'';
   return '<dt><button data-gv="'+i+'" aria-pressed="'+(GS.view===i)+'" style="min-height:36px;padding:0 10px">State '+(i+1)+'</button></dt><dd>'+fE(st.E*P.unit)+err+'<br><span style="color:var(--mut);font-size:13px">'+(st.steps||0).toLocaleString()+' GPU steps'+(st.mom?', momentum on':', momentum off')+(st.warm?', warm start':'')+'</span>'+rcs+'</dd>';}).join('')+'</dl><p class="note">Solve once on 64³ and once on 128³ with the same settings, and the page extrapolates both to predict the answer on an infinitely fine grid (Richardson extrapolation). Try toggling momentum to compare step counts.</p>';
  h+='<p class="note">'+({h:'Exact energies are −13.6 eV × Z² ⁄ n², with n = 2 four-fold degenerate. The ground state is hardest because its wavefunction has a sharp point at the nucleus: a finer grid (128³) or a smaller box cuts its error, but too small a box squeezes the larger n = 2 states.',h2:'Electronic energy only (add +1/R for the repulsion between the protons). At 2.0 bohr the exact ground state is −1.1026 hartree (−30.0 eV). State 1 is the bonding orbital, with the electron piled up between the protons; state 2 is antibonding, with a node in the middle.',ws:'No spin–orbit force here, so this shows only what deformation does: at β = 0 the p and d levels are degenerate; stretch the nucleus and they split apart. That splitting is why the simple shell model failed for deformed nuclei like uranium.',ho:'Exact energies are (N + 3⁄2)ħω, with levels holding 1, 3, 6, … states.'})[gPotK]+'</p>';}
 $('#gRes').innerHTML='<div class="tbrow">'+tb('c')+'Solved numerically on a grid. Where an exact answer exists, the error is shown next to it.</div>'+h+(GS.states.length&&GS.view>=0?'<div class="chips" style="margin-top:8px"><button id="gCube">Download this state (.cube for VESTA or 3Dmol)</button></div>':'');const cb=$('#gCube');if(cb)cb.onclick=gCube;simLabel();}
function tdChart(){if(!GS.zt||GS.zt.length<2)return '';const W=300,H=90,t0=GS.zt[0][0],t1=GS.zt[GS.zt.length-1][0],zs=GS.zt.map(p=>p[1]),mn=Math.min(...zs),mx=Math.max(...zs),sp=mx-mn||1;
 return '<div class="sub">Centre of the cloud along the vertical axis over time</div><svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:90px" role="img" aria-label="Position over time"><polyline fill="none" stroke="var(--acc)" stroke-width="2" points="'+GS.zt.map(p=>((p[0]-t0)/((t1-t0)||1)*W).toFixed(1)+','+(H-6-(p[1]-mn)/sp*(H-12)).toFixed(1)).join(' ')+'"/></svg>';}
function rhoChart(S){if(!S.rho)return '';const W=300,H=110,pts=S.rho.filter(p=>p[0]<S.rmax/1.8),mx=Math.max(...pts.map(p=>p[1]))||1,rM=pts[pts.length-1][0];
 return '<div class="sub">Radial electron density r²ρ(r): the bumps are the shells</div><svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:110px" role="img" aria-label="Radial density"><polyline fill="none" stroke="var(--acc)" stroke-width="2" points="'+pts.map(p=>(p[0]/rM*W).toFixed(1)+','+(H-14-p[1]/mx*(H-20)).toFixed(1)).join(' ')+'"/><text x="'+W+'" y="'+(H-2)+'" font-size="11" text-anchor="end" fill="var(--mut)">'+rM.toFixed(1)+' bohr</text></svg>';}
$('#gRes').addEventListener('click',e=>{const b=e.target.closest('[data-gv]');if(!b)return;GS.view=+b.dataset.gv;gVol(GS.states[GS.view].psi);if(tdMesh)tdMesh.visible=false;gRender();});
let gVolMesh=null,gTex3=null;
function gVol(psi){let G=GS.G;if(G===256){const g=128,o=new Float32Array(g*g*g);for(let k=0;k<g;k++)for(let j=0;j<g;j++)for(let i=0;i<g;i++){let a=0;for(let c=0;c<8;c++)a+=psi[((2*k+(c>>2))*256+2*j+((c>>1)&1))*256+2*i+(c&1)];o[(k*g+j)*g+i]=a/8;}psi=o;G=g;}let mx=0;for(let q=0;q<psi.length;q++)mx=Math.max(mx,Math.abs(psi[q]));const d=new Uint8Array(psi.length*4);for(let q=0;q<psi.length;q++){d[q*4]=Math.round(255*Math.abs(psi[q])/mx);d[q*4+1]=psi[q]>=0?255:0;d[q*4+3]=255;}
 if(gTex3&&gTex3.image.width!==G){gTex3.dispose();gTex3=null;if(gVolMesh){scene.remove(gVolMesh);disposeObj(gVolMesh);gVolMesh=null;}}
 if(!gTex3){gTex3=new THREE.DataTexture3D(d,G,G,G);gTex3.format=THREE.RGBAFormat;gTex3.type=THREE.UnsignedByteType;gTex3.minFilter=gTex3.magFilter=THREE.LinearFilter;gTex3.unpackAlignment=1;}else gTex3.image.data=d;gTex3.onUpdate=()=>{gTex3.image.data=null;};gTex3.needsUpdate=true;
 if(!gVolMesh){gVolMesh=new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.ShaderMaterial({uniforms:{uTex:{value:gTex3},uPosC:{value:cPosV},uNegC:{value:cNegV},uGain:volU.uGain},transparent:true,depthWrite:false,side:THREE.BackSide,premultipliedAlpha:true,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`precision highp sampler3D;uniform sampler3D uTex;uniform vec3 uPosC,uNegC;uniform float uGain;varying vec3 vW;
   void main(){vec3 ro=cameraPosition,rd=normalize(vW-ro);vec3 inv=1.0/rd;vec3 t0=(-5.0-ro)*inv,t1=(5.0-ro)*inv;vec3 tmin=min(t0,t1),tmax=max(t0,t1);float a0=max(max(tmin.x,tmin.y),max(tmin.z,0.0)),a1=min(min(tmax.x,tmax.y),tmax.z);if(a1<=a0)discard;
    float dt=(a1-a0)/${MOB?56:120}.0;vec3 col=vec3(0.0);float al=0.0;float t=a0+fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))*dt;for(int i=0;i<${MOB?56:120};i++){vec3 p=ro+rd*t;vec3 pp=vec3(p.x,-p.z,p.y);vec4 s=texture(uTex,pp/10.0+0.5);float d=s.r*s.r;float a=1.0-exp(-d*uGain*dt*1.5);col+=(1.0-al)*a*(s.g>0.5?uPosC:uNegC);al+=(1.0-al)*a;if(al>0.97)break;t+=dt;}
    gl_FragColor=vec4(col,al);}`}));gVolMesh.frustumCulled=false;scene.add(gVolMesh);}
 gVolMesh.material.uniforms.uTex.value=gTex3;gVolMesh.visible=mode==='gpu';if(tdMesh)tdMesh.visible=false;}
gSetPot('h');

function rebuild(){radialTable();buildShape();buildCloud();drawRadial();readout();simLabel();if(typeof drawSpec==='function')drawSpec();}

