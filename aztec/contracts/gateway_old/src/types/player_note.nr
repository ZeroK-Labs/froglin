use dep::aztec::{
    context::PrivateContext,
    keys::getters::{get_nsk_app, get_public_keys},
    macros::notes::note,
    note::{
        note_header::NoteHeader, note_interface::NullifiableNote,
        utils::compute_note_hash_for_nullify,
    },
    prelude::AztecAddress,
    protocol_types::{
        constants::GENERATOR_INDEX__NOTE_NULLIFIER, hash::poseidon2_hash_with_separator,
        traits::Serialize,
    },
};

use aztec::oracle::random::random;

global PLAYER_NOTE_LEN: u32 = 3;

#[note]
pub struct PlayerNote {
    owner: AztecAddress,
    name: Field,
    trader_id: Field,
}

impl NullifiableNote for PlayerNote {
    fn compute_nullifier(
        self,
        context: &mut PrivateContext,
        note_hash_for_nullify: Field,
    ) -> Field {
        let owner_npk_m_hash: Field = get_public_keys(self.owner).npk_m.hash();
        let secret = context.request_nsk_app(owner_npk_m_hash);
        poseidon2_hash_with_separator(
            [note_hash_for_nullify, secret],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }

    unconstrained fn compute_nullifier_without_context(self) -> Field {
        let note_hash_for_nullify = compute_note_hash_for_nullify(self);
        let owner_npk_m_hash: Field = get_public_keys(self.owner).npk_m.hash();
        let secret = get_nsk_app(owner_npk_m_hash);
        poseidon2_hash_with_separator(
            [note_hash_for_nullify, secret],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }
}

impl PlayerNote {
    pub fn new(name: Field, owner: AztecAddress) -> Self {
        PlayerNote { header: NoteHeader::empty(), owner, name, trader_id: unsafe { random() } }
    }
}

impl Serialize<PLAYER_NOTE_LEN> for PlayerNote {
    fn serialize(self) -> [Field; PLAYER_NOTE_LEN] {
        [self.owner.to_field(), self.name, self.trader_id]
    }
}

impl Eq for PlayerNote {
    fn eq(self, other: Self) -> bool {
        (self.owner == other.owner)
            & (self.name == other.name)
            & (self.trader_id == other.trader_id)
    }
}
