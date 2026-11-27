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
  /* Every Android build (Google phones and Fire): create the HELP alarm channel once, at app start. */
  @Override public void load(){
    try{FidunioAdmService.ensureHelpAlarmChannel(getContext());}catch(Exception ignored){}
  }
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
  private JSObject routeFromIntent(Intent intent){return routeFromIntent(intent,false);}
  /* coldStartFcm (1.1.87): on Google phones, a notification tapped while FIDUNIO was closed starts it with the
   * Firebase data as extras ("google.message_id", "type", ...); the Firebase plugin only reads taps that arrive
   * while FIDUNIO is running, so the first launch intent is read here (once) as well. */
  private JSObject routeFromIntent(Intent intent,boolean coldStartFcm){
    JSObject result=new JSObject();
    if(intent==null)return result;
    final boolean fcm=coldStartFcm&&intent.getStringExtra("fidunioType")==null&&intent.hasExtra("google.message_id");
    final String type=fcm?intent.getStringExtra("type"):intent.getStringExtra("fidunioType");
    final String conversation=fcm?intent.getStringExtra("conversationId"):intent.getStringExtra("fidunioConversationId");
    final String message=fcm?intent.getStringExtra("messageId"):intent.getStringExtra("fidunioMessageId");
    final String alert=fcm?intent.getStringExtra("alertId"):intent.getStringExtra("fidunioAlertId");
    if(fcm)intent.removeExtra("google.message_id");
    intent.removeExtra("fidunioType");
    intent.removeExtra("fidunioConversationId");
    intent.removeExtra("fidunioMessageId");
    intent.removeExtra("fidunioAlertId");
    /* A tapped HELP alarm (1.1.87): JavaScript opens the big HELP screen. */
    if("help-alert".equals(type)&&valid(alert)&&alert.matches("[A-Za-z0-9_-]{1,128}")){
      result.put("type","help-alert");
      result.put("alertId",alert);
      return result;
    }
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
  /* 1.1.87: the HELP reminder's "Open Settings" — FIDUNIO's notification page in Android Settings. */
  @PluginMethod public void openNotificationSettings(PluginCall call){
    try{
      Intent intent=new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
      intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,getContext().getPackageName());
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);
      call.resolve();
    }catch(Exception error){
      try{
        Intent details=new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          android.net.Uri.parse("package:"+getContext().getPackageName()));
        details.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(details);
        call.resolve();
      }catch(Exception second){call.reject("Settings could not be opened.");}
    }
  }
  @PluginMethod public void takeRoute(PluginCall call){
    call.resolve(routeFromIntent(getActivity().getIntent(),true));
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
