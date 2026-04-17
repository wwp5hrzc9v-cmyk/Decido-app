module.exports = async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}
try {
const body = req.body;
const systemPrompt = body.system || '';
const userMessage = body.user || '';
const profile = body.profile || null;
const action = body.action || 'decision';
let profileContext = '';
if (profile && profile.total_decisoes > 0) {
const parts = [];
parts.push('CONTEXTO DO USUARIO (use para personalizar):');
parts.push('Tipo: ' + (profile.tipo || 'individual'));
parts.push('Decisoes anteriores: ' + profile.total_decisoes);
if (profile.categorias_frequentes && profile.categorias_frequentes.length > 0) {
parts.push('Categorias frequentes: ' + profile.categorias_frequentes.join(', '));
}
if (profile.vieses_recorrentes && profile.vieses_recorrentes.length > 0) {
parts.push('Vieses recorrentes: ' + profile.vieses_recorrentes.join(', '));
}
if (profile.padrao_decisao) parts.push('Padrao: ' + profile.padrao_decisao);
if (profile.nivel_risco) parts.push('Nivel de risco: ' + profile.nivel_risco);
if (profile.setor) parts.push('Setor: ' + profile.setor);
if (profile.estagio) parts.push('Estagio: ' + profile.estagio);
profileContext = '\n\n' + parts.join('\n');
}
if (action === 'extract_profile') {
const extractSystem = 'Voce e um analisador de perfil. Analise a decisao e extraia dado
const r1 = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': process.env.ANTHROPIC_KEY,
'anthropic-version': '2023-06-01'
},
body: JSON.stringify({
model: 'claude-sonnet-4-5',
max_tokens: 500,
system: extractSystem,
messages: [{ role: 'user', content: userMessage }]
})
});
const d1 = await r1.json();
if (!d1.content) return res.status(500).json({ error: 'No content' });
const t1 = d1.content.map(function(b) { return b.text || ''; }).join('');
const m1 = t1.match(/\{[\s\S]*\}/);
if (!m1) return res.status(500).json({ error: 'No JSON' });
return res.status(200).json({ result: JSON.parse(m1[0]) });
}
const finalSystem = systemPrompt + profileContext;
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
system: finalSystem,
messages: [{ role: 'user', content: userMessage }]
})
});
const data = await response.json();
if (!data.content) return res.status(500).json({ error: 'No content from AI' });
const text = data.content.map(function(b) { return b.text || ''; }).join('');
const match = text.match(/\{[\s\S]*\}/);
if (!match) return res.status(500).json({ error: 'No JSON found' });
return res.status(200).json({ result: JSON.parse(match[0]) });
} catch (error) {
return res.status(500).json({ error: error.message });
}
};
