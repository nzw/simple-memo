// Inline calculator for the preview: a line that is only an expression
// ("12*3+4", "=100/3", "(1+2)*3 =") gets its result shown next to it.
// A small recursive-descent parser: no eval / Function (blocked by the extension CSP anyway).
const MemoCalc = (() => {
  const ALLOWED = /^[0-9+\-*/%^().,\s×÷=]+$/;

  const parse = (src) => {
    let pos = 0;
    const peek = () => src[pos];
    const skip = () => { while (src[pos] === ' ') pos += 1; };
    const fail = () => { throw new Error('syntax'); };

    // expr := term (('+' | '-') term)*
    const expr = () => {
      let value = term();
      for (skip(); peek() === '+' || peek() === '-'; skip()) {
        let op = src[pos++];
        let rhs = term();
        value = op === '+' ? value + rhs : value - rhs;
      }
      return value;
    };

    // term := unary (('*' | '/' | '%') power)*
    const term = () => {
      let value = unary();
      for (skip(); peek() === '*' || peek() === '/' || peek() === '%'; skip()) {
        let op = src[pos++];
        let rhs = unary();
        value = op === '*' ? value * rhs : op === '/' ? value / rhs : value % rhs;
      }
      return value;
    };

    // power := atom ('^' unary)?   (right-associative; "-2^2" is -(2^2), "2^-1" is 0.5)
    const power = () => {
      let base = atom();
      skip();
      if (peek() === '^') {
        pos += 1;
        return Math.pow(base, unary());
      }
      return base;
    };

    const unary = () => {
      skip();
      if (peek() === '-') { pos += 1; return -unary(); }
      if (peek() === '+') { pos += 1; return unary(); }
      return power();
    };

    const atom = () => {
      skip();
      if (peek() === '(') {
        pos += 1;
        let value = expr();
        skip();
        if (peek() !== ')') fail();
        pos += 1;
        return value;
      }
      let match = /^(?:\d+\.?\d*|\.\d+)/.exec(src.slice(pos));
      if (!match) fail();
      pos += match[0].length;
      return Number(match[0]);
    };

    let result = expr();
    skip();
    if (pos !== src.length) fail();
    return result;
  };

  const format = (value) => {
    if (!Number.isFinite(value)) return null;
    if (Math.abs(value) >= 1e15 || (value !== 0 && Math.abs(value) < 1e-9)) return value.toPrecision(10).replace(/\.?0+(e|$)/, '$1');
    return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
  };

  // Returns the result text for a line, or null when the line is not a calculation.
  const line = (text) => {
    let s = text.trim();
    if (!s || !ALLOWED.test(s) || !/\d/.test(s)) return null;
    // Markdown list items ("- 3 + 4", "* 5") are text, not calculations.
    if (/^[-*+]\s/.test(s)) return null;

    let marked = false;
    if (s.startsWith('=')) { marked = true; s = s.slice(1); }
    else if (s.endsWith('=')) { marked = true; s = s.slice(0, -1); }
    if (s.includes('=')) return null;

    // Commas are thousands separators ("1,000 + 2,500"); a comma next to a space
    // or a bare decimal comma is not an expression.
    if (/,/.test(s) && !/^[\d,\s+\-*/%^().×÷]+$/.test(s)) return null;
    if (/,(?!\d{3}(?!\d))/.test(s)) return null;
    s = s.replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/').trim();
    if (!s) return null;

    // Without an "=" marker the line must really have an operator, and must not
    // look like a date or a phone number ("2026-10-06", "03-1234-5678").
    if (!marked) {
      if (!/[+\-*/%^]/.test(s.replace(/^[-+]/, ''))) return null;
      if (/^\d+(-\d+)+$/.test(s)) return null;
      // ... or a slash date / fraction ("2026/10/06", "10/6"); "= 10/6" still calculates.
      if (/^\d+(\/\d+)+$/.test(s)) return null;
    }

    try {
      return format(parse(s));
    } catch (e) {
      return null;
    }
  };

  return { line };
})();
