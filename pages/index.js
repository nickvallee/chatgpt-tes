import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const session = supabase.auth.getSession().data?.session;
    if (session) router.replace('/reader');
    else router.replace('/login');
  }, [router]);
  return null;
}
