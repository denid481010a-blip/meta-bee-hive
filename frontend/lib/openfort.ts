import OpenfortSDK from "@openfort/openfort-js";

let _instance: InstanceType<typeof OpenfortSDK> | null = null;

export function getOpenfort(): InstanceType<typeof OpenfortSDK> {
  if (typeof window === "undefined") throw new Error("Openfort only available client-side");
  if (!_instance) {
    _instance = new OpenfortSDK({
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
