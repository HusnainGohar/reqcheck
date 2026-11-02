import * as React from 'react';
import { Icon } from '../../components/ui/Icon';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const stages = [
  { label: 'Upload', title: 'Bring your specification', detail: 'Choose a TXT, DOCX or searchable PDF. Upload it to link the original source to extracted requirements.', icon: 'upload' },
  { label: 'Review', title: 'Make each statement clear', detail: 'Inspect extracted text. Edit, split or merge statements; corrections save after typing pauses.', icon: 'edit' },
  { label: 'Analyze', title: 'Explore, then decide', detail: 'Inspect classification suggestions and quality cues. Accept, dismiss or correct them using your judgment.', icon: 'chart' },
  { label: 'Export', title: 'Keep a traceable record', detail: 'Download CSV or JSON, or open a printable report with the exact source revision and reviewer decisions.', icon: 'download' },
] as const;

export function WorkflowIllustration() {
  const reduced = useReducedMotion();
  const [stage, setStage] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [visible, setVisible] = React.useState(!document.hidden);
  const running = playing && !reduced && !hovered && !focused && visible;
  React.useEffect(function() {
    function visibility() { setVisible(!document.hidden); }
    document.addEventListener('visibilitychange', visibility);
    return function() { document.removeEventListener('visibilitychange', visibility); };
  }, []);
  React.useEffect(function() {
    if (!running) return;
    const timer = window.setInterval(function() { setStage(function(current) { return (current + 1) % stages.length; }); }, 4500);
    return function() { window.clearInterval(timer); };
  }, [running]);
  function choose(index: number) { setStage(index); setPlaying(false); }
  return <section className={'workflow-demo' + (running ? ' is-playing' : '')} aria-labelledby="workflow-demo-title"
    onMouseEnter={function() { setHovered(true); }} onMouseLeave={function() { setHovered(false); }}
    onFocus={function() { setFocused(true); }}
    onBlur={function(event) { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
    <div className="workflow-demo-heading"><span id="workflow-demo-title"><Icon name="shield" size={18} />The review journey</span>
      <span className="preview-status">Interactive illustration</span></div>
    <svg className="workflow-svg" viewBox="0 0 520 320" role="img" aria-labelledby="workflow-svg-title workflow-svg-desc">
      <title id="workflow-svg-title">{stages[stage].title}</title>
      <desc id="workflow-svg-desc">Upload a source document, review its requirements, analyze suggestions, then export evidence. Use the four step buttons below to explore each stage.</desc>
      <defs><pattern id="workflow-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#cadbd0" /></pattern></defs>
      <rect x="0" y="0" width="520" height="320" rx="14" fill="url(#workflow-dots)" />
      <path d="M66 58H454" className="workflow-connection" />
      <path d="M66 58H454" className="workflow-signal" />
      {stages.map(function(item, index) {
        return <g key={item.label} className={index === stage ? 'workflow-node active' : 'workflow-node'}>
          <circle cx={66 + index * 129} cy="58" r="23" />
          <text x={66 + index * 129} y="63" textAnchor="middle">{'0' + (index + 1)}</text>
          <text className="workflow-node-label" x={66 + index * 129} y="104" textAnchor="middle">{item.label}</text>
        </g>;
      })}
      <g key={stage} className="workflow-scene">
        <rect x="48" y="132" width="424" height="160" rx="14" fill="#fff" stroke="#bfd3c5" />
        <rect x="66" y="152" width="38" height="44" rx="8" fill="#e9f4ee" />
        <path d="M77 160h12l5 5v22H77zm12 0v7h5m-13 8h9m-9 5h9" fill="none" stroke="#136c62" strokeWidth="2" strokeLinejoin="round" />
        <text x="118" y="170" className="workflow-scene-title">{['Source document', 'Requirement review', 'Explainable suggestions', 'Your evidence packet'][stage]}</text>
        <text x="118" y="191" className="workflow-scene-meta">{['TXT / DOCX / PDF', 'Edit with source context', 'Human judgment comes first', 'CSV / JSON / printable report'][stage]}</text>
        {stage === 0 ? <g><path d="M260 260v-44m-15 15 15-15 15 15" className="workflow-document-motion" fill="none" stroke="#136c62" strokeWidth="3" strokeLinecap="round" /><path d="M190 254v14h140v-14" fill="none" stroke="#9ab9a4" strokeWidth="2" /></g> :
          stage === 1 ? <g><rect x="72" y="216" width="376" height="48" rx="8" fill="#f7f8f4" /><text x="86" y="245" className="workflow-example">The system shall respond</text><rect x="331" y="227" width="98" height="25" rx="4" fill="#f7e8ba" /><text x="341" y="245" className="workflow-example">quickly.</text></g> :
            stage === 2 ? <g><rect x="74" y="218" width="155" height="42" rx="8" fill="#fff7e6" /><text x="90" y="244" className="workflow-example">Ambiguity cue</text><path d="m248 238 12 12 24-28" fill="none" stroke="#136c62" strokeWidth="3" /><text x="300" y="244" className="workflow-example">Your decision</text></g> :
              <g><path d="m83 239 9 9 18-21" fill="none" stroke="#136c62" strokeWidth="3" /><text x="128" y="244" className="workflow-example">Source + results + review history</text><path d="M430 218v30m-8-8 8 8 8-8" fill="none" stroke="#136c62" strokeWidth="2" /></g>}
      </g>
    </svg>
    <div className="workflow-step-controls" role="group" aria-label="Explore the review workflow">
      {stages.map(function(item, index) {
        return <button key={item.label} type="button" className={index === stage ? 'workflow-step active' : 'workflow-step'}
          aria-pressed={index === stage} aria-controls="workflow-stage-description" onClick={function() { choose(index); }}>
          <Icon name={item.icon} size={16} /><span>{index + 1}. {item.label}</span>
        </button>;
      })}
    </div>
    <div className="workflow-stage-description" id="workflow-stage-description"><h3>{stages[stage].title}</h3><p>{stages[stage].detail}</p></div>
    <div className="workflow-demo-footer"><p>Illustration only. Your results appear after analysis.</p>
      <button type="button" className="ghost-button" disabled={reduced} aria-pressed={playing && !reduced}
        onClick={function() { setPlaying(!playing); }}>{reduced ? 'Reduced motion' : playing ? 'Pause animation' : 'Play animation'}</button>
    </div>
  </section>;
}
