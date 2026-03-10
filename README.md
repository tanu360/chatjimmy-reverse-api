<div align="center">
  <h1>🤖 ChatJimmy API</h1>

  <p>
    <strong>Free OpenAI & Anthropic compatible API proxy — powered by chatjimmy.ai</strong>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#endpoints">Endpoints</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#examples">Examples</a> •
    <a href="#tool-calling">Tool Calling</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#deploy">Deploy</a> •
    <a href="#license">License</a>
  </p>

  <br/>
</div>

> **Auth:** Bearer token starting with `tarun-` (e.g. `tarun-mysecretkey`)
>
> **Model:** `llama3.1-8B` (default)

---

<a id="overview"></a>

## 🌟 Overview

ChatJimmy API is a Cloudflare Worker that translates standard **OpenAI** and **Anthropic** API formats into [chatjimmy.ai](https://chatjimmy.ai)'s backend format. Use it as a drop-in replacement with any OpenAI/Anthropic SDK or tool — Continue, Cursor, etc.

This project is **unofficial** and not affiliated with chatjimmy.ai.

---

<a id="features"></a>

## ✨ Key Features

- **Dual API compatibility** — OpenAI `/v1/chat/completions` + Anthropic `/v1/messages`
- **Streaming & non-streaming** — full SSE streaming support for both formats
- **Tool calling** — translates OpenAI/Anthropic tool calls via `<tool_calls>` XML injection
- **Think block stripping** — removes `<|think|>` blocks from responses
- **Stats passthrough** — token counts, speed metrics, TTFT in usage fields
- **IP spoofing** — rotates through realistic residential IP ranges per request
- **Zero dependencies** — single file, pure Cloudflare Workers API
- **Global edge** — deploys to 300+ Cloudflare edge locations

---

<a id="endpoints"></a>

## 🛠️ Endpoints

| Method | Path                   | Description                   |
| ------ | ---------------------- | ----------------------------- |
| `GET`  | `/api`                 | Health check + endpoint list  |
| `GET`  | `/health`              | Upstream health status        |
| `GET`  | `/v1/models`           | Available models              |
| `POST` | `/v1/chat/completions` | OpenAI-compatible chat        |
| `POST` | `/v1/messages`         | Anthropic-compatible messages |

All endpoints support CORS and return JSON.

---

<a id="quick-start"></a>

## 🚀 Quick Start

### With cURL

```bash
curl https://jimmy.aikit.club/v1/chat/completions \
  -H "Authorization: Bearer tarun-mykey" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1-8B",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### With OpenAI SDK

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "tarun-mykey",
  baseURL: "https://jimmy.aikit.club/v1",
});

const response = await client.chat.completions.create({
  model: "llama3.1-8B",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);
```

### With Anthropic SDK

```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "tarun-mykey",
  baseURL: "https://jimmy.aikit.club",
});

const message = await client.messages.create({
  model: "llama3.1-8B",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(message.content[0].text);
```

### With Vanilla JS (fetch)

```javascript
const res = await fetch("https://jimmy.aikit.club/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer tarun-mykey",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3.1-8B",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

const data = await res.json();
console.log(data.choices[0].message.content);
```

---

<a id="examples"></a>

## 💡 Usage Examples

### Streaming Chat

```javascript
const response = await fetch("https://jimmy.aikit.club/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer tarun-mykey",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3.1-8B",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Write a haiku about coding" },
    ],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE chunks: "data: {...}\n\n"
  for (const line of chunk.split("\n")) {
    if (line.startsWith("data: ") && line !== "data: [DONE]") {
      const data = JSON.parse(line.slice(6));
      process.stdout.write(data.choices[0]?.delta?.content || "");
    }
  }
}
```

### Non-Streaming

```bash
curl https://jimmy.aikit.club/v1/chat/completions \
  -H "Authorization: Bearer tarun-mykey" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1-8B",
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "stream": false
  }'
```

### Non-Streaming (Vanilla JS)

```javascript
const res = await fetch("https://jimmy.aikit.club/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer tarun-mykey",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3.1-8B",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is 2+2?" },
    ],
    stream: false,
  }),
});

const data = await res.json();
console.log(data.choices[0].message.content); // "2 + 2 = 4"
```

**Response:**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "llama3.1-8B",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "2 + 2 = 4" },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 8,
    "total_tokens": 20
  }
}
```

---

<a id="tool-calling"></a>

## 🔧 Tool Calling

The proxy supports OpenAI and Anthropic tool calling formats. Tools are injected into the system prompt using `<tool_calls>` XML tags, and the model's responses are parsed back into proper tool call objects.

### OpenAI Format

```bash
curl https://jimmy.aikit.club/v1/chat/completions \
  -H "Authorization: Bearer tarun-mykey" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1-8B",
    "messages": [{"role": "user", "content": "What is the weather in Tokyo?"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"]
        }
      }
    }]
  }'
