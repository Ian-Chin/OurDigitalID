import React, { useEffect } from "react";

const PHONE_WIDTH = 420;

export default function PortraitFrame({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-portrait-frame", "");
    styleEl.textContent = `
      html, body { margin: 0; padding: 0; background: #0f172a; }
      html, body, #root { height: 100%; }
      #root {
        width: 100% !important;
        max-width: ${PHONE_WIDTH}px !important;
        margin: 0 auto !important;
        background: #ffffff;
        box-shadow: 0 10px 40px rgba(0,0,0,0.35);
        overflow: hidden;
      }
      /* react-native-web renders <Modal> through a portal attached to document.body,
         which escapes the 420px #root frame and stretches modals across the full
         viewport. Constrain the portal root to the phone width so modal sheets,
         previews, and dialogs match the rest of the app. */
      [aria-modal="true"][role="dialog"],
      [data-modal-root] {
        max-width: ${PHONE_WIDTH}px !important;
        left: 0 !important;
        right: 0 !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, []);

  return <>{children}</>;
}
