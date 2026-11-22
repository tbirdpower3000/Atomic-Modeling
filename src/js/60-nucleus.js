function buildNuc(){clear(NG2);nInst=[];nBase=[];const [Z,A]=simIso(),N=A-Z;
 const c=A>=4?1.12*Math.cbrt(A)-0.86/Math.cbrt(A):1.0*Math.cbrt(A),a=0.54,rmax=c+2.2*a;
 const Pn=nearMagicDist(Z,[2,8,20,28,50,82,114,126]),Nn=nearMagicDist(N,MAGIC),P=Pn&&Nn?Pn*Nn/(Pn+Nn):0,beta=P>=4?Math.min(0.32,0.07*(P-2)):P>=3?0.06:0;
 let seed=Z*7919+A*104729;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const pts=[],dmin=A>40?1.45:1.3;let guard=0;
 while(pts.length<A&&guard<A*3000){guard++;const r=rmax*Math.cbrt(rnd());const w=1/(1+Math.exp((r-c)/a));if(rnd()>w)continue;let x=rnd()*2-1,y=rnd()*2-1,z=rnd()*2-1;const h=Math.hypot(x,y,z);if(h<1e-6||h>1)continue;x*=r/h;y*=r/h;z*=r/h;
  if(guard<A*2500&&pts.some(p=>(p[0]-x)**2+(p[1]-y)**2+(p[2]-z)**2<dmin*dmin))continue;pts.push([x,y,z]);}
 const sx=1-0.32*beta,sy=1+0.63*beta;pts.forEach(p=>{p[0]*=sx;p[2]*=sx;p[1]*=sy;});
 pts.sort((p,q)=>(q[0]**2+q[1]**2+q[2]**2)-(p[0]**2+p[1]**2+p[2]**2));
 const vp=Z-lastMagic(Z,[2,8,20,28,50,82,114,126]),vn=N-lastMagic(N,MAGIC),hv=$('#nVal').checked;
 const order=pts.map((_,i)=>i);const roles=new Array(pts.length);let ip=Z,ineu=N;
 if(hv){const outer=order.slice(0,Math.min(vp+vn,pts.length));let p=vp;outer.forEach(i=>{if(p>0&&(rnd()<vp/(vp+vn)||ineu-(vn)<=0)){roles[i]='vp';p--;ip--;}else{roles[i]='vn';ineu--;}});}
 const rest=order.filter(i=>!roles[i]);for(let k=rest.length-1;k>0;k--){const j=Math.floor(rnd()*(k+1));[rest[k],rest[j]]=[rest[j],rest[k]];}rest.forEach(i=>{if(ip>0){roles[i]='p';ip--;}else roles[i]='n';});
 const k=3.8/(1.2*Math.cbrt(300)),cols={p:0xde5f37,n:0x8c96a0,vp:0xffa66e,vn:0x6cc9be},gG=new THREE.SphereGeometry(0.82*k,16,12);
 ['p','n','vp','vn'].forEach(t=>{const idx=pts.map((_,i)=>i).filter(i=>roles[i]===t);if(!idx.length)return;const mat=new THREE.MeshPhongMaterial({color:cols[t],shininess:50});mat.onBeforeCompile=sh=>{sh.uniforms.uTime=JIG.uTime;sh.uniforms.uJig=JIG.uJig;sh.vertexShader='uniform float uTime;uniform float uJig;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec3 sd=instanceMatrix[3].xyz*13.0;transformed+=uJig*0.06*vec3(sin(uTime*3.1+sd.x),sin(uTime*2.7+sd.y*1.3),cos(uTime*3.3+sd.z*0.7));\n#endif');};const im=new THREE.InstancedMesh(gG,mat,idx.length);const M=new THREE.Matrix4();const base=idx.map(i=>new THREE.Vector3(pts[i][0]*k,pts[i][1]*k,pts[i][2]*k));base.forEach((v,j)=>{M.makeTranslation(v.x,v.y,v.z);im.setMatrixAt(j,M);});NG2.add(im);nInst.push(im);nBase.push(base);});
 const d=NUCD&&NUCD[Z+'-'+A],jp=predJP(Z,A),meas=d&&d[3]?d[3].replace(/[()]/g,''):'',jpU=jp&&jp.replace('−','-'),ok=jp&&meas&&(meas===jpU);
 const R=1.2*Math.cbrt(A),rho=A/(4/3*Math.PI*R**3);nucInfo={Z,A,N,beta,R,vp,vn};
 const name=(SYM[Z-1]&&Z<=118?NAMEZ(Z):NAMES[Z-1].split(' (')[0])+'-'+A;
 $('#nucRead').innerHTML='<div class="nm">'+name+'</div><div class="sub">'+Z+' protons + '+N+' neutrons'+(selIso&&selIso.pred?' · predicted isotope':'')+'</div><dl>'+
  '<dt>Radius</dt><dd>about '+R.toFixed(1)+' fm (1 fm = 10⁻¹⁵ m). Here your r = 4 circle ≈ '+(4/k).toFixed(1)+' fm.</dd><dt>Density</dt><dd>'+rho.toFixed(2)+' nucleons per fm³, about 2 × 10¹⁷ kg/m³: the same for almost every nucleus</dd>'+
  '<dt>Shape</dt><dd>'+(beta>0.05?'stretched like a rugby ball (deformation β ≈ '+beta.toFixed(2)+')':beta>0?'slightly deformed':'round')+'. Estimated from distance to magic numbers (Casten’s P = '+P.toFixed(1)+'; above about 4 means deformed).</dd>'+
  (d?'<dt>Binding</dt><dd>'+fE(d[0]*1e6,4)+' per nucleon</dd>'+(d[1]!=null?'<dt>Remove a neutron</dt><dd>'+fE(d[1]*1e6)+(d[1]<0?' (negative: past the neutron drip line)':'')+'</dd>':'')+(d[2]!=null?'<dt>Remove a proton</dt><dd>'+fE(d[2]*1e6)+(d[2]<0?' (negative: past the proton drip line)':'')+'</dd>':''):'')+
  '<dt>Valence</dt><dd>'+vp+' protons and '+vn+' neutrons beyond the last magic numbers (lighter colours)</dd>'+
  '<dt>Spin and parity</dt><dd>'+(jp?'shell model predicts '+jp:'odd–odd: two unpaired nucleons, so the simple model can’t pin it down')+(meas?'; measured '+meas.replace('-','−')+(jp?(ok?' ✓':' ✗'):''):'')+'</dd></dl>'+
  '<p class="note">Experiment: on '+SMACC.near[0]+' odd-mass isotopes near stability, this simple shell model gets spin and parity right '+Math.round(100*SMACC.near[1]/SMACC.near[0])+'% of the time ('+Math.round(100*SMACC.all[1]/SMACC.all[0])+'% across all '+SMACC.all[0]+'). Misses come mostly from deformed nuclei, where the levels reorder.</p>'+
  '<div class="key"><span><i style="background:#de5f37"></i>proton</span><span><i style="background:#8c96a0"></i>neutron</span><span><i style="background:#ffa66e"></i>valence proton</span><span><i style="background:#6cc9be"></i>valence neutron</span></div>';
 drawLevels(Z,N);drawBA(Z,A);simLabel();}
