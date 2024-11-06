use dep::aztec::{
    protocol_types::{traits::Serialize, constants::GENERATOR_INDEX__NOTE_NULLIFIER},
    prelude::AztecAddress, macros::notes::note, hash::poseidon2_hash_with_separator,
    note::{note_header::NoteHeader, note_interface::NullifiableNote, utils::compute_note_hash_for_nullify},
    keys::getters::{get_nsk_app, get_public_keys}, context::PrivateContext
};

use aztec::oracle::random::random;

global PLAYER_NOTE_LEN: u32 = 3;
// PLAYER_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
// global PLAYER_NOTE_BYTES_LEN: u32 = PLAYER_NOTE_LEN * 32 + 64;

#[note]
struct PlayerNote {
    owner: AztecAddress,
    name: Field,
    trader_id: Field,
}

impl NullifiableNote for PlayerNote {
    fn compute_nullifier(self, context: &mut PrivateContext, note_hash_for_nullify: Field) -> Field {
        let owner_npk_m_hash: Field = get_public_keys(self.owner).npk_m.hash();
        let secret = context.request_nsk_app(owner_npk_m_hash);
        poseidon2_hash_with_separator(
            [
            note_hash_for_nullify,
            secret
        ],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field
        )
    }

    unconstrained fn compute_nullifier_without_context(self) -> Field {
        let note_hash_for_nullify = compute_note_hash_for_nullify(self);
        let owner_npk_m_hash: Field = get_public_keys(self.owner).npk_m.hash();
        let secret = get_nsk_app(owner_npk_m_hash);
        poseidon2_hash_with_separator(
            [
            note_hash_for_nullify,
            secret
        ],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field
        )
    }
}

impl PlayerNote {
    pub fn new(name: Field, owner: AztecAddress) -> Self {
        PlayerNote { header: NoteHeader::empty(), owner, name, trader_id: random() }
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
