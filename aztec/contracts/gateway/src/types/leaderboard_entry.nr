use dep::aztec::{prelude::AztecAddress, protocol_types::{traits::{Deserialize, Serialize}}};

global FIELD_COUNT = 2;

struct LeaderBoardEntry {
    pub player: AztecAddress,
    pub score: u32,
}

impl LeaderBoardEntry {
    pub fn zero() -> Self {
        Self { player: AztecAddress::zero(), score: 0 }
    }

    pub fn new(player: AztecAddress, score: u32) -> Self {
        Self { player, score }
    }
}

impl Deserialize<FIELD_COUNT> for LeaderBoardEntry {
    fn deserialize(values: [Field; FIELD_COUNT]) -> Self {
        Self {
            player: AztecAddress::from_field(values[0]),
            score: values[1] as u32,
        }
    }
}

impl Serialize<FIELD_COUNT> for LeaderBoardEntry {
    fn serialize(self) -> [Field; FIELD_COUNT] {
        [self.player.to_field(), self.score as Field]
    }
}
