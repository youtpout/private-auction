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
    name: CircuitString,
    description: CircuitString,
    url: CircuitString,
    // nft , bond , art, stock market ...
    itemType: UInt64,
    quantity: UInt64,
    partialQuantity: Bool,
    startPriceUnit: UInt64,
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
            name: CircuitString,
            description: CircuitString,
            url: CircuitString,
            // nft , bond , art, stock market ...
            itemType: UInt64,
            quantity: UInt64,
            partialQuantity: Bool,
            startPriceUnit: UInt64,
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
        name: CircuitString,
        description: CircuitString,
        url: CircuitString,
        // nft , bond , art, stock market ...
        itemType: UInt64,
        quantity: UInt64,
        partialQuantity: Bool,
        startPriceUnit: UInt64,
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
            name,
            description,
            url,
            itemType,
            quantity,
            partialQuantity,
            startPriceUnit,
            startTime,
            duration,
            discountRate,
            isPrivate,
            vkHash
        });
    }
}
