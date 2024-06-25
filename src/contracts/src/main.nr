contract Froglin {
    use dep::aztec::encrypted_logs::encrypted_note_emission::encode_and_encrypt_with_keys;
    use dep::aztec::prelude::{AztecAddress, PrivateMutable, Map, NoteInterface, NoteHeader, PrivateContext};
    use dep::aztec::protocol_types::grumpkin_point::GrumpkinPoint;
    use dep::value_note::value_note::{ValueNote, VALUE_NOTE_LEN};

    #[aztec(storage)]
    struct Storage {
        players: Map<AztecAddress, PrivateMutable<ValueNote>>,
    }

    struct PublicKeys {
        npk_hash: Field,
        ovpk: GrumpkinPoint,
        ivpk: GrumpkinPoint,
    }

    #[aztec(private)]
    #[aztec(initializer)]
    fn constructor() {}

    // #[aztec(private)]
    // #[aztec(internal)]
    // #[aztec(view)]
    // fn _get_keys() -> PublicKeys {
    //     let owner = context.msg_sender();
    //     let header = context.get_header();

    //     PublicKeys {
    //         npk_hash: header.get_npk_m_hash(&mut context, owner),
    //         ovpk: header.get_ovpk_m(&mut context, owner),
    //         ivpk: header.get_ivpk_m(&mut context, owner)
    //     }
    // }

    #[aztec(private)]
    fn register(name: Field) {
        let owner = context.msg_sender();
        let header = context.get_header();

        let keys = PublicKeys {
            npk_hash: header.get_npk_m_hash(&mut context, owner),
            ovpk: header.get_ovpk_m(&mut context, owner),
            ivpk: header.get_ivpk_m(&mut context, owner)
        };

        let players = storage.players;
        let mut new_player_name = ValueNote::new(name, keys.npk_hash);
        players.at(context.msg_sender()).initialize(&mut new_player_name).emit(encode_and_encrypt_with_keys(&mut context, keys.ovpk, keys.ivpk));
    }

    #[aztec(private)]
    fn update_name(name: Field) {
        let owner = context.msg_sender();
        let header = context.get_header();

        let keys = PublicKeys {
            npk_hash: header.get_npk_m_hash(&mut context, owner),
            ovpk: header.get_ovpk_m(&mut context, owner),
            ivpk: header.get_ivpk_m(&mut context, owner)
        };

        let players = storage.players;
        let mut new_player_name = ValueNote::new(name, keys.npk_hash);
        players.at(context.msg_sender()).replace(&mut new_player_name).emit(encode_and_encrypt_with_keys(&mut context, keys.ovpk, keys.ivpk));
    }

    // used only by the contract to get the name and work with it internally
    #[aztec(private)]
    fn get_name() -> Field {
        let name_note = storage.players.at(context.msg_sender()).get_note().note;
        name_note.value
    }

    // used only by front end to view the private name
    unconstrained fn view_name(owner: AztecAddress) -> pub ValueNote {
        storage.players.at(owner).view_note()
    }
}
