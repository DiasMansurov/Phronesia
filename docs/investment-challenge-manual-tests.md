# Investment Challenge Manual Test Notes

Run after deploying market data changes:

1. Open `/investment-challenge` and confirm the page has no horizontal overflow on desktop and mobile widths.
2. Confirm empty holdings shows: "Your portfolio is empty. Search for an asset and place your first simulated trade."
3. Search `SPY`; select it. The selected asset card should show a cached/API stock price from the server-side `/stocks/prices` pipeline, or "No saved price yet. Select the asset to fetch the latest price."
4. Search `AMD`; select it. AMD should not be rejected simply because it was not in the original featured list.
5. Search `AAPL`; select it. A cached/API stock price should be used when available.
6. Search an invalid format such as `NOT_A_REAL_TICKER_123`; the API should return "Invalid ticker format."
7. If MarketData.app cannot refresh a price, the UI should show the specific error and still use cached data when present.
8. Confirm trade submit is disabled when no server-side cached or validated stock price is available.
9. Confirm trade submit is disabled outside regular US market hours.
10. Open `/investment-challenge/options`; the educational options simulator should work without real options data.
11. Confirm the options risk warning appears when the premium exceeds the 10% options budget limit.
12. Confirm `/investment-challenge/options` appears in `sitemap.xml`.
13. Confirm `/api/investment/debug-price?symbol=SPY` reports `endpointUsed: "/stocks/prices"` and never returns the API token.
