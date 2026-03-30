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

## License

MIT License
