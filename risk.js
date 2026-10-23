// Quantum exposure ESTIMATE. A heuristic, not a measurement or a prediction.
// Every top-100 token today relies on elliptic-curve signatures (ECDSA, Schnorr or EdDSA),
// which Shor's algorithm on a large enough quantum computer could break.
// What changes between chains is how often the PUBLIC KEY is visible on-chain:
//   pubkey  : the address is (or openly contains) the public key, so it is exposed from day one
//   account : account model, the public key is revealed with the first outgoing transaction
//   utxo    : hashed UTXO addresses, the key stays hidden until coins are spent (reuse exposes it)
//   unknown : we have not classified this chain, an elliptic-curve scheme is assumed
// Tokens issued on another chain inherit that host chain's model.
(function () {
  const MODELS = {
    pubkey:  { score: 90, sig: 'EdDSA / ECDSA', why: 'The address is the public key itself, so the key is visible on-chain from the start.' },
    account: { score: 80, sig: 'ECDSA / EdDSA', why: 'Account model. The public key becomes visible on-chain after the first outgoing transaction, and accounts are reused.' },
    utxo:    { score: 60, sig: 'ECDSA', why: 'Hashed addresses keep the public key hidden until coins are spent. Address reuse exposes it.' },
    unknown: { score: 75, sig: 'elliptic-curve (assumed)', why: 'Not classified yet. Assumed to use elliptic-curve signatures like nearly every chain today.' }
  };
  // id -> [model, host/signature note, optional score override]
  const T = {
    bitcoin: ['utxo', 'Bitcoin, ECDSA + Schnorr', 66],
    'bitcoin-cash': ['utxo', 'Bitcoin Cash, ECDSA'], litecoin: ['utxo', 'Litecoin, ECDSA'],
    dogecoin: ['utxo', 'Dogecoin, ECDSA'], dash: ['utxo', 'Dash, ECDSA'],
    zcash: ['utxo', 'Zcash, transparent + shielded', 58], cardano: ['utxo', 'Cardano, Ed25519 (hashed eUTXO)', 56],
    monero: ['unknown', 'Monero, Ed25519 one-time keys are public on-chain', 72],
    'ethereum-classic': ['account', 'Ethereum Classic, ECDSA'],
    ethereum: ['account', 'Ethereum, ECDSA'], binancecoin: ['account', 'BNB Chain, ECDSA'],
    ripple: ['account', 'XRP Ledger, ECDSA / Ed25519'], 'ripple-usd': ['account', 'XRP Ledger + Ethereum'],
    tron: ['account', 'Tron, ECDSA'], usdd: ['account', 'Tron, ECDSA'], just: ['account', 'Tron, ECDSA'],
    hyperliquid: ['account', 'Hyperliquid, ECDSA'], 'avalanche-2': ['account', 'Avalanche, ECDSA'],
    sui: ['account', 'Sui, Ed25519 / ECDSA'], aptos: ['account', 'Aptos, Ed25519'],
    cosmos: ['account', 'Cosmos, ECDSA'], 'crypto-com-chain': ['account', 'Cronos / Cosmos, ECDSA'],
    'injective-protocol': ['account', 'Injective, ECDSA'], 'internet-computer': ['account', 'Internet Computer, Ed25519 / ECDSA'],
    filecoin: ['account', 'Filecoin, ECDSA / BLS'], vechain: ['account', 'VeChain, ECDSA'],
    mantle: ['account', 'Mantle (EVM), ECDSA'], arbitrum: ['account', 'Arbitrum (EVM), ECDSA'],
    'polygon-ecosystem-token': ['account', 'Polygon (EVM), ECDSA'], okb: ['account', 'X Layer / Ethereum, ECDSA'],
    'xdce-crowd-sale': ['account', 'XDC (EVM), ECDSA'], blockstack: ['account', 'Stacks, ECDSA'],
    solana: ['pubkey', 'Solana, Ed25519'], 'pump-fun': ['pubkey', 'Solana, Ed25519'],
    'jupiter-exchange-solana': ['pubkey', 'Solana, Ed25519'], 'render-token': ['pubkey', 'Solana, Ed25519'],
    stellar: ['pubkey', 'Stellar, Ed25519'], 'pi-network': ['pubkey', 'Pi (Stellar-based), Ed25519'],
    near: ['pubkey', 'NEAR, Ed25519'], 'the-open-network': ['pubkey', 'TON, Ed25519'],
    'hedera-hashgraph': ['pubkey', 'Hedera, Ed25519 / ECDSA'], polkadot: ['pubkey', 'Polkadot, Sr25519 / Ed25519'],
    algorand: ['pubkey', 'Algorand, Ed25519'], bittensor: ['pubkey', 'Bittensor (Substrate), Sr25519'], kaspa: ['pubkey', 'Kaspa, Schnorr'],
    'wrapped-bitcoin': ['account', 'Ethereum (wrapped BTC), ECDSA']
  };
  // common Ethereum-hosted tokens and stablecoins
  ('tether usd-coin usds ethena-usde dai uniswap chainlink leo-token shiba-inu ethena aave ondo-finance pepe ' +
   'worldcoin-wld pax-gold tether-gold paypal-usd sky morpho quant-network usd1-wlfi global-dollar ' +
   'world-liberty-financial gho ether-fi layerzero nexo whitebit kucoin-shares bitget-token gatechain-token ' +
   'htx-dao cronos lido-dao arbitrum ena maker usde fdusd first-digital-usd pancakeswap-token aerodrome-finance aster-2 bfusd')
    .split(' ').forEach(id => { if (!T[id]) T[id] = ['account', 'EVM token (Ethereum / L2 / BNB), ECDSA']; });
  T['pancakeswap-token'] = ['account', 'BNB Chain, ECDSA'];
  T['aerodrome-finance'] = ['account', 'Base (EVM), ECDSA'];

  window.QHM_RISK = function (coin) {
    const t = T[coin.id] || ['unknown', 'unclassified chain'];
    const m = MODELS[t[0]];
    const score = t[2] || m.score;
    const tier = score >= 85 ? 'high' : score >= 75 ? 'risk' : score >= 65 ? 'watch' : 'lower';
    return { model: t[0], host: t[1], score, tier, why: m.why, classified: !!T[coin.id] };
  };
})();
