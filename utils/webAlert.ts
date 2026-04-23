// Cross-platform alert/confirm helper.
//
// On native, React Native's Alert.alert renders a native dialog with all the
// provided buttons. On web, Alert.alert degrades to window.alert() — which
// only shows an "OK" button, so Cancel/Destructive handlers silently never
// fire. That breaks delete confirmations and multi-choice dialogs.
//
// Use showConfirm / showChoice from this module on screens where the prompt
// must work on the web build too.

import { Alert, Platform, type AlertButton } from "react-native";

type ChoiceButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

// Two-option confirm (Cancel / Confirm). Falls back to window.confirm on web.
export function showConfirm(
  title: string,
  message: string,
  buttons: [ChoiceButton, ChoiceButton],
) {
  const [cancelBtn, confirmBtn] =
    buttons[0].style === "cancel"
      ? [buttons[0], buttons[1]]
      : buttons[1].style === "cancel"
        ? [buttons[1], buttons[0]]
        : [buttons[0], buttons[1]];

  if (Platform.OS === "web") {
    const ok =
      typeof window !== "undefined" &&
      window.confirm(`${title}\n\n${message}`);
    if (ok) {
      confirmBtn.onPress?.();
    } else {
      cancelBtn.onPress?.();
    }
    return;
  }

  Alert.alert(title, message, buttons as AlertButton[]);
}

// Multi-option dialog. On web, the first non-cancel button auto-runs (after a
// window.alert acknowledgment) because the browser cannot render more than
// two options. Use this for notifications (e.g. "Document Saved") where you
// just need the user to be informed and one default follow-up action.
export function showChoice(
  title: string,
  message: string,
  buttons: ChoiceButton[],
) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n\n${message}`);
    const primary = buttons.find((b) => b.style !== "cancel");
    primary?.onPress?.();
    return;
  }

  Alert.alert(title, message, buttons as AlertButton[]);
}
