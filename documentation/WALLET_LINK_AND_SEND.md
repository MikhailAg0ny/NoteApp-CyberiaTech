# Wallet Linking and Send Flow

This quick-start guide shows end users how to link a Cardano wallet inside NoteApp and send ADA to another address using the built-in Blaze-powered form.

## Prerequisites

- You are signed in to NoteApp so API calls include your JWT.
- `NEXT_PUBLIC_ENABLE_WALLET` is `true` (already configured in the deployed build or your local `.env`).
- Backend and frontend servers are both running if you are testing locally.
- (Recommended) A CIP-30 compatible wallet browser extension (Nami, Eternl, Flint). Manual linking also works if you only need to enter an address you control.

## Step 1 – Link a Wallet from the Sidebar

1. Open the sidebar and locate the **Wallet** card.
2. Click **Connect Wallet**. A list of detected browser wallets appears.
3. Select your wallet provider. The wallet will prompt you to grant access; approve the request.
4. After approval, the wallet address, label, network, and current ADA balance render in the card.
5. Click **Refresh** whenever you need the latest on-chain balance.

### Manual Linking (no browser wallet)

1. Expand **Link address manually** in the Wallet card.
2. Provide a nickname (label), the bech32 address you want to associate, and choose the network (`preprod` unless you deployed to mainnet).
3. Click **Link Address**. The address is now stored in the backend via `linkWalletManually` and treated like a connected wallet for balance lookups.
4. You can disconnect or replace the manual link at any time using the existing **Disconnect** button.

## Step 2 – Send ADA to Another Address

### Panel Callouts (from the actual page)

| Page element | Label you see | How to interact |
| --- | --- | --- |
| Wallet required banner | `Send ADA` card with dashed border text `Connect a browser wallet above...` | If you see this, go back to Step 1 and connect/link a wallet before continuing. |
| Panel header | `Send ADA` with the up-arrow icon and helper line `Signed with <wallet label> (<address...>)` | Confirm the wallet label/address pair matches the account you expect to debit. |
| Input #1 | `Recipient Address` | Paste/type the full `addr...` string. Field trims whitespace and surfaces the inline red warning `Recipient address is required` if left empty. |
| Input #2 | `Amount (ADA)` | Numeric input that enforces `step=0.000001` and no negatives. You can paste decimal strings; invalid values trigger `Enter a valid ADA amount`. |
| Primary button | `Send ADA` (blue) | Click once to start the transaction. The text flips to `Submitting…` and the button greys out until the request completes. |
| Success ribbon | `Transaction submitted: <hash>` with a green check | Appears directly under the header when a hash is returned. Click the truncated hash to copy it if your browser extension supports copying on click. |
| Error ribbon | Red text beginning with the warning icon | Shows precise validation/server issues (e.g., `Amount must be greater than zero`). Fix the inputs or connect state, then press **Send ADA** again. |

### Step-by-step action list

1. With a wallet linked, scroll to the **Send ADA** panel (sidebar section directly under the wallet card).
2. Fill in the inputs exactly as labeled (see table above for on-page wording).
3. Review the helper text above the button: it shows which wallet label will sign the transaction and truncates the current address so you can double-check the sender.
4. Click the blue **Send ADA** button. While the request is running the button text switches to **Submitting…** and the control is disabled to prevent duplicate clicks.
5. Approve the signing popup from your wallet extension. (Manual links should instead submit the pre-signed CBOR you created offline.)
6. The app then:
   - Builds a transaction with Blaze using your linked wallet session.
   - Submits the signed CBOR to `/api/wallet/submit`, which relays it to Blockfrost.
7. Watch the green confirmation row for the resulting transaction hash (also shown in the toast). Click the hash to copy it and verify on a Cardano explorer of your choice. If anything fails, the red warning row will explain what to fix; update the inputs and press **Send ADA** again.

## Troubleshooting

- **No wallets detected:** Make sure a CIP-30 wallet extension is installed, unlocked, and the page is reloaded so `window.cardano` is populated.
- **Manual link rejected:** Check that the address is valid bech32 for the chosen network. Test with `cardano-cli address info` or a public explorer if unsure.
- **Send action fails with 401:** Your NoteApp session expired. Log out/in so the JWT used for wallet APIs is refreshed.
- **Blockfrost 403 / 404:** Confirm the backend `.env` holds a valid `BLOCKFROST_API_KEY` for the same network selected in the UI.

_Last updated: November 18, 2025_
