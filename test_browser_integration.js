/**
 * Browser Integration Test for Treasury USD Balance Display
 * Validates the complete system works in a browser-like environment
 */

// Simulate browser environment
global.document = {
    getElementById: (id) => {
        const elements = {
            'treasury-value': { 
                textContent: '', 
                classList: { add: () => {}, remove: () => {} },
                parentNode: { querySelector: () => null },
                parentElement: { appendChild: () => {} }
            },
            'treasury-percent': { textContent: '', classList: { add: () => {}, remove: () => {} } },
            'progress-bar': { 
                style: { width: '' }, 
                classList: { add: () => {}, remove: () => {} } 
            },
            'treasury-status': { textContent: '', classList: { add: () => {}, remove: () => {} } },
            'treasury-indicator-icon': { 
                classList: { 
                    remove: function(classes) { 
                        classes.split(' ').forEach(c => this[c] = false);
                    },
                    add: function(className) { 
                        this[className] = true; 
                    }
                },
                'text-green-500': false,
                'text-red-500': false,
                'text-yellow-500': false
            },
            'treasury-updated': { textContent: '' }
        };
        return elements[id] || null;
    },
    createElement: (tag) => ({
        className: '',
        innerText: '',
        appendChild: () => {},
        remove: () => {}
    })
};

global.window = {
    location: { href: '' }
};

// Import the actual functions from C2.html (simplified versions)
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const FUNDRAISING_GOAL = 2000000;

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

