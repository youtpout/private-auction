import { NoConfig } from "@proto-kit/common";
import { runtimeMethod, runtimeModule, RuntimeModule, state } from "@proto-kit/module";
import { StateMap, State, assert } from "@proto-kit/protocol";
import { Bool, CircuitString, Field, Poseidon, Provable, PublicKey, ZkProgram } from "o1js";
import { Balance, TokenId, UInt, UInt64 } from "@proto-kit/library";
import { mainProgram } from "./sideload";
import { Order } from "./order";
import { Bid } from "./bid";
import { inject } from "tsyringe";
import { Balances } from "../modules/balances";

export let MainProof_ = ZkProgram.Proof(mainProgram);
export class MainProof extends MainProof_ { }

/**
 * Runtime module to create orders
 */
@runtimeModule()
export class Auction extends RuntimeModule<NoConfig> {

    // all existing orders in the system
    @state() public orders = StateMap.from<UInt64, Order>(UInt64, Order);
    @state() public lastOrderId = State.from(UInt64);

    @state() public bids = StateMap.from<Field, Bid>(Field, Bid);
    /**
     * Count bid by order id
     * Key OrderId
     * Value bid length
     */
    @state() public bidCount = StateMap.from<UInt64, UInt64>(UInt64, UInt64);

    public auctionPublicKey = PublicKey.fromGroup(Poseidon.hashToGroup([Field(555)]));

    public constructor(@inject("Balances") public balances: Balances,
    ) {
        super();
    }

    /**
  * Register a new english auction
  */
    @runtimeMethod()
    public async addEnglishAuction(name: CircuitString, image: CircuitString, description: CircuitString, url: CircuitString, itemType: UInt64, startPrice: UInt64, startTime: UInt64, duration: UInt64, isPrivate: Bool, vkHash: Field) {
        const sender = this.transaction.sender.value;
        const now = UInt64.Safe.fromField(this.network.block.height.value);
        assert(startTime.greaterThan(now), "Can't create auction in the past");
        assert(duration.greaterThan(UInt64.zero), "Duration can't be zero");

        const lastEnglish = (await this.lastOrderId.get()).orElse(UInt64.from(0));
        const currentId = UInt64.Safe.fromField(lastEnglish.value);
        const newId = currentId.add(1);
        const order = Order.create(newId, UInt64.from(1), sender, sender, name, image, description, url, itemType, startPrice, startTime, duration, UInt64.zero, isPrivate, vkHash);

        await this.orders.set(newId, order);
        await this.lastOrderId.set(newId);
    }

    @runtimeMethod()
    public async bidEnglish(orderId: UInt64, amount: UInt64) {
        const sender = this.transaction.sender.value;
        const orderOption = await this.orders.get(orderId);
        const order = new Order(orderOption.value);

        const isEnglish = order.orderType.equals(1);
        assert(isEnglish, "Not an english auction");
        const isPublic = order.isPrivate.not();
        assert(isPublic, "Is a private auction");

        await this.addBid(orderId, sender, amount);
    }

    @runtimeMethod()
    public async bidEnglishPrivate(orderId: UInt64, amount: UInt64, proof: MainProof) {

        const sender = this.transaction.sender.value;
        const orderOption = await this.orders.get(orderId);
        const order = new Order(orderOption.value);

        const isEnglish = order.orderType.equals(1);
        assert(isEnglish, "Not an english auction");
        const isPrivate = order.isPrivate;
        assert(isPrivate, "Is a public auction");

        // verify proof before bid
        assert(proof.publicInput.address.equals(sender), "Invalid proof");
        assert(proof.publicInput.vkHash.equals(order.vkHash), "Invalid proof");
        proof.verify();

        await this.addBid(orderId, sender, amount);
    }

