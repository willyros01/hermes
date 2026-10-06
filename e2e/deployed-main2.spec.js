import {test,expect} from "@playwright/test";

async function reachAccountAccess(page){
  await reachAccountAccess(page);
  const terms=page.getByText("Terms of Use",{exact:true});
  if(await terms.isVisible().catch(()=>false)){
    const box=page.locator('input[type="checkbox"]').first();
    await box.check();
    await page.getByRole("button",{name:"Accept",exact:true}).click();
  }
  await expect(page.getByRole("tab",{name:/Sign In/i})).toBeVisible();
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
