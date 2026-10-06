const fs=require('fs');const Id=require('/home/user/IAUDIOVISUAL/app/engine.js');const F=Id.FAMILIES;
// Esquemas: familia de paleta para cada clase de color de la foto (mono/duo/tritono)
const ESQ={
 duoNaranja:{blue:'blue',green:'yellow',yellow:'yellow',orange:'yellow',pink:'yellow'},
 duoMagenta:{blue:'blue',green:'red',yellow:'red',orange:'red',pink:'red'},
 duoVerde:{blue:'blue',green:'green',yellow:'green',orange:'green',pink:'green'},
 triVerdeNaranja:{blue:'blue',green:'green',yellow:'yellow',orange:'yellow',pink:'yellow'},
 triNaranjaMagenta:{blue:'blue',green:'red',yellow:'yellow',orange:'yellow',pink:'red'},
 triVerdeMagenta:{blue:'blue',green:'green',yellow:'green',orange:'red',pink:'red'}
};
const SCHEME=ESQ[process.argv[4]||'triVerdeNaranja'];
const buf=fs.readFileSync(process.argv[2]);
let p=0;const tok=()=>{while(buf[p]<=32)p++;let s='';while(buf[p]>32)s+=String.fromCharCode(buf[p++]);return s};
tok();const W=+tok(),H=+tok();tok();p++;
const px=(x,y)=>{x=Math.min(W-1,x|0);y=Math.min(H-1,y|0);const o=p+(y*W+x)*3;return[buf[o],buf[o+1],buf[o+2]]};
// seeded rng
let sd=7;const rnd=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
// oklab
const lin=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};
function lch(r,g,b){r=lin(r);g=lin(g);b=lin(b);
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 const L=.2104542553*l+.793617785*m-.0040720468*s,A=1.9779984951*l-2.428592205*m+.4505937099*s,B=.0259040371*l+.7827717662*m-.808675766*s;
 return{L,c:Math.hypot(A,B),h:(Math.atan2(B,A)*180/Math.PI+360)%360}}
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const famSorted=n=>F[n].steps.map(h=>({h,L:lch(...hx(h)).L})).sort((a,b)=>a.L-b.L).map(o=>o.h); // dark->light
const FS={blue:famSorted('blue'),cyan:famSorted('cyan'),green:famSorted('green'),yellow:famSorted('yellow'),red:famSorted('red')};
// circle from non-white bbox
let x0=W,x1=0,y0=H,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=px(x,y);if(c[0]<238||c[1]<238||c[2]<238){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}}
const cx=(x0+x1)/2,cy=(y0+y1)/2,R=Math.min(x1-x0,y1-y0)/2;
const C=3,N=W/C|0,SC=6; // cells
// classify cells
function cls(r,g,b){const q=lch(r,g,b);let k;
 if(q.c<.045)k='blue';else if(q.h>=195&&q.h<275)k='blue';
 else if(q.h>=112&&q.h<195)k='green';else if(q.h>=84&&q.h<112)k='yellow';
 else if(q.h>=38&&q.h<84)k='orange';else k='pink';
 return{k,L:q.L}}
const cells=[];const Ls={};
for(let j=0;j<N;j++){cells.push([]);for(let i=0;i<N;i++){
 let sr=0,sg=0,sb=0,n=0;
 for(let y=j*C;y<j*C+C;y++)for(let x=i*C;x<i*C+C;x++){const c=px(x,y);sr+=c[0];sg+=c[1];sb+=c[2];n++}
 const mx=(i+.5)*C-cx,my=(j+.5)*C-cy,d=Math.hypot(mx,my);
 if(d>R*.985){cells[j].push(null);continue}
 const o=cls(sr/n,sg/n,sb/n);o.d=d;o.g=SCHEME[o.k];cells[j].push(o);(Ls[o.g]=Ls[o.g]||[]).push(o.L)}}
for(const k in Ls)Ls[k].sort((a,b)=>a-b);
const pct=(k,L)=>{const a=Ls[k];let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;if(a[m]<L)lo=m+1;else hi=m}return lo/a.length};
function color(o){const t=pct(o.g,o.L);let s;
 if(o.k==='blue'&&o.g==='blue'&&t>.97)s=FS.cyan[Math.min(7,Math.floor((t-.97)/.03*3))];
 else s=FS[o.g][Math.min(7,Math.floor(t*8))];
 return s}
