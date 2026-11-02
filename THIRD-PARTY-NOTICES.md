# Third-Party Notices

Avanade ServiceNow MCP Server incorporates material from the third-party
components listed below. Each component remains subject to its own licence.
These notices are retained to satisfy the attribution requirements of those
licences and must not be removed.

---

## 1. Upstream derived work

Portions of this Software are derived from the open source project
`mcp-servicenow-nodejs` by Happy Technologies LLC, which was made available
under the MIT License. Avanade's modifications, additions and the Avanade
branding, packaging, security controls and documentation are proprietary to
Avanade Inc. and are licensed under the terms in [LICENSE](LICENSE).

The MIT License requires that the copyright notice and permission notice be
retained in all copies or substantial portions of the original work. That
notice is reproduced below.

> **Note:** the upstream repository did not distribute a `LICENSE` file. The
> text below is the standard MIT License text, which the upstream source file
> headers identified as the governing licence, with the copyright holder named
> as stated in those headers.

```
MIT License

Copyright (c) 2025 Happy Technologies LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. Runtime dependencies

Direct runtime dependencies and their licences:

| Package | Version | Licence |
|---|---|---|
| `@modelcontextprotocol/sdk` | 1.26.0 | MIT |
| `axios` | 1.13.5 | MIT |
| `chokidar` | 4.0.3 | MIT |
| `dotenv` | 16.6.1 | BSD-2-Clause |
| `express` | 4.22.1 | MIT |
| `zod` | 3.25.76 | MIT |

Transitive dependencies and their licence texts are resolved at install time
into `node_modules/`. Generate a full attribution report for a release build
with a licence-reporting tool as part of the release pipeline.

---

## 3. Protocol specification

This Software implements the Model Context Protocol (MCP), an open
specification. Protocol identifiers, method names and schema field names are
defined by that specification and are used here for interoperability.
