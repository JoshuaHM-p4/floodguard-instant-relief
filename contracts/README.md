# FloodGuard Smart Contracts

This directory contains the Soroban smart contract logic for the FloodGuard Instant Relief platform.

## Directory Structure

```text
contracts/
├── Cargo.toml                # Project configuration and dependencies
└── contracts/
    └── src/
        ├── lib.rs            # Main contract logic
        └── test.rs           # Unit tests
```

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli)

### Build

To compile the contract to WASM:

```bash
cargo build --target wasm32-unknown-unknown --release
```

### Test

To run the unit tests:

```bash
cargo test
```
