use dep::aztec::{
    keys::getters::{get_nsk_app, get_public_keys},
    macros::notes::note,
    note::utils::compute_note_hash_for_nullify,
    oracle::random::random,
    prelude::{NoteHeader, NullifiableNote, PrivateContext},
    protocol_types::{
        address::AztecAddress,
        constants::GENERATOR_INDEX__NOTE_NULLIFIER,
        hash::poseidon2_hash_with_separator,
        traits::{Empty, Hash, Packable, Serialize},
    },
};

#[note]
#[derive(Eq, Serialize)]
pub(crate) struct PlayerNote {
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

impl PlayerNote {
    pub(crate) fn new(name: Field, owner: AztecAddress) -> Self {
        PlayerNote {
            header: NoteHeader::empty(),
            owner,
            name,
            trader_id: /// SAFETY:
            unsafe { random() },
        }
    }
}
