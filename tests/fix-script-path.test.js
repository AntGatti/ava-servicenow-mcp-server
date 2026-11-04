/**
 * Tests for SN-Create-Fix-Script file-path handling.
 *
 * Unlike the other suites, this one drives the real MCP server over an in-memory
 * transport rather than a mock client. The finding being covered is that
 * `script_name` reaches `path.join` and so decides where a file is written; only
 * the real handler can prove that is closed.
 *
 * The handler resolves its output directory from process.cwd(), so each test
 * runs with cwd pointed at a throwaway directory and asserts on what did and did
 * not appear on disk.
 */

import { jest } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp-server-consolidated.js';
import { createMockServiceNowClient } from './helpers/mocks.js';

describe('SN-Create-Fix-Script path handling', () => {
  let sandbox;
  let originalCwd;
  let client;
  let scriptsDir;

  const callTool = (args) =>
    client.callTool({ name: 'SN-Create-Fix-Script', arguments: args });

  const filesWritten = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);

  beforeEach(async () => {
    originalCwd = process.cwd();
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'fix-script-'));
    process.chdir(sandbox);
    scriptsDir = path.join(fs.realpathSync(sandbox), 'scripts');

    const server = await createMcpServer(createMockServiceNowClient());
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  });

  afterEach(async () => {
    await client.close();
    process.chdir(originalCwd);
    fs.rmSync(sandbox, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  describe('legitimate names', () => {
    it('writes the script into the scripts directory', async () => {
      const result = await callTool({
        script_name: 'link_ui_policy_actions',
        script_content: 'gs.info("hello");'
      });

      expect(result.isError).toBeFalsy();
      const written = filesWritten(scriptsDir);
      expect(written).toHaveLength(1);
      expect(written[0]).toMatch(/^link_ui_policy_actions_.*\.js$/);
      expect(fs.readFileSync(path.join(scriptsDir, written[0]), 'utf8')).toContain('gs.info("hello");');
    });

    it('keeps dots, hyphens and underscores', async () => {
      await callTool({ script_name: 'fix-set.update_v2', script_content: '// x' });
      expect(filesWritten(scriptsDir)[0]).toMatch(/^fix-set\.update_v2_/);
    });
  });

  describe('path traversal', () => {
    // The original defect: path.join(scriptsDir, '../../../evil_<ts>.js') resolves
    // outside scriptsDir, so the tool wrote wherever the caller pointed it.
    it.each([
      ['../escape', 'parent directory'],
      ['../../../../tmp/evil', 'deep traversal'],
      ['..\\..\\windows_style', 'backslash traversal'],
      ['/etc/cron.d/rooted', 'absolute path'],
      ['sub/dir/nested', 'subdirectory']
    ])('contains %s (%s)', async (scriptName) => {
      const result = await callTool({ script_name: scriptName, script_content: '// payload' });

      // Either it is rejected, or it is reduced to a safe name - never written
      // outside the scripts directory.
      //
      // The invariant asserted here is containment, not the spelling of the name.
      // An earlier version banned ".." as a substring, which is a proxy rather
      // than the property: a file literally named ".._.._x.js" sits harmlessly in
      // one directory, and that assertion passed on Windows and failed on Linux
      // purely because path.basename() treats "\" as a separator on only one of
      // them. What matters is that nothing escapes scriptsDir.
      if (!result.isError) {
        const written = filesWritten(scriptsDir);
        expect(written).toHaveLength(1);
        expect(path.dirname(path.resolve(scriptsDir, written[0]))).toBe(scriptsDir);
        expect(written[0]).not.toContain('/');
        expect(written[0]).not.toContain('\\');
      }

      // Nothing may appear anywhere above the scripts directory.
      expect(filesWritten(path.dirname(scriptsDir)).filter((f) => f !== 'scripts')).toEqual([]);
    });

    // Locks in the separator normalisation. Without it this reduced to
    // "windows_style" on Windows and ".._.._windows_style" on Linux - both safe,
    // but the same input must not produce different files on different hosts.
    it.each([
      ['..\\..\\windows_style', 'windows_style'],
      ['../../posix_style', 'posix_style'],
      ['C:\\temp\\mixed/style', 'style']
    ])('reduces %s to %s on every platform', async (scriptName, expected) => {
      const result = await callTool({ script_name: scriptName, script_content: '// payload' });

      expect(result.isError).toBeFalsy();
      const written = filesWritten(scriptsDir);
      expect(written).toHaveLength(1);
      expect(written[0]).toMatch(new RegExp(`^${expected}_.*\\.js$`));
    });

    it('refuses a name that sanitises down to nothing usable', async () => {
      const result = await callTool({ script_name: '..', script_content: '// payload' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toMatch(/Invalid script_name/);
      expect(filesWritten(scriptsDir)).toEqual([]);
    });

    it('does not let a traversal name reach the generated header', async () => {
      const result = await callTool({
        script_name: '../../escape',
        script_content: '// payload'
      });

      if (!result.isError) {
        const written = filesWritten(scriptsDir);
        const content = fs.readFileSync(path.join(scriptsDir, written[0]), 'utf8');
        expect(content).not.toContain('../../escape');
      }
    });
  });

  describe('comment injection', () => {
    it('neutralises a comment terminator in the description', async () => {
      await callTool({
        script_name: 'ok_name',
        script_content: '// body',
        description: 'closes early */ gs.print("injected");'
      });

      const written = filesWritten(scriptsDir);
      const content = fs.readFileSync(path.join(scriptsDir, written[0]), 'utf8');

      // The description may still appear, but only inside the header comment.
      // What must not happen is it closing the comment and landing in executable
      // position, so nothing after the header's terminator may carry the payload.
      const body = content.slice(content.indexOf('*/') + 2);
      expect(body).not.toContain('gs.print("injected");');
      expect(body.trim()).toContain('// body');
    });
  });
});
