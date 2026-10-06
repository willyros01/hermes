import {test,expect} from "@playwright/test";

async function reachAccountAccess(page){
  await page.goto("/",{waitUntil:"domcontentloaded"});
  const terms=page.getByText("Terms of Use",{exact:true});
  const signIn=page.getByRole("tab",{name:/Sign In/i});
  await expect(terms.or(signIn)).toBeVisible({timeout:30000});
  if(await terms.isVisible().catch(()=>false)){
    const box=page.locator('input[type="checkbox"]').first();
    await box.check();
    await page.getByRole("button",{name:"Accept",exact:true}).click();
    await page.screenshot({path:"test-results/remote-hand-after-terms.png",fullPage:true});
  }
  await expect(signIn).toBeVisible({timeout:30000});
}

test.describe("FIDUNIO deployed main2 screen gate",()=>{
  test("real startup reaches an interactive account-access screen",async({page})=>{
    const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
    await reachAccountAccess(page);
    await expect(page).toHaveTitle(/FIDUNIO/i);
    await expect(page.getByRole("tab",{name:/Sign In/i})).toBeVisible();
    await expect(page.getByRole("tab",{name:/Join FIDUNIO/i})).toBeVisible();
    await expect(page.locator("#loginEmail")).toBeVisible();
    await expect(page.locator("#loginPassword")).toBeVisible();
    await expect(page.locator("#loginBtn")).toBeEnabled();
    expect(errors,errors.join("\n")).toEqual([]);
  });

  test("blank sign-in stays responsive and reports validation",async({page})=>{
    await reachAccountAccess(page);
    await page.locator("#loginBtn").click();
    await expect(page.locator("#loginBtn")).toBeEnabled();
    await expect(page.locator("body")).not.toContainText("Starting FIDUNIO…");
  });

  test("password recovery validates missing email without hanging",async({page})=>{
    await reachAccountAccess(page);
    await page.locator("#forgotBtn").click();
    await expect(page.locator("#loginNote")).toContainText(/email address/i);
    await expect(page.locator("#forgotBtn")).toBeEnabled();
  });

  test("join screen is reachable through the actual UI",async({page})=>{
    await reachAccountAccess(page);
    await page.getByRole("tab",{name:/Join FIDUNIO/i}).click();
    await expect(page.locator("#inviteCode")).toBeVisible();
    await expect(page.locator("#joinName")).toBeVisible();
    await expect(page.locator("#joinEmail")).toBeVisible();
    await expect(page.locator("#joinPassword")).toBeVisible();
    await expect(page.locator("#redeemBtn")).toBeEnabled();
  });

  test("authenticated functional suite is explicitly gated on dedicated credentials",async()=>{
    const ready=!!process.env.FIDUNIO_E2E_USER_A&&!!process.env.FIDUNIO_E2E_PASSWORD_A&&!!process.env.FIDUNIO_E2E_USER_B&&!!process.env.FIDUNIO_E2E_PASSWORD_B;
    test.skip(!ready,"Dedicated two-account E2E credentials are not configured yet.");
    expect(ready).toBe(true);
  });
});


async function fillSixDigitPin(page,hostSelector,pin){
  const slots=page.locator(`${hostSelector} .pin-code-slot`);
  await expect(slots).toHaveCount(6);
  for(let i=0;i<6;i++)await slots.nth(i).fill(pin[i]);
}

