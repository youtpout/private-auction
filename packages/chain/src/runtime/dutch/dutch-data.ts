import { TokenId, UInt64 } from "@proto-kit/library";
import { Provable, Struct, Field, Bool } from "o1js";

/**
 * List data necessary to create a dutch auction
 */
export class DutchData extends Struct({
    orderId: UInt64,
    itemId: UInt64,
    quantity: UInt64,
    partialQuantity: Bool,
    startPriceUnit: UInt64,
    startTime: UInt64,
    duration: UInt64,
    discountRate: UInt64,
    isPrivate: Bool,
    verifierKey: Field
}) {

}
