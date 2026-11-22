// Small bounded variations in a test journey; not a CAPTCHA or bot-detection bypass.
export function randomBetween(min, max, random = Math.random) {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 0 || max < min) throw new RangeError('Invalid range');
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1) throw new RangeError('Invalid random value');
  return min + Math.floor(n * (max - min + 1));
}

export function categoryPath(available, scenario, random = Math.random) {
  if (!Number.isSafeInteger(available) || available < 0 || available > 1000 || !Number.isSafeInteger(scenario) || scenario < 0) throw new RangeError('Invalid scenario');
  const indices = Array.from({ length: available }, (_, i) => i);
  const visits = Math.min(available, 1 + scenario % 3);
  // Partial Fisher-Yates: sample distinct categories, in a varied order.
  for (let i = 0; i < visits; i++) {
    const j = randomBetween(i, available - 1, random);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, visits);
}
