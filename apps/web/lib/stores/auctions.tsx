import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { Bool, CircuitString, Field, PublicKey, } from "o1js";
import { useCallback, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";
import { Order } from "chain/dist/runtime/auction/order";
import { OrderModel } from "@/models/OrderModel";

export interface AuctionState {
  loading: boolean;
  orders: OrderModel[];
  loadOrder: (client: Client) => Promise<void>;
  addOrder: (client: Client, address: string) => Promise<PendingTransaction>;
}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export const tokenId = TokenId.from(0);

export const useAuctionsStore = create<
  AuctionState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    loading: Boolean(false),
    orders: [],
    async loadOrder(client: Client) {
      set((state) => {
        state.loading = true;
      });

      const list = [];
      const nbAuction = await client.query.runtime.Auction.lastOrderId.get();
      console.log("nbAuction", nbAuction?.toBigInt())
      const nb = nbAuction?.toBigInt();
      if (nb) {
        for (let index = 1; index <= nb; index++) {
          console.log(index);
          const element = await client.query.runtime.Auction.orders.get(UInt64.from(index));
          console.log(element);
          if (element) {
            const orderInfo: OrderModel = {
              orderId: Number(element.orderId.toBigInt()),
              orderType: Number(element.orderType.toBigInt()),
              creator: element.creator.toBase58(),
              owner: element.owner.toBase58(),
              name: element.name.toString(),
              image: element.image.toString(),
              description: element.description.toString(),
              url: element.url.toString(),
              // nft , bond , art, stock market ...
              itemType: Number(element.orderType.toBigInt()),
              startPrice: Number(element.orderType.toBigInt()),
              startTime: Number(element.orderType.toBigInt()),
              duration: Number(element.orderType.toBigInt()),
              isPrivate: element.isPrivate.toBoolean(),
              vkHash: element.vkHash.toString()
            }
            list.push(orderInfo);
          }
        }
      }

      // const key = BalancesKey.from(tokenId, PublicKey.fromBase58(address));

      // const balance = await client.query.runtime.Balances.balances.get(key);

      set((state) => {
        state.loading = false;
        state.orders = list;
      });
    },
    async addOrder(client: Client, address: string) {
      const auction = client.runtime.resolve("Auction");
      const sender = PublicKey.fromBase58(address);

      const description = CircuitString.fromString("An awesome book");
      const name = CircuitString.fromString("First book edition");
      const image = CircuitString.fromString("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/290px-FullMoon2010.jpg");
      const itemType = UInt64.from(3);
      const url = CircuitString.fromString("book.com");
      const startPrice = UInt64.from(1 * 10 ** 9);
      const startTime = UInt64.from(100000);
      const duration = UInt64.from(100);
      const isPrivate = Bool(false);
      const vkHash = Field.empty();

      const tx = await client.transaction(sender, async () => {
        await auction.addEnglishAuction(name, image, description, url, itemType, startPrice, startTime, duration, isPrivate, vkHash);
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
  })),
);

export const useObserveAuction = () => {
  const client = useClientStore();
  const chain = useChainStore();
  const auctions = useAuctionsStore();

  useEffect(() => {
    if (!client.client) return;

    auctions.loadOrder(client.client);
  }, [client.client, chain.block?.height]);
};



export const useOrder = () => {
  const client = useClientStore();
  const wallet = useWalletStore();
  const auctions = useAuctionsStore();

  return useCallback(async () => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await auctions.addOrder(
      client.client,
      wallet.wallet,
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};
