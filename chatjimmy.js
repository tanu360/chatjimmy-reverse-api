const DEFAULT_MODEL = 'llama3.1-8B';
const DEFAULT_TOP_K = 8;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_BODY_BYTES = 64000;
const BASE_URL = 'https://chatjimmy.ai';
const CHAT_URL = `${BASE_URL}/api/chat`;
const MODELS_URL = `${BASE_URL}/api/models`;
const HEALTH_URL = `${BASE_URL}/api/health`;

const STATS_START = '<|stats|>';
const STATS_END = '<|/stats|>';
const THINK_START = '<|think|>';
const THINK_END = '<|/think|>';
const THINK_RE = /<\|think\|>[\s\S]*?<\|\/think\|>/gi;

const TOOL_CALLS_START = '<tool_calls>';
const TOOL_CALLS_END = '</tool_calls>';
const TOOL_CALL_START = '<tool_call>';
const TOOL_CALL_END = '</tool_call>';
const TOOL_MARKER_START = '##TOOL_CALL##';
const TOOL_MARKER_END = '##END_CALL##';
const TOOL_AUTO_PREFIX = 'u_';
const TOOL_OUTPUT_RETRY_LIMIT = 1;

const TOOL_NAME_ALIASES = {
   Read: 'fs_open_file',
   Write: 'fs_put_file',
   Edit: 'fs_patch_file',
   Bash: 'shell_run',
   Grep: 'text_search',
   Glob: 'path_find',
   NotebookEdit: 'notebook_patch',
   WebFetch: 'http_get_url',
   WebSearch: 'web_query'
};
const TOOL_REVERSE_ALIASES = Object.fromEntries(Object.entries(TOOL_NAME_ALIASES).map(([name, alias]) => [alias, name]));
const TOOL_REFUSAL_RE = /Tool\s+["'`]?([A-Za-z0-9_.:-]+)["'`]?\s+(?:does\s+not\s+exists?|is\s+not\s+(?:available|registered))/i;

const PUBLIC_IP_RANGES = [
   // US — Comcast, AT&T, Verizon, Charter, Cox
   [24, 0], [24, 1], [24, 30], [24, 34], [24, 128], [24, 218],
   [50, 39], [50, 53], [50, 79], [50, 93], [50, 115], [50, 196],
   [66, 30], [66, 56], [66, 87], [66, 176], [66, 214], [66, 229],
   [68, 32], [68, 48], [68, 80], [68, 100], [68, 173], [68, 199],
   [71, 56], [71, 80], [71, 172], [71, 198], [71, 224], [71, 247],
   [73, 15], [73, 48], [73, 96], [73, 140], [73, 189], [73, 222],
   [75, 64], [75, 80], [75, 134], [75, 176], [75, 210],
   [76, 21], [76, 97], [76, 115], [76, 169], [76, 220],
   [98, 14], [98, 37], [98, 116], [98, 193], [98, 213],
   [99, 8], [99, 46], [99, 112], [99, 170], [99, 203],
   // Europe — BT, Deutsche Telekom, Orange, Vodafone, Telefonica
   [2, 24], [2, 56], [2, 96], [2, 152], [2, 200],
   [5, 10], [5, 53], [5, 89], [5, 145], [5, 198],
   [31, 13], [31, 46], [31, 132], [31, 172], [31, 204],
   [37, 24], [37, 76], [37, 120], [37, 156], [37, 210],
   [46, 7], [46, 42], [46, 105], [46, 165], [46, 223],
   [62, 24], [62, 56], [62, 140], [62, 176], [62, 220],
   [77, 28], [77, 72], [77, 100], [77, 162], [77, 234],
   [78, 32], [78, 85], [78, 120], [78, 188], [78, 240],
   [79, 18], [79, 66], [79, 130], [79, 184], [79, 220],
   [80, 14], [80, 56], [80, 98], [80, 176], [80, 234],
   [81, 12], [81, 64], [81, 128], [81, 176], [81, 220],
   [82, 20], [82, 68], [82, 132], [82, 192], [82, 240],
   [83, 16], [83, 77], [83, 144], [83, 200], [83, 240],
   [84, 18], [84, 72], [84, 128], [84, 192], [84, 244],
   [85, 16], [85, 76], [85, 140], [85, 192], [85, 240],
   [86, 20], [86, 88], [86, 148], [86, 196], [86, 240],
   [87, 18], [87, 76], [87, 138], [87, 196], [87, 240],
   [88, 24], [88, 64], [88, 128], [88, 196], [88, 240],
   [89, 16], [89, 64], [89, 130], [89, 188], [89, 240],
   [90, 12], [90, 56], [90, 115], [90, 176], [90, 230],
   [91, 18], [91, 64], [91, 128], [91, 188], [91, 235],
   // Asia — NTT, KDDI, SoftBank, BSNL, Airtel, Jio, SK, KT
   [1, 21], [1, 55], [1, 112], [1, 176], [1, 224],
   [14, 32], [14, 96], [14, 128], [14, 192], [14, 224],
   [27, 16], [27, 56], [27, 96], [27, 147], [27, 200],
   [36, 37], [36, 66], [36, 71], [36, 255],
   [39, 32], [39, 110], [39, 192],
   [42, 48], [42, 96], [42, 200],
   [43, 224], [43, 240], [43, 252],
   [49, 15], [49, 44], [49, 128], [49, 204],
   [58, 65], [58, 120], [58, 186], [58, 230],
   [59, 16], [59, 80], [59, 144], [59, 200],
   [60, 32], [60, 96], [60, 160], [60, 224],
   [61, 16], [61, 80], [61, 144], [61, 200],
   [101, 0], [101, 53], [101, 96], [101, 128],
   [103, 5], [103, 48], [103, 96], [103, 145], [103, 200],
   [106, 51], [106, 96], [106, 176], [106, 210],
   [110, 36], [110, 93], [110, 172], [110, 224],
   [111, 65], [111, 92], [111, 176], [111, 220],
   [112, 64], [112, 133], [112, 196],
   [113, 52], [113, 96], [113, 160], [113, 203],
   [114, 32], [114, 79], [114, 128], [114, 200],
   [115, 42], [115, 96], [115, 160], [115, 220],
   [116, 48], [116, 96], [116, 193], [116, 240],
   [117, 18], [117, 96], [117, 136], [117, 200],
   [118, 32], [118, 96], [118, 163], [118, 220],
   [119, 30], [119, 82], [119, 148], [119, 200],
   [121, 58], [121, 128], [121, 176], [121, 240],
   [122, 50], [122, 100], [122, 168], [122, 224],
   [123, 16], [123, 80], [123, 148], [123, 200],
   [124, 36], [124, 100], [124, 168], [124, 240],
   [125, 24], [125, 96], [125, 160], [125, 224],
   [126, 32], [126, 100], [126, 160], [126, 220],
   // South America — Claro, Vivo, Telmex, Movistar
   [138, 36], [138, 94], [138, 185], [138, 219],
   [143, 0], [143, 106], [143, 208],
   [146, 164], [146, 196], [146, 230],
   [148, 72], [148, 120], [148, 220],
   [152, 168], [152, 200], [152, 240],
   [157, 48], [157, 100], [157, 186],
   [161, 18], [161, 132], [161, 230],
   [168, 196], [168, 227], [168, 245],
   [170, 51], [170, 82], [170, 150], [170, 231],
   [177, 18], [177, 36], [177, 66], [177, 96], [177, 128], [177, 200],
   [179, 20], [179, 48], [179, 96], [179, 160], [179, 220],
   [181, 16], [181, 48], [181, 96], [181, 176], [181, 224],
   [186, 28], [186, 72], [186, 148], [186, 196], [186, 232],
   [187, 16], [187, 48], [187, 96], [187, 176], [187, 224],
   [189, 16], [189, 48], [189, 96], [189, 176], [189, 224],
   [190, 16], [190, 48], [190, 96], [190, 176], [190, 224],
   [191, 16], [191, 48], [191, 96], [191, 176], [191, 220],
   // Africa / Middle East — MTN, Safaricom, Etisalat, STC, Turkcell
   [41, 33], [41, 72], [41, 138], [41, 190], [41, 220],
   [105, 16], [105, 48], [105, 96], [105, 176], [105, 224],
   [154, 16], [154, 48], [154, 96], [154, 160],
   [156, 0], [156, 38], [156, 155], [156, 200],
   [160, 16], [160, 120], [160, 218],
   [196, 16], [196, 46], [196, 96], [196, 176], [196, 216],
   [197, 16], [197, 48], [197, 96], [197, 155], [197, 210],
   // Oceania — Telstra, Optus, Spark NZ
   [1, 128], [1, 144], [1, 160],
   [49, 176], [49, 195],
   [58, 28], [58, 162],
   [101, 160], [101, 176],
   [110, 140], [110, 174],
   [120, 16], [120, 88], [120, 144],
   [121, 44], [121, 200],
   [122, 56], [122, 148],
   [124, 148], [124, 188],
   [144, 130], [144, 132], [144, 135],
   [203, 16], [203, 32], [203, 56], [203, 96], [203, 128], [203, 176], [203, 220]
];

function cleanSchema(schema) {
   if (!schema || typeof schema !== 'object') return schema;
   const STRIP_TOP = ['$schema', 'title', 'additionalProperties'];
   const STRIP_PROP = ['title', 'additionalProperties'];
   const out = {};
   for (const [k, v] of Object.entries(schema)) {
      if (STRIP_TOP.includes(k)) continue;
      if (k === 'properties' && v && typeof v === 'object') {
         const props = {};
         for (const [pk, pv] of Object.entries(v)) {
            const cleaned = {};
            for (const [fk, fv] of Object.entries(pv)) {
               if (STRIP_PROP.includes(fk)) continue;
               if ((fk === 'anyOf' || fk === 'allOf' || fk === 'oneOf') && Array.isArray(fv)) {
                  cleaned[fk] = fv.map(s => cleanSchema(s));
               } else {
                  cleaned[fk] = fv;
               }
            }
            props[pk] = cleaned;
         }
         out.properties = props;
      } else {
         out[k] = v;
      }
   }
   return out;
}

function getToolFunction(tool) {
   if (!tool || typeof tool !== 'object') return {};
   return tool.type === 'function' && tool.function ? tool.function : tool;
}

function toolAliasKey(value) {
   return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function toQwenToolName(name) {
   if (!name || typeof name !== 'string') return name;
   if (TOOL_NAME_ALIASES[name]) return TOOL_NAME_ALIASES[name];
   if (TOOL_REVERSE_ALIASES[name] || name.startsWith(TOOL_AUTO_PREFIX)) return name;
   return `${TOOL_AUTO_PREFIX}${name}`;
}

function fromQwenToolName(name) {
   if (!name || typeof name !== 'string') return name;
   if (TOOL_REVERSE_ALIASES[name]) return TOOL_REVERSE_ALIASES[name];
   if (name.startsWith(TOOL_AUTO_PREFIX)) return name.slice(TOOL_AUTO_PREFIX.length);
   return name;
}

function buildToolContext(tools) {
   const defs = [];
   const nameMap = new Map();
   const keyMap = new Map();
   if (!Array.isArray(tools)) return { hasTools: false, tools: defs, nameMap, keyMap, qwenNames: [] };

   for (const tool of tools) {
      const fn = getToolFunction(tool);
      const originalName = typeof fn.name === 'string' ? fn.name.trim() : '';
      if (!originalName) continue;

      const qwenName = toQwenToolName(originalName);
      const def = {
         originalName,
         qwenName,
         description: typeof fn.description === 'string' ? fn.description.trim() : '',
         parameters: fn.parameters || fn.input_schema || null
      };
      defs.push(def);

      const aliases = new Set([
         originalName,
         qwenName,
         originalName.toLowerCase(),
         qwenName.toLowerCase(),
         toolAliasKey(originalName),
         toolAliasKey(qwenName)
      ]);
      for (const alias of aliases) {
         if (!alias) continue;
         nameMap.set(alias, originalName);
         keyMap.set(toolAliasKey(alias), originalName);
      }
   }

   return {
      hasTools: defs.length > 0,
      tools: defs,
      nameMap,
      keyMap,
      qwenNames: defs.map(def => def.qwenName)
   };
}

function resolveToolName(name, toolContext) {
   if (!name || typeof name !== 'string') return null;
   const trimmed = name.trim();
   if (!trimmed) return null;
   if (!toolContext?.hasTools) return fromQwenToolName(trimmed);

   const direct = toolContext.nameMap.get(trimmed) || toolContext.nameMap.get(trimmed.toLowerCase());
   if (direct) return direct;

   const keyed = toolContext.keyMap.get(toolAliasKey(trimmed));
   if (keyed) return keyed;

   const reversed = fromQwenToolName(trimmed);
   return toolContext.nameMap.get(reversed) || toolContext.keyMap.get(toolAliasKey(reversed)) || null;
}

function getQwenNameForTool(name, toolContext) {
   const original = resolveToolName(name, toolContext) || name;
   if (toolContext?.hasTools) {
      const match = toolContext.tools.find(tool => tool.originalName === original);
      if (match) return match.qwenName;
   }
   return toQwenToolName(original);
}

function normalizeToolArguments(value) {
   if (value === undefined || value === null) return {};
   if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return {};
      try {
         const parsed = JSON.parse(trimmed);
         return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : { value: parsed };
      } catch (e) {
         return { value };
      }
   }
   if (typeof value === 'object' && !Array.isArray(value)) return value;
   return { value };
}

function stableToolStringify(value) {
   if (value === undefined) return 'undefined';
   if (value === null || typeof value !== 'object') return JSON.stringify(value);
   if (Array.isArray(value)) return `[${value.map(item => stableToolStringify(item)).join(',')}]`;
   const keys = Object.keys(value).sort();
   return `{${keys.map(key => `${JSON.stringify(key)}:${stableToolStringify(value[key])}`).join(',')}}`;
}

function getMessageTextContent(content) {
   if (content === undefined || content === null) return '';
   if (typeof content === 'string') return content;
   if (Array.isArray(content)) {
      return content.map(item => {
         if (typeof item === 'string') return item;
         if (item?.type === 'text') return item.text || '';
         if (item?.text) return item.text;
         return '';
      }).filter(Boolean).join('\n');
   }
   if (typeof content === 'object') return JSON.stringify(content);
   return String(content);
}

function getToolCallSignature(name, args, toolContext) {
   const originalName = resolveToolName(name, toolContext) || fromQwenToolName(name) || name;
   return `${originalName}:${stableToolStringify(normalizeToolArguments(args))}`;
}

function latestMessageRole(messages) {
   if (!Array.isArray(messages) || messages.length === 0) return '';
   return messages[messages.length - 1]?.role || '';
}

function hasPriorToolUse(messages, toolContext = null) {
   if (!Array.isArray(messages)) return false;
   const currentToolIds = new Set();
   const matchesCurrentTool = (name) => !toolContext?.hasTools || !!resolveToolName(name, toolContext);

   return messages.some(msg => {
      if (!msg || typeof msg !== 'object') return false;
      if (msg.role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
         for (const tc of msg.tool_calls) {
            const name = tc.function?.name || tc.name;
            if (name && matchesCurrentTool(name)) {
               if (tc.id) currentToolIds.add(tc.id);
               return true;
            }
         }
         return false;
      }
      if (msg.role === 'assistant' && typeof msg.content === 'string' && hasToolSyntax(msg.content)) {
         return !toolContext?.hasTools || parseToolCalls(msg.content, toolContext).toolCalls.length > 0;
      }
      if (msg.role === 'tool') {
         if (!toolContext?.hasTools) return true;
         if (msg.name && matchesCurrentTool(msg.name)) return true;
         return !!(msg.tool_call_id && currentToolIds.has(msg.tool_call_id));
      }
      return false;
   });
}

function buildRecentToolHistory(messages, toolContext, toolChoice) {
   const history = {
      completed: new Map(),
      skipRepeatGuard: isSpecificToolChoice(toolChoice) || latestMessageRole(messages) !== 'tool'
   };
   if (!Array.isArray(messages)) return history;

   const callsById = new Map();
   for (const msg of messages) {
      if (msg?.role === 'assistant' && Array.isArray(msg.tool_calls)) {
         for (const tc of msg.tool_calls) {
            const name = tc.function?.name || tc.name;
            if (!name) continue;
            const args = tc.function?.arguments ?? tc.arguments ?? {};
            const info = {
               name: resolveToolName(name, toolContext) || fromQwenToolName(name) || name,
               arguments: normalizeToolArguments(args),
               signature: getToolCallSignature(name, args, toolContext)
            };
            if (tc.id) callsById.set(tc.id, info);
         }
      }

      if (msg?.role === 'tool') {
         const call = msg.tool_call_id ? callsById.get(msg.tool_call_id) : null;
         if (!call) continue;
         const result = getMessageTextContent(msg.content);
         history.completed.set(call.signature, {
            ...call,
            resultPreview: result.slice(0, 2000)
         });
      }
   }
   return history;
}

function isSpecificToolChoice(toolChoice) {
   return !!(toolChoice && typeof toolChoice === 'object' && toolChoice.type === 'function' && toolChoice.function?.name);
}

function isAnthropicNoneToolChoice(toolChoice) {
   return !!(toolChoice && typeof toolChoice === 'object' && toolChoice.type === 'none');
}

function normalizeAnthropicToolMessages(messages) {
   const normalized = [];
   if (!Array.isArray(messages)) return normalized;

   for (const msg of messages) {
      if (!msg || typeof msg !== 'object') continue;

      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
         const textParts = [];
         const toolCalls = [];
         for (const block of msg.content) {
            if (!block || typeof block !== 'object') continue;
            if (block.type === 'text' && typeof block.text === 'string') {
               textParts.push(block.text);
            } else if (block.type === 'tool_use') {
               toolCalls.push({
                  id: block.id,
                  type: 'function',
                  function: {
                     name: block.name,
                     arguments: JSON.stringify(normalizeToolArguments(block.input || {}))
                  }
               });
            }
         }
         if (textParts.length || toolCalls.length) {
            normalized.push({
               role: 'assistant',
               content: textParts.join('\n') || null,
               ...(toolCalls.length ? { tool_calls: toolCalls } : {})
            });
         }
         continue;
      }

      if (msg.role === 'user' && Array.isArray(msg.content)) {
         let pendingText = [];
         const flushText = () => {
            if (pendingText.length) normalized.push({ role: 'user', content: pendingText.join('\n') });
            pendingText = [];
         };

         for (const block of msg.content) {
            if (!block || typeof block !== 'object') continue;
            if (block.type === 'text' && typeof block.text === 'string') {
               pendingText.push(block.text);
            } else if (block.type === 'tool_result') {
               flushText();
               normalized.push({
                  role: 'tool',
                  tool_call_id: block.tool_use_id,
                  content: getMessageTextContent(block.content)
               });
            }
         }
         flushText();
         continue;
      }

      normalized.push({
         role: msg.role,
         content: getMessageTextContent(msg.content)
      });
   }

   return normalized;
}

