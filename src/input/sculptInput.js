export function determineSculptMode({ button, shiftKey }) {
  if (button === 0 && !shiftKey) return 'raise';
  if (button === 0 && shiftKey) return 'lower';
  if (button === 2) return 'lower';
  return null;
}
