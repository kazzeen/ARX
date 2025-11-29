// Comprehensive Treasury Tracker Test Suite
// Tests API connections, data retrieval, and USD calculations

const https = require('https');
const http = require('http');

// Configuration from C2.html
const TREASURY_ADDRESS = '2n8etcRuK49GUMXWi2QRtQ8YwS6nTDEUjfX7LcvKFyiV';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const RPC_ENDPOINTS = [
    'https://solana-rpc.publicnode.com',
    'https://rpc.ankr.com/solana',
    'https://solana-mainnet.rpc.extrnode.com'
];

console.log('=== Treasury Tracker API Test Suite ===');
console.log('Treasury Address:', TREASURY_ADDRESS);
console.log('Testing RPC endpoints and price feeds...\n');

// Test 1: RPC Connection Test
async function testRpcConnection() {
    console.log('Test 1: RPC Connection Test');
    
    for (const endpoint of RPC_ENDPOINTS) {
        try {
            const response = await fetch(`${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getHealth',
                    params: []
                })
            });
            
            const data = await response.json();
            console.log(`  ✓ ${endpoint}: ${data.result || 'healthy'}`);
        } catch (error) {
            console.log(`  ✗ ${endpoint}: Failed - ${error.message}`);
        }
    }
}

// Test 2: Treasury Balance Test
async function testTreasuryBalance() {
    console.log('\nTest 2: Treasury Balance Test');
    
    for (const endpoint of RPC_ENDPOINTS) {
        try {
            const response = await fetch(`${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getBalance',
                    params: [TREASURY_ADDRESS]
                })
            });
            
            const data = await response.json();
            if (data.result && data.result.value !== undefined) {
                const balanceLamports = data.result.value;
                const balanceSOL = balanceLamports / 1e9;
                console.log(`  ✓ ${endpoint}: ${balanceSOL.toFixed(4)} SOL (${balanceLamports} lamports)`);
                return { balanceLamports, balanceSOL };
            }
        } catch (error) {
            console.log(`  ✗ ${endpoint}: Failed - ${error.message}`);
        }
    }
    return null;
}

// Test 3: Price Feed Test
async function testPriceFeeds() {
    console.log('\nTest 3: Price Feed Test');
    
    const priceEndpoints = [
        `https://api.jup.ag/price/v2?ids=${SOL_MINT}`,
        `https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`
    ];
    
    for (const endpoint of priceEndpoints) {
        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.data && data.data[SOL_MINT]) {
                const price = parseFloat(data.data[SOL_MINT].price);
                console.log(`  ✓ ${endpoint.split('/').pop()}: $${price.toFixed(2)} USD/SOL`);
            } else {
                console.log(`  ✗ ${endpoint.split('/').pop()}: Invalid response format`);
            }
        } catch (error) {
            console.log(`  ✗ ${endpoint.split('/').pop()}: Failed - ${error.message}`);
        }
    }
}

// Test 4: Token Accounts Test
async function testTokenAccounts() {
    console.log('\nTest 4: Token Accounts Test');
    
    for (const endpoint of RPC_ENDPOINTS.slice(0, 1)) { // Test first endpoint only
        try {
            const response = await fetch(`${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getParsedTokenAccountsByOwner',
                    params: [
                        TREASURY_ADDRESS,
                        {
                            programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
                        },
                        {
                            encoding: 'jsonParsed'
                        }
                    ]
                })
            });
            
            const data = await response.json();
            if (data.result && data.result.value) {
                const tokenCount = data.result.value.length;
                console.log(`  ✓ Found ${tokenCount} token accounts`);
                
                // Show first few tokens if any
                data.result.value.slice(0, 3).forEach((account, index) => {
                    const info = account.account.data.parsed.info;
                    const mint = info.mint;
                    const amount = info.tokenAmount.uiAmount || parseFloat(info.tokenAmount.uiAmountString) || 0;
                    console.log(`    ${index + 1}. ${mint}: ${amount}`);
                });
            }
        } catch (error) {
            console.log(`  ✗ Failed - ${error.message}`);
        }
    }
}

// Test 5: Complete Integration Test
async function testIntegration() {
    console.log('\nTest 5: Complete Integration Test');
    console.log('Simulating full treasury data fetch...');
    
    try {
        // Get SOL balance
        const balanceResult = await testTreasuryBalance();
        if (!balanceResult) {
            console.log('  ✗ Could not retrieve balance');
            return;
        }
        
        // Get SOL price
        const priceResponse = await fetch(`https://api.jup.ag/price/v2?ids=${SOL_MINT}`);
        const priceData = await priceResponse.json();
        const solPrice = parseFloat(priceData.data[SOL_MINT].price);
        
        // Calculate USD value
        const usdValue = balanceResult.balanceSOL * solPrice;
        const goal = 2000000; // $2M goal
        const percent = Math.min((usdValue / goal) * 100, 100).toFixed(1);
        
        console.log(`  ✓ Balance: ${balanceResult.balanceSOL.toFixed(4)} SOL`);
        console.log(`  ✓ Price: $${solPrice.toFixed(2)} USD/SOL`);
        console.log(`  ✓ Total USD Value: $${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
        console.log(`  ✓ Progress: ${percent}% of $${goal.toLocaleString()} goal`);
        
    } catch (error) {
        console.log(`  ✗ Integration test failed: ${error.message}`);
    }
}

// Run all tests
async function runAllTests() {
    await testRpcConnection();
    await testTreasuryBalance();
    await testPriceFeeds();
    await testTokenAccounts();
    await testIntegration();
    
    console.log('\n=== Test Suite Complete ===');
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = function(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const req = client.request(url, {
                method: options.method || 'GET',
                headers: options.headers || {}
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data)
                    });
                });
            });
            
            req.on('error', reject);
            if (options.body) req.write(options.body);
            req.end();
        });
    };
}

// Run tests
runAllTests().catch(console.error);