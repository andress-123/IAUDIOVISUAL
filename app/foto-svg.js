// Foto de retrato -> SVG pixel orgánico con paleta exacta (duotono/tritono por tono).
// Uso: node foto-svg.js entrada.ppm salida.svg esquema   (ppm: P6 8 bit, p.ej. convert foto.png -resize 600x -depth 8 x.ppm)
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
const C=3,N=W/C|0,M=H/C|0,SC=6;
// celdas
const cells=[];
for(let j=0;j<M;j++){cells.push([]);for(let i=0;i<N;i++){let sr=0,sg=0,sb=0,n=0;
 for(let y=j*C;y<j*C+C;y++)for(let x=i*C;x<i*C+C;x++){const c=px(x,y);sr+=c[0];sg+=c[1];sb+=c[2];n++}
 const q=lch(sr/n,sg/n,sb/n);cells[j].push({L:q.L,c:q.c,h:q.h,fig:true})}}
// fondo = cielo azul conectado a los bordes
const isSky=o=>o.h>=195&&o.h<290&&o.c>.04;
const st=[];const seen=[];for(let j=0;j<M;j++)seen.push(new Array(N).fill(false));
const push=(i,j)=>{if(i<0||j<0||i>=N||j>=M||seen[j][i]||!isSky(cells[j][i]))return;seen[j][i]=true;st.push([i,j])};
for(let i=0;i<N;i++){push(i,0);push(i,M-1)}for(let j=0;j<M;j++){push(0,j);push(N-1,j)}
while(st.length){const[i,j]=st.pop();cells[j][i].fig=false;push(i+1,j);push(i-1,j);push(i,j+1);push(i,j-1)}
// tono -> percentil dentro de la figura, con contraste y jitter orgánico
const Ls=[];cells.forEach(r=>r.forEach(o=>{if(o.fig)Ls.push(o.L)}));Ls.sort((a,b)=>a-b);
const pct=L=>{let lo=0,hi=Ls.length;while(lo<hi){const m=(lo+hi)>>1;if(Ls[m]<L)lo=m+1;else hi=m}return lo/Ls.length};
const grp=[];BANDS.forEach((b,k)=>grp.push({fam:b[0],lo:k?BANDS[k-1][1]:0,hi:b[1]}));
for(let j=0;j<M;j++)for(let i=0;i<N;i++){const o=cells[j][i];if(!o.fig)continue;
 const t0=pct(o.L);o.white=t0>.985;let t=Math.max(0,Math.min(.9999,t0+(rnd()-.5)*.05));
 let g=grp.find(g=>t<g.hi)||grp[grp.length-1];
 const u=Math.max(0,Math.min(.9999,(t-g.lo)/(g.hi-g.lo)));
 o.g=g.fam;o.c=FS[g.fam][Math.floor(u*8)]}
// cuadtree orgánico
const used=[];for(let j=0;j<M;j++)used.push(new Array(N).fill(false));
const campo=(i,j)=>{const x=i/N*6.28,y=j/M*6.28;return (Math.sin(x*1.3+1)+Math.sin(y*1.7+2)+Math.sin((x+y)*2.1)+Math.sin((x-y)*2.9+4)*.6+3.6)/7.2};
function tryBlock(i,j,s,tol){if(i+s>N||j+s>M)return null;const cnt={};let n=0;
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++){const b=cells[y][x];if(!b.fig||used[y][x]||b.white)return null;n++;cnt[b.c]=(cnt[b.c]||0)+1}
 let best=null,bn=0;for(const c in cnt)if(cnt[c]>bn){bn=cnt[c];best=c}
 let ok=0;
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++){const b=cells[y][x];const L=FS[b.g];if(b.c===best||(L.indexOf(best)>=0&&Math.abs(L.indexOf(b.c)-L.indexOf(best))<=1))ok++}
 return ok/n>=tol?best:null}
const rects=[];
for(const s of[16,8,4,2,1])for(let j=0;j<M;j+=s)for(let i=0;i<N;i+=s){
 if(s>1){const cv=campo(i,j);const cap=cv>.62?16:cv>.42?8:cv>.25?4:2;if(s>cap)continue}
 let c;if(s===1){const b=cells[j][i];if(!b.fig||used[j][i]||b.white)continue;let w=0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const nb=(cells[j+dj]||[])[i+di];if(!nb||!nb.fig||nb.white||(used[j+dj]&&used[j+dj][i+di]&&false))w++}if(w>=3)continue;c=b.c}else c=tryBlock(i,j,s,s>=8?.72:s>=4?.65:.55);
 if(!c)continue;
 for(let y=j;y<j+s;y++)for(let x=i;x<i+s;x++)used[y][x]=true;
 if(s>=4&&rnd()<.05)continue;
 rects.push({x:i,y:j,s,c})}
// partículas: mismo píxel, solo en zonas aleatorias junto al contorno
const edge=[];for(let j=1;j<M-1;j++)for(let i=1;i<N-1;i++){const o=cells[j][i];if(o.fig&&!o.white&&(!cells[j][i-1].fig||!cells[j-1][i].fig||!cells[j+1][i].fig||!cells[j][i+1].fig)&&i>3&&i<N-4&&j>3&&j<M-4)edge.push([i,j])}
const parts=[];
for(let z=0;z<9&&edge.length;z++){const[ei,ej]=edge[rnd()*edge.length|0];const r=12+rnd()*16;const col=cells[ej][ei].c;
 for(let j=Math.max(0,ej-r|0);j<Math.min(M,ej+r);j++)for(let i=Math.max(0,ei-r|0);i<Math.min(N,ei+r);i++){
  if(cells[j][i].fig||j>M-14)continue;const d=Math.hypot(i-ei,j-ej);if(d>r)continue;
  if(rnd()<.05*(1-d/r)){const q=rnd();parts.push({x:i,y:j,s:q<.4?2:q<.7?3:q<.88?5:8,c:col})}}}
const pad=SC*8,OW=N*SC,OH=M*SC;
const by={};rects.concat(parts).forEach(r=>(by[r.c]=by[r.c]||[]).push(r));
let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${OW+2*pad} ${OH+2*pad}" width="${OW+2*pad}" height="${OH+2*pad}" shape-rendering="crispEdges">\n<rect x="${-pad}" y="${-pad}" width="${OW+2*pad}" height="${OH+2*pad}" fill="#fff"/>\n`;
for(const c in by)svg+=`<g fill="${c}">`+by[c].map(r=>`<rect x="${r.x*SC}" y="${r.y*SC}" width="${r.s*SC}" height="${r.s*SC}"/>`).join('')+'</g>\n';
svg+='</svg>\n';fs.writeFileSync(process.argv[3],svg);
console.log(rects.length,'bloques',parts.length,'partículas',Object.keys(by).length,'colores');
