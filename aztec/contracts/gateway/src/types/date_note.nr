use dep::aztec::{
    context::PrivateContext,
    hash::poseidon2_hash_with_separator,
    keys::getters::{get_nsk_app, get_public_keys},
    macros::notes::note,
    note::{
        note_header::NoteHeader, note_interface::NullifiableNote,
        utils::compute_note_hash_for_nullify,
    },
    prelude::AztecAddress,
    protocol_types::{constants::GENERATOR_INDEX__NOTE_NULLIFIER, traits::Serialize},
};

global PLAYER_NOTE_LEN: u32 = 5;

#[note]
struct DateNote {
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

impl Serialize<PLAYER_NOTE_LEN> for DateNote {
    fn serialize(self) -> [Field; PLAYER_NOTE_LEN] {
        [
            self.owner.to_field(),
            self.choices,
            self.proposal_id,
            self.dating_froglin,
            self.player_address.to_field(),
        ]
    }
}

impl Eq for DateNote {
    fn eq(self, other: Self) -> bool {
        (self.owner == other.owner)
            & (self.choices == other.choices)
            & (self.proposal_id == other.proposal_id)
            & (self.dating_froglin == other.dating_froglin)
            & (self.player_address == other.player_address)
    }
}
