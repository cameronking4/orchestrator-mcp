#!/usr/bin/env node
import { McpServer } from "./mcp-wrapper.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TaskOrchestrator } from './lib.js';
const server = new McpServer({
    name: "task-orchestrator-server",
    version: "0.1.0",
});
const orchestrator = new TaskOrchestrator();
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
server.registerTool("task_orchestrator", {
    title: "Task Orchestrator",
    description: "A tool for dynamic task planning and orchestration.",
    inputSchema: ToolInputSchema,
}, async (args) => {
    let resultText = "";
    try {
        switch (args.action) {
            case "create_plan":
                if (!args.plan_goal)
                    throw new Error("plan_goal is required for create_plan");
                resultText = orchestrator.createPlan(args.plan_goal);
                break;
            case "add_task":
                if (!args.task_description)
                    throw new Error("task_description is required for add_task");
                resultText = orchestrator.addTask(args.task_description, args.parent_task_id, args.notes);
                break;
            case "update_task":
                if (!args.task_id)
                    throw new Error("task_id is required for update_task");
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
    }
    catch (error) {
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
});
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Task Orchestrator MCP Server running on stdio");
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
