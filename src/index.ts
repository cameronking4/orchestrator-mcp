#!/usr/bin/env node
import { McpServer } from "./mcp-wrapper.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TaskOrchestrator } from './lib.js';
import { TaskEvaluator } from './evaluator.js';
import { TaskAdherenceMonitor } from './adherence.js';
import { ContextManager } from './context-manager.js';
import { DependencyResolver } from './dependency-resolver.js';
import { ProgressAnalyzer } from './progress-analyzer.js';
import { CheckpointManager } from './checkpoint-manager.js';
import { ConstraintChecker } from './constraint-checker.js';

const server = new McpServer({
  name: "task-orchestrator-server",
  version: "0.2.0",
});

const orchestrator = new TaskOrchestrator();
const evaluator = new TaskEvaluator();
const adherenceMonitor = new TaskAdherenceMonitor();
const contextManager = new ContextManager();
const dependencyResolver = new DependencyResolver();
const progressAnalyzer = new ProgressAnalyzer(orchestrator);
const checkpointManager = new CheckpointManager(orchestrator);
const constraintChecker = new ConstraintChecker();

const ToolInputSchema = z.object({
  action: z.enum(["create_plan", "add_task", "update_task", "get_plan"]).describe("The action to perform"),
  plan_goal: z.string().optional().describe("The main goal of the plan (required for create_plan)"),
  task_id: z.string().optional().describe("The ID of the task to update (required for update_task)"),
  task_description: z.string().optional().describe("Description of the task (required for add_task)"),
  parent_task_id: z.string().optional().describe("Parent task ID (optional for add_task, defaults to root)"),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']).optional().describe("New status for the task"),
  notes: z.string().optional().describe("Notes or context to add to the task"),
  result: z.string().optional().describe("Result output of the task")
});

server.registerTool(
  "task_orchestrator",
  {
    title: "Task Orchestrator",
    description: "A tool for dynamic task planning and orchestration.",
    inputSchema: ToolInputSchema,
  },
  async (args) => {
    let resultText = "";
    
    try {
      switch (args.action) {
        case "create_plan":
          if (!args.plan_goal) throw new Error("plan_goal is required for create_plan");
          resultText = orchestrator.createPlan(args.plan_goal);
          break;
        
        case "add_task":
          if (!args.task_description) throw new Error("task_description is required for add_task");
          resultText = orchestrator.addTask(args.task_description, args.parent_task_id, args.notes);
          break;

        case "update_task":
          if (!args.task_id) throw new Error("task_id is required for update_task");
          resultText = orchestrator.updateTask(args.task_id, {
            status: args.status,
            description: args.task_description,
            notes: args.notes,
            result: args.result
          });
          break;

        case "get_plan":
          // Just return the plan
          break;
      }
    } catch (error: any) {
      return {
        content: [
          { type: "text", text: `Error: ${error.message}` }
        ],
        isError: true
      };
    }

    const planText = orchestrator.formatPlan();

    return {
      content: [
        { type: "text", text: resultText ? `${resultText}\n\n${planText}` : planText }
      ]
    };
  }
);

// Register Task Evaluator tool
const EvaluateTaskSchema = z.object({
  task_description: z.string().describe("What was supposed to be done"),
  actual_output: z.string().describe("What was actually produced"),
  context: z.string().optional().describe("Optional: any relevant context"),
});

