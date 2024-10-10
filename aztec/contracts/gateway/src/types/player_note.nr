use dep::aztec::{
    protocol_types::{traits::Serialize, constants::GENERATOR_INDEX__NOTE_NULLIFIER},
    hash::poseidon2_hash_with_separator,
    note::{note_header::NoteHeader, note_interface::NoteInterface, utils::compute_note_hash_for_nullify},
    keys::getters::get_nsk_app, context::PrivateContext
};

use aztec::oracle::unsafe_rand::unsafe_rand;

global PLAYER_NOTE_LEN: Field = 3;
// PLAYER_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
global PLAYER_NOTE_BYTES_LEN: Field = PLAYER_NOTE_LEN * 32 + 64;

#[aztec(note)]
struct PlayerNote {
    npk_m_hash: Field,
    name: Field,
    trader_id: Field,
}

impl NoteInterface<PLAYER_NOTE_LEN, PLAYER_NOTE_BYTES_LEN> for PlayerNote {
    fn compute_nullifier(self, context: &mut PrivateContext, note_hash_for_nullify: Field) -> Field {
        let secret = context.request_nsk_app(self.npk_m_hash);
        poseidon2_hash_with_separator([
            note_hash_for_nullify,
            secret
        ],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }

    fn compute_nullifier_without_context(self) -> Field {
        let note_hash_for_nullify = compute_note_hash_for_nullify(self);
        let secret = get_nsk_app(self.npk_m_hash);
        poseidon2_hash_with_separator([
            note_hash_for_nullify,
            secret,
        ],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }
}

impl PlayerNote {
    pub fn new(name: Field, npk_m_hash: Field) -> Self {
        PlayerNote { header: NoteHeader::empty(), npk_m_hash, name, trader_id: unsafe_rand() }
    }
}

impl Serialize<PLAYER_NOTE_LEN> for PlayerNote {
    fn serialize(self) -> [Field; PLAYER_NOTE_LEN] {
        [self.npk_m_hash, self.name, self.trader_id]
    }
}

impl Eq for PlayerNote {
    fn eq(self, other: Self) -> bool {
        (self.npk_m_hash == other.npk_m_hash) &
        (self.name == other.name) &
        (self.trader_id == other.trader_id)
    }
}
