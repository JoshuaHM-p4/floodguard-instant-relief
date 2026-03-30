mod test;

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
