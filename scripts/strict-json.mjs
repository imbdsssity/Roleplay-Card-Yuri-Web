// JSON.parse alone discards duplicate keys and can round distinct numbers to the
// same value. Refuse either ambiguity before comparing parsed objects.
function checkJsonAmbiguity(text) {
  let i = 0;
  const numberPattern = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  const ws = () => { while (/[\x20\t\r\n]/.test(text[i] || '')) i++; };
  const str = () => {
    const start = i++;
    while (i < text.length) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i++] === '"') return JSON.parse(text.slice(start, i));
    }
    throw Error('invalid-json');
  };
  const normalized = token => {
    let s = token.toLowerCase(), negative = s.startsWith('-');
    if (negative) s = s.slice(1);
    const [mantissa, exp = '0'] = s.split('e'), [whole, frac = ''] = mantissa.split('.');
    let digits = (whole + frac).replace(/^0+/, '');
    if (!digits) return '0';
    if (exp.replace(/^[+-]/, '').length > 6) throw Error('ambiguous-json-number');
    let power = BigInt(exp) - BigInt(frac.length);
    const trailing = digits.match(/0+$/)?.[0].length || 0;
    if (trailing) { digits = digits.slice(0, -trailing); power += BigInt(trailing); }
    return `${negative ? '-' : ''}${digits}e${power}`;
  };
  const value = depth => {
    if (depth > 512) throw Error('json-too-deep');
    ws();
    if (text[i] === '{') {
      i++; ws(); const keys = new Set();
      if (text[i] === '}') { i++; return; }
      while (true) {
        ws(); const key = str();
        if (keys.has(key)) throw Error('duplicate-json-key');
        keys.add(key); ws(); i++; value(depth + 1); ws();
        if (text[i++] === '}') return;
      }
    }
    if (text[i] === '[') {
      i++; ws(); if (text[i] === ']') { i++; return; }
      while (true) { value(depth + 1); ws(); if (text[i++] === ']') return; }
    }
    if (text[i] === '"') { str(); return; }
    if (text.startsWith('true', i)) { i += 4; return; }
    if (text.startsWith('false', i)) { i += 5; return; }
    if (text.startsWith('null', i)) { i += 4; return; }
    numberPattern.lastIndex = i;
    const match = numberPattern.exec(text);
    if (!match) throw Error('invalid-json');
    const token = match[0], number = Number(token); i += token.length;
    if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number)) || normalized(token) !== normalized(String(number))) throw Error('ambiguous-json-number');
  };
  value(0); ws(); if (i !== text.length) throw Error('invalid-json');
}

export function parseStrictJson(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw Error('invalid-json'); }
  checkJsonAmbiguity(text);
  return parsed;
}
