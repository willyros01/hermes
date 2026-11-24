import Capacitor
import UIKit

/// FIDUNIO's Capacitor screen: registers FIDUNIO's own native plugins.
class FidunioViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(FidunioWifiPlugin())
    }
}
