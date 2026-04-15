module.exports = async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

try {
const { system, user } = req.body;

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

return res.status(200).json({ result });
```

} catch (error) {
return res.status(500).json({ error: error.message });
}
};
