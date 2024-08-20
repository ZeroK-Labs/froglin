contract FroglinEvent {
    use dep::address_note::address_note::AddressNote;
    use dep::authwit::auth::{assert_current_call_valid_authwit, compute_authwit_nullifier};
    use dep::aztec::{
        encrypted_logs::encrypted_note_emission::{encode_and_encrypt_note, encode_and_encrypt_note_with_keys},
        prelude::{AztecAddress, Map, NoteGetterOptions, NoteViewerOptions},
        state_vars::{PrivateImmutable, PrivateMutable}
    };

    use dep::zkl_froglin::FroglinGateway;
    use dep::zkl_utils::public_keys::PublicKeys;
    use dep::zkl_utils::event_info_note::EventInfoNote;

    #[aztec(storage)]
    struct Storage {
        owner: PrivateImmutable<AddressNote>,
        data: PrivateMutable<EventInfoNote>,
        player: PrivateImmutable<AddressNote>,
        player_data: PrivateMutable<EventInfoNote>,
    }

    #[aztec(initializer)]
    #[aztec(private)]
    fn constructor(
        player: AztecAddress,
        longitude: Field,
        latitude: Field,
        epoch_count: Field,
        epoch_duration: Field,
        epoch_start_time: Field
    ) {
        let owner = context.msg_sender();

        assert(owner != player, "player cannot be owner");

        let owner_keys = PublicKeys::from_private_context(&mut context, owner);
        let mut owner_note = AddressNote::new(owner, owner_keys.npk_hash);
        let mut event_info_note = EventInfoNote::new(
            longitude,
            latitude,
            epoch_count,
            epoch_duration,
            epoch_start_time,
            owner_keys.npk_hash
        );

        let player_keys = PublicKeys::from_private_context(&mut context, player);
        let mut player_note = AddressNote::new(player, player_keys.npk_hash);

        storage.owner.initialize(&mut owner_note).emit(encode_and_encrypt_note(&mut context, owner, owner));
        storage.player.initialize(&mut player_note).emit(encode_and_encrypt_note(&mut context, owner, owner));
        storage.data.initialize(&mut event_info_note).emit(encode_and_encrypt_note(&mut context, owner, owner));
        event_info_note.npk_m_hash = player_keys.npk_hash;
        storage.player_data.initialize(&mut event_info_note).emit(encode_and_encrypt_note(&mut context, player, player));
    }

    #[aztec(internal)]
    #[aztec(view)]
    unconstrained fn _check_authorization(account: AztecAddress) {
        assert_eq(storage.owner.view_note().address, account, "method callable only by owner");
    }

    #[aztec(internal)]
    #[aztec(view)]
    unconstrained fn _view_player_address() -> pub AztecAddress {
        storage.player.view_note().address
    }

    // encode_and_encrypt_note_with_keys(&mut context, owner_keys.ovpk, owner_keys.ivpk, owner));

    #[aztec(private)]
    fn advance_epoch(epoch_start_time: Field) {
        let owner = context.msg_sender();
        _check_authorization(owner);

        let player = _view_player_address();

        assert_current_call_valid_authwit(&mut context, player);

        let owner_keys = PublicKeys::from_private_context(&mut context, owner);

        let mut event_info_note = storage.data.get_note().note;
        let mut new_event_info_note = EventInfoNote::new(
            event_info_note.longitude,
            event_info_note.latitude,
            event_info_note.epoch_count,
            event_info_note.epoch_duration,
            0,
            owner_keys.npk_hash
        );

        if (event_info_note.epoch_count == 0) {
            storage.data.replace(&mut new_event_info_note).emit(encode_and_encrypt_note(&mut context, owner, owner));
            assert(false, "event expired");
        }

        let player_keys = PublicKeys::from_private_context(&mut context, player);

        new_event_info_note.epoch_count = event_info_note.epoch_count - 1;
        new_event_info_note.epoch_start_time = epoch_start_time;

        storage.data.replace(&mut new_event_info_note).emit(encode_and_encrypt_note(&mut context, owner, owner));
        new_event_info_note.npk_m_hash = player_keys.npk_hash;
        storage.player_data.replace(&mut new_event_info_note).emit(encode_and_encrypt_note(&mut context, player, player));
    }

    #[aztec(view)]
    unconstrained fn view_event_info() -> pub EventInfoNote {
        storage.player_data.view_note()
    }

    #[aztec(view)]
    unconstrained fn view_event_info_owner() -> pub EventInfoNote {
        storage.data.view_note()
    }
    // #[aztec(internal)]
    // #[aztec(private)]
    // fn check_registration(player: AztecAddress) {
    //     FroglinGateway::at(AztecAddress::from_field(storage.gateway.get_note().value)).check_registration(player).call(&mut context);
    // }
    // // #[aztec(internal)]
    // // unconstrained fn check_registration(player: AztecAddress) {
    // //     assert(
    // //         FroglinGateway::at(AztecAddress::from_field(storage.gateway.view_note().value)).storage.accounts.at(player).is_initialized(), "method callable only by registered players"
    // //     );
    // // }
    // #[aztec(internal)]
    // #[aztec(view)]
    // unconstrained fn _check_authorization(account: AztecAddress) {
    //     assert_eq(storage.owner.read_public(), account, "method callable only by owner");
    // }
    // #[aztec(private)]
    // fn create_event_info_note(player: AztecAddress) {
    //     let owner = context.msg_sender();
    //     _check_authorization(owner);
    //     FroglinEvent::at(context.this_address()).check_registration(player).call(&mut context);
    //     let owner_keys = PublicKeys::from_private_context(&mut context, owner);
    //     let player_keys = PublicKeys::from_private_context(&mut context, player);
    //     let epoch_count = storage.epoch_count.get_note().note.value;
    //     let mut epoch_count_note = ValueNote::new(epoch_count, owner_keys.npk_hash);
    //     storage.epoch_count.replace(&mut epoch_count_note).emit(encode_and_encrypt_note_with_keys(&mut context, owner_keys.ovpk, owner_keys.ivpk, owner));
    //     let mut event_info_note = ValueNote::new(epoch_count, player_keys.npk_hash);
    //     storage.event_info_notes.at(player).initialize(&mut event_info_note).emit(encode_and_encrypt_note_with_keys(&mut context, player_keys.ovpk, player_keys.ivpk, player));
    // }
    // unconstrained fn view_owner() -> pub AztecAddress {
    //     storage.owner.read_public()
    // }
    // unconstrained fn view_epoch_count() -> pub Field {
    //     storage.epoch_count.view_note().value
    // }
    // unconstrained fn view_event_info(player: AztecAddress) -> pub ValueNote {
    //     // _check_registration(player);
    //     FroglinEvent::at(context.this_address()).check_registration(player);
    //     storage.event_info_notes.at(player).view_note()
    // }
}
