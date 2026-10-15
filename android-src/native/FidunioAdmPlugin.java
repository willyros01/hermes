package io.github.willyros01.fidunio;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import com.amazon.A3L.messaging.A3LMessaging;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** ADM-only bridge. Google Android continues using the existing FirebaseMessaging plugin. */
@CapacitorPlugin(name="FidunioAdm",permissions={
  @Permission(alias="notice",strings={Manifest.permission.POST_NOTIFICATIONS})
})
public final class FidunioAdmPlugin extends Plugin {
  // Mirror Wire's proven A3L platform detection. Never infer FCM from
  // an absent, failed or unsupported ADM probe.
  private String provider(){
    try {
      final String p=String.valueOf(A3LMessaging.getCurrentPlatform(getContext()))
        .toUpperCase(java.util.Locale.ROOT);
      if(p.contains("ADM"))return "adm";
      if(p.contains("FCM"))return "fcm";
    }catch(Exception error){
      android.util.Log.w("FidunioAdm","A3L provider detection failed",error);
    }
    return "";
  }
  @PluginMethod public void available(PluginCall call){
    JSObject ret=new JSObject();
    final String p=provider();
    ret.put("supported",!p.isEmpty());
    ret.put("provider",p);
    final PermissionState state=getPermissionState("notice");
    ret.put("permission",Build.VERSION.SDK_INT<33||state==PermissionState.GRANTED
      ?"granted":state==PermissionState.DENIED?"denied":"default");
    call.resolve(ret);
  }
  private void issueToken(PluginCall call){
    if(!"adm".equals(provider())){call.reject("Amazon ADM unavailable on this device.");return;}
    A3LMessaging.getToken().addOnCompleteListener(task->{
      if(!task.isSuccessful()||task.getResult()==null||task.getResult().isEmpty()){
        call.reject("Amazon ADM registration returned no token.");return;
      }
      JSObject ret=new JSObject();
      ret.put("provider","adm");
      ret.put("token",task.getResult());
      call.resolve(ret);
    });
  }
  @PluginMethod public void register(PluginCall call){
    if(!"adm".equals(provider())){call.reject("This device is not using Amazon ADM.");return;}
    if(Build.VERSION.SDK_INT>=33&&getPermissionState("notice")!=PermissionState.GRANTED){
      if(Boolean.TRUE.equals(call.getBoolean("silent",false))){
        call.reject("Notification permission is disabled.");return;
      }
      requestPermissionForAlias("notice",call,"permissionGranted");
      return;
    }
    issueToken(call);
  }
  @PermissionCallback private void permissionGranted(PluginCall call){
    if(getPermissionState("notice")!=PermissionState.GRANTED){
      call.reject("Notification permission was not granted.");return;
    }
    issueToken(call);
  }
  private JSObject routeFromIntent(Intent intent){
    JSObject result=new JSObject();
    if(intent==null)return result;
    final String type=intent.getStringExtra("fidunioType");
    final String conversation=intent.getStringExtra("fidunioConversationId");
    final String message=intent.getStringExtra("fidunioMessageId");
    intent.removeExtra("fidunioType");
    intent.removeExtra("fidunioConversationId");
    intent.removeExtra("fidunioMessageId");
    if(("direct-message".equals(type)||"group-message".equals(type))
       &&valid(conversation)&&valid(message)){
      result.put("type",type);
      result.put("conversationId",conversation);
      result.put("messageId",message);
    }
    return result;
  }
  private boolean valid(String text){
    return text!=null&&text.length()>0&&text.length()<=256
      &&text.matches("[A-Za-z0-9_.-]+");
  }
  @PluginMethod public void takeRoute(PluginCall call){
    call.resolve(routeFromIntent(getActivity().getIntent()));
  }
  @Override protected void handleOnNewIntent(Intent intent){
    super.handleOnNewIntent(intent);
    JSObject route=routeFromIntent(intent);
    if(route.has("type")){
      JSObject notice=new JSObject();
      notice.put("data",route);
      JSObject event=new JSObject();
      event.put("notification",notice);
      notifyListeners("notificationActionPerformed",event);
    }
  }
}
