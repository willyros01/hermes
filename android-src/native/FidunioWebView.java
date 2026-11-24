package io.github.willyros01.fidunio;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.text.InputType;
import android.util.AttributeSet;
import android.util.Base64;
import android.util.Log;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import androidx.core.view.inputmethod.EditorInfoCompat;
import androidx.core.view.inputmethod.InputConnectionCompat;
import androidx.core.view.inputmethod.InputContentInfoCompat;
import com.getcapacitor.CapacitorWebView;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import org.json.JSONObject;

/**
 * FIDUNIO message box: accept GIFs and stickers from the Android keyboard
 * (Gboard and others, via the Android "commit content" keyboard feature).
 * Android's WebView does not support this for web pages, so the picture is
 * read here and handed to the shared JavaScript as a "fidunio-keyboard-image"
 * event, which sends it like a picked photo. No permission prompt is needed.
 * Only the multi-line message box is offered pictures; other fields are unchanged.
 */
public class FidunioWebView extends CapacitorWebView {
  private static final String TAG = "FidunioKeyboardImage";
  private static final String[] TYPES = {"image/gif", "image/png", "image/webp", "image/jpeg"};
  private static final int MAX_BYTES = 12 * 1024 * 1024;

  public FidunioWebView(Context context, AttributeSet attrs) { super(context, attrs); }

  @Override
  public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
    final InputConnection base = super.onCreateInputConnection(outAttrs);
    if (base == null) return null;
    final boolean messageBox = (outAttrs.inputType & InputType.TYPE_TEXT_FLAG_MULTI_LINE) != 0;
    if (!messageBox) return base;
    EditorInfoCompat.setContentMimeTypes(outAttrs, TYPES);
    return InputConnectionCompat.createWrapper(base, outAttrs, (info, flags, opts) -> receive(info, flags));
  }

  private boolean receive(final InputContentInfoCompat info, int flags) {
    if (Build.VERSION.SDK_INT >= 25 && (flags & InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION) != 0) {
      try { info.requestPermission(); } catch (Exception error) { Log.w(TAG, "permission", error); return false; }
    }
    String type = "image/gif";
    for (String candidate : TYPES) if (info.getDescription().hasMimeType(candidate)) { type = candidate; break; }
    final String mime = type;
    new Thread(() -> {
      try (InputStream in = getContext().getContentResolver().openInputStream(info.getContentUri())) {
        if (in == null) throw new IllegalStateException("no picture data");
        final ByteArrayOutputStream out = new ByteArrayOutputStream();
        final byte[] buffer = new byte[64 * 1024];
        int read;
        while ((read = in.read(buffer)) > 0) {
          out.write(buffer, 0, read);
          if (out.size() > MAX_BYTES) throw new IllegalStateException("picture too large");
        }
        final JSONObject detail = new JSONObject();
        detail.put("type", mime);
        detail.put("name", "keyboard-picture." + mime.substring(mime.indexOf('/') + 1).replace("jpeg", "jpg"));
        detail.put("data", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
        final String script = "window.dispatchEvent(new CustomEvent('fidunio-keyboard-image',{detail:" + detail + "}))";
        post(() -> evaluateJavascript(script, null));
      } catch (Exception error) {
        Log.w(TAG, "keyboard picture not delivered", error);
      } finally {
        try { info.releasePermission(); } catch (Exception ignored) {}
      }
    }).start();
    return true;
  }
}
