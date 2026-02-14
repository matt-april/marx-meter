interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div class="rounded-lg border border-red-800 bg-red-950 p-4">
      <p class="text-sm font-medium text-red-300">Analysis Error</p>
      <p class="mt-1 text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          class="mt-3 rounded bg-red-800 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