function buildToolReminderPrompt(toolsOrContext) {
   const toolContext = toolsOrContext?.hasTools !== undefined ? toolsOrContext : buildToolContext(toolsOrContext);
   if (!toolContext.hasTools) return '';
   const names = toolContext.qwenNames.map(name => `"${name}"`).join(', ');
   return [
      '# Tool Reminder',
      `Available qwen-safe tool names: ${names} (same definitions as before).`,
      `Call tools using: ${TOOL_CALLS_START}[{"name":"...","arguments":{...}}]${TOOL_CALLS_END}`,
      'These are proxy-parsed text markers, not native tools.',
      'ONLY use these exact qwen-safe tool names. The proxy maps them back to client tool names.',
      'IGNORE any other tool names from prior context.'
   ].join('\n');
}

function buildToolSystemPrompt(toolsOrContext) {
   const toolContext = toolsOrContext?.hasTools !== undefined ? toolsOrContext : buildToolContext(toolsOrContext);
   if (!toolContext.hasTools) return '';

   const defs = toolContext.tools.map(tool => {
      const obj = { name: tool.qwenName };
      if (tool.description) obj.description = tool.description;
      if (tool.parameters) obj.parameters = cleanSchema(tool.parameters);
      return obj;
   });
   const toolNames = defs.map(def => `"${def.name}"`).join(', ');

   return [
      '# Tool Use',
      '',
      `You are operating in an environment where the ONLY qwen-safe tool names available to you are: ${toolNames}.`,
      'These names are proxy-parsed text markers, not native functions. Do NOT use native tool syntax.',
      'These tools ARE available to you right now. NEVER say you lack access to tools or that a tool does not exist.',
      '',
      '## Available Tools',
      '```json',
      JSON.stringify(defs, null, 2),
      '```',
      '',
      '## How to Call a Tool',
      'Whenever a task requires using one of the tools above, output the call in this EXACT format and nothing else:',
      `${TOOL_CALLS_START}`,
      '[{"name":"tool_name","arguments":{...}}]',
      `${TOOL_CALLS_END}`,
      '',
      '## Rules',
      '1. Use ONLY the exact tool names listed above.',
      '2. The "arguments" field MUST be a valid JSON object matching the tool parameter schema.',
      '3. Always include all required parameters.',
      '4. You may call multiple tools at once by placing multiple objects in the same JSON array.',
      '5. If no tool is needed, respond in plain text without tool_calls tags.',
      '6. NEVER wrap the tool call block inside markdown code fences.',
      '7. Output ONLY the tool_calls block when calling tools, no prose before or after.',
      '8. Names like "fs_open_file", "shell_run", or "u_example" are correct proxy names, not native tools.'
   ].join('\n');
}

