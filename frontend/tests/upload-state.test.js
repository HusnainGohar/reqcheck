const assert = require('assert');
const { validateUpload, showEmptyDocuments } = require('../.test-build/uploadState');

assert.strictEqual(showEmptyDocuments(true, 0, false, false), true);
assert.strictEqual(showEmptyDocuments(true, 0, true, false), false, 'Selected file must replace empty state');
assert.strictEqual(showEmptyDocuments(true, 1, false, false), false, 'Saved document must replace empty state');
assert.strictEqual(showEmptyDocuments(true, 0, false, true), false, 'Loading must not appear empty');
assert.strictEqual(showEmptyDocuments(false, 0, false, false), false);
assert.strictEqual(validateUpload({ name: 'requirements.TXT', size: 10 }), null);
assert.strictEqual(validateUpload({ name: 'requirements.pdf', size: 10 * 1024 * 1024 }), null);
assert.match(validateUpload({ name: 'requirements.pdf', size: 10 * 1024 * 1024 + 1 }), /larger than/);
assert.match(validateUpload({ name: 'requirements.docx', size: 0 }), /empty/);
assert.match(validateUpload({ name: 'requirements.exe', size: 100 }), /not supported/);
console.log('10 upload-state assertions passed.');