```

### Anthropic Format

```bash
curl https://jimmy.aikit.club/v1/messages \
  -H "Authorization: Bearer tarun-mykey" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "llama3.1-8B",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "What is the weather in Tokyo?"}],
    "tools": [{
      "name": "get_weather",
      "description": "Get current weather",
      "input_schema": {
        "type": "object",
        "properties": {
          "city": { "type": "string" }
        },
        "required": ["city"]
      }
    }]
  }'
```

### Tool Calling — Vanilla JS (OpenAI Format)

```javascript
const res = await fetch("https://jimmy.aikit.club/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer tarun-mykey",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3.1-8B",
    messages: [{ role: "user", content: "What is the weather in Tokyo?" }],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get current weather",
          parameters: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"],
          },
        },
      },
    ],
  }),
});

const data = await res.json();
const msg = data.choices[0].message;

if (msg.tool_calls) {
  for (const tc of msg.tool_calls) {
    console.log(tc.function.name); // "get_weather"
    console.log(JSON.parse(tc.function.arguments)); // { city: "Tokyo" }
  }
} else {
  console.log(msg.content);
}
```

### Tool Calling — Vanilla JS (Anthropic Format)

```javascript
const res = await fetch("https://jimmy.aikit.club/v1/messages", {
  method: "POST",
  headers: {
    Authorization: "Bearer tarun-mykey",
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "llama3.1-8B",
    max_tokens: 1024,
    messages: [{ role: "user", content: "What is the weather in Tokyo?" }],
    tools: [
      {
        name: "get_weather",
        description: "Get current weather",
        input_schema: {
          type: "object",
          properties: { city: { type: "string" } },
          required: ["city"],
        },
      },
    ],
  }),
});

const data = await res.json();

for (const block of data.content) {
  if (block.type === "tool_use") {
    console.log(block.name); // "get_weather"
    console.log(block.input); // { city: "Tokyo" }
  } else if (block.type === "text") {
    console.log(block.text);
  }
}
```

> **Note:** Tool calling reliability depends on the underlying model (llama3.1-8B). Complex tool schemas with many parameters may not always produce valid JSON.

---

<a id="architecture"></a>

## 🏗️ Architecture

```
Client Request (OpenAI or Anthropic format)
  │
  ▼
┌──────────────────────────────┐
│  Auth Check                   │
│  Bearer token must start      │
│  with "tarun-"                │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Format Translation           │
│  • Parse messages             │
│  • Convert tool definitions   │
│  • Build system prompt        │
│  • Handle tool_calls ↔ XML    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  IP Rotation                  │
│  Random residential IP from   │
│  300+ global ranges           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  chatjimmy.ai Upstream        │
│  POST /api/chat               │
│  {messages, chatOptions,      │
│   attachment}                 │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Response Translation         │
│  • Strip <|think|> blocks     │
│  • Parse <|stats|> for usage  │
│  • Parse <tool_calls> XML     │
│  • Convert to OpenAI/Anthropic│
│    streaming or non-streaming │
└──────────────────────────────┘
```

---

<a id="deploy"></a>

## 🚀 Deploy

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Setup

```bash
git clone https://github.com/tarun/chatjimmy.git
cd chatjimmy
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run deploy
```

---

## ⚙️ Configuration

All configuration is via constants at the top of `chatjimmy.js`:

| Constant                 | Default       | Description                       |
| ------------------------ | ------------- | --------------------------------- |
| `DEFAULT_MODEL`          | `llama3.1-8B` | Default model when none specified |
| `DEFAULT_TOP_K`          | `8`           | Default top_k sampling parameter  |
| `DEFAULT_TIMEOUT_MS`     | `30000`       | Upstream request timeout (30s)    |
| `DEFAULT_MAX_BODY_BYTES` | `64000`       | Max request body size             |

---

<a id="license"></a>

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
