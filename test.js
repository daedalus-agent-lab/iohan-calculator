const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function makeEl(id) {
  const el = {
    id, textContent: '', value: '21', disabled: false, hidden: false,
    children: [], offsetWidth: 0,
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (f) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); },
    },
    _listeners: {},
    addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    appendChild(ch) { this.children.push(ch); },
  };
  Object.defineProperty(el, 'className', {
    get() { return Array.from(el.classList._s).join(' '); },
    set(v) {
      el.classList._s.clear();
      String(v || '').split(/\s+/).filter(Boolean).forEach(c => el.classList._s.add(c));
    },
  });
  let _html = '';
  Object.defineProperty(el, 'innerHTML', {
    get() { return _html; },
    set(v) { _html = v; if (v === '') el.children = []; }, // model browser: innerHTML="" clears children
  });
  return el;
}
const IDS = ['curPool','curRecip','curEach','curRel','curPoolTok','target','apply','fork','forkTarget',
  'wayA','wayADesc','wayAPool','wayACost','wayARel','pickA',
  'wayB','wayBDesc','wayBPool','wayBCost','wayBRel','pickB',
  'cancel','undo','historyList','goalEcho','targetErr'];

function freshRun() {
  const els = {};
  IDS.forEach(id => els[id] = makeEl(id));
  const document = { getElementById: (id) => els[id], createElement: (tag) => makeEl('li') };
  new Function('document', script)(document);
  return els;
}
function click(els, id) { (els[id]._listeners['click'] || []).forEach(f => f()); }
function fireInput(els, id) { (els[id]._listeners['input'] || []).forEach(f => f()); }
function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else { console.log('ok: ' + msg); } }
function scene(e) { return e.curPool.textContent + '/' + e.curRecip.textContent + '/' + e.curEach.textContent; }
// Count token spans in a pool container (piles -> children with class "tok").
function countTokens(container) {
  var n = 0;
  for (var i = 0; i < container.children.length; i++){
    var pile = container.children[i];
    for (var j = 0; j < pile.children.length; j++){
      if (pile.children[j].classList.contains('tok')) n++;
    }
  }
  return n;
}

// ---- Base: 84/3=28 ----
let e = freshRun();
assert(scene(e) === '84/3/28', 'base scene 84/3/28');
assert(e.curRel.textContent === '3 × 28 = 84', 'base relation');

// ---- Run 1: target 21 -> fork -> pick A ----
e = freshRun();
e.target.value = '21'; click(e, 'apply');
assert(e.fork.hidden === false, 'R1 fork visible');
assert(e.wayACost.textContent.includes('+1'), 'R1 wayA cost +1 person: ' + e.wayACost.textContent);
assert(e.wayARel.textContent === '4 × 21 = 84', 'R1 wayA relation 4×21=84');
assert(e.wayBCost.textContent.includes('−21'), 'R1 wayB cost -21 units: ' + e.wayBCost.textContent);
assert(e.wayBRel.textContent === '3 × 21 = 63', 'R1 wayB relation 3×21=63');
click(e, 'pickA');
assert(scene(e) === '84/4/21', 'R1 after pickA scene 84/4/21');
assert(e.fork.hidden === true, 'R1 fork hidden after pick');
assert(e.historyList.children.length === 1, 'R1 history has 1 entry');

// ---- BUG 1: show fork, edit target WITHOUT pressing show, then pick A -> fork invalidated, scene unchanged ----
e = freshRun();
e.target.value = '21'; click(e, 'apply');           // fork shown for 21
e.target.value = '7'; fireInput(e, 'target');       // edit field, no show
assert(e.fork.hidden === true, 'B1 fork invalidated after editing target');
click(e, 'pickA');
assert(scene(e) === '84/3/28', 'B1 pickA after invalidation does nothing (scene unchanged)');
assert(e.undo.disabled === true, 'B1 no history after stale pick (undo disabled)');

// ---- BUG 2: strict integer validation ----
e = freshRun();
e.target.value = '21.9'; click(e, 'apply');
assert(e.fork.hidden === true && e.targetErr.textContent !== '', 'B2 "21.9" rejected (has fraction): ' + e.targetErr.textContent);
e.target.value = '1e2'; click(e, 'apply');
assert(e.fork.hidden === true && e.targetErr.textContent !== '', 'B2 "1e2" rejected (exponent): ' + e.targetErr.textContent);
e.target.value = '0'; click(e, 'apply');
assert(e.fork.hidden === true && e.targetErr.textContent !== '', 'B2 "0" rejected');
e.target.value = '  '; click(e, 'apply');
assert(e.fork.hidden === true && e.targetErr.textContent !== '', 'B2 empty rejected');
e.target.value = '-5'; click(e, 'apply');
assert(e.fork.hidden === true && e.targetErr.textContent !== '', 'B2 "-5" rejected (sign)');
// valid integer still works
e.target.value = '21'; click(e, 'apply');
assert(e.fork.hidden === false, 'B2 valid "21" shows fork');

