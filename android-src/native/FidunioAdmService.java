package io.github.willyros01.fidunio;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.amazon.A3L.messaging.A3LMessaging;
import com.amazon.A3L.messaging.A3LMessagingService;
import com.amazon.A3L.messaging.RemoteMessage;
import java.util.Map;

/** Generic/private notifications only; no message text or attachment names on device banners. */
public final class FidunioAdmService extends A3LMessagingService {
  private static final String CHANNEL="fidunio_messages";
  private static boolean valid(String value){
    return value!=null&&!value.isEmpty()&&value.length()<=256
      &&value.matches("[A-Za-z0-9_.-]+");
  }
  @Override public void onNewToken(Context context,String token){
    if(token!=null&&!token.isEmpty())context.getSharedPreferences("fidunio_adm",Context.MODE_PRIVATE)
      .edit().putString("last_token",token).apply();
    // The authenticated app renews its owned server lease on foreground;
    // the service must never register an anonymous or ownerless token.
  }
  @Override public void onMessageReceived(Context context,RemoteMessage message){
    try {
      if(!String.valueOf(A3LMessaging.getCurrentPlatform(context))
            .toUpperCase(java.util.Locale.ROOT).contains("ADM"))return;
    }catch(Exception ignored){return;}
    final Map<String,String> data=message.getData();
    if(data==null)return;
    if("help-alert".equals(data.get("type"))){showHelp(context,data);return;}
    final String type=data.get("type");
    final String conversation=data.get("conversationId");
    final String id=data.get("messageId");
    if(!("direct-message".equals(type)||"group-message".equals(type))
       ||!valid(conversation)||!valid(id))return;
    if(Build.VERSION.SDK_INT>=33&&
       context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
    final NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
    if(manager==null)return;
    if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(
      new NotificationChannel(CHANNEL,"FIDUNIO messages",NotificationManager.IMPORTANCE_HIGH));
    // Use a private default; optional display name has already been authorized by the server.
    String body=data.get("notificationBody");
    if(body==null||(!"New message".equals(body)&&
      !(body.startsWith("New message from ")&&body.length()<=97)))body="New message";
    Intent intent=new Intent(context,MainActivity.class);
    intent.setAction("io.github.willyros01.fidunio.OPEN."+id);
    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    intent.putExtra("fidunioType",type);
    intent.putExtra("fidunioConversationId",conversation);
    intent.putExtra("fidunioMessageId",id);
    final int requestId=(type+"|"+conversation+"|"+id).hashCode();
    PendingIntent pending=PendingIntent.getActivity(context,requestId,intent,
      PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    NotificationCompat.Builder builder=new NotificationCompat.Builder(context,CHANNEL)
      .setSmallIcon(android.R.drawable.ic_dialog_email)
      .setContentTitle("FIDUNIO").setContentText(body)
      .setAutoCancel(true).setContentIntent(pending)
      .setPriority(NotificationCompat.PRIORITY_HIGH);
    manager.notify(requestId,builder.build());
  }
  /* FIDUNIO HELP (2026-11-24): its own urgent channel; the text is only
   * "HELP from <name>" style, checked here as well as on the server. */
  /* HELP alarm (owner, 25 Nov): a NEW channel (Android never lets an app change a channel's sound) that plays
   * res/raw/help_alarm on the ALARM volume, like a clock alarm. Same id as the server's FCM channelId, so Google
   * phones (FCM) and Fire tablets (ADM) ring the same way. Created at app start by FidunioAdmPlugin.load(). */
  static final String HELP_CHANNEL="fidunio-help-alarm";
  static void ensureHelpAlarmChannel(Context context){
    if(Build.VERSION.SDK_INT<26)return;
    final NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
    if(manager==null||manager.getNotificationChannel(HELP_CHANNEL)!=null)return;
    NotificationChannel channel=new NotificationChannel(HELP_CHANNEL,"HELP alarm",NotificationManager.IMPORTANCE_HIGH);
    channel.setDescription("Urgent HELP from your family");
    channel.enableVibration(true);channel.setVibrationPattern(new long[]{0,800,400,800,400,800});
    channel.setBypassDnd(true);
    channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
    android.net.Uri sound=android.net.Uri.parse("android.resource://"+context.getPackageName()+"/raw/help_alarm");
    channel.setSound(sound,new android.media.AudioAttributes.Builder()
      .setUsage(android.media.AudioAttributes.USAGE_ALARM)
      .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
    manager.createNotificationChannel(channel);
  }
  private void showHelp(Context context,Map<String,String> data){
    final String alertId=data.get("alertId");
    String body=data.get("notificationBody");
    if(!valid(alertId)||body==null||body.length()>120)return;
    if(!(body.startsWith("HELP — ")||body.startsWith("HELP from ")||body.startsWith("TEST — HELP from ")||body.endsWith(" is coming")||body.endsWith(" is safe now")||body.endsWith(" is OK now")||body.endsWith(": sorry, it was a mistake")))return;
    if(Build.VERSION.SDK_INT>=33&&
       context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
    final NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
    if(manager==null)return;
    ensureHelpAlarmChannel(context);
    Intent intent=new Intent(context,MainActivity.class);
    intent.setAction("io.github.willyros01.fidunio.HELP."+alertId);
    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    /* 1.1.87 (owner 27 Nov): tapping the HELP alarm opens the big HELP screen. */
    intent.putExtra("fidunioType","help-alert");
    intent.putExtra("fidunioAlertId",alertId);
    final int requestId=("help|"+alertId).hashCode();
    PendingIntent pending=PendingIntent.getActivity(context,requestId,intent,
      PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    NotificationCompat.Builder builder=new NotificationCompat.Builder(context,HELP_CHANNEL)
      .setSmallIcon(android.R.drawable.ic_dialog_alert)
      .setContentTitle("FIDUNIO HELP").setContentText(body)
      .setAutoCancel(true).setContentIntent(pending)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX);
    manager.notify(requestId,builder.build());
  }
}
