import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.query;
  const { data, error } = await supabase
    .from('articles')
    .select('*, highlights(*)')
    .eq('id', id)
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json(data);
}

async function getUser(req) {
  const { data, error } = await supabase.auth.getUser(req.headers.authorization);
  if (error) return null;
  return data.user;
}
