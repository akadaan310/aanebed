import type { Metadata } from "next";
import { Mine } from "@/components/pearls/Mine";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = { title: "My Pearls", description: "The Pearls you've kept in this browser.", robots: { index: false, follow: false } };

export default function MyPearls() {
  return <><SubstrateLayer data={{ page: "/mine", storage: "this browser only (localStorage pearls.mine.v1); each Pearl lives in its link" }} /><Mine /></>;
}