    @runtimeMethod()
    public async payAuction(orderId: UInt64) {
        const orderOption = await this.orders.get(orderId);
        const order = new Order(orderOption.value);

        // i don't know if it's the good thing to do
        const now = UInt64.Safe.fromField(this.network.block.height.value);
        const endTime = order.startTime.add(order.duration);
        const ended = endTime.lessThan(now);

        assert(ended, "Auction didn't finish");

        const lastBidId = await this.countBid(orderId);
        assert(lastBidId.greaterThan(UInt64.zero), "No bid for this auction");

        // check if not already paid
        const hashBid = Poseidon.hash([orderId.value, lastBidId.value]);
        const bidValue = await this.bids.get(hashBid);
        const bid = new Bid(bidValue.value);
        const active = bid.status.equals(UInt64.zero);
        assert(active, "This bid is not active");

        //
        await this.balances.transfer(TokenId.from(0), this.auctionPublicKey, order.creator, bid.amount);
        // update bid with paid status
        bid.status = UInt64.from(2);
        await this.bids.set(hashBid, bid);

        // change owner of the auction to the bidder
        order.owner = bid.creator;
        await this.orders.set(orderId, order);
    }

    @runtimeMethod()
    public async withdrawBid(orderId: UInt64, bidId: UInt64) {
        const orderOption = await this.orders.get(orderId);
        const order = new Order(orderOption.value);

        // i don't know if it's the good thing to do
        const now = UInt64.Safe.fromField(this.network.block.height.value);
        const endTime = order.startTime.add(order.duration);
        const ended = endTime.lessThan(now);

        assert(ended, "Auction didn't finish");

        const lastBidId = await this.countBid(orderId);
        const notLastBid = lastBidId.greaterThan(bidId);
        assert(notLastBid, "You can't cancel the winning bid");

        const hashBid = Poseidon.hash([orderId.value, bidId.value]);
        const bidValue = await this.bids.get(hashBid);
        const bid = new Bid(bidValue.value);
        const active = bid.status.equals(UInt64.zero);
        assert(active, "This bid is not active");

        await this.balances.transfer(TokenId.from(0), this.auctionPublicKey, bid.creator, bid.amount);
        // update bid with canceled status
        bid.status = UInt64.from(1);
        await this.bids.set(hashBid, bid);
    }

    private async addBid(orderId: UInt64, sender: PublicKey, amount: UInt64) {
        // check if order is active 
        const orderValue = await this.orders.get(orderId);
        const order = new Order(orderValue.value);
        const now = UInt64.Safe.fromField(this.network.block.height.value);
        const started = now.greaterThanOrEqual(order.startTime);
        assert(started, "Auction not started");
        const endTime = order.startTime.add(order.duration);
        const ended = endTime.greaterThan(now);
        assert(ended, "Auction finished");

        // check if amount is suffisient
        const lastBidId = await this.countBid(orderId);
        const lastBidAmount = await this.getLastBidAmount(orderId);
        const oldAmount = UInt64.from(lastBidAmount);
        const greaterAmount = amount.greaterThan(oldAmount);
        assert(greaterAmount, "This bid need to be greater than previous bid");


        const minAmount = amount.greaterThanOrEqual(order.startPrice);
        assert(minAmount, "This bid need to be greater or equal to start price");

        await this.balances.transfer(TokenId.from(0), sender, this.auctionPublicKey, amount);

        const newBidId = lastBidId.add(1);
        const bid = Bid.create(newBidId, orderId, sender, amount);
        const hashBid = bid.hash();
        await this.bids.set(hashBid, bid);
        await this.bidCount.set(orderId, UInt64.from(newBidId));


    }

    private async getLastBidAmount(orderId: UInt64) {
        // return amount for the last bid
        const lastBidId = await this.countBid(orderId);
        const hashLastBid = Poseidon.hash([orderId.value, lastBidId.value]);
        const lastBid = await this.bids.get(hashLastBid);
        const bid = new Bid(lastBid.value);
        const amount = Provable.if(bid.bidId.greaterThan(UInt64.zero), UInt64, UInt64.from(bid.amount), UInt64.from(UInt64.zero));
        return UInt64.Safe.fromField(amount.value);
    }

    private async countBid(orderId: UInt64) {
        // we store bid count by orderId
        const bidCount = await this.bidCount.get(orderId);
        return bidCount.value;
    }
}