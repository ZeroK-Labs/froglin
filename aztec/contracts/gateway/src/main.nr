mod types;

contract FroglinGateway {
    use dep::value_note::value_note::ValueNote;
    use dep::aztec::{
        keys::getters::get_current_public_keys,
        encrypted_logs::encrypted_note_emission::{encode_and_encrypt_note, encode_and_encrypt_note_with_keys},
        prelude::{AztecAddress, Map, NoteViewerOptions, PrivateSet},
        state_vars::{PrivateMutable, PublicMutable, SharedImmutable}
    };

    use crate::types::player_note::PlayerNote;

    global FROGLIN_TYPE_COUNT = 12 as u8;
    global LEADERBOARD_RETURN_SIZE = 10 as u8;
    global MAX_PLAYERS = 32 as u8;

    #[aztec(storage)]
    struct Storage {
        game_master: SharedImmutable<AztecAddress>,
        accounts: Map<AztecAddress, PrivateMutable<PlayerNote>>,
        stash: Map<AztecAddress, Map<Field, PrivateMutable<ValueNote>>>,
        froglin_count: PublicMutable<u8>,
        epoch_count: PublicMutable<u8>,
        epoch_duration: PublicMutable<u64>,
        epoch_start_time: PublicMutable<u64>,
        leaderboard: Map<AztecAddress, PublicMutable<u8>>,
        leaderboard_participants: Map<Field, PublicMutable<AztecAddress>>,
        leaderboard_size: PublicMutable<u8>
    }

    #[aztec(view)]
    #[aztec(internal)]
    unconstrained fn _check_registration(player: AztecAddress) {
        assert(storage.accounts.at(player).is_initialized(), "only registered players can call this method");
    }

    #[aztec(view)]
    #[aztec(internal)]
    unconstrained fn _check_availability(player: AztecAddress) {
        assert(!storage.accounts.at(player).is_initialized(), "player is already registered");
    }

    // for external calls from other contracts
    #[aztec(private)]
    fn check_registration(player: AztecAddress) {
        unsafe {
            _check_registration(player);
        }
    }

    #[aztec(initializer)]
    #[aztec(public)]
    fn construct_public() {
        let game_master = context.msg_sender();
        storage.game_master.initialize(game_master);

        storage.froglin_count.write(20);
        storage.epoch_count.write(0);
        storage.epoch_duration.write(0);
        storage.epoch_start_time.write(0);
        storage.leaderboard_size.write(0);
    }

    #[aztec(private)]
    fn register(name: Field) {
        let player = context.msg_sender();
        unsafe {
            _check_availability(player);
        }

        assert(player != storage.game_master.read_private(), "game master cannot register as player");

        let keys = get_current_public_keys(&mut context, player);

        let mut player_note = PlayerNote::new(name, keys.npk_m.hash());
        storage.accounts.at(context.msg_sender()).initialize(&mut player_note).emit(encode_and_encrypt_note(&mut context, player, player));

        let mut player_stash = storage.stash.at(player);
        // initialize player stash with 0 Froglins
        for i in 0..FROGLIN_TYPE_COUNT {
            let froglin_type = i as Field;
            let new_froglin_note = ValueNote::new(0, keys.npk_m.hash());
            player_stash.at(froglin_type).initialize(&mut new_froglin_note).emit(encode_and_encrypt_note(&mut context, player, player));
        }
    }

    #[aztec(private)]
    fn update_name(name: Field) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        let keys = get_current_public_keys(&mut context, context.msg_sender());

        let mut new_player_note = PlayerNote::new(name, keys.npk_m.hash());
        storage.accounts.at(context.msg_sender()).replace(&mut new_player_note).emit(encode_and_encrypt_note(&mut context, player, player));
    }

    #[aztec(public)]
    fn start_event(froglin_count: u8, epoch_count: u8, epoch_duration: u64, epoch_start_time: u64) {
        let game_master = context.msg_sender();
        assert_eq(game_master, storage.game_master.read_public(), "only game master can call this method");

        assert(storage.epoch_count.read() == 0, "event already started");

        let stored_epoch_start_time = storage.epoch_start_time.read();
        let stored_epoch_duration = storage.epoch_duration.read();
        if (epoch_start_time > 0) {
            let elapsed_time = (epoch_start_time - stored_epoch_start_time);
            assert(elapsed_time >= stored_epoch_duration, "too soon to start a new event");
        }

        storage.froglin_count.write(froglin_count);
        storage.epoch_start_time.write(epoch_start_time);
        storage.epoch_count.write(epoch_count);
        if (epoch_duration != stored_epoch_duration) {
            storage.epoch_duration.write(epoch_duration);
        }
    }

    #[aztec(public)]
    fn advance_epoch() {
        let game_master = context.msg_sender();
        assert_eq(game_master, storage.game_master.read_public(), "only game master can call this method");

        let epoch_count = storage.epoch_count.read();
        assert(epoch_count != 0, "event expired");

        storage.epoch_count.write(epoch_count - 1);
        storage.epoch_start_time.write(storage.epoch_start_time.read() + storage.epoch_duration.read());
    }

    #[aztec(internal)]
    #[aztec(public)]
    fn _decrement_froglin_count() {
        let froglin_count = storage.froglin_count.read();
        storage.froglin_count.write(froglin_count - 1);
    }

    #[aztec(internal)]
    #[aztec(public)]
    fn _increment_leaderboard(player: AztecAddress) {
        let current_score = storage.leaderboard.at(player).read();
        let new_score = current_score + 1;
        storage.leaderboard.at(player).write(new_score);

        let current_size = storage.leaderboard_size.read();

        // Check if the player is already in the leaderboard
        let mut player_found = false;
        for i in 0..current_size {
            if !player_found {
                player_found = storage.leaderboard_participants.at(i as Field).read() == player;
            }
        }

        // If player is not in the leaderboard, add him
        if !player_found {
            storage.leaderboard_participants.at(current_size as Field).write(player);
            storage.leaderboard_size.write(current_size + 1);
        }
    }

    #[aztec(private)]
    fn capture_froglin(froglin_type: u8) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
            // assert(view_epoch_count() != 0, "event is stopped");
            // assert(view_froglin_count() != 0, "all available Froglins have been captured");
        }
        assert(froglin_type < FROGLIN_TYPE_COUNT, "unknown Froglin type");

        let keys = get_current_public_keys(&mut context, player);

        let mut player_stash = storage.stash.at(player);

        let old_froglin_note = player_stash.at(froglin_type as Field).get_note().note;
        let new_froglin_note = ValueNote::new(old_froglin_note.value + 1, keys.npk_m.hash());

        player_stash.at(froglin_type as Field).replace(&mut new_froglin_note).emit(encode_and_encrypt_note(&mut context, player, player));

        FroglinGateway::at(context.this_address())._decrement_froglin_count().enqueue(&mut context);
        FroglinGateway::at(context.this_address())._increment_leaderboard(player).enqueue(&mut context);
    }

    #[aztec(view)]
    unconstrained fn registered(player: AztecAddress) -> pub bool {
        storage.accounts.at(player).is_initialized()
    }

    #[aztec(view)]
    unconstrained fn view_name(player: AztecAddress) -> pub Field {
        _check_registration(player);

        storage.accounts.at(player).view_note().name
    }

    #[aztec(view)]
    unconstrained fn view_froglin_count() -> pub u8 {
        storage.froglin_count.read()
    }

    #[aztec(view)]
    unconstrained fn view_epoch_count() -> pub u8 {
        storage.epoch_count.read()
    }

    #[aztec(view)]
    unconstrained fn view_epoch_duration() -> pub u64 {
        storage.epoch_duration.read()
    }

    #[aztec(view)]
    unconstrained fn view_epoch_start_time() -> pub u64 {
        storage.epoch_start_time.read()
    }

    #[aztec(view)]
    unconstrained fn view_stash(player: AztecAddress) -> pub BoundedVec<Field, FROGLIN_TYPE_COUNT> {
        _check_registration(player);

        let mut arr: BoundedVec<Field, FROGLIN_TYPE_COUNT> = BoundedVec::from_array([0; FROGLIN_TYPE_COUNT]);
        for i in 0..FROGLIN_TYPE_COUNT {
            let froglin_type = i as Field;
            arr.set(
                i as u32,
                storage.stash.at(player).at(froglin_type).view_note().value
            );
        }
        arr
    }

    #[aztec(view)]
    unconstrained fn _read_first_10_places() -> pub BoundedVec<(AztecAddress, u8), 10> {
        let leaderboard_size = storage.leaderboard_size.read();
        let mut all_entries: [(AztecAddress, u8); MAX_PLAYERS] = [(AztecAddress::zero(), 0); MAX_PLAYERS];

        for i in 0..leaderboard_size {
            let player = storage.leaderboard_participants.at(i as Field).read();
            let score = storage.leaderboard.at(player).read();
            all_entries[i] = ((player, score));
        }

        let sorted_descending = all_entries.sort_via(|a: (AztecAddress, u8), b: (AztecAddress, u8)| a.1 > b.1);

        let mut result: BoundedVec<(AztecAddress, u8), LEADERBOARD_RETURN_SIZE> = BoundedVec::new();
        for i in 0..LEADERBOARD_RETURN_SIZE {
            result.push(sorted_descending[i]);
        }

        result
    }
}