// ---- BUG 3: real undo + history ----
e = freshRun();
e.target.value = '21'; click(e, 'apply'); click(e, 'pickA');   // -> 84/4/21, history[0]=84/3
assert(scene(e) === '84/4/21', 'B3 after pickA 84/4/21');
click(e, 'undo');
assert(scene(e) === '84/3/28', 'B3 undo restores 84/3/28');
assert(e.undo.disabled === true, 'B3 history empty after undo (undo disabled)');
// two-step history: pickA then (re-show) pickB
e = freshRun();
e.target.value = '21'; click(e, 'apply'); click(e, 'pickA');   // 84/4/21
e.target.value = '21'; click(e, 'apply'); click(e, 'pickB');   // from 84/4 -> wayB: 21*4=84 -> 84/4/21 (no change) 
assert(e.historyList.children.length === 2, 'B3 two history entries');
click(e, 'undo');
assert(scene(e) === '84/4/21', 'B3 undo back to post-pickA scene 84/4/21');
assert(e.historyList.children.length === 1, 'B3 one history entry after undo');

// ---- BUG 4: descriptions derive from CURRENT scene (not hardcoded) ----
e = freshRun();
e.target.value = '21'; click(e, 'apply'); click(e, 'pickA');   // scene now 84/4/21
e.target.value = '21'; click(e, 'apply');
assert(e.wayBDesc.textContent.includes('4'), 'B4 wayB desc references current recipients 4: ' + e.wayBDesc.textContent);
assert(e.wayACost.textContent.includes('без изменений') || e.wayACost.textContent.includes('0'), 'B4 wayA cost no-change (already 4 people): ' + e.wayACost.textContent);
// verify the "keep" value is the current scene, not 84/3
e = freshRun();
e.target.value = '21'; click(e, 'apply'); click(e, 'pickB');   // scene now 63/3/21
e.target.value = '21'; click(e, 'apply');
assert(e.wayADesc.textContent.includes('63'), 'B4 wayA desc references current pool 63: ' + e.wayADesc.textContent);

// ---- Discrete edge: target 25 -> wayA invalid, wayB valid (75) ----
e = freshRun();
e.target.value = '25'; click(e, 'apply');
assert(e.pickA.disabled === true, 'E wayA disabled for 84/25');
assert(e.pickB.disabled === false, 'E wayB valid');
assert(e.wayBRel.textContent === '3 × 25 = 75', 'E wayB relation 3×25=75');
assert(e.wayBCost.textContent.includes('−9'), 'E wayB cost -9 units: ' + e.wayBCost.textContent);
click(e, 'pickB');
assert(scene(e) === '75/3/25', 'E after pickB 75/3/25');

// ---- cancel does not mutate ----
e = freshRun();
e.target.value = '21'; click(e, 'apply'); click(e, 'cancel');
assert(e.fork.hidden === true && scene(e) === '84/3/28' && e.undo.disabled === true, 'C cancel leaves scene unchanged, no history');

// ---- BUG 5: bounded visualization — a million-unit fork must not spawn a million nodes ----
e = freshRun();
e.target.value = '1000000'; click(e, 'apply');
assert(e.fork.hidden === false, 'B5 fork shown for 1000000');
assert(e.pickB.disabled === false, 'B5 wayB valid (3 × 1000000 = 3000000)');
assert(e.wayBRel.textContent === '3 × 1000000 = 3000000', 'B5 wayB relation exact');
var nTok = countTokens(e.wayBPool);
assert(nTok > 0 && nTok <= 1200, 'B5 wayB token nodes bounded (<=1200), got ' + nTok);
assert(e.pickA.disabled === true, 'B5 wayA invalid (84 does not divide 1000000)');

// ---- BUG 6: product overflow — Number.isInteger(MAX_SAFE_INTEGER * 3) is true, but inexact ----
e = freshRun();
e.target.value = '9007199254740991'; click(e, 'apply');
assert(e.fork.hidden === false, 'B6 fork shown (target itself is a safe integer)');
assert(e.pickB.disabled === true, 'B6 wayB disabled: 3 × MAX_SAFE_INTEGER is not a safe integer');
assert(e.wayBDesc.textContent.indexOf('точной целочисленной') !== -1, 'B6 overflow explained: ' + e.wayBDesc.textContent);
assert(e.pickA.disabled === true, 'B6 wayA disabled (84 / MAX_SAFE_INTEGER is not an integer)');

console.log(process.exitCode ? '\nSOME TESTS FAILED' : '\nALL v3 TESTS PASSED');
