// Gera o gazetteer de países e cidades (lib/places.js).
// Requer em ./w/node_modules: all-the-cities, topojson-client, world-atlas; e w/map.json (ISO numérico -> ISO2).
const fs=require('fs');const W='./w/node_modules/';
const cities=require(W+'all-the-cities');const topojson=require(W+'topojson-client');
const topo=require(W+'world-atlas/countries-110m.json');
const num2a2=JSON.parse(fs.readFileSync('w/map.json'));
const strip=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');
function cen(g){const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;let best,ba=-1;
 for(const p of polys){const r=p[0];let a=0,cx=0,cy=0;for(let i=0,j=r.length-1;i<r.length;j=i++){const k=r[j][0]*r[i][1]-r[i][0]*r[j][1];a+=k;cx+=(r[j][0]+r[i][0])*k;cy+=(r[j][1]+r[i][1])*k;}
 if(Math.abs(a)>ba){ba=Math.abs(a);best=[cy/(3*a),cx/(3*a)];}}return best.map(v=>+v.toFixed(2));}
const out=[];const seen=new Set();
const add=(name,lat,lng,cc,type)=>{const k=strip(name).toLowerCase();if(name.length<4&&!['Rio','EUA','USA','UAE','Oman','Peru','Iran','Iraq','Cuba','Chad','Mali','Togo','Laos','Fiji','Bali'].includes(name))return;if(seen.has(k))return;seen.add(k);out.push([name,lat,lng,cc,type]);};
const SKIP_C=new Set(['Georgia','Jordan','Chad','Turkey','Guinea','Geórgia','Jordânia','Chade','Jordania','Chile']);
// countries
const feats=topojson.feature(topo,topo.objects.countries).features;
const dn={};for(const l of ['en','pt-BR','es'])dn[l]=new Intl.DisplayNames([l],{type:'region'});
const extra={US:['EUA','Estados Unidos','United States','USA','U.S.','America'],GB:['UK','Reino Unido','Britain','England','Inglaterra'],KR:['South Korea','Coreia do Sul'],KP:['North Korea','Coreia do Norte'],AE:['UAE','Emirados Árabes'],CZ:['Czech Republic','Czechia'],RU:['Rússia','Russia'],NL:['Holanda','Netherlands'],CL:['Chile']};
for(const f of feats){const a2=num2a2[f.id];if(!a2)continue;const [lat,lng]=cen(f.geometry);
 const names=new Set([...Object.values(dn).map(d=>d.of(a2)),...(extra[a2]||[])]);
 for(const n of names){if(!n||SKIP_C.has(n)&&!(extra[a2]||[]).includes(n))continue;add(n,lat,lng,a2,'c');}}
// cities first by population (so bigger wins duplicates)
const SKIP=new Set(['Natal','Male','Victoria','Washington','Mobile','Reading','Nice','Hamilton','Kingston','Santiago de Querétaro','Mexico','Medina','Bandung','Florida','Sale','Ufa','Kota','Marka','Gaza','Asia','Hyderabad']);
const caps=cities.filter(c=>c.population>=600000||(c.featureCode==='PPLC'&&c.population>=100000)).sort((a,b)=>b.population-a.population);
for(const c of caps){if(SKIP.has(c.name))continue;const [lng,lat]=c.loc.coordinates;add(c.name,+lat.toFixed(2),+lng.toFixed(2),c.country,'city');}
const pt={'Nova York':'New York City','New York':'New York City','Londres':'London','Pequim':'Beijing','Moscou':'Moscow','Tóquio':'Tokyo','Nova Délhi':'New Delhi','Cidade do México':'Mexico City','Xangai':'Shanghai','Berlim':'Berlin','Varsóvia':'Warsaw','Bruxelas':'Brussels','Estocolmo':'Stockholm','Viena':'Vienna','Atenas':'Athens','Lisboa':'Lisbon','Teerã':'Tehran','Seul':'Seoul','Joanesburgo':'Johannesburg','Cidade do Cabo':'Cape Town','Havana':'Havana','Genebra':null,'Washington DC':'__DC','Washington, D.C.':'__DC','Santos':'__SANTOS','Porto de Santos':'__SANTOS','Silicon Valley':'__SV','Vale do Silício':'__SV','Kyiv':'Kyiv','Kiev':'Kyiv'};
const special={__DC:[38.9,-77.04,'US'],__SANTOS:[-23.96,-46.33,'BR'],__SV:[37.39,-122.08,'US']};
for(const [alias,target] of Object.entries(pt)){if(!target)continue;
 if(special[target]){const [la,ln,cc]=special[target];add(alias,la,ln,cc,'city');continue;}
 const c=out.find(o=>o[0]===target&&o[4]==='city');if(c)add(alias,c[1],c[2],c[3],'city');else console.log('miss',alias,target);}
fs.writeFileSync('places.json',JSON.stringify(out));console.log(out.length,fs.statSync('places.json').size, out.filter(o=>o[3]==='BR').slice(0,12).map(o=>o[0]).join(', '));
