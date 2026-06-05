#!/usr/bin/env node

const REDACTION_PATTERNS = [
  [/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]'],
  [/sk-proj-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]'],
  [/sk-ant-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]'],
  [/AIza[a-zA-Z0-9_-]{30,}/g, '[REDACTED_API_KEY]'],
  [/ghp_[a-zA-Z0-9]{36,}/g, '[REDACTED_TOKEN]'],
  [/gho_[a-zA-Z0-9]{36,}/g, '[REDACTED_TOKEN]'],
  [/github_pat_[a-zA-Z0-9_]{20,}/g, '[REDACTED_TOKEN]'],
  [/ANTHROPIC_API_KEY=[^\s]+/g, 'ANTHROPIC_API_KEY=[REDACTED]'],
  [/OPENAI_API_KEY=[^\s]+/g, 'OPENAI_API_KEY=[REDACTED]'],
  [/GOOGLE_API_KEY=[^\s]+/g, 'GOOGLE_API_KEY=[REDACTED]'],
  [/GEMINI_API_KEY=[^\s]+/g, 'GEMINI_API_KEY=[REDACTED]'],
  [/AKIA[A-Z0-9]{16}/g, '[REDACTED_AWS_KEY]'],
  [/ASIA[A-Z0-9]{16}/g, '[REDACTED_AWS_KEY]'],
  [/Bearer [a-zA-Z0-9_-]{20,}/g, 'Bearer [REDACTED]'],
];

const HIGH_ENTROPY_PATTERN = /(?<![a-zA-Z0-9_/.-])[A-Za-z0-9+/=_-]{32,}(?![a-zA-Z0-9_/.-])/g;

function hasHighEntropy(token) {
  if (token.length < 32) return false;

  const freq = new Map();
  for (const ch of token) freq.set(ch, (freq.get(ch) || 0) + 1);

  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / token.length;
    entropy -= p * Math.log2(p);
  }
  return entropy > 4.0;
}

function isAllowedEntropyMatch(match) {
  if (match.includes('/') && match.includes('.')) return true;
  if (match.startsWith('eyJ')) return true;
  if (/^[0-9a-f]+$/i.test(match) && match.length === 40) return true;
  return false;
}

function redact(text) {
  if (text == null) return text;

  let result = typeof text === 'string' ? text : String(text);

  for (const [pattern, replacement] of REDACTION_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  return result.replace(HIGH_ENTROPY_PATTERN, (match) => {
    if (isAllowedEntropyMatch(match)) return match;
    if (hasHighEntropy(match)) return '[REDACTED_HIGH_ENTROPY]';
    return match;
  });
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  process.stdout.write(redact(Buffer.concat(chunks).toString('utf8')));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

export { HIGH_ENTROPY_PATTERN, REDACTION_PATTERNS, hasHighEntropy, redact };