function safeJsonParse(text) {
   try {
      return { ok: true, value: JSON.parse(String(text || '').trim()) };
   } catch (e) {
      return { ok: false, error: e };
   }
}

function unwrapMarkdownFence(text) {
   const trimmed = String(text || '').trim();
   const match = trimmed.match(/^```(?:json|tool_call)?\s*([\s\S]*?)\s*```$/i);
   return match ? match[1].trim() : trimmed;
}

function repairLooseToolJson(text) {
   return String(text || '')
      .trim()
      .replace(/"name="\s*/g, '"name": ')
      .replace(/"(name|input|arguments|args|parameters)"\s*=\s*/g, '"$1": ');
}

function getToolCallInput(payload) {
   if (!payload || typeof payload !== 'object') return {};
   if (Object.prototype.hasOwnProperty.call(payload, 'input')) return payload.input;
   if (Object.prototype.hasOwnProperty.call(payload, 'arguments')) return payload.arguments;
   if (Object.prototype.hasOwnProperty.call(payload, 'args')) return payload.args;
   if (Object.prototype.hasOwnProperty.call(payload, 'parameters')) return payload.parameters;
   if (Object.prototype.hasOwnProperty.call(payload, 'function.arguments')) return payload['function.arguments'];
   return {};
}

function hasToolInputField(payload) {
   if (!payload || typeof payload !== 'object') return false;
   return Object.prototype.hasOwnProperty.call(payload, 'input')
      || Object.prototype.hasOwnProperty.call(payload, 'arguments')
      || Object.prototype.hasOwnProperty.call(payload, 'args')
      || Object.prototype.hasOwnProperty.call(payload, 'parameters')
      || Object.prototype.hasOwnProperty.call(payload, 'function.arguments');
}

function hasExplicitToolPayloadShape(payload) {
   if (!payload || typeof payload !== 'object') return false;
   if (Array.isArray(payload)) return payload.some(item => hasExplicitToolPayloadShape(item));
   if (Array.isArray(payload.tool_calls)) return payload.tool_calls.some(item => hasExplicitToolPayloadShape(item));
   if (payload.function && typeof payload.function === 'object') return hasExplicitToolPayloadShape(payload.function);
   const name = payload.name || payload['function.name'];
   return typeof name === 'string' && name.trim() && hasToolInputField(payload);
}

function extractCallsFromPayload(payload, toolContext, options = {}) {
   const valid = [];
   const invalid = [];

   const visit = (item) => {
      if (!item || typeof item !== 'object') return;
      if (item.function && typeof item.function === 'object') {
         visit(item.function);
         return;
      }
      if (Array.isArray(item.tool_calls)) {
         item.tool_calls.forEach(visit);
         return;
      }
      const name = item.name || item['function.name'];
      if (typeof name !== 'string' || !name.trim()) return;
      if (options.requireInputField && !hasToolInputField(item)) return;
      const originalName = resolveToolName(name, toolContext);
      if (!originalName) {
         invalid.push({ name, reason: 'unknown_tool_name' });
         return;
      }
      valid.push({
         name: originalName,
         arguments: normalizeToolArguments(getToolCallInput(item))
      });
   };

   if (Array.isArray(payload)) payload.forEach(visit);
   else visit(payload);

   return { valid, invalid };
}

function removeRanges(text, ranges) {
   if (!ranges.length) return String(text || '').trim();
   const sorted = ranges.slice().sort((a, b) => a[0] - b[0]);
   let out = '';
   let cursor = 0;
   for (const [start, end] of sorted) {
      if (start < cursor) continue;
      out += text.slice(cursor, start);
      cursor = end;
   }
   out += text.slice(cursor);
   return out.trim();
}

function addParsedToolPayload(raw, range, source, toolContext, state, options = {}) {
   const unwrapped = unwrapMarkdownFence(raw);
   let parsed = safeJsonParse(unwrapped);
   if (!parsed.ok) parsed = safeJsonParse(repairLooseToolJson(unwrapped));
   if (!parsed.ok) {
      state.invalidToolCalls.push({ source, reason: 'malformed_json' });
      if (range) state.ranges.push(range);
      state.sawToolSyntax = true;
      return;
   }

   if (options.requireExplicitToolShape && !hasExplicitToolPayloadShape(parsed.value)) return;

   const { valid, invalid } = extractCallsFromPayload(parsed.value, toolContext, options);
   if (valid.length > 0) state.toolCalls.push(...valid);
   if (range && (valid.length > 0 || invalid.length > 0)) state.ranges.push(range);
   if (invalid.length > 0) state.invalidToolCalls.push(...invalid.map(item => ({ ...item, source })));
   if (valid.length > 0 || invalid.length > 0) state.sawToolSyntax = true;
}

function collectRegexToolBlocks(text, regex, source, toolContext, state) {
   let match;
   while ((match = regex.exec(text)) !== null) {
      addParsedToolPayload(match[1], [match.index, match.index + match[0].length], source, toolContext, state);
   }
}

function findFirstJsonObject(text, startAt = 0) {
   const start = text.indexOf('{', startAt);
   if (start === -1) return null;
   let depth = 0;
   let inString = false;
   let escape = false;
   for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
         depth--;
         if (depth === 0) return { raw: text.slice(start, i + 1), start, end: i + 1 };
      }
   }
   return null;
}

function countTextOccurrences(text, needle) {
   if (!needle) return 0;
   let count = 0;
   let index = 0;
   while ((index = text.indexOf(needle, index)) !== -1) {
      count++;
      index += needle.length;
   }
   return count;
}

