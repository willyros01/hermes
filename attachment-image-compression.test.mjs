import assert from "node:assert/strict";
import {fitPhotoDimensions,PHOTO_COMPRESSION_POLICY} from "./attachment-image-compression.js";
assert.deepEqual(fitPhotoDimensions(4032,3024),{width:1600,height:1200});
assert.deepEqual(fitPhotoDimensions(1200,800),{width:1200,height:800});
assert.deepEqual(fitPhotoDimensions(1000,4000),{width:400,height:1600});
assert.equal(PHOTO_COMPRESSION_POLICY.maxEdge,1600);
assert.ok(PHOTO_COMPRESSION_POLICY.jpegQuality>0.7&&PHOTO_COMPRESSION_POLICY.jpegQuality<0.85);
console.log("Attachment image compression policy passed");
