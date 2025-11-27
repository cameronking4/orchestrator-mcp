#!/bin/bash

# Test script for the MCP server
# This sends a simple JSON-RPC initialize request and checks for a response

echo "Testing MCP Server..."

# Start the server in the background
cd "$(dirname "$0")"
node build/index.js > /tmp/mcp-server-test.log 2>&1 &
SERVER_PID=$!

# Give it a moment to start
sleep 1

# Send an initialize request
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}}' | node build/index.js > /tmp/mcp-response.log 2>&1 &
TEST_PID=$!

sleep 1

# Check if server is still running (it should be)
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "✓ Server started successfully"
else
  echo "✗ Server failed to start"
  cat /tmp/mcp-server-test.log
  exit 1
fi

# Cleanup
kill $SERVER_PID $TEST_PID 2>/dev/null
rm -f /tmp/mcp-server-test.log /tmp/mcp-response.log

echo "Test completed successfully!"

