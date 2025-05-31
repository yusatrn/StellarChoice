#![no_std]
use soroban_sdk::{contractimpl, contracttype, symbol_short, Env, Symbol, Vec, Address};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    // Store the admin address
    Admin,
    // Store the vote count for each candidate (u32)
    VoteCount(u32),
    // Store if an address has voted
    HasVoted(Address),
}

pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    // Initialize the contract with an admin
    pub fn initialize(env: Env, admin: Address) {
        // Check if already initialized
        if env.storage().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        
        // Set the admin
        env.storage().set(&DataKey::Admin, &admin);
        
        // Initialize vote counts for 3 candidates (IDs: 0, 1, 2)
        for i in 0..3 {
            env.storage().set(&DataKey::VoteCount(i), &0u32);
        }
    }
    
    // Vote for a candidate
    pub fn vote(env: Env, voter: Address, candidate_id: u32) {
        // Only admin can call this function
        let admin: Address = env.storage().get_unchecked(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        // Check if the voter has already voted
        if env.storage().has(&DataKey::HasVoted(voter.clone())) {
            panic!("Already voted");
        }
        
        // Validate candidate ID
        if candidate_id >= 3 {
            panic!("Invalid candidate ID");
        }
        
        // Mark as voted
        env.storage().set(&DataKey::HasVoted(voter), &true);
        
        // Increment vote count
        let current_count: u32 = env.storage()
            .get_unchecked(&DataKey::VoteCount(candidate_id))
            .unwrap_or(0);
            
        env.storage().set(&DataKey::VoteCount(candidate_id), &(current_count + 1));
    }
    
    // Get vote count for a candidate
    pub fn get_vote_count(env: Env, candidate_id: u32) -> u32 {
        // Validate candidate ID
        if candidate_id >= 3 {
            panic!("Invalid candidate ID");
        }
        
        env.storage()
            .get_unchecked(&DataKey::VoteCount(candidate_id))
            .unwrap_or(0)
    }
    
    // Check if an address has voted
    pub fn has_voted(env: Env, voter: Address) -> bool {
        env.storage().has(&DataKey::HasVoted(voter))
    }
}

// Test module
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address};

    #[test]
    fn test_voting() {
        let env = Env::default();
        let contract_id = env.register_contract(None, VotingContract);
        let client = VotingContractClient::new(&env, &contract_id);
        
        // Test admin
        let admin = Address::random(&env);
        
        // Initialize the contract
        client.initialize(&admin);
        
        // Test getting initial vote counts
        assert_eq!(client.get_vote_count(&0), 0);
        assert_eq!(client.get_vote_count(&1), 0);
        assert_eq!(client.get_vote_count(&2), 0);
        
        // Test voting
        let voter1 = Address::random(&env);
        client.vote(&admin, &voter1, &0);
        
        // Check vote count
        assert_eq!(client.get_vote_count(&0), 1);
        assert!(client.has_voted(&voter1));
        
        // Test double voting
        let result = std::panic::catch_unwind(|| {
            client.vote(&admin, &voter1, &1);
        });
        assert!(result.is_err());
        
        // Test invalid candidate ID
        let result = std::panic::catch_unwind(|| {
            client.get_vote_count(&3);
        });
        assert!(result.is_err());
    }
}

// This is needed for the contract to be compatible with the Soroban environment
#[no_mangle]
pub fn test() {}

#[no_mangle]
pub fn deploy() {}

#[no_mangle]
pub fn upgrade() {}
