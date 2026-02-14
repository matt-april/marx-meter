export function LoadingSpinner() {
  return (
    <div class="flex flex-col items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />
      <p class="mt-4 text-sm text-neutral-400">Analyzing article...</p>
    </div>
  );
}
