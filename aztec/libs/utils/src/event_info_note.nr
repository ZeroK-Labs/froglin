use dep::aztec::{
    protocol_types::{
    address::AztecAddress, traits::{Deserialize, Serialize}, constants::GENERATOR_INDEX__NOTE_NULLIFIER,
    hash::poseidon2_hash_with_separator
},
    note::{note_header::NoteHeader, note_interface::NoteInterface, utils::compute_note_hash_for_nullify},
    oracle::unsafe_rand::unsafe_rand, keys::getters::get_nsk_app, context::PrivateContext
};

global EVENT_INFO_NOTE_LEN: Field = 7;
// EVENT_INFO_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
global EVENT_INFO_NOTE_BYTES_LEN: Field = EVENT_INFO_NOTE_LEN * 32 + 64;

#[aztec(note)]
struct EventInfoNote {
    longitude: Field,
    latitude: Field,
    epoch_count: Field,
    epoch_duration: Field,
    epoch_start_time: Field,
    npk_m_hash: Field,
    randomness: Field,
}

impl NoteInterface<EVENT_INFO_NOTE_LEN, EVENT_INFO_NOTE_BYTES_LEN> for EventInfoNote {
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

impl EventInfoNote {
    pub fn new(
        longitude: Field,
        latitude: Field,
        epoch_count: Field,
        epoch_duration: Field,
        epoch_start_time: Field,
        npk_m_hash: Field
    ) -> Self {
        let randomness = unsafe_rand();
        let header = NoteHeader::empty();
        EventInfoNote { longitude, latitude, epoch_count, epoch_duration, epoch_start_time, npk_m_hash, randomness, header }
    }
}

impl Serialize<EVENT_INFO_NOTE_LEN> for EventInfoNote {
    fn serialize(self) -> [Field; EVENT_INFO_NOTE_LEN] {
        [self.longitude, self.latitude, self.epoch_count, self.epoch_duration, self.epoch_start_time, self.npk_m_hash, self.randomness]
    }
}

impl Eq for EventInfoNote {
    fn eq(self, other: Self) -> bool {
        (self.longitude == other.longitude) &
        (self.latitude == other.latitude) &
        (self.epoch_count == other.epoch_count) &
        (self.epoch_duration == other.epoch_duration) &
        (self.epoch_start_time == other.epoch_start_time) &
        (self.npk_m_hash == other.npk_m_hash) &
        (self.randomness == other.randomness)
    }
}
