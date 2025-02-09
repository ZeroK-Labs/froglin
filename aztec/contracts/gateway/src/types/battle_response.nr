use dep::aztec::protocol_types::traits::{Deserialize, Packable, Serialize};

#[derive(Deserialize, Packable, Serialize)]
pub struct BattleResponse {
    pub froglin_won: u8,
    pub froglin_to_recover: u8,
}

impl BattleResponse {
    pub fn new(froglin_won: u8, froglin_to_recover: u8) -> Self {
        Self { froglin_won, froglin_to_recover }
    }

    pub fn empty() -> Self {
        Self { froglin_won: 101, froglin_to_recover: 101 }
    }
}
