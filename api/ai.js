module.exports = async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}
try {
const body = req.body;
const systemPrompt = body.system || ‘’;
const userMessage = body.user || ‘’;
const profile = body.profile || null;
const action = body.action || ‘decision’;

```
// Build context from profile if available
let profileContext = '';
if (profile && profile.total_decisoes > 0) {
  profileContext = `\n\nCONTEXTO DO USUARIO (use para personalizar a resposta):
```

- Tipo: ${profile.tipo || ‘individual’}
- Decisoes anteriores: ${profile.total_decisoes}
- Categorias frequentes: ${(profile.categorias_frequentes || []).join(’, ’) || ‘nenhuma ainda’}
- Vieses recorrentes: ${(profile.vieses_recorrentes || []).join(’, ’) || ‘nenhum identificado’}
- Padrao de decisao: ${profile.padrao_decisao || ‘nao identificado’}
- Nivel de risco: ${profile.nivel_risco || ‘moderado’}
- Contexto pessoal: ${(profile.contexto || []).join(’, ’) || ‘nenhum’}
- Horizonte temporal: ${profile.horizonte_temporal || ‘nao informado’}
  ${profile.tipo === ‘empresarial’ ? `- Setor: ${profile.setor || ‘nao informado’}
- Estagio: ${profile.estagio || ‘nao informado’}
- Desafios recorrentes: ${(profile.desafios_recorrentes || []).join(’, ’) || ‘nenhum’}
- Apetite de risco: ${profile.apetite_risco || ‘nao informado’}` : ‘’}

Use esse contexto para tornar perguntas e veredito mais precisos e personalizados.`;
}

```
// Special action: extract profile data from a completed decision
if (action === 'extract_profile') {
  const extractSystem = `Voce e um analisador de perfil de tomada de decisao. Analise a decisao e extraia dados estruturados do usuario. Retorne APENAS JSON valido sem markdown:
```

{
“categoria”: string,
“vieses_identificados”: [string],
“nivel_risco”: “conservador” | “moderado” | “arrojado”,
“contexto_extraido”: [string],
“horizonte_temporal”: string,
“padrao_observado”: string,
“tipo_sugerido”: “individual” | “empresarial”,
“setor”: string,
“estagio”: string
}`;
const response = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: process.env.ANTHROPIC_KEY,
‘anthropic-version’: ‘2023-06-01’
},
body: JSON.stringify({
model: ‘claude-sonnet-4-5’,
max_tokens: 500,
system: extractSystem,
messages: [{ role: ‘user’, content: userMessage }]
})
});
const data = await response.json();
if (!data.content) return res.status(500).json({ error: ‘No content’ });
const text = data.content.map(function(b) { return b.text || ‘’; }).join(’’);
const match = text.match(/{[\s\S]*}/);
if (!match) return res.status(500).json({ error: ‘No JSON’ });
return res.status(200).json({ result: JSON.parse(match[0]) });
}

```
// Regular decision call with profile context injected
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
if (!match) return res.status(500).json({ error: 'No JSON found', raw: text.substring(0, 200) });
return res.status(200).json({ result: JSON.parse(match[0]) });
```

} catch (error) {
return res.status(500).json({ error: error.message });
}
};
