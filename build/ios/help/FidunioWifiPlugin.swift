import Capacitor
import Foundation
import NetworkExtension

/// FIDUNIO HELP (2026-11-24): the name of the Wi-Fi network the iPhone is on.
/// Read-only. iOS only answers after the person has allowed location for FIDUNIO.
@objc(FidunioWifiPlugin)
public class FidunioWifiPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FidunioWifiPlugin"
    public let jsName = "FidunioWifi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "current", returnType: CAPPluginReturnPromise)
    ]

    @objc func current(_ call: CAPPluginCall) {
        NEHotspotNetwork.fetchCurrent { network in
            var ssid = network?.ssid ?? ""
            if ssid.count > 64 { ssid = String(ssid.prefix(64)) }
            call.resolve(["ssid": ssid])
        }
    }
}
