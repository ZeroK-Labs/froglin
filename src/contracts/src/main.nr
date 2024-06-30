mod public_keys;

contract Froglin {
    use dep::authwit::{auth::assert_current_call_valid_authwit};
    use dep::value_note::value_note::ValueNote;
    use dep::aztec::{
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note_with_keys,
        prelude::{AztecAddress, Map, NoteGetterOptions}, state_vars::{PrivateMutable, SharedImmutable},
        oracle::debug_log::{debug_log, debug_log_format}
    };

    use crate::public_keys::PublicKeys;

    #[aztec(storage)]
    struct Storage {
        owner: SharedImmutable<AztecAddress>,
        epoch_count: PrivateMutable<ValueNote>,
        players: Map<AztecAddress, PrivateMutable<ValueNote>>,
        event_info_notes: Map<AztecAddress, PrivateMutable<ValueNote>>,
    }

    // "Modifiers"

    #[aztec(internal)]
    unconstrained fn _check_registration(account: AztecAddress) {
        assert(
            storage.players.at(account).is_initialized(), "method callable only by registered player accounts"
        );
    }

    #[aztec(internal)]
    unconstrained fn _check_authorization(account: AztecAddress) {
        assert_eq(storage.owner.read_public(), account, "method callable only by owner");
    }

    #[aztec(internal)]
    #[aztec(public)]
    fn construct_public(owner: AztecAddress) {
        storage.owner.initialize(owner);
    }

    #[aztec(initializer)]
    #[aztec(private)]
    fn construct_private() {
        let owner = context.msg_sender();
        let keys = PublicKeys::from_private_context(&mut context, owner);

        let mut epoch_count_note = ValueNote::new(21, keys.npk_hash);
        storage.epoch_count.initialize(&mut epoch_count_note).emit(encode_and_encrypt_note_with_keys(&mut context, keys.ovpk, keys.ivpk));

        Froglin::at(context.this_address()).construct_public(owner).enqueue(&mut context);
    }

    #[aztec(private)]
    fn register(name: Field) {
        let keys = PublicKeys::from_private_context(&mut context, context.msg_sender());

        let players = storage.players;
        let mut player_name_note = ValueNote::new(name, keys.npk_hash);
        players.at(context.msg_sender()).initialize(&mut player_name_note).emit(encode_and_encrypt_note_with_keys(&mut context, keys.ovpk, keys.ivpk));
    }

    #[aztec(private)]
    fn update_name(name: Field) {
        let keys = PublicKeys::from_private_context(&mut context, context.msg_sender());

        let players = storage.players;
        let mut new_player_name = ValueNote::new(name, keys.npk_hash);
        players.at(context.msg_sender()).replace(&mut new_player_name).emit(encode_and_encrypt_note_with_keys(&mut context, keys.ovpk, keys.ivpk));
    }

    #[aztec(private)]
    fn create_event_info_note(player: AztecAddress) {
        let owner = context.msg_sender();

        _check_authorization(owner);
        _check_registration(player);

        let owner_keys = PublicKeys::from_private_context(&mut context, owner);
        let player_keys = PublicKeys::from_private_context(&mut context, player);

        let epoch_count = storage.epoch_count.get_note().note.value;

        let mut epoch_count_note = ValueNote::new(epoch_count, owner_keys.npk_hash);
        storage.epoch_count.replace(&mut epoch_count_note).emit(encode_and_encrypt_note_with_keys(&mut context, owner_keys.ovpk, owner_keys.ivpk));

        let mut event_info_note = ValueNote::new(epoch_count, player_keys.npk_hash);
        storage.event_info_notes.at(player).initialize(&mut event_info_note).emit(encode_and_encrypt_note_with_keys(&mut context, player_keys.ovpk, player_keys.ivpk));
    }

    // front-end viewing functions

    unconstrained fn view_owner() -> pub AztecAddress {
        storage.owner.read_public()
    }

    unconstrained fn view_epoch_count() -> pub Field {
        storage.epoch_count.view_note().value
    }

    unconstrained fn view_name(player: AztecAddress) -> pub Field {
        _check_registration(player);

        storage.players.at(player).view_note().value
    }

    unconstrained fn view_event_info(player: AztecAddress, npk_hash: Field) -> pub ValueNote {
        _check_registration(player);

        let note = storage.event_info_notes.at(player).view_note();

        assert_eq(npk_hash, note.npk_m_hash, "not allowed");

        note
    }
}