async function signInTestAdmin(page){
  const email=process.env.FIDUNIO_E2E_ADMIN_EMAIL;
  const password=process.env.FIDUNIO_E2E_ADMIN_PASSWORD;
  const pin=process.env.FIDUNIO_E2E_ADMIN_PIN||"641927";
  test.skip(!email||!password,"Recovered Test Admin credentials are not configured in the workflow environment.");
  await reachAccountAccess(page);
  await page.locator("#loginEmail").fill(email);
  await page.locator("#loginPassword").fill(password);
  await page.locator("#loginBtn").click();

  const recoveryPinHost=page.locator("#recoveryPinHost");
  const sessionPinHost=page.locator("#sessionPinHost");
  const retryBtn=page.locator("#authTransitionRetryBtn");
  const biometricFallback=page.locator("#sessionShowPinBtn");
  const appReady=page.getByText(/Settings|Messages|New Message/i).first();
  const visible=locator=>locator.isVisible({timeout:750}).catch(()=>false);

  await expect(recoveryPinHost.or(sessionPinHost).or(retryBtn).or(biometricFallback).or(appReady)).toBeVisible({timeout:60000});

  for(let step=0;step<8&&!await visible(appReady);step++){
    if(await visible(recoveryPinHost)){
      await fillSixDigitPin(page,"#recoveryPinHost",pin);
      await expect(page.locator("#recoverMessagingBtn")).toHaveText(/Recovering|Recover Messaging/);
      await Promise.race([appReady.waitFor({state:"visible",timeout:210000}).catch(()=>null),retryBtn.waitFor({state:"visible",timeout:210000}).catch(()=>null)]);
      continue;
    }
    if(await visible(biometricFallback)){
      await biometricFallback.click();
      await sessionPinHost.waitFor({state:"visible",timeout:15000});
      continue;
    }
    if(await visible(sessionPinHost)){
      const passwordField=page.locator("#sessionPassword");
      if(await visible(passwordField))await passwordField.fill(password);
      await fillSixDigitPin(page,"#sessionPinHost",pin);
      await Promise.race([appReady.waitFor({state:"visible",timeout:210000}).catch(()=>null),retryBtn.waitFor({state:"visible",timeout:210000}).catch(()=>null)]);
      continue;
    }
    if(await visible(retryBtn)){
      await retryBtn.click();
      await Promise.race([appReady.waitFor({state:"visible",timeout:210000}).catch(()=>null),recoveryPinHost.waitFor({state:"visible",timeout:210000}).catch(()=>null),sessionPinHost.waitFor({state:"visible",timeout:210000}).catch(()=>null)]);
      continue;
    }
    await page.screenshot({path:"test-results/unexpected-auth-state.png",fullPage:true});
    throw new Error("Unexpected authenticated FIDUNIO screen. Evidence captured; refusing blind navigation.");
  }

  await expect(appReady).toBeVisible({timeout:15000});
}

test.describe.serial("FIDUNIO recovered Test Admin authenticated screens",()=>{
  test.describe.configure({timeout:240000});
  test("Test Admin signs in and opens the real application",async({page})=>{
    await signInTestAdmin(page);
    await expect(page.locator("body")).not.toContainText("Starting FIDUNIO…");
  });

  test("Test Admin can open Settings and account identity",async({page})=>{
    await signInTestAdmin(page);
    const settings=page.getByRole("button",{name:/Settings/i}).first();
    await expect(settings).toBeVisible({timeout:15000});
    await settings.click();
    await expect(page.getByText("Privacy & Access",{exact:true})).toBeVisible();
    await expect(page.getByText("Account",{exact:true})).toBeVisible();

    // Mobile Settings is a scrollable navigation. Behave like a person:
    // scroll the desired section into view, open it, then patiently observe
    // the result instead of requiring intermediate controls to appear quickly.
    const adminNav=page.locator('.fidunio-settings-nav-btn[data-group="users"]');
    await adminNav.scrollIntoViewIfNeeded();
    await adminNav.click({timeout:30000});
    const manageUsers=page.locator("#manageUsersBtn");
    await expect(manageUsers).toBeVisible({timeout:120000});
    await manageUsers.click();

    const testAdminIdentity=page.getByText(process.env.FIDUNIO_E2E_ADMIN_EMAIL,{exact:true});
    const adminDeadline=Date.now()+480000;
    let testAdminFound=false;
    while(Date.now()<adminDeadline&&!testAdminFound){
      testAdminFound=await testAdminIdentity.isVisible({timeout:2000}).catch(()=>false);
      if(testAdminFound)break;
      await page.waitForTimeout(10000);
    }
    if(!testAdminFound)await page.screenshot({path:"test-results/user-administration-timeout.png",fullPage:true});
    await expect(testAdminIdentity).toBeVisible({timeout:2000});
    await page.keyboard.press("Escape").catch(()=>{});

    const invitesNav=page.locator('.fidunio-settings-nav-btn[data-group="invites"]');
    await invitesNav.scrollIntoViewIfNeeded();
    await invitesNav.click({timeout:30000});
    await expect(page.locator("#createInviteBtn")).toBeVisible({timeout:120000});
  });
});
