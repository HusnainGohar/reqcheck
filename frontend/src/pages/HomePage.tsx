import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { Icon, iconPaths } from "../components/ui/Icon";
import { WorkflowIllustration } from '../features/home/WorkflowIllustration';

export function HomePage() {
  const { session } = useAuth();
  const steps: { icon: keyof typeof iconPaths; title: string; text: string }[] = [
    { icon: 'upload', title: 'Upload a document', text: 'Bring a TXT, DOCX or searchable PDF. Your source file stays linked to extracted statements.' },
    { icon: 'edit', title: 'Review requirements', text: 'Correct text, add missing statements, or split and merge them. Changes save after typing pauses.' },
    { icon: 'chart', title: 'Analyze & decide', text: 'Explore model suggestions, ambiguity cues and possible duplicates. Accept, dismiss or correct findings.' },
    { icon: 'download', title: 'Export your evidence', text: 'Download CSV or JSON, or open a printable report linked to its exact source revision.' },
  ];
  return <main className="home-content">
    <section className="home-hero" aria-labelledby="home-title">
      <div>
        <p className="eyebrow hero-label"><span className="label-dot" />A clearer way to review</p>
        <h1 id="home-title">Clear requirements.<br />Confident decisions.</h1>
        <p className="home-intro">ReqCheck turns a specification into a reviewable workspace. Repair source text, explore explainable suggestions and keep a traceable record of your decisions.</p>
        <div className="hero-actions">
          <ReactRouterDOM.Link className="primary-button" to="/workspace"><Icon name="arrow" />Start Reviewing</ReactRouterDOM.Link>
          {!session ? <ReactRouterDOM.Link className="secondary-button" to="/guest">Continue as Guest</ReactRouterDOM.Link> : null}
        </div>
        <div className="hero-assurances"><span><Icon name="check" size={15} />Source-linked decisions</span><span><Icon name="check" size={15} />You stay in control</span></div>
        <p className="home-expectation">Accounts save progress for later. Guest work is temporary and expires within 24 hours.</p>
      </div>
      <WorkflowIllustration />
    </section>
    <section aria-labelledby="workflow-title">
      <p className="eyebrow">From specification to evidence</p><h2 id="workflow-title">A simple four-step workflow</h2>
      <div className="home-step-grid">{steps.map(function(step, index) {
        return <article className="card home-step" key={step.title}><div className="home-step-icon"><Icon name={step.icon} size={25} /><span>0{index + 1}</span></div><h3>{step.title}</h3><p>{step.text}</p></article>;
      })}</div>
    </section>
    <section className="home-benefits" aria-labelledby="features-title">
      <div><p className="eyebrow">Built for thoughtful review</p><h2 id="features-title">Your judgment stays central</h2><p>Classification and NFR subtype suggestions support review; they are not confirmed labels or calibrated probabilities. Quality cues are prompts, not proof of defects.</p></div>
      <ul>{['Original source evidence and immutable analysis snapshots', 'Reviewer decisions with append-only history', 'Personal projects or a temporary guest workspace', 'Keyboard access and reduced-motion support'].map(function(text) { return <li key={text}><Icon name="check" size={18} /><span>{text}</span></li>; })}</ul>
    </section>
    <section className="home-final"><h2>Ready to review your first document?</h2><ReactRouterDOM.Link className="primary-button" to="/workspace">Start Reviewing<Icon name="arrow" /></ReactRouterDOM.Link></section>
  </main>;
}
