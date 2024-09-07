import { TokenId, UInt64 } from "@proto-kit/library";
import { Provable, Struct, Field, Bool, VerificationKey, PublicKey, CircuitString } from "o1js";


/**
 * List data necessary to create a auction
 */
export class Order extends Struct({
    orderId: UInt64,
    // 1 english, 2 dutch, 3 blind
    orderType: UInt64,
    creator: PublicKey,
    owner: PublicKey,
    name: CircuitString,
    image: CircuitString,
    description: CircuitString,
    url: CircuitString,
    // nft , bond , art, stock market ...
    itemType: UInt64,
    startPrice: UInt64,
    startTime: UInt64,
    duration: UInt64,
    discountRate: UInt64,
    isPrivate: Bool,
    vkHash: Field
}) {
    constructor(
        value: {
            orderId: UInt64,
            // 1 english, 2 dutch, 3 blind
            orderType: UInt64,
            creator: PublicKey,
            owner: PublicKey,
            name: CircuitString,
            image: CircuitString,
            description: CircuitString,
            url: CircuitString,
            // nft , bond , art, stock market ...
            itemType: UInt64,
            startPrice: UInt64,
            startTime: UInt64,
            duration: UInt64,
            discountRate: UInt64,
            isPrivate: Bool,
            vkHash: Field
        }
    ) {
        super(value);
    }

    static create(
        orderId: UInt64,
        // 1 english, 2 dutch, 3 blind
        orderType: UInt64,
        creator: PublicKey,
        owner: PublicKey,
        name: CircuitString,
        image: CircuitString,
        description: CircuitString,
        url: CircuitString,
        // nft , bond , art, stock market ...
        itemType: UInt64,
        startPrice: UInt64,
        startTime: UInt64,
        duration: UInt64,
        discountRate: UInt64,
        isPrivate: Bool,
        vkHash: Field
    ) {
        return new Order({
            orderId,
            orderType,
            creator,
            owner,
            name,
            image,
            description,
            url,
            itemType,
            startPrice,
            startTime,
            duration,
            discountRate,
            isPrivate,
            vkHash
        });
    }
}
