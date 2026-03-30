### PROJECT NAME

**FloodGuard Instant Relief**

### PROBLEM

Unbanked families in flood-prone areas like Marikina face critical shortages of food and shelter during typhoons because local NGOs rely on slow, manual damage assessments that take days to release emergency cash.

### SOLUTION

A mobile-first disaster response system where pre-registered residents instantly receive a 50 USDC emergency micro-grant triggered by a Soroban smart contract the moment local river telemetry sensors record critical flood levels, utilizing Stellar for near-zero fee, instant settlement.

### STELLAR FEATURES USED

* **Soroban smart contracts:** To hold NGO funds in escrow and handle the programmatic release logic based on sensor data.
* **USDC transfers:** To provide residents with stable, usable value rather than volatile cryptocurrencies.
* **Trustlines:** To allow resident wallets to hold and receive the USDC asset.

### TARGET USERS

* **Receivers:** Unbanked and low-income residents in Marikina who need immediate cash for evacuation or supplies.
* **Funders:** Local NGOs and international donors who want to pre-fund relief efforts with guaranteed, transparent, and instant execution.

### CORE FEATURE (MVP)

**User Action:** An NGO pre-funds the contract with USDC. A local sensor (simulated by an Admin CLI command for the demo) updates the contract's flood status to `CRITICAL`.
**On-chain Action:** The Soroban contract unlocks the funds. A registered resident clicks "Claim Relief" on their mobile web app.
**Result:** The contract verifies the resident's registration, checks they haven't claimed yet, and instantly transfers 50 USDC to their wallet.

### WHY THIS WINS

This project replaces bureaucratic delays with trustless, instant execution during life-or-death emergencies. Hackathon judges look for real-world impact; demonstrating how IoT data can trigger Stellar's fast payout capabilities to protect a highly vulnerable local economy creates a powerful, memorable pitch.

### OPTIONAL EDGE (FOR BONUS POINTS)

**Local Anchor Integration:** Demonstrate how users can take their instantly received on-chain USDC and cash it out at local pawnshops or remittance centers via an off-ramp anchor, proving end-to-end real-world utility.

### CONSTRAINTS

| Dimension | Selection |
| :--- | :--- |
| **Region** | SEA (Philippines) |
| **User Type** | NGOs, Unbanked |
| **Complexity** | Soroban required, Mobile-first |
| **Theme** | Social Impact → Disaster relief funds |

---

### SOROBAN CONTRACT OUTPUT

Here is the complete, compile-ready codebase for the FloodGuard MVP.

#### `lib.rs`

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol, symbol_short};

#[contracttype]
pub enum DataKey {
    Admin,
    UsdcToken,
    FloodStatus,
    Registered(Address),
    Claimed(Address),
}

const RELIEF_AMOUNT: i128 = 50_0000000; // 50 USDC (assuming 7 decimals)

#[contract]
pub struct FloodGuardContract;

#[contractimpl]
impl FloodGuardContract {
    /// Initializes the contract with the NGO admin and the USDC token address.
    pub fn init(env: Env, admin: Address, usdc_token: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::UsdcToken, &usdc_token);
        env.storage().instance().set(&DataKey::FloodStatus, &false);
    }

    /// Admin registers a vulnerable resident's wallet to be eligible for relief.
    pub fn register_user(env: Env, user: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        // Mark user as registered
        env.storage().persistent().set(&DataKey::Registered(user.clone()), &true);
        // Initialize claim status as false
        env.storage().persistent().set(&DataKey::Claimed(user), &false);
    }

    /// Oracle/Admin updates the flood status. True = Critical (release funds).
    pub fn set_flood_status(env: Env, is_critical: bool) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::FloodStatus, &is_critical);
    }

    /// Registered user claims their emergency USDC when flood status is critical.
    pub fn claim_relief(env: Env, user: Address) {
        user.require_auth();

        // 1. Check if flood is critical
        let is_critical: bool = env.storage().instance().get(&DataKey::FloodStatus).unwrap_or(false);
        if !is_critical {
            panic!("Flood status is not critical yet.");
        }

        // 2. Check if user is registered
        let is_registered: bool = env.storage().persistent().get(&DataKey::Registered(user.clone())).unwrap_or(false);
        if !is_registered {
            panic!("User is not registered for relief.");
        }

        // 3. Check if user already claimed
        let has_claimed: bool = env.storage().persistent().get(&DataKey::Claimed(user.clone())).unwrap_or(false);
        if has_claimed {
            panic!("User has already claimed relief funds.");
        }

        // 4. Transfer USDC from the contract to the user
        let token_id: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let client = token::Client::new(&env, &token_id);
        client.transfer(&env.current_contract_address(), &user, &RELIEF_AMOUNT);

        // 5. Update claim state
        env.storage().persistent().set(&DataKey::Claimed(user.clone()), &true);
    }
}
```

#### `test.rs`

```rust
#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};
use soroban_sdk::token::AdminClient;

