use dep::aztec::{prelude::AztecAddress, protocol_types::traits::{Deserialize, Packable, Serialize}};

#[derive(Deserialize, Packable, Serialize)]
pub struct LeaderBoardEntry {
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
