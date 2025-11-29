// Treasury Balance Calculation Tests
// Mock DOM elements
const mockElements = {
  'treasury-value': { textContent: 'Loading...', classList: { add: () => {}, remove: () => {} }, parentElement: { appendChild: () => {}, querySelector: () => null } },
  'treasury-percent': { textContent: '0%', classList: { add: () => {}, remove: () => {} } },
  'progress-bar': { style: { width: '0%' }, classList: { add: () => {}, remove: () => {} } },
  'treasury-status': { textContent: 'Scanning Treasury...' },
  'treasury-indicator-icon': { classList: { add: () => {}, remove: () => {} } },
  'treasury-updated': { textContent: 'Updated: Live' }
};

const document = {
  getElementById: (id) => mockElements[id] || { textContent: '', classList: { add: () => {}, remove: () => {} }, style: { width: '' } },
  createElement: () => ({ className: '', innerText: '' })
};

// Constants from C2.html
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const FUNDRAISING_GOAL = 2000000;

// Helper functions from C2.html
function aggregateByMint(tokens) {
  const agg = {};
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t || !t.mint) continue;
    const amt = Number(t.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    agg[t.mint] = (agg[t.mint] || 0) + amt;
  }
  return agg;
}

function computeUsdTotal(tokens, priceMap) {
  const agg = aggregateByMint(tokens);
  let total = 0;
  for (const mint of Object.keys(agg)) {
    const info = priceMap[mint];
    if (!info || !info.price) continue;
    const p = parseFloat(info.price);
    if (!Number.isFinite(p)) continue;
    total += agg[mint] * p;
  }
  return total;
}

// Test scenarios
console.log('=== Treasury Balance Tests ===');

// Test 1: Zero balance
const test1Tokens = [{ mint: SOL_MINT, amount: 0 }];
const test1Prices = { [SOL_MINT]: { price: '100' } };
const test1Total = computeUsdTotal(test1Tokens, test1Prices);
const test1Percent = Math.min((test1Total / FUNDRAISING_GOAL) * 100, 100).toFixed(1);
console.log('Test 1 - Zero treasury:', test1Total, 'USD,', test1Percent, '%');

// Test 2: 1000 SOL at $100/SOL
const test2Tokens = [{ mint: SOL_MINT, amount: 1000 }];
const test2Prices = { [SOL_MINT]: { price: '100' } };
const test2Total = computeUsdTotal(test2Tokens, test2Prices);
const test2Percent = Math.min((test2Total / FUNDRAISING_GOAL) * 100, 100).toFixed(1);
console.log('Test 2 - 1000 SOL @ $100:', test2Total, 'USD,', test2Percent, '%');

// Test 3: Goal exceeded (should clamp at 100%)
const test3Tokens = [{ mint: SOL_MINT, amount: 30000 }];
const test3Prices = { [SOL_MINT]: { price: '100' } };
const test3Total = computeUsdTotal(test3Tokens, test3Prices);
const test3Percent = Math.min((test3Total / FUNDRAISING_GOAL) * 100, 100).toFixed(1);
console.log('Test 3 - 30000 SOL @ $100 (goal exceeded):', test3Total, 'USD,', test3Percent, '%');

// Test 4: Multiple tokens with aggregation
const test4Tokens = [
  { mint: SOL_MINT, amount: 5000 },
  { mint: 'USDC', amount: 10000 },
  { mint: SOL_MINT, amount: 3000 } // Additional SOL (should aggregate)
];
const test4Prices = { 
  [SOL_MINT]: { price: '100' },
  'USDC': { price: '1' }
};
const test4Total = computeUsdTotal(test4Tokens, test4Prices);
const test4Percent = Math.min((test4Total / FUNDRAISING_GOAL) * 100, 100).toFixed(1);
console.log('Test 4 - 8000 SOL + 10000 USDC:', test4Total, 'USD,', test4Percent, '%');

// Test 5: Edge case with very small amounts
const test5Tokens = [{ mint: SOL_MINT, amount: 0.000001 }];
const test5Prices = { [SOL_MINT]: { price: '100' } };
const test5Total = computeUsdTotal(test5Tokens, test5Prices);
console.log('Test 5 - Dust amount (0.000001 SOL):', test5Total, 'USD');

// Test 6: Invalid/missing data handling
const test6Tokens = [
  { mint: SOL_MINT, amount: 1000 },
  { mint: 'INVALID', amount: null }, // Invalid amount
  { mint: null, amount: 500 }, // Missing mint
  { mint: 'USDC', amount: -100 } // Negative amount (should be filtered)
];
const test6Prices = { 
  [SOL_MINT]: { price: '100' },
  'USDC': { price: '1' }
};
const test6Total = computeUsdTotal(test6Tokens, test6Prices);
console.log('Test 6 - Invalid data filtering:', test6Total, 'USD (should be 100000)');

console.log('\n=== Test Summary ===');
console.log('All calculations use FUNDRAISING_GOAL = $' + FUNDRAISING_GOAL.toLocaleString());
console.log('USD formatting: Intl.NumberFormat with maximumFractionDigits: 0');
console.log('Percentage formatting: toFixed(1) with 100% clamp');