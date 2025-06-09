import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'POST') {
    const { articleId, text, note } = req.body;
    const { data, error } = await supabase
      .from('highlights')
      .insert({ article_id: articleId, text, note });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getUser(req) {
  const { data, error } = await supabase.auth.getUser(req.headers.authorization);
  if (error) return null;
  return data.user;
}
