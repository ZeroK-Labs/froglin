mod types;
mod settings;

contract FroglinGateway {
    use dep::aztec::{
        keys::getters::get_current_public_keys,
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note, prelude::{AztecAddress, Map},
        state_vars::{PrivateMutable, PublicMutable, SharedImmutable}
    };

    use crate::types::leaderboard_entry::LeaderBoardEntry;
    use crate::types::player_note::PlayerNote;
    use crate::types::stash_note::StashNote;

    global MAX_PLAYERS = 32 as u8;

    #[aztec(storage)]
    struct Storage {
        game_master: SharedImmutable<AztecAddress>,
        accounts_size: PublicMutable<u8>,
        accounts: Map<AztecAddress, PrivateMutable<PlayerNote>>,
        stashes_1: Map<AztecAddress, PrivateMutable<StashNote>>,
        stashes_2: Map<AztecAddress, PrivateMutable<StashNote>>,
        froglin_count: PublicMutable<u8>,
        epoch_count: PublicMutable<u8>,
        epoch_duration: PublicMutable<u64>,
        epoch_start_time: PublicMutable<u64>,
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

        // initialize player account details
        let player_note = PlayerNote::new(name, keys.npk_m.hash());
        storage.accounts.at(player).initialize(&mut player_note).emit(encode_and_encrypt_note(&mut context, player, player));

        // initialize player stash
        let player_stash_1_note = StashNote::new(keys.npk_m.hash());
        storage.stashes_1.at(player).initialize(&mut player_stash_1_note).emit(encode_and_encrypt_note(&mut context, player, player));
        let player_stash_2_note = StashNote::new(keys.npk_m.hash());
        storage.stashes_2.at(player).initialize(&mut player_stash_2_note).emit(encode_and_encrypt_note(&mut context, player, player));

        // modify public data
        FroglinGateway::at(context.this_address())._register(player).enqueue(&mut context);
    }

    #[aztec(private)]
    fn update_name(name: Field) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        let keys = get_current_public_keys(&mut context, player);

        let mut new_player_note = PlayerNote::new(name, keys.npk_m.hash());
        storage.accounts.at(player).replace(&mut new_player_note).emit(encode_and_encrypt_note(&mut context, player, player));
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
        assert(froglin_type < crate::settings::FROGLIN_TYPE_COUNT, "unknown Froglin type");

        let keys = get_current_public_keys(&mut context, player);

        // create new note for selected stash
        let stash_midpoint_index = crate::settings::FROGLIN_TYPE_COUNT / 2;
        if (froglin_type <= stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type);
            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, player, player));
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type - stash_midpoint_index);
            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, player, player));
        }

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
    unconstrained fn view_stash(player: AztecAddress) -> pub BoundedVec<Field, crate::settings::FROGLIN_TYPE_COUNT> {
        _check_registration(player);

        let mut arr: BoundedVec<Field, crate::settings::FROGLIN_TYPE_COUNT> = BoundedVec::from_array([0; crate::settings::FROGLIN_TYPE_COUNT]);

        let stash_1 = storage.stashes_1.at(player).view_note();
        let stash_2 = storage.stashes_2.at(player).view_note();

        arr.set(0, stash_1.froglin_0);
        arr.set(1, stash_1.froglin_1);
        arr.set(2, stash_1.froglin_2);
        arr.set(3, stash_1.froglin_3);
        arr.set(4, stash_1.froglin_4);
        arr.set(5, stash_1.froglin_5);
        arr.set(6, stash_2.froglin_0);
        arr.set(7, stash_2.froglin_1);
        arr.set(8, stash_2.froglin_2);
        arr.set(9, stash_2.froglin_3);
        arr.set(10, stash_2.froglin_4);
        arr.set(11, stash_2.froglin_5);

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
