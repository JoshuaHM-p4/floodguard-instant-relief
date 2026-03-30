# FloodGuard Frontend

The mobile-first React application for the FloodGuard Instant Relief platform, built with Next.js and powered by Stellar Soroban.

## Features

- **Wallet Connection:** Integration with Freighter wallet.
- **Real-time Status:** Live tracking of flood levels via Soroban smart contract.
- **Resident Dashboard:** Check eligibility and claim emergency micro-grants.
- **Admin Panel:** NGO interface to manage flood status and resident registration.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Stellar Interaction:** `@stellar/stellar-sdk`, `@stellar/freighter-api`
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- [Freighter Wallet Extension](https://freighter.app/)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Ensure `.env.local` contains the following (already configured in this repo):
   ```env
   NEXT_PUBLIC_CONTRACT_ID=CCZUEHXZLHRFDMWRPX3KIEJWF4ZHIGDVBQ3PEM7IXOEXT2D6XXAQPK7Y
   NEXT_PUBLIC_USDC_TOKEN_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
   NEXT_PUBLIC_NETWORK=testnet
   NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org:443
   ```

### Running the App

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

- **Resident View:** `/`
- **Admin View:** `/admin`

## Contract Interaction

The app interacts with the `FloodGuardContract` on the Stellar Testnet. It uses read-only simulations for fetching status and registration, and signed transactions for claiming relief and admin actions.
