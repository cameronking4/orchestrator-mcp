import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Wrapper class that provides a simpler API for MCP servers
 * This is a compatibility layer for code expecting McpServer
 */
export class McpServer extends Server {
  private tools: Map<string, any>;

  constructor(options: { name: string; version: string }) {
    super(
      {
        name: options.name,
        version: options.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.tools = new Map();

    // Set up tools/list handler
    this.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map((tool) => {
          // Convert Zod schema to JSON Schema if needed
          let inputSchema = tool.inputSchema;
          if (inputSchema && typeof inputSchema === "object" && "_def" in inputSchema) {
            // It's a Zod schema, convert it
            inputSchema = zodToJsonSchema(inputSchema as z.ZodTypeAny);
          }
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: inputSchema || { type: "object", properties: {} },
          };
        }),
      };
    });

    // Set up tools/call handler
    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params?.name;
      if (!toolName) {
        throw new Error("Tool name is required");
      }

      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      const args = request.params?.arguments || {};
      
      // Validate arguments with Zod schema if it's a Zod schema
      if (tool.zodSchema) {
        const parsed = tool.zodSchema.parse(args);
        const result = await tool.handler(parsed);
        return result;
      }
      
      const result = await tool.handler(args);
      return result;
    });
  }

  /**
   * Register a tool with a simple API
   */
  tool(
    name: string,
    description: string,
    inputSchema: z.ZodObject<any> | Record<string, z.ZodTypeAny>,
    handler: (args: any) => Promise<any> | any,
  ): void {
    this.tools.set(name, {
      name,
      description,
      inputSchema:
        typeof inputSchema === "object" && !(inputSchema as any)._def
          ? z.object(inputSchema as Record<string, z.ZodTypeAny>)
          : inputSchema,
      handler,
    });
  }

  /**
   * Register a tool with a more detailed API
   */
  registerTool(
    name: string,
    options: { title?: string; description: string; inputSchema: z.ZodTypeAny },
    handler: (args: any) => Promise<any> | any,
  ): void {
    const zodSchema = options.inputSchema || z.object({});
    this.tools.set(name, {
      name,
      description: options.description || "",
      inputSchema: zodSchema, // Will be converted to JSON Schema in tools/list
      zodSchema: zodSchema, // Keep original for validation
      handler,
    });
  }
}

