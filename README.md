# Task Orchestrator MCP Server

This is a **Model Context Protocol (MCP)** server that provides a dynamic task planning and orchestration tool. It allows AI agents (like Claude) to create execution plans, break them down into subtasks, track progress, and store notes/results for each step—essentially giving the AI a "working memory" for complex workflows. This MCP is the missing frontal lobe for your LLM agent. Turn stateless chat responses into stateful, goal-oriented agents that can plan, execute, and remember. 🧠 ⚡️

## Features

- **Hierarchical Planning**: Create a root goal and nest subtasks infinitely deep.
- **State Management**: Tracks status (`pending`, `in_progress`, `completed`, `failed`, `skipped`) for every task.
- **Visual Feedback**: Returns a visual tree representation of the plan after every modification.
- **Context Storage**: Store notes and results against specific task IDs.
- **Semantic Task Evaluation**: Evaluate task completion quality using natural language understanding.
- **Drift Detection**: Monitor alignment with plan goals and detect semantic drift.
- **Semantic Memory**: Store and retrieve facts using semantic similarity.
- **Dependency Inference**: Automatically infer task dependencies from descriptions.
- **Progress Analysis**: Get insights, risks, and recommendations about plan progress.
- **Checkpoint Management**: Save and restore plan state at any point.
- **Constraint Validation**: Check outputs against natural language constraints.

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
"mcpServers": {
  "task-orchestrator": {
     "command": "npx",
     "args": [
       "-y",
       "@task-orchestrator/mcp@latest"
     ]
  }
}
```



## Tool Usage

The server exposes **8 powerful tools** designed to leverage LLM capabilities:

### 1. Task Orchestrator (`task_orchestrator`)

Core planning and task management tool.

| Action | Required Params | Optional Params | Description |
|--------|----------------|-----------------|-------------|
| `create_plan` | `plan_goal` | - | Initializes a new plan with a root goal. Wipes previous state. |
| `add_task` | `task_description` | `parent_task_id`, `notes` | Adds a subtask. If `parent_task_id` is omitted, adds to root. |
| `update_task` | `task_id` | `status`, `task_description`, `notes`, `result` | Updates a task's state or content. |
| `get_plan` | - | - | Returns the current plan structure without changes. |

### 2. Task Evaluator (`evaluate_task`)

Evaluate task completion quality using semantic understanding.

```json
{
  "task_description": "Create a secure login endpoint",
  "actual_output": "Created POST /login with JWT authentication",
  "context": "This is for a banking application"
}
```

Returns: `{ assessment, passed, reasoning, suggestions }`

### 3. Task Adherence Monitor (`check_alignment`)

Detect semantic drift from plan goals.

```json
{
  "plan_goal": "Build a REST API for user management",
  "current_action": "I'm creating GraphQL schema",
  "recent_context": "User asked about GraphQL"
}
```

Returns: `{ aligned, confidence, reasoning, suggestion }`

### 4. Context Manager (`remember`, `recall`)

Semantic memory for storing and retrieving facts.

**Remember:**
```json
{
  "what": "We decided to use PostgreSQL",
  "details": "Team prefers it for JSON support"
}
```

**Recall:**
```json
{
  "query": "What database are we using?",
  "limit": 3
}
```

Returns: `{ results: [{ what, details, relevance }] }`

### 5. Dependency Resolver (`infer_dependencies`, `get_next_tasks`)

Automatically infer task dependencies and identify ready tasks.

**Infer Dependencies:**
```json
{
  "tasks": [
    { "id": "1", "description": "Set up database schema" },
    { "id": "2", "description": "Create API endpoints that query the database" }
  ]
}
```

**Get Next Tasks:**
```json
{
  "completed_tasks": ["1"]
}
```

Returns: `{ ready: string[], blocked: string[] }`

### 6. Progress Analyzer (`analyze_progress`)

Get semantic insights about plan progress.

```json
{
  "plan_goal": "Build a web application"
}
```

Returns: `{ summary, insights, risks, recommendations }`

### 7. Checkpoint Manager (`create_checkpoint`, `list_checkpoints`, `restore_checkpoint`)

Save and restore plan state.

**Create:**
```json
{
  "name": "Before refactoring",
  "description": "All tests passing"
}
```

**Restore:**
```json
{
  "checkpoint_id": "cp_1"
}
```
or restore by semantic match:
```json
{
  "description": "the checkpoint before refactoring"
}
```

### 8. Constraint Checker (`check_constraints`)

Validate outputs against natural language constraints.

```json
{
  "constraints": "Must use TypeScript, no external APIs, include error handling",
  "output": "Created login.ts with try-catch blocks",
  "context": "Production API"
}
```

Returns: `{ passed, violations, reasoning }`

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
