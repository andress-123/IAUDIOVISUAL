// Foto -> 'nube de cuadros': silueta plana de un solo color que se deshace en cuadros sueltos, con huecos.
// Uso: node nube-svg.js entrada.ppm salida.svg familia [liso]   (ppm: P6 8 bit, p.ej. convert foto.png -resize 600x -depth 8 x.ppm)
const fs=require('fs');const Id=require('./engine.js');const F=Id.FAMILIES;
const buf=fs.readFileSync(process.argv[2]);
let p=0;const tok=()=>{while(buf[p]<=32)p++;let s='';while(buf[p]>32)s+=String.fromCharCode(buf[p++]);return s};
tok();const W=+tok(),H=+tok();tok();p++;
const px=(x,y)=>{x=Math.min(W-1,x|0);y=Math.min(H-1,y|0);const o=p+(y*W+x)*3;return[buf[o],buf[o+1],buf[o+2]]};
let sd=11;const rnd=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
const lin=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};
function lch(r,g,b){r=lin(r);g=lin(g);b=lin(b);
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 const L=.2104542553*l+.793617785*m-.0040720468*s,A=1.9779984951*l-2.428592205*m+.4505937099*s,B=.0259040371*l+.7827717662*m-.808675766*s;
 return{L,c:Math.hypot(A,B),h:(Math.atan2(B,A)*180/Math.PI+360)%360}}
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const FS={};for(const n of['blue','cyan','green','yellow','red'])FS[n]=F[n].steps.map(h=>({h,L:lch(...hx(h)).L})).sort((a,b)=>a.L-b.L).map(o=>o.h); // oscuro->claro
// esquemas: tramos de tono (0 oscuro..1 claro) -> familia
const ESQ={
 duoAzulNaranja:[['blue',.45],['yellow',1]],
 duoMagentaNaranja:[['red',.5],['yellow',1]],
 duoAzulMagenta:[['blue',.5],['red',1]],
 triAzulMagentaNaranja:[['blue',.3],['red',.62],['yellow',1]],
 triAzulVerdeNaranja:[['blue',.3],['green',.62],['yellow',1]],
 triAzulCianNaranja:[['blue',.35],['cyan',.65],['yellow',1]]
};
const BANDS=ESQ[process.argv[4]||'triAzulMagentaNaranja'];
const C=5,N=W/C|0,M=H/C|0,SC=10;
// celdas
const cells=[];
for(let j=0;j<M;j++){cells.push([]);for(let i=0;i<N;i++){let sr=0,sg=0,sb=0,n=0;
 for(let y=j*C;y<j*C+C;y++)for(let x=i*C;x<i*C+C;x++){const c=px(x,y);sr+=c[0];sg+=c[1];sb+=c[2];n++}
 const q=lch(sr/n,sg/n,sb/n);cells[j].push({L:q.L,c:q.c,h:q.h,fig:true})}}
// fondo = cielo azul conectado a los bordes
// fondo: 'cielo' (azul, por defecto) o 'liso' (color casi uniforme, estimado en el borde)
let bgL=0,bgA=0,bgB=0;
if(process.argv[5]==='liso'){let n=0;const add=o=>{bgL+=o.L;bgA+=o.c*Math.cos(o.h*Math.PI/180);bgB+=o.c*Math.sin(o.h*Math.PI/180);n++};
 for(let i=0;i<N;i++){add(cells[0][i]);add(cells[1][i])}for(let j=0;j<M;j++){add(cells[j][0]);add(cells[j][N-1])}bgL/=n;bgA/=n;bgB/=n}
const isSky=process.argv[5]==='liso'?(o=>Math.hypot(o.L-bgL,o.c*Math.cos(o.h*Math.PI/180)-bgA,o.c*Math.sin(o.h*Math.PI/180)-bgB)<.04):(o=>o.h>=195&&o.h<290&&o.c>.04);
const st=[];const seen=[];for(let j=0;j<M;j++)seen.push(new Array(N).fill(false));
const push=(i,j)=>{if(i<0||j<0||i>=N||j>=M||seen[j][i]||!isSky(cells[j][i]))return;seen[j][i]=true;st.push([i,j])};
for(let i=0;i<N;i++){push(i,0);push(i,M-1)}for(let j=0;j<M;j++){push(0,j);push(N-1,j)}
while(st.length){const[i,j]=st.pop();cells[j][i].fig=false;push(i+1,j);push(i-1,j);push(i,j+1);push(i,j-1)}

// color plano: un solo paso de la paleta
const FAM=process.argv[4]||'yellow';const COL=FS[FAM][+(process.argv[6]||5)]; // argv[6] ya no se usa: el degradado recorre los 8 pasos de la familia
const fig=(i,j)=>i>=0&&j>=0&&i<N&&j<M&&cells[j][i].fig;
// distancia con signo al contorno (celdas): + dentro, - fuera (chamfer 2 pasadas)
const D=[];for(let j=0;j<M;j++){D.push([]);for(let i=0;i<N;i++)D[j].push(fig(i,j)?1e3:-1e3)}
const dist=(sign)=>{const A=[];for(let j=0;j<M;j++){A.push([]);for(let i=0;i<N;i++)A[j].push((fig(i,j)===(sign>0))?1e3:0)}
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){let v=A[j][i];if(i>0)v=Math.min(v,A[j][i-1]+1);if(j>0)v=Math.min(v,A[j-1][i]+1);if(i>0&&j>0)v=Math.min(v,A[j-1][i-1]+1.4);if(i<N-1&&j>0)v=Math.min(v,A[j-1][i+1]+1.4);A[j][i]=v}
 for(let j=M-1;j>=0;j--)for(let i=N-1;i>=0;i--){let v=A[j][i];if(i<N-1)v=Math.min(v,A[j][i+1]+1);if(j<M-1)v=Math.min(v,A[j+1][i]+1);if(i<N-1&&j<M-1)v=Math.min(v,A[j+1][i+1]+1.4);if(i>0&&j<M-1)v=Math.min(v,A[j+1][i-1]+1.4);A[j][i]=v}return A};
