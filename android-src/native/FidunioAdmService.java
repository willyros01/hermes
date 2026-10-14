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
}
