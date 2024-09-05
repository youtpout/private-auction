import { TokenId, UInt64 } from "@proto-kit/library";
import { Provable, Struct, Field, Bool, VerificationKey, PublicKey, CircuitString, Poseidon } from "o1js";


/**
 * List data necessary to create a auction
 */
export class Bid extends Struct({
    bidId: UInt64,
    orderId: UInt64,
    creator: PublicKey,
    amount: UInt64
}) {
    constructor(
        value: {
            bidId: UInt64,
            orderId: UInt64,
            creator: PublicKey,
            amount: UInt64
        }
    ) {
        super(value);
    }

    static create(
        bidId: UInt64,
        orderId: UInt64,
        creator: PublicKey,
        amount: UInt64
    ) {
        return new Bid({
            bidId,
            orderId,
            creator,
            amount
        });
    }

    hash() {
        return Poseidon.hash([this.orderId.value, this.bidId.value]);
    }
}
