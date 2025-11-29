
const assert = require('assert');

// Mock Globals
const FUNDRAISING_GOAL = 2000000;
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Logic from C2.html (Replicated for testing)
function aggregateByMint(tokens) {
    const agg = {};
    for (const t of tokens) {
        if (!agg[t.mint]) agg[t.mint] = 0;
        agg[t.mint] += t.amount;
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

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

function calculatePercentage(totalUsd) {
    return Math.min((totalUsd / FUNDRAISING_GOAL) * 100, 100).toFixed(1);
}

// Tests
console.log("Running Treasury Logic Tests...");

// Test 1: Basic Calculation
{
    const tokens = [{ mint: SOL_MINT, amount: 10 }];
    const prices = { [SOL_MINT]: { price: '150.00' } };
    const total = computeUsdTotal(tokens, prices);
    assert.strictEqual(total, 1500, "Basic calculation failed");
    console.log("Test 1 Passed: Basic Calculation");
}

// Test 2: Mixed Assets
{
    const tokens = [
        { mint: SOL_MINT, amount: 10 },
        { mint: 'USDC', amount: 500 }
    ];
    const prices = {
        [SOL_MINT]: { price: '100.00' },
        'USDC': { price: '1.00' }
    };
    const total = computeUsdTotal(tokens, prices);
    assert.strictEqual(total, 1500, "Mixed assets calculation failed");
    console.log("Test 2 Passed: Mixed Assets");
}

// Test 3: Missing Price (Should ignore)
{
    const tokens = [{ mint: 'UNKNOWN', amount: 1000 }];
    const prices = { [SOL_MINT]: { price: '100.00' } };
    const total = computeUsdTotal(tokens, prices);
    assert.strictEqual(total, 0, "Missing price handling failed");
    console.log("Test 3 Passed: Missing Price");
}

// Test 4: Goal Percentage
{
    const total = 500000; // $500k
    const percent = calculatePercentage(total);
    assert.strictEqual(percent, '25.0', "Percentage calculation failed");
    console.log("Test 4 Passed: Percentage Calculation");
}

// Test 5: Goal Cap (Should not exceed 100%)
{
    const total = 3000000; // $3M
    const percent = calculatePercentage(total);
    assert.strictEqual(percent, '100.0', "Percentage cap failed");
    console.log("Test 5 Passed: Percentage Cap");
}

// Test 6: Formatting
{
    const total = 1234567.89;
    const formatted = formatCurrency(total);
    assert.strictEqual(formatted, '$1,234,568', "Currency formatting failed");
    console.log("Test 6 Passed: Formatting");
}

console.log("All tests passed successfully!");
