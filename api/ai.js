module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { system, user } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: system,
        messages: [{ role: 'user', content: user }]
      })
    });

    const data = await response.json();
    
    if (!data.content) {
      return res.status(500).json({ error: 'No content from AI', raw: data });
    }

    const text = data.content.map(b => b.text || '').join('');
    
    // Extract JSON more robustly
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No JSON in response', raw: text });
    }
    
    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
