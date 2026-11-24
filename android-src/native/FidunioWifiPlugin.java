package io.github.willyros01.fidunio;

import android.Manifest;
import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/** FIDUNIO HELP: the name of the Wi-Fi network the phone is on (Android needs
 *  location permission for this; HELP asks for location anyway). Read-only. */
@CapacitorPlugin(name="FidunioWifi",permissions={@Permission(alias="location",strings={Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION})})
public final class FidunioWifiPlugin extends Plugin {
  @PluginMethod public void current(PluginCall call){
    JSObject ret=new JSObject();
    try{
      WifiManager wifi=(WifiManager)getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
      WifiInfo info=wifi==null?null:wifi.getConnectionInfo();
      String ssid=info==null?"":String.valueOf(info.getSSID());
      if(ssid.startsWith("\"")&&ssid.endsWith("\"")&&ssid.length()>=2)ssid=ssid.substring(1,ssid.length()-1);
      if("<unknown ssid>".equals(ssid))ssid="";
      ret.put("ssid",ssid.length()>64?ssid.substring(0,64):ssid);
    }catch(Exception error){ret.put("ssid","");}
    call.resolve(ret);
  }
}
