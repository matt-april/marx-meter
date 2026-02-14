interface WhoBenefitsProps {
  benefits: string[];
  absent: string[];
}

export function WhoBenefits({ benefits, absent }: WhoBenefitsProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Who Benefits / Who's Absent
      </h2>
      <div class="mt-3 space-y-3">
        <div>
          <h3 class="text-xs font-medium text-green-400">Benefits:</h3>
          <ul class="mt-1 space-y-1">
            {benefits.map((b) => (
              <li key={b} class="text-sm text-neutral-300">
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 class="text-xs font-medium text-red-400">Absent:</h3>
          <ul class="mt-1 space-y-1">
            {absent.map((a) => (
              <li key={a} class="text-sm text-neutral-300">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
