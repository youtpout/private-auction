import { NoConfig } from "@proto-kit/common";
import { runtimeMethod, runtimeModule, RuntimeModule, state } from "@proto-kit/module";
import { StateMap, State } from "@proto-kit/protocol";
import { Bool, CircuitString, Field, Poseidon, Provable, PublicKey } from "o1js";
import { UInt, UInt64 } from "@proto-kit/library";
import { MainProof, SideloadedProgramProof } from "./sideload";
import { Order } from "./order";
import { Bid } from "./bid";

/**
 * Runtime module to create orders
 */
@runtimeModule()
export class Auction extends RuntimeModule<NoConfig> {

    // all existing orders in the system
    @state() public orders = StateMap.from<UInt64, Order>(UInt64, Order);
    @state() public lastOrderId = State.from(UInt64);

    @state() public bids = StateMap.from<Field, Bid>(Field, Bid);
    @state() public bidCount = StateMap.from<Field, UInt64>(Field, UInt64);

    public constructor(
    ) {
        super();
    }


    /**
  * Register a new english auction
  */
    @runtimeMethod()
    public async addEnglishAuction(name: CircuitString, description: CircuitString, url: CircuitString, itemType: UInt64, startPrice: UInt64, startTime: UInt64, duration: UInt64, isPrivate: Bool, vkHash: Field) {
        const sender = this.transaction.sender.value;

        const lastEnglish = (await this.lastOrderId.get()).orElse(UInt64.from(0));
        const currentId = UInt64.Safe.fromField(lastEnglish.value);
        const newId = currentId.add(1);
        const order = Order.create(newId, UInt64.from(1), sender, name, description, url, itemType, UInt64.from(1), Bool(false), startPrice, startTime, duration, UInt64.zero, isPrivate, vkHash);

        await this.orders.set(newId, order);
        await this.lastOrderId.set(newId);
    }

    @runtimeMethod()
    public async bidEnglish(orderId: UInt64, amount: UInt64) {

        const orderOption = await this.orders.get(orderId);
        const order = new Order(orderOption.value);

        order.orderType.assertEquals(1, "Not an english auction");
        order.isPrivate.assertFalse("Is a private auction");

        const lastBidAmount = await this.getLastBidAmount(orderId);
        const oldAmount = UInt64.from(lastBidAmount);
        amount.greaterThan(oldAmount).assertTrue("This bid need to be greater than previous bid");
    }

    @runtimeMethod()
    public async bidEnglishPrivate(orderId: UInt64, sender: PublicKey, amount: UInt64, proof: MainProof) {

        const orderOption = await this.orders.get(orderId);
        const order = new Order(orderOption.value);

        order.orderType.assertEquals(1, "Not an english auction");
        order.isPrivate.assertTrue("Is a public auction");

        // verify proof before bid
        proof.publicInput.address.assertEquals(sender);
        proof.publicInput.vkHash.assertEquals(order.vkHash);
        proof.verify();

        const lastBidAmount = await this.getLastBidAmount(orderId);
        const oldAmount = UInt64.from(lastBidAmount);
        amount.greaterThan(oldAmount).assertTrue("This bid need to be greater than previous bid");

    }

    private async getLastBidAmount(orderId: UInt64) {
        // resturn amount for the last bid
        const lastBidId = await this.countBid(orderId);
        const hashLastBid = Poseidon.hash([orderId.value, lastBidId.value]);
        const lastBid = await this.bids.get(hashLastBid);
        const bid = new Bid(lastBid.value);
        const amount = Provable.if(bid.bidId.greaterThan(UInt64.zero), UInt64, UInt64.from(bid.amount), UInt64.from(UInt64.zero));
        return UInt64.Safe.fromField(amount.value);
    }

    private async countBid(orderId: UInt64) {
        // we store bid count at this hash
        const hash = this.getHashCountBid(orderId);
        const bidCount = await this.bidCount.get(hash);
        return bidCount.value;
    }

    private getHashCountBid(orderId: UInt64) {
        // we store bid count at this hash
        return Poseidon.hash([orderId.value, Field(0)]);
    }
}