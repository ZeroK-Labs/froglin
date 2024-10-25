mod settings;
mod types;
use dep::aztec::macros::aztec;

#[aztec]
contract FroglinGateway {
    use dep::aztec::macros::{storage::storage, events::event, functions::{initializer, private, view, public, internal}};
    use dep::aztec::{
        keys::getters::get_public_keys,
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note, prelude::{AztecAddress, Map},
        state_vars::{PrivateMutable, PrivateImmutable, PublicMutable, SharedImmutable}
    };
    use dep::authwit::auth::{assert_current_call_valid_authwit, compute_authwit_nullifier};
    use dep::value_note::value_note::ValueNote;

    use crate::settings;
    use crate::types::leaderboard_entry::LeaderBoardEntry;
    use crate::types::player_note::PlayerNote;
    use crate::types::stash_note::StashNote;
    use crate::types::swap_proposal::SwapProposal;
    use std::array;

    global stash_midpoint_index = settings::FROGLIN_TYPE_COUNT / 2;

    #[storage]
    struct Storage<Context> {
        game_master: SharedImmutable<AztecAddress, Context>,
        accounts_size: PublicMutable<u32, Context>,
        accounts: Map<AztecAddress, PrivateMutable<PlayerNote, Context>, Context>,
        transfers: Map<AztecAddress, PrivateMutable<ValueNote, Context>, Context>,
        stashes_1: Map<AztecAddress, PrivateMutable<StashNote, Context>, Context>,
        stashes_2: Map<AztecAddress, PrivateMutable<StashNote, Context>, Context>,
        froglin_count: PublicMutable<u8, Context>,
        epoch_count: PublicMutable<u8, Context>,
        epoch_duration: PublicMutable<u64, Context>,
        epoch_start_time: PublicMutable<u64, Context>,
        leaderboard: Map<u8, PublicMutable<LeaderBoardEntry, Context>, Context>,
        public_stash: Map<u8, PublicMutable<u8, Context>, Context>,
        swap_proposals: Map<u8, PublicMutable<SwapProposal, Context>, Context>,
        swap_proposal_count: PublicMutable<u8, Context>,
    }

    #[view]
    #[internal]
    unconstrained fn _check_registration(player: AztecAddress) {
        assert(storage.accounts.at(player).is_initialized(), "only registered players can call this method");
    }

    #[view]
    #[internal]
    unconstrained fn _check_availability(player: AztecAddress) {
        assert(!storage.accounts.at(player).is_initialized(), "player is already registered");
    }

    #[view]
    #[internal]
    unconstrained fn _view_trader_id(player: AztecAddress) -> pub Field {
        storage.accounts.at(player).view_note().trader_id
    }

    #[internal]
    #[view]
    unconstrained fn _view_stash_1(player: AztecAddress) -> pub StashNote {
        storage.stashes_1.at(player).view_note()
    }

    #[internal]
    #[view]
    unconstrained fn _view_stash_2(player: AztecAddress) -> pub StashNote {
        storage.stashes_2.at(player).view_note()
    }

    // for external calls from other contracts
    #[private]
    fn check_registration(player: AztecAddress) {
        unsafe {
            _check_registration(player);
        }
    }

    #[initializer]
    #[public]
    fn construct_public() {
        let game_master = context.msg_sender();
        storage.game_master.initialize(game_master);

        storage.accounts_size.write(0);
        storage.froglin_count.write(0);
        storage.epoch_count.write(0);
        storage.epoch_duration.write(0);
        storage.epoch_start_time.write(0);
        storage.swap_proposal_count.write(0);

        for i in 0..settings::FROGLIN_TYPE_COUNT {
            storage.public_stash.at(i).write(0);
        }
    }

    #[internal]
    #[public]
    fn _create_swap_proposal(trader_id: Field, offered_froglin_type: u8, wanted_froglin_type: u8) {
        // increment public stash
        let current_count = storage.public_stash.at(offered_froglin_type).read();
        storage.public_stash.at(offered_froglin_type).write(current_count + 1);
        // create the proposal, first time is going to be 0 so we can create empty SwapProposal with id 0
        let proposal_id = storage.swap_proposal_count.read();

        let new_proposal = SwapProposal::new(
            trader_id,
            offered_froglin_type,
            wanted_froglin_type,
            proposal_id
        );

        storage.swap_proposals.at(proposal_id).write(new_proposal);
        storage.swap_proposal_count.write(proposal_id + 1);
    }

    #[internal]
    #[public]
    fn _accept_swap_proposal(proposal_id: u8) {
        let mut proposal = storage.swap_proposals.at(proposal_id).read();
        let trader_id = proposal.trader_id;
        let offered_froglin_type = proposal.offered_froglin_type;
        let wanted_froglin_type = proposal.wanted_froglin_type;

        // decrement public stash
        let current_count = storage.public_stash.at(offered_froglin_type).read();
        storage.public_stash.at(offered_froglin_type).write(current_count - 1);

        // change status of the proposal to claimable
        proposal.change_status(2);
        storage.swap_proposals.at(proposal_id).write(proposal);
    }

    #[internal]
    #[public]
    fn _complete_swap_proposal(proposal_id: u8) {
        let mut proposal = storage.swap_proposals.at(proposal_id).read();
        // mark the proposal as completed
        proposal.change_status(4);
        storage.swap_proposals.at(proposal_id).write(proposal);
    }

    #[private]
    fn create_swap_proposal(offered_froglin_type: u8, wanted_froglin_type: u8) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        assert(offered_froglin_type < settings::FROGLIN_TYPE_COUNT, "Invalid offered Froglin type");
        assert(wanted_froglin_type < settings::FROGLIN_TYPE_COUNT, "Invalid wanted Froglin type");
        assert(offered_froglin_type != wanted_froglin_type, "Cannot swap for the same Froglin type");

        let trader_id: Field = _view_trader_id(player) as Field;
        let keys = get_public_keys(player);
        // create new note for selected stash
        if (offered_froglin_type < stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            let froglin_count = new_stash.get_slot(offered_froglin_type) as u8;
            assert(froglin_count > 0, "player does not have the offered froglin type");

            new_stash.decrement_slot(offered_froglin_type);

            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // increment the froglin count of the player
            FroglinGateway::at(context.this_address())._create_swap_proposal(trader_id, offered_froglin_type, wanted_froglin_type).enqueue(&mut context);
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            let froglin_count = new_stash.get_slot(offered_froglin_type - stash_midpoint_index) as u8;
            assert(froglin_count > 0, "player does not have the offered froglin type");

            new_stash.decrement_slot(offered_froglin_type - stash_midpoint_index);

            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // increment the froglin count of the player
            FroglinGateway::at(context.this_address())._create_swap_proposal(trader_id, offered_froglin_type, wanted_froglin_type).enqueue(&mut context);
        }
    }

    #[private]
    fn accept_swap_proposal(proposal_id: u8) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        let proposal = view_swap_proposal(proposal_id);
        assert(proposal.status == 1, "proposal is not active");

        let wanted_froglin_type = proposal.wanted_froglin_type;
        let offered_froglin_type = proposal.offered_froglin_type;

        let keys = get_public_keys(player);

        if (wanted_froglin_type < stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            let froglin_count = new_stash.get_slot(wanted_froglin_type) as u8;
            assert(froglin_count > 0, "player does not have the wanted froglin type");

            new_stash.decrement_slot(wanted_froglin_type);
            if (offered_froglin_type < stash_midpoint_index) {
                new_stash.increment_slot(offered_froglin_type);
            } //
             else {
                let mut new_stash2 = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
                new_stash2.increment_slot(offered_froglin_type - stash_midpoint_index);
                storage.stashes_2.at(player).replace(&mut new_stash2).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            }


            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // change status of the proposal to claimable and settle the public stash
            FroglinGateway::at(context.this_address())._accept_swap_proposal(proposal_id).enqueue(&mut context);
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            let froglin_count = new_stash.get_slot(wanted_froglin_type - stash_midpoint_index) as u8;
            assert(froglin_count > 0, "player does not have the wanted froglin type");

            new_stash.decrement_slot(wanted_froglin_type - stash_midpoint_index);
            if (offered_froglin_type < stash_midpoint_index) {
                let mut new_stash1 = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
                new_stash1.increment_slot(offered_froglin_type - stash_midpoint_index);
                storage.stashes_1.at(player).replace(&mut new_stash1).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            } //
             else {
                new_stash.increment_slot(offered_froglin_type - stash_midpoint_index);
            }


            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // change status of the proposal to claimable and settle the public stash
            FroglinGateway::at(context.this_address())._accept_swap_proposal(proposal_id).enqueue(&mut context);
        }
    }

    #[private]
    fn claim_swap_proposal(proposal_id: u8) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        let proposal = view_swap_proposal(proposal_id);
        let trader_id: Field = _view_trader_id(player) as Field;

        assert(proposal.status == 2, "proposal is not claimable");
        assert(trader_id == proposal.trader_id, "only the trader can claim the proposal");

        let wanted_froglin_type = proposal.wanted_froglin_type;
        let keys = get_public_keys(player);

        if (wanted_froglin_type < stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(wanted_froglin_type);
            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // mark the proposal as completed
            FroglinGateway::at(context.this_address())._complete_swap_proposal(proposal_id).enqueue(&mut context);
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(wanted_froglin_type - stash_midpoint_index);
            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // mark the proposal as completed
            FroglinGateway::at(context.this_address())._complete_swap_proposal(proposal_id).enqueue(&mut context);
        }
    }

    #[private]
    fn cancel_swap_proposal(proposal_id: u8) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        let proposal = view_swap_proposal(proposal_id);
        let trader_id: Field = _view_trader_id(player) as Field;

        assert(proposal.status == 1, "proposal is not active");
        assert(trader_id == proposal.trader_id, "only the trader can cancel the proposal");

        let offered_froglin_type = proposal.offered_froglin_type;
        let keys = get_public_keys(player);

        if (offered_froglin_type < stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(offered_froglin_type);
            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // mark the proposal as completed
            FroglinGateway::at(context.this_address())._complete_swap_proposal(proposal_id).enqueue(&mut context);
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(offered_froglin_type - stash_midpoint_index);
            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
            // mark the proposal as completed
            FroglinGateway::at(context.this_address())._complete_swap_proposal(proposal_id).enqueue(&mut context);
        }
    }

    #[internal]
    #[public]
    unconstrained fn _register(player: AztecAddress) {
        let accounts_size = storage.accounts_size.read();
        storage.leaderboard.at(accounts_size as u8).write(LeaderBoardEntry::new(player, 0));
        storage.accounts_size.write(accounts_size + 1);
    }

    #[private]
    fn register(name: Field) {
        unsafe {
            assert(view_accounts_size() <= settings::PLAYER_COUNT, "registration is fully booked");
        }

        let player = context.msg_sender();
        unsafe {
            _check_availability(player);
        }

        assert(player != storage.game_master.read_private(), "game master cannot register as player");

        let keys = get_public_keys(player);

        // initialize player account details
        let mut player_note = PlayerNote::new(name, keys.npk_m.hash());
        storage.accounts.at(player).initialize(&mut player_note).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));

        // initialize player stash
        let mut player_stash_1_note = StashNote::new(keys.npk_m.hash());
        storage.stashes_1.at(player).initialize(&mut player_stash_1_note).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
        let mut player_stash_2_note = StashNote::new(keys.npk_m.hash());
        storage.stashes_2.at(player).initialize(&mut player_stash_2_note).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));

        // modify public data
        FroglinGateway::at(context.this_address())._register(player).enqueue(&mut context);
    }

    #[private]
    fn update_name(name: Field) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        let keys = get_public_keys(player);

        let mut new_player_note = PlayerNote::new(name, keys.npk_m.hash());
        storage.accounts.at(player).replace(&mut new_player_note).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
    }

    #[public]
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

    #[public]
    fn advance_epoch() {
        let game_master = context.msg_sender();
        assert_eq(game_master, storage.game_master.read_public(), "only game master can call this method");

        let epoch_count = storage.epoch_count.read();
        assert(epoch_count > 1, "event expired");

        storage.epoch_count.write(epoch_count - 1);
        storage.epoch_start_time.write(storage.epoch_start_time.read() + storage.epoch_duration.read());
    }

    #[internal]
    #[public]
    fn _capture_froglin(player: AztecAddress) {
        let new_froglin_count = storage.froglin_count.read() - 1;
        storage.froglin_count.write(new_froglin_count);

        let accounts_size = storage.accounts_size.read();
        let mut player_index = settings::PLAYER_COUNT;
        for i in 0..accounts_size {
            if (player == storage.leaderboard.at(i as u8).read().player) {
                player_index = i;
                break;
            }
        }

        let mut new_leaderboard_entry = storage.leaderboard.at(player_index as u8).read();
        new_leaderboard_entry.score = new_leaderboard_entry.score + 1;

        storage.leaderboard.at(player_index as u8).write(new_leaderboard_entry);
    }

    #[private]
    fn capture_froglin(froglin_type: u8) {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
            assert(view_epoch_count() != 0, "event is stopped");
            assert(view_froglin_count() != 0, "all available Froglins have been captured");
        }
        assert(
            froglin_type < crate::settings::FROGLIN_TYPE_COUNT, "tried to capture an unknown Froglin type"
        );

        let keys = get_public_keys(player);

        // create new note for selected stash
        if (froglin_type < stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type);
            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type - stash_midpoint_index);
            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
        }

        // modify public data
        FroglinGateway::at(context.this_address())._capture_froglin(player).enqueue(&mut context);
    }

    #[private]
    fn increment_froglin(froglin_type: u8, player: AztecAddress) {
        if (!player.eq(context.msg_sender())) {
            assert_current_call_valid_authwit(&mut context, player);
        }

        let keys = get_public_keys(player);

        // create new note for selected stash
        if (froglin_type < stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type);
            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type - stash_midpoint_index);
            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
        }
    }
    #[private]
    fn transfer(to: AztecAddress, froglin_type: u8) {
        let from = context.msg_sender();
        unsafe {
            _check_registration(from);
            _check_registration(to);
        }

        let from_keys = get_public_keys(from);
        let to_keys = get_public_keys(to);

        let mut from_stash_note = StashNote::copy(
            storage.stashes_1.at(from).get_note().note,
            from_keys.npk_m.hash()
        );

        from_stash_note.decrement_slot(froglin_type);

        storage.stashes_1.at(from).replace(&mut from_stash_note).emit(encode_and_encrypt_note(&mut context, from_keys.ovpk_m, from_keys.ivpk_m, from));
        let mut note = ValueNote::new(froglin_type as Field, to_keys.npk_m.hash());
        storage.transfers.at(to).initialize(&mut note).emit(encode_and_encrypt_note(&mut context, to_keys.ovpk_m, to_keys.ivpk_m, to));
    }

    #[private]
    fn claim_froglin() {
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }

        // check if there is a note in storage transfers
        let froglin_type: u8 = storage.transfers.at(player).get_note().note.value as u8;
        let keys = get_public_keys(player);

        // create new note for selected stash
        if (froglin_type < stash_midpoint_index) {
            let mut new_stash = StashNote::copy(storage.stashes_1.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type);
            storage.stashes_1.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
        } //
        else {
            let mut new_stash = StashNote::copy(storage.stashes_2.at(player).get_note().note, keys.npk_m.hash());
            new_stash.increment_slot(froglin_type - stash_midpoint_index);
            storage.stashes_2.at(player).replace(&mut new_stash).emit(encode_and_encrypt_note(&mut context, keys.ovpk_m, keys.ivpk_m, player));
        }
    }

    #[view]
    unconstrained fn registered(player: AztecAddress) -> pub bool {
        storage.accounts.at(player).is_initialized()
    }

    #[view]
    unconstrained fn view_accounts_size() -> pub u32 {
        storage.accounts_size.read()
    }

    #[view]
    unconstrained fn view_name(player: AztecAddress) -> pub Field {
        _check_registration(player);

        storage.accounts.at(player).view_note().name
    }

    #[view]
    unconstrained fn view_profile(player: AztecAddress) -> pub PlayerNote {
        _check_registration(player);

        storage.accounts.at(player).view_note()
    }

    #[view]
    unconstrained fn view_froglin_count() -> pub u8 {
        storage.froglin_count.read()
    }

    #[view]
    unconstrained fn view_epoch_count() -> pub u8 {
        storage.epoch_count.read()
    }

    #[view]
    unconstrained fn view_epoch_duration() -> pub u64 {
        storage.epoch_duration.read()
    }

    #[view]
    unconstrained fn view_epoch_start_time() -> pub u64 {
        storage.epoch_start_time.read()
    }

    #[view]
    unconstrained fn view_stash(player: AztecAddress) -> pub [Field; 8] {
        _check_registration(player);

        let stash_1 = storage.stashes_1.at(player).view_note();
        let stash_2 = storage.stashes_2.at(player).view_note();

        [
            stash_1.froglin_0,
            stash_1.froglin_1,
            stash_1.froglin_2,
            stash_1.froglin_3,
            stash_2.froglin_0,
            stash_2.froglin_1,
            stash_2.froglin_2,
            stash_2.froglin_3,
        ]
    }

    #[view]
    unconstrained fn view_leaderboard() -> pub [LeaderBoardEntry; settings::PLAYER_COUNT] {
        let accounts_size = storage.accounts_size.read();
        let mut leaderboard: [LeaderBoardEntry; settings::PLAYER_COUNT] = [LeaderBoardEntry::zero(); settings::PLAYER_COUNT];
        for i in 0..accounts_size {
            leaderboard[i] = storage.leaderboard.at(i as u8).read();
        }

        leaderboard
    }

    #[view]
    unconstrained fn view_swap_proposal(proposal_id: u8) -> pub SwapProposal {
        storage.swap_proposals.at(proposal_id).read()
    }

    #[view]
    unconstrained fn view_active_swap_proposals() -> pub [SwapProposal; 10] {
        let proposal_count = storage.swap_proposal_count.read();
        let mut active_proposals: [SwapProposal; 10] = [SwapProposal::empty(); 10];
        for i in 0..proposal_count {
            let proposal = storage.swap_proposals.at(i).read();
            if (proposal.status == 1) & (i < 10) {
                active_proposals[i] = proposal;
            }
        }

        active_proposals
    }

    #[view]
    unconstrained fn view_all_proposals() -> pub [SwapProposal; 10] {
        let proposal_count = storage.swap_proposal_count.read();
        let mut all_proposals: [SwapProposal; 10] = [SwapProposal::empty(); 10];
        for i in 0..proposal_count {
            let proposal = storage.swap_proposals.at(i).read();
            if i < 10 {
                all_proposals[i] = proposal;
            }
        }

        all_proposals
    }

    #[view]
    unconstrained fn view_claimable_swaps(trader_id: Field) -> pub [SwapProposal; 10] {
        let proposal_count = storage.swap_proposal_count.read();
        let mut claimable_proposals: [SwapProposal; 10] = [SwapProposal::empty(); 10];
        for i in 0..proposal_count {
            let proposal = storage.swap_proposals.at(i).read();
            if (proposal.status == 2) & (i < 10) {
                if (proposal.trader_id == trader_id) {
                    claimable_proposals[i] = proposal;
                }
            }
        }

        claimable_proposals
    }
}
