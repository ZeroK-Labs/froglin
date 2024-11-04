use dep::aztec::{protocol_types::{traits::{Deserialize, Serialize}}};

global SWAP_PROPOSAL_FIELD_COUNT: u32 = 5;

struct BattleProposal {
    trader_id: Field,
    offered_froglin_type: u8,
    wanted_froglin_type: u8,
    status: u8,  // status: 1 - active, 2 - claimable, 3 - inactive, 4 - completed
    id: u32,
}

impl BattleProposal {
    pub fn new(trader_id: Field, offered_froglin_type: u8, wanted_froglin_type: u8, id: u32) -> Self {
        Self {
            trader_id,
            offered_froglin_type,
            wanted_froglin_type,
            status: 1,
            id,
        }
    }

    pub fn empty() -> Self {
        Self {
            trader_id: 0,
            offered_froglin_type: 101,
            wanted_froglin_type: 101,
            status: 3,
            id: 101,
        }
    }

    pub fn change_status(&mut self, new_status: u8) {
        self.status = new_status;
    }
}

impl Deserialize<SWAP_PROPOSAL_FIELD_COUNT> for BattleProposal {
    fn deserialize(values: [Field; SWAP_PROPOSAL_FIELD_COUNT]) -> Self {
        Self {
            trader_id: values[0] as Field,
            offered_froglin_type: values[1] as u8,
            wanted_froglin_type: values[2] as u8,
            status: values[3] as u8,
            id: values[4] as u32,
        }
    }
}

impl Serialize<SWAP_PROPOSAL_FIELD_COUNT> for BattleProposal {
    fn serialize(self) -> [Field; SWAP_PROPOSAL_FIELD_COUNT] {
        [
            self.trader_id as Field,
            self.offered_froglin_type as Field,
            self.wanted_froglin_type as Field,
            self.status as Field,
            self.id as Field,
        ]
    }
}
