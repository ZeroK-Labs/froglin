use dep::aztec::{
    protocol_types::{traits::{Deserialize, Serialize}, constants::GENERATOR_INDEX__NOTE_NULLIFIER},
    macros::notes::note, hash::poseidon2_hash_with_separator,
    note::{note_header::NoteHeader, note_interface::NullifiableNote, utils::compute_note_hash_for_nullify},
    keys::getters::get_nsk_app, context::PrivateContext
};

// global STASH_NOTE_LEN: u32 = 1 + (crate::settings::FROGLIN_TYPE_COUNT / 2) as u32;
global STASH_NOTE_LEN: u32 = 1 + 4 as u32;
// STASH_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)

#[note]
struct StashNote {
    npk_m_hash: Field,
    froglin_0: Field,
    froglin_1: Field,
    froglin_2: Field,
    froglin_3: Field,
    // froglin_4: Field,
    // froglin_5: Field,
}

impl NullifiableNote for StashNote {
    fn compute_nullifier(self, context: &mut PrivateContext, note_hash_for_nullify: Field) -> Field {
        let secret = context.request_nsk_app(self.npk_m_hash);
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
        let secret = get_nsk_app(self.npk_m_hash);
        poseidon2_hash_with_separator(
            [
            note_hash_for_nullify,
            secret
        ],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field
        )
    }
}

impl StashNote {
    pub fn new(npk_m_hash: Field) -> Self {
        Self {
            header: NoteHeader::empty(),
            npk_m_hash,
            froglin_0: 0,
            froglin_1: 0,
            froglin_2: 0,
            froglin_3: 0,
            // froglin_4: 0,
            // froglin_5: 0
        }
    }

    pub fn empty() -> Self {
        StashNote::new(0)
    }

    pub fn copy(other: Self, npk_m_hash: Field) -> Self {
        Self {
            header: NoteHeader::empty(),
            npk_m_hash,
            froglin_0: other.froglin_0,
            froglin_1: other.froglin_1,
            froglin_2: other.froglin_2,
            froglin_3: other.froglin_3,
            // froglin_4: other.froglin_4,
            // froglin_5: other.froglin_5
        }
    }

    pub fn increment_slot(&mut self, slot: u8) {
        if (slot == 0) {
            self.froglin_0 += 1;
        } else if (slot == 1) {
            self.froglin_1 += 1;
        } else if (slot == 2) {
            self.froglin_2 += 1;
        } else if (slot == 3) {
            self.froglin_3 += 1;
        } //
        // else if (slot == 4) {
        //     self.froglin_4 += 1;
        // } else if (slot == 5) {
        //     self.froglin_5 += 1;
        // }
    }

    pub fn decrement_slot(&mut self, slot: u8) {
        if (slot == 0) {
            self.froglin_0 -= 1;
        } else if (slot == 1) {
            self.froglin_1 -= 1;
        } else if (slot == 2) {
            self.froglin_2 -= 1;
        } else if (slot == 3) {
            self.froglin_3 -= 1;
        } //
        //  else if (slot == 4) {
        //     self.froglin_4 -= 1;
        // } else if (slot == 5) {
        //     self.froglin_5 -= 1;
        // }
    }

    pub fn get_slot(&mut self, slot: u8) -> Field {
        if (slot == 0) {
            self.froglin_0
        } else if (slot == 1) {
            self.froglin_1
        } else if (slot == 2) {
            self.froglin_2
        } else if (slot == 3) {
            self.froglin_3
        } //
        // else if (slot == 4) {
        //     self.froglin_4
        // } else if (slot == 5) {
        //     self.froglin_5
        // } //
        else {
            0
        }
    }
}

impl Deserialize<STASH_NOTE_LEN> for StashNote {
    fn deserialize(values: [Field; STASH_NOTE_LEN]) -> Self {
        Self {
            header: NoteHeader::empty(),
            npk_m_hash: values[0],
            froglin_0: values[1],
            froglin_1: values[2],
            froglin_2: values[3],
            froglin_3: values[4],
            // froglin_4: values[5],
            // froglin_5: values[6]
        }
    }
}

impl Serialize<STASH_NOTE_LEN> for StashNote {
    fn serialize(self) -> [Field; STASH_NOTE_LEN] {
        [
            self.npk_m_hash,
            self.froglin_0,
            self.froglin_1,
            self.froglin_2,
            self.froglin_3,
            // self.froglin_4,
            // self.froglin_5
        ]
    }
}

impl Eq for StashNote {
    fn eq(self, other: Self) -> bool {
        (self.npk_m_hash == other.npk_m_hash)
            & (self.froglin_0 == other.froglin_0)
            & (self.froglin_1 == other.froglin_1)
            & (self.froglin_2 == other.froglin_2)
            & (self.froglin_3 == other.froglin_3)
            // & (self.froglin_4 == other.froglin_4)
            // & (self.froglin_5 == other.froglin_5)
    }
}