server.registerTool(
  "evaluate_task",
  {
    title: "Task Evaluator",
    description: "Evaluate if a task output meets its goal using semantic understanding.",
    inputSchema: EvaluateTaskSchema,
  },
  async (args) => {
    try {
      const result = evaluator.evaluateTask(
        args.task_description,
        args.actual_output,
        args.context
      );
      const output = `Assessment: ${result.assessment}\n\nReasoning: ${result.reasoning}\n\nStatus: ${result.passed ? 'PASSED' : 'FAILED'}${result.suggestions ? `\n\nSuggestions: ${result.suggestions}` : ''}`;
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Register Task Adherence Monitor tool
const CheckAlignmentSchema = z.object({
  plan_goal: z.string().describe("The overall goal"),
  current_action: z.string().describe("What the LLM is doing now"),
  recent_context: z.string().optional().describe("Optional: recent conversation"),
});

server.registerTool(
  "check_alignment",
  {
    title: "Task Adherence Monitor",
    description: "Check if current action aligns with plan goal using semantic drift detection.",
    inputSchema: CheckAlignmentSchema,
  },
  async (args) => {
    try {
      const result = adherenceMonitor.checkAlignment(
        args.plan_goal,
        args.current_action,
        args.recent_context
      );
      const output = `Aligned: ${result.aligned ? 'YES' : 'NO'}\nConfidence: ${(result.confidence * 100).toFixed(0)}%\n\nReasoning: ${result.reasoning}${result.suggestion ? `\n\nSuggestion: ${result.suggestion}` : ''}`;
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Register Context Manager tools
const RememberSchema = z.object({
  what: z.string().describe("What to remember (natural language)"),
  details: z.string().optional().describe("Optional: additional details"),
});

server.registerTool(
  "remember",
  {
    title: "Remember",
    description: "Store information with natural language description.",
    inputSchema: RememberSchema,
  },
  async (args) => {
    try {
      const result = contextManager.remember(args.what, args.details);
      return {
        content: [{ type: "text", text: `Remembered: ${args.what}${args.details ? `\nDetails: ${args.details}` : ''}\nID: ${result.id}` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

const RecallSchema = z.object({
  query: z.string().describe("What you're looking for (natural language)"),
  limit: z.number().optional().describe("Max results (default: 3)"),
});

server.registerTool(
  "recall",
  {
    title: "Recall",
    description: "Retrieve information by semantic similarity.",
    inputSchema: RecallSchema,
  },
  async (args) => {
    try {
      const result = contextManager.recall(args.query, args.limit);
      if (result.results.length === 0) {
        return {
          content: [{ type: "text", text: "No matching memories found." }],
        };
      }
      const output = result.results.map((r, i) => 
        `${i + 1}. ${r.what}${r.details ? `\n   Details: ${r.details}` : ''}\n   Relevance: ${(r.relevance * 100).toFixed(0)}%`
      ).join('\n\n');
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Register Dependency Resolver tools
const InferDependenciesSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
  })).describe("Array of tasks to analyze"),
});

server.registerTool(
  "infer_dependencies",
  {
    title: "Infer Dependencies",
    description: "Analyze tasks and infer dependencies from their descriptions.",
    inputSchema: InferDependenciesSchema,
  },
  async (args) => {
    try {
      const result = dependencyResolver.inferDependencies(args.tasks);
      let output = `Dependencies inferred:\n\n`;
      if (result.dependencies.length > 0) {
        output += result.dependencies.map(dep => 
          `Task ${dep.task_id} depends on: ${dep.depends_on.join(', ')}\nReasoning: ${dep.reasoning}`
        ).join('\n\n');
      } else {
        output += "No dependencies inferred.\n";
      }
      if (result.ready_tasks.length > 0) {
        output += `\n\nReady tasks (no dependencies): ${result.ready_tasks.join(', ')}`;
      }
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

const GetNextTasksSchema = z.object({
  completed_tasks: z.array(z.string()).optional().describe("Optional: tasks already done"),
});

server.registerTool(
  "get_next_tasks",
  {
    title: "Get Next Tasks",
    description: "Get tasks that are ready to start (all dependencies done).",
    inputSchema: GetNextTasksSchema,
  },
  async (args) => {
    try {
      const result = dependencyResolver.getNextTasks(args.completed_tasks);
      let output = `Ready tasks: ${result.ready.length > 0 ? result.ready.join(', ') : 'none'}\n`;
      output += `Blocked tasks: ${result.blocked.length > 0 ? result.blocked.join(', ') : 'none'}`;
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Register Progress Analyzer tool
const AnalyzeProgressSchema = z.object({
  plan_goal: z.string().optional().describe("Optional: overall goal for context"),
});

server.registerTool(
  "analyze_progress",
  {
    title: "Progress Analyzer",
    description: "Analyze plan progress with semantic insights.",
    inputSchema: AnalyzeProgressSchema,
  },
  async (args) => {
    try {
      const result = progressAnalyzer.analyzeProgress(args.plan_goal);
      let output = `${result.summary}\n\n`;
      if (result.insights.length > 0) {
        output += `Insights:\n${result.insights.map(i => `- ${i}`).join('\n')}\n\n`;
      }
      if (result.risks && result.risks.length > 0) {
        output += `Risks:\n${result.risks.map(r => `- ${r}`).join('\n')}\n\n`;
      }
      if (result.recommendations && result.recommendations.length > 0) {
        output += `Recommendations:\n${result.recommendations.map(r => `- ${r}`).join('\n')}`;
      }
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Register Checkpoint Manager tools
const CreateCheckpointSchema = z.object({
  name: z.string().describe("Checkpoint name"),
  description: z.string().optional().describe("What this checkpoint represents"),
});

server.registerTool(
  "create_checkpoint",
  {
    title: "Create Checkpoint",
    description: "Save current plan state with natural language description.",
    inputSchema: CreateCheckpointSchema,
  },
  async (args) => {
    try {
      const result = checkpointManager.createCheckpoint(args.name, args.description);
      return {
        content: [{ type: "text", text: `Checkpoint created: ${args.name}\nID: ${result.checkpoint_id}` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "list_checkpoints",
  {
    title: "List Checkpoints",
    description: "List all saved checkpoints.",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const result = checkpointManager.listCheckpoints();
      if (result.checkpoints.length === 0) {
        return {
          content: [{ type: "text", text: "No checkpoints found." }],
        };
      }
      const output = result.checkpoints.map(cp => 
        `ID: ${cp.id}\nName: ${cp.name}${cp.description ? `\nDescription: ${cp.description}` : ''}`
      ).join('\n\n');
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

const RestoreCheckpointSchema = z.object({
  checkpoint_id: z.string().optional().describe("Exact checkpoint ID"),
  description: z.string().optional().describe("OR: restore by semantic match"),
});

server.registerTool(
  "restore_checkpoint",
  {
    title: "Restore Checkpoint",
    description: "Restore plan state to a checkpoint by ID or semantic match.",
    inputSchema: RestoreCheckpointSchema,
  },
  async (args) => {
    try {
      if (!args.checkpoint_id && !args.description) {
        return {
          content: [{ type: "text", text: "Error: Either checkpoint_id or description must be provided." }],
          isError: true,
        };
      }
      const result = checkpointManager.restoreCheckpoint(args.checkpoint_id, args.description);
      return {
        content: [{ type: "text", text: result.message }],
        isError: !result.success,
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Register Constraint Checker tool
const CheckConstraintsSchema = z.object({
  constraints: z.string().describe("Natural language constraints"),
  output: z.string().describe("What to check"),
  context: z.string().optional().describe("Optional: additional context"),
});

server.registerTool(
  "check_constraints",
  {
    title: "Constraint Checker",
    description: "Check if output meets constraints using semantic understanding.",
    inputSchema: CheckConstraintsSchema,
  },
  async (args) => {
    try {
      const result = constraintChecker.checkConstraints(
        args.constraints,
        args.output,
        args.context
      );
      let output = `Status: ${result.passed ? 'PASSED' : 'FAILED'}\n\n`;
      output += `Reasoning: ${result.reasoning}\n`;
      if (result.violations.length > 0) {
        output += `\nViolations:\n${result.violations.map(v => `- ${v.constraint}: ${v.explanation}`).join('\n')}`;
      }
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Task Orchestrator MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
