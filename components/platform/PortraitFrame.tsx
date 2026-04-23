import React from "react";
// On native, render children directly — no frame needed.
export default function PortraitFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
