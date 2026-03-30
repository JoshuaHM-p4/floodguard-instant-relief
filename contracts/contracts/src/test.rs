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

    let resident_id = String::from_str(&env, "RES123");
    client.register_user(&user, &resident_id);
    client.set_flood_status(&true);
    
    // User claims funds
    client.claim_relief(&user, &resident_id);

    // Verify user received 50 USDC
    assert_eq!(token_client.balance(&user), 50_0000000);
}

#[test]
#[should_panic(expected = "Flood status is not critical yet.")]
fn test_2_edge_case_premature_claim() {
    let (env, client, _admin, user, _token_client) = setup_test();

    let resident_id = String::from_str(&env, "RES123");
    client.register_user(&user, &resident_id);
    // Notice we do NOT set flood status to true here
    client.claim_relief(&user, &resident_id);
}

#[test]
fn test_3_state_verification_after_claim() {
    let (env, client, _admin, user, _token_client) = setup_test();

    let resident_id = String::from_str(&env, "RES123");
    client.register_user(&user, &resident_id);
    client.set_flood_status(&true);
    client.claim_relief(&user, &resident_id);

    // Use a direct storage check to verify state
    // We expect the contract to panic if they try to claim again
    let result = std::panic::catch_unwind(|| {
        client.claim_relief(&user, &resident_id);
    });
    
    assert!(result.is_err(), "Contract should panic when claiming twice, verifying state was saved.");
}

#[test]
#[should_panic(expected = "User is not registered for relief.")]
fn test_4_unregistered_user_cannot_claim() {
    let (env, client, _admin, _user, _token_client) = setup_test();
    let unregistered_user = Address::generate(&env);

    let resident_id = String::from_str(&env, "ANY_ID");
    client.set_flood_status(&true);
    client.claim_relief(&unregistered_user, &resident_id);
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
