import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync("app.js","utf8");
const css=readFileSync("styles.css","utf8");

assert.match(app,/attachment-media-open/);
assert.match(app,/type:"attachmentMedia"/);
assert.match(app,/attachment-media-viewer/);
assert.match(app,/attachment-media-full/);
assert.match(app,/View larger/);
assert.match(app,/event\.preventDefault\(\);event\.stopPropagation\(\)/);

assert.match(css,/\.attachment-media-backdrop/);
assert.match(css,/\.attachment-media-viewer/);
assert.match(css,/\.attachment-media-full/);
assert.match(css,/max-width:100%/);
assert.match(css,/max-height:100%/);

console.log("PASS: photo and video attachments can open in the shared large media viewer");
