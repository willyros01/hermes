import {defineConfig,devices} from "@playwright/test";

const baseURL=process.env.FIDUNIO_E2E_BASE_URL||"https://fidunio-main2.vercel.app";

export default defineConfig({
  testDir:"./e2e",
  timeout:45_000,
  expect:{timeout:10_000},
  fullyParallel:false,
  retries:1,
  reporter:[["list"],["html",{outputFolder:"playwright-report",open:"never"}]],
  outputDir:"test-results",
  use:{baseURL,trace:"retain-on-failure",screenshot:"only-on-failure",video:"retain-on-failure"},
  projects:[
    {name:"desktop-web",use:{...devices["Desktop Chrome"]}},
    {name:"ipad-webkit",use:{...devices["iPad Pro 11"]}}
  ]
});
