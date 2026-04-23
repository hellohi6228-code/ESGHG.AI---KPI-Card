import React, { useState } from 'react';
import { User } from '../types';
import { Factory, ArrowRight } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onLogin({ id: '1', email, name: email.split('@')[0] });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[var(--accent-primary)]/10 rounded-xl flex items-center justify-center border border-[var(--accent-primary)]/20">
            <Factory className="text-[var(--accent-primary)] w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">6K Inc</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Work Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-colors"
              placeholder="engineer@factory.com"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-[var(--accent-primary)] text-[var(--bg-base)] font-medium rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors hover:opacity-90"
          >
            Continue to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
