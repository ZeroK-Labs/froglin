use dep::aztec::protocol_types::traits::{Deserialize, Packable, Serialize};

#[derive(Deserialize, Packable, Serialize)]
pub struct DateProposal {
    pub trader_id: Field,
    pub offered_froglin_type: u8,
    pub status: u8, // status: 1 - active, 2 - claimable, 3 - inactive, 4 - completed
    id: u32,
}

impl DateProposal {
    pub fn new(trader_id: Field, offered_froglin_type: u8, id: u32) -> Self {
        Self { trader_id, offered_froglin_type, status: 1, id }
    }

    pub fn empty() -> Self {
        Self { trader_id: 0, offered_froglin_type: 101, status: 3, id: 101 }
    }

    pub fn change_status(&mut self, new_status: u8) {
        self.status = new_status;
    }
}
