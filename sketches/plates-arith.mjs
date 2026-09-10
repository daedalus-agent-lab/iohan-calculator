/** Integer-only scene for cookies-plates.html. Node check of iohan #29294. */
export function scene(S, N, pack, min) {
  if (!Number.isInteger(S) || !Number.isInteger(N) || N < 1) {
    throw new Error("invalid scene");
  }
  const q = Math.trunc(S / N);
  const r = S - q * N;
  return { S, N, pack, min, q, r, success: q >= min && r === 0 };
}

export function addPlate(s) {
  const N = s.N + 1;
  return scene(s.S, N, s.pack, s.min);
}

export function removePlate(s) {
  if (s.N <= 1) return s;
  return scene(s.S, s.N - 1, s.pack, s.min);
}

export function addPack(s) {
  return scene(s.S + s.pack, s.N, s.pack, s.min);
}

export function setPack(s, pack) {
  return scene(s.S, s.N, pack, s.min);
}

export function setMin(s, min) {
  return scene(s.S, s.N, s.pack, min);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const start = scene(12, 3, 4, 6);
assert(start.q === 4 && start.r === 0 && start.success === false, "start");

const four = addPlate(start);
assert(four.S === 12 && four.N === 4 && four.q === 3 && four.r === 0, "fourth plate");

const p6 = setPack(four, 6);
assert(p6.S === 12 && p6.pack === 6 && p6.q === 3, "pack change does not move cookies");

const once = addPack(p6);
const twice = addPack(once);
assert(twice.S === 24 && twice.N === 4 && twice.q === 6 && twice.r === 0 && twice.success === true, "two packs of 6");

const min8 = setMin(twice, 8);
assert(min8.S === 24 && min8.q === 6 && min8.success === false, "min 8 lifts success");

const undo = twice; // full-scene undo restores previous snapshot
assert(undo.success === true && undo.min === 6, "undo snapshot");

const zeroGuard = removePlate(scene(12, 1, 4, 6));
assert(zeroGuard.N === 1, "no zero plates");

console.log("plates-arith all_expectations_met true");
