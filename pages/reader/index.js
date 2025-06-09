import useSWR from 'swr';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

const fetcher = (url) => fetch(url, {
  headers: { Authorization: supabase.auth.getSession().data?.session?.access_token }
}).then(res => res.json());

export default function Reader() {
  const { data: articles, mutate } = useSWR('/api/articles', fetcher);

  const handleAdd = async () => {
    const url = prompt('Enter article URL');
    if (url) {
      await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: supabase.auth.getSession().data?.session?.access_token,
        },
        body: JSON.stringify({ url }),
      });
      mutate();
    }
  };

  if (!articles) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <button className="mb-4 bg-green-500 text-white px-4 py-2" onClick={handleAdd}>
        Add Article
      </button>
      <ul>
        {articles.map((a) => (
          <li key={a.id} className="mb-2">
            <Link href={`/reader/${a.id}`}>{a.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
