# Quantum Helium Maps

An explorer by **StarSwarm Agentic Security**. The top 100 crypto tokens float as helium bubbles over Milky Way photos. Drag and fling them around, click one for details.

Each bubble fills from the bottom with glowing green liquid showing its **estimated privacy + quantum upgrade progress** (0 to 100%). Low progress glows red and floats high. Further along glows green and settles low.

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

Background photos, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), resized and compressed to WebP:

- "The planet, the galaxy and the laser", ESO/Y. Beletsky, [eso0733a](https://www.eso.org/public/images/eso0733a/)
- "A 340-million pixel starscape from Paranal", ESO/S. Guisard, [eso0934a](https://www.eso.org/public/images/eso0934a/)
- "The Milky Way panorama", ESO/S. Brunier, [eso0932a](https://www.eso.org/public/images/eso0932a/) (cropped)

Fonts: [Space Grotesk](https://github.com/floriankarsten/space-grotesk) and [Manrope](https://github.com/googlefonts/manrope), SIL Open Font License 1.1 (see `assets/fonts/`).

Social preview (Open Graph and Twitter cards): `assets/qhm-hero-v1-1600x900.png`, Milky Way with helium bubbles and a faint shield watermark. The page itself stays the interactive bubble map.

## Run it

Static files, no build step: `python3 -m http.server 8000` and open http://localhost:8000.

## License

Code: MIT. Photos and fonts keep their own licenses above.
