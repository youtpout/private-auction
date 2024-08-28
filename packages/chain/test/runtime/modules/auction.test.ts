import { TestingAppChain } from "@proto-kit/sdk";
import { Bool, CircuitString, Field, method, PrivateKey } from "o1js";
import { Auction } from "../../../src/runtime/auction/auction";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { time } from "console";

log.setLevel("ERROR");

describe("Auction", () => {
  it("should add a item", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Auction,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        Auction: {
        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const auction = appChain.runtime.resolve("Auction");


    const description = CircuitString.fromString("An awesome book");
    const name = CircuitString.fromString("First book edition");
    const itemType = UInt64.from(3);
    const url = CircuitString.fromString("book.com");
    const startPrice = UInt64.from(15 * 10 ** 9);
    const startTime = UInt64.from(Date.now() + 10000);
    const duration = UInt64.from(24 * 60 * 60);
    const isPrivate = Bool(false);
    const vkHash = Field.empty();


    const tx1 = await appChain.transaction(alice, async () => {
      await auction.addEnglishAuction(name, description, url, itemType, startPrice, startTime, duration, isPrivate, vkHash);
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
});