function drawLevels(Z,N){const need=Math.max(Z,N);let cum=0,nl=0;for(const l of LVL){nl++;cum+=l[2];if(cum>=need+8)break;}nl=Math.min(LVL.length,nl);
 const cumAt=i=>{let c=0;for(let j=0;j<=i;j++)c+=LVL[j][2];return c;},gap=i=>MAGIC.includes(cumAt(i));let ng=0;for(let i=0;i<nl;i++)if(gap(i))ng++;
 const step=14,gp=18,H=34+nl*step+ng*gp;$('#lvlBox').style.height=H+'px';const s=$('#lvlSvg'),W=s.clientWidth||320;
 const ys=[];let y=H-10;for(let i=0;i<nl;i++){ys.push(y);y-=step+(gap(i)?gp:0);}
 const col=W/2,dot=Math.max(2.5,Math.min(4.5,(col-62)/34));let o='';
 const side=(fill,x0,lab,c)=>{o+='<text x="'+(x0+col/2)+'" y="14" font-size="13" text-anchor="middle" fill="var(--ink)" font-weight="600">'+lab+'</text>';for(let i=0;i<nl;i++){const l=LVL[i],yy=ys[i];o+='<text x="'+(x0+4)+'" y="'+(yy+4)+'" font-size="11" fill="var(--mut)">'+l[0]+l[1]+'/2</text>';
  for(let k=0;k<l[2];k++){const cx=x0+46+k*(dot*2+1.2);if(cx>x0+col-8)break;o+='<circle cx="'+cx.toFixed(1)+'" cy="'+yy+'" r="'+dot+'" '+(k<fill[i]?'fill="'+c+'"':'fill="none" stroke="var(--line)"')+'/>';}
  if(gap(i))o+='<text x="'+(x0+col-8)+'" y="'+(yy-step/2-3)+'" font-size="11" text-anchor="end" fill="'+(isDark()?'#f0997b':'#a9401f')+'">gap → '+cumAt(i)+'</text>';}};
 side(shellFill(Z),0,'Protons ('+Z+')','#de5f37');side(shellFill(N),col,'Neutrons ('+N+')',isDark()?'#a9b2bb':'#6b747d');
 o+='<line x1="'+col+'" x2="'+col+'" y1="20" y2="'+H+'" stroke="var(--line)"/>';s.innerHTML=o;}
