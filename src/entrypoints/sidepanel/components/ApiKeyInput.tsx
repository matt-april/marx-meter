import { useState } from 'preact/hooks';

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
  isValidating: boolean;
  error: string | null;
}

export function ApiKeyInput({ onKeySubmit, isValidating, error }: ApiKeyInputProps) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (key.trim()) {
      onKeySubmit(key.trim());
    }
  };

  return (
    <div class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-sm font-semibold text-neutral-200">Set Up Gemini API Key</h2>
      <p class="mt-2 text-xs text-neutral-400">
        Marx Meter uses Google's Gemini AI to analyze articles. You need a free API key to get
        started.
      </p>
      <ol class="mt-3 space-y-1 text-xs text-neutral-400">
        <li>
          1. Go to{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 underline"
          >
            aistudio.google.com/apikey
          </a>
        </li>
        <li>2. Click "Create API Key" (free, no credit card needed)</li>
        <li>3. Copy the key and paste it below</li>
      </ol>
      <form onSubmit={handleSubmit} class="mt-4">
        <input
          type="password"
          value={key}
          onInput={(e) => setKey((e.target as HTMLInputElement).value)}
          placeholder="Paste your Gemini API key"
          class="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-neutral-600"
          disabled={isValidating}
        />
        {error && <p class="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!key.trim() || isValidating}
          class="mt-3 w-full rounded bg-neutral-700 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? 'Validating...' : 'Save API Key'}
        </button>
      </form>
    </div>
  );
}
