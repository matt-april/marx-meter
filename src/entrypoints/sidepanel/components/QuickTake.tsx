interface QuickTakeProps {
  text: string;
}

export function QuickTake({ text }: QuickTakeProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">Quick Take</h2>
      <p class="mt-2 text-sm leading-relaxed text-neutral-200">{text}</p>
    </section>
  );
}