function drawBA(Z,A){const s=$('#baSvg'),W=s.clientWidth||320,H=s.clientHeight||220,pl=34,pr=10,pt=10,pb=26;if(!NUCD){s.innerHTML='<text x="10" y="20" font-size="13" fill="var(--mut)">Loading binding energies…</text>';return;}
 const X=a=>pl+a/250*(W-pl-pr),Y=v=>H-pb-(v/9.2)*(H-pt-pb);let o='';[0,3,6,9].forEach(v=>{o+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--line)" stroke-dasharray="2 4"/><text x="'+(pl-5)+'" y="'+(Y(v)+4)+'" font-size="11" text-anchor="end" fill="var(--mut)">'+v+'</text>';});
 [0,50,100,150,200,250].forEach(a=>{o+='<text x="'+X(a)+'" y="'+(H-8)+'" font-size="11" text-anchor="middle" fill="var(--mut)">'+a+'</text>';});
 STB.concat(PRIM).forEach(r=>{const d=NUCD[r[0]+'-'+r[1]];if(!d||r[1]<2)return;o+='<circle cx="'+X(r[1]).toFixed(1)+'" cy="'+Y(d[0]).toFixed(1)+'" r="2" fill="var(--acc)" fill-opacity="0.7"/>';});
 const pk=NUCD['28-62'];if(pk)o+='<text x="'+(X(62)+6)+'" y="'+(Y(pk[0])-6)+'" font-size="11" fill="var(--mut)">peak: nickel-62, iron-56</text>';
 const d=NUCD[Z+'-'+A];if(d&&A>1){const x=X(A),y=Y(d[0]);o+='<circle cx="'+x+'" cy="'+y+'" r="6" fill="none" stroke="var(--ink)" stroke-width="2"/><text x="'+(x>W*0.7?x-10:x+10)+'" y="'+(y+18)+'" font-size="12" font-weight="600" text-anchor="'+(x>W*0.7?'end':'start')+'" fill="var(--ink)">'+(SYM[Z-1]||'')+'-'+A+' · '+d[0].toFixed(2)+' MeV</text>';}
 o+='<text x="'+(W-pr)+'" y="'+(pt+10)+'" font-size="11" text-anchor="end" fill="var(--mut)">MeV per nucleon vs mass number</text>';s.innerHTML=o;}
$('#nVal').addEventListener('change',buildNuc);
const JIG={uTime:{value:0},uJig:{value:1}};function animNuc(t){JIG.uTime.value=t;JIG.uJig.value=$('#nJig').checked?1:0;}
function simLabel(){const L=$('#simLab');if(!L||!tab)return;let t='',sub='';const elName=z=>z?(z<=118?NAMEZ(z):NAMES[z-1].split(' (')[0]):'';
 if(mode==='nuc'&&nucInfo){t='Nucleus of '+elName(nucInfo.Z).toLowerCase()+'-'+nucInfo.A;sub=nucInfo.Z+' protons + '+nucInfo.N+' neutrons · about '+(2*nucInfo.R).toFixed(1)+' fm across';}
 else if(mode==='gpu'){const P=GPOT[gPotK];t='GPU solver: '+P.nm;sub=GS.states.length?(GS.view>=0?'state '+(GS.view+1)+' of '+GS.states.length+', energy '+fE(GS.states[GS.view].E*P.unit):''):'numerical solution on a 64³ grid';}
 else if(mode==='qmc'){const A=QMCA[Q.Z];t=A.nm+' ('+SYM[Q.Z-1]+', element '+Q.Z+') · all '+(A.cfg[0].length+A.cfg[1].length)+' electrons, Monte Carlo';sub=QMN[Q.m]+' · blue: spin up, orange: spin down';}
  else if(mode==='quark'){t='Inside a '+(nucT==='p'?'proton (up, up, down)':'neutron (up, down, down)');sub='quarks held by gluons · about 0.84 fm across';}
 else if(mode==='shell'){const el=sel||(sp==='real'?6:0);t=el?'Electron shells of '+elName(el).toLowerCase():'Electron shells';sub=el?'element '+el+' · '+(sp==='real'?'real size, carbon = 4':sp==='lin'?'even spacing':'hydrogen spacing'):'pick an element to fill them';}
 else if(pot==='nuc'){const o=nucOrb();t=orbName(n,l,m)+' nucleon orbital, '+(mode==='cloud'?'dot cloud':mode==='vol'?'GPU volume':'shape');sub='one proton or neutron in '+elName(o.Z).toLowerCase()+'-'+o.A+' · oscillator length b = '+o.b.toFixed(2)+' fm';}
 else{const x=exotic(),P=PART[part],ez=sel&&sel<=120?sel:x.Zc,cf=ez<=120?config(ez):null,sh=cf&&cf.list.find(q=>q.n===n&&q.l===l),cap=2*(2*l+1),occ=sh?sh.e:0;t=elName(ez)+' ('+SYM[ez-1]+', element '+ez+') · '+orbName(n,l,m)+' orbital, '+(mode==='cloud'?'dot cloud':mode==='vol'?'GPU volume':'shape');sub=(part==='e'&&cf?(occ?'the '+n+LET[l]+' subshell holds '+occ+' of '+cap+' electrons in '+elName(ez).toLowerCase()+' · ':'the '+n+LET[l]+' subshell is empty in '+elName(ez).toLowerCase()+'’s ground state · '):'')+(part==='e'?'one electron':'one '+P.nm)+' around '+(x.Zc===1?'a proton (hydrogen)':(/^[aeiou]/i.test(elName(x.Zc))?'an ':'a ')+elName(x.Zc).toLowerCase()+'-'+x.A+' nucleus, hydrogen-like')+'';}
 L.innerHTML='<b>'+t+'</b><span>'+sub+'</span>';}

const BEAMS=[[20,48,'calcium-48'],[22,50,'titanium-50'],[23,51,'vanadium-51'],[24,54,'chromium-54'],[26,58,'iron-58'],[28,64,'nickel-64'],[30,70,'zinc-70']];let BEAM=0,modelUsed=false;
