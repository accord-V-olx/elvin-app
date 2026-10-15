// Run: node tests/smoke-furniture.mjs
// Synthetic orders only. This test intentionally reports missing production features.
import assert from "node:assert/strict";
import { buildWardrobe, buildTestPenal } from "../engine/wardrobe-engine.js";

const orders = [
  { id:"ELVIN-001", name:"Відкрита тумба", width:400, height:500, depth:350 },
  { id:"ELVIN-002", name:"Тумба з полицею", width:450, height:600, depth:400 },
  { id:"ELVIN-011", name:"Пенал відкритий", width:400, height:1500, depth:350 }
];
let failures=0;
for (const order of orders) {
  const result=buildWardrobe({project:{name:order.name,width_mm:order.width,height_mm:order.height,depth_mm:order.depth,furniture_type:"cabinet"}});
  try {
    assert.equal(result.status,"ASK","Incomplete production data must trigger ASK");
    assert.equal(result.ok,false);
    assert.equal(result.project.width,order.width);
    assert.equal(result.project.height,order.height);
    assert.equal(result.project.depth,order.depth);
    assert.ok(result.missing.length>0,"Must identify missing production fields");
    console.log("PASS",order.id,"dimensions and safe ASK",result.missing.map(x=>x.field).join(","));
  } catch(e) {failures++;console.error("FAIL",order.id,e.message);}
}
const demo=buildTestPenal();
try {
  assert.ok(Array.isArray(demo.parts)&&demo.parts.length>2);
  assert.equal(demo.bazis.productionReady,false);
  console.log("PASS DEMO: panel geometry exists; productionReady=false");
} catch(e) {failures++;console.error("FAIL DEMO",e.message);}
// Confirmed bottom-supported carcass must have exact, non-overlapping panel bounds.
const supported = buildWardrobe({
  projectName:"TEST-BOTTOM-SUPPORTED",width:600,height:2000,depth:500,
  material:"ДСП",materialThickness:18,
  sections:[{width_mm:600,depth_mm:500}],backPanel:"none",facades:"none",
  construction:{top_type:"inset",bottom_type:"full_width",support_type:"legs",
    side_panels:"on_bottom",plinth_height_mm:100}
});
try {
  assert.equal(supported.status,"GEOMETRY_INCOMPLETE");
  assert.equal(supported.bazis.script,null);
  assert.equal(supported.parts.length,4);
  const byId=Object.fromEntries(supported.parts.map(p=>[p.id,p]));
  assert.deepEqual([byId.bottom.x_mm,byId.bottom.z_mm,byId.bottom.size_x_mm],[0,100,600]);
  assert.deepEqual([byId.side_left.z_mm,byId.side_left.size_z_mm],[118,1864]);
  assert.deepEqual([byId.top.x_mm,byId.top.z_mm,byId.top.size_x_mm],[18,1982,564]);
  console.log("PASS bottom-supported carcass: four correct panels, export blocked until internals");
} catch(e) {failures++;console.error("FAIL bottom-supported carcass",e.message);}
// Explicit internal geometry: no automatic guessing of shelf locations.
const internals=buildWardrobe({
  projectName:"TEST-INTERNAL-PANELS",width:600,height:2000,depth:500,
  material:"ДСП",materialThickness:18,sections:[{width_mm:600,depth_mm:500}],
  backPanel:"none",facades:"none",construction:{top_type:"inset",bottom_type:"full_width",
    support_type:"legs",side_panels:"on_bottom",plinth_height_mm:100,
    internal_panels:[
      {id:"s1",type:"shelf",x_mm:18,y_mm:0,z_mm:800,width_mm:564,depth_mm:500,height_mm:18},
      {id:"v1",type:"partition",x_mm:291,y_mm:0,z_mm:818,width_mm:18,depth_mm:500,height_mm:1164}
    ]}
});
try {
  assert.equal(internals.status,"GEOMETRY_INCOMPLETE");
  assert.equal(internals.parts.length,6);
  assert.deepEqual(internals.parts.filter(p=>p.id.startsWith("internal_")).map(p=>p.id),["internal_s1","internal_v1"]);
  assert.equal(internals.bazis.script,null);
  console.log("PASS explicit shelf and partition geometry; export safely blocked");
} catch(e) {failures++;console.error("FAIL explicit internals",e.message);}
const invalid=buildWardrobe({
  projectName:"TEST-INVALID-INTERNAL",width:600,height:2000,depth:500,
  material:"ДСП",materialThickness:18,sections:[{width_mm:600,depth_mm:500}],
  backPanel:"none",facades:"none",construction:{top_type:"inset",bottom_type:"full_width",
    support_type:"legs",side_panels:"on_bottom",plinth_height_mm:100,
    internal_panels:[{id:"bad",type:"shelf",x_mm:18,y_mm:0,z_mm:800,width_mm:800,depth_mm:500,height_mm:18}]}
});
try {
  assert.equal(invalid.parts.length,4);
  assert.ok(invalid.missing.some(x=>x.field==="construction.internal_panels"));
  console.log("PASS invalid oversized shelf rejected");
} catch(e) {failures++;console.error("FAIL invalid internals",e.message);}
console.log("NOT VERIFIED: actual image AI analysis, real-order 3D completeness, BAZIS execution in BAZIS.");
if(failures)process.exitCode=1;
