use dep::aztec::{
    keys::getters::{get_nsk_app, get_public_keys},
    macros::notes::note,
    note::utils::compute_note_hash_for_nullify,
    prelude::{NoteHeader, NullifiableNote, PrivateContext},
    protocol_types::{
        address::AztecAddress,
        constants::GENERATOR_INDEX__NOTE_NULLIFIER,
        hash::poseidon2_hash_with_separator,
        traits::{Deserialize, Empty, Hash, Packable, Serialize},
    },
};

global STASH_COUNT: u8 = 2;

#[note]
#[derive(Deserialize, Eq, Serialize)]
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

    unconstrained fn compute_nullifier_without_context(self, storage_slot: Field) -> Field {
        let note_hash_for_nullify = compute_note_hash_for_nullify(self, storage_slot);
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
