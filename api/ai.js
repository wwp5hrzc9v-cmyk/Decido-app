module.exports = async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}
try {
const body = req.body;
const systemPrompt = body.system || '';
const userMessage = body.user || '';
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': process.env.ANTHROPIC_KEY,
'anthropic-version': '2023-06-01'
},
body: JSON.stringify({
model: 'claude-sonnet-4-5',
max_tokens: 2000,
system: systemPrompt,
messages: [{ role: 'user', content: userMessage }]
})
});
const data = await response.json();
if (!data.content) {
return res.status(500).json({ error: 'No content from AI' });
}
const text = data.content.map(function(b) { return b.text || ''; }).join('');
const match = text.match(/\{[\s\S]*\}/);
if (!match) {
return res.status(500).json({ error: 'No JSON found', raw: text.substring(0, 200) });
}
const result = JSON.parse(match[0]);
return res.status(200).json({ result: result });
} catch (error) {
return res.status(500).json({ error: error.message });
}
};
