# Task Orchestrator MCP Server

This is a **Model Context Protocol (MCP)** server that provides a dynamic task planning and orchestration tool. It allows AI agents (like Claude) to create execution plans, break them down into subtasks, track progress, and store notes/results for each step—essentially giving the AI a "working memory" for complex workflows. This MCP is the missing frontal lobe for your LLM agent. Turn stateless chat responses into stateful, goal-oriented agents that can plan, execute, and remember. 🧠 ⚡️

## Features

- **Hierarchical Planning**: Create a root goal and nest subtasks infinitely deep.
- **State Management**: Tracks status (`pending`, `in_progress`, `completed`, `failed`, `skipped`) for every task.
- **Visual Feedback**: Returns a visual tree representation of the plan after every modification.
- **Context Storage**: Store notes and results against specific task IDs.

## Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Build
1. Clone the repository or navigate to the directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Test the project:
```
{
   "command": "node",
   "args": [
     "/absolute/path/to/task-orchestrator-server/build/index.js"
   ]
 }
```
*Note: Replace `/absolute/path/to/...` with the actual full path to the `build/index.js` file on your machine.*

## Usage

To use the production server with an MCP client (like **Claude Desktop**), add the following to your configuration file (e.g., `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "task-orchestrator": {
     "command": "npx",
     "args": [
       "-y",
       "@task-orchestrator/mcp@latest"
     ]
   }
  }
}
```



## Tool Usage

The server exposes a single versatile tool: **`task_orchestrator`**.

### Input Schema

The tool accepts an `action` and associated parameters:

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `create_plan` | `plan_goal` | - | Initializes a new plan with a root goal. Wipes previous state. |
| `add_task` | `task_description` | `parent_task_id`, `notes` | Adds a subtask. If `parent_task_id` is omitted, adds to root. |
| `update_task` | `task_id` | `status`, `task_description`, `notes`, `result` | Updates a task's state or content. |
| `get_plan` | - | - | Returns the current plan structure without changes. |

### Example Workflow

1. **Create a Plan**
   ```json
   {
     "action": "create_plan",
     "plan_goal": "Refactor the database schema"
   }
   ```

2. **Add Subtasks**
   ```json
   {
     "action": "add_task",
     "parent_task_id": "1",
     "task_description": "Analyze current schema relations"
   }
   ```

3. **Update Progress**
   ```json
   {
     "action": "update_task",
     "task_id": "2",
     "status": "completed",
     "result": "Found 3 circular dependencies."
   }
   ```

## Development

- **Watch Mode**: Run `npm run watch` to automatically recompile on changes.
- **Debug**: You can test the server manually by running the built script and piping JSON-RPC messages, or using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).
