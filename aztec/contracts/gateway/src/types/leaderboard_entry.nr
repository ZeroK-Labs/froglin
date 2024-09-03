use dep::aztec::{prelude::AztecAddress, protocol_types::traits::{Deserialize, Serialize}};

struct LeaderboardEntry {
    player: AztecAddress,
    score: u32
}

impl LeaderboardEntry {
    pub fn zero() -> Self {
        Self { player: AztecAddress::zero(), score: 0 }
    }

    pub fn new(player: AztecAddress, score: u32) -> Self {
        Self { player, score }
    }
}

impl Deserialize<2> for LeaderboardEntry {
    fn deserialize(values: [Field; 2]) -> Self {
        LeaderboardEntry::new(AztecAddress::from_field(values[0]), values[1] as u32)
    }
}

impl Serialize<2> for LeaderboardEntry {
    fn serialize(self) -> [Field; 2] {
        [self.player.inner, self.score as Field]
    }
}
