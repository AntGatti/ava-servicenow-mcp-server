/**
 * Avanade ServiceNow MCP Server - Jest configuration
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * The project is native ESM ("type": "module"), so Jest runs the test files
 * unmodified through Node's ESM loader. Run via the npm scripts, which set
 * NODE_OPTIONS=--experimental-vm-modules - Jest's ESM support requires it.
 */

export default {
  testEnvironment: 'node',

  // Native ESM: no transform step.
  //
  // There is deliberately no moduleNameMapper stripping ".js" from relative
  // imports here. That mapping is a CommonJS/TypeScript idiom and breaks
  // native ESM, where relative specifiers must keep their file extension.
  transform: {},

  testMatch: ['**/tests/**/*.test.js'],

  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/stdio-server.js',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },

  verbose: true,
  testTimeout: 10000,
};
