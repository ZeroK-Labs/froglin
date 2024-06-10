export const clientEnabled = typeof window !== "undefined";

export const mobileClient =
  clientEnabled || "ontouchstart" in document.documentElement;

export const iOSClient =
  clientEnabled ||
  (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
