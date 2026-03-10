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

function buildToolSystemPrompt(tools) {
   if (!Array.isArray(tools) || tools.length === 0) return '';

   const defs = tools.map(t => {
      const fn = t.function || t;
      const obj = { name: fn.name };
      if (fn.description) obj.description = fn.description;
      const params = fn.parameters || fn.input_schema;
      if (params) obj.parameters = params;
      return obj;
   });

   return [
      'You have access to these tools:',
      '```json',
      JSON.stringify(defs),
      '```',
      'To call a tool, output EXACTLY this format (no other text around it):',
      `${TOOL_CALLS_START}`,
      '[{"name":"tool_name","arguments":{...}}]',
      `${TOOL_CALLS_END}`,
      'Rules:',
      '- arguments must be valid JSON matching the tool parameters schema',
      '- You can call multiple tools in one response',
      '- If you do NOT need a tool, respond normally without the tags',
      '- NEVER wrap tool calls in markdown code blocks',
      '- Output ONLY the tool_calls block when calling tools, no extra text before or after'
   ].join('\n');
}

function parseToolCalls(text) {
   const results = [];
   let remaining = text;
   let startIdx = remaining.indexOf(TOOL_CALLS_START);

   while (startIdx !== -1) {
      const endIdx = remaining.indexOf(TOOL_CALLS_END, startIdx + TOOL_CALLS_START.length);
      if (endIdx === -1) break;

      const jsonStr = remaining.slice(startIdx + TOOL_CALLS_START.length, endIdx).trim();
      try {
         const parsed = JSON.parse(jsonStr);
         const calls = Array.isArray(parsed) ? parsed : [parsed];
         for (const call of calls) {
            if (call && typeof call.name === 'string') {
               results.push({
                  name: call.name,
                  arguments: call.arguments || {}
               });
            }
         }
      } catch (e) {
         // Ignore malformed tool calls.
      }

      remaining = remaining.slice(0, startIdx) + remaining.slice(endIdx + TOOL_CALLS_END.length);
      startIdx = remaining.indexOf(TOOL_CALLS_START);
   }

   return { toolCalls: results, textContent: remaining.trim() };
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

function handleOpenAIStreamingResponse(upstreamResponse, requestModel, includeUsage, hasTools) {
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
         const reader = upstreamResponse.body.getReader();
         const decoder = new TextDecoder();
         const markerLookbehind = Math.max(STATS_START.length, THINK_START.length, TOOL_CALLS_START.length) - 1;
         let buffer = '';
         let stats = null;
         let sentRole = false;

         const sendRole = async () => {
            if (sentRole) return;
            sentRole = true;
            await writeChunk({
               id, object: 'chat.completion.chunk', created, model: requestModel,
               choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
            });
         };

         let fullText = '';
         if (!hasTools) await sendRole();

         while (true) {
            const { done, value } = await reader.read();
            if (value) buffer += decoder.decode(value, { stream: true });

            while (true) {
               const statsStart = buffer.indexOf(STATS_START);
               const thinkStart = buffer.indexOf(THINK_START);
               const toolStart = buffer.indexOf(TOOL_CALLS_START);
               let markerStart = -1;
               let markerType = '';

               const candidates = [
                  statsStart !== -1 ? [statsStart, 'stats'] : null,
                  thinkStart !== -1 ? [thinkStart, 'think'] : null,
                  toolStart !== -1 ? [toolStart, 'tool'] : null
               ].filter(Boolean).sort((a, b) => a[0] - b[0]);

               if (candidates.length > 0) {
                  markerStart = candidates[0][0];
                  markerType = candidates[0][1];
               }

               if (markerStart === -1) break;

               if (markerStart > 0 && !hasTools) {
                  await sendRole();
                  await writeChunk({
                     id, object: 'chat.completion.chunk', created, model: requestModel,
                     choices: [{ index: 0, delta: { content: buffer.slice(0, markerStart) }, finish_reason: null }]
                  });
               }
               if (markerStart > 0 && hasTools) {
                  fullText += buffer.slice(0, markerStart);
               }
               if (markerStart > 0) buffer = buffer.slice(markerStart);

               if (markerType === 'think') {
                  const thinkEnd = buffer.indexOf(THINK_END, THINK_START.length);
                  if (thinkEnd === -1) break;
                  buffer = buffer.slice(thinkEnd + THINK_END.length);
                  continue;
               }

               if (markerType === 'tool') {
                  const toolEnd = buffer.indexOf(TOOL_CALLS_END, TOOL_CALLS_START.length);
                  if (toolEnd === -1) break;
                  // Keep the tool block intact in buffer for final parsing
                  break;
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

            const noMarkers = buffer.indexOf(STATS_START) === -1
               && buffer.indexOf(THINK_START) === -1
               && buffer.indexOf(TOOL_CALLS_START) === -1;

            if (!done && noMarkers && buffer.length > markerLookbehind) {
               const safeChunk = buffer.slice(0, buffer.length - markerLookbehind);
               buffer = buffer.slice(buffer.length - markerLookbehind);
               if (safeChunk && !hasTools) {
                  await sendRole();
                  await writeChunk({
                     id, object: 'chat.completion.chunk', created, model: requestModel,
                     choices: [{ index: 0, delta: { content: safeChunk }, finish_reason: null }]
                  });
               } else if (safeChunk && hasTools) {
                  fullText += safeChunk;
               }
            }

            if (done) {
               buffer += decoder.decode();
               if (hasTools) buffer = fullText + buffer;
               const parsed = parseJimmyResponse(buffer);
               if (parsed.stats) stats = parsed.stats;

               if (hasTools) {
                  const { toolCalls, textContent } = parseToolCalls(parsed.content);

                  if (toolCalls.length > 0) {
                     await sendRole();
                     if (textContent) {
                        await writeChunk({
                           id, object: 'chat.completion.chunk', created, model: requestModel,
                           choices: [{ index: 0, delta: { content: textContent }, finish_reason: null }]
                        });
                     }
                     for (let i = 0; i < toolCalls.length; i++) {
                        const tc = toolCalls[i];
                        const args = typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments);
                        await writeChunk({
                           id, object: 'chat.completion.chunk', created, model: requestModel,
                           choices: [{
                              index: 0, delta: {
                                 tool_calls: [{
                                    index: i,
                                    id: `call_${Math.random().toString(36).substring(2, 11)}`,
                                    type: 'function',
                                    function: { name: tc.name, arguments: args }
                                 }]
                              }, finish_reason: null
                           }]
                        });
                     }

                     await writeChunk({
                        id, object: 'chat.completion.chunk', created, model: requestModel,
                        choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]
                     });
                  } else {
                     await sendRole();
                     if (textContent) {
                        await writeChunk({
                           id, object: 'chat.completion.chunk', created, model: requestModel,
                           choices: [{ index: 0, delta: { content: textContent }, finish_reason: null }]
                        });
                     }
                     await writeChunk({
                        id, object: 'chat.completion.chunk', created, model: requestModel,
                        choices: [{ index: 0, delta: {}, finish_reason: getOpenAIStopReason(stats) }]
                     });
                  }
               } else {
                  if (parsed.content) {
                     await writeChunk({
                        id, object: 'chat.completion.chunk', created, model: requestModel,
                        choices: [{ index: 0, delta: { content: parsed.content }, finish_reason: null }]
                     });
                  }
                  await writeChunk({
                     id, object: 'chat.completion.chunk', created, model: requestModel,
                     choices: [{ index: 0, delta: {}, finish_reason: getOpenAIStopReason(stats) }]
                  });
               }

               break;
            }
         }

         if (!hasTools) {
            // finish_reason already sent above in the `done` block
         }

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

function handleAnthropicStreamingResponse(upstreamResponse, requestModel, hasTools) {
   const { readable, writable } = new TransformStream();
   const writer = writable.getWriter();
   const encoder = new TextEncoder();
   const id = `msg_${Math.random().toString(36).substring(2, 14)}`;

   (async () => {
      try {
         const reader = upstreamResponse.body.getReader();
         const decoder = new TextDecoder();
         const markerLookbehind = Math.max(STATS_START.length, THINK_START.length, TOOL_CALLS_START.length) - 1;
         let buffer = '';
         let stats = null;
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

         let fullText = '';
         if (!hasTools) {
            await startTextBlock();
         }

         while (true) {
            const { done, value } = await reader.read();
            if (value) buffer += decoder.decode(value, { stream: true });

            while (true) {
               const statsStart = buffer.indexOf(STATS_START);
               const thinkStart = buffer.indexOf(THINK_START);
               const toolStart = buffer.indexOf(TOOL_CALLS_START);
               let markerStart = -1;
               let markerType = '';

               const candidates = [
                  statsStart !== -1 ? [statsStart, 'stats'] : null,
                  thinkStart !== -1 ? [thinkStart, 'think'] : null,
                  toolStart !== -1 ? [toolStart, 'tool'] : null
               ].filter(Boolean).sort((a, b) => a[0] - b[0]);

               if (candidates.length > 0) {
                  markerStart = candidates[0][0];
                  markerType = candidates[0][1];
               }

               if (markerStart === -1) break;

               if (markerStart > 0 && !hasTools) {
                  await startTextBlock();
                  await writeEvent('content_block_delta', {
                     type: 'content_block_delta',
                     index: 0,
                     delta: { type: 'text_delta', text: buffer.slice(0, markerStart) }
                  });
               }
               if (markerStart > 0 && hasTools) {
                  fullText += buffer.slice(0, markerStart);
               }
               if (markerStart > 0) buffer = buffer.slice(markerStart);

               if (markerType === 'think') {
                  const thinkEnd = buffer.indexOf(THINK_END, THINK_START.length);
                  if (thinkEnd === -1) break;
                  buffer = buffer.slice(thinkEnd + THINK_END.length);
                  continue;
               }

               if (markerType === 'tool') {
                  const toolEnd = buffer.indexOf(TOOL_CALLS_END, TOOL_CALLS_START.length);
                  if (toolEnd === -1) break;
                  break;
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

            const noMarkers = buffer.indexOf(STATS_START) === -1
               && buffer.indexOf(THINK_START) === -1
               && buffer.indexOf(TOOL_CALLS_START) === -1;

            if (!done && noMarkers && buffer.length > markerLookbehind) {
               const safeChunk = buffer.slice(0, buffer.length - markerLookbehind);
               buffer = buffer.slice(buffer.length - markerLookbehind);
               if (safeChunk && !hasTools) {
                  await startTextBlock();
                  await writeEvent('content_block_delta', {
                     type: 'content_block_delta',
                     index: 0,
                     delta: { type: 'text_delta', text: safeChunk }
                  });
               } else if (safeChunk && hasTools) {
                  fullText += safeChunk;
               }
            }

            if (done) {
               buffer += decoder.decode();
               if (hasTools) buffer = fullText + buffer;
               const parsed = parseJimmyResponse(buffer);
               if (parsed.stats) stats = parsed.stats;

               if (hasTools) {
                  const { toolCalls, textContent } = parseToolCalls(parsed.content);
                  const hasToolCalls = toolCalls.length > 0;
                  let blockIndex = 0;

                  await sendMessageStart();

                  if (textContent) {
                     await writeEvent('content_block_start', {
                        type: 'content_block_start',
                        index: blockIndex,
                        content_block: { type: 'text', text: '' }
                     });
                     await writeEvent('content_block_delta', {
                        type: 'content_block_delta',
                        index: blockIndex,
                        delta: { type: 'text_delta', text: textContent }
                     });
                     await writeEvent('content_block_stop', {
                        type: 'content_block_stop',
                        index: blockIndex
                     });
                     blockIndex++;
                  }

                  if (hasToolCalls) {
                     for (const tc of toolCalls) {
                        const toolId = `toolu_${Math.random().toString(36).substring(2, 14)}`;
                        let input;
                        try { input = typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments; } catch (_) { input = {}; }

                        await writeEvent('content_block_start', {
                           type: 'content_block_start',
                           index: blockIndex,
                           content_block: { type: 'tool_use', id: toolId, name: tc.name, input: {} }
                        });
                        await writeEvent('content_block_delta', {
                           type: 'content_block_delta',
                           index: blockIndex,
                           delta: { type: 'input_json_delta', partial_json: JSON.stringify(input) }
                        });
                        await writeEvent('content_block_stop', {
                           type: 'content_block_stop',
                           index: blockIndex
                        });
                        blockIndex++;
                     }
                  }

                  if (blockIndex === 0) {
                     await writeEvent('content_block_start', {
                        type: 'content_block_start',
                        index: 0,
                        content_block: { type: 'text', text: '' }
                     });
                     await writeEvent('content_block_stop', {
                        type: 'content_block_stop',
                        index: 0
                     });
                  }

                  await writeEvent('message_delta', {
                     type: 'message_delta',
                     delta: {
                        stop_reason: hasToolCalls ? 'tool_use' : getAnthropicStopReason(stats),
                        stop_sequence: null
                     },
                     usage: {
                        input_tokens: stats?.prefill_tokens || 0,
                        output_tokens: stats?.decode_tokens || 0,
                        ...buildUsage(stats)
                     }
                  });
               } else {
                  if (parsed.content) {
                     await writeEvent('content_block_delta', {
                        type: 'content_block_delta',
                        index: 0,
                        delta: { type: 'text_delta', text: parsed.content }
                     });
                  }

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
               }

               await writeEvent('message_stop', { type: 'message_stop' });
               break;
            }
         }
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
      const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
      if (body.temperature !== undefined && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2)) return fail(400, 'temperature must be a number between 0 and 2');
      if (body.top_p !== undefined && (typeof body.top_p !== 'number' || body.top_p < 0 || body.top_p > 1)) return fail(400, 'top_p must be a number between 0 and 1');
      if (body.max_tokens !== undefined && (typeof body.max_tokens !== 'number' || body.max_tokens < 1)) return fail(400, 'max_tokens must be a positive integer');

      const topKValue = body.top_k ?? body.topK ?? chatOptions.topK ?? DEFAULT_TOP_K;
      const parsedTopK = Number.parseInt(String(topKValue), 10);
      if (!Number.isFinite(parsedTopK) || parsedTopK < 1) return fail(400, 'top_k/topK must be a positive integer');

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
                  name: tc.function?.name || tc.name,
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
            const toolName = msg.name || msg.tool_call_id || 'unknown';
            chatMessages.push({ role: 'user', content: `Tool "${toolName}" returned:\n${content || '(empty)'}` });
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
      const toolSystemPrompt = hasTools ? buildToolSystemPrompt(body.tools) : '';
      const systemPrompt = [requestSystemPrompt, ...systemPrompts, toolSystemPrompt].filter(Boolean).join('\n');
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
      const upstreamResponse = await fetchUpstream(CHAT_URL, {
         method: 'POST',
         headers: {
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
         },
         body: JSON.stringify(upstreamRequest)
      });

      if (!upstreamResponse.ok) {
         const isJson = upstreamResponse.headers.get('content-type')?.includes('json');
         const rawParsed = isJson ? await upstreamResponse.json().catch(() => null) : await upstreamResponse.text().catch(() => '');
         const message = rawParsed?.error?.message || rawParsed?.message || rawParsed?.error || rawParsed || `Upstream returned ${upstreamResponse.status}`;
         return fail(upstreamResponse.status === 408 ? 504 : 502, String(message), 'upstream_status_error', 'api_error');
      }

      if (stream) return handleOpenAIStreamingResponse(upstreamResponse, model, body?.stream_options?.include_usage === true, hasTools);
      return handleOpenAINonStreamingResponse(upstreamResponse, model, hasTools);
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

      const hasTools = Array.isArray(body.tools) && body.tools.length > 0;

      let systemPrompt = '';
      if (typeof body.system === 'string') {
         systemPrompt = body.system;
      } else if (Array.isArray(body.system)) {
         systemPrompt = body.system
            .filter(block => block && block.type === 'text' && typeof block.text === 'string')
            .map(block => block.text)
            .join('\n');
      }

      if (hasTools) {
         const openAIStyleTools = body.tools.map(t => ({
            function: {
               name: t.name,
               description: t.description || '',
               parameters: t.input_schema || t.parameters || {}
            }
         }));
         const toolPrompt = buildToolSystemPrompt(openAIStyleTools);
         systemPrompt = [systemPrompt, toolPrompt].filter(Boolean).join('\n');
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
                  const args = typeof block.input === 'string' ? block.input : JSON.stringify(block.input || {});
                  parts.push(`${TOOL_CALLS_START}\n[{"name":"${block.name}","arguments":${args}}]\n${TOOL_CALLS_END}`);
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
                  if (block.is_error) {
                     parts.push(`Tool "${block.tool_use_id || 'unknown'}" error:\n${resultContent || 'unknown error'}`);
                  } else if (resultContent) {
                     parts.push(`Tool "${block.tool_use_id || 'unknown'}" returned:\n${resultContent}`);
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

      const upstreamResponse = await fetchUpstream(CHAT_URL, {
         method: 'POST',
         headers: {
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
         },
         body: JSON.stringify(jimmyRequest)
      });

      if (!upstreamResponse.ok) {
         const rawParsed = await upstreamResponse.text().catch(() => '');
         const error = anthropicError(upstreamResponse.status === 408 ? 504 : 502, rawParsed || `Upstream returned ${upstreamResponse.status}`);
         error.body.error.type = 'api_error';
         return json(error.status, error.body);
      }

      if (body.stream === true) return handleAnthropicStreamingResponse(upstreamResponse, body.model, hasTools);
      return await handleAnthropicNonStreamingResponse(upstreamResponse, body.model, hasTools);
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