function isProbablyIncompleteJson(text) {
   const trimmed = String(text || '').trim();
   if (!/^[\[{]/.test(trimmed) || !/"(?:tool_calls|function|function\.name|arguments|input|args|parameters|function\.arguments)"\s*:/.test(trimmed)) return false;
   if (safeJsonParse(trimmed).ok) return false;
   const stack = [];
   let inString = false;
   let escape = false;
   for (const ch of trimmed) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{' || ch === '[') stack.push(ch);
      if (ch === '}' || ch === ']') {
         const open = stack.pop();
         if ((ch === '}' && open !== '{') || (ch === ']' && open !== '[')) return false;
      }
   }
   return inString || stack.length > 0 || /[:,]\s*$/.test(trimmed);
}

function detectIncompleteToolSyntax(text) {
   const value = String(text || '');
   const lower = value.toLowerCase();
   if (countTextOccurrences(lower, TOOL_CALLS_START) > countTextOccurrences(lower, TOOL_CALLS_END)) return { reason: 'incomplete_tool_call', source: 'xml_tool_calls' };
   if (countTextOccurrences(lower, TOOL_CALL_START) > countTextOccurrences(lower, TOOL_CALL_END)) return { reason: 'incomplete_tool_call', source: 'xml_tool_call' };
   if (countTextOccurrences(lower, TOOL_MARKER_START.toLowerCase()) > countTextOccurrences(lower, TOOL_MARKER_END.toLowerCase())) return { reason: 'incomplete_tool_call', source: 'marker_tool_call' };
   const fenceStart = value.search(/```tool_call\b/i);
   if (fenceStart !== -1 && value.indexOf('```', fenceStart + 3) === -1) return { reason: 'incomplete_tool_call', source: 'fenced_tool_call' };
   if (isProbablyIncompleteJson(unwrapMarkdownFence(value))) return { reason: 'incomplete_tool_call', source: 'json_tool_call' };
   return null;
}

function hasToolSyntax(text) {
   const value = String(text || '');
   const lower = value.toLowerCase();
   return lower.includes(TOOL_CALLS_START)
      || lower.includes(TOOL_CALL_START)
      || lower.includes(TOOL_MARKER_START.toLowerCase())
      || lower.includes('```tool_call')
      || lower.includes('"tool_calls"')
      || lower.includes('function.name')
      || TOOL_REFUSAL_RE.test(value);
}

function parseToolCalls(text, toolContext = null) {
   const sourceText = String(text || '');
   const allowFallbackJson = !!toolContext?.hasTools;
   const state = {
      toolCalls: [],
      invalidToolCalls: [],
      ranges: [],
      sawToolSyntax: hasToolSyntax(sourceText)
   };

   collectRegexToolBlocks(sourceText, /<tool_calls>\s*([\s\S]*?)\s*<\/tool_calls>/gi, 'xml_tool_calls', toolContext, state);
   collectRegexToolBlocks(sourceText, /##TOOL_CALL##\s*([\s\S]*?)\s*##END_CALL##/gi, 'marker_tool_call', toolContext, state);
   collectRegexToolBlocks(sourceText, /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi, 'xml_tool_call', toolContext, state);
   collectRegexToolBlocks(sourceText, /```tool_call\s*([\s\S]*?)```/gi, 'fenced_tool_call', toolContext, state);

   if (state.toolCalls.length === 0 && allowFallbackJson) {
      const trimmed = unwrapMarkdownFence(sourceText);
      const parsed = safeJsonParse(trimmed);
      if (parsed.ok && hasExplicitToolPayloadShape(parsed.value)) {
         const before = state.toolCalls.length;
         const { valid, invalid } = extractCallsFromPayload(parsed.value, toolContext, { requireInputField: true });
         state.toolCalls.push(...valid);
         state.invalidToolCalls.push(...invalid.map(item => ({ ...item, source: 'bare_json' })));
         if (state.toolCalls.length > before || invalid.length > 0) state.ranges.push([0, sourceText.length]);
         if (valid.length || invalid.length) state.sawToolSyntax = true;
      }
   }

   if (state.toolCalls.length === 0 && allowFallbackJson) {
      const firstObj = findFirstJsonObject(sourceText);
      if (firstObj && /"name"\s*:|"tool_calls"\s*:|"function"\s*:|"function\.name"\s*:/.test(firstObj.raw)) {
         addParsedToolPayload(firstObj.raw, [firstObj.start, firstObj.end], 'embedded_json', toolContext, state, {
            requireExplicitToolShape: true,
            requireInputField: true
         });
      }
   }

   if (state.toolCalls.length === 0 && /function\.name\s*:/i.test(sourceText)) {
      const nameMatch = sourceText.match(/function\.name\s*:\s*([^\n]+)/i);
      const argsMatch = sourceText.match(/function\.arguments\s*:\s*([\s\S]+)/i);
      if (nameMatch) {
         addParsedToolPayload(JSON.stringify({
            name: nameMatch[1].trim(),
            arguments: argsMatch ? argsMatch[1].trim() : {}
         }), [0, sourceText.length], 'textkv', toolContext, state);
      }
   }

   return {
      toolCalls: state.toolCalls,
      textContent: removeRanges(sourceText, state.ranges),
      invalidToolCalls: state.invalidToolCalls,
      sawToolSyntax: state.sawToolSyntax
   };
}

function detectRepeatedToolCallIssue(toolCalls, recentToolHistory, toolContext) {
   if (!recentToolHistory || recentToolHistory.skipRepeatGuard || !recentToolHistory.completed?.size) return null;
   if (!Array.isArray(toolCalls) || toolCalls.length !== 1) return null;
   const call = toolCalls[0];
   const signature = getToolCallSignature(call.name, call.arguments, toolContext);
   const previous = recentToolHistory.completed.get(signature);
   if (!previous) return null;
   return {
      reason: 'repeated_same_tool_call',
      toolName: call.name,
      arguments: call.arguments,
      resultPreview: previous.resultPreview
   };
}

function detectToolOutputIssue(content, parsed, recentToolHistory = null, toolContext = null) {
   const repeated = detectRepeatedToolCallIssue(parsed.toolCalls, recentToolHistory, toolContext);
   if (repeated) return repeated;
   if (parsed.toolCalls.length > 0) return null;
   const incomplete = detectIncompleteToolSyntax(content);
   if (incomplete) return incomplete;
   const refusal = String(content || '').match(TOOL_REFUSAL_RE);
   if (refusal) return { reason: 'blocked_tool_name', toolName: refusal[1] };
   if (parsed.invalidToolCalls.length > 0) return parsed.invalidToolCalls[0];
   if (parsed.sawToolSyntax) return { reason: 'malformed_tool_call' };
   return null;
}

function buildToolCorrectionPrompt(issue, toolContext) {
   const toolNames = (toolContext?.qwenNames || []).map(name => `"${name}"`).join(', ');
   const reason = issue?.reason || 'invalid_tool_output';
   if (reason === 'repeated_same_tool_call') {
      const qwenToolName = getQwenNameForTool(issue.toolName, toolContext);
      return [
         '# Tool Loop Correction',
         `You already called "${qwenToolName}" with the same arguments and received a tool result.`,
         'Do NOT call that same tool again with the same arguments.',
         issue.resultPreview ? `Recent tool result:\n${issue.resultPreview}` : '',
         'Use the existing tool result to answer the user in plain text.',
         `Do not output ${TOOL_CALLS_START} or any other tool-call marker unless a different tool or different arguments are genuinely required.`
      ].filter(Boolean).join('\n');
   }
   if (reason === 'incomplete_tool_call') {
      return [
         '# Tool Call Truncation Recovery',
         'Your previous tool call was cut off or incomplete.',
         `Available qwen-safe tool names: ${toolNames}.`,
         'Re-emit the complete intended tool call from scratch.',
         'Output ONLY one complete valid tool call block in this exact format, with no prose:',
         `${TOOL_CALLS_START}`,
         '[{"name":"tool_name","arguments":{"param":"value"}}]',
         `${TOOL_CALLS_END}`,
         'Use only a listed qwen-safe tool name.'
      ].join('\n');
   }
   return [
      '# Tool Format Correction',
      `Your previous output was invalid (${reason}).`,
      `Available qwen-safe tool names: ${toolNames}.`,
      'These are proxy text markers, not native tools.',
      'Output ONLY one valid tool call block in this exact format, with no prose:',
      `${TOOL_CALLS_START}`,
      '[{"name":"tool_name","arguments":{"param":"value"}}]',
      `${TOOL_CALLS_END}`,
      'Use only a listed qwen-safe tool name.'
   ].join('\n');
}

function buildToolResultFromJimmyRaw(raw, toolContext, recentToolHistory = null) {
   const parsed = parseJimmyResponse(raw);
   const toolParsed = parseToolCalls(parsed.content, toolContext);
   return {
      raw,
      stats: parsed.stats,
      content: parsed.content,
      ...toolParsed,
      issue: detectToolOutputIssue(parsed.content, toolParsed, recentToolHistory, toolContext)
   };
}

function suppressRepeatedToolCallLoop(toolResult) {
   if (toolResult.issue?.reason !== 'repeated_same_tool_call') return toolResult;
   const fallbackText = [
      toolResult.textContent,
      !toolResult.textContent && toolResult.issue.resultPreview
         ? `Previous tool result:\n${toolResult.issue.resultPreview}`
         : ''
   ].filter(Boolean).join('\n\n');
   return {
      ...toolResult,
      toolCalls: [],
      textContent: fallbackText,
      issue: null
   };
}

function applyToolCorrectionToJimmyRequest(upstreamRequest, issue, toolContext) {
   const retryRequest = JSON.parse(JSON.stringify(upstreamRequest));
   const correction = buildToolCorrectionPrompt(issue, toolContext);
   if (!Array.isArray(retryRequest.messages) || retryRequest.messages.length === 0) return retryRequest;
   const lastIndex = retryRequest.messages.length - 1;
   retryRequest.messages[lastIndex] = {
      ...retryRequest.messages[lastIndex],
      content: `${correction}\n\n${retryRequest.messages[lastIndex].content || ''}`
   };
   return retryRequest;
}

function corsHeaders() {
   return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
   };
}

function json(status, data, extraHeaders) {
   return new Response(JSON.stringify(data), {
      status,
      headers: {
         'Content-Type': 'application/json; charset=utf-8',
         ...corsHeaders(),
         ...(extraHeaders || {})
      }
   });
}

function checkAuth(req) {
   const auth = req.headers.get('authorization') || '';
   const actual = auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth.trim();
   if (actual.startsWith('tarun-')) return null;

   return json(401, {
      error: {
         message: 'Invalid API key',
         type: 'invalid_api_key',
         code: 'invalid_api_key'
      }
   });
}

function parseJimmyResponse(raw) {
   raw = (raw || '').replace(THINK_RE, '');
   const statsStart = raw.lastIndexOf(STATS_START);
   const statsEnd = raw.lastIndexOf(STATS_END);

   if (statsStart === -1 || statsEnd === -1 || statsEnd < statsStart) {
      const alt = raw.match(/<stats>([\s\S]*?)<\/stats>/);
      if (!alt) return { content: raw, stats: null };

      let stats = null;
      try {
         stats = JSON.parse(alt[1]);
      } catch (e) {
         // Ignore parse errors.
      }

      return {
         content: raw.replace(/<stats>[\s\S]*?<\/stats>/, ''),
         stats
      };
   }

   let stats = null;
   try {
      stats = JSON.parse(raw.slice(statsStart + STATS_START.length, statsEnd));
   } catch (e) {
      // Ignore parse errors.
   }

   return {
      content: raw.slice(0, statsStart) + raw.slice(statsEnd + STATS_END.length),
      stats
   };
}

function buildUsage(stats) {
   return {
      prompt_tokens: stats?.prefill_tokens || 0,
      completion_tokens: stats?.decode_tokens || 0,
      total_tokens: stats?.total_tokens || 0,
      prompt_processing_speed: Math.round(stats?.prefill_rate || 0),
      generation_speed: Math.round(stats?.decode_rate || 0),
      time_to_first_token_ms: Math.round((stats?.ttft || 0) * 1000),
      total_generation_time_ms: Math.round((stats?.total_duration || 0) * 1000),
      total_request_time_ms: Math.round((stats?.total_time || 0) * 1000),
      roundtrip_time_ms: Math.round(stats?.roundtrip_time || 0)
   };
}

function anthropicError(status, message) {
   return {
      status,
      body: {
         type: 'error',
         error: {
            type: 'invalid_request_error',
            message
         }
      }
   };
}

function openAIError(status, message, code, type) {
   return {
      status,
      body: {
         error: {
            message,
            type: type || 'invalid_request_error',
            ...(code ? { code } : {})
         }
      }
   };
}

function getOpenAIStopReason(stats) {
   const reason = String(stats?.done_reason || stats?.reason || 'stop').toLowerCase();
   if (reason.includes('length') || reason.includes('max')) return 'length';
   return 'stop';
}

function getAnthropicStopReason(stats) {
   const reason = String(stats?.done_reason || stats?.reason || 'stop').toLowerCase();
   if (reason.includes('length') || reason.includes('max')) return 'max_tokens';
   if (reason.includes('stop_sequence')) return 'stop_sequence';
   return 'end_turn';
}

function openAIStreamError(message, model, code, type) {
   return new Response(
      `data: ${JSON.stringify({
         id: 'chatcmpl-' + Math.random().toString(36).substring(2, 10),
         object: 'chat.completion.chunk',
         created: Math.floor(Date.now() / 1000),
         model: model || DEFAULT_MODEL,
         choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
         error: { message, type: type || 'invalid_request_error', ...(code ? { code } : {}) }
      })}\n\ndata: [DONE]\n\n`,
      {
         status: 200,
         headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...corsHeaders()
         }
      }
   );
}

function anthropicStreamError(message) {
   return new Response(
      `event: error\ndata: ${JSON.stringify({
         type: 'error',
         error: {
            type: 'api_error',
            message
         }
      })}\n\n`,
      {
         status: 200,
         headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...corsHeaders()
         }
      }
   );
}

async function fetchUpstream(url, init) {
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

   try {
      return await fetch(url, { ...init, signal: controller.signal });
   } finally {
      clearTimeout(timeout);
   }
}

async function collectToolResultWithRetry(firstResponse, upstreamRequest, sendUpstream, toolState) {
   let raw = await firstResponse.text();
   let toolResult = buildToolResultFromJimmyRaw(raw, toolState.toolContext, toolState.recentToolHistory);

   for (let retryAttempt = 0; retryAttempt < TOOL_OUTPUT_RETRY_LIMIT && toolResult.issue; retryAttempt++) {
      const retryRequest = applyToolCorrectionToJimmyRequest(upstreamRequest, toolResult.issue, toolState.toolContext);
      const retryResponse = await sendUpstream(retryRequest);
      if (!retryResponse.ok) break;
      raw = await retryResponse.text();
      toolResult = buildToolResultFromJimmyRaw(raw, toolState.toolContext, toolState.recentToolHistory);
   }

   return suppressRepeatedToolCallLoop(toolResult);
}

function formatOpenAIToolResponse(toolResult, requestModel) {
   const hasToolCalls = toolResult.toolCalls.length > 0;
   const message = { role: 'assistant', content: toolResult.textContent || null };
   if (hasToolCalls) {
      message.tool_calls = toolResult.toolCalls.map((tc) => ({
         id: `call_${Math.random().toString(36).substring(2, 11)}`,
         type: 'function',
         function: {
            name: tc.name,
            arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments || {})
         }
      }));
   }

   return json(200, {
      id: 'chatcmpl-' + Math.random().toString(36).substring(2, 10),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: requestModel,
      choices: [{
         index: 0,
         message,
         finish_reason: hasToolCalls ? 'tool_calls' : getOpenAIStopReason(toolResult.stats)
      }],
      usage: buildUsage(toolResult.stats)
   });
}

function createOpenAIToolStream(toolResult, requestModel, includeUsage) {
   const { readable, writable } = new TransformStream();
   const writer = writable.getWriter();
   const encoder = new TextEncoder();
   const id = 'chatcmpl-' + Math.random().toString(36).substring(2, 10);
   const created = Math.floor(Date.now() / 1000);
   const hasToolCalls = toolResult.toolCalls.length > 0;

   const writeChunk = async (data) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
   };

   (async () => {
      try {
         await writeChunk({
            id, object: 'chat.completion.chunk', created, model: requestModel,
            choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
         });

         if (toolResult.textContent) {
            await writeChunk({
               id, object: 'chat.completion.chunk', created, model: requestModel,
               choices: [{ index: 0, delta: { content: toolResult.textContent }, finish_reason: null }]
            });
         }

         for (let i = 0; i < toolResult.toolCalls.length; i++) {
            const tc = toolResult.toolCalls[i];
            await writeChunk({
               id, object: 'chat.completion.chunk', created, model: requestModel,
               choices: [{
                  index: 0,
                  delta: {
                     tool_calls: [{
                        index: i,
                        id: `call_${Math.random().toString(36).substring(2, 11)}`,
                        type: 'function',
                        function: {
                           name: tc.name,
                           arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments || {})
                        }
                     }]
                  },
                  finish_reason: null
               }]
            });
         }

         await writeChunk({
            id, object: 'chat.completion.chunk', created, model: requestModel,
            choices: [{ index: 0, delta: {}, finish_reason: hasToolCalls ? 'tool_calls' : getOpenAIStopReason(toolResult.stats) }]
         });

         if (includeUsage && toolResult.stats) {
            await writeChunk({ id, object: 'chat.completion.chunk', created, model: requestModel, choices: [], usage: buildUsage(toolResult.stats) });
         }

         await writer.write(encoder.encode('data: [DONE]\n\n'));
      } finally {
         await writer.close();
      }
   })();

   return new Response(readable, {
      headers: {
         'Content-Type': 'text/event-stream; charset=utf-8',
         'Cache-Control': 'no-cache',
         'Connection': 'keep-alive',
         ...corsHeaders()
      }
   });
}

