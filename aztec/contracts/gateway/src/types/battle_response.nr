use dep::aztec::protocol_types::traits::{Deserialize, Serialize};

global BATTLE_RESPONSE_FIELD_COUNT: u32 = 2;

struct BattleResponse {
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

impl Deserialize<BATTLE_RESPONSE_FIELD_COUNT> for BattleResponse {
    fn deserialize(values: [Field; BATTLE_RESPONSE_FIELD_COUNT]) -> Self {
        Self { froglin_won: values[0] as u8, froglin_to_recover: values[1] as u8 }
    }
}

impl Serialize<BATTLE_RESPONSE_FIELD_COUNT> for BattleResponse {
    fn serialize(self) -> [Field; BATTLE_RESPONSE_FIELD_COUNT] {
        [self.froglin_won as Field, self.froglin_to_recover as Field]
    }
}
