# FIDUNIO documentation source

Updated 28 November 2026 for 1.1.88. This directory is documentation tooling only. It must never be packaged as application runtime or used to mutate live Firebase.

## Build

Run `python3 build-guides.py` in this directory. Dependencies are ReportLab, Pillow and DejaVu Sans fonts. It produces static HTML, SVG diagrams, PDFs and a Markdown guide under `site/`. Screenshots in `screens/` are inputs; no account or service is contacted by the builder.

Publish the `site/fidunio/` guide/assets output and `site/guides/fidunio/` current PDFs to the existing Cuberoot repository. Do not overwrite `fidunio/privacy`, `support`, `terms`, `join`, APK artifacts or other app guides. Update only the FIDUNIO entries in `guides/index.json`. Historical PDFs remain labelled archived. The generated `site/program` reference belongs in Hermes `docs/`, not the Cuberoot public user-document index. Existing encrypted vault access is unchanged.

## Illustration provenance

Real simulator screenshots with fictional accounts, captured 27 November 2026. Source repository `willyros01/hermes`, immutable `probe-evidence` snapshot `9d9d0950ffdad9a15e352b055ab60a9371a01a5a`:

| Local file | Source path |
|---|---|
| `screens/help-settings.png` | `ios-fix/12-help-settings-saved.png` |
| `screens/help-hold.png` | `ios-fix/15-help-quick-tap.png` |
| `screens/help-sent.png` | `ios-fix/17-help-sent.png` |
| `screens/help-coming.png` | `ios-fix/19-help-coming.png` |
| `screens/help-incoming.png` | `ios-fix/21-help-incoming.png` |
| `screens/help-reminder.png` | `ios-fix/25-help-reminder.png` |

Screenshots were not altered. Profile names are simulator fixtures. SVG diagrams are labelled explanations, not app screenshots. Pictures illustrate the HELP interface and do not certify delivery or device acceptance. Preserve failed rows in the accompanying evidence reports.

Source verification: `main` version 1.1.88 at `8fbd148ceb296297fdc995e374263e4319a09b36`; program documentation lists native release revisions. Recheck version and source before refreshing. No plaintext user data, credentials, PINs, keys, real locations or recovery secrets belong in these sources.

## Verification

Check links, image loading, phone/tablet widths, dark mode, keyboard focus and large text. Render each PDF and inspect for clipping, overlap, tiny illustrations and missing glyphs. Record browser-tool limitations honestly. Validate publication against the exact committed bytes. Documentation commits do not bump version.js or service-worker shell revision, and must not trigger TestFlight/APK builds.
