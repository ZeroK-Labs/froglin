use dep::aztec::{
    protocol_types::{traits::Serialize, constants::GENERATOR_INDEX__NOTE_NULLIFIER},
    macros::notes::note, hash::poseidon2_hash_with_separator,
    note::{note_header::NoteHeader, note_interface::NullifiableNote, utils::compute_note_hash_for_nullify},
    keys::getters::get_nsk_app, context::PrivateContext
};

global TRADE_NOTE_LEN: u32 = 3;
// TRADE_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
// global TRADE_NOTE_BYTES_LEN: Field = TRADE_NOTE_LEN * 32 + 64;

#[note]
struct TradeNote {
    npk_m_hash: Field,
    sell: Field,
    buy: Field,
}

impl NullifiableNote for TradeNote {
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

impl TradeNote {
    pub fn new(sell: Field, buy: Field, npk_m_hash: Field) -> Self {
        TradeNote { header: NoteHeader::empty(), npk_m_hash, sell, buy }
    }
}

impl Serialize<TRADE_NOTE_LEN> for TradeNote {
    fn serialize(self) -> [Field; TRADE_NOTE_LEN] {
        [self.npk_m_hash, self.sell, self.buy]
    }
}

impl Eq for TradeNote {
    fn eq(self, other: Self) -> bool {
        (self.npk_m_hash == other.npk_m_hash) & (self.sell == other.sell) & (self.buy == other.buy)
    }
}
