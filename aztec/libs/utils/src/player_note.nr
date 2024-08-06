use dep::aztec::{
    protocol_types::{
    address::AztecAddress, traits::{Deserialize, Serialize, ToField, FromField},
    constants::GENERATOR_INDEX__NOTE_NULLIFIER, hash::poseidon2_hash
},
    note::{note_header::NoteHeader, note_interface::NoteInterface, utils::compute_note_hash_for_consumption},
    oracle::unsafe_rand::unsafe_rand, keys::getters::get_nsk_app, context::PrivateContext
};

global PLAYER_NOTE_LEN: Field = 4;
// PLAYER_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
global PLAYER_NOTE_BYTES_LEN: Field = PLAYER_NOTE_LEN * 32 + 64;

#[aztec(note)]
struct PlayerNote {
    event: AztecAddress,
    name: Field,
    npk_m_hash: Field,
    randomness: Field,
}

impl NoteInterface<PLAYER_NOTE_LEN, PLAYER_NOTE_BYTES_LEN> for PlayerNote {
    fn compute_note_hash_and_nullifier(self, context: &mut PrivateContext) -> (Field, Field) {
        let note_hash_for_nullify = compute_note_hash_for_consumption(self);
        let secret = context.request_nsk_app(self.npk_m_hash);
        let nullifier = poseidon2_hash([
            note_hash_for_nullify,
            secret,
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        ]);
        (note_hash_for_nullify, nullifier)
    }

    fn compute_note_hash_and_nullifier_without_context(self) -> (Field, Field) {
        let note_hash_for_nullify = compute_note_hash_for_consumption(self);
        let secret = get_nsk_app(self.npk_m_hash);
        let nullifier = poseidon2_hash([
            note_hash_for_nullify,
            secret,
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        ]);
        (note_hash_for_nullify, nullifier)
    }
}

impl PlayerNote {
    pub fn new(name: Field, event: AztecAddress, npk_m_hash: Field) -> Self {
        let randomness = unsafe_rand();
        let header = NoteHeader::empty();
        PlayerNote { name, event, npk_m_hash, randomness, header }
    }
}

impl Serialize<PLAYER_NOTE_LEN> for PlayerNote {
    fn serialize(self) -> [Field; PLAYER_NOTE_LEN] {
        [self.name, self.event.to_field(), self.npk_m_hash, self.randomness]
    }
}

impl Eq for PlayerNote {
    fn eq(self, other: Self) -> bool {
        (self.name == other.name) &
        (self.event == other.event) &
        (self.npk_m_hash == other.npk_m_hash) &
        (self.randomness == other.randomness)
    }
}
