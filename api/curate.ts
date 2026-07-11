import { curate, type ConciergeIngredient, type CurateInput } from './_lib/gemini';

interface Req {
  method?: string;
  body?: unknown;
}

interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

function sanitizeIngredients(raw: unknown): ConciergeIngredient[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (i): i is { id: string; name: string; description?: string } =>
        !!i && typeof i.id === 'string' && typeof i.name === 'string',
    )
    .slice(0, 40)
    .map((i) => ({
      id: i.id.slice(0, 60),
      name: i.name.slice(0, 40),
      description: String(i.description ?? '').slice(0, 120),
    }));
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const body = (req.body ?? {}) as {
    messages?: { role?: string; text?: string }[];
    ingredients?: { top?: unknown; heart?: unknown; base?: unknown };
  };

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .map((m) => ({ role: m.role as 'user' | 'assistant', text: (m.text as string).trim() }))
    .filter((m) => m.text.length > 0)
    .slice(-8);

  const input: CurateInput = {
    messages,
    ingredients: {
      top: sanitizeIngredients(body.ingredients?.top),
      heart: sanitizeIngredients(body.ingredients?.heart),
      base: sanitizeIngredients(body.ingredients?.base),
    },
  };

  if (
    messages.length === 0 ||
    messages[messages.length - 1].role !== 'user' ||
    input.ingredients.top.length === 0 ||
    input.ingredients.heart.length === 0 ||
    input.ingredients.base.length === 0
  ) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  try {
    const result = await curate(input, apiKey);
    res.status(200).json(result);
  } catch (error) {
    console.error('curate failed:', error);
    res.status(502).json({ error: 'provider_error' });
  }
}
