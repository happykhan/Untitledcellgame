const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(__dirname + '/../game.js', 'utf8').split('const config = {')[0];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const context = vm.createContext({
  window: { innerWidth: 1200, innerHeight: 800 },
  Phaser: { Scene: class {}, AUTO: 0, Scale: {}, Math: { Linear: (a,b,t) => a+(b-a)*t, Clamp: clamp, RadToDeg: a => a * 180 / Math.PI, Angle: { RotateTo: (a, b, step) => { const diff = Math.atan2(Math.sin(b-a), Math.cos(b-a)); return a + clamp(diff, -step, step); } } } },
});
vm.runInContext(code + '\nthis.GameScene = GameScene; this.drawDividingCell = drawDividingCell; this.PAL = PAL;', context);

function image(x=1600, y=1600) {
  const obj = {x, y, active: true, rotation: 0, setScale(n){this.scale=n;return this;}, destroy(){this.active=false;}, body: {velocity: {x:0,y:0}, setVelocity(x,y) {this.velocity={x,y};return this;}, setAcceleration(x,y) {this.acceleration={x,y}; return this;}, setCircle() {}}, setPosition(x,y) {this.x=x;this.y=y;return this;} };
  for(const method of ['setAlpha','setCollideWorldBounds','setBounce','setDamping','setDrag','setMaxVelocity','setDepth']) obj[method]=()=>obj;
  return obj;
}
function scene() {
  const s = new context.GameScene();
  Object.assign(s, {alive:true, dying:false, energy:175, fissioning:false, player:image(), activeGenes:new Set(['HSP','MEMBRANE']), daughters:[], divisionCount:0, fxGfx:{clear(){}}, hud:{notify(){}}, _updateGeneHUD(){}, tweens:{ add(config){s.lastTween=config;} }, physics:{add:{image,overlap(){}}} });
  return s;
}

test('division gates exactly at 150, freezes thrust and cannot be started twice', () => {
  const s=scene();s.energy=150;s._triggerFission();assert.equal(s.fissioning,false);
  s.energy=150.1;s.player.body.setVelocity(200,100);s._triggerFission();
  assert.equal(s.fissioning,true);assert.equal(s.player.body.velocity.x,0);assert.equal(s.player.body.acceleration.x,0);
  const tween=s.lastTween;s._triggerFission();assert.equal(s.lastTween,tween);
  assert.equal(tween.duration,1200);
});

test('division produces one daughter with independent inherited genes, recoil and energy reset', () => {
  const s=scene();s.player.rotation=Math.PI/2;const genes=s.activeGenes;
  s._triggerFission();s.lastTween.onComplete();
  assert.equal(s.daughters.length,1);assert.equal(s.divisionCount,1);assert.equal(s.energy,80);assert.equal(s.fissioning,false);assert.equal(s.activeGenes.size,0);
  const d=s.daughters[0];assert.deepEqual([...d.genes],[...genes]);assert.notEqual(d.genes,genes);
  assert.ok(d.x<s.player.x);assert.ok(Math.abs(d.y-s.player.y)<0.001);assert.ok(d.body.velocity.x<0);assert.ok(s.player.body.velocity.x>0);
});

test('division keeps both cell centres within the world at its edge', () => {
  const s=scene();s.player.setPosition(3199,1);s.player.rotation=Math.PI/2;s._triggerFission();s.lastTween.onComplete();
  for(const c of [s.player,...s.daughters]) {assert.ok(c.x>=20 && c.x<=3180);assert.ok(c.y>=20 && c.y<=3180);}
});

test('nutrient collection is idempotent, capped and animates toward the moving cell', () => {
  const s=scene();s.energy=190;const food={active:true,x:100,y:100,destroy(){this.active=false;}};
  let particle; s.add={image:(x,y)=>(particle=image(x,y))};s._eatFood(s.player,food);assert.equal(s.energy,200);assert.equal(s.feedGlow,1);
  const tween=s.lastTween;s._eatFood(s.player,food);assert.equal(s.lastTween,tween);
  tween.targets.progress=0.5;
  s.player.setPosition(200,300);tween.onUpdate();
  assert.equal(particle.x,150);assert.equal(particle.y,200);assert.ok(particle.scale<1);
  tween.onComplete();assert.equal(particle.active,false);
  assert.equal(tween.duration,260);
});

test('division membrane geometry stays finite throughout the pinch', () => {
  const coords=[];const g={};
  for(const method of ['beginPath','moveTo','lineTo','closePath','fillStyle','fillPath','lineStyle','strokePath','fillTriangle']) g[method]=(...args)=>coords.push(...args);
  for(const p of [0,0.25,0.5,0.75,1]) context.drawDividingCell(g,100,100,Math.PI/3,0.5,p,context.PAL.player);
  assert.ok(coords.length>1000);assert.ok(coords.every(Number.isFinite));
});
