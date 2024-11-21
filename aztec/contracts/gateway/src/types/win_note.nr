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
use dep::std::mem::zeroed;
use aztec::oracle::random::random;

global PLAYER_NOTE_LEN: u32 = 3;

#[note]
struct WinNote {
    owner: AztecAddress,
    froglin_won: Field,
    froglin_to_recover: Field,
}

impl NullifiableNote for WinNote {
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

impl WinNote {
    pub fn new(owner: AztecAddress, froglin_won: Field, froglin_to_recover: Field) -> Self {
        WinNote { header: NoteHeader::empty(), owner, froglin_won, froglin_to_recover }
    }
}

impl Serialize<PLAYER_NOTE_LEN> for WinNote {
    fn serialize(self) -> [Field; PLAYER_NOTE_LEN] {
        [self.owner.to_field(), self.froglin_won, self.froglin_to_recover]
    }
}

impl Eq for WinNote {
    fn eq(self, other: Self) -> bool {
        (self.owner == other.owner)
            & (self.froglin_won == other.froglin_won)
            & (self.froglin_to_recover == other.froglin_to_recover)
    }
}
