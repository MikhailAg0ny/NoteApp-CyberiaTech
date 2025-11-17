# Cardano Wallet Integration Guide

This document outlines the steps to integrate Cardano wallet functionality into the NoteApp.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js v16 or higher
- npm or yarn package manager
- A Cardano wallet (Nami, Eternl, or Flint)
- Blockfrost API key (https://blockfrost.io/)

## Installation

### Frontend Dependencies

```bash
cd frontend
npm install @blaze-cardano/sdk @emurgo/cardano-serialization-lib-browser
```

### Backend Dependencies

```bash
cd backend
npm install @blaze-cardano/sdk @emurgo/cardano-serialization-lib-nodejs
```

## Frontend Setup

### 1. Create Wallet Context

Create a new file: `frontend/contexts/WalletContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { Lucid } from '@blaze-cardano/sdk';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(0);
  const [lucid, setLucid] = useState(null);

  // Initialize Lucid
  useEffect(() => {
    const initLucid = async () => {
      const lucid = await Lucid.new(
        new Blockfrost(
          `https://cardano-${process.env.NEXT_PUBLIC_NETWORK || 'preview'}.blockfrost.io/api/v0`,
          process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY
        ),
        process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'Mainnet' : 'Preview'
      );
      setLucid(lucid);
    };
    initLucid();
  }, []);

  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (!window.cardano) {
        throw new Error('No wallet extension found!');
      }

      // Try to connect to the wallet
      const walletApi = await window.cardano.enable();
      const wallet = lucid.selectWallet(walletApi);
      
      const usedAddress = await wallet.wallet.getUsedAddresses();
      if (usedAddress && usedAddress[0]) {
        const address = usedAddress[0];
        setWallet(wallet);
        setAddress(address);
        
        // Get balance
        const balance = await wallet.wallet.getBalance(address);
        setBalance(balance);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWallet(null);
    setAddress(null);
    setBalance(0);
  };

  // Send ADA
  const sendAda = async (toAddress, amount) => {
    if (!wallet || !lucid) throw new Error('Wallet not connected');
    
    try {
      const tx = await lucid
        .newTx()
        .payToAddress(toAddress, { lovelace: amount })
        .complete();
      
      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();
      
      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider value={{ 
      wallet,
      address, 
      balance,
      isConnected: !!address,
      connectWallet,
      disconnectWallet,
      sendAda
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
```

### 2. Add Wallet Provider

Wrap your app with the WalletProvider in `_app.js` or `index.js`:

```jsx
import { WalletProvider } from '../contexts/WalletContext';

function MyApp({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
```

### 3. Create Wallet Connection Component

Create `components/WalletConnector.jsx`:

```jsx
import { useWalletContext } from '../contexts/WalletContext';

export default function WalletConnector() {
  const { connectWallet, disconnectWallet, address, isConnected } = useWalletContext();

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {address?.substring(0, 10)}...{address?.substring(address.length - 5)}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Backend Setup

### 1. Configure Environment Variables

Add to `.env`:

```
BLOCKFROST_API_KEY=your_blockfrost_api_key
NETWORK=mainnet  # or 'testnet' for testing
```

### 2. Create Cardano Service

Create `backend/services/cardanoService.js`:

```javascript
const { Blockfrost, Lucid } = require('@bloxbean/cardano-client-lib');

let lucid;

async function initializeLucid() {
  if (!lucid) {
    lucid = await Lucid.new(
      new Blockfrost(
        `https://cardano-${process.env.NETWORK}.blockfrost.io/api/v0`,
        process.env.BLOCKFROST_API_KEY
      ),
      process.env.NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'
    );
  }
  return lucid;
}

async function buildTransaction(senderAddress, receiverAddress, amount) {
  try {
    const lucid = await initializeLucid();
    const tx = await lucid
      .newTx()
      .payToAddress(receiverAddress, { lovelace: amount })
      .complete();

    return {
      success: true,
      transaction: tx.toString()
    };
  } catch (error) {
    console.error('Error building transaction:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  buildTransaction
};
```

## Usage Examples

### Get Wallet Balance

```javascript
const { wallet } = useWallet();

async function getBalance() {
  const balance = await wallet.getBalance();
  console.log('Wallet balance:', balance);
}
```

### Send ADA

```javascript
async function sendAda(receiverAddress, amount) {
  try {
    const tx = await wallet.sendLovelace(receiverAddress, amount);
    console.log('Transaction submitted:', tx);
  } catch (error) {
    console.error('Error sending ADA:', error);
  }
}
```

## Troubleshooting

### Common Issues

1. **Wallet not connecting**
   - Ensure the wallet extension is installed and unlocked
   - Check browser console for errors
   - Verify network connectivity

2. **Transaction failures**
   - Check if you have enough ADA for the transaction and fees
   - Verify the recipient address is correct
   - Check Blockfrost API rate limits

3. **Module not found**
   - Ensure all dependencies are installed
   - Try deleting `node_modules` and `package-lock.json`, then run `npm install`

## Security Notes

- Never expose your Blockfrost API key in client-side code
- Always validate addresses on the server side
- Use environment variables for sensitive information
- Implement proper error handling for wallet operations

## Additional Resources

- [Cardano Developer Portal](https://developers.cardano.org/)
- [Blockfrost Documentation](https://docs.blockfrost.io/)
- [Bloxbean Wallet Connector](https://github.com/bloxbean/cardano-wallet-connector)

---
*Last updated: November 17, 2025*
