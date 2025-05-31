#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, Address, Map};

const VOTER_KEY: Symbol = symbol_short!("voter");
const VOTE_COUNT_KEY: Symbol = symbol_short!("votes");

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn vote(env: Env, voter: Address, candidate_id: u32) {
        // Aynı kişi tekrar oy kullanamaz
        if Self::has_voted(env.clone(), voter.clone()) {
            panic!("Zaten oy kullandınız!");
        }

        // Kullanıcının oy kullandığını işaretle
        let key = (VOTER_KEY, voter);
        env.storage().persistent().set(&key, &true);
        
        // Adayın oy sayısını güncelle
        let vote_count = Self::get_vote_count(env.clone(), candidate_id);
        let count_key = (VOTE_COUNT_KEY, candidate_id);
        env.storage().persistent().set(&count_key, &(vote_count + 1));
    }

    // Birinin oy kullanıp kullanmadığını kontrol et
    pub fn has_voted(env: Env, voter: Address) -> bool {
        let key = (VOTER_KEY, voter);
        env.storage()
            .persistent()
            .get::<_, bool>(&key)
            .unwrap_or(false)
    }

    // Bir adayın oy sayısını al
    pub fn get_vote_count(env: Env, candidate_id: u32) -> u32 {
        let key = (VOTE_COUNT_KEY, candidate_id);
        env.storage()
            .persistent()
            .get::<_, u32>(&key)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_voting() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let voter1 = Address::generate(&env);
        let voter2 = Address::generate(&env);
        let candidate_id = 1;

        // İlk oy
        client.vote(&voter1, &candidate_id);
        assert_eq!(client.has_voted(&voter1), true);
        assert_eq!(client.get_vote_count(&candidate_id), 1);

        // Aynı kişi tekrar oy kullanamaz
        let result = std::panic::catch_unwind(|| {
            client.vote(&voter1, &candidate_id);
        });
        assert!(result.is_err());

        // İkinci oy
        client.vote(&voter2, &candidate_id);
        assert_eq!(client.has_voted(&voter2), true);
        assert_eq!(client.get_vote_count(&candidate_id), 2);
    }
}