# Quantum Helium Maps

A browser game by **StarSwarm Agentic Security**. The top 100 crypto tokens float as bubbles over a hyperspace starfield, sized by market cap. Tokens whose public keys sit in the open on-chain glow red, fill with "helium", float to the top and pop. Lower-exposure tokens stay green and settle at the bottom.

## How to play

- **Explore:** tap any bubble for price, market cap, 24h change, a 7 day chart and its quantum exposure estimate.
- **Start Q-Day:** a 60 second round. Tap red bubbles to migrate them to post-quantum safety before they reach the top and pop. Streaks score more. Tapping green or amber breaks your streak. The pace speeds up as Q-Day gets closer.
- At the end you get a share card (score, migrated, popped, best streak). It holds no personal data.

## Why red?

Wallets prove ownership with elliptic-curve signatures (ECDSA, Schnorr, EdDSA). A large enough quantum computer running Shor's algorithm could recover a private key from its public key. Chains differ in how often that public key is visible:

| Model | Estimate | Meaning |
|---|---|---|
| Address is the public key | 90 | visible from day one |
| Account model | 80 | visible after the first outgoing transaction |
| Hashed UTXO | ~60 | hidden until coins are spent, reuse exposes it |
| Not classified | 75 | elliptic-curve scheme assumed |

Tokens inherit their host chain's model. The table lives in `risk.js`. **It is a simple heuristic, not a measurement, rating or financial advice.**

## Data

- Live: [CoinGecko public API](https://www.coingecko.com/en/api) `/coins/markets` (free, no key, top 100 by market cap, 7 day sparkline).
- Offline fallback: `data/sample.json`, a labeled snapshot of that same public data. The page badge says which one you are seeing.
- No trackers, no analytics, no cookies. Nothing you do leaves your browser.

## Run it

Static files, no build step.

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## License

MIT