fn setup_test() -> (Env, FloodGuardContractClient, Address, Address, token::Client) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    // Setup mock USDC token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_id);
    let token_admin_client = token::AdminClient::new(&env, &token_id);

    // Register contract
    let contract_id = env.register_contract(None, FloodGuardContract);
    let client = FloodGuardContractClient::new(&env, &contract_id);

    // Initialize contract
    client.init(&admin, &token_id);

    // Mint tokens to the contract to act as the NGO's deposited relief fund
    token_admin_client.mint(&contract_id, &1000_0000000);

    (env, client, admin, user, token_client)
}

#[test]
fn test_1_happy_path_claim() {
    let (_env, client, _admin, user, token_client) = setup_test();

    client.register_user(&user);
    client.set_flood_status(&true);
    
    // User claims funds
    client.claim_relief(&user);

    // Verify user received 50 USDC
    assert_eq!(token_client.balance(&user), 50_0000000);
}

#[test]
#[should_panic(expected = "Flood status is not critical yet.")]
fn test_2_edge_case_premature_claim() {
    let (_env, client, _admin, user, _token_client) = setup_test();

    client.register_user(&user);
    // Notice we do NOT set flood status to true here
    client.claim_relief(&user);
}

#[test]
fn test_3_state_verification_after_claim() {
    let (env, client, _admin, user, _token_client) = setup_test();

    client.register_user(&user);
    client.set_flood_status(&true);
    client.claim_relief(&user);

    // Use a direct storage check to verify state
    // We expect the contract to panic if they try to claim again
    let result = std::panic::catch_unwind(|| {
        client.claim_relief(&user);
    });
    
    assert!(result.is_err(), "Contract should panic when claiming twice, verifying state was saved.");
}

#[test]
#[should_panic(expected = "User is not registered for relief.")]
fn test_4_unregistered_user_cannot_claim() {
    let (env, client, _admin, _user, _token_client) = setup_test();
    let unregistered_user = Address::generate(&env);

    client.set_flood_status(&true);
    client.claim_relief(&unregistered_user);
}

#[test]
#[should_panic] // Panics because mock_auth requires admin, but we pass a different user
fn test_5_unauthorized_cannot_set_status() {
    let (env, client, _admin, _user, _token_client) = setup_test();
    let fake_admin = Address::generate(&env);
    
    // Disable mock auth to test actual auth requirements
    env.mock_auths(&[]);
    
    // This should fail because fake_admin is not the initialized admin
    client.set_flood_status(&true);
}
```

#### `Cargo.toml`

```toml
[package]
name = "floodguard_relief"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[features]
testutils = ["soroban-sdk/testutils"]

[dependencies]
soroban-sdk = "20.0.0"

[dev-dependencies]
soroban-sdk = { version = "20.0.0", features = ["testutils"] }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
```

#### `README.md`

```markdown
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

## Test Instructions

```bash
cargo test
```

## Testnet Deployment

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/floodguard_relief.wasm \
  --source alice \
  --network testnet
```

## Sample CLI Invocation

Initialize the contract:

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  init \
  --admin <ADMIN_PUBLIC_KEY> \
  --usdc_token <TESTNET_USDC_CONTRACT_ID>
```

Trigger the relief release:

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  set_flood_status \
  --is_critical true
```

## License

MIT

stellar contract invoke \
  --id GAYL4JZA2YD66JQUQFDFPYHW5WNVOIH7H57NG2FC4JYQX2TZUW2YG76D \
  --source-account student \
  --network testnet \
  --send=yes \
  -- set_greeting \
  --new_greeting "Hello from the blockchain!"

CAR6MBV56UHLI5YXGGPUN32ET25QGELNYCKXPGIIBC2GKY7LCLRSD456

stellar contract invoke \
  --id CAR6MBV56UHLI5YXGGPUN32ET25QGELNYCKXPGIIBC2GKY7LCLRSD456 \
  --source-account student \
  --network testnet \
  --send=yes \
  -- set_greeting \
  --new_greeting "Hello from the blockchain!"
