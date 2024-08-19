use dep::aztec::{
    protocol_types::{
    address::AztecAddress, traits::{Deserialize, Serialize}, constants::GENERATOR_INDEX__NOTE_NULLIFIER,
    hash::poseidon2_hash_with_separator
},
    note::{note_header::NoteHeader, note_interface::NoteInterface, utils::compute_note_hash_for_nullify},
    oracle::unsafe_rand::unsafe_rand, keys::getters::get_nsk_app, context::PrivateContext
};

global PLAYER_NOTE_LEN: Field = 4;
// PLAYER_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
global PLAYER_NOTE_BYTES_LEN: Field = PLAYER_NOTE_LEN * 32 + 64;

#[aztec(note)]
struct PlayerNote {
    name: Field,
    npk_m_hash: Field,
    randomness: Field,
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
    pub fn new(name: Field, event: AztecAddress, npk_m_hash: Field) -> Self {
        let randomness = unsafe_rand();
        let header = NoteHeader::empty();
        PlayerNote { name, npk_m_hash, randomness, header }
    }
}

impl Serialize<PLAYER_NOTE_LEN> for PlayerNote {
    fn serialize(self) -> [Field; PLAYER_NOTE_LEN] {
        [self.name, self.npk_m_hash, self.randomness]
    }
}

impl Eq for PlayerNote {
    fn eq(self, other: Self) -> bool {
        (self.name == other.name) &
        (self.npk_m_hash == other.npk_m_hash) &
        (self.randomness == other.randomness)
    }
}