function formatAnthropicToolResponse(toolResult, requestModel) {
   const contentBlocks = [];
   if (toolResult.textContent) contentBlocks.push({ type: 'text', text: toolResult.textContent });
   for (const tc of toolResult.toolCalls) {
      contentBlocks.push({
         type: 'tool_use',
         id: `toolu_${Math.random().toString(36).substring(2, 14)}`,
         name: tc.name,
         input: normalizeToolArguments(tc.arguments)
      });
   }
   if (contentBlocks.length === 0) contentBlocks.push({ type: 'text', text: '' });

   return json(200, {
      id: `msg_${Math.random().toString(36).substring(2, 14)}`,
      type: 'message',
      role: 'assistant',
      model: requestModel,
      content: contentBlocks,
      stop_reason: toolResult.toolCalls.length > 0 ? 'tool_use' : getAnthropicStopReason(toolResult.stats),
      stop_sequence: null,
      usage: {
         input_tokens: toolResult.stats?.prefill_tokens || 0,
         output_tokens: toolResult.stats?.decode_tokens || 0,
         ...buildUsage(toolResult.stats)
      }
   });
}

function createAnthropicToolStream(toolResult, requestModel) {
   const { readable, writable } = new TransformStream();
   const writer = writable.getWriter();
   const encoder = new TextEncoder();
   const id = `msg_${Math.random().toString(36).substring(2, 14)}`;
   const hasToolCalls = toolResult.toolCalls.length > 0;

   const writeEvent = async (event, data) => {
      await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
   };

   (async () => {
      try {
         await writeEvent('message_start', {
            type: 'message_start',
            message: {
               id,
               type: 'message',
               role: 'assistant',
               model: requestModel,
               content: [],
               stop_reason: null,
               stop_sequence: null,
               usage: { input_tokens: 0, output_tokens: 0 }
            }
         });

         let blockIndex = 0;
         if (toolResult.textContent) {
            await writeEvent('content_block_start', { type: 'content_block_start', index: blockIndex, content_block: { type: 'text', text: '' } });
            await writeEvent('content_block_delta', { type: 'content_block_delta', index: blockIndex, delta: { type: 'text_delta', text: toolResult.textContent } });
            await writeEvent('content_block_stop', { type: 'content_block_stop', index: blockIndex });
            blockIndex++;
         }

         for (const tc of toolResult.toolCalls) {
            await writeEvent('content_block_start', {
               type: 'content_block_start',
               index: blockIndex,
               content_block: { type: 'tool_use', id: `toolu_${Math.random().toString(36).substring(2, 14)}`, name: tc.name, input: {} }
            });
            await writeEvent('content_block_delta', {
               type: 'content_block_delta',
               index: blockIndex,
               delta: { type: 'input_json_delta', partial_json: JSON.stringify(normalizeToolArguments(tc.arguments)) }
            });
            await writeEvent('content_block_stop', { type: 'content_block_stop', index: blockIndex });
            blockIndex++;
         }

         if (blockIndex === 0) {
            await writeEvent('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
            await writeEvent('content_block_stop', { type: 'content_block_stop', index: 0 });
         }

         await writeEvent('message_delta', {
            type: 'message_delta',
            delta: { stop_reason: hasToolCalls ? 'tool_use' : getAnthropicStopReason(toolResult.stats), stop_sequence: null },
            usage: {
               input_tokens: toolResult.stats?.prefill_tokens || 0,
               output_tokens: toolResult.stats?.decode_tokens || 0,
               ...buildUsage(toolResult.stats)
            }
         });
         await writeEvent('message_stop', { type: 'message_stop' });
      } finally {
         await writer.close();
      }
   })();

   return new Response(readable, {
      headers: {
         'Content-Type': 'text/event-stream; charset=utf-8',
         'Cache-Control': 'no-cache',
         'Connection': 'keep-alive',
         ...corsHeaders()
      }
   });
}

async function pumpJimmyTextStream(upstreamResponse, onText) {
   const reader = upstreamResponse.body.getReader();
   const decoder = new TextDecoder();
   const markerLookbehind = Math.max(STATS_START.length, THINK_START.length, TOOL_CALLS_START.length) - 1;
   let buffer = '';
   let stats = null;

   while (true) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });

      while (true) {
         const statsStart = buffer.indexOf(STATS_START);
         const thinkStart = buffer.indexOf(THINK_START);
         let markerStart = -1;
         let markerType = '';

         const candidates = [
            statsStart !== -1 ? [statsStart, 'stats'] : null,
            thinkStart !== -1 ? [thinkStart, 'think'] : null
         ].filter(Boolean).sort((a, b) => a[0] - b[0]);

         if (candidates.length > 0) {
            markerStart = candidates[0][0];
            markerType = candidates[0][1];
         }

         if (markerStart === -1) break;

         if (markerStart > 0) {
            await onText(buffer.slice(0, markerStart));
            buffer = buffer.slice(markerStart);
         }

         if (markerType === 'think') {
            const thinkEnd = buffer.indexOf(THINK_END, THINK_START.length);
            if (thinkEnd === -1) break;
            buffer = buffer.slice(thinkEnd + THINK_END.length);
            continue;
         }

         const statsEnd = buffer.indexOf(STATS_END, STATS_START.length);
         if (statsEnd === -1) break;

         try {
            stats = JSON.parse(buffer.slice(STATS_START.length, statsEnd));
         } catch (e) {
            // Ignore parse errors.
         }

         buffer = buffer.slice(statsEnd + STATS_END.length);
      }

      const noMarkers = buffer.indexOf(STATS_START) === -1 && buffer.indexOf(THINK_START) === -1;
      if (!done && noMarkers && buffer.length > markerLookbehind) {
         const safeChunk = buffer.slice(0, buffer.length - markerLookbehind);
         buffer = buffer.slice(buffer.length - markerLookbehind);
         if (safeChunk) await onText(safeChunk);
      }

      if (done) {
         buffer += decoder.decode();
         const parsed = parseJimmyResponse(buffer);
         if (parsed.stats) stats = parsed.stats;
         if (parsed.content) await onText(parsed.content);
         return stats;
      }
   }
}

