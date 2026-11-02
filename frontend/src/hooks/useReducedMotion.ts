import * as React from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(function() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  React.useEffect(function() {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    function update() { setReduced(preference.matches); }
    preference.addListener(update);
    update();
    return function() { preference.removeListener(update); };
  }, []);
  return reduced;
}
