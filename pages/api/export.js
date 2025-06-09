import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { format = 'json' } = req.query;
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, highlights(text, note)')
    .eq('user_id', user.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (format === 'markdown') {
    const md = articles
      .map(a => `# ${a.title}\n\n` + a.highlights.map(h => `- ${h.text}${h.note ? `: ${h.note}` : ''}`).join('\n'))
      .join('\n\n');
    res.setHeader('Content-Type', 'text/markdown');
    res.status(200).send(md);
  } else {
    res.status(200).json(articles);
  }
}

async function getUser(req) {
  const { data, error } = await supabase.auth.getUser(req.headers.authorization);
  if (error) return null;
  return data.user;
}