function handleOpenAIStreamingResponse(upstreamResponse, requestModel, includeUsage) {
   const { readable, writable } = new TransformStream();
   const writer = writable.getWriter();
   const encoder = new TextEncoder();
   const id = 'chatcmpl-' + Math.random().toString(36).substring(2, 10);
   const created = Math.floor(Date.now() / 1000);

   const writeChunk = async (data) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
   };

   (async () => {
      try {
         let sentRole = false;

         const sendRole = async () => {
            if (sentRole) return;
            sentRole = true;
            await writeChunk({
               id, object: 'chat.completion.chunk', created, model: requestModel,
               choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
            });
         };

         await sendRole();
         const stats = await pumpJimmyTextStream(upstreamResponse, async (text) => {
            if (!text) return;
            await sendRole();
            await writeChunk({
               id, object: 'chat.completion.chunk', created, model: requestModel,
               choices: [{ index: 0, delta: { content: text }, finish_reason: null }]
            });
         });

         await writeChunk({
            id, object: 'chat.completion.chunk', created, model: requestModel,
            choices: [{ index: 0, delta: {}, finish_reason: getOpenAIStopReason(stats) }]
         });

         if (includeUsage && stats) {
            await writeChunk({
               id, object: 'chat.completion.chunk', created, model: requestModel,
               choices: [], usage: buildUsage(stats)
            });
         }

         await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
         await writeChunk({
            id, object: 'chat.completion.chunk', created, model: requestModel,
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
            error: { message: error.message || 'Streaming error', type: 'api_error', code: 'stream_error' }
         });
         await writer.write(encoder.encode('data: [DONE]\n\n'));
      } finally {
         await writer.close();
      }
   })();

   return new Response(readable, {
      headers: {
         'Content-Type': 'text/event-stream; charset=utf-8',
         'Cache-Control': 'no-cache',
         'Connection': 'keep-alive',
         ...corsHeaders()
      }
   });
}

async function handleOpenAINonStreamingResponse(upstreamResponse, requestModel, hasTools) {
   const raw = await upstreamResponse.text();
   const parsed = parseJimmyResponse(raw);

   const { toolCalls, textContent } = hasTools ? parseToolCalls(parsed.content) : { toolCalls: [], textContent: parsed.content };
   const hasToolCalls = toolCalls.length > 0;

   const message = { role: 'assistant', content: textContent || null };
   if (hasToolCalls) {
      message.tool_calls = toolCalls.map((tc, i) => ({
         id: `call_${Math.random().toString(36).substring(2, 11)}`,
         type: 'function',
         function: {
            name: tc.name,
            arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments)
         }
      }));
   }

   const response = {
      id: 'chatcmpl-' + Math.random().toString(36).substring(2, 10),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: requestModel,
      choices: [{
         index: 0,
         message,
         finish_reason: hasToolCalls ? 'tool_calls' : getOpenAIStopReason(parsed.stats)
      }],
      usage: buildUsage(parsed.stats)
   };

   return json(200, response);
}

function handleAnthropicStreamingResponse(upstreamResponse, requestModel) {
   const { readable, writable } = new TransformStream();
   const writer = writable.getWriter();
   const encoder = new TextEncoder();
   const id = `msg_${Math.random().toString(36).substring(2, 14)}`;

   (async () => {
      try {
         let messageStartSent = false;
         let textBlockStarted = false;

         const writeEvent = async (event, data) => {
            await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
         };

         const sendMessageStart = async () => {
            if (messageStartSent) return;
            messageStartSent = true;
            await writeEvent('message_start', {
               type: 'message_start',
               message: {
                  id,
                  type: 'message',
                  role: 'assistant',
                  model: requestModel,
                  content: [],
                  stop_reason: null,
                  stop_sequence: null,
                  usage: { input_tokens: 0, output_tokens: 0 }
               }
            });
         };

         const startTextBlock = async () => {
            if (textBlockStarted) return;
            textBlockStarted = true;
            await sendMessageStart();
            await writeEvent('content_block_start', {
               type: 'content_block_start',
               index: 0,
               content_block: { type: 'text', text: '' }
            });
         };

         await startTextBlock();
         const stats = await pumpJimmyTextStream(upstreamResponse, async (text) => {
            if (!text) return;
            await startTextBlock();
            await writeEvent('content_block_delta', {
               type: 'content_block_delta',
               index: 0,
               delta: { type: 'text_delta', text }
            });
         });

         await writeEvent('content_block_stop', {
            type: 'content_block_stop',
            index: 0
         });

         await writeEvent('message_delta', {
            type: 'message_delta',
            delta: {
               stop_reason: getAnthropicStopReason(stats),
               stop_sequence: null
            },
            usage: {
               input_tokens: stats?.prefill_tokens || 0,
               output_tokens: stats?.decode_tokens || 0,
               ...buildUsage(stats)
            }
         });

         await writeEvent('message_stop', { type: 'message_stop' });
      } catch (error) {
         const errorResponse = anthropicStreamError(error.message || 'Streaming error');
         await writer.write(encoder.encode(await errorResponse.text()));
      } finally {
         await writer.close();
      }
   })();

   return new Response(readable, {
      headers: {
         'Content-Type': 'text/event-stream; charset=utf-8',
         'Cache-Control': 'no-cache',
         'Connection': 'keep-alive',
         ...corsHeaders()
      }
   });
}

async function handleAnthropicNonStreamingResponse(upstreamResponse, requestModel, hasTools) {
   const raw = await upstreamResponse.text();
   const parsed = parseJimmyResponse(raw);

   const { toolCalls, textContent } = hasTools ? parseToolCalls(parsed.content) : { toolCalls: [], textContent: parsed.content };
   const hasToolCalls = toolCalls.length > 0;

   const contentBlocks = [];
   if (textContent) {
      contentBlocks.push({ type: 'text', text: textContent });
   }
   if (hasToolCalls) {
      for (const tc of toolCalls) {
         contentBlocks.push({
            type: 'tool_use',
            id: `toolu_${Math.random().toString(36).substring(2, 14)}`,
            name: tc.name,
            input: typeof tc.arguments === 'string' ? (() => { try { return JSON.parse(tc.arguments); } catch (_) { return {}; } })() : tc.arguments
         });
      }
   }
   if (contentBlocks.length === 0) {
      contentBlocks.push({ type: 'text', text: '' });
   }

   return json(200, {
      id: `msg_${Math.random().toString(36).substring(2, 14)}`,
      type: 'message',
      role: 'assistant',
      model: requestModel,
      content: contentBlocks,
      stop_reason: hasToolCalls ? 'tool_use' : getAnthropicStopReason(parsed.stats),
      stop_sequence: null,
      usage: {
         input_tokens: parsed.stats?.prefill_tokens || 0,
         output_tokens: parsed.stats?.decode_tokens || 0,
         ...buildUsage(parsed.stats)
      }
   });
}

