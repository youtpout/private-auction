import { TokenId, UInt64 } from "@proto-kit/library";
import { Provable, Struct } from "o1js";
import { string } from "yargs";

/**
 * Info about the sells item
 */
export class ItemInfo extends Struct({
    itemId: UInt64,
    name: string,
    description: string,
    url: string,
    // nft , bond , art, stock market ...
    itemType: UInt64
}) {

}
