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
        constants::GENERATOR_INDEX__NOTE_NULLIFIER, hash::poseidon2_hash_with_separator,
        traits::Serialize,
    },
};

global EVENTS_NOTE_LEN: u32 = 5;

#[note]
pub struct EventsNote {
    owner: AztecAddress,
    event1_name: Field,
    event2_name: Field,
    event3_name: Field,
    event4_name: Field,
    // event5_name: Field,
}

impl NullifiableNote for EventsNote {
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

impl EventsNote {
    pub fn new(owner: AztecAddress) -> Self {
        EventsNote {
            header: NoteHeader::empty(),
            owner,
            event1_name: 0,
            event2_name: 0,
            event3_name: 0,
            event4_name: 0,
            // event5_name: 0
        }
    }

    pub fn copy(other: Self, owner: AztecAddress) -> Self {
        Self {
            header: NoteHeader::empty(),
            owner,
            event1_name: other.event1_name,
            event2_name: other.event2_name,
            event3_name: other.event3_name,
            event4_name: other.event4_name,
            // event5_name: other.event5_name
        }
    }
}

impl Serialize<EVENTS_NOTE_LEN> for EventsNote {
    fn serialize(self) -> [Field; EVENTS_NOTE_LEN] {
        [
            self.owner.to_field(),
            self.event1_name,
            self.event2_name,
            self.event3_name,
            self.event4_name,
            // self.event5_name
        ]
    }
}