async function handleOpenAIChatCompletions(req) {
   const authError = checkAuth(req);
   if (authError) return authError;

   let rawBody = '';
   let body = null;

   try {
      rawBody = await req.text();
      const bodyBytes = new TextEncoder().encode(rawBody).length;
      if (bodyBytes > DEFAULT_MAX_BODY_BYTES) {
         return json(413, {
            error: {
               message: `Request body exceeds ${DEFAULT_MAX_BODY_BYTES} bytes`,
               type: 'invalid_request_error',
               code: 'body_too_large'
            }
         });
      }
      body = rawBody ? JSON.parse(rawBody) : {};
   } catch (error) {
      return json(400, { error: { message: 'Invalid JSON body', type: 'invalid_request_error' } });
   }

   const chatOptions = body?.chatOptions && typeof body.chatOptions === 'object' ? body.chatOptions : {};
   const model = typeof body?.model === 'string' && body.model.trim()
      ? body.model.trim()
      : typeof chatOptions.selectedModel === 'string' && chatOptions.selectedModel.trim()
         ? chatOptions.selectedModel.trim()
         : DEFAULT_MODEL;
   const stream = body?.stream === true;

   const fail = (status, message, code, type) => {
      if (stream) return openAIStreamError(message, model, code, type);
      const e = openAIError(status, message, code, type);
      return json(e.status, e.body);
   };

   try {
      if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'Request body must be a JSON object');
      if (!Array.isArray(body.messages) || body.messages.length === 0) return fail(400, 'messages array is required');
      if (body.stream !== undefined && typeof body.stream !== 'boolean') return fail(400, 'stream must be a boolean');
      const toolContext = buildToolContext(body.tools);
      const toolsProvided = toolContext.hasTools;
      const rawToolMessages = JSON.parse(JSON.stringify(body.messages));
      const rawToolChoice = body.tool_choice;
      const isFirstToolTurn = !hasPriorToolUse(rawToolMessages, toolContext);
      const toolState = {
         hasTools: toolsProvided && rawToolChoice !== 'none',
         toolContext,
         recentToolHistory: buildRecentToolHistory(rawToolMessages, toolContext, rawToolChoice)
      };
      if (body.temperature !== undefined && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2)) return fail(400, 'temperature must be a number between 0 and 2');
      if (body.top_p !== undefined && (typeof body.top_p !== 'number' || body.top_p < 0 || body.top_p > 1)) return fail(400, 'top_p must be a number between 0 and 1');
      if (body.max_tokens !== undefined && (typeof body.max_tokens !== 'number' || body.max_tokens < 1)) return fail(400, 'max_tokens must be a positive integer');

      const topKValue = body.top_k ?? body.topK ?? chatOptions.topK ?? DEFAULT_TOP_K;
      const parsedTopK = Number.parseInt(String(topKValue), 10);
      if (!Number.isFinite(parsedTopK) || parsedTopK < 1) return fail(400, 'top_k/topK must be a positive integer');

      // Resolve tool names from tool_call_id before messages get modified
      if (toolsProvided && Array.isArray(body.messages)) {
         for (let i = 0; i < body.messages.length; i++) {
            const msg = body.messages[i];
            if (msg.role === 'tool' && !msg.name && msg.tool_call_id) {
               for (let j = i - 1; j >= 0; j--) {
                  const prev = body.messages[j];
                  if (prev.role === 'assistant' && Array.isArray(prev.tool_calls)) {
                     const match = prev.tool_calls.find(tc => tc.id === msg.tool_call_id);
                     if (match) { msg.name = match.function?.name || match.name; break; }
                  }
               }
            }
         }
      }

      const systemPrompts = [];
      let attachment = body.attachment && typeof body.attachment === 'object' ? body.attachment : null;
      const chatMessages = [];

      for (const msg of body.messages) {
         if (!msg || typeof msg !== 'object') continue;

         const role = typeof msg.role === 'string' ? msg.role : 'user';
         let content = '';

         if (typeof msg.content === 'string') {
            content = msg.content;
         } else if (Array.isArray(msg.content)) {
            const textParts = [];
            for (const part of msg.content) {
               if (typeof part === 'string') {
                  textParts.push(part);
               } else if (part && typeof part === 'object') {
                  if (typeof part.text === 'string') textParts.push(part.text);
                  else if (typeof part.content === 'string') textParts.push(part.content);

                  if (!attachment && role === 'user' && part.type === 'file' && typeof part.name === 'string' && typeof part.content === 'string') {
                     attachment = {
                        name: part.name,
                        size: typeof part.size === 'number' ? part.size : part.content.length,
                        content: part.content
                     };
                  }
               }
            }
            content = textParts.join('\n');
         } else if (msg.content && typeof msg.content === 'object') {
            if (typeof msg.content.text === 'string') content = msg.content.text;
            else if (typeof msg.content.content === 'string') content = msg.content.content;
         }

         // Convert assistant tool_calls back to text format for the model
         if (role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
            let tcJson;
            try {
               tcJson = msg.tool_calls.map(tc => ({
                  name: getQwenNameForTool(tc.function?.name || tc.name, toolContext),
                  arguments: typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : (tc.function?.arguments || tc.arguments || {})
               }));
            } catch (e) {
               return fail(400, 'Malformed JSON in tool_calls[].function.arguments', 'invalid_tool_call');
            }
            const tcText = `${TOOL_CALLS_START}\n${JSON.stringify(tcJson)}\n${TOOL_CALLS_END}`;
            content = content ? `${content}\n${tcText}` : tcText;
         }

         // Convert tool role messages to user messages with result context
         if (role === 'tool') {
            const toolName = getQwenNameForTool(msg.name || msg.tool_call_id || 'unknown', toolContext);
            // Ensure non-string content (JSON objects) gets serialized
            const toolContent = content || (msg.content && typeof msg.content === 'object' ? JSON.stringify(msg.content) : '');
            chatMessages.push({ role: 'user', content: `Tool "${toolName}" returned:\n${toolContent || '(empty)'}` });
            continue;
         }

         if (!content) continue;
         if (role === 'system') {
            systemPrompts.push(content);
         } else if (role === 'user' || role === 'assistant') {
            chatMessages.push({ role, content });
         } else {
            chatMessages.push({ role: 'user', content: `[${role}] ${content}` });
         }
      }

      if (chatMessages.length === 0) return fail(400, 'no valid non-system messages found');

      const requestSystemPrompt = typeof chatOptions.systemPrompt === 'string' && chatOptions.systemPrompt.trim() ? chatOptions.systemPrompt.trim() : '';
      const toolSystemPrompt = toolsProvided && rawToolChoice !== 'none'
         ? (isFirstToolTurn ? buildToolSystemPrompt(toolContext) : buildToolReminderPrompt(toolContext))
         : '';

      // Build tool_choice hint
      let toolChoiceHint = '';
      if (toolsProvided) {
         const tc = body.tool_choice;
         if (tc === 'none') {
            toolChoiceHint = '\nDo NOT call any tools. Respond in plain text only.';
         } else if (tc === 'required') {
            toolChoiceHint = '\nYou MUST use at least one tool. Do NOT respond with plain text only.';
         } else if (tc && typeof tc === 'object' && tc.type === 'function' && tc.function?.name) {
            toolChoiceHint = `\nYou MUST call the "${getQwenNameForTool(tc.function.name, toolContext)}" tool.`;
         } else if (isFirstToolTurn) {
            toolChoiceHint = '\nYou MUST use at least one tool to answer this request. Do NOT respond with plain text only.';
         } else {
            toolChoiceHint = '\nUse a tool if needed, or respond in plain text if the task is complete or no tool is required.';
         }
      }

      const systemPrompt = [requestSystemPrompt, ...systemPrompts, toolSystemPrompt, toolChoiceHint].filter(Boolean).join('\n');
      const upstreamRequest = {
         messages: chatMessages,
         chatOptions: {
            ...chatOptions,
            selectedModel: model,
            systemPrompt,
            topK: parsedTopK
         },
         attachment
      };

      if (typeof body.temperature === 'number') upstreamRequest.chatOptions.temperature = body.temperature;
      if (typeof body.top_p === 'number') upstreamRequest.chatOptions.topP = body.top_p;
      if (typeof body.max_tokens === 'number') upstreamRequest.chatOptions.maxTokens = body.max_tokens;
      if (Array.isArray(body.stop)) upstreamRequest.chatOptions.stopSequences = body.stop.filter(value => typeof value === 'string' && value);
      else if (typeof body.stop === 'string' && body.stop) upstreamRequest.chatOptions.stopSequences = [body.stop];

      const range = PUBLIC_IP_RANGES[Math.floor(Math.random() * PUBLIC_IP_RANGES.length)];
      const fakeIp = `${range[0]}.${range[1]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
      const upstreamHeaders = {
         'Content-Type': 'application/json',
         'Accept': '*/*',
         'Origin': 'https://chatjimmy.ai',
         'Referer': 'https://chatjimmy.ai/',
         'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36',
         'X-Forwarded-For': fakeIp,
         'X-Real-IP': fakeIp,
         'True-Client-IP': fakeIp,
         'X-Client-IP': fakeIp,
         'Forwarded': `for=${fakeIp}`
      };
      const sendUpstream = (requestBody) => fetchUpstream(CHAT_URL, {
         method: 'POST',
         headers: upstreamHeaders,
         body: JSON.stringify(requestBody)
      });
      const upstreamResponse = await sendUpstream(upstreamRequest);

      if (!upstreamResponse.ok) {
         const isJson = upstreamResponse.headers.get('content-type')?.includes('json');
         const rawParsed = isJson ? await upstreamResponse.json().catch(() => null) : await upstreamResponse.text().catch(() => '');
         const message = rawParsed?.error?.message || rawParsed?.message || rawParsed?.error || rawParsed || `Upstream returned ${upstreamResponse.status}`;
         return fail(upstreamResponse.status === 408 ? 504 : 502, String(message), 'upstream_status_error', 'api_error');
      }

      if (toolState.hasTools) {
         const toolResult = await collectToolResultWithRetry(upstreamResponse, upstreamRequest, sendUpstream, toolState);
         if (stream) return createOpenAIToolStream(toolResult, model, body?.stream_options?.include_usage === true);
         return formatOpenAIToolResponse(toolResult, model);
      }

      if (stream) return handleOpenAIStreamingResponse(upstreamResponse, model, body?.stream_options?.include_usage === true);
      return handleOpenAINonStreamingResponse(upstreamResponse, model, false);
   } catch (error) {
      const isTimeout = error?.name === 'AbortError';
      return fail(isTimeout ? 504 : 502, isTimeout ? 'Upstream request timed out' : (error.message || 'Upstream request failed'), isTimeout ? 'upstream_timeout' : 'upstream_error', 'api_error');
   }
}

async function handleAnthropicMessages(req) {
   const authError = checkAuth(req);
   if (authError) return authError;

   let rawBody = '';
   let body = null;

   try {
      rawBody = await req.text();
      const bodyBytes = new TextEncoder().encode(rawBody).length;
      if (bodyBytes > DEFAULT_MAX_BODY_BYTES) {
         const error = anthropicError(413, `Request body exceeds ${DEFAULT_MAX_BODY_BYTES} bytes`);
         return json(error.status, error.body);
      }
      body = rawBody ? JSON.parse(rawBody) : {};
   } catch (error) {
      const badJson = anthropicError(400, 'Invalid JSON body');
      return json(badJson.status, badJson.body);
   }

   try {
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
         const invalid = anthropicError(400, 'Request body must be a JSON object');
         return json(invalid.status, invalid.body);
      }

      if (typeof body.model !== 'string' || !body.model.trim()) {
         const invalid = anthropicError(400, 'model is required');
         return json(invalid.status, invalid.body);
      }

      if (typeof body.max_tokens !== 'number' || body.max_tokens < 1) {
         const invalid = anthropicError(400, 'max_tokens must be a positive integer');
         return json(invalid.status, invalid.body);
      }

      if (!Array.isArray(body.messages) || body.messages.length === 0) {
         const invalid = anthropicError(400, 'messages array is required');
         return json(invalid.status, invalid.body);
      }

      if (body.temperature !== undefined && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 1)) {
         const invalid = anthropicError(400, 'temperature must be a number between 0 and 1');
         return json(invalid.status, invalid.body);
      }

      if (body.top_p !== undefined && (typeof body.top_p !== 'number' || body.top_p < 0 || body.top_p > 1)) {
         const invalid = anthropicError(400, 'top_p must be a number between 0 and 1');
         return json(invalid.status, invalid.body);
      }

      if (body.top_k !== undefined && (typeof body.top_k !== 'number' || body.top_k < 1)) {
         const invalid = anthropicError(400, 'top_k must be a positive integer');
         return json(invalid.status, invalid.body);
      }

      const toolContext = buildToolContext(body.tools);
      const toolsProvided = toolContext.hasTools;
      const rawToolChoice = body.tool_choice;
      const toolChoiceNone = isAnthropicNoneToolChoice(rawToolChoice);
      const rawToolMessages = normalizeAnthropicToolMessages(body.messages);
      const isFirstToolTurn = !hasPriorToolUse(rawToolMessages, toolContext);
      const toolState = {
         hasTools: toolsProvided && !toolChoiceNone,
         toolContext,
         recentToolHistory: buildRecentToolHistory(rawToolMessages, toolContext, rawToolChoice)
      };

      let systemPrompt = '';
      if (typeof body.system === 'string') {
         systemPrompt = body.system;
      } else if (Array.isArray(body.system)) {
         systemPrompt = body.system
            .filter(block => block && block.type === 'text' && typeof block.text === 'string')
            .map(block => block.text)
            .join('\n');
      }

      if (toolsProvided) {
         const toolPrompt = toolChoiceNone
            ? ''
            : isFirstToolTurn
               ? buildToolSystemPrompt(toolContext)
               : buildToolReminderPrompt(toolContext);

         // Handle tool_choice
         let toolChoiceHint = '';
         const tc = rawToolChoice;
         if (toolChoiceNone) {
            toolChoiceHint = '\nDo NOT call any tools. Respond in plain text only.';
         } else if (tc && typeof tc === 'object' && tc.type === 'any') {
            toolChoiceHint = '\nYou MUST use at least one tool.';
         } else if (tc && typeof tc === 'object' && tc.type === 'tool' && tc.name) {
            toolChoiceHint = `\nYou MUST call the "${getQwenNameForTool(tc.name, toolContext)}" tool.`;
         } else if (tc && typeof tc === 'object' && tc.type === 'auto') {
            toolChoiceHint = isFirstToolTurn
               ? '\nYou MUST use at least one tool to answer this request. Do NOT respond with plain text only.'
               : '\nUse a tool if needed, or respond in plain text if the task is complete or no tool is required.';
         } else if (isFirstToolTurn) {
            toolChoiceHint = '\nYou MUST use at least one tool to answer this request. Do NOT respond with plain text only.';
         } else {
            toolChoiceHint = '\nUse a tool if needed, or respond in plain text if the task is complete or no tool is required.';
         }

         systemPrompt = [systemPrompt, toolPrompt, toolChoiceHint].filter(Boolean).join('\n');
      }

      const messages = [];
      for (const msg of body.messages) {
         if (!msg || typeof msg !== 'object') continue;
         if (msg.role !== 'user' && msg.role !== 'assistant') continue;

         let content = '';
         if (typeof msg.content === 'string') {
            content = msg.content;
         } else if (Array.isArray(msg.content)) {
            const parts = [];
            for (const block of msg.content) {
               if (!block || typeof block !== 'object') continue;
               if (block.type === 'text' && typeof block.text === 'string') {
                  parts.push(block.text);
               } else if (block.type === 'tool_use' && msg.role === 'assistant') {
                  let parsedInput = block.input || {};
                  if (typeof block.input === 'string') {
                     try { parsedInput = JSON.parse(block.input); } catch (_) { parsedInput = {}; }
                  }
                  const tcObj = [{ name: getQwenNameForTool(block.name, toolContext), arguments: parsedInput }];
                  parts.push(`${TOOL_CALLS_START}\n${JSON.stringify(tcObj)}\n${TOOL_CALLS_END}`);
               } else if (block.type === 'tool_result' && msg.role === 'user') {
                  let resultContent = '';
                  if (typeof block.content === 'string') {
                     resultContent = block.content;
                  } else if (Array.isArray(block.content)) {
                     resultContent = block.content
                        .filter(b => b && b.type === 'text' && typeof b.text === 'string')
                        .map(b => b.text)
                        .join('\n');
                  }
                  // Resolve actual tool name from tool_use_id
                  let toolName = block.tool_use_id || 'unknown';
                  if (block.tool_use_id) {
                     for (const prevMsg of body.messages) {
                        if (prevMsg.role !== 'assistant' || !Array.isArray(prevMsg.content)) continue;
                        const match = prevMsg.content.find(b => b.type === 'tool_use' && b.id === block.tool_use_id);
                        if (match) { toolName = match.name || toolName; break; }
                     }
                  }
                  toolName = getQwenNameForTool(toolName, toolContext);
                  if (block.is_error) {
                     parts.push(`Tool "${toolName}" error:\n${resultContent || 'unknown error'}`);
                  } else {
                     parts.push(`Tool "${toolName}" returned:\n${resultContent || '(empty)'}`);
                  }
               }
            }
            content = parts.join('\n');
         }

         if (content) messages.push({ role: msg.role, content });
      }

      if (messages.length === 0) {
         const invalid = anthropicError(400, 'no valid messages found');
         return json(invalid.status, invalid.body);
      }

      const topK = Number.parseInt(String(body.top_k ?? DEFAULT_TOP_K), 10);
      const range = PUBLIC_IP_RANGES[Math.floor(Math.random() * PUBLIC_IP_RANGES.length)];
      const fakeIp = `${range[0]}.${range[1]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
      const selectedModel = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
      const jimmyRequest = {
         messages,
         chatOptions: {
            selectedModel,
            systemPrompt,
            topK: Number.isFinite(topK) && topK > 0 ? topK : DEFAULT_TOP_K
         },
         attachment: null
      };

      if (typeof body.temperature === 'number') jimmyRequest.chatOptions.temperature = body.temperature;
      if (typeof body.top_p === 'number') jimmyRequest.chatOptions.topP = body.top_p;
      if (typeof body.max_tokens === 'number') jimmyRequest.chatOptions.maxTokens = body.max_tokens;
      if (Array.isArray(body.stop_sequences)) jimmyRequest.chatOptions.stopSequences = body.stop_sequences.filter(value => typeof value === 'string' && value);

      const upstreamHeaders = {
         'Content-Type': 'application/json',
         'Accept': '*/*',
         'Origin': 'https://chatjimmy.ai',
         'Referer': 'https://chatjimmy.ai/',
         'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36',
         'X-Forwarded-For': fakeIp,
         'X-Real-IP': fakeIp,
         'True-Client-IP': fakeIp,
         'X-Client-IP': fakeIp,
         'Forwarded': `for=${fakeIp}`
      };
      const sendUpstream = (requestBody) => fetchUpstream(CHAT_URL, {
         method: 'POST',
         headers: upstreamHeaders,
         body: JSON.stringify(requestBody)
      });
      const upstreamResponse = await sendUpstream(jimmyRequest);

      if (!upstreamResponse.ok) {
         const rawParsed = await upstreamResponse.text().catch(() => '');
         const error = anthropicError(upstreamResponse.status === 408 ? 504 : 502, rawParsed || `Upstream returned ${upstreamResponse.status}`);
         error.body.error.type = 'api_error';
         return json(error.status, error.body);
      }

      if (toolState.hasTools) {
         const toolResult = await collectToolResultWithRetry(upstreamResponse, jimmyRequest, sendUpstream, toolState);
         if (body.stream === true) return createAnthropicToolStream(toolResult, body.model);
         return formatAnthropicToolResponse(toolResult, body.model);
      }

      if (body.stream === true) return handleAnthropicStreamingResponse(upstreamResponse, body.model);
      return await handleAnthropicNonStreamingResponse(upstreamResponse, body.model, false);
   } catch (error) {
      const isTimeout = error?.name === 'AbortError';
      return json(isTimeout ? 504 : 502, {
         type: 'error',
         error: {
            type: 'api_error',
            message: isTimeout ? 'Upstream request timed out' : (error.message || 'Upstream request failed')
         }
      });
   }
}

