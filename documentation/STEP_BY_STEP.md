This new plan is much simpler but comes with a major security warning. By not linking the wallet to the user's password, the only way to keep the user "logged in" to their wallet is to store the raw, unencrypted mnemonic phrase in the browser's localStorage.

This is extremely insecure and is NOT suitable for a real application with real funds. It is acceptable only for a simple test project where all funds are testnet ADA and can be lost.

Markdown

# Project Plan: Simple Wallet Integration (No Encryption)

This document outlines a simplified plan to add a Cardano wallet to an existing user system. This plan **skips all encryption** and stores the raw private key in the browser for simplicity.

**⚠️ CRITICAL SECURITY WARNING:** This method is **NOT SECURE**. Storing a raw mnemonic phrase in `localStorage` means any malicious browser extension or XSS attack can steal all the user's funds. Use this for **TESTNET ONLY**.

- **Goal:** Add a `cardano_address` to each user and allow them to send **Testnet ADA** from a wallet stored in their browser.

---

## 1. 🗄️ Step 1: Modify Database (PostgreSQL)

You only need to add **one** new column to your existing `users` table.

```sql
-- Run this command on your PostgreSQL database
ALTER TABLE users
ADD COLUMN cardano_address VARCHAR(255) UNIQUE;

-- (We are NOT adding the encrypted_mnemonic column)
2. 🖥️ Step 2: Modify Frontend (Registration Form)
Your registration form will generate a wallet, send the public address to the backend, and save the private key directly in the browser.

File: .../components/RegisterForm.js

JavaScript

// Import these at the top
import * as CSL from '@emurgo/cardano-serialization-lib-asmjs';
import axios from 'axios';
// (No Crypto-JS needed)

// ... inside your handleSubmit function ...
const handleSubmit = async (e) => {
  e.preventDefault();
  const { email, password } = /* ... get from form ... */;

  try {
    // 1. GENERATE NEW WALLET (Client-Side)
    const entropy = CSL.Bip39.generate_entropy();
    const mnemonic = CSL.Bip39.entropy_to_mnemonic(entropy);
    
    // 2. DERIVE TESTNET ADDRESS
    const rootKey = CSL.Bip32PrivateKey.from_bip39_entropy(entropy, "");
    // ... (derivation path for testnet) ...
    const address = CSL.BaseAddress.new(
      CSL.NetworkInfo.testnet().network_id(),
      // ... (stake & payment keys) ...
    ).to_address();
    
    const cardano_address = address.to_bech32();

    // 3. ⚠️ INSECURE STEP: Save raw mnemonic to localStorage
    // This is the "simple" part you requested.
    localStorage.setItem('user_mnemonic', mnemonic);
    
    // 4. CALL YOUR REGISTER ENDPOINT (with address only)
    await axios.post('http://localhost:3001/api/users', {
      email: email,
      password: password,
      cardano_address: cardano_address // Send public address
      // (No encrypted_mnemonic)
    });
    
    alert('Registration successful! Your wallet is saved in this browser.');
    // (Redirect to login or dashboard)

  } catch (err) {
    console.error("Registration failed:", err);
  }
};
3. ⚙️ Step 3: Modify Backend (Auth Endpoints)
Your backend is now much simpler. It just saves the public address and doesn't handle any keys.

POST /api/users (or /api/auth/register)
Modify your user creation to only accept the cardano_address.

JavaScript

// In your user creation route
app.post('/api/users', async (req, res) => {
  const { 
    email, 
    password, 
    cardano_address // <-- ONLY this new field
  } = req.body;

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  
  try {
    // Save to DB
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, cardano_address) VALUES ($1, $2, $3) RETURNING id, email',
      [email, password_hash, cardano_address]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    // ... error handling ...
  }
});
POST /api/auth/login
Your login endpoint does not need to change. It authenticates the user and sends a token. It does not send any wallet data, because the wallet is already in the browser's localStorage.

4. ⚙️ Step 4: Add Backend Proxy (No Change)
This part is still required. You must have the backend proxy endpoints to securely call Blockfrost with your API key.

GET /api/wallet/data/:address (Gets UTxOs)

GET /api/network/parameters (Gets network fees)

POST /api/tx/submit (Submits the signed transaction)

5. 🖥️ Step 5: Add Frontend "Send" Component
This component is also simpler. It doesn't need React Context for the key. It just reads the mnemonic directly from localStorage.

File: .../components/SendForm.js

JavaScript

// components/SendForm.js
"use client";

import { useState, useEffect } from 'react';
import * as CSL from '@emurgo/cardano-serialization-lib-asmjs';
import axios from 'axios';
import dynamic from 'next/dynamic';

// (Put helper functions like getPrivateKey and initTxBuilder here)
// ...

function SendForm() {
  const [mnemonic, setMnemonic] = useState(null);
  const [myAddress, setMyAddress] = useState(null);
  const [toAddress, setToAddress] = useState('');
  const [amountAda, setAmountAda] = useState('');
  const [status, setStatus] = useState('');

  // 1. On component load, read the wallet from localStorage
  useEffect(() => {
    const savedMnemonic = localStorage.getItem('user_mnemonic');
    if (savedMnemonic) {
      setMnemonic(savedMnemonic);
      
      // (You also need to get the user's address)
      // (This is a simplified example)
      // const address = getAddressFromMnemonic(savedMnemonic); 
      // setMyAddress(address);
      
      // OR get it from your logged-in user object
      // const { user } = useAuth();
      // setMyAddress(user.cardano_address);
      
    } else {
      setStatus('No wallet found in this browser.');
    }
  }, []);

  const handleSend = async () => {
    if (!mnemonic) {
      setStatus('Wallet not loaded.');
      return;
    }
    
    setStatus('Building transaction...');
    
    try {
      // 2. Fetch data from YOUR backend proxy
      // const { data: utxos } = await axios.get(`/api/wallet/data/${myAddress}`);
      // const { data: params } = await axios.get('/api/network/parameters');
      
      // (Mocking for this example)
      const myAddress = 'addr_test1q...'; // Get this from your user object
      const utxos = [ /* ... fetch from /api/wallet/data ... */ ];
      const params = { /* ... fetch from /api/network/parameters ... */ };

      // 3. Build and Sign Transaction (Client-Side)
      // (Same CSL logic as before)
      // const txBuilder = initTxBuilder(params);
      // const privateKey = getPrivateKey(mnemonic); // Use mnemonic from state
      // ... add inputs, outputs, and change ...
      // const signedTx = ...
      // const txBytes = signedTx.to_bytes();
      
      // 4. Submit via YOUR backend proxy
      // const res = await axios.post('/api/tx/submit', txBytes, {
      //   headers: { 'Content-Type': 'application/cbor' }
      // });
      
      // setStatus(`Success! TxHash: ${res.data.txHash}`);
      setStatus('Transaction logic goes here.');

    } catch (err) {
      // ... error handling ...
    }
  };

  return (
    <div>
      <h3>Send ADA (Testnet - INSECURE)</h3>
      {/* ... form inputs ... */}
      <button onClick={handleSend} disabled={!mnemonic}>Send</button>
      {status && <p>{status}</p>}
    </div>
  );
}

export default dynamic(() => Promise.resolve(SendForm), { ssr: false });