/// jsdom lacks a few browser APIs the screens touch. None of them affect game
/// logic, so stubbing them keeps the render tests focused on what draws.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  let counter = 0;
  Object.defineProperty(globalThis.crypto ?? (globalThis.crypto = {} as Crypto), 'randomUUID', {
    value: () => `00000000-0000-4000-8000-${String(counter++).padStart(12, '0')}`,
    writable: true,
  });
}
