# ARX

ARX is a lightweight, browser-based prototype focused on testing treasury logic, price feeds, UI integration, and component update flows. The repository contains a simple HTML entry point and a set of JavaScript test scripts designed to validate behavior in the browser and against external APIs.

## Features
- Basic HTML entry: `ARX.html`
- Integration tests for price feeds and API connectivity
- UI tests for treasury views and USD display
- Component update validation for front-end behavior

## File Overview
- `ARX.html` – minimal HTML entry point to load and exercise scripts
- `debug_price_feed.js` – utilities and checks for price feed debugging
- `test_api_connections.js` – verifies external API connectivity and responses
- `test_browser_integration.js` – ensures scripts behave correctly in browser context
- `test_component_updates.js` – validates component update flows and state changes
- `test_treasury.js` – end-to-end treasury behavior checks
- `test_treasury_logic.js` – unit-level treasury logic validation
- `test_treasury_ui.js` – UI-level tests for treasury views
- `test_usd_display_integration.js` – tests USD display integration and formatting

## Getting Started
Open `ARX.html` directly in your browser. Use the developer console to observe logs produced by the test scripts. No build step is required.

## License
This project is licensed under the MIT License. See `LICENSE` for details.
