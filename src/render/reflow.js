export const isReflowing = () => false;

export function runLayoutReflow() {
  // Pagination is now derived in Pages.jsx from measured layout. This function is
  // retained for older call sites that only need a settled layout hook.
}
