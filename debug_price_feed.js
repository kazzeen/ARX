// Debug Price Feed Response Format
const https = require('https');

async function debugPriceFeed() {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    
    console.log('=== Debugging Price Feed Response Format ===\n');
    
    try {
        // Test Jupiter v2 API
        console.log('Testing Jupiter v2 API...');
        const response = await fetch(`https://api.jup.ag/price/v2?ids=${SOL_MINT}`);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data[SOL_MINT]) {
            console.log('✓ v2 API working - Price:', data.data[SOL_MINT].price);
        }
    } catch (error) {
        console.log('✗ v2 API failed:', error.message);
    }
    
    try {
        // Test Jupiter v3 API
        console.log('\nTesting Jupiter v3 API...');
        const response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data[SOL_MINT]) {
            console.log('✓ v3 API working - Price:', data.data[SOL_MINT].price);
        }
    } catch (error) {
        console.log('✗ v3 API failed:', error.message);
    }
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = function(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(data))
                    });
                });
            }).on('error', reject);
        });
    };
}

debugPriceFeed().catch(console.error);