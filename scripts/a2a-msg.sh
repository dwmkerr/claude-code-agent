#!/usr/bin/env bash

# Send a message to an A2A agent
# Usage: ./a2a-msg.sh "your message"

set -e -o pipefail

# Colors
red='\033[0;31m'
green='\033[0;32m'
nc='\033[0m'

# Defaults (override with env vars)
A2A_HOST="${A2A_HOST:-localhost}"
A2A_PORT="${A2A_PORT:-2222}"

show_help() {
    echo "usage: a2a-msg.sh [options] \"<message>\""
    echo ""
    echo "examples:"
    echo "  a2a-msg.sh \"what files are in this repo?\""
    echo "  A2A_PORT=3000 a2a-msg.sh \"hello\""
    echo "  a2a-msg.sh -c ctx123 \"follow up question\""
    echo ""
    echo "options:"
    echo "  -c <context-id>    context id for multi-turn conversations"
    echo "  -h                 show this help"
    echo ""
    echo "environment:"
    echo "  A2A_HOST    server host (default: localhost)"
    echo "  A2A_PORT    server port (default: 2222)"
    echo ""
    echo "tip: symlink for global access:"
    echo "  ln -s \$(pwd)/scripts/a2a-msg.sh ~/bin/a2a"
}

# Parse options
context_id=""
while [[ $# -gt 0 ]]; do
    case $1 in
        -c)
            context_id="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

message="$1"

if [[ -z "$message" ]]; then
    echo -e "${red}error${nc}: missing message"
    show_help
    exit 1
fi

# Generate a unique message ID
msg_id="msg-$(date +%s)-$$"

# Build JSON payload
if [[ -n "$context_id" ]]; then
    payload=$(cat <<EOF
{
  "jsonrpc": "2.0",
  "method": "message/send",
  "params": {
    "message": {
      "messageId": "$msg_id",
      "role": "user",
      "parts": [{"kind": "text", "text": "$message"}]
    },
    "configuration": {
      "blocking": true
    }
  },
  "id": "1",
  "contextId": "$context_id"
}
EOF
)
else
    payload=$(cat <<EOF
{
  "jsonrpc": "2.0",
  "method": "message/send",
  "params": {
    "message": {
      "messageId": "$msg_id",
      "role": "user",
      "parts": [{"kind": "text", "text": "$message"}]
    },
    "configuration": {
      "blocking": true
    }
  },
  "id": "1"
}
EOF
)
fi

echo -e "${green}→${nc} $message"
echo ""

curl -N -s -X POST "http://${A2A_HOST}:${A2A_PORT}/" \
    -H "Content-Type: application/json" \
    -d "$payload"

echo ""
