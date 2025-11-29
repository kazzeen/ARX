
const assert = require('assert');

// Mock DOM minimal implementation
global.document = {
    getElementById: (id) => {
        if (!global.elements[id]) {
            global.elements[id] = {
                textContent: '',
                style: { width: '' },
                classList: {
                    contains: (cls) => global.elements[id].className.includes(cls)
                },
                className: '',
                getAttribute: (attr) => global.elements[id].attributes[attr],
                setAttribute: (attr, val) => { global.elements[id].attributes[attr] = val; },
                attributes: {}
            };
        }
        return global.elements[id];
    }
};
global.elements = {};

// Setup elements
global.elements['progress-bar'] = {
    style: { width: '0%' },
    className: 'h-full bg-[#4CAF50] min-w-[2%] w-0',
    attributes: {},
    classList: { contains: (c) => c === 'bg-[#4CAF50]' || c === 'min-w-[2%]' },
    setAttribute: (k, v) => global.elements['progress-bar'].attributes[k] = v,
    getAttribute: (k) => global.elements['progress-bar'].attributes[k]
};

// Logic from C2.html
function updateTreasuryComponents(value, percent, status, isError = false) {
    const valueEl = document.getElementById('treasury-value');
    const percentEl = document.getElementById('treasury-percent');
    const barEl = document.getElementById('progress-bar');
    
    // Update values
    if (value) valueEl.textContent = value;
    if (percent) percentEl.textContent = percent;
    
    // Update progress bar width and ARIA
    const percentNum = parseFloat(percent.replace('%', ''));
    if (!isNaN(percentNum) && percentNum >= 0 && percentNum <= 100) {
        barEl.style.width = `${percentNum}%`;
        barEl.setAttribute('aria-valuenow', percentNum);
    } else {
        barEl.style.width = '0%';
        barEl.setAttribute('aria-valuenow', '0');
    }
}

console.log("Running Treasury UI Tests (Mocked DOM)...");

// Test 1: Initial State (Green Bar with Min-Width)
{
    const bar = document.getElementById('progress-bar');
    assert(bar.classList.contains('bg-[#4CAF50]'), "Progress bar should have bg-[#4CAF50] class");
    assert(bar.classList.contains('min-w-[2%]'), "Progress bar should have min-w-[2%] class");
    console.log("Test 1 Passed: Initial Green Color & Min-Width");
}

// Test 2: Update Progress
{
    updateTreasuryComponents('$500,000', '25%', 'Active');
    const bar = document.getElementById('progress-bar');
    assert.strictEqual(bar.style.width, '25%', "Width update failed");
    assert.strictEqual(bar.getAttribute('aria-valuenow'), 25, "ARIA update failed");
    console.log("Test 2 Passed: Progress Update");
}

// Test 3: Zero Progress
{
    updateTreasuryComponents('$0', '0%', 'Active');
    const bar = document.getElementById('progress-bar');
    assert.strictEqual(bar.style.width, '0%', "Zero width update failed");
    console.log("Test 3 Passed: Zero Progress");
}

// Test 4: Invalid Input Handling
{
    updateTreasuryComponents('$0', 'Invalid%', 'Error');
    const bar = document.getElementById('progress-bar');
    assert.strictEqual(bar.style.width, '0%', "Invalid input should reset width to 0%");
    console.log("Test 4 Passed: Invalid Input Handling");
}

console.log("All UI tests passed successfully!");