const din=dist(1),dout=dist(-1); // din: distancia de una celda de figura al fondo; dout: de una celda de fondo a la figura
// ruido suave + ruido por celda
const sm=(i,j)=>(Math.sin(i*.25+1)+Math.sin(j*.29+2)+Math.sin((i+j)*.17)+Math.sin((i-j)*.21+3))/4;
const Ls=[];cells.forEach(r=>r.forEach(o=>{if(o.fig)Ls.push(o.L)}));Ls.sort((a,b)=>a-b);
const pct=L=>{let lo=0,hi=Ls.length;while(lo<hi){const m=(lo+hi)>>1;if(Ls[m]<L)lo=m+1;else hi=m}return lo/Ls.length};
const stp=[];for(let j=0;j<M;j++){stp.push([]);for(let i=0;i<N;i++)stp[j].push(fig(i,j)?Math.min(7,Math.floor(pct(cells[j][i].L)*8)):-1)}
const nearStep=(i,j)=>{let best=4,bd=1e9;for(let y=Math.max(0,j-9);y<=Math.min(M-1,j+9);y++)for(let x=Math.max(0,i-9);x<=Math.min(N-1,i+9);x++)if(stp[y][x]>=0){const d=(x-i)**2+(y-j)**2;if(d<bd){bd=d;best=stp[y][x]}}return best};
for(let j=0;j<M;j++)for(let i=0;i<N;i++)if(stp[j][i]<0)stp[j][i]=-2;
const cellsOn=[];
for(let j=0;j<M;j++){cellsOn.push([]);for(let i=0;i<N;i++){
 let on=false;
 if(fig(i,j)){const d=din[j][i];const dark=1-pct(cells[j][i].L);               // oscuro = lleno, claro = hueco: el tono dibuja el detalle
  const FL=+(process.argv[7]||.3);const base=FL+(1-FL)*Math.max(0,Math.min(1,(dark-.2)/.5));
  const edge=Math.min(1,(d+1.2+sm(i,j)*1.5)/3.5);
  const hb=(((i>>1)*73856093)^((j>>1)*19349663))>>>0;const rb=(hb%1000)/1000;on=(rnd()*.45+rb*.55)<base*edge;
  if(on&&base<.9&&rnd()<.04)on=false}
 else{const d=dout[j][i];if(d<9){on=rnd()<.2*Math.pow(1-d/9,1.6)*(.4+.9*Math.max(0,sm(i*.6,j*.6)+.5))}} // nube de cuadros fuera
 cellsOn[j].push(on)}}
// cuadros sueltos algo mayores (2x2) en la nube, y fusión de bloques interiores iguales
const rects=[];const used=[];for(let j=0;j<M;j++)used.push(new Array(N).fill(false));
for(const s of[4,2])for(let j=0;j+s<=M;j+=s)for(let i=0;i+s<=N;i+=s){
 let all=true;for(let y=j;y<j+s&&all;y++)for(let x=i;x<i+s;x++)if(!cellsOn[y][x]||used[y][x]){all=false;break}
 if(!all)continue;
 // bloques 2x2/4x4 completos solo en zonas elegidas al azar para variar el tamaño, no en todas
 if(rnd()>(s===4?.45:.1))continue;
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++)used[y][x]=true;rects.push({x:i,y:j,s})}
for(let j=0;j<M;j++)for(let i=0;i<N;i++)if(cellsOn[j][i]&&!used[j][i])rects.push({x:i,y:j,s:1});
let bx0=N,bx1=0,by0=M,by1=0;rects.forEach(r=>{bx0=Math.min(bx0,r.x);bx1=Math.max(bx1,r.x+r.s);by0=Math.min(by0,r.y);by1=Math.max(by1,r.y+r.s)});
const mg=3,vx=(bx0-mg)*SC,vy=(by0-mg)*SC,OW=(bx1-bx0+2*mg)*SC,OH=(by1-by0+2*mg)*SC;
const colorOf=r=>{let sum=0;for(let y=r.y;y<r.y+r.s;y++)for(let x=r.x;x<r.x+r.s;x++){const v=stp[y][x];sum+=v>=0?v:nearStep(x,y)}return FS[FAM][Math.max(0,Math.min(7,Math.round(sum/(r.s*r.s))))]};
const by={};rects.forEach(r=>(by[colorOf(r)]=by[colorOf(r)]||[]).push(r));
let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${OW} ${OH}" width="${OW}" height="${OH}" shape-rendering="crispEdges">\n<rect x="${vx}" y="${vy}" width="${OW}" height="${OH}" fill="#fff"/>\n`+Object.keys(by).map(c=>`<g fill="${c}">`+by[c].map(r=>`<rect x="${r.x*SC}" y="${r.y*SC}" width="${r.s*SC}" height="${r.s*SC}"/>`).join('')+'</g>\n').join('')+'</svg>\n';
fs.writeFileSync(process.argv[3],svg);console.log(rects.length,'cuadros',COL);
