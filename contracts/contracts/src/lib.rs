#![no_std]
mod test;
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
pub enum DataKey {
    Admin,
    UsdcToken,
    FloodStatus,
    Registered(Address),
    Claimed(Address),
    ResidentId(Address),
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

    /// Admin registers a vulnerable resident's wallet with an ID to be eligible for relief.
    pub fn register_user(env: Env, user: Address, resident_id: String) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        // Mark user as registered and store their ID
        env.storage().persistent().set(&DataKey::Registered(user.clone()), &true);
        env.storage().persistent().set(&DataKey::ResidentId(user.clone()), &resident_id);
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
    /// Requires providing the correct Resident ID for simple verification.
    pub fn claim_relief(env: Env, user: Address, provided_id: String) {
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

        // 3. Verify ID
        let actual_id: String = env.storage().persistent().get(&DataKey::ResidentId(user.clone())).unwrap();
        if actual_id != provided_id {
            panic!("Invalid Resident ID provided.");
        }

        // 4. Check if user already claimed
        let has_claimed: bool = env.storage().persistent().get(&DataKey::Claimed(user.clone())).unwrap_or(false);
        if has_claimed {
            panic!("User has already claimed relief funds.");
        }

        // 5. Transfer USDC from the contract to the user
        let token_id: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let client = soroban_sdk::token::Client::new(&env, &token_id);
        client.transfer(&env.current_contract_address(), &user, &RELIEF_AMOUNT);

        // 6. Update claim state
        env.storage().persistent().set(&DataKey::Claimed(user.clone()), &true);
    }

    /// Read-only: Get the NGO admin address.
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    /// Read-only: Get the USDC token address.
    pub fn get_usdc_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::UsdcToken).unwrap()
    }

    /// Read-only: Get current flood status.
    pub fn get_flood_status(env: Env) -> bool {
        env.storage().instance().get(&DataKey::FloodStatus).unwrap_or(false)
    }

    /// Read-only: Check if user is registered.
    pub fn is_registered(env: Env, user: Address) -> bool {
        env.storage().persistent().get(&DataKey::Registered(user)).unwrap_or(false)
    }

    /// Read-only: Get resident ID for a registered user.
    pub fn get_resident_id(env: Env, user: Address) -> String {
        env.storage().persistent().get(&DataKey::ResidentId(user)).unwrap_or(String::from_str(&env, ""))
    }

    /// Read-only: Check if user has claimed relief.
    pub fn has_claimed(env: Env, user: Address) -> bool {
        env.storage().persistent().get(&DataKey::Claimed(user)).unwrap_or(false)
    }
}