for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(cells[j][i])cells[j][i].c=color(cells[j][i]);
// quadtree orgánico: tamaños 32..2 celdas según un campo de ruido
const rects=[];const used=[];for(let j=0;j<N;j++)used.push(new Array(N).fill(false));
const campo=(i,j)=>{const x=i/N*6.28,y=j/N*6.28;return (Math.sin(x*1.3+1)+Math.sin(y*1.7+2)+Math.sin((x+y)*2.1)+Math.sin((x-y)*2.9+4)*.6+3.6)/7.2};
const fam=k=>k==='orange'||k==='yellow'?'yellow':k==='pink'?'red':k;
function tryBlock(i,j,s,tol){if(i+s>N||j+s>N)return null;const cnt={};let n=0,allBlue=true;
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++){const b=cells[y][x];if(!b||used[y][x])return null;if(b.k!=='blue')allBlue=false;n++}
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++){const b=cells[y][x];cnt[b.c]=(cnt[b.c]||0)+1}
 let best=null,bn=0;for(const c in cnt)if(cnt[c]>bn){bn=cnt[c];best=c}
 let ok=0;const fb=cells[j][i];
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++){const b=cells[y][x];const L=FS[b.g];
  if(b.c===best||(L.indexOf(best)>=0&&Math.abs(L.indexOf(b.c)-L.indexOf(best))<=1))ok++}
 return ok/n>=(allBlue?tol[0]:tol[1])?{c:best,k:cells[j][i].k}:null}
for(const s of[32,16,8,4,2,1])for(let j=0;j<N;j+=s)for(let i=0;i<N;i+=s){
 if(s>1){const cap=campo(i,j)>.62?32:campo(i,j)>.42?16:campo(i,j)>.25?8:campo(i,j)>.12?4:2;if(s>cap)continue}
 let r;if(s===1){const b=cells[j][i];if(!b||used[j][i])continue;r={c:b.c,k:b.k}}else r=tryBlock(i,j,s,s>=8?[.65,.78]:s>=4?[.55,.7]:[.5,.6]);
 if(!r)continue;
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++)used[y][x]=true;
 if(s>=4&&rnd()<.06)continue;
 rects.push({x:i,y:j,s,c:r.c,k:r.k})}
// partículas: mismas celdas, solo en zonas aleatorias fuera del disco
const parts=[];const nz=5;const zones=[];for(let z=0;z<nz;z++)zones.push({a:rnd()*Math.PI*2,w:.35+rnd()*.35});
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const mx=(i+.5)*C-cx,my=(j+.5)*C-cy,d=Math.hypot(mx,my);
 if(d<R*.985||d>R*1.3)continue;const ang=Math.atan2(my,mx);
 let inz=false;for(const z of zones){let da=Math.abs(((ang-z.a+Math.PI*3)%(Math.PI*2))-Math.PI);da=Math.PI-da;if(da<z.w/2)inz=true}
 if(!inz)continue;const f=(d-R*.985)/(R*.3);
 if(rnd()<.11*(1-f)*(1-f)){ // color de la celda interior más cercana
  const ni=Math.round(cx/C+(mx/d)*(R*.93/C)-.5),nj=Math.round(cy/C+(my/d)*(R*.93/C)-.5);
  const src=cells[Math.max(0,Math.min(N-1,nj))][Math.max(0,Math.min(N-1,ni))];if(src)parts.push({x:i,y:j,s:(()=>{const q=rnd();return q<.4?2:q<.7?3:q<.88?5:8})(),c:src.c})}}
const OUT=N*SC,pad=SC*6;
const all=rects.concat(parts);const by={};all.forEach(r=>(by[r.c]=by[r.c]||[]).push(r));
let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${OUT+2*pad} ${OUT+2*pad}" width="1200" height="1200" shape-rendering="crispEdges">\n<rect x="${-pad}" y="${-pad}" width="${OUT+2*pad}" height="${OUT+2*pad}" fill="#fff"/>\n`;
for(const c in by)svg+=`<g fill="${c}">`+by[c].map(r=>`<rect x="${r.x*SC}" y="${r.y*SC}" width="${r.s*SC}" height="${r.s*SC}"/>`).join('')+'</g>\n';
svg+='</svg>\n';fs.writeFileSync(process.argv[3],svg);
console.log(rects.length,'bloques',parts.length,'particulas',Object.keys(by).length,'colores',Object.keys(Ls).map(k=>k+':'+Ls[k].length).join(' '));
