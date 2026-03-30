import posthog from "posthog-js";

export function captureEvent(event: string, properties?: Record<string, any>): void {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}
