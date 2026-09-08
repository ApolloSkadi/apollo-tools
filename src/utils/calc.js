/**
 * Minimal safe arithmetic evaluator for the ledger amount calculator.
 * Supports + - × ÷ (and * /), decimals, and unary minus. No eval().
 */

const isDigit = (c) => c >= '0' && c <= '9'

function tokenize(expr) {
  const s = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9.+\-*/]/g, '')
  const tokens = []
  let i = 0
  let prevWasOp = true
  let pendingMinus = 0

  const pushNum = (val) => {
    let value = val
    if (pendingMinus) value = -value
    pendingMinus = 0
    tokens.push({ type: 'num', value })
    prevWasOp = false
  }

  while (i < s.length) {
    const c = s[i]
    if (isDigit(c) || c === '.') {
      let num = ''
      while (i < s.length && (isDigit(s[i]) || s[i] === '.')) {
        num += s[i]
        i += 1
      }
      pushNum(Number(num))
    } else if (c === '+' || c === '-') {
      if (prevWasOp) {
        if (c === '-') pendingMinus = 1
        i += 1
      } else {
        tokens.push({ type: 'op', value: c })
        prevWasOp = true
        i += 1
      }
    } else if (c === '*' || c === '/') {
      tokens.push({ type: 'op', value: c })
      prevWasOp = true
      i += 1
    } else {
      i += 1
    }
  }
  return tokens
}

function applyOp(a, b, op) {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b === 0 ? NaN : a / b
    default: return NaN
  }
}

// Shunting-yard: precedence * / over + -
export function safeEvaluate(expr) {
  if (!expr) return null
  const tokens = tokenize(expr)
  if (!tokens.length) return null

  const values = []
  const ops = []
  const precedence = (op) => (op === '*' || op === '/') ? 2 : 1

  for (const token of tokens) {
    if (token.type === 'num') {
      values.push(token.value)
    } else if (token.type === 'op') {
      while (ops.length && precedence(ops[ops.length - 1]) >= precedence(token.value)) {
        const op = ops.pop()
        const b = values.pop()
        const a = values.pop()
        if (a === undefined || b === undefined) return null
        values.push(applyOp(a, b, op))
      }
      ops.push(token.value)
    }
  }

  while (ops.length) {
    const op = ops.pop()
    const b = values.pop()
    const a = values.pop()
    if (a === undefined || b === undefined) return null
    values.push(applyOp(a, b, op))
  }

  const result = values[0]
  if (result === undefined || Number.isNaN(result)) return null
  return Math.round(result * 100) / 100
}

export function formatAmount(value) {
  if (value == null || value === '') return ''
  return `${value}`
}
