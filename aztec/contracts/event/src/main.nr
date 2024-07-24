contract FroglinEvent {
    use dep::authwit::{auth::assert_current_call_valid_authwit};
    use dep::value_note::value_note::ValueNote;
    use dep::aztec::{
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note_with_keys,
        prelude::{AztecAddress, Map}, state_vars::{PrivateImmutable, PrivateMutable, SharedImmutable}
    };

    use dep::zkl_froglin::FroglinGateway;
    use dep::zkl_utils::public_keys::PublicKeys;

    #[aztec(storage)]
    struct Storage {
        owner: SharedImmutable<AztecAddress>,
        epoch_count: PrivateMutable<ValueNote>,
        players: Map<AztecAddress, PrivateMutable<ValueNote>>,
        event_info_notes: Map<AztecAddress, PrivateMutable<ValueNote>>,
        gateway: PrivateImmutable<ValueNote>,
    }

    #[aztec(internal)]
    #[aztec(public)]
    fn construct_public(owner: AztecAddress) {
        storage.owner.initialize(owner);
    }

    #[aztec(initializer)]
    #[aztec(private)]
    fn construct_private(gateway: AztecAddress) {
        let owner = context.msg_sender();
        let keys = PublicKeys::from_private_context(&mut context, owner);

        let mut epoch_count_note = ValueNote::new(21, keys.npk_hash);
        storage.epoch_count.initialize(&mut epoch_count_note).emit(encode_and_encrypt_note_with_keys(&mut context, keys.ovpk, keys.ivpk));

        let mut gateway_as_field_note = ValueNote::new(gateway.to_field(), keys.npk_hash);
        storage.gateway.initialize(&mut gateway_as_field_note).emit(encode_and_encrypt_note_with_keys(&mut context, keys.ovpk, keys.ivpk));

        FroglinEvent::at(context.this_address()).construct_public(owner).enqueue(&mut context);
    }

    #[aztec(internal)]
    #[aztec(private)]
    fn check_registration(player: AztecAddress) {
        FroglinGateway::at(AztecAddress::from_field(storage.gateway.get_note().value)).check_registration(player).call(&mut context);
    }

    // #[aztec(internal)]
    // unconstrained fn check_registration(player: AztecAddress) {
    //     assert(
    //         FroglinGateway::at(AztecAddress::from_field(storage.gateway.view_note().value)).storage.accounts.at(player).is_initialized(), "method callable only by registered players"
    //     );
    // }

    #[aztec(internal)]
    #[aztec(view)]
    unconstrained fn _check_authorization(account: AztecAddress) {
        assert_eq(storage.owner.read_public(), account, "method callable only by owner");
    }

    #[aztec(private)]
    fn create_event_info_note(player: AztecAddress) {
        let owner = context.msg_sender();

        _check_authorization(owner);
        FroglinEvent::at(context.this_address()).check_registration(player).call(&mut context);

        let owner_keys = PublicKeys::from_private_context(&mut context, owner);
        let player_keys = PublicKeys::from_private_context(&mut context, player);

        let epoch_count = storage.epoch_count.get_note().note.value;

        let mut epoch_count_note = ValueNote::new(epoch_count, owner_keys.npk_hash);
        storage.epoch_count.replace(&mut epoch_count_note).emit(encode_and_encrypt_note_with_keys(&mut context, owner_keys.ovpk, owner_keys.ivpk));

        let mut event_info_note = ValueNote::new(epoch_count, player_keys.npk_hash);
        storage.event_info_notes.at(player).initialize(&mut event_info_note).emit(encode_and_encrypt_note_with_keys(&mut context, player_keys.ovpk, player_keys.ivpk));
    }

    unconstrained fn view_owner() -> pub AztecAddress {
        storage.owner.read_public()
    }

    unconstrained fn view_epoch_count() -> pub Field {
        storage.epoch_count.view_note().value
    }

    unconstrained fn view_event_info(player: AztecAddress) -> pub ValueNote {
        // _check_registration(player);
        FroglinEvent::at(context.this_address()).check_registration(player);
        storage.event_info_notes.at(player).view_note()
    }
}
