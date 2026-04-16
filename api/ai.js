module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { system, user, mode } = req.body;
    const COUNCIL = 'Voce e um conselho de decisao com 7 personas: Analista Quant, Estrategista CEO, Coach Valores, Risk Manager, Oportunista, Futuro Self, Devil Advocate. Use frameworks: Real Options, Decision Tree, MAUT, Regret Minimization. Neutro, sem julgamento moral. Retorne APENAS JSON valido sem markdown.';
    const finalSystem = mode === 'council' ? COUNCIL : system;
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
        messages: [{ role: 'user', content: user }]
      })
    });
    const data = await response.json();
    if (!data.content) return res.status(500).json({ error: 'No content', raw: data });
    const text = data.content.map(function(b) { return b.text || ''; }).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'No JSON', raw: text });
    return res.status(200).json({ result: JSON.parse(match[0]) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
