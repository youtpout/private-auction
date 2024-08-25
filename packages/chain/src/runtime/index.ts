import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { Auction } from "./auction";

export const modules = VanillaRuntimeModules.with({
  Balances,
  Auction
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Auction: {}
};

export default {
  modules,
  config,
};
