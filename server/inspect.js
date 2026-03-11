#!/usr/bin/env node
// Usage:
//   node inspect.js                  — list all .bin files with summary
//   node inspect.js <file|docname>   — print full contents of one doc

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const Y = require('yjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

function loadDoc(filePath) {
  const data = fs.readFileSync(filePath);
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, data);
  return ydoc;
}

function printDoc(docName, filePath) {
  const stat = fs.statSync(filePath);
  const ydoc = loadDoc(filePath);

  // Try to read as a list index (Y.Map of lists)
  const yLists = ydoc.getMap('lists');
  if (yLists.size > 0) {
    console.log(`\n📋 Index doc: ${docName} (${stat.size} bytes, modified ${stat.mtime.toLocaleString()})`);
    yLists.forEach((val, uuid) => {
      const date = new Date(val.createdAt).toLocaleString();
      console.log(`  • [${uuid}] "${val.name}" — created ${date}`);
    });
    return;
  }

  // Try to read as a shopping list (Y.Array of items)
  const yItems = ydoc.getArray('items');
  if (yItems.length > 0) {
    const items = yItems.toArray().map((m) => ({
      text: m.get('text'),
      checked: m.get('checked'),
    }));
    const unchecked = items.filter((i) => !i.checked);
    const checked = items.filter((i) => i.checked);
    console.log(`\n🛒 List: ${docName} (${stat.size} bytes, modified ${stat.mtime.toLocaleString()})`);
    unchecked.forEach((i) => console.log(`  ☐ ${i.text}`));
    checked.forEach((i) => console.log(`  ✓ ${i.text}`));
    return;
  }

  console.log(`\n○ Empty doc: ${docName} (${stat.size} bytes)`);
}

function run() {
  const arg = process.argv[2];

  if (!arg) {
    // List all .bin files
    let files;
    try {
      files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.bin'));
    } catch {
      console.log('No data directory found.');
      process.exit(0);
    }
    if (files.length === 0) {
      console.log('No .bin files found in data/');
      process.exit(0);
    }
    for (const file of files.sort()) {
      const docName = file.replace(/\.bin$/, '');
      printDoc(docName, path.join(DATA_DIR, file));
    }
    return;
  }

  // Single doc — accept either a filename or a doc name
  let filePath = arg;
  if (!arg.endsWith('.bin')) filePath = path.join(DATA_DIR, arg + '.bin');
  if (!path.isAbsolute(filePath)) filePath = path.join(DATA_DIR, path.basename(filePath));

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const docName = path.basename(filePath, '.bin');
  printDoc(docName, filePath);
}

run();
