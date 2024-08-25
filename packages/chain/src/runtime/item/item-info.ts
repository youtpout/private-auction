import { TokenId, UInt64 } from "@proto-kit/library";
import { CircuitString, Provable, Struct } from "o1js";
import { string } from "yargs";

/**
 * Info about the sells item
 */
export class ItemInfo extends Struct({
    itemId: UInt64,
    name: CircuitString,
    description: CircuitString,
    url: CircuitString,
    // nft , bond , art, stock market ...
    itemType: UInt64
}) {

}
