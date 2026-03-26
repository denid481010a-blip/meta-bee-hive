import Openfort from "@openfort/openfort-js";

let _instance: Openfort | null = null;

export function getOpenfort(): Openfort {
  if (typeof window === "undefined") throw new Error("Openfort only available client-side");
  if (!_instance) {
    _instance = new Openfort({
      baseConfiguration: {
        publishableKey: process.env.NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY!,
      },
      shieldConfiguration: {
        shieldPublishableKey: process.env.NEXT_PUBLIC_SHIELD_PUBLISHABLE_KEY!,
      },
    });
  }
  return _instance;
}
