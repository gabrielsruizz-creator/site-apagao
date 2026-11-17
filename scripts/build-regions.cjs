// Gera os centroides das regiões do IODA (lib/regions.js).
// Requer: api/region.topo.json (descompactado de https://api.ioda.inetintel.cc.gatech.edu/v2/topo/region),
// api/region.json (resumo de quedas por região) e topojson-client em ./w/node_modules.
const fs=require('fs');const topojson=require('./w/node_modules/topojson-client');
const t=JSON.parse(fs.readFileSync('api/region.topo.json')).data.topology;
const obj=t.objects['ne_10m_admin_1.regions'];
console.log(obj.geometries[0].properties, obj.geometries[0].id);
const fc=topojson.feature(t,obj);const out={};
for(const f of fc.features){ if(!f.geometry) continue;
  const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  // centroid of largest polygon's outer ring (area-weighted)
  let best=null,ba=-1;
  for(const p of polys){const r=p[0];let a=0,cx=0,cy=0;
    for(let i=0,j=r.length-1;i<r.length;j=i++){const k=r[j][0]*r[i][1]-r[i][0]*r[j][1];a+=k;cx+=(r[j][0]+r[i][0])*k;cy+=(r[j][1]+r[i][1])*k;}
    if(Math.abs(a)>ba){ba=Math.abs(a);best=a?[cy/(3*a),cx/(3*a)]:[r[0][1],r[0][0]];}}
  const id=f.properties.id ?? f.id;
  out[id]=[+best[0].toFixed(3),+best[1].toFixed(3)];}
fs.writeFileSync('regions-centroids.json',JSON.stringify(out));
console.log(Object.keys(out).length, fs.statSync('regions-centroids.json').size);
const reg=JSON.parse(fs.readFileSync('api/region.json')).data;
let hit=0;for(const r of reg){if(out[r.entity.code])hit++;} console.log('hit by code',hit,'/',reg.length);
let hit2=0;for(const r of reg){if(out[r.entity.attrs.ne_region_id])hit2++;} console.log('hit by ne',hit2);
const r0=reg[0];console.log(r0.entity.name,out[r0.entity.code]);
