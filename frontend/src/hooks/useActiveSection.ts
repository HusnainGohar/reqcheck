import * as React from 'react';

export function useActiveSection() {
  const [activeSection, setActiveSection] = React.useState('overview');
  React.useEffect(function() {
    let frame = 0;
    function updateSection() {
      frame = 0;
      if (window.scrollY < 120) { setActiveSection('overview'); return; }
      let section = 'overview';
      ['upload-section', 'review-section', 'analysis-section'].forEach(function(id) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 180) section = id;
      });
      setActiveSection(section);
    }
    function trackScroll() { if (!frame) frame = window.requestAnimationFrame(updateSection); }
    window.addEventListener('scroll', trackScroll, { passive: true });
    updateSection();
    return function() {
      window.removeEventListener('scroll', trackScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return { activeSection, setActiveSection };
}
