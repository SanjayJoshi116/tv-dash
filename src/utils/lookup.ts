// Own-key lookup for CSV-derived keys: a plain `map[key]` returns an inherited
// Object.prototype member for keys like 'constructor' / 'toString', skipping `??` fallbacks
export function lookup<T>(map: Record<string, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined
}
