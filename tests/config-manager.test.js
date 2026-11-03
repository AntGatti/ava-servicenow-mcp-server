/**
 * Tests for ConfigManager.
 *
 * Exercises the real src/config-manager.js module, which had 0% coverage.
 * Instances are loaded from a temp JSON file by overriding configPath, so no
 * real credentials are touched.
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ConfigManager } from '../src/config-manager.js';

const INSTANCES = [
  { name: 'dev', url: 'https://dev.service-now.com', username: 'du', password: 'dp', description: 'Development' },
  { name: 'prod', url: 'https://prod.service-now.com', username: 'pu', password: 'pp', default: true }
];

describe('ConfigManager', () => {
  let tmpDir;
  let envBackup;

  /** A manager reading from a temp config file containing `instances`. */
  const managerWithConfig = (instances) => {
    const file = path.join(tmpDir, `instances-${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(file, JSON.stringify({ instances }));
    const manager = new ConfigManager();
    manager.configPath = file;
    return manager;
  };

  /** A manager pointed at a path that does not exist, forcing the .env fallback. */
  const managerWithoutConfig = () => {
    const manager = new ConfigManager();
    manager.configPath = path.join(tmpDir, 'does-not-exist.json');
    return manager;
  };

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'avanade-mcp-config-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    envBackup = { ...process.env };
    delete process.env.SERVICENOW_INSTANCE_URL;
    delete process.env.SERVICENOW_USERNAME;
    delete process.env.SERVICENOW_PASSWORD;
    delete process.env.SERVICENOW_INSTANCE_NAME;
    delete process.env.SERVICENOW_INSTANCE;
  });

  afterEach(() => {
    process.env = envBackup;
  });

  describe('loading from the config file', () => {
    it('loads the instances array', () => {
      const manager = managerWithConfig(INSTANCES);
      expect(manager.loadInstances()).toHaveLength(2);
    });

    it('caches after the first read', () => {
      const manager = managerWithConfig(INSTANCES);
      expect(manager.loadInstances()).toBe(manager.loadInstances());
    });

    it('throws a descriptive error on malformed JSON', () => {
      const file = path.join(tmpDir, 'broken.json');
      fs.writeFileSync(file, '{ not json');
      const manager = new ConfigManager();
      manager.configPath = file;

      expect(() => manager.loadInstances()).toThrow(/Failed to load ServiceNow instances config/);
    });
  });

  describe('.env fallback when no config file exists', () => {
    it('builds a single default instance from environment variables', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://env.service-now.com';
      process.env.SERVICENOW_USERNAME = 'envuser';
      process.env.SERVICENOW_PASSWORD = 'envpass';
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const instances = managerWithoutConfig().loadInstances();

      expect(instances).toHaveLength(1);
      expect(instances[0]).toMatchObject({
        name: 'default',
        url: 'https://env.service-now.com',
        username: 'envuser',
        default: true
      });

      warn.mockRestore();
    });

    it('honours SERVICENOW_INSTANCE_NAME for the fallback instance name', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://env.service-now.com';
      process.env.SERVICENOW_USERNAME = 'u';
      process.env.SERVICENOW_PASSWORD = 'p';
      process.env.SERVICENOW_INSTANCE_NAME = 'acme';
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(managerWithoutConfig().loadInstances()[0].name).toBe('acme');

      warn.mockRestore();
    });

    it('throws when the environment is incomplete', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://env.service-now.com';
      // username and password deliberately absent
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => managerWithoutConfig().loadInstances()).toThrow(/Missing ServiceNow credentials/);

      warn.mockRestore();
    });
  });

  describe('instance lookup', () => {
    it('finds an instance by name', () => {
      expect(managerWithConfig(INSTANCES).getInstance('dev').url).toBe('https://dev.service-now.com');
    });

    it('lists the available names in the error for an unknown instance', () => {
      expect(() => managerWithConfig(INSTANCES).getInstance('staging'))
        .toThrow(/Instance 'staging' not found.*dev, prod/);
    });

    it('returns the instance flagged as default', () => {
      expect(managerWithConfig(INSTANCES).getDefaultInstance().name).toBe('prod');
    });

    it('falls back to the first instance when none is flagged default', () => {
      const undefaulted = INSTANCES.map(({ default: _ignored, ...rest }) => rest);
      expect(managerWithConfig(undefaulted).getDefaultInstance().name).toBe('dev');
    });
  });

  describe('getInstanceOrDefault', () => {
    it('prefers an explicitly requested name', () => {
      expect(managerWithConfig(INSTANCES).getInstanceOrDefault('dev').name).toBe('dev');
    });

    it('falls back to SERVICENOW_INSTANCE when no name is given', () => {
      process.env.SERVICENOW_INSTANCE = 'dev';
      expect(managerWithConfig(INSTANCES).getInstanceOrDefault().name).toBe('dev');
    });

    it('prefers the explicit name over SERVICENOW_INSTANCE', () => {
      process.env.SERVICENOW_INSTANCE = 'dev';
      expect(managerWithConfig(INSTANCES).getInstanceOrDefault('prod').name).toBe('prod');
    });

    it('falls back to the default instance when nothing is specified', () => {
      expect(managerWithConfig(INSTANCES).getInstanceOrDefault().name).toBe('prod');
    });

    it('returns an equal but freshly looked-up instance on each call', () => {
      // Each session calls this to build its own client; the returned config
      // must describe the same instance every time.
      const manager = managerWithConfig(INSTANCES);
      expect(manager.getInstanceOrDefault()).toEqual(manager.getInstanceOrDefault());
    });
  });

  describe('listInstances', () => {
    it('exposes name, url, default and description', () => {
      expect(managerWithConfig(INSTANCES).listInstances()).toEqual([
        { name: 'dev', url: 'https://dev.service-now.com', default: false, description: 'Development' },
        { name: 'prod', url: 'https://prod.service-now.com', default: true, description: '' }
      ]);
    });

    it('does not expose credentials', () => {
      const listed = managerWithConfig(INSTANCES).listInstances();
      for (const entry of listed) {
        expect(entry).not.toHaveProperty('username');
        expect(entry).not.toHaveProperty('password');
      }
    });
  });

  describe('validateInstance', () => {
    it('accepts a complete instance', () => {
      expect(managerWithConfig(INSTANCES).validateInstance(INSTANCES[0])).toBe(true);
    });

    it.each(['name', 'url', 'username', 'password'])('rejects an instance missing %s', (field) => {
      const incomplete = { ...INSTANCES[0] };
      delete incomplete[field];

      expect(() => managerWithConfig(INSTANCES).validateInstance(incomplete))
        .toThrow(new RegExp(`missing required field: ${field}`));
    });
  });
});
