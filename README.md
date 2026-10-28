# Quantum Helium Maps

An explorer by **StarSwarm Agentic Security**. The top 100 crypto tokens float as glass helium bubbles inside a stone observatory open to the Milky Way. Drag and fling them around, click one for details.

Each bubble fills from the bottom with emerald gas showing its **estimated privacy + quantum upgrade progress** (0 to 100%). Low progress glows crimson and floats high. Further along glows green and settles low.

## Click panel

Price, market cap, 24h change, a 7 day chart drawn on canvas, and the progress estimate with its factor breakdown.

## How the estimate works

A large enough quantum computer running Shor's algorithm could recover a private key from a visible public key. The score adds three factors (see `progress.js`):

| Factor | Max | Levels |
|---|---|---|
| Post-quantum migration | 50 | live on mainnet 90%, live via contracts 65%, roadmap or testnet 45%, drafts 20%, none found 0 |
| Key exposure | 35 | hashed addresses 60%, account model 30%, address is the key 10% |
| Privacy | 15 | private by default 100%, optional shielding 50%, optional mixing 25%, transparent 0 |

Tokens use their host chain's factors. Unclassified chains show **unknown** (dashed ring, no fill) and unknown factors add 0. Migration status summarises public chain profiles ([Hardy Index](https://hardyindex.com/chains.md)) and project posts as of October 2026. **This is a heuristic, not a measurement, rating or financial advice.**

## Data

- Live: [CoinGecko public API](https://www.coingecko.com/en/api) `/coins/markets` (free, no key, 7 day sparkline).
- Offline fallback: `data/sample.json`, a labeled snapshot of the same public data. The badge shows which is in use.
- No trackers, no analytics, no cookies.

## Credits

Observatory backdrop, Quantum Helium Lab v2 (dark fantasy stone hall, crystals, candlelight, Milky Way through the great arch):

- Page background: `assets/qhm-lab-v2-backdrop.webp` (empty hall so the live bubbles own the arch), with `assets/qhm-lab-v2-backdrop.png` kept beside it
- Social preview: `assets/qhm-lab-v2-observatory.png`, the same hall with emerald and crimson glass

Earlier Milky Way photos stay in `assets/galaxy/` and are not shown. They remain [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): ESO/Y. Beletsky [eso0733a](https://www.eso.org/public/images/eso0733a/), ESO/S. Guisard [eso0934a](https://www.eso.org/public/images/eso0934a/), ESO/S. Brunier [eso0932a](https://www.eso.org/public/images/eso0932a/). The previous social card `assets/qhm-hero-v1-1600x900.png` is unused.

Fonts: [Cinzel](https://github.com/NDISCOVER/Cinzel) for the title, [Space Grotesk](https://github.com/floriankarsten/space-grotesk) and [Manrope](https://github.com/googlefonts/manrope) for the interface, SIL Open Font License 1.1 (see `assets/fonts/`).

The page itself stays the interactive bubble map. Visual target notes live in `taste.md`.

## Run it

Static files, no build step: `python3 -m http.server 8000` and open http://localhost:8000.

## License

Code: MIT. Fonts, and the unused galaxy photos, keep their own licenses above.
