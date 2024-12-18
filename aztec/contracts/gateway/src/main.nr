mod settings;
mod types;

use dep::aztec::macros::aztec;

#[aztec]
contract FroglinGateway {
    use dep::aztec::{
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note,
        keys::getters::get_public_keys,
        prelude::{AztecAddress, Map, NoteGetterOptions, NoteViewerOptions},
        state_vars::{PrivateMutable, PrivateSet, PublicImmutable, PublicMutable},
        utils::comparison::Comparator,
    };
    use dep::aztec::macros::{
        functions::{initializer, internal, private, public, view},
        storage::storage,
    };
    use dep::aztec::oracle::debug_log::debug_log;

    use crate::settings;
    use crate::types::battle_note::BattleNote;
    use crate::types::battle_proposal::BattleProposal;
    use crate::types::battle_response::BattleResponse;
    use crate::types::date_note::DateNote;
    use crate::types::date_proposal::DateProposal;
    use crate::types::leaderboard_entry::LeaderBoardEntry;
    use crate::types::player_note::PlayerNote;
    use crate::types::stash_note::StashNote;
    use crate::types::swap_proposal::SwapProposal;
    use crate::types::win_note::WinNote;

    global stash_midpoint_index = settings::FROGLIN_TYPE_COUNT / 2;

    #[storage]
    struct Storage<Context> {
        game_master: PublicImmutable<AztecAddress, Context>,
        accounts_size: PublicMutable<u8, Context>,
        accounts: Map<AztecAddress, PrivateMutable<PlayerNote, Context>, Context>,
        stashes: Map<AztecAddress, PrivateMutable<StashNote, Context>, Context>,
        froglin_count: PublicMutable<u8, Context>,
        epoch_count: PublicMutable<u8, Context>,
        epoch_duration: PublicMutable<u64, Context>,
        epoch_start_time: PublicMutable<u64, Context>,
        leaderboard: Map<u8, PublicMutable<LeaderBoardEntry, Context>, Context>,
        public_stash: Map<u8, PublicMutable<u8, Context>, Context>,
        swap_proposals: Map<u8, PublicMutable<SwapProposal, Context>, Context>,
        swap_proposal_count: PublicMutable<u8, Context>,
        battle_proposals: Map<u32, PublicMutable<BattleProposal, Context>, Context>,
        battle_proposal_count: PublicMutable<u32, Context>,
        battle_notes_1: Map<u32, PrivateMutable<BattleNote, Context>, Context>,
        battle_notes_2: Map<u32, PrivateMutable<BattleNote, Context>, Context>,
        battle_winners: Map<AztecAddress, PrivateSet<WinNote, Context>, Context>,
        date_proposals: Map<u32, PublicMutable<DateProposal, Context>, Context>,
        date_proposal_count: PublicMutable<u32, Context>,
        date_notes_1: Map<u32, PrivateMutable<DateNote, Context>, Context>,
        date_notes_2: Map<u32, PrivateMutable<DateNote, Context>, Context>,
    }

    #[public]
    #[initializer]
    fn construct_public() {
        let game_master = context.msg_sender();
        storage.game_master.initialize(game_master);

        storage.accounts_size.write(0);
        storage.froglin_count.write(0);
        storage.epoch_count.write(0);
        storage.epoch_duration.write(0);
        storage.epoch_start_time.write(0);
        storage.swap_proposal_count.write(0);
        storage.battle_proposal_count.write(0);

        for i in 0..settings::FROGLIN_TYPE_COUNT {
            storage.public_stash.at(i).write(0);
        }
    }

    #[view]
    #[internal]
    unconstrained fn _check_registration(player: AztecAddress) {
        assert(
            storage.accounts.at(player).is_initialized(),
            "only registered players can call this method",
        );
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

    // for external calls from other contracts
    #[private]
    fn check_registration(player: AztecAddress) {
        unsafe {
            _check_registration(player);
        }
    }

    #[internal]
    #[public]
    unconstrained fn _register(player: AztecAddress) {
        let accounts_size = storage.accounts_size.read();
        storage.leaderboard.at(accounts_size).write(LeaderBoardEntry::new(player, 0));
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

        assert(player != storage.game_master.read(), "game master cannot register as player");

        let keys = get_public_keys(player);

        // initialize player account details
        let mut player_note = PlayerNote::new(name, player);
        storage.accounts.at(player).initialize(&mut player_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // initialize player stash
        let mut player_stash_note = StashNote::new(player);
        storage.stashes.at(player).initialize(&mut player_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

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

        let mut new_player_note = PlayerNote::new(name, player);
        storage.accounts.at(player).replace(&mut new_player_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));
    }

    #[public]
    fn start_event(froglin_count: u8, epoch_count: u8, epoch_duration: u64, epoch_start_time: u64) {
        let game_master = context.msg_sender();
        assert_eq(game_master, storage.game_master.read(), "only game master can call this method");

        let stored_epoch_count = storage.epoch_count.read();
        assert((stored_epoch_count == 1) | (stored_epoch_count == 0), "event already started");

        let stored_epoch_start_time = storage.epoch_start_time.read();
        let stored_epoch_duration = storage.epoch_duration.read();
        if (epoch_start_time > 0) {
            let elapsed_time = (epoch_start_time - stored_epoch_start_time);
            assert(elapsed_time >= stored_epoch_duration, "too soon to start a new event");
        }

        assert(froglin_count >= 5, "Froglin count should be at least 5");
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
        assert_eq(game_master, storage.game_master.read(), "only game master can call this method");

        let epoch_count = storage.epoch_count.read();
        assert(epoch_count > 1, "event expired");

        storage.epoch_count.write(epoch_count - 1);
        storage.epoch_start_time.write(
            storage.epoch_start_time.read() + storage.epoch_duration.read(),
        );
    }

    #[internal]
    #[public]
    fn _capture_froglin(player: AztecAddress) {
        let new_froglin_count = storage.froglin_count.read() - 1;
        storage.froglin_count.write(new_froglin_count);

        let accounts_size = storage.accounts_size.read();
        let mut player_index = settings::PLAYER_COUNT;
        for i in 0..accounts_size {
            if (player == storage.leaderboard.at(i).read().player) {
                player_index = i;
                break;
            }
        }

        assert(player_index != settings::PLAYER_COUNT, "missing player can't capture Froglin");

        let mut new_leaderboard_entry = storage.leaderboard.at(player_index).read();
        new_leaderboard_entry.score = new_leaderboard_entry.score + 1;

        storage.leaderboard.at(player_index).write(new_leaderboard_entry);
    }

    #[private]
    fn capture_froglin(froglin_type: u8) {
        // ensure parameters are correct
        assert(
            froglin_type < crate::settings::FROGLIN_TYPE_COUNT,
            "tried to capture an unknown Froglin type",
        );

        // ensure state is correct
        unsafe {
            assert(view_epoch_count() != 0, "event is stopped");
            assert(view_froglin_count() != 0, "all available Froglins have been captured");
        }

        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.increment_slot(froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // modify public data
        FroglinGateway::at(context.this_address())._capture_froglin(player).enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _create_swap_proposal(trader_id: Field, offered_froglin_type: u8, wanted_froglin_type: u8) {
        // first time is going to be 0 so we can create empty SwapProposal with id 0
        let proposal_id = storage.swap_proposal_count.read();

        let new_proposal = SwapProposal::new(
            trader_id,
            offered_froglin_type,
            wanted_froglin_type,
            proposal_id,
        );

        storage.swap_proposals.at(proposal_id).write(new_proposal);
        storage.swap_proposal_count.write(proposal_id + 1);

        // increment public stash
        let current_count = storage.public_stash.at(offered_froglin_type).read();
        storage.public_stash.at(offered_froglin_type).write(current_count + 1);
    }

    #[private]
    fn create_swap_proposal(offered_froglin_type: u8, wanted_froglin_type: u8) {
        // ensure parameters are correct
        assert(offered_froglin_type < settings::FROGLIN_TYPE_COUNT, "Invalid offered Froglin type");
        assert(wanted_froglin_type < settings::FROGLIN_TYPE_COUNT, "Invalid wanted Froglin type");
        assert(
            offered_froglin_type != wanted_froglin_type,
            "Cannot swap for the same Froglin type",
        );

        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        // ensure player has the Froglin
        let froglin_count = new_stash_note.get_slot(offered_froglin_type) as u8;
        assert(froglin_count > 0, "player does not have the offered Froglin type");

        new_stash_note.decrement_slot(offered_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // increment the Froglin count of the player
        let trader_id = unsafe { _view_trader_id(player) };

        FroglinGateway::at(context.this_address())
            ._create_swap_proposal(trader_id, offered_froglin_type, wanted_froglin_type)
            .enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _accept_swap_proposal(proposal_id: u8) {
        let mut proposal = storage.swap_proposals.at(proposal_id).read();
        let offered_froglin_type = proposal.offered_froglin_type;

        // change status of the proposal to claimable
        proposal.change_status(2);
        storage.swap_proposals.at(proposal_id).write(proposal);

        // decrement public stash
        let current_count = storage.public_stash.at(offered_froglin_type).read();
        storage.public_stash.at(offered_froglin_type).write(current_count - 1);
    }

    #[private]
    fn accept_swap_proposal(proposal_id: u8) {
        // ensure state is correct
        let proposal = unsafe { view_swap_proposal(proposal_id) };
        assert(proposal.status == 1, "proposal is not active");

        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.decrement_slot(proposal.wanted_froglin_type);
        new_stash_note.increment_slot(proposal.offered_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // change status of the proposal to claimable and settle the public stash
        FroglinGateway::at(context.this_address())._accept_swap_proposal(proposal_id).enqueue(
            &mut context,
        );
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
    fn claim_swap_proposal(proposal_id: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let proposal = unsafe { view_swap_proposal(proposal_id) };
        assert(proposal.status == 2, "proposal is not claimable");

        let trader_id = unsafe { _view_trader_id(player) };
        assert(trader_id == proposal.trader_id, "only the trader can claim the proposal");

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.increment_slot(proposal.wanted_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // mark the proposal as completed
        FroglinGateway::at(context.this_address())._complete_swap_proposal(proposal_id).enqueue(
            &mut context,
        );
    }

    #[private]
    fn cancel_battle_proposal(proposal_id: u32) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let proposal = unsafe { view_battle_proposal(proposal_id) };
        assert(proposal.status == 1, "proposal is not active");

        let trader_id = unsafe { _view_trader_id(player) };
        assert(trader_id == proposal.trader_id, "only the trader can cancel the proposal");

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.increment_slot(proposal.offered_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // mark the proposal as completed
        FroglinGateway::at(context.this_address())
            ._change_battle_proposal_status(proposal_id, 4)
            .enqueue(&mut context);
    }

    #[private]
    fn cancel_date_proposal(proposal_id: u32) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let proposal = unsafe { view_date_proposal(proposal_id) };
        assert(proposal.status == 1, "proposal is not active");

        let trader_id = unsafe { _view_trader_id(player) };
        assert(trader_id == proposal.trader_id, "only the trader can cancel the proposal");

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.increment_slot(proposal.offered_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // mark the proposal as completed
        FroglinGateway::at(context.this_address())
            ._change_date_proposal_status(proposal_id, 4)
            .enqueue(&mut context);
    }

    #[private]
    fn cancel_swap_proposal(proposal_id: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let proposal = unsafe { view_swap_proposal(proposal_id) };
        assert(proposal.status == 1, "proposal is not active");

        let trader_id = unsafe { _view_trader_id(player) };
        assert(trader_id == proposal.trader_id, "only the trader can cancel the proposal");

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.increment_slot(proposal.offered_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // mark the proposal as completed
        FroglinGateway::at(context.this_address())._complete_swap_proposal(proposal_id).enqueue(
            &mut context,
        );
    }

    #[internal]
    #[public]
    fn _create_battle_proposal(
        trader_id: Field,
        offered_froglin_type: u8,
        wanted_froglin_type: u8,
        battle_id: u32,
    ) {
        debug_log("here in _create_battle_proposal");

        let new_proposal = BattleProposal::new(
            trader_id,
            offered_froglin_type,
            wanted_froglin_type,
            battle_id,
        );

        storage.battle_proposals.at(battle_id).write(new_proposal);
        storage.battle_proposal_count.write(battle_id + 1);
        // TODO: find out how to nullify a note emited for the game_master
        // increment public stash
        let current_count = storage.public_stash.at(offered_froglin_type).read();
        storage.public_stash.at(offered_froglin_type).write(current_count + 1);
    }

    #[private]
    fn create_battle_proposal(offered_froglin_type: u8, wanted_froglin_type: u8, choices: u16) {
        // ensure parameters are correct
        assert(offered_froglin_type < settings::FROGLIN_TYPE_COUNT, "Invalid offered Froglin type");
        assert(wanted_froglin_type < settings::FROGLIN_TYPE_COUNT, "Invalid wanted Froglin type");
        assert(
            offered_froglin_type != wanted_froglin_type,
            "Cannot battle for the same Froglin type",
        );

        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        debug_log("create_battle_proposal");

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        // ensure player has the Froglin
        let froglin_count = new_stash_note.get_slot(offered_froglin_type) as u8;
        assert(froglin_count > 0, "player does not have the offered Froglin type");

        new_stash_note.decrement_slot(offered_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        let game_master = storage.game_master.read();
        let game_master_keys = get_public_keys(game_master);

        // create 1st note for game_master
        let battle_id = unsafe { view_battle_proposals_count() };
        let mut note = BattleNote::new(game_master, choices as Field, battle_id as Field, player);

        storage.battle_notes_1.at(battle_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));
        let trader_id = unsafe { _view_trader_id(player) };
        // modify public data
        FroglinGateway::at(context.this_address())
            ._create_battle_proposal(trader_id, offered_froglin_type, wanted_froglin_type, battle_id
                )
                .enqueue(&mut context);
    }

    #[private]
    fn accept_battle_proposal(proposal_id: u32, choices: u16) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // ensure proposal is active
        let proposal = unsafe { view_battle_proposal(proposal_id) };
        assert(proposal.status == 1, "proposal is not active");

        let wanted_froglin_type = proposal.wanted_froglin_type;

        let stash = storage.stashes.at(player);
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        // ensure player has the Froglin
        let froglin_count = new_stash_note.get_slot(wanted_froglin_type) as u8;
        assert(froglin_count > 0, "player does not have the offered Froglin type");

        new_stash_note.decrement_slot(wanted_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // create 2nd note for game_master
        let game_master = storage.game_master.read();
        let game_master_keys = get_public_keys(game_master);

        let mut note = BattleNote::new(game_master, choices as Field, proposal_id as Field, player);

        storage.battle_notes_2.at(proposal_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));

        // change status of proposal to 'accepted'
        FroglinGateway::at(context.this_address())
            ._change_battle_proposal_status(proposal_id, 2)
            .enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _change_battle_proposal_status(proposal_id: u32, status: u8) {
        let mut proposal = storage.battle_proposals.at(proposal_id).read();
        proposal.change_status(status);
        storage.battle_proposals.at(proposal_id).write(proposal);
    }

    #[view]
    unconstrained fn compare_battle_choices(choice1: u16, choice2: u16) -> pub u8 {
        let mut digits1 = [0 as u16, 0 as u16, 0 as u16];
        let mut digits2 = [0 as u16, 0 as u16, 0 as u16];
        for i in 0..3 {
            if (i == 0) {
                digits1[i] = choice1 / 100;
                digits2[i] = choice2 / 100;
            } else if (i == 1) {
                digits1[i] = (choice1 / 10) - ((choice1 / 100) * 10);
                digits2[i] = (choice2 / 10) - ((choice2 / 100) * 10);
            } else {
                digits1[i] = choice1 - ((choice1 / 10) * 10);
                digits2[i] = choice2 - ((choice2 / 10) * 10);
            }
        }

        let mut score1: u8 = 0;
        let mut score2: u8 = 0;
        // 1 beats 3, 2 beats 1, 3 beats 2
        for i in 0..3 {
            if (digits1[i] == 1) & (digits2[i] == 3) {
                score1 += 1;
            }
            if (digits1[i] == 2) & (digits2[i] == 1) {
                score1 += 1;
            }
            if (digits1[i] == 3) & (digits2[i] == 2) {
                score1 += 1;
            }
            if (digits1[i] == 1) & (digits2[i] == 2) {
                score2 += 1;
            }
            if (digits1[i] == 2) & (digits2[i] == 3) {
                score2 += 1;
            }
            if (digits1[i] == 3) & (digits2[i] == 1) {
                score2 += 1;
            }
        }

        if score1 > score2 {
            1
        } else if score2 > score1 {
            2
        } else {
            3
        }
    }

    #[private]
    fn make_battle(proposal_id: u32) {
        let game_master = context.msg_sender();
        assert(game_master == storage.game_master.read(), "only game master can call this method");

        // get notes from both players
        let player1_note = storage.battle_notes_1.at(proposal_id).get_note().note;
        let player2_note = storage.battle_notes_2.at(proposal_id).get_note().note;
        let proposal = unsafe { view_battle_proposal(proposal_id) };

        // compare the choices
        let player1_choice = player1_note.choices as u16;
        let player2_choice = player2_note.choices as u16;
        let mut froglin_won = 101;
        let mut froglin_to_recover = 101;
        let battle_result = unsafe { compare_battle_choices(player1_choice, player2_choice) };
        let mut winner_address = AztecAddress::zero();
        let mut loser_address = AztecAddress::zero();

        // player 1 wins
        if (battle_result == 1) {
            winner_address = player1_note.player_address;
            loser_address = player2_note.player_address;
            froglin_won = proposal.wanted_froglin_type;
            froglin_to_recover = proposal.offered_froglin_type;
        }
        // player 2 wins
        if (battle_result == 2) {
            winner_address = player2_note.player_address;
            loser_address = player1_note.player_address;
            froglin_won = proposal.offered_froglin_type;
            froglin_to_recover = proposal.wanted_froglin_type;
        }

        if (battle_result == 3) {
            // draw
            winner_address = player1_note.player_address;
            loser_address = player2_note.player_address;
            froglin_to_recover = proposal.offered_froglin_type;
        }
        let mut note = WinNote::new(
            winner_address,
            froglin_won as Field,
            froglin_to_recover as Field,
        );
        storage.battle_winners.at(winner_address).insert(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            get_public_keys(winner_address).ovpk_m,
            winner_address,
            winner_address,
        ));
        let mut recovery_note =
            WinNote::new(loser_address, 101, proposal.wanted_froglin_type as Field);

        storage.battle_winners.at(loser_address).insert(&mut recovery_note).emit(
            encode_and_encrypt_note(
                &mut context,
                get_public_keys(loser_address).ovpk_m,
                loser_address,
                loser_address,
            ),
        );

        // change status of proposal to 'completed'
        FroglinGateway::at(context.this_address())
            ._change_battle_proposal_status(proposal_id, 4)
            .enqueue(&mut context);
    }

    #[private]
    fn claim_winnings(froglin_type: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let owner_notes = storage.battle_winners.at(player);
        let mut options = NoteGetterOptions::new();

        options = options
            .select(WinNote::properties().froglin_won, Comparator.EQ, froglin_type.to_field())
            .set_limit(1);
        // maybe add another check here for Froglin to recover?
        let notes = owner_notes.pop_notes(options);
        assert(notes.len() == 1, "note not popped");
        let note = notes.get(0);
        let won_froglin_type = note.froglin_won as u8;
        let froglin_to_recover = note.froglin_to_recover as u8;

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.increment_slot(won_froglin_type);
        new_stash_note.increment_slot(froglin_to_recover);

        // increment the battled Froglin
        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));
    }
    #[private]
    fn recover_froglin(froglin_type: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let owner_notes = storage.battle_winners.at(player);
        let mut options = NoteGetterOptions::new();

        options = options
            .select(WinNote::properties().froglin_to_recover, Comparator.EQ, froglin_type.to_field()
                )
                .select(WinNote::properties().froglin_won, Comparator.EQ, 101.to_field())
                .set_limit(1);
        let notes = owner_notes.pop_notes(options);
        assert(notes.len() == 1, "note not popped");
        let note = notes.get(0);
        let froglin_to_recover = note.froglin_to_recover as u8;

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        new_stash_note.increment_slot(froglin_to_recover);

        // increment the battled Froglin
        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));
    }

    #[private]
    fn create_date_proposal(dating_froglin_type: u8, choices: u16) {
        // ensure parameters are correct
        assert(dating_froglin_type < settings::FROGLIN_TYPE_COUNT, "Invalid offered Froglin type");

        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // select stash
        let stash = storage.stashes.at(player);

        // create new note for selected stash
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        // ensure player has the Froglin
        let froglin_count = new_stash_note.get_slot(dating_froglin_type) as u8;
        assert(froglin_count > 0, "player does not have the Froglin type");

        new_stash_note.decrement_slot(dating_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        let game_master = storage.game_master.read();
        let game_master_keys = get_public_keys(game_master);

        // create 1st note for game_master
        let proposal_id = unsafe { view_date_proposals_count() };
        let mut note = DateNote::new(
            game_master,
            choices as Field,
            proposal_id as Field,
            dating_froglin_type as Field,
            player,
        );

        storage.date_notes_1.at(proposal_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));

        let trader_id = unsafe { _view_trader_id(player) };

        // modify public data - create public proposal
        FroglinGateway::at(context.this_address())
            ._create_date_proposal(trader_id, dating_froglin_type, proposal_id)
            .enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _create_date_proposal(trader_id: Field, dating_froglin_type: u8, proposal_id: u32) {
        let new_proposal = DateProposal::new(trader_id, dating_froglin_type, proposal_id);
        storage.date_proposals.at(proposal_id).write(new_proposal);
        storage.date_proposal_count.write(proposal_id + 1);
    }

    #[private]
    fn accept_date_proposal(proposal_id: u32, dating_froglin_type: u8, choices: u16) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // ensure proposal is active
        let proposal = unsafe { view_date_proposal(proposal_id) };
        assert(proposal.status == 1, "proposal is not active");

        // ensure sexes are different
        assert(
            (
                proposal.offered_froglin_type < stash_midpoint_index
                    & dating_froglin_type >= stash_midpoint_index
            )
                | (
                    proposal.offered_froglin_type >= stash_midpoint_index
                        & dating_froglin_type < stash_midpoint_index
                ),
            "sexes must differ",
        );

        // decrement Froglin from stash
        let stash = storage.stashes.at(player);
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        // ensure player has the Froglin
        let froglin_count = new_stash_note.get_slot(dating_froglin_type) as u8;
        assert(froglin_count > 0, "player does not have the Froglin type");

        new_stash_note.decrement_slot(dating_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // create 2nd note the game_master
        let game_master = storage.game_master.read();
        let game_master_keys = get_public_keys(game_master);

        let mut note = DateNote::new(
            game_master,
            choices as Field,
            proposal_id as Field,
            dating_froglin_type as Field,
            player,
        );

        storage.date_notes_2.at(proposal_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));

        // change status of the proposal to 'accepted'
        FroglinGateway::at(context.this_address())
            ._change_date_proposal_status(proposal_id, 2)
            .enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _change_date_proposal_status(proposal_id: u32, status: u8) {
        let mut proposal = storage.date_proposals.at(proposal_id).read();
        proposal.change_status(status);
        storage.date_proposals.at(proposal_id).write(proposal);
    }

    #[view]
    unconstrained fn compare_date_choices(choice1: u16, choice2: u16) -> pub u8 {
        let mut digits1 = [0 as u16, 0 as u16, 0 as u16];
        let mut digits2 = [0 as u16, 0 as u16, 0 as u16];
        for i in 0..3 {
            if (i == 0) {
                digits1[i] = choice1 / 100;
                digits2[i] = choice2 / 100;
            } else if (i == 1) {
                digits1[i] = (choice1 / 10) - ((choice1 / 100) * 10);
                digits2[i] = (choice2 / 10) - ((choice2 / 100) * 10);
            } else {
                digits1[i] = choice1 - ((choice1 / 10) * 10);
                digits2[i] = choice2 - ((choice2 / 10) * 10);
            }
        }
        let mut score1: u8 = 0;
        let mut score2: u8 = 0;
        let mut special_case: u8 = 0;
        if (choice1 == 123) & (choice2 == 321) {
            special_case = 1;
        }
        if (choice1 == 321) & (choice2 == 123) {
            special_case = 1;
        }
        // 1 beats 3, 2 beats 1, 3 beats 2
        for i in 0..3 {
            if (digits1[i] == 1) & (digits2[i] == 3) {
                score1 += 1;
            }
            if (digits1[i] == 2) & (digits2[i] == 1) {
                score1 += 1;
            }
            if (digits1[i] == 3) & (digits2[i] == 2) {
                score1 += 1;
            }
            if (digits1[i] == 1) & (digits2[i] == 2) {
                score2 += 1;
            }
            if (digits1[i] == 2) & (digits2[i] == 3) {
                score2 += 1;
            }
            if (digits1[i] == 3) & (digits2[i] == 1) {
                score2 += 1;
            }
        }
        if special_case == 1 {
            0
        } else if score1 > score2 {
            1
        } else if score2 > score1 {
            2
        } else {
            3
        }
    }

    #[view]
    unconstrained fn create_random_froglin(choice1: u16, choice2: u16) -> pub u16 {
        let c1_hundreds = choice1 / 100;
        let c1_tens = (choice1 % 100) / 10;
        let c1_ones = choice1 % 10;
        let c2_hundreds = choice2 / 100;
        let c2_tens = (choice2 % 100) / 10;
        let c2_ones = choice2 % 10;

        let sum = (
            3 * c1_hundreds
                + 2 * c1_tens
                + 4 * c1_ones
                + 4 * c2_hundreds
                + 2 * c2_tens
                + 3 * c2_ones
        )
            % 12;
        sum
    }

    #[private]
    fn make_date(proposal_id: u32) {
        let game_master = context.msg_sender();
        assert(game_master == storage.game_master.read(), "only game master can call this method");

        // ensure proposal is `accepted`
        let proposal = unsafe { view_date_proposal(proposal_id) };
        assert(proposal.status == 2, "proposal is not accepted");

        // get notes from both players
        let player1_note = storage.date_notes_1.at(proposal_id).get_note().note;
        let player2_note = storage.date_notes_2.at(proposal_id).get_note().note;

        // compare the choices
        let player1_choice = player1_note.choices as u16;
        let player2_choice = player2_note.choices as u16;
        let mut player1_froglin_won = 101;
        let mut player1_froglin_to_recover = 101;
        let mut player2_froglin_won = 101;
        let mut player2_froglin_to_recover = 101;
        let date_result = unsafe { compare_date_choices(player1_choice, player2_choice) };
        let mut player1 = player1_note.player_address;
        let mut player2 = player2_note.player_address;
        // 1, 2, none, gone

        if (date_result == 0) {
            player1_froglin_won = unsafe { create_random_froglin(player1_choice, player2_choice) };
            player2_froglin_won = unsafe { create_random_froglin(player2_choice, player1_choice) };
            player1_froglin_to_recover = player1_note.dating_froglin as u8;
            player2_froglin_to_recover = player2_note.dating_froglin as u8;
        }

        // player 1 gets the Froglin
        if (date_result == 1) {
            player1_froglin_won = unsafe { create_random_froglin(player1_choice, player2_choice) };
            player1_froglin_to_recover = proposal.offered_froglin_type;
            player2_froglin_to_recover = player2_note.dating_froglin as u8;
        }
        // player 2 gets the Froglin
        if (date_result == 2) {
            player1_froglin_to_recover = player1_note.dating_froglin as u8;
            player2_froglin_won = unsafe { create_random_froglin(player1_choice, player2_choice) };
            player2_froglin_to_recover = player2_note.dating_froglin as u8;
        }

        // if result is 3, nobody gets anything and they lose their Froglins
        if (date_result == 3) {
            player1 = game_master;
            player2 = game_master;
        }

        let mut note = WinNote::new(
            player1,
            player1_froglin_won as Field,
            player1_froglin_to_recover as Field,
        );
        storage.battle_winners.at(player1).insert(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            get_public_keys(player1).ovpk_m,
            player1,
            player1,
        ));
        let mut recovery_note = WinNote::new(
            player2,
            player2_froglin_won as Field,
            player2_froglin_to_recover as Field,
        );

        storage.battle_winners.at(player2).insert(&mut recovery_note).emit(encode_and_encrypt_note(
            &mut context,
            get_public_keys(player2).ovpk_m,
            player2,
            player2,
        ));
        // change status of the proposal to 'completed'
        FroglinGateway::at(context.this_address())
            ._change_date_proposal_status(proposal_id, 4)
            .enqueue(&mut context);
    }

    #[view]
    unconstrained fn registered(player: AztecAddress) -> pub bool {
        storage.accounts.at(player).is_initialized()
    }

    #[view]
    unconstrained fn view_accounts_size() -> pub u8 {
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
    unconstrained fn view_battle_proposals_count() -> pub u32 {
        storage.battle_proposal_count.read()
    }

    #[view]
    unconstrained fn view_date_proposals_count() -> pub u32 {
        storage.date_proposal_count.read()
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
    unconstrained fn view_stash(player: AztecAddress) -> pub [u8; settings::FROGLIN_TYPE_COUNT] {
        _check_registration(player);

        let stash = storage.stashes.at(player).view_note();

        let mut array = [0; settings::FROGLIN_TYPE_COUNT_U32];
        for i in 0..settings::FROGLIN_TYPE_COUNT {
            array[i] = stash.get_slot(i);
        }

        array
    }

    #[view]
    unconstrained fn view_leaderboard() -> pub [LeaderBoardEntry; settings::PLAYER_COUNT] {
        let mut leaderboard = [LeaderBoardEntry::zero(); settings::PLAYER_COUNT_U32];

        let accounts_size = storage.accounts_size.read();
        for i in 0..accounts_size {
            leaderboard[i] = storage.leaderboard.at(i).read();
        }

        leaderboard
    }

    #[view]
    unconstrained fn view_swap_proposal(proposal_id: u8) -> pub SwapProposal {
        storage.swap_proposals.at(proposal_id).read()
    }

    #[view]
    unconstrained fn view_battle_proposal(proposal_id: u32) -> pub BattleProposal {
        storage.battle_proposals.at(proposal_id).read()
    }

    #[view]
    unconstrained fn view_date_proposal(proposal_id: u32) -> pub DateProposal {
        storage.date_proposals.at(proposal_id).read()
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
    unconstrained fn view_claimable_swaps(trader_id: u32) -> pub [SwapProposal; 10] {
        let proposal_count = storage.swap_proposal_count.read();
        let mut claimable_proposals: [SwapProposal; 10] = [SwapProposal::empty(); 10];
        for i in 0..proposal_count {
            let proposal = storage.swap_proposals.at(i).read();
            if (proposal.status == 2) & (i < 10) {
                if (proposal.trader_id as u32 == trader_id) {
                    claimable_proposals[i] = proposal;
                }
            }
        }

        claimable_proposals
    }

    #[view]
    unconstrained fn view_active_battle_proposals() -> pub [BattleProposal; 10] {
        let proposal_count = storage.battle_proposal_count.read();
        let mut active_proposals: [BattleProposal; 10] = [BattleProposal::empty(); 10];
        for i in 0..proposal_count {
            let proposal = storage.battle_proposals.at(i).read();
            if (proposal.status == 1) & (i < 10) {
                active_proposals[i] = proposal;
            }
        }

        active_proposals
    }

    #[view]
    unconstrained fn view_active_date_proposals() -> pub [DateProposal; 10] {
        let proposal_count = storage.date_proposal_count.read();
        let mut active_proposals: [DateProposal; 10] = [DateProposal::empty(); 10];
        for i in 0..proposal_count {
            let proposal = storage.date_proposals.at(i).read();
            if (proposal.status == 1) & (i < 10) {
                active_proposals[i] = proposal;
            }
        }

        active_proposals
    }

    #[view]
    unconstrained fn view_won_in_battle(player: AztecAddress) -> pub [BattleResponse; 5] {
        let mut options = NoteViewerOptions::new();
        options = options.set_limit(5);
        let set = storage.battle_winners.at(player);
        let notes = set.view_notes(options);

        let mut won_notes: [BattleResponse; 5] = [BattleResponse::empty(); 5];
        for i in 0..notes.len() {
            let note = notes.get_unchecked(i);
            let froglin_won = note.froglin_won as u8;
            let froglin_to_recover = note.froglin_to_recover as u8;
            won_notes[i].froglin_won = froglin_won;
            won_notes[i].froglin_to_recover = froglin_to_recover;
        }

        won_notes
    }
}
