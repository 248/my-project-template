const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { test, mock } = require('node:test');

const registryPath = path.resolve('contracts/messages/registry.yaml');

function loadGenerate() {
  delete require.cache[require.resolve('../generate')];
  return require('../generate');
}

test('verifyRegistry succeeds with existing registry', () => {
  const { verifyRegistry } = loadGenerate();
  const registry = verifyRegistry();
  assert.ok(registry.metadata);
  assert.ok(registry.messages);
});

test('verifyRegistry throws when registry is missing', (t) => {
  const { verifyRegistry } = loadGenerate();
  const originalExists = fs.existsSync;
  mock.method(fs, 'existsSync', (p) => {
    if (p === registryPath) return false;
    return originalExists(p);
  });
  t.after(() => mock.restoreAll());
  assert.throws(() => verifyRegistry(), /Registry file not found/);
});

test('generateAll completes without error', async (t) => {
  const genTsPath = require.resolve(path.resolve(__dirname, '../generate-typescript'));
  const genGoPath = require.resolve(path.resolve(__dirname, '../generate-go'));
  const upApiPath = require.resolve(path.resolve(__dirname, '../update-openapi'));
  require.cache[genTsPath] = { exports: { generateTypeScript: mock.fn() } };
  require.cache[genGoPath] = { exports: { generateGo: mock.fn() } };
  require.cache[upApiPath] = { exports: { updateOpenApi: mock.fn() } };
  const { generateAll } = loadGenerate();
  t.after(() => {
    delete require.cache[genTsPath];
    delete require.cache[genGoPath];
    delete require.cache[upApiPath];
  });
  await generateAll();
  const genTs = require(genTsPath);
  const genGo = require(genGoPath);
  const upApi = require(upApiPath);
  assert.strictEqual(genTs.generateTypeScript.mock.calls.length, 1);
  assert.strictEqual(genGo.generateGo.mock.calls.length, 0);
  assert.strictEqual(upApi.updateOpenApi.mock.calls.length, 1);
});

test('generateAll exits with code 1 when registry missing', async (t) => {
  const originalExists = fs.existsSync;
  mock.method(fs, 'existsSync', (p) => {
    if (p === registryPath) return false;
    return originalExists(p);
  });
  const genTsPath = require.resolve(path.resolve(__dirname, '../generate-typescript'));
  const genGoPath = require.resolve(path.resolve(__dirname, '../generate-go'));
  const upApiPath = require.resolve(path.resolve(__dirname, '../update-openapi'));
  require.cache[genTsPath] = { exports: { generateTypeScript: mock.fn() } };
  require.cache[genGoPath] = { exports: { generateGo: mock.fn() } };
  require.cache[upApiPath] = { exports: { updateOpenApi: mock.fn() } };
  const exitMock = mock.method(process, 'exit', () => {});
  const { generateAll } = loadGenerate();
  t.after(() => {
    delete require.cache[genTsPath];
    delete require.cache[genGoPath];
    delete require.cache[upApiPath];
    mock.restoreAll();
  });
  await generateAll();
  assert.deepStrictEqual(exitMock.mock.calls[0].arguments, [1]);
});