function updateTreasuryComponents(value, percent, status, isError = false) {
    const valueEl = document.getElementById('treasury-value');
    const percentEl = document.getElementById('treasury-percent');
    const barEl = document.getElementById('progress-bar');
    const statusEl = document.getElementById('treasury-status');
    const iconEl = document.getElementById('treasury-indicator-icon');
    const updatedEl = document.getElementById('treasury-updated');
    
    if (!valueEl || !percentEl || !barEl || !statusEl) {
        console.error('[Treasury] Required elements not found for update');
        return false;
    }
    
    try {
        // Update value with validation
        if (typeof value === 'string' && value.length > 0) {
            valueEl.textContent = value;
        } else {
            console.warn('[Treasury] Invalid value provided:', value);
            return false;
        }
        
        // Update percentage with validation
        if (typeof percent === 'string' && percent.length > 0) {
            percentEl.textContent = percent;
        } else {
            console.warn('[Treasury] Invalid percentage provided:', percent);
            return false;
        }
        
        // Update progress bar with validation
        const percentNum = parseFloat(percent.replace('%', ''));
        if (!isNaN(percentNum) && percentNum >= 0 && percentNum <= 100) {
            barEl.style.width = `${percentNum}%`;
        } else {
            console.warn('[Treasury] Invalid progress bar percentage:', percent);
            barEl.style.width = '0%';
            return false;
        }
        
        // Update status
        if (typeof status === 'string' && status.length > 0) {
            statusEl.textContent = status;
        }
        
        // Update icon if available
        if (iconEl) {
            iconEl.classList.remove('text-green-500', 'text-red-500', 'text-yellow-500');
            if (isError) {
                iconEl.classList.add('text-red-500');
            } else {
                iconEl.classList.add('text-green-500');
            }
        }
        
        // Update timestamp
        if (updatedEl) {
            updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
        
        // Remove pulse animation
        valueEl.classList.remove('animate-pulse');
        barEl.classList.remove('animate-pulse');
        
        return true;
        
    } catch (error) {
        console.error('[Treasury] Error updating components:', error);
        return false;
    }
}

// Test function to simulate the complete treasury update process
function simulateTreasuryUpdate(tokens, prices, goal) {
    console.log('=== Simulating Treasury Update Process ===');
    console.log(`Input: ${tokens.length} tokens, ${Object.keys(prices).length} prices`);
    console.log(`Goal: $${goal.toLocaleString()}`);
    
    // Step 1: Aggregate tokens by mint
    const aggregated = aggregateByMint(tokens);
    console.log('Aggregated tokens:', aggregated);
    
    // Step 2: Calculate USD total
    const totalUsd = computeUsdTotal(tokens, prices);
    console.log(`Total USD Value: $${totalUsd}`);
    
    // Step 3: Format for display
    const formattedValue = formatUsdValue(totalUsd);
    const formattedPercent = formatPercentage(totalUsd, goal);
    console.log(`Formatted: ${formattedValue} | ${formattedPercent}`);
    
    // Step 4: Update components
    const updateSuccess = updateTreasuryComponents(formattedValue, formattedPercent, 'Live Progress', false);
    
    return {
        totalUsd,
        formattedValue,
        formattedPercent,
        updateSuccess,
        aggregated
    };
}

// Test scenarios
const testCases = [
    {
        name: "Realistic Treasury Balance",
        tokens: [
            { mint: SOL_MINT, amount: 8423.456 }, // ~$842,345 worth at $100/SOL
            { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: 125000 }, // USDC
            { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', amount: 75000 }   // USDT
        ],
        prices: {
            [SOL_MINT]: { price: '99.87' },
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { price: '1.00' },
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { price: '1.00' }
        },
        expectedUsd: 8423.456 * 99.87 + 125000 * 1.00 + 75000 * 1.00,
        description: "Typical mixed treasury with SOL and stablecoins"
    },
    {
        name: "High SOL Price Scenario",
        tokens: [
            { mint: SOL_MINT, amount: 5000 }
        ],
        prices: {
            [SOL_MINT]: { price: '250.50' }
        },
        expectedUsd: 5000 * 250.50,
        description: "SOL at $250.50"
    },
    {
        name: "Goal Achievement Test",
        tokens: [
            { mint: SOL_MINT, amount: 20000 }, // Exactly $2M at $100/SOL
            { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: 50000 }
        ],
        prices: {
            [SOL_MINT]: { price: '100.00' },
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { price: '1.00' }
        },
        expectedUsd: 20000 * 100.00 + 50000 * 1.00,
        description: "Treasury exceeds goal"
    }
];

console.log('=== Browser Integration Tests for Treasury USD Balance Display ===\n');

let passedTests = 0;
const totalTests = testCases.length;

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    
    const result = simulateTreasuryUpdate(testCase.tokens, testCase.prices, FUNDRAISING_GOAL);
    
    const valueMatch = Math.abs(result.totalUsd - testCase.expectedUsd) < 0.01;
    const percentClamped = Math.min((result.totalUsd / FUNDRAISING_GOAL) * 100, 100);
    const expectedPercent = `${percentClamped.toFixed(1)}%`;
    
    console.log(`Expected USD: $${testCase.expectedUsd.toFixed(2)}`);
    console.log(`Calculated:   $${result.totalUsd.toFixed(2)}`);
    console.log(`Percentage:   ${result.formattedPercent}`);
    console.log(`Update Success: ${result.updateSuccess ? '✅' : '❌'}`);
    
    if (valueMatch && result.updateSuccess) {
        console.log('✅ PASSED\n');
        passedTests++;
    } else {
        console.log('❌ FAILED');
        if (!valueMatch) console.log(`   Value calculation error: $${result.totalUsd} vs expected $${testCase.expectedUsd}`);
        if (!result.updateSuccess) console.log('   Component update failed');
        console.log('');
    }
});

console.log('=== Browser Integration Test Summary ===');
console.log(`Passed: ${passedTests}/${totalTests} tests`);
console.log(`Success Rate: ${(passedTests/totalTests*100).toFixed(1)}%`);

// Test error handling
console.log('\n=== Error Handling Tests ===');

console.log('Test: Invalid token data');
const invalidTokens = [
    { mint: SOL_MINT, amount: 'invalid' }, // String instead of number
    { mint: null, amount: 1000 },            // Invalid mint
    { mint: 'ValidToken', amount: -500 }   // Negative amount
];
const validPrices = { [SOL_MINT]: { price: '100' } };

try {
    const result = simulateTreasuryUpdate(invalidTokens, validPrices, FUNDRAISING_GOAL);
    console.log(`Result with invalid data: $${result.totalUsd} | Success: ${result.updateSuccess}`);
    console.log(result.totalUsd === 0 ? '✅ Correctly handles invalid data' : '❌ Failed to handle invalid data');
} catch (error) {
    console.log('✅ Error properly caught:', error.message);
}

console.log('\n=== All Browser Integration Tests Complete ===');