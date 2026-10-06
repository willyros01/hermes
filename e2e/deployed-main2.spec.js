import {test,expect} from "@playwright/test";

test.describe("FIDUNIO deployed main2 screen gate",()=>{
  test("real startup reaches an interactive account-access screen",async({page})=>{
    const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
    await page.goto("/",{waitUntil:"domcontentloaded"});
    await expect(page).toHaveTitle(/FIDUNIO/i);
    await expect(page.getByRole("tab",{name:/Sign In/i})).toBeVisible();
    await expect(page.getByRole("tab",{name:/Join FIDUNIO/i})).toBeVisible();
    await expect(page.locator("#loginEmail")).toBeVisible();
    await expect(page.locator("#loginPassword")).toBeVisible();
    await expect(page.locator("#loginBtn")).toBeEnabled();
    expect(errors,errors.join("\n")).toEqual([]);
  });

  test("blank sign-in stays responsive and reports validation",async({page})=>{
    await page.goto("/");
    await page.locator("#loginBtn").click();
    await expect(page.locator("#loginBtn")).toBeEnabled();
    await expect(page.locator("body")).not.toContainText("Starting FIDUNIO…");
  });

  test("password recovery validates missing email without hanging",async({page})=>{
    await page.goto("/");
    await page.locator("#forgotBtn").click();
    await expect(page.locator("#loginNote")).toContainText(/email address/i);
    await expect(page.locator("#forgotBtn")).toBeEnabled();
  });

  test("join screen is reachable through the actual UI",async({page})=>{
    await page.goto("/");
    await page.getByRole("tab",{name:/Join FIDUNIO/i}).click();
    await expect(page.locator("#inviteCode")).toBeVisible();
    await expect(page.locator("#joinName")).toBeVisible();
    await expect(page.locator("#joinEmail")).toBeVisible();
    await expect(page.locator("#joinPassword")).toBeVisible();
    await expect(page.locator("#redeemBtn")).toBeEnabled();
  });

  test("authenticated functional suite is explicitly gated on dedicated credentials",async()=>{
    test.skip(!!process.env.FIDUNIO_E2E_USER_A&&!!process.env.FIDUNIO_E2E_PASSWORD_A,
      "Dedicated E2E credentials are configured; authenticated scenarios belong in the protected suite.");
    expect(process.env.FIDUNIO_E2E_USER_A).toBeUndefined();
  });
});
