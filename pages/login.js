import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else setMessage('Check your email for the login link.');
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl mb-4">Login</h1>
      <input
        className="border p-2 mb-2"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button className="bg-blue-500 text-white px-4 py-2" onClick={handleLogin}>
        Send Magic Link
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
