import { TestingAppChain } from "@proto-kit/sdk";
import { CircuitString, method, PrivateKey } from "o1js";
import { Auction } from "../../../src/runtime/auction";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { ItemInfo } from "../../../src/runtime/item/item-info";

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

    const item: ItemInfo = {
      description: CircuitString.fromString("An awesome book"),
      name: CircuitString.fromString("First book edition"),
      itemId: UInt64.zero,
      itemType: UInt64.from(3),
      url: CircuitString.fromString("book.com")
    }

    const tx1 = await appChain.transaction(alice, async () => {
      await auction.addItem(item);
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();



    expect(block?.transactions[0].status.toBoolean()).toBe(true);

    console.log("added");

    const key = UInt64.from(1);
    const itemAdded = await appChain.query.runtime.Auction.items.get(key);


    expect(itemAdded?.itemId?.toBigInt()).toBe(1n);
    expect(itemAdded?.name.toString()).toBe("First book edition");

    console.log("name : ", itemAdded?.name.toString());

  }, 1_000_000);
});
