const SDK_VERSION="12.18.0";

// Public reCAPTCHA Enterprise site key registered for FIDUNIO Web / willyros01.github.io.
// This value is intentionally public and is constrained by the Google Cloud key configuration.
export const FIDUNIO_RECAPTCHA_ENTERPRISE_SITE_KEY="6LfLaqstAAAAANNkEghVZ26a4vv8hXwC7KDI9rma";

let appCheckPromise=null;

export async function initializeFidunioAppCheck(){
  if(appCheckPromise)return appCheckPromise;
  appCheckPromise=(async()=>{
    const [appSdk,appCheckSdk]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-check.js`)
    ]);
    const apps=appSdk.getApps();
    if(apps.length!==1)throw new Error("FIDUNIO App Check requires exactly one initialized Firebase app.");
    const app=appSdk.getApp();
    return appCheckSdk.initializeAppCheck(app,{
      provider:new appCheckSdk.ReCaptchaEnterpriseProvider(FIDUNIO_RECAPTCHA_ENTERPRISE_SITE_KEY),
      isTokenAutoRefreshEnabled:true
    });
  })().catch(err=>{
    appCheckPromise=null;
    throw err;
  });
  return appCheckPromise;
}
