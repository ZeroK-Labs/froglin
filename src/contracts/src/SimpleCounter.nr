contract SimpleCounter {
    use dep::aztec::prelude::{AztecAddress, Map};
    use dep::value_note::balance_utils;
    use dep::easy_private_state::EasyPrivateUint;

    #[aztec(storage)]
    struct Storage {
        counters: Map<AztecAddress, EasyPrivateUint>,
    }

    #[aztec(private)]
    #[aztec(initializer)]
    // name of initializer can be anything, as long as it's marked with `aztec(initializer)`
    fn constructor(owner: AztecAddress, outgoing_viewer: AztecAddress) {
        dep::aztec::oracle::debug_log::debug_log_format("constructor - owner {0}", [owner.to_field()]);
    }

    #[aztec(private)]
    fn increment(owner: AztecAddress, outgoing_viewer: AztecAddress) {
        dep::aztec::oracle::debug_log::debug_log_format("increment - owner {0}", [owner.to_field()]);

        let counters = storage.counters;
        counters.at(owner).add(1, owner, outgoing_viewer);
    }

    #[aztec(private)]
    fn decrement(owner: AztecAddress, outgoing_viewer: AztecAddress) {
        dep::aztec::oracle::debug_log::debug_log_format("decrement - owner {0}", [owner.to_field()]);

        let counters = storage.counters;
        counters.at(owner).sub(1, owner, outgoing_viewer);
    }

    unconstrained fn get_counter(owner: AztecAddress) -> pub Field {
        dep::aztec::oracle::debug_log::debug_log_format("get_counter - owner {0}", [owner.to_field()]);

        let counters = storage.counters;
        balance_utils::get_balance(counters.at(owner).set)
    }
}
