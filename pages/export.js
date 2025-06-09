import { supabase } from '../lib/supabaseClient';

export default function ExportPage() {
  const handleExport = async (format) => {
    const token = supabase.auth.getSession().data?.session?.access_token;
    const res = await fetch(`/api/export?format=${format}`, {
      headers: { Authorization: token },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export.${format === 'markdown' ? 'md' : 'json'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <button className="bg-blue-500 text-white px-4 py-2 mr-2" onClick={() => handleExport('json')}>
        Export JSON
      </button>
      <button className="bg-blue-500 text-white px-4 py-2" onClick={() => handleExport('markdown')}>
        Export Markdown
      </button>
    </div>
  );
}