async function handleHealthRequest() {
   try {
      const response = await fetchUpstream(HEALTH_URL, {
         method: 'GET',
         headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
         const raw = await response.text().catch(() => '');
         return json(502, {
            error: {
               message: raw || `Upstream returned ${response.status}`,
               type: 'api_error',
               code: 'upstream_status_error'
            }
         });
      }

      return json(200, { proxy: 'ok', upstreamResponse: await response.json() });
   } catch (error) {
      return json(502, {
         error: {
            message: error?.name === 'AbortError' ? 'Upstream request timed out' : (error.message || 'Health request failed'),
            type: 'api_error',
            code: error?.name === 'AbortError' ? 'upstream_timeout' : 'upstream_error'
         }
      });
   }
}

async function handleModelsRequest() {
   try {
      const response = await fetchUpstream(MODELS_URL, {
         method: 'GET',
         headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
         const raw = await response.text().catch(() => '');
         return json(response.status === 408 ? 504 : 502, {
            error: {
               message: raw || `Upstream returned ${response.status}`,
               type: 'api_error',
               code: 'upstream_status_error'
            }
         });
      }

      const upstreamPayload = await response.json();
      const data = Array.isArray(upstreamPayload?.data) ? upstreamPayload.data.slice() : [];
      if (!data.find(item => item?.id === DEFAULT_MODEL)) {
         data.unshift({
            id: DEFAULT_MODEL,
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: 'chatjimmy'
         });
      }

      return json(200, {
         object: upstreamPayload?.object || 'list',
         data
      });
   } catch (error) {
      return json(502, {
         error: {
            message: error.message || 'Failed to fetch models',
            type: 'api_error',
            code: error?.name === 'AbortError' ? 'upstream_timeout' : 'upstream_error'
         }
      });
   }
}

async function handleChatJimmyRoute(req) {
   let path = new URL(req.url).pathname.replace(/\/+$/, '');
   if (!path) path = '/';

   if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
   }

   if (path === '/' || path === '/api') {
      return json(200, {
         status: 'ok',
         provider: 'chatjimmy',
         auth_prefix: 'tarun-',
         endpoints: ['/health', '/v1/models', '/v1/chat/completions', '/v1/messages']
      });
   }

   if ((path === '/v1/health' || path === '/health' || path === '/api/health') && req.method === 'GET') {
      return handleHealthRequest();
   }

   if ((path === '/v1/models' || path === '/models' || path === '/api/models') && req.method === 'GET') {
      return handleModelsRequest();
   }

   if ((path === '/v1/chat/completions' || path === '/chat/completions' || path === '/api/chat/completions') && req.method === 'POST') {
      return handleOpenAIChatCompletions(req);
   }

   if ((path === '/v1/messages' || path === '/messages' || path === '/api/messages') && req.method === 'POST') {
      return handleAnthropicMessages(req);
   }

   return new Response(null, { status: 302, headers: { Location: BASE_URL, ...corsHeaders() } });
}

export default {
   async fetch(req) {
      return handleChatJimmyRoute(req);
   }
}
