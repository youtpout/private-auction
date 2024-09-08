import dynamic from "next/dynamic";

export default dynamic(() => import("./auction-page"), {
  ssr: false,
});
