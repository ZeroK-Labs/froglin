mod types;

contract FroglinGateway {
    use dep::value_note::value_note::ValueNote;
    use dep::aztec::{
        keys::getters::get_current_public_keys,
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note, prelude::{AztecAddress, Map},
        state_vars::{PrivateMutable, PublicMutable, SharedImmutable}
    };

    use crate::types::player_note::PlayerNote;
    use crate::types::leaderboard_entry::LeaderBoardEntry;

    global FROGLIN_TYPE_COUNT = 12 as u8;
    global MAX_PLAYERS = 32 as u8;

    #[aztec(storage)]
    struct Storage {
        game_master: SharedImmutable<AztecAddress>,
        accounts: Map<AztecAddress, PrivateMutable<PlayerNote>>,
        accounts_size: PublicMutable<u8>,
        froglin_count: PublicMutable<u8>,
        epoch_count: PublicMutable<u8>,
        epoch_duration: PublicMutable<u64>,
        epoch_start_time: PublicMutable<u64>,
        stash: Map<AztecAddress, Map<u8, PrivateMutable<ValueNote>>>,
        leaderboard: Map<u8, PublicMutable<LeaderBoardEntry>>,
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

        storage.accounts_size.write(0);
        storage.froglin_count.write(0);
        storage.epoch_count.write(0);
        storage.epoch_duration.write(0);
        storage.epoch_start_time.write(0);
    }

    #[aztec(internal)]
    #[aztec(public)]
    unconstrained fn _register(player: AztecAddress) {
        let accounts_size = storage.accounts_size.read();
        storage.leaderboard.at(accounts_size).write(LeaderBoardEntry::new(player, 0));
        storage.accounts_size.write(accounts_size + 1);
    }

    #[aztec(private)]
    fn register(name: Field) {
        unsafe {
            assert(view_accounts_size() <= MAX_PLAYERS, "registration is fully booked");
        }

        let player = context.msg_sender();
        unsafe {
            _check_availability(player);
        }

        assert(player != storage.game_master.read_private(), "game master cannot register as player");

        let keys = get_current_public_keys(&mut context, player);

        let player_note = PlayerNote::new(name, keys.npk_m.hash());
        storage.accounts.at(context.msg_sender()).initialize(&mut player_note).emit(encode_and_encrypt_note(&mut context, player, player));

        // initialize player stash with 0 Froglins
        let mut player_stash = storage.stash.at(player);
        for froglin_type in 0..FROGLIN_TYPE_COUNT {
            let new_froglin_note = ValueNote::new(0, keys.npk_m.hash());
            player_stash.at(froglin_type).initialize(&mut new_froglin_note).emit(encode_and_encrypt_note(&mut context, player, player));
        }

        // modify public data
        FroglinGateway::at(context.this_address())._register(player).enqueue(&mut context);
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

        let stored_epoch_count = storage.epoch_count.read();
        assert((stored_epoch_count == 1) | (stored_epoch_count == 0), "event already started");

        let stored_epoch_start_time = storage.epoch_start_time.read();
        let stored_epoch_duration = storage.epoch_duration.read();
        if (epoch_start_time > 0) {
            let elapsed_time = (epoch_start_time - stored_epoch_start_time);
            assert(elapsed_time >= stored_epoch_duration, "too soon to start a new event");
        }

        assert(froglin_count >= 5, "froglin count should be at least 5");
        storage.froglin_count.write(froglin_count);

        storage.epoch_start_time.write(epoch_start_time);

        assert(epoch_count >= 3, "epoch count should be at least 3");
        storage.epoch_count.write(epoch_count);

        assert(epoch_duration >= 20_000, "epoch duration should be at least 20 seconds");
        storage.epoch_duration.write(epoch_duration);
    }

    #[aztec(public)]
    fn advance_epoch() {
        let game_master = context.msg_sender();
        assert_eq(game_master, storage.game_master.read_public(), "only game master can call this method");

        let epoch_count = storage.epoch_count.read();
        assert(epoch_count > 1, "event expired");

        storage.epoch_count.write(epoch_count - 1);
        storage.epoch_start_time.write(storage.epoch_start_time.read() + storage.epoch_duration.read());
    }

    #[aztec(internal)]
    #[aztec(public)]
    fn _capture_froglin(player: AztecAddress) {
        let new_froglin_count = storage.froglin_count.read() - 1;
        storage.froglin_count.write(new_froglin_count);

        let accounts_size = storage.accounts_size.read();
        let mut player_index = MAX_PLAYERS;
        for i in 0..accounts_size {
            if (player == storage.leaderboard.at(i).read().player) {
                player_index = i;
                break;
            }
        }

        // // add player to leaderboard when missing
        // if (player_index == MAX_PLAYERS) {
        //     player_index = storage.accounts_size.read() - 1;
        //     storage.leaderboard.at(player_index).write(LeaderBoardEntry::new(player, 0));
        // }

        let mut new_leaderboard_entry = storage.leaderboard.at(player_index).read();
        new_leaderboard_entry.score = new_leaderboard_entry.score + 1;

        storage.leaderboard.at(player_index).write(new_leaderboard_entry);
    }

    #[aztec(private)]
    fn capture_froglin(froglin_type: u8) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
            assert(view_epoch_count() != 0, "event is stopped");
            assert(view_froglin_count() != 0, "all available Froglins have been captured");
        }
        assert(froglin_type < FROGLIN_TYPE_COUNT, "unknown Froglin type");

        let keys = get_current_public_keys(&mut context, player);

        let mut player_stash = storage.stash.at(player);

        let old_froglin_note = player_stash.at(froglin_type).get_note().note;
        let new_froglin_note = ValueNote::new(old_froglin_note.value + 1, keys.npk_m.hash());

        player_stash.at(froglin_type).replace(&mut new_froglin_note).emit(encode_and_encrypt_note(&mut context, player, player));

        // modify public data
        FroglinGateway::at(context.this_address())._capture_froglin(player).enqueue(&mut context);
    }

    #[aztec(view)]
    unconstrained fn registered(player: AztecAddress) -> pub bool {
        storage.accounts.at(player).is_initialized()
    }

    #[aztec(view)]
    unconstrained fn view_accounts_size() -> pub u8 {
        storage.accounts_size.read()
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
        for froglin_type in 0..FROGLIN_TYPE_COUNT {
            arr.set(
                froglin_type as u32,
                storage.stash.at(player).at(froglin_type).view_note().value
            );
        }

        arr
    }

    #[aztec(view)]
    unconstrained fn view_leaderboard() -> pub [LeaderBoardEntry; MAX_PLAYERS] {
        let accounts_size = storage.accounts_size.read();
        let mut leaderboard: [LeaderBoardEntry; MAX_PLAYERS] = [LeaderBoardEntry::zero(); MAX_PLAYERS];
        for i in 0..accounts_size {
            leaderboard[i] = storage.leaderboard.at(i).read();
        }

        leaderboard
    }
}
