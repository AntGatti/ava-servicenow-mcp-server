# Tool Index

> **Generated file - do not edit by hand.**
> Produced from the live MCP server by `npm run docs:tools`
> ([scripts/generate-tool-reference.js](../../scripts/generate-tool-reference.js)).
> Edits here are overwritten on the next run; change the tool definition instead.

Server `servicenow-server` v2.0.0 advertises **45 tools**.

Every tool name on this page is frozen by the
[Frozen Contract](../06-Governance/Frozen-Contract.md). Renaming one breaks every
deployed client.

All tools accept an optional `instance` parameter to target a configured
ServiceNow instance for that call. See [Multi-Instance Routing](../05-Operations/Multi-Instance-Routing.md).

## Contents

- [Instance routing](#instance-routing) — 2 tools
- [Generic table operations](#generic-table-operations) — 8 tools
- [Incidents](#incidents) — 8 tools
- [Changes and problems](#changes-and-problems) — 7 tools
- [Users, groups and CMDB](#users-groups-and-cmdb) — 3 tools
- [Update sets and application scope](#update-sets-and-application-scope) — 8 tools
- [Workflows](#workflows) — 4 tools
- [Scripting](#scripting) — 2 tools
- [Batch operations](#batch-operations) — 2 tools
- [Natural language](#natural-language) — 1 tool

---

## Instance routing

### `SN-Set-Instance`

Switch to a different ServiceNow instance. Use this at the start of your session to target a specific instance (dev, test, prod, etc.). Lists available instances if no name provided.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `instance_name` | string | no | Name of the instance to switch to (e.g., "dev", "prod", "test"). Leave empty to list available instances. |

### `SN-Get-Current-Instance`

Get information about the currently active ServiceNow instance

_No parameters._

---

## Generic table operations

### `SN-Query-Table`

Query any ServiceNow table by name with flexible filtering

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table_name` | string | yes | ServiceNow table name (e.g., "incident", "sys_user", "cmdb_ci") (required) |
| `query` | string | no | ServiceNow encoded query string (e.g., "state=1^priority=1") (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-priority" for descending) (optional) |

### `SN-Create-Record`

Create a record in any ServiceNow table by name. WARNING: For catalog_ui_policy_action table, fields ui_policy and catalog_variable cannot be set via REST API - use SN-Execute-Background-Script with setValue() after creation.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table_name` | string | yes | ServiceNow table name (e.g., "incident", "sys_user", "cmdb_ci") (required) |
| `data` | object | yes | Record data as key-value pairs (e.g., {"short_description": "Test", "priority": 1}) (required) |

### `SN-Get-Record`

Get a specific record from any ServiceNow table by sys_id

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table_name` | string | yes | ServiceNow table name (e.g., "incident", "sys_user", "cmdb_ci") (required) |
| `sys_id` | string | yes | System ID of the record to retrieve (required) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |

### `SN-Update-Record`

Update a record in any ServiceNow table by sys_id

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table_name` | string | yes | ServiceNow table name (e.g., "incident", "sys_user", "cmdb_ci") (required) |
| `sys_id` | string | yes | System ID of the record to update (required) |
| `data` | object | yes | Record data to update as key-value pairs (e.g., {"state": 6, "resolution_notes": "Fixed"}) (required) |

### `SN-Get-Table-Schema`

Get the schema/metadata for any ServiceNow table including required fields, common fields, and field descriptions

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table_name` | string | yes | ServiceNow table name (required) |

### `SN-Discover-Table-Schema`

Deep schema introspection with ServiceNow-specific metadata including type codes, choice tables, and relationships

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table_name` | string | yes | ServiceNow table name (required) |
| `include_type_codes` | boolean | no | Show internal type codes (e.g., 1=Choice, 5=Select Box) (optional) Default: `false`. |
| `include_choice_tables` | boolean | no | Show which choice tables to use (optional) Default: `false`. |
| `include_relationships` | boolean | no | Show parent/child table relationships (optional) Default: `false`. |
| `include_ui_policies` | boolean | no | Show UI policies affecting this table (optional) Default: `false`. |
| `include_business_rules` | boolean | no | Show business rules for this table (optional) Default: `false`. |
| `include_field_constraints` | boolean | no | Show field validations and defaults (optional) Default: `false`. |

### `SN-List-Available-Tables`

List all available ServiceNow tables with their descriptions and capabilities

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | no | Filter by category: "core_itsm", "platform", "service_catalog", "cmdb", or "all" (optional) |

### `SN-Explain-Field`

Get comprehensive explanation of a specific field including type, constraints, and known issues

| Parameter | Type | Required | Description |
|---|---|---|---|
| `table` | string | yes | Table name (required) |
| `field` | string | yes | Field name (required) |
| `include_examples` | boolean | no | Include usage examples (default: true) Default: `true`. |

---

## Incidents

### `SN-List-Incidents`

List Incident records with filtering and pagination

| Parameter | Type | Required | Description |
|---|---|---|---|
| `state` | string | no | Filter by state (e.g., "New", "In Progress", "Resolved") (optional) |
| `priority` | number | no | Filter by priority (1-5) (optional) |
| `query` | string | no | ServiceNow encoded query string (e.g., "state=1^priority=1") (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-priority" for descending) (optional) |

### `SN-Create-Incident`

Create a new Incident

| Parameter | Type | Required | Description |
|---|---|---|---|
| `short_description` | string | yes | short description (required) |
| `description` | string | no | description (optional) |
| `caller_id` | string | no | caller id (optional) |
| `category` | string | no | category (optional) |
| `subcategory` | string | no | subcategory (optional) |
| `urgency` | string | no | urgency (optional) |
| `impact` | string | no | impact (optional) |
| `priority` | string | no | priority (optional) |
| `assigned_to` | string | no | assigned to (optional) |
| `assignment_group` | string | no | assignment group (optional) |
| `state` | string | no | state (optional) |
| `work_notes` | string | no | work notes (optional) |
| `sys_created_by` | string | no | sys created by (optional) |
| `sys_created_on` | string | no | sys created on (optional) |
| `sys_updated_by` | string | no | sys updated by (optional) |
| `sys_updated_on` | string | no | sys updated on (optional) |

### `SN-Get-Incident`

Get a Incident by ID

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sys_id` | string | yes | System ID |

### `SN-Assign-Incident`

Assign an incident to a user and/or group. Resolves user names automatically.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `incident_number` | string | yes | Incident number (e.g., "INC0012345") (required) |
| `assigned_to` | string | yes | User name or sys_id to assign to (required) |
| `assignment_group` | string | no | Assignment group name or sys_id (optional) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-Resolve-Incident`

Resolve an incident with resolution notes and code.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `incident_number` | string | yes | Incident number (e.g., "INC0012345") (required) |
| `resolution_notes` | string | yes | Resolution notes describing the fix (required) |
| `resolution_code` | string | no | Resolution code (e.g., "Solved (Permanently)", "Solved (Work Around)") (optional) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-Close-Incident`

Close an incident with close notes and code.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `incident_number` | string | yes | Incident number (e.g., "INC0012345") (required) |
| `close_notes` | string | yes | Close notes (required) |
| `close_code` | string | no | Close code (e.g., "Solved (Permanently)", "Solved (Work Around)") (optional) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-Add-Comment`

Add a comment to an incident. Accepts incident number for better UX.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `incident_number` | string | yes | Incident number (e.g., "INC0012345") (required) |
| `comment` | string | yes | Comment text to add (required) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-Add-Work-Notes`

Add work notes to an incident. Accepts incident number for better UX.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `incident_number` | string | yes | Incident number (e.g., "INC0012345") (required) |
| `work_notes` | string | yes | Work notes text to add (required) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

---

## Changes and problems

### `SN-List-ChangeRequests`

List Change Request records with filtering and pagination

| Parameter | Type | Required | Description |
|---|---|---|---|
| `state` | string | no | Filter by change state (optional) |
| `type` | string | no | Filter by change type (e.g., "Normal", "Emergency") (optional) |
| `query` | string | no | ServiceNow encoded query string (e.g., "state=1^priority=1") (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-priority" for descending) (optional) |

### `SN-Assign-Change`

Assign a change request to a user and/or group.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `change_number` | string | yes | Change request number (e.g., "CHG0012345") (required) |
| `assigned_to` | string | yes | User name or sys_id to assign to (required) |
| `assignment_group` | string | no | Assignment group name or sys_id (optional) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-Approve-Change`

Approve a change request.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `change_number` | string | yes | Change request number (e.g., "CHG0012345") (required) |
| `approval_comments` | string | no | Comments for the approval (optional) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-Add-Change-Comment`

Add a comment to a change request. Accepts change number for better UX.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `change_number` | string | yes | Change request number (e.g., "CHG0012345") (required) |
| `comment` | string | yes | Comment text to add (required) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-List-Problems`

List Problem records with filtering and pagination

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | no | ServiceNow encoded query string (e.g., "state=1^priority=1") (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-priority" for descending) (optional) |

### `SN-Close-Problem`

Close a problem with resolution information.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `problem_number` | string | yes | Problem number (e.g., "PRB0012345") (required) |
| `resolution_notes` | string | yes | Resolution notes (required) |
| `resolution_code` | string | no | Resolution code (optional) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

### `SN-Add-Problem-Comment`

Add a comment to a problem. Accepts problem number for better UX.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `problem_number` | string | yes | Problem number (e.g., "PRB0012345") (required) |
| `comment` | string | yes | Comment text to add (required) |
| `instance` | string | no | Instance name (optional, uses default if not specified) |

---

## Users, groups and CMDB

### `SN-List-SysUsers`

List Sys User records with filtering and pagination

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | no | ServiceNow encoded query string (e.g., "state=1^priority=1") (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-priority" for descending) (optional) |

### `SN-List-SysUserGroups`

List Sys User Group records with filtering and pagination

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | no | ServiceNow encoded query string (e.g., "state=1^priority=1") (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-priority" for descending) (optional) |

### `SN-List-CmdbCis`

List Cmdb Ci records with filtering and pagination

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | no | ServiceNow encoded query string (e.g., "state=1^priority=1") (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-priority" for descending) (optional) |

---

## Update sets and application scope

### `SN-Set-Update-Set`

Generate a fix script to set the current update set using GlideUpdateSet API. Cannot be done via REST API - creates script file for manual execution in ServiceNow UI.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `update_set_sys_id` | string | yes | System ID of the update set to make current (required) |

### `SN-Get-Current-Update-Set`

Get the currently active update set

_No parameters._

### `SN-List-Update-Sets`

List available update sets

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | no | ServiceNow encoded query string (e.g., "state=in progress") (optional) |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `offset` | number | no | Number of records to skip for pagination (optional) |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "created_on" or "-sys_created_on" for descending) (optional) |

### `SN-Move-Records-To-Update-Set`

Move sys_update_xml records to a different update set. Supports filtering by sys_ids, time range, or source update set. Extremely useful when records end up in wrong update set (e.g., "Default" instead of custom set). Reports progress during move operation.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `update_set_id` | string | yes | Target update set sys_id to move records to (required) |
| `record_sys_ids` | array | no | Array of sys_update_xml sys_ids to move (optional) |
| `time_range` | object | no | Time range to filter records (optional - format: YYYY-MM-DD HH:MM:SS) |
| `source_update_set` | string | no | Filter by source update set name (e.g., "Default") (optional) |
| `table` | string | no | Table name (default: sys_update_xml) Default: `"sys_update_xml"`. |
| `progress` | boolean | no | Report progress notifications (default: true) Default: `true`. |

### `SN-Clone-Update-Set`

Clone an entire update set with all its sys_update_xml records. Creates a complete copy for backup, testing, or branching development work. Reports progress during cloning operation.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `source_update_set_id` | string | yes | Source update set sys_id to clone (required) |
| `new_name` | string | yes | Name for the new cloned update set (required) |
| `progress` | boolean | no | Report progress notifications (default: true) Default: `true`. |

### `SN-Inspect-Update-Set`

Inspect update set contents and verify completeness

| Parameter | Type | Required | Description |
|---|---|---|---|
| `update_set` | string | yes | Update set sys_id (required) |
| `show_components` | boolean | no | Show component breakdown (default: true) Default: `true`. |
| `show_dependencies` | boolean | no | Show missing dependencies (default: false) Default: `false`. |

### `SN-Set-Current-Application`

Set the current application scope using the UI API. This changes which application is active for development and configuration changes.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `app_sys_id` | string | yes | System ID of the application to make current (required) |

### `SN-Validate-Configuration`

Validate catalog item configuration including variables, UI policies, and business rules

| Parameter | Type | Required | Description |
|---|---|---|---|
| `catalog_item` | string | yes | Catalog item sys_id (required) |
| `checks` | object | no | Validation checks to perform |

---

## Workflows

### `SN-Create-Workflow`

Create a complete ServiceNow workflow with activities, transitions, and conditions. This tool orchestrates the entire workflow creation process: base workflow → version → activities → transitions → publish. Reports progress during creation.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Workflow name (required) |
| `description` | string | no | Workflow description (optional) |
| `table` | string | yes | Table this workflow runs against (e.g., "incident", "change_request") |
| `condition` | string | no | Condition for workflow to trigger (e.g., "state=1^priority=1") (optional) |
| `activities` | array | yes | Array of activity definitions |
| `transitions` | array | no | Array of transition definitions (connects activities) |
| `publish` | boolean | no | Publish workflow after creation (default: false) Default: `false`. |
| `progress` | boolean | no | Report progress notifications (default: true) Default: `true`. |

### `SN-Create-Activity`

Create a single workflow activity with embedded JavaScript code. Use this for adding activities to existing workflows.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `workflow_version_sys_id` | string | yes | Workflow version sys_id (required) |
| `name` | string | yes | Activity name (required) |
| `script` | string | no | JavaScript code to execute in this activity (optional) |
| `activity_definition_sys_id` | string | no | Activity type sys_id (optional - defaults to generic activity) |
| `x` | number | no | X coordinate on canvas (default: 100) |
| `y` | number | no | Y coordinate on canvas (default: 100) |

### `SN-Create-Transition`

Create a transition between two workflow activities with optional condition

| Parameter | Type | Required | Description |
|---|---|---|---|
| `from_activity_sys_id` | string | yes | From activity sys_id (required) |
| `to_activity_sys_id` | string | yes | To activity sys_id (required) |
| `condition_script` | string | no | JavaScript condition for this transition (optional) |
| `order` | number | no | Transition order (default: 1) |

### `SN-Publish-Workflow`

Publish a workflow version, setting the start activity and making it active

| Parameter | Type | Required | Description |
|---|---|---|---|
| `version_sys_id` | string | yes | Workflow version sys_id (required) |
| `start_activity_sys_id` | string | yes | Starting activity sys_id (required) |

---

## Scripting

### `SN-Execute-Background-Script`

🚀 EXECUTES background scripts with THREE methods: (1) sys_trigger [DEFAULT & MOST RELIABLE] - Creates scheduled job that runs in 1 second and auto-deletes, (2) UI endpoint (sys.scripts.do) - Attempts direct execution via UI, (3) Fix script - Manual fallback. Use for: setting update sets, complex GlideRecord operations, GlideUpdateSet API calls, etc. The sys_trigger method is most reliable and works consistently!

| Parameter | Type | Required | Description |
|---|---|---|---|
| `script` | string | yes | JavaScript code to execute (required) |
| `description` | string | no | Description of what the script does (optional) |
| `execution_method` | string | no | Execution method: "trigger" (default - most reliable), "ui" (UI endpoint), "auto" (try trigger then ui then fix script) One of: `trigger`, `ui`, `auto`. Default: `"trigger"`. |

### `SN-Create-Fix-Script`

⚠️ CREATES (not executes) a fix script file for MANUAL execution. ServiceNow REST API does NOT support direct script execution. This tool generates a .js file in /scripts/ directory with full instructions and optional auto-delete flag. You MUST manually copy and run the script in ServiceNow UI: System Definition → Scripts - Background. Use for: linking UI Policy Actions, setting update sets, complex GlideRecord operations that cannot be done via REST API.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `script_name` | string | yes | Name for the script file (e.g., "link_ui_policy_actions") (required) |
| `script_content` | string | yes | JavaScript code content (required) |
| `description` | string | no | Description of what the script does (optional) |
| `auto_delete` | boolean | no | If true, script file will be deleted after you confirm execution (default: false) Default: `false`. |

---

## Batch operations

### `SN-Batch-Create`

Create multiple related records in one operation with variable references and transactional support. Reports progress during execution.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `operations` | array | yes | Array of create operations. Each operation can reference previous operations via ${save_as_name} |
| `transaction` | boolean | no | All-or-nothing transaction (default: true) Default: `true`. |
| `progress` | boolean | no | Report progress notifications (default: true) Default: `true`. |

### `SN-Batch-Update`

Update multiple records efficiently in a single operation. Reports progress during execution.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `updates` | array | yes | Array of update operations |
| `stop_on_error` | boolean | no | Stop processing on first error (default: false) Default: `false`. |
| `progress` | boolean | no | Report progress notifications (default: true) Default: `true`. |

---

## Natural language

### `SN-Natural-Language-Search`

Search ServiceNow records using natural language queries. Converts human-readable queries into ServiceNow encoded queries and executes them. Supports: Priority (P1-P5, high/low), Assignment (assigned to me, unassigned, assigned to <name>), Dates (created today, last 7 days, recent), States (new/open/closed/in progress), Content (about SAP, containing error), Impact/Urgency (high/medium/low), Numbers (number is INC0012345). Examples: "find all P1 incidents", "show recent problems assigned to me", "high priority changes created last week", "open incidents about SAP", "unassigned P2 incidents created today". Returns both the parsed encoded query and matching records with pattern analysis.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | Natural language query (e.g., "high priority incidents assigned to me", "recent problems about database") (required) |
| `table` | string | no | Target ServiceNow table name (default: "incident"). Common tables: incident, problem, change_request, sys_user, cmdb_ci Default: `"incident"`. |
| `limit` | number | no | Maximum number of records to return (default: 25) Default: `25`. |
| `fields` | string | no | Comma-separated list of fields to return (optional) |
| `order_by` | string | no | Field to sort by (e.g., "sys_created_on" or "-priority" for descending) (optional) |
| `show_patterns` | boolean | no | Include pattern matching details in response (default: true) Default: `true`. |

---

_Generated 2026-11-02 from 45 registered tools._
