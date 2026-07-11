// Provider module for the scent concierge. Swappable: to move to the Claude
// API later, add a sibling module implementing curate() with @anthropic-ai/sdk
// (model claude-opus-4-8, structured outputs via output_config.format) and
// switch the import in ../curate.ts.

export interface ConciergeIngredient {
  id: string;
  name: string;
  description: string;
}

export interface CurateInput {
  messages: { role: 'user' | 'assistant'; text: string }[];
  ingredients: {
    top: ConciergeIngredient[];
    heart: ConciergeIngredient[];
    base: ConciergeIngredient[];
  };
}

export interface CurateSuggestion {
  selected: { top: string; heart: string; base: string };
  percentages: { top: number; heart: number; base: number };
  concentration: number;
  name: string;
}

export interface CurateResult {
  reply: string;
  suggestion?: CurateSuggestion;
}

const GEMINI_MODEL = 'gemini-2.0-flash';

function buildSystemPrompt(input: CurateInput): string {
  const list = (items: ConciergeIngredient[]) =>
    items.map((i) => `- ${i.id}: ${i.name} — ${i.description}`).join('\n');

  return `You are the Scent Concierge of Atelier N°9, a premium custom perfume house in the Philippines. You help customers turn feelings, memories, and moods into a perfume formula.

Available ingredients (use ONLY these ids):

TOP NOTES:
${list(input.ingredients.top)}

HEART NOTES:
${list(input.ingredients.heart)}

BASE NOTES:
${list(input.ingredients.base)}

Rules:
- Reply in a warm, evocative boutique voice. At most 100 words. No markdown.
- When you have enough to work with, include a suggestion: exactly one ingredient id per layer (from the lists above), integer percentages that sum to exactly 100 (top 10-45, heart 25-60, base 10-50), a concentration between 15 and 25 (15-19 reads Eau de Parfum, 20-25 Extrait), and an evocative name of at most 18 characters.
- If the request is vague, ask one clarifying question instead of suggesting (suggestion null).
- Only discuss perfume and this atelier. If asked about anything else, politely steer back to scent (suggestion null).
- Never invent ingredient ids. Never mention ids in the reply text - use ingredient names.`;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    suggestion: {
      type: 'OBJECT',
      nullable: true,
      properties: {
        top: { type: 'STRING' },
        heart: { type: 'STRING' },
        base: { type: 'STRING' },
        topPct: { type: 'INTEGER' },
        heartPct: { type: 'INTEGER' },
        basePct: { type: 'INTEGER' },
        concentration: { type: 'INTEGER' },
        name: { type: 'STRING' },
      },
      required: ['top', 'heart', 'base', 'topPct', 'heartPct', 'basePct', 'concentration', 'name'],
    },
  },
  required: ['reply'],
};

interface RawSuggestion {
  top?: string;
  heart?: string;
  base?: string;
  topPct?: number;
  heartPct?: number;
  basePct?: number;
  concentration?: number;
  name?: string;
}

function validateSuggestion(
  raw: RawSuggestion | null | undefined,
  input: CurateInput,
): CurateSuggestion | undefined {
  if (!raw) return undefined;
  const has = (layer: 'top' | 'heart' | 'base', id: unknown) =>
    typeof id === 'string' && input.ingredients[layer].some((i) => i.id === id);
  if (!has('top', raw.top) || !has('heart', raw.heart) || !has('base', raw.base)) return undefined;

  let top = Math.max(0, Math.round(Number(raw.topPct) || 0));
  let heart = Math.max(0, Math.round(Number(raw.heartPct) || 0));
  let base = Math.max(0, Math.round(Number(raw.basePct) || 0));
  const sum = top + heart + base;
  if (sum <= 0) return undefined;
  if (sum !== 100) {
    top = Math.round((top / sum) * 100);
    heart = Math.round((heart / sum) * 100);
    base = 100 - top - heart;
    if (base < 0) return undefined;
  }

  const concentration = Math.max(15, Math.min(25, Math.round(Number(raw.concentration) || 15)));
  const name = String(raw.name ?? '').trim().slice(0, 18) || 'Concierge Blend';

  return {
    selected: { top: raw.top as string, heart: raw.heart as string, base: raw.base as string },
    percentages: { top, heart, base },
    concentration,
    name,
  };
}

export async function curate(input: CurateInput, apiKey: string): Promise<CurateResult> {
  const contents = input.messages.slice(-8).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text.slice(0, 500) }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(input) }] },
        contents,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  const parsed = JSON.parse(text) as { reply?: string; suggestion?: RawSuggestion | null };
  const reply = String(parsed.reply ?? '').trim();
  if (!reply) throw new Error('Gemini returned an empty reply');

  return { reply, suggestion: validateSuggestion(parsed.suggestion, input) };
}
