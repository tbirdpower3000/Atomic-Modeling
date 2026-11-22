// Checks the Monte Carlo solver against exact non-relativistic energies.
// Run: node tests/qmc.test.cjs
const {QMCA,qmcMake,qmcNew,qmcStep,qmcStats}=require('./qmc.cjs');
let fail=0;
for(const Z of [2,3]){const A=QMCA[Z],S=qmcNew(qmcMake(Z,A.cfg,Object.assign({},A.P.dmc,{jas:true})),400),tau=0.02/Z;
 for(let i=0;i<250;i++)qmcStep(S,0.05,false);for(let i=0;i<2500;i++){const r=qmcStep(S,tau,true);if(i>300)S.es.push(r[0]);}
 const [m,e]=qmcStats(S.es,100),ok=Math.abs(m-A.ref)<4*e+0.005;if(!ok)fail++;
 console.log(`${A.nm}: ${m.toFixed(4)} ± ${e.toFixed(4)} Ha (exact ${A.ref}) ${ok?'PASS':'FAIL'}`);}
process.exit(fail?1:0);
