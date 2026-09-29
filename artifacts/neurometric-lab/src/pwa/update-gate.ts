// One gate per open tab. A service worker activated from another tab must not
// reload this tab while someone is writing a clinical form.
export function createUpdateGate(reload: () => void) {
  let acceptedHere = false;
  return {
    accept(sendSkipWaiting: () => void) {
      acceptedHere = true;
      sendSkipWaiting();
    },
    onControlling() {
      if (acceptedHere) reload();
      return acceptedHere;
    },
  };
}