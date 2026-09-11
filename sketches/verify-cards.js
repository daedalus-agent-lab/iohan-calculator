const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(__dirname + '/cards-what-if.html', 'utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

class Element {
  constructor(tag = 'div') { this.tag = tag; this.dataset = {}; this.children = []; this.textContent = ''; this.hidden = false; this.disabled = false; this._html = ''; this.listeners = {}; }
  set innerHTML(value) { this._html = value; }
  get innerHTML() { return this._html; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  closest() { return null; }
}
const elements = { plans: new Element(), 'plan-count': new Element(), 'test-output': new Element('pre') };
const document = {
  documentElement: { dataset: {} },
  getElementById(id) { return elements[id]; },
  querySelector() { return null; }
};
const context = {
  console, document, URLSearchParams, location: { search: '' }, Math, Number, Error,
  // browser string coercion must be available to the page.
  String, Object, Array, JSON
};
context.window = {};
vm.createContext(context);
vm.runInContext(script.replace(/\}\)\(\);\s*$/, 'window.__calculate = calculate; window.__render = render; window.__plans = () => plans.map(p => ({...p})); window.__select = id => { selectedId = id; render(); }; window.__branch = cloneForQuestion; })();'), context);
const calc = context.window.__calculate;
const plans = context.window.__plans;
const fail = message => { throw new Error('FAIL: ' + message); };
const equal = (actual, expected, label) => { if (actual !== expected) fail(label + ': expected ' + expected + ', got ' + actual); };
const row = (plan, expected) => {
  const got = calc(plan);
  for (const [key, value] of Object.entries(expected)) equal(got[key], value, `${plan.letter} ${key}`);
  console.log(`PASS ${plan.letter}: buy ${got.packsToBuy}; total ${got.total}; each ${got.each}; remainder ${got.remainder}`);
  return got;
};
const a = plans().find(p => p.id === 'a');
row(a, {packsToBuy: 1, total: 20, each: 6, remainder: 2, meetsMinimum: true});
context.window.__branch('a');
const afterB = plans();
const aAfterB = afterB.find(p => p.id === 'a');
row(aAfterB, {packsToBuy: 1, total: 20, each: 6, remainder: 2, meetsMinimum: true});
console.log('PASS negative: A unchanged after B was created');
const b = afterB.find(p => p.id === 'b');
row(b, {packsToBuy: 2, total: 28, each: 7, remainder: 0, meetsMinimum: true});
if (!(calc(b).each > b.minimum)) fail('B must exceed its minimum');
console.log('PASS negative: B produces 7, visibly intended above minimum 6');
context.window.__branch('b');
const afterC = plans();
const c = afterC.find(p => p.id === 'c');
row(c, {packsToBuy: 3, total: 24, each: 6, remainder: 0, meetsMinimum: true});
context.window.__select('a');
const afterSelect = plans();
row(afterSelect.find(p => p.id === 'b'), {packsToBuy: 2, total: 28, each: 7, remainder: 0, meetsMinimum: true});
row(afterSelect.find(p => p.id === 'c'), {packsToBuy: 3, total: 24, each: 6, remainder: 0, meetsMinimum: true});
console.log('PASS negative: selecting A does not alter B or C data');
const insufficient = calc({ stock: 0, guests: 2, minimum: 5, pack: 4, packsOverride: 1 });
row({ letter: 'T', stock: 0, guests: 2, minimum: 5, pack: 4, packsOverride: 1 }, {packsToBuy: 1, total: 4, each: 2, remainder: 0, meetsMinimum: false});
console.log('PASS negative: an insufficient plan is classified meetsMinimum=false for visible warning branch');
console.log('RESULT ALL ARITHMETIC AND STATE CHECKS PASSED');
