import { supabase } from '../../lib/supabaseClient';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const user = await getUser(req, res);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'POST') {
    const { url } = req.body;
    try {
      const response = await fetch(url);
      const html = await response.text();
      const doc = new JSDOM(html, { url });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();

      const { data, error } = await supabase
        .from('articles')
        .insert({
          user_id: user.id,
          url,
          title: article.title,
          content: article.textContent,
        })
        .single();

      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getUser(req, res) {
  const { data, error } = await supabase.auth.getUser(req.headers.authorization);
  if (error) return null;
  return data.user;
}
