import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import { Bool, CircuitString, Field, method, PrivateKey, PublicKey } from "o1js";
import { Auction } from "../../../src/runtime/auction/auction";
import { log } from "@proto-kit/common";
import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { time } from "console";
import { Balances } from "../../../src/runtime/modules/balances";
import { modules, config } from "../../../src/runtime";

log.setLevel("ERROR");

describe("Auction", () => {
  let appChain: any;
  let alicePrivateKey: PrivateKey;
  let alice: PublicKey;
  let bobPrivateKey: PrivateKey;
  let bob: PublicKey;
  let auction: Auction;
  let balances: Balances;
  let tokenId = TokenId.from(0);

  async function produceBlocks(nb: number) {
    for (let index = 0; index < nb; index++) {
      await appChain.produceBlock();
    }
  }


  beforeEach(async () => {

    appChain = TestingAppChain.fromRuntime(modules);
    appChain.configurePartial({
      Runtime: config,
    });

    await appChain.start();

    alicePrivateKey = PrivateKey.random();
    alice = alicePrivateKey.toPublicKey();

    bobPrivateKey = PrivateKey.random();
    bob = alicePrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    auction = appChain.runtime.resolve("Auction");
    balances = appChain.runtime.resolve("Balances");

    const tx1 = await appChain.transaction(alice, async () => {
      await balances.addBalance(tokenId, alice, UInt64.from(1000 * 10 ** 9));
      await balances.addBalance(tokenId, bob, UInt64.from(1000 * 10 ** 9));
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();
    expect(block?.transactions[0].status.toBoolean()).toBe(true);
  });

  it("should add an auction", async () => {

    const description = CircuitString.fromString("An awesome book");
    const name = CircuitString.fromString("First book edition");
    const image = CircuitString.fromString("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/290px-FullMoon2010.jpg");
    const itemType = UInt64.from(3);
    const url = CircuitString.fromString("book.com");
    const startPrice = UInt64.from(15 * 10 ** 9);
    const startTime = UInt64.from(Date.now() + 10000);
    const duration = UInt64.from(24 * 60 * 60);
    const isPrivate = Bool(false);
    const vkHash = Field.empty();


    const tx1 = await appChain.transaction(alice, async () => {
      await auction.addEnglishAuction(name, image, description, url, itemType, startPrice, startTime, duration, isPrivate, vkHash);
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    expect(block?.transactions[0].status.toBoolean()).toBe(true);

    console.log("added");

    const key = UInt64.from(1);
    const auctionAdded = await appChain.query.runtime.Auction.orders.get(key);


    expect(auctionAdded?.orderId?.toBigInt()).toBe(1n);
    expect(auctionAdded?.name.toString()).toBe("First book edition");

    console.log("name : ", auctionAdded?.name.toString());

  }, 1_000_000);

  it("should bid an auction", async () => {

    const description = CircuitString.fromString("An awesome book");
    const name = CircuitString.fromString("First book edition");
    const image = CircuitString.fromString("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/290px-FullMoon2010.jpg");
    const itemType = UInt64.from(3);
    const url = CircuitString.fromString("book.com");
    const startPrice = UInt64.from(1 * 10 ** 9);
    const startTime = UInt64.from(10);
    const duration = UInt64.from(100);
    const isPrivate = Bool(false);
    const vkHash = Field.empty();


    const tx1 = await appChain.transaction(alice, async () => {
      await auction.addEnglishAuction(name, image, description, url, itemType, startPrice, startTime, duration, isPrivate, vkHash);
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();
    expect(block?.transactions[0].status.toBoolean()).toBe(true);

    console.log("added");

    await produceBlocks(10);


    const tx2 = await appChain.transaction(bob, async () => {
      await auction.bidEnglish(UInt64.from(1), UInt64.from(2 * 10 ** 9));
    });

    console.log("bob", bob.toBase58());

    const key = new BalancesKey({ tokenId, address: bob });
    const balanceBob = await appChain.query.runtime.Balances.balances.get(key);
    console.log("balance bob", balanceBob.toBigInt());

    await tx2.sign();
    await tx2.send();

    const block2 = await appChain.produceBlock();
    expect(block2?.transactions[0].status.toBoolean()).toBe(true);

    console.log("bided");

    const balanceBobAfter = await appChain.query.runtime.Balances.balances.get(key);
    console.log("balance bob", balanceBobAfter.toBigInt());
    const dif = balanceBob.sub(balanceBobAfter);
    expect(dif.toBigInt()).toBe(UInt64.from(2 * 10 ** 9).toBigInt());

  }, 1_000_000);
});
