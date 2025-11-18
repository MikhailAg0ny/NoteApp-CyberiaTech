const https = require('https');
const { URL } = require('url');

const FALLBACK_NETWORK = (process.env.CARDANO_NETWORK || 'preprod').toLowerCase();
const BLOCKFROST_API_URL = process.env.BLOCKFROST_API_URL || `https://cardano-${FALLBACK_NETWORK}.blockfrost.io/api/v0`;

const NETWORK_NAME_MAP = {
  mainnet: 'cardano-mainnet',
  preprod: 'cardano-preprod',
  preview: 'cardano-preview',
  testnet: 'cardano-preprod',
};

function ensureApiKey() {
  if (!process.env.BLOCKFROST_API_KEY) {
    throw new Error('BLOCKFROST_API_KEY is not configured.');
  }
}

const requestBlockfrost = (endpoint, { method = 'GET', body, contentType, parseJson = true } = {}) => {
  ensureApiKey();
  const target = endpoint.startsWith('http') ? endpoint : `${BLOCKFROST_API_URL}${endpoint}`;
  const url = new URL(target);

  const headers = {
    project_id: process.env.BLOCKFROST_API_KEY,
  };

  if (contentType) {
    headers['content-type'] = contentType;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          if (res.statusCode && res.statusCode >= 400) {
            const message = raw.toString('utf8') || 'Blockfrost request failed';
            return reject(new Error(`Blockfrost ${res.statusCode}: ${message}`));
          }

          if (!raw.length) {
            return resolve(parseJson ? {} : Buffer.alloc(0));
          }

          if (!parseJson) {
            return resolve(raw);
          }

          try {
            const parsed = JSON.parse(raw.toString('utf8'));
            resolve(parsed);
          } catch (err) {
            reject(new Error(`Unable to parse Blockfrost response: ${err.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
};

function getNetworkConfig() {
  const networkKey = (process.env.CARDANO_NETWORK || 'preprod').toLowerCase();
  return {
    network: networkKey,
    blockfrostUrl: BLOCKFROST_API_URL,
    blockfrostNetworkName: NETWORK_NAME_MAP[networkKey] || NETWORK_NAME_MAP.preprod,
    hasApiKey: Boolean(process.env.BLOCKFROST_API_KEY),
  };
}

async function getAddressInfo(address) {
  if (!address) {
    throw new Error('Wallet address is required.');
  }
  const info = await requestBlockfrost(`/addresses/${address}`);
  const lovelaceEntry = Array.isArray(info.amount)
    ? info.amount.find((asset) => asset.unit === 'lovelace')
    : null;
  const lovelace = lovelaceEntry ? BigInt(lovelaceEntry.quantity) : 0n;

  return {
    address,
    lovelace: lovelace.toString(),
    ada: Number(lovelace) / 1_000_000,
    assets: info.amount || [],
    stakeAddress: info.stake_address || null,
  };
}

async function getAddressUtxos(address, { page = 1, count = 50 } = {}) {
  if (!address) {
    throw new Error('Wallet address is required.');
  }
  const safeCount = Math.min(Math.max(count, 1), 100);
  const query = `?page=${page}&count=${safeCount}&order=desc`;
  const utxos = await requestBlockfrost(`/addresses/${address}/utxos${query}`);
  return {
    address,
    page,
    count: safeCount,
    utxos,
  };
}

async function getAddressTransactions(address, { page = 1, count = 20 } = {}) {
  if (!address) {
    throw new Error('Wallet address is required.');
  }
  const safeCount = Math.min(Math.max(count, 1), 50);
  const query = `?page=${page}&count=${safeCount}&order=desc`;
  const transactions = await requestBlockfrost(
    `/addresses/${address}/transactions${query}`
  );
  return {
    address,
    page,
    count: safeCount,
    transactions,
  };
}

async function submitTransaction(cborHex) {
  if (!cborHex) {
    throw new Error('Transaction CBOR is required.');
  }
  let payload;
  try {
    payload = Buffer.from(cborHex, 'hex');
  } catch (err) {
    throw new Error('Invalid CBOR hex payload.');
  }
  if (!payload.length) {
    throw new Error('Transaction payload is empty.');
  }
  const response = await requestBlockfrost('/tx/submit', {
    method: 'POST',
    body: payload,
    contentType: 'application/cbor',
    parseJson: false,
  });
  return response.toString('utf8').trim();
}

module.exports = {
  getNetworkConfig,
  getAddressInfo,
  getAddressUtxos,
  getAddressTransactions,
  submitTransaction,
};
