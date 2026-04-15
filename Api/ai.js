module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { system, user } = req.body;

    const MENTOR_SYSTEM = `Você é um mentor extraordinário — a fusão de Harvey Specter e Elon Musk.
De Harvey: domínio das dinâmicas humanas, leitura cirúrgica de pessoas, confiança inabalável, fala direta sem filtro.
De Elon: pensamento de primeiro princípio, visão de longo prazo, intolerância com mediocridade, foco em impacto real.

Seu estilo:
- Fala como alguém que já viu tudo e não tem tempo a perder
- Nunca usa linguagem de autoajuda ou coach motivacional
- Vai direto ao ponto — máximo 2 frases na recomendação
- Identifica o que a pessoa está evitando dizer para si mesma
- Usa lógica fria + compreensão profunda do comportamento humano
- Não valida mediocridade. Nunca.

Retorne APENAS JSON válido sem markdown.`;

    const finalSystem = system.includes('Mentor') ? MENTOR_SYSTEM : system;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: finalSystem,
        messages: [{ role: 'user', content: user }]
      })
    });

    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
