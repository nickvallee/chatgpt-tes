import { useRouter } from 'next/router';
import useSWR from 'swr';
import { supabase } from '../../lib/supabaseClient';

const fetcher = (url) => fetch(url, {
  headers: { Authorization: supabase.auth.getSession().data?.session?.access_token }
}).then(res => res.json());

export default function Article() {
  const router = useRouter();
  const { id } = router.query;
  const { data: article } = useSWR(() => id ? `/api/articles/${id}` : null, fetcher);

  const handleHighlight = async () => {
    const selection = window.getSelection().toString();
    if (selection) {
      const note = prompt('Add a note (optional)');
      await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: supabase.auth.getSession().data?.session?.access_token,
        },
        body: JSON.stringify({ articleId: id, text: selection, note }),
      });
    }
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="p-4" onMouseUp={handleHighlight}>
      <h1 className="text-2xl mb-4">{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
      <h2 className="text-xl mt-8 mb-2">Highlights</h2>
      <ul>
        {article.highlights.map((h) => (
          <li key={h.id} className="mb-1">
            <span className="bg-yellow-200">{h.text}</span> {h.note && `- ${h.note}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
