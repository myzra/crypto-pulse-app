// constants/cryptaData.js
export const coinImages = {
  'ADA': require('../../assets/coins/ada.png'),
  'APT': require('../../assets/coins/apt.png'),
  'ARB': require('../../assets/coins/arb.png'),
  'ATOM': require('../../assets/coins/atom.png'),
  'AVAX': require('../../assets/coins/avax.png'),
  'BCH': require('../../assets/coins/bch.png'),
  'BNB': require('../../assets/coins/bnb.png'),
  'BTC': require('../../assets/coins/btc.png'),
  'DAI': require('../../assets/coins/dai.png'),
  'DOGE': require('../../assets/coins/doge.png'),
  'DOT': require('../../assets/coins/dot.png'),
  'ETC': require('../../assets/coins/etc.png'),
  'ETH': require('../../assets/coins/eth.png'),
  'FIL': require('../../assets/coins/fil.png'),
  'HBAR': require('../../assets/coins/hbar.png'),
  'HYPE': require('../../assets/coins/hype.png'),
  'ICP': require('../../assets/coins/icp.png'),
  'LINK': require('../../assets/coins/link.png'),
  'LTC': require('../../assets/coins/ltc.png'),
  'NEAR': require('../../assets/coins/near.png'),
  'MATIC': require('../../assets/coins/matic.png'),
  'SHIB': require('../../assets/coins/shib.png'),
  'SOL': require('../../assets/coins/sol.png'),
  'TRX': require('../../assets/coins/trx.png'),
  'UNI': require('../../assets/coins/uni.png'),
  'USDC': require('../../assets/coins/usdc.png'),
  'USDT': require('../../assets/coins/usdt.png'),
  'XLM': require('../../assets/coins/xlm.png'),
  'XMR': require('../../assets/coins/xmr.png'),
  'XRP': require('../../assets/coins/xrp.png'),
};

export const getCoinImage = (symbol) => {
  const symbolUpper = symbol?.toUpperCase();
  return coinImages[symbolUpper] || null;
};

/*
INSERT INTO public.coins (name, symbol, color)
VALUES
  ('Bitcoin', 'BTC', '#FFEDD5'),
  ('Ethereum', 'ETH', '#DBEAFE'),
  ('Tether', 'USDT', '#D4F1E8'),
  ('BNB', 'BNB', '#F3BA2F'),
  ('Solana', 'SOL', '#E4DCFC'),
  ('USD Coin', 'USDC', '#D6E6FA'),
  ('XRP', 'XRP', '#D9D9D9'),
  ('Cardano', 'ADA', '#DBEAFE'),
  ('Dogecoin', 'DOGE', '#F5E6A7'),
  ('TRON', 'TRX', '#FF4B4B'),
  ('Avalanche', 'AVAX', '#FAD4D4'),
  ('Shiba Inu', 'SHIB', '#FFD1C7'),
  ('Polkadot', 'DOT', '#FCE4EC'),
  ('Chainlink', 'LINK', '#D6E6FA'),
  ('Bitcoin Cash', 'BCH', '#D4F1E8'),
  ('NEAR Protocol', 'NEAR', '#E6ECEF'),
  ('Polygon', 'MATIC', '#E4DCFC'),
  ('Litecoin', 'LTC', '#E6ECEF'),
  ('Internet Computer', 'ICP', '#F5E6FA'),
  ('Uniswap', 'UNI', '#FAD4E8'),
  ('Dai', 'DAI', '#FFF8E1'),
  ('Cosmos', 'ATOM', '#E6ECEF'),
  ('Stellar', 'XLM', '#D6E6FA'),
  ('Monero', 'XMR', '#FFE0CC'),
  ('Ethereum Classic', 'ETC', '#D4F1E8'),
  ('Hedera', 'HBAR', '#E6ECEF'),
  ('Filecoin', 'FIL', '#D6E6FA'),
  ('Aptos', 'APT', '#D9E8F5'),
  ('Arbitrum', 'ARB', '#D6E6FA'),
  ('Hyperliquid', 'HYPE', '#E4DCFC');
*/