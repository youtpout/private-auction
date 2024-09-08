export type OrderModel = {
    orderId: number;
    orderType: number;
    creator: string;
    owner: string;
    name: string;
    image: string;
    description: string;
    url: string;
    // nft ; bond ; art; stock market ...
    itemType: number;
    startPrice: number;
    startTime: number;
    duration: number;
    isPrivate: boolean;
    vkHash: string;
}