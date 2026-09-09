import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EdgeTTS } from 'node-edge-tts';

const VOICE = 'ms-MY-YasminNeural';
const LANG = 'ms-MY';
const MAX_TEXT_LENGTH = 500;
const TTS_TIMEOUT_MS = 9_000;

function clamp(value: unknown, minimum: number, maximum: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function jsonResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const contentType = request.headers.get('content-type')?.toLowerCase() || '';
  if (!contentType.startsWith('application/json')) {
    return jsonResponse('Content-Type must be application/json', 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse('Invalid JSON body', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse('Invalid request body', 400);
  }

  const input = body as Record<string, unknown>;
  if (typeof input.text !== 'string') {
    return jsonResponse('Text is required', 400);
  }

  const text = input.text.trim();
  if (!text) return jsonResponse('Text is required', 400);
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonResponse(`Text must be ${MAX_TEXT_LENGTH} characters or fewer`, 413);
  }

  const rate = clamp(input.rate, 0.8, 1.2, 1);
  const pitch = clamp(input.pitch, 0.9, 1.1, 1);
  const volume = clamp(input.volume, 0, 1, 1);
  const ratePercent = Math.round((rate - 1) * 100);
  const pitchHz = Math.max(-20, Math.min(20, Math.round((pitch - 1) * 100)));
  // Edge prosody volume is relative to the default level: 1.0 means unchanged.
  const volumePercent = Math.round((volume - 1) * 100);

  const audioPath = join(tmpdir(), `badminton-tts-${randomUUID()}.mp3`);

  try {
    const tts = new EdgeTTS({
      voice: VOICE,
      lang: LANG,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`,
      pitch: `${pitchHz >= 0 ? '+' : ''}${pitchHz}Hz`,
      volume: `${volumePercent >= 0 ? '+' : ''}${volumePercent}%`,
      timeout: TTS_TIMEOUT_MS,
    });
    await tts.ttsPromise(text, audioPath);
    const audio = await readFile(audioPath);
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return jsonResponse('Text-to-speech service unavailable', 502);
  } finally {
    await unlink(audioPath).catch(() => undefined);
  }
}
