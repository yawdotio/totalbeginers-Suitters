# Getting WAL Tokens for Walrus Storage

## The Issue

You're seeing this error when trying to upload images:
```
Not enough coins of type 0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL to satisfy requested balance
```

This means your sponsor wallet doesn't have WAL tokens, which are required to pay for Walrus decentralized storage.

## Solution: Get WAL Tokens from Faucet

### Step 1: Get Your Sponsor Wallet Address

Your sponsor wallet address is the one associated with `SPONSOR_PRIVATE_KEY` in your backend `.env` file.

To find it, run this command:

```bash
cd backend
node -e "const {Ed25519Keypair} = require('@mysten/sui/keypairs/ed25519'); const keypair = Ed25519Keypair.fromSecretKey(process.env.SPONSOR_PRIVATE_KEY); console.log('Address:', keypair.getPublicKey().toSuiAddress());"
```

Or check the backend startup logs - it should show the sponsor address.

### Step 2: Get WAL Tokens from the Faucet

**Walrus Testnet Faucet:**
```
https://faucet.walrus.site/
```

1. Go to the faucet URL
2. Enter your sponsor wallet address
3. Request WAL tokens
4. Wait for the transaction to complete

### Step 3: Verify You Have WAL Tokens

Check your wallet balance on the Sui explorer:
```
https://suiscan.xyz/testnet/account/YOUR_SPONSOR_ADDRESS
```

Look for WAL tokens in the coin list.

## Current Behavior (Temporary)

Until you get WAL tokens, the app will:
- ✅ Allow posts to be created **without images**
- ⚠️ Show a warning when image upload fails
- 📝 Continue creating the post with empty image URL

## After Getting WAL Tokens

Once your sponsor wallet has WAL tokens:
1. Restart the backend server
2. Try uploading an image again
3. Images will be uploaded to Walrus decentralized storage
4. Image URLs will be stored in posts

## Alternative: Use a Different Storage Solution

If you prefer not to use Walrus, you could:
1. Store images on IPFS
2. Use a traditional cloud storage (S3, Cloudinary, etc.)
3. Use base64 encoding (not recommended for blockchain)

Just update the `/api/upload-image` endpoint in `backend/src/index.ts`.

---

**Need Help?**
- Walrus Documentation: https://docs.walrus.site/
- Walrus Discord: https://discord.gg/sui
