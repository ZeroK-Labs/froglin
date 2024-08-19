contract FroglinGateway {
    use dep::value_note::value_note::ValueNote;
    use dep::aztec::{
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note_with_keys,
        prelude::{AztecAddress, Map, NoteViewerOptions, PrivateSet}, state_vars::PrivateMutable
    };

    use dep::zkl_utils::public_keys::PublicKeys;
    use dep::zkl_utils::player_note::PlayerNote;

    global FROGLIN_COUNT = 12;

    #[aztec(storage)]
    struct Storage {
        accounts: Map<AztecAddress, PrivateMutable<PlayerNote>>,
        stash: Map<AztecAddress, Map<Field, PrivateMutable<ValueNote>>>,
    }

    #[aztec(initializer)]
    #[aztec(private)]
    fn construct_private() {}

    #[aztec(view)]
    #[aztec(internal)]
    unconstrained fn _check_registration(player: AztecAddress) {
        assert(storage.accounts.at(player).is_initialized(), "method callable only by registered players");
    }

    #[aztec(view)]
    #[aztec(internal)]
    unconstrained fn _check_new(player: AztecAddress) {
        assert(!storage.accounts.at(player).is_initialized(), "player is already registered");
    }

    #[aztec(private)]
    fn check_registration(player: AztecAddress) {
        _check_registration(player);
    }

    #[aztec(private)]
    fn capture_froglin(froglinType: Field) {}

    #[aztec(private)]
    fn register(name: Field) {
        let player = context.msg_sender();
        _check_new(player);

        let keys = PublicKeys::from_private_context(&mut context, player);

        let mut player_name_note = PlayerNote::new(name, AztecAddress::zero(), keys.npk_hash);
        storage.accounts.at(context.msg_sender()).initialize(&mut player_name_note).emit(encode_and_encrypt_note_with_keys(&mut context, keys.ovpk, keys.ivpk, player));
    }

    #[aztec(private)]
    fn update_name(name: Field) {
        let player = context.msg_sender();
        _check_registration(player);

        let keys = PublicKeys::from_private_context(&mut context, context.msg_sender());

        let old_player_note = storage.accounts.at(player).get_note().note;
        let x = view_name(player);

        let mut new_player_name = PlayerNote::new(name, old_player_note.event, keys.npk_hash);
        storage.accounts.at(context.msg_sender()).replace(&mut new_player_name).emit(encode_and_encrypt_note_with_keys(&mut context, keys.ovpk, keys.ivpk, player));
    }

    #[aztec(view)]
    unconstrained fn registered(player: AztecAddress) -> pub bool {
        storage.accounts.at(player).is_initialized()
    }

    #[aztec(view)]
    unconstrained fn view_contract_address(player: AztecAddress) -> pub AztecAddress {
        _check_registration(player);

        storage.accounts.at(player).view_note().event
    }

    #[aztec(view)]
    unconstrained fn view_name(player: AztecAddress) -> pub Field {
        _check_registration(player);

        storage.accounts.at(player).view_note().name
    }

    #[aztec(view)]
    unconstrained fn view_stash(player: AztecAddress) -> pub BoundedVec<Field, FROGLIN_COUNT> {
        _check_registration(player);

        let mut arr: BoundedVec<Field, FROGLIN_COUNT> = BoundedVec::new();

        for i in 0..FROGLIN_COUNT {
            arr.set(i, storage.stash.at(player).at(i as Field).view_note().value);
        }

        arr
    }
}
