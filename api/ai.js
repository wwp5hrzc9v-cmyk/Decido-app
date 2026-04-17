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
      parts.push('Contexto do usuario:');
      parts.push('Tipo: ' + (profile.tipo || 'individual'));
      parts.push('Decisoes: ' + profile.total_decisoes);
      if (profile.categorias_frequentes && profile.categorias_frequentes.length > 0) {
        parts.push('Categorias: ' + profile.categorias_frequentes.join(', '));
      }
      if (profile.nivel_risco) parts.push('Risco: ' + profile.nivel_risco);
      profileContext = '\n\n' + parts.join('\n');
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
    if (!data.content) return res.status(500).json({ error: 'No content' });
    const text = data.content.map(function(b) { return b.text || ''; }).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'No JSON' });
    return res.status(200).json({ result: JSON.parse(match[0]) });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
