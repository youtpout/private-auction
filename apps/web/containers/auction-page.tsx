"use client";
import { useAuctionsStore, useObserveAuction } from "@/lib/stores/auctions";
import { useClientStore } from "@/lib/stores/client";
import { useWalletStore } from "@/lib/stores/wallet";
import { OrderModel } from "@/models/OrderModel";

export default function Home() {
  const wallet = useWalletStore();
  const auctions = useAuctionsStore();
  const client = useClientStore();

  useObserveAuction();

  const addAuction = async () => {
    await auctions.addOrder(client?.client as any, wallet?.wallet as any);
  };

  const auction = (order: OrderModel) => {
    return (<div>
      <div><span>{order.orderId}</span></div>
      <div><img crossorigin='anonymous' width={100} src={order.image} /></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>)
  }

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          {auctions.orders.map((order) => auction(order))}
          <button onClick={addAuction}>Add auction</button>
        </div>
      </div>
    </div>);

}
