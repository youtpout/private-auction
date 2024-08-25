import { NoConfig } from "@proto-kit/common";
import { runtimeMethod, runtimeModule, RuntimeModule, state } from "@proto-kit/module";
import { StateMap, State } from "@proto-kit/protocol";
import { Field } from "o1js";
import { ItemInfo } from "./item/item-info";
import { UInt, UInt64 } from "@proto-kit/library";

/**
 * Runtime module to create orders
 */
@runtimeModule()
export class Auction extends RuntimeModule<NoConfig> {

    // all existing items in the system
    @state() public items = StateMap.from<UInt64, ItemInfo>(UInt64, ItemInfo);
    @state() public lastItemId = State.from(UInt64);


    public constructor(
    ) {
        super();
    }

    /**
     * Register a new item for a futur auction
     * @param item information about the item
     */
    @runtimeMethod()
    public async addItem(item: ItemInfo) {
        const lastItemId = (await this.lastItemId.get()).orElse(UInt64.from(0));
        const currentId = UInt64.Safe.fromField(lastItemId.value);
        const newId = currentId.add(1);
        item.itemId = newId;

        await this.items.set(newId, item);
        await this.lastItemId.set(newId);

    }

}