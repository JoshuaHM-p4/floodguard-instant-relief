# FloodGuard Instant Relief

**Instant, smart-contract triggered micro-grants for flood victims.**

## Problem

Unbanked families face critical shortages during typhoons because NGOs rely on manual damage assessments that take days to release emergency cash.

## Solution

A mobile platform where registered residents instantly receive a 50 USDC emergency grant triggered by a Soroban smart contract when local IoT sensors report critical flood levels, utilizing Stellar for instant settlement.

## Timeline for MVP

* **Day 1:** Contract logic, testing, and deployment to Testnet.
* **Day 2:** Frontend integration using Freighter wallet and building the presentation pitch.

## Stellar Features Used

* **Soroban Smart Contracts:** Escrow and distribution logic.
* **USDC Transfers:** Distributing stable value.
* **Trustlines:** Required for user wallets to accept the USDC asset.

## Prerequisites

* Rust toolchain (`rustup target add wasm32-unknown-unknown`)
* Soroban CLI (`stellar-cli v25+`)

## Build Instructions

```bash
stellar contract build
```

### 🚀 Deployment Details

**Network:** Stellar Testnet  
**Contract ID:** `CCZUEHXZLHRFDMWRPX3KIEJWF4ZHIGDVBQ3PEM7IXOEXT2D6XXAQPK7Y`

**Transaction Links:**

* **WASM Upload:** [View on Stellar.Expert](https://stellar.expert/explorer/testnet/tx/d22f5f0daf1e8c76ec3dc8e210126e9563fba651c33ec67264ca689e244cf9ae)
* **Contract Instantiation:** [View on Stellar.Expert](https://stellar.expert/explorer/testnet/tx/efe2fa6a97e183ef4e04837bac88052018f98412620fa634e70942c4826fd21b)
* **Stellar Lab Explorer:** [Interact via Lab](https://lab.stellar.org/r/testnet/contract/CCZUEHXZLHRFDMWRPX3KIEJWF4ZHIGDVBQ3PEM7IXOEXT2D6XXAQPK7Y)

### Contract Initialization

Function: `init`

Admin Address: `admin` (Your local identity)

Token ID: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` (Native Asset)

Transaction Link: View Initialization on [Stellar.Expert](https://stellar.expert/explorer/testnet/tx/78fed873c7429d663ee4f3b4887616c8a8d584e8d467c96716ef0bc3cc484693)

---

## License

MIT License
