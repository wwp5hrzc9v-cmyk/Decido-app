export const config = { runtime: ‘edge’ };

export default async function handler(req) {
if (req.method !== ‘POST’) {
return new Response(‘Method not allowed’, { status: 405 });
}

try {
const { system, user } = await req.json();

```
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: system,
    messages: [{ role: 'user', content: user }]
  })
});

const data = await response.json();
const text = data.content.map(b => b.text || '').join('');
const clean = text.replace(/```json|```/g, '').trim();
const result = JSON.parse(clean);

return new Response(JSON.stringify({ result }), {
  headers: { 'Content-Type': 'application/json' }
});
```

} catch (error) {
return new Response(JSON.stringify({ error: error.message }), {
status: 500,
headers: { ‘Content-Type’: ‘application/json’ }
});
}
}
