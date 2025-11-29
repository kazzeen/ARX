/**
 * Integration Tests for Treasury USD Balance Display
 * Tests the complete flow from balance calculation to component display
 */

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const FUNDRAISING_GOAL = 2000000;

// Mock the complete treasury calculation and display system
function aggregateByMint(tokens) {
    const agg = {};
    for (const t of tokens) {
        if (t.mint && typeof t.amount === 'number' && t.amount > 0) {
            agg[t.mint] = (agg[t.mint] || 0) + t.amount;
        }
    }
    return agg;
}

function computeUsdTotal(tokens, prices) {
    let total = 0;
    for (const t of tokens) {
        const info = prices[t.mint];
        if (info && info.price && typeof t.amount === 'number') {
            const p = parseFloat(info.price);
            if (Number.isFinite(p)) {
                total += t.amount * p;
            }
        }
    }
    return total;
}

function formatUsdValue(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

function formatPercentage(value, goal) {
    const percent = Math.min((value / goal) * 100, 100);
    return `${percent.toFixed(1)}%`;
}

// Mock component update function
function updateTreasuryComponents(value, percent, status, isError = false) {
    console.log(`[Treasury] Display Update: ${value} | ${percent} | ${status} | Error: ${isError}`);
    return { value, percent, status, isError };
}

// Test scenarios
const testScenarios = [
    {
        name: "Empty Treasury",
        tokens: [],
        prices: { [SOL_MINT]: { price: '100' } },
        expectedUsd: 0,
        expectedPercent: '0.0%'
    },
    {
        name: "SOL Only Treasury",
        tokens: [{ mint: SOL_MINT, amount: 5000 }],
        prices: { [SOL_MINT]: { price: '100' } },
        expectedUsd: 500000,
        expectedPercent: '25.0%'
    },
    {
        name: "Mixed Token Treasury",
        tokens: [
            { mint: SOL_MINT, amount: 3000 },
            { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: 150000 }, // USDC
            { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', amount: 50000 }  // USDT
        ],
        prices: {
            [SOL_MINT]: { price: '100' },
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { price: '1' },
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { price: '1' }
        },
        expectedUsd: 600000, // 3000 * 100 + 150000 * 1 + 50000 * 1
        expectedPercent: '30.0%'
    },
    {
        name: "Goal Exceeded Treasury",
        tokens: [{ mint: SOL_MINT, amount: 25000 }],
        prices: { [SOL_MINT]: { price: '100' } },
        expectedUsd: 2500000,
        expectedPercent: '100.0%' // Should be clamped at 100%
    },
    {
        name: "Dust Amount Treasury",
        tokens: [{ mint: SOL_MINT, amount: 0.000001 }],
        prices: { [SOL_MINT]: { price: '100' } },
        expectedUsd: 0.0001,
        expectedPercent: '0.0%' // Rounds to 0.0%
    },
    {
        name: "Missing Price Data",
        tokens: [
            { mint: SOL_MINT, amount: 1000 },
            { mint: 'UnknownToken123', amount: 50000 }
        ],
        prices: { [SOL_MINT]: { price: '100' } }, // Missing price for UnknownToken123
        expectedUsd: 100000, // Only counts SOL
        expectedPercent: '5.0%'
    },
    {
        name: "Invalid Token Data",
        tokens: [
            { mint: SOL_MINT, amount: 2000 },
            { mint: null, amount: 1000 },           // Invalid mint
            { mint: 'ValidToken', amount: null },   // Invalid amount
            { mint: 'ValidToken', amount: -500 }   // Negative amount
        ],
        prices: {
            [SOL_MINT]: { price: '100' },
            'ValidToken': { price: '2' }
        },
        expectedUsd: 200000, // Only valid SOL counts
        expectedPercent: '10.0%'
    }
];

console.log('=== Treasury USD Balance Display Integration Tests ===\n');

let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
    console.log(`Test ${index + 1}: ${scenario.name}`);
    console.log(`Input: ${scenario.tokens.length} tokens, ${Object.keys(scenario.prices).length} prices`);
    
    // Calculate USD total (simulating the real calculation)
    const agg = aggregateByMint(scenario.tokens);
    let totalUsdValue = 0;
    
    for (const mint of Object.keys(agg)) {
        const info = scenario.prices[mint];
        if (!info || !info.price) {
            console.log(`  ⚠️  No price for mint ${mint}`);
            continue;
        }
        const p = parseFloat(info.price);
        if (!Number.isFinite(p)) {
            console.log(`  ⚠️  Invalid price for mint ${mint}: ${info.price}`);
            continue;
        }
        const mintValue = agg[mint] * p;
        totalUsdValue += mintValue;
        console.log(`  ${mint}: ${agg[mint]} * $${p} = $${mintValue}`);
    }
    
    const formattedValue = formatUsdValue(totalUsdValue);
    const formattedPercent = formatPercentage(totalUsdValue, FUNDRAISING_GOAL);
    
    console.log(`Calculated: $${totalUsdValue} | ${formattedPercent}`);
    console.log(`Expected:   $${scenario.expectedUsd} | ${scenario.expectedPercent}`);
    
    // Test the display update
    const displayResult = updateTreasuryComponents(formattedValue, formattedPercent, 'Live Progress', false);
    
    // Verify accuracy
    const valueMatch = Math.abs(totalUsdValue - scenario.expectedUsd) < 0.01;
    const percentMatch = formattedPercent === scenario.expectedPercent;
    
    if (valueMatch && percentMatch) {
        console.log('✅ PASSED\n');
        passedTests++;
    } else {
        console.log('❌ FAILED');
        if (!valueMatch) console.log(`   Value mismatch: got $${totalUsdValue}, expected $${scenario.expectedUsd}`);
        if (!percentMatch) console.log(`   Percent mismatch: got ${formattedPercent}, expected ${scenario.expectedPercent}`);
        console.log('');
    }
});

console.log('=== Test Summary ===');
console.log(`Passed: ${passedTests}/${totalTests} tests`);
console.log(`Success Rate: ${(passedTests/totalTests*100).toFixed(1)}%`);

// Additional edge case tests
console.log('\n=== Additional Edge Case Tests ===');

// Test price volatility handling
console.log('Test: Price Volatility');
const volatileTokens = [{ mint: SOL_MINT, amount: 1000 }];
const volatilePrices = { [SOL_MINT]: { price: '999999.99' } }; // Very high price
const volatileTotal = computeUsdTotal(volatileTokens, volatilePrices);
const volatileFormatted = formatUsdValue(volatileTotal);
const volatilePercent = formatPercentage(volatileTotal, FUNDRAISING_GOAL);
console.log(`High price test: ${volatileFormatted} | ${volatilePercent}`);
console.log(volatileTotal > FUNDRAISING_GOAL ? '✅ Correctly handles high values' : '❌ Failed high value test');

// Test very small amounts
console.log('\nTest: Very Small Amounts');
const smallTokens = [{ mint: SOL_MINT, amount: 0.000000001 }]; // 1 lamport
const smallPrices = { [SOL_MINT]: { price: '100' } };
const smallTotal = computeUsdTotal(smallTokens, smallPrices);
const smallFormatted = formatUsdValue(smallTotal);
console.log(`Tiny amount test: ${smallFormatted} (should show $0)`);
console.log(smallFormatted === '$0' ? '✅ Correctly rounds small amounts' : '❌ Failed small amount test');

console.log('\n=== Integration Tests Complete ===');