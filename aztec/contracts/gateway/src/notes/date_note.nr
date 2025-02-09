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

#[note]
#[derive(Deserialize, Eq, Serialize)]
pub struct DateNote {
    owner: AztecAddress,
    choices: Field,
    proposal_id: Field,
    dating_froglin: Field,
    player_address: AztecAddress,
}

impl NullifiableNote for DateNote {
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

impl DateNote {
    pub fn new(
        owner: AztecAddress,
        choices: Field,
        proposal_id: Field,
        dating_froglin: Field,
        player_address: AztecAddress,
    ) -> Self {
        DateNote {
            header: NoteHeader::empty(),
            owner,
            choices,
            proposal_id,
            dating_froglin,
            player_address,
        }
    }
}
