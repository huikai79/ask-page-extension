'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const expected = [
  ['lib/marked.min.js', 'marked v15.0.12'],
  ['lib/purify.min.js', 'DOMPurify 3.0.2'],
  ['lib/highlight.min.js', 'Highlight.js v11.11.1'],
  ['lib/katex/katex.min.css', 'content:"0.18.1"']
];

for (const [file, marker] of expected) {
  assert.ok(
    read(file).includes(marker),
    `${file} no longer contains expected version marker: ${marker}`
  );
}

console.log('vendor-versions.test.js passed');
