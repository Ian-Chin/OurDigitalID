// Side-effect module: must be imported before any code that reads
// Dimensions.get('window') (including constants/layout.ts). Clamps the
// reported viewport width on web so the mobile-first styles behave as if
// the app is running on a 420px-wide phone regardless of browser size.

import { Dimensions, Platform } from "react-native";

export const WEB_PHONE_WIDTH = 420;

if (Platform.OS === "web") {
  const originalGet = Dimensions.get.bind(Dimensions);

  // @ts-ignore — narrowing the overload set intentionally
  Dimensions.get = (dim: "window" | "screen") => {
    const real = originalGet(dim);
    return {
      ...real,
      width: Math.min(real.width, WEB_PHONE_WIDTH),
    };
  };
}
