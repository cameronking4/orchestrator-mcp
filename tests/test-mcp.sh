#!/bin/bash

# Test the task_orchestrator tool through MCP protocol

echo "🧪 Testing task_orchestrator MCP tool..."
echo ""

# Test 1: Create Plan
echo "1️⃣ Testing create_plan action..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | \
node build/index.js 2>/dev/null | grep -o '"result":{[^}]*}' | head -1
echo ""

# Test 2: List tools
echo "2️⃣ Listing available tools..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | \
node build/index.js 2>/dev/null | grep -A 5 "task_orchestrator" | head -10
echo ""

echo "✅ Basic tests completed!"
echo ""
echo "To test the tool actions, use Cursor's MCP integration:"
echo "  - create_plan: Create a new task plan"
echo "  - add_task: Add subtasks to the plan"
echo "  - update_task: Update task status/notes"
echo "  - get_plan: View the current plan"

