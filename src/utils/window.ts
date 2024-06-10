export const clientEnabled = typeof window !== "undefined";

// List of mobile devices and platforms
const mobileDevices = [
  /android/i,
  /webos/i,
  /iphone/i,
  /ipad/i,
  /ipod/i,
  /blackberry/i,
  /windows phone/i,
];

export const mobileClient = mobileDevices.some((mobileDevice) =>
  navigator.userAgent.match(mobileDevice),
);

export const iOSClient =
  clientEnabled ||
  (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
