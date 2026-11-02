/**
 * Tests for ServiceNowClient.
 *
 * Exercises the real src/servicenow-client.js module, which had 0% coverage.
 * No network: a real client is constructed (axios.create does not connect),
 * then its internal axios instance is replaced with a stub so request shaping
 * and response unwrapping can be asserted directly.
 *
 * The instance-targeting tests matter beyond coverage - setInstance() is the
 * mutation that made a shared client leak between sessions.
 */

import { jest } from '@jest/globals';
import { ServiceNowClient } from '../src/servicenow-client.js';

const URL = 'https://dev123.service-now.com';

/** Replace the client's axios instance with a recording stub. */
function stubTransport(client, responses = {}) {
  const calls = [];
  const record = (method) => jest.fn(async (url, data) => {
    calls.push({ method, url, data });
    const canned = responses[method];
    if (canned instanceof Error) throw canned;
    return canned ?? { data: { result: {} } };
  });

  client.client = {
    get: record('get'),
    post: record('post'),
    put: record('put'),
    delete: record('delete')
  };

  return calls;
}

describe('ServiceNowClient', () => {
  describe('construction and instance targeting', () => {
    it('builds a basic auth header from the credentials', () => {
      const client = new ServiceNowClient(URL, 'alice', 's3cret');

      expect(client.auth).toBe(Buffer.from('alice:s3cret').toString('base64'));
      expect(client.client.defaults.headers.Authorization).toBe(`Basic ${client.auth}`);
    });

    it('strips a trailing slash from the instance URL', () => {
      const client = new ServiceNowClient(`${URL}/`, 'u', 'p');

      expect(client.instanceUrl).toBe(URL);
      expect(client.client.defaults.baseURL).toBe(URL);
    });

    it('defaults the instance name', () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      expect(client.currentInstanceName).toBe('default');
    });

    it('reports the current instance', () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      client.currentInstanceName = 'dev';

      expect(client.getCurrentInstance()).toEqual({ name: 'dev', url: URL });
    });

    it('retargets credentials, URL and name on setInstance', () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const prodUrl = 'https://prod456.service-now.com';

      client.setInstance(prodUrl, 'prod-user', 'prod-pass', 'prod');

      expect(client.instanceUrl).toBe(prodUrl);
      expect(client.auth).toBe(Buffer.from('prod-user:prod-pass').toString('base64'));
      expect(client.currentInstanceName).toBe('prod');
      expect(client.client.defaults.baseURL).toBe(prodUrl);
    });

    it('leaves the instance name alone when setInstance omits it', () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      client.currentInstanceName = 'dev';

      client.setInstance('https://other.service-now.com', 'u2', 'p2');

      expect(client.currentInstanceName).toBe('dev');
    });

    it('gives separate clients independent instance state', () => {
      // The regression that motivated per-session clients: retargeting one
      // client must not affect another.
      const a = new ServiceNowClient(URL, 'u', 'p');
      const b = new ServiceNowClient(URL, 'u', 'p');
      a.currentInstanceName = 'dev';
      b.currentInstanceName = 'dev';

      a.setInstance('https://prod456.service-now.com', 'pu', 'pp', 'prod');

      expect(a.getCurrentInstance()).toEqual({ name: 'prod', url: 'https://prod456.service-now.com' });
      expect(b.getCurrentInstance()).toEqual({ name: 'dev', url: URL });
    });
  });

  describe('progress notifications', () => {
    it('forwards messages to a registered callback', () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const callback = jest.fn();

      client.setProgressCallback(callback);
      client.notifyProgress('halfway');

      expect(callback).toHaveBeenCalledWith('halfway');
    });

    it('is a no-op when no callback is registered', () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      expect(() => client.notifyProgress('ignored')).not.toThrow();
    });
  });

  describe('getRecords', () => {
    it('unwraps the result array', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      stubTransport(client, { get: { data: { result: [{ number: 'INC001' }] } } });

      await expect(client.getRecords('incident')).resolves.toEqual([{ number: 'INC001' }]);
    });

    it('passes query, limit and fields through as sysparm params', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const calls = stubTransport(client, { get: { data: { result: [] } } });

      await client.getRecords('incident', {
        sysparm_query: 'active=true',
        sysparm_limit: 10,
        sysparm_fields: 'number,state'
      });

      expect(calls[0].url).toContain('/api/now/table/incident?');
      expect(calls[0].url).toContain('sysparm_query=active%3Dtrue');
      expect(calls[0].url).toContain('sysparm_limit=10');
      expect(calls[0].url).toContain('sysparm_fields=number%2Cstate');
    });

    it('omits parameters that were not supplied', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const calls = stubTransport(client, { get: { data: { result: [] } } });

      await client.getRecords('incident');

      expect(calls[0].url).toBe('/api/now/table/incident?');
    });
  });

  describe('getRecord', () => {
    it('requests a single record by sys_id with no query string', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const calls = stubTransport(client, { get: { data: { result: { sys_id: 'abc' } } } });

      await expect(client.getRecord('incident', 'abc')).resolves.toEqual({ sys_id: 'abc' });
      expect(calls[0].url).toBe('/api/now/table/incident/abc');
    });

    it('appends display-value and field options when supplied', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const calls = stubTransport(client, { get: { data: { result: {} } } });

      await client.getRecord('incident', 'abc', {
        sysparm_fields: 'number',
        sysparm_display_value: 'true'
      });

      expect(calls[0].url).toContain('/api/now/table/incident/abc?');
      expect(calls[0].url).toContain('sysparm_fields=number');
      expect(calls[0].url).toContain('sysparm_display_value=true');
    });
  });

  describe('write operations', () => {
    it('creates a record and returns the result', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const calls = stubTransport(client, { post: { data: { result: { sys_id: 'new' } } } });

      const created = await client.createRecord('incident', { short_description: 'test' });

      expect(created).toEqual({ sys_id: 'new' });
      expect(calls[0]).toMatchObject({
        method: 'post',
        url: '/api/now/table/incident',
        data: { short_description: 'test' }
      });
    });

    it('updates a record by sys_id', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const calls = stubTransport(client, { put: { data: { result: { sys_id: 'abc' } } } });

      await client.updateRecord('incident', 'abc', { state: '2' });

      expect(calls[0]).toMatchObject({
        method: 'put',
        url: '/api/now/table/incident/abc',
        data: { state: '2' }
      });
    });

    it('deletes a record and reports success', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      const calls = stubTransport(client, { delete: { data: {} } });

      await expect(client.deleteRecord('incident', 'abc')).resolves.toEqual({ success: true });
      expect(calls[0]).toMatchObject({ method: 'delete', url: '/api/now/table/incident/abc' });
    });
  });

  describe('error propagation', () => {
    it('surfaces transport errors to the caller', async () => {
      const client = new ServiceNowClient(URL, 'u', 'p');
      stubTransport(client, { get: new Error('403 Forbidden') });

      await expect(client.getRecords('sys_dictionary')).rejects.toThrow('403 Forbidden');
    });
  });
});
