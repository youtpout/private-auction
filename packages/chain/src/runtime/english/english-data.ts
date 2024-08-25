import { TokenId, UInt64 } from "@proto-kit/library";
import { Provable, Struct, Field, Bool } from "o1js";

/**
 * List data necessary to create an english auction
 */
export class EnglishData extends Struct({
    orderId: UInt64,
    itemId: UInt64,
    startPrice: UInt64,
    startTime: UInt64,
    duration: UInt64,
    isPrivate: Bool,
    verifierKey: Field
}) {

}
