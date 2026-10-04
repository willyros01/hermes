/*
 * FIDUNIO notification platform capability adapter.
 *
 * The shared notification registration owner remains notification-registration.js.
 * This adapter only reports which platform transport is currently available.
 * Native APNs/FCM registration is deliberately not implemented by this checkpoint.
 */
import {isNativeIOSRuntime} from "./platform-runtime.js";

export function getNotificationPlatformCapabilities(platformOptions){
  if(isNativeIOSRuntime(platformOptions)){
    return Object.freeze({
      registrationKind:"native-pending",
      webPush:false,
      nativeRegistration:false,
    });
  }
  return Object.freeze({
    registrationKind:"web-push",
    webPush:true,
    nativeRegistration:false,
  });
}

export const NOTIFICATION_PLATFORM_ADAPTER_V1=Object.freeze({
  sharedOwner:"notification-registration",
  webTransport:"web-push-service-worker",
  iosTransport:"future-apns-fcm",
  fakeServiceWorker:false,
});
