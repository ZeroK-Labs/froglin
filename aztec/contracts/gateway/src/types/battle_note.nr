use dep::aztec::{
    protocol_types::{traits::Serialize, constants::GENERATOR_INDEX__NOTE_NULLIFIER},
    prelude::AztecAddress, macros::notes::note, hash::poseidon2_hash_with_separator,
    note::{note_header::NoteHeader, note_interface::NullifiableNote, utils::compute_note_hash_for_nullify},
    keys::getters::get_nsk_app, context::PrivateContext
};
use dep::std::mem::zeroed;
use aztec::oracle::random::random;

global PLAYER_NOTE_LEN: u32 = 5;
// PLAYER_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
// global PLAYER_NOTE_BYTES_LEN: u32 = PLAYER_NOTE_LEN * 32 + 64;

#[note]
struct BattleNote {
    secret_hash: Field,
    choices: Field,
    address1: AztecAddress,
    address2: AztecAddress,
    proposal_id: Field,
}

impl NullifiableNote for BattleNote {
    fn compute_nullifier(self, context: &mut PrivateContext, note_hash_for_nullify: Field) -> Field {
        let note_hash_for_nullify = compute_note_hash_for_nullify(self);
        poseidon2_hash_with_separator(
            [note_hash_for_nullify],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field
        )
    }

    unconstrained fn compute_nullifier_without_context(self) -> Field {
        self.compute_nullifier(zeroed(), zeroed())
    }
}

impl BattleNote {
    pub fn new(
        secret_hash: Field,
        choices: Field,
        address1: AztecAddress,
        address2: AztecAddress,
        proposal_id: Field
    ) -> Self {
        BattleNote { header: NoteHeader::empty(), secret_hash, choices, address1, address2, proposal_id }
    }
}

impl Serialize<PLAYER_NOTE_LEN> for BattleNote {
    fn serialize(self) -> [Field; PLAYER_NOTE_LEN] {
        [
            self.secret_hash, self.choices, self.address1.to_field(), self.address2.to_field(), self.proposal_id
        ]
    }
}

impl Eq for BattleNote {
    fn eq(self, other: Self) -> bool {
        (self.secret_hash == other.secret_hash)
            & (self.choices == other.choices)
            & (self.address1 == other.address1)
            & (self.address2 == other.address2)
            & (self.proposal_id == other.proposal_id)
    }
}
