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
        constants::GENERATOR_INDEX__NOTE_NULLIFIER,
        hash::poseidon2_hash_with_separator,
        traits::{Deserialize, Serialize},
    },
};

global STASH_NOTE_LEN: u32 = 3;
global STASH_COUNT: u8 = 2;

#[note]
pub struct StashNote {
    owner: AztecAddress,
    stash_1: u64,
    stash_2: u64,
}

impl NullifiableNote for StashNote {
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

impl StashNote {
    pub fn new(owner: AztecAddress) -> Self {
        Self { header: NoteHeader::empty(), owner, stash_1: 0, stash_2: 0 }
    }

    pub fn empty() -> Self {
        StashNote::new(AztecAddress::zero())
    }

    pub fn copy(other: Self, owner: AztecAddress) -> Self {
        Self { header: NoteHeader::empty(), owner, stash_1: other.stash_1, stash_2: other.stash_2 }
    }

    pub fn increment_slot(&mut self, index: u8) {
        let mut stash_index = index;
        for _i in 0..STASH_COUNT {
            if stash_index >= 8 {
                stash_index = stash_index - 8;
            }
        }

        let mut index_mask = 1;
        for i in 0..7 {
            if i < stash_index {
                index_mask *= 256;
            }
        }

        if (index < 8) {
            self.stash_1 = self.stash_1 + index_mask;
        } //
        else if (index < 16) {
            self.stash_2 = self.stash_2 + index_mask;
        }
    }

    pub fn decrement_slot(&mut self, index: u8) {
        let mut stash_index = index;
        for _i in 0..STASH_COUNT {
            if stash_index >= 8 {
                stash_index = stash_index - 8;
            }
        }

        let mut index_mask = 1;
        for i in 0..7 {
            if i < stash_index {
                index_mask *= 256;
            }
        }

        if (index < 8) {
            self.stash_1 = self.stash_1 - index_mask;
        } //
        else if (index < 16) {
            self.stash_2 = self.stash_2 - index_mask;
        }
    }

    pub fn get_slot(self, index: u8) -> u8 {
        let mut stash_index = index;
        for _i in 0..STASH_COUNT {
            if stash_index >= 8 {
                stash_index = stash_index - 8;
            }
        }

        let mut index_mask = 1;
        for i in 0..7 {
            if i < stash_index {
                index_mask *= 256;
            }
        }

        let stash = if (index < 8) {
            self.stash_1
        } //
        else if (index < 16) {
            self.stash_2
        } //
        else {
            0
        };

        (stash / index_mask) as u8
    }
}

impl Deserialize<STASH_NOTE_LEN> for StashNote {
    fn deserialize(values: [Field; STASH_NOTE_LEN]) -> Self {
        Self {
            header: NoteHeader::empty(),
            owner: AztecAddress::from_field(values[0]),
            stash_1: values[1] as u64,
            stash_2: values[2] as u64,
        }
    }
}

impl Serialize<STASH_NOTE_LEN> for StashNote {
    fn serialize(self) -> [Field; STASH_NOTE_LEN] {
        [self.owner.to_field(), self.stash_1 as Field, self.stash_2 as Field]
    }
}

impl Eq for StashNote {
    fn eq(self, other: Self) -> bool {
        (self.owner == other.owner)
            & (self.stash_1 == other.stash_1)
            & (self.stash_2 == other.stash_2)
    }
}
