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
console.log("NOT VERIFIED: actual image AI analysis, real-order 3D completeness, BAZIS execution in BAZIS.");
if(failures)process.exitCode=1;
