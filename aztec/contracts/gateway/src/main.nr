mod settings;
mod types;

use dep::aztec::macros::aztec;

#[aztec]
contract FroglinGateway {
    use dep::authwit::auth::{assert_current_call_valid_authwit, compute_authwit_nullifier};
    use dep::aztec::{
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note,
        hash::compute_secret_hash,
        keys::getters::get_public_keys,
        prelude::{AztecAddress, Map, NoteGetterOptions, NoteViewerOptions},
        state_vars::{PrivateImmutable, PrivateMutable, PrivateSet, PublicMutable, SharedImmutable},
        utils::comparison::Comparator,
    };
    use dep::aztec::macros::{
        events::event,
        functions::{initializer, internal, private, public, view},
        storage::storage,
    };
    use dep::aztec::oracle::debug_log::{debug_log, debug_log_format};
    use dep::value_note::value_note::ValueNote;
    use aztec::oracle::random::random;

    use crate::settings;
    use crate::types::battle_note::BattleNote;
    use crate::types::battle_proposal::BattleProposal;
    use crate::types::date_proposal::DateProposal;
    use crate::types::leaderboard_entry::LeaderBoardEntry;
    use crate::types::player_note::PlayerNote;
    use crate::types::stash_note::StashNote;
    use crate::types::swap_proposal::SwapProposal;
    use crate::types::win_note::WinNote;
    use std::array;

    global stash_midpoint_index = settings::FROGLIN_TYPE_COUNT / 2;

    #[storage]
    struct Storage<Context> {
        game_master: SharedImmutable<AztecAddress, Context>,
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
        storage.battle_proposal_count.write(0);

        for i in 0..settings::FROGLIN_TYPE_COUNT {
            storage.public_stash.at(i).write(0);
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

        assert(
            player != storage.game_master.read_private(),
            "game master cannot register as player",
        );

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
        assert_eq(
            game_master,
            storage.game_master.read_public(),
            "only game master can call this method",
        );

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
        assert_eq(
            game_master,
            storage.game_master.read_public(),
            "only game master can call this method",
        );

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

        // increment the froglin count of the player
        let trader_id = _view_trader_id(player);

        FroglinGateway::at(context.this_address())
            ._create_swap_proposal(trader_id, offered_froglin_type, wanted_froglin_type)
            .enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _accept_swap_proposal(proposal_id: u8) {
        let mut proposal = storage.swap_proposals.at(proposal_id).read();
        let trader_id = proposal.trader_id;
        let offered_froglin_type = proposal.offered_froglin_type;
        let wanted_froglin_type = proposal.wanted_froglin_type;

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
        let proposal = view_swap_proposal(proposal_id);
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

        let proposal = view_swap_proposal(proposal_id);
        assert(proposal.status == 2, "proposal is not claimable");

        let trader_id = _view_trader_id(player);
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
    fn cancel_swap_proposal(proposal_id: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let proposal = view_swap_proposal(proposal_id);
        assert(proposal.status == 1, "proposal is not active");

        let trader_id = _view_trader_id(player);
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
    fn _create_battle_proposal(offered_froglin_type: u8, wanted_froglin_type: u8, battle_id: u32) {
        debug_log("here in _create_battle_proposal");

        let new_proposal =
            BattleProposal::new(offered_froglin_type, wanted_froglin_type, battle_id);

        storage.battle_proposals.at(battle_id).write(new_proposal);
        storage.battle_proposal_count.write(battle_id + 1);
        // TODO: find out how to nullify a note emited for the game_master
        // increment public stash
        let current_count = storage.public_stash.at(offered_froglin_type).read();
        storage.public_stash.at(offered_froglin_type).write(current_count + 1);
    }

    #[private]
    fn create_battle_proposal(offered_froglin_type: u8, wanted_froglin_type: u8, choices: u8) {
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
        assert(froglin_count > 0, "player does not have the offered froglin type");

        new_stash_note.decrement_slot(offered_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        let game_master = storage.game_master.read_private();
        let game_master_keys = get_public_keys(game_master);
        // create private note for game master in battle_notes_1
        let battle_id = view_battle_proposals_count();
        let mut note = BattleNote::new(game_master, choices as Field, battle_id as Field, player);

        storage.battle_notes_1.at(battle_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));

        // modify public data
        FroglinGateway::at(context.this_address())
            ._create_battle_proposal(offered_froglin_type, wanted_froglin_type, battle_id)
            .enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _accept_battle_proposal(proposal_id: u32) {
        let mut proposal = storage.battle_proposals.at(proposal_id).read();
        // let offered_froglin_type = proposal.offered_froglin_type;
        // let wanted_froglin_type = proposal.wanted_froglin_type;
        // change status of the proposal to battle ready
        proposal.change_status(2);
        storage.battle_proposals.at(proposal_id).write(proposal);
        // increment public stash
        // let current_count = storage.public_stash.at(wanted_froglin_type).read();
        // storage.public_stash.at(wanted_froglin_type).write(current_count + 1);
    }

    #[private]
    fn accept_battle_proposal(proposal_id: u32, choices: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // ensure proposal is active
        let proposal = view_battle_proposal(proposal_id);
        assert(proposal.status == 1, "proposal is not active");

        let wanted_froglin_type = proposal.wanted_froglin_type;

        let stash = storage.stashes.at(player);
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        // ensure player has the Froglin
        let froglin_count = new_stash_note.get_slot(wanted_froglin_type) as u8;
        assert(froglin_count > 0, "player does not have the offered froglin type");

        new_stash_note.decrement_slot(wanted_froglin_type);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // create a note with the secret_hash for the contract
        let game_master = storage.game_master.read_private();
        let game_master_keys = get_public_keys(game_master);
        // create private note for game master in battle_notes_1
        let mut note = BattleNote::new(game_master, choices as Field, proposal_id as Field, player);

        storage.battle_notes_2.at(proposal_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));

        FroglinGateway::at(context.this_address())._accept_battle_proposal(proposal_id).enqueue(
            &mut context,
        );
    }

    #[internal]
    #[public]
    fn _change_battle_status(proposal_id: u32, status: u8) {
        let mut proposal = storage.battle_proposals.at(proposal_id).read();
        proposal.change_status(status);
        storage.battle_proposals.at(proposal_id).write(proposal);
    }

    #[private]
    fn make_battle(proposal_id: u32) {
        let game_master = context.msg_sender();
        assert(
            game_master == storage.game_master.read_private(),
            "only game master can call this method",
        );
        // get notes from both players
        let player1_note = storage.battle_notes_1.at(proposal_id).get_note().note;
        let player2_note = storage.battle_notes_2.at(proposal_id).get_note().note;
        let proposal = view_battle_proposal(proposal_id);
        // compare the choices
        let player1_choice = player1_note.choices as u8;
        let player2_choice = player2_note.choices as u8;
        let mut winner_address = AztecAddress::zero();
        let mut froglin_type = 101;
        let mut froglin_to_recover = 101;
        // temporary logic to determine the winner
        if (player1_choice > player2_choice) {
            winner_address = player1_note.player_address;
            froglin_type = proposal.wanted_froglin_type;
            froglin_to_recover = proposal.offered_froglin_type;
        } else {
            winner_address = player2_note.player_address;
            froglin_type = proposal.offered_froglin_type;
            froglin_to_recover = proposal.wanted_froglin_type;
        }
        // create a note for the winner
        let mut note = WinNote::new(
            winner_address,
            froglin_type as Field,
            froglin_to_recover as Field,
        );

        storage.battle_winners.at(winner_address).insert(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            get_public_keys(winner_address).ovpk_m,
            winner_address,
            winner_address,
        ));
        // // change status of the proposal to completed
        FroglinGateway::at(context.this_address())._change_battle_status(proposal_id, 3).enqueue(
            &mut context,
        );
    }
    // when u go on a date u do not select a wanted froglin
    // you escrow your froglin
    // read the value of the public dates count
    // you create a date note for the game_master with your choices, the dating froglin, and the date_id
    // create a public date with the offered froglin
    //
    // accept (date_id, choices, dating froglin)
    // decrement froglin in private
    // create date note for game_master with date_id, choices and dating froglin)
    // change public note status
    // make sure you check the gender when the other player accepts
    //
    // make date
    // compare the choices
    // if function returns 0 nobody we emit a private note for the players to claim back their
    // froglins
    // if check function returns 1 we randomly select a player to win and randomly select a froglin_type
    // we issue again notes for both players but only one of them has something to claim and
    // both of them recover their froglins
    // we can use by convention a number in the win slot so the players
    // can still query the notes but they can only claim their recover froglin
    // if it returns 2 both players get a note issued
    // so notes need to be issued in all cases for players to get back their escrows
    // when a date is created we will make a date proposal, identical with the battle
    // proposal
    // based on the status

    #[private]
    fn create_date_proposal(dating_froglin: u8, choices: u8) {
        // ensure parameters are correct
        assert(dating_froglin < settings::FROGLIN_TYPE_COUNT, "Invalid offered Froglin type");

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
        let froglin_count = new_stash_note.get_slot(dating_froglin) as u8;
        assert(froglin_count > 0, "player does not have the offered froglin type");

        new_stash_note.decrement_slot(dating_froglin);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        let game_master = storage.game_master.read_private();
        let game_master_keys = get_public_keys(game_master);
        // create private note for game master in battle_notes_1
        let date_id = view_date_proposals_count();
        let mut note = BattleNote::new(game_master, choices as Field, date_id as Field, player);

        storage.battle_notes_1.at(date_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));

        // modify public data - create public proposal
        FroglinGateway::at(context.this_address())
            ._create_date_proposal(dating_froglin, player, date_id)
            .enqueue(&mut context);
    }

    #[internal]
    #[public]
    fn _create_date_proposal(dating_froglin: u8, player: AztecAddress, date_id: u32) {
        // create date proposal
        let new_proposal = DateProposal::new(dating_froglin, date_id);

        storage.date_proposals.at(date_id).write(new_proposal);
        storage.date_proposal_count.write(date_id + 1);
    }

    #[private]
    fn accept_date_proposal(date_id: u32, choices: u8, dating_froglin: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        // ensure proposal is active
        let proposal = view_battle_proposal(date_id);
        assert(proposal.status == 1, "proposal is not active");
        // check for sex with the offset
        // decrement froglin
        let stash = storage.stashes.at(player);
        let mut new_stash_note = StashNote::copy(stash.get_note().note, player);

        // ensure player has the Froglin
        let froglin_count = new_stash_note.get_slot(dating_froglin) as u8;
        assert(froglin_count > 0, "player does not have the offered froglin type");

        new_stash_note.decrement_slot(dating_froglin);

        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));

        // create a note for the game_master
        let game_master = storage.game_master.read_private();
        let game_master_keys = get_public_keys(game_master);
        // create private note for game master in date_notes_2
        let mut note = BattleNote::new(game_master, choices as Field, date_id as Field, player);

        storage.battle_notes_2.at(date_id).initialize(&mut note).emit(encode_and_encrypt_note(
            &mut context,
            game_master_keys.ovpk_m,
            game_master,
            game_master,
        ));

        FroglinGateway::at(context.this_address())._accept_date_proposal(date_id).enqueue(
            &mut context,
        );
    }

    #[internal]
    #[private]
    fn _accept_date_proposal(date_id: u32) {
        let mut proposal = storage.date_proposals.at(date_id).read();
        proposal.change_status(2);
        storage.date_proposals.at(date_id).write(proposal);
    }

    #[private]
    fn claim_winnings(froglin_type: u8) {
        // get player address and keys
        let player = context.msg_sender();
        unsafe {
            _check_registration(player);
        }
        let keys = get_public_keys(player);

        let mut options = NoteGetterOptions::new();
        options = options
            .select(WinNote::properties().froglin_won, Comparator.EQ, froglin_type.to_field())
            .set_limit(1);
        // maybe add another check here for froglin to recover?
        let notes = storage.battle_winners.at(player).pop_notes(options);
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

        // increment the battled froglin
        stash.replace(&mut new_stash_note).emit(encode_and_encrypt_note(
            &mut context,
            keys.ovpk_m,
            player,
            player,
        ));
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
    unconstrained fn view_won_in_battle(player: AztecAddress) -> pub [u8; 5] {
        let mut options = NoteViewerOptions::new();
        options = options.set_limit(5);
        let set = storage.battle_winners.at(player);
        let notes = set.view_notes(options);

        let mut won_notes: [u8; 5] = [0; 5];
        for i in 0..notes.len() {
            won_notes[i] = notes.get_unchecked(i).froglin_won as u8;
        }

        won_notes
    }
}
