import Scene from "../../scene";
import { WarpOverlay } from "../../_components/WarpOverlay";

export default function CosmicVariant() {
  return (
    <div className="w-screen h-screen">
      <Scene variant="cosmic" />
      {/* Drop out of hyperspace on entry ("켜질 때"). */}
      <WarpOverlay bootOnMount />
    </div>
  );
}
