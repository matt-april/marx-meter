import { describe, it, expect } from 'vitest';

describe('build smoke test', () => {
  it('common types module is importable', async () => {
    const types = await import('../src/common/types');
    expect(types).toBeDefined();
  });

  it('typescript strict mode is enforced', () => {
    // This test exists to verify the test runner works.
    // TypeScript strict mode is verified by tsc --noEmit in CI.
    const value: string = 'Marx Meter';
    expect(value).toBe('Marx Meter');
  });
});
