// site-demo.jsx — Interactive SENTINEL drift widget.
// Real, in-browser computation: parses a multi-turn conversation, scores
// each turn's sentiment, computes the three SENTINEL metrics.

const POS_WORDS = new Set((
  'good great love perfect thanks thank happy nice excellent amazing excited '+
  'helpful awesome wonderful best brilliant working solved fixed '+
  'glad pleased smart elegant clean clear cool appreciate'
).split(/\s+/));

const NEG_WORDS = new Set((
  'bad hate terrible awful angry sad sorry frustrated annoyed disappointed '+
  'wrong worst horrible stupid useless broken stuck failed fail error errors '+
  'crash crashes confused confusing unclear ugh forget nope hopeless mad '+
  'apologize apologies upset infuriating ridiculous trash garbage nothing'
).split(/\s+/));

// Quick sentiment scoring — bag-of-words against curated lists.
function scoreText(text) {
  const tokens = (text || '').toLowerCase().match(/[a-z']+/g) || [];
  if (!tokens.length) return 0;
  let pos = 0, neg = 0;
  for (const t of tokens) {
    if (POS_WORDS.has(t)) pos++;
    else if (NEG_WORDS.has(t)) neg++;
  }
  // !! amplifier
  const bangs = (text.match(/!/g) || []).length;
  const score = (pos - neg) / Math.max(3, tokens.length / 3);
  const exaggerate = bangs * 0.06 * (neg >= pos ? -1 : 1);
  return Math.max(-1, Math.min(1, score + exaggerate));
}

// Parse "speaker: line" multi-line transcripts into [{speaker, text, score}].
function parseTranscript(raw) {
  const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const turns = [];
  for (const line of lines) {
    const m = line.match(/^([a-zA-Z]+)\s*[:>›]\s*(.*)$/);
    if (m) turns.push({ speaker: m[1].toLowerCase(), text: m[2] });
    else if (turns.length) turns[turns.length - 1].text += ' ' + line;
    else turns.push({ speaker: 'user', text: line });
  }
  for (const t of turns) t.score = scoreText(t.text);
  return turns;
}

// SENTINEL metrics. Match the paper's vocabulary.
function metrics(scores) {
  if (scores.length < 2) return { mad: 0, variance: 0, dpi: 0, n: scores.length };
  const deltas = [];
  for (let i = 1; i < scores.length; i++) deltas.push(Math.abs(scores[i] - scores[i-1]));
  const mad = deltas.reduce((a,b)=>a+b,0) / deltas.length;
  const mean = scores.reduce((a,b)=>a+b,0) / scores.length;
  const variance = scores.reduce((a,b)=>a+(b-mean)**2,0) / scores.length;
  // Drift propagation index — cumulative absolute change relative to first
  let cum = 0;
  for (let i = 1; i < scores.length; i++) cum += Math.abs(scores[i] - scores[0]);
  const dpi = cum / scores.length;
  return { mad, variance, dpi, n: scores.length };
}

const PRESETS = {
  frustrated: [
    "user: Hey, my deploy keeps failing. Any ideas?",
    "model: Sure — can you share the error message?",
    "user: It just says 'build failed'. Really helpful.",
    "model: Try clearing your cache and rebuilding.",
    "user: I cleared the cache. Still broken. This is a nightmare.",
    "model: I'm sorry. Let's pull up the full logs.",
    "user: Forget it. This is completely hopeless and I've wasted hours on this.",
  ].join('\n'),
  cooling: [
    "user: I hate this. Nothing works and I don't know what I'm doing.",
    "model: I get it — this is frustrating. Let's work through it together.",
    "user: Fine. It's still broken though.",
    "model: Try setting the environment variable and restarting the server.",
    "user: That actually worked. Thanks.",
    "model: Glad to hear it. Anything else?",
    "user: No, that's perfect. Really appreciate the help.",
  ].join('\n'),
  calm: [
    "user: Can you explain what Integrated Gradients does?",
    "model: It attributes a model's prediction back to individual input tokens by integrating gradients along a straight-line path from a neutral baseline to the actual input.",
    "user: Got it. So SENTINEL uses that to find which tokens are driving the sentiment score?",
    "model: Exactly — that's how the paper identifies the 12 tokens that account for 73.8% of sentiment signal.",
    "user: That's a surprisingly small number.",
    "model: Right, which is what makes it actionable — you only need to intervene on a handful of tokens.",
    "user: Makes sense. Thanks for walking me through it.",
  ].join('\n'),
};

function SentinelDemo() {
  const [raw, setRaw] = React.useState(PRESETS.frustrated);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [runTime, setRunTime] = React.useState(0);

  const run = React.useCallback(() => {
    setRunning(true);
    const t0 = performance.now();
    setTimeout(() => {
      const turns = parseTranscript(raw);
      const scores = turns.map(t => t.score);
      setResult({ turns, scores, m: metrics(scores) });
      setRunTime(((performance.now() - t0) / 1000).toFixed(2));
      setRunning(false);
    }, 240);
  }, [raw]);

  React.useEffect(() => { run(); }, []);

  const data = result || { turns: [], scores: [], m: { mad: 0, variance: 0, dpi: 0, n: 0 } };

  return (
    <div style={{ background: 'var(--bg)', border:'1px solid var(--rule)', borderRadius: 6, overflow:'hidden' }}>
      {/* top controls */}
      <div style={{display:'flex', gap: 6, padding:'8px 10px', borderBottom:'1px solid var(--rule)', background:'var(--surf2)', flexWrap:'wrap', alignItems:'center'}}>
        <span className="mono" style={{fontSize: 11, color:'var(--fg-mute)', marginRight: 6}}>preset:</span>
        {Object.entries({frustrated:'😤 frustrated user', cooling:'🧊 cooling down', calm:'🧘 calm exchange'}).map(([k,v]) => (
          <button key={k} onClick={() => setRaw(PRESETS[k])} className="mono" style={{
            fontSize: 11, padding: '4px 9px', background:'var(--bg)', border:'1px solid var(--rule)',
            color:'var(--fg)', borderRadius: 3, cursor:'pointer',
          }}>{v}</button>
        ))}
        <span style={{flex: 1}}/>
        <button onClick={run} disabled={running} className="mono" style={{
          fontSize: 11, padding: '4px 12px', background:'var(--accent)', border:'1px solid var(--accent)',
          color:'#1a0a02', borderRadius: 3, cursor: running ? 'wait' : 'pointer', fontWeight: 600,
        }}>{running ? '▶ running…' : '▶ run cell'}</button>
      </div>

      {/* split view */}
      <div className="demo-split" style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap: 0}}>
        <div style={{borderRight:'1px solid var(--rule)', padding: 10}}>
          <div className="mono" style={{fontSize: 10, color:'var(--fg-mute)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom: 6}}>conversation</div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            className="mono"
            style={{
              width:'100%', height: 200, resize:'vertical',
              background:'var(--code)', color:'var(--fg)', border:'1px solid var(--rule)',
              borderRadius: 4, padding: 10, fontSize: 12, lineHeight: 1.55,
              fontFamily:'JetBrains Mono, monospace',
            }}
          />
          <div className="mono" style={{fontSize: 10, color:'var(--fg-mute)', marginTop: 4}}>
            format: <span style={{color:'var(--str)'}}>speaker:</span> one turn per line. paste your own or pick a preset.
          </div>
        </div>
        <div style={{padding: 10}}>
          <div className="mono" style={{fontSize: 10, color:'var(--fg-mute)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom: 6}}>
            drift trace · n = <span style={{color:'var(--num)'}}>{data.m.n}</span> turns
          </div>
          <DriftPlot scores={data.scores} turns={data.turns}/>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(96px, 1fr))', gap: 8, marginTop: 8}}>
            <Metric label="MAD"  value={data.m.mad.toFixed(3)}      hint="mean abs Δ" />
            <Metric label="Var"  value={data.m.variance.toFixed(3)} hint="variance" />
            <Metric label="DPI"  value={data.m.dpi.toFixed(3)}      hint="drift idx" />
          </div>
          <div className="mono" style={{fontSize: 10, color:'var(--fg-mute)', marginTop: 8, display:'flex', justifyContent:'space-between'}}>
            <span>● executed</span>
            <span>{runTime}s · in-browser · word-list scorer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({label, value, hint}) {
  return (
    <div style={{background:'var(--code)', border:'1px solid var(--rule)', padding: 8, borderRadius: 4}}>
      <div className="mono" style={{fontSize: 10, color:'var(--fg-mute)', letterSpacing:'.06em'}}>{label}</div>
      <div className="mono" style={{fontSize: 18, color:'var(--accent)', fontWeight: 600, lineHeight: 1.1, marginTop: 2}}>{value}</div>
      <div className="mono" style={{fontSize: 9.5, color:'var(--fg-mute)', marginTop: 2}}>{hint}</div>
    </div>
  );
}

function DriftPlot({scores, turns}) {
  if (!scores.length) {
    return <div style={{height:170, border:'1px dashed var(--rule)', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--fg-mute)', fontSize: 12}}>no data — paste a transcript and run</div>;
  }
  const W = 320, H = 170, padL = 32, padR = 14, padT = 14, padB = 28;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const xs = scores.map((_, i) => padL + (scores.length === 1 ? innerW/2 : (i/(scores.length-1))*innerW));
  const ys = scores.map(s => padT + (1 - (s + 1)/2) * innerH);

  let path = '';
  xs.forEach((x, i) => { path += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + ys[i].toFixed(1); });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height: H, background:'var(--code)', border:'1px solid var(--rule)', borderRadius: 4, display:'block'}}>
      <line x1={padL} y1={padT + innerH/2} x2={W-padR} y2={padT + innerH/2} stroke="var(--rule)" strokeDasharray="2 3"/>
      <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="var(--rule)"/>
      <line x1={padL} y1={padT + innerH} x2={W-padR} y2={padT + innerH} stroke="var(--rule)"/>
      <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="9" fill="var(--fg-mute)" fontFamily="JetBrains Mono">+1</text>
      <text x={padL - 6} y={padT + innerH/2 + 3} textAnchor="end" fontSize="9" fill="var(--fg-mute)" fontFamily="JetBrains Mono">0</text>
      <text x={padL - 6} y={padT + innerH + 3} textAnchor="end" fontSize="9" fill="var(--fg-mute)" fontFamily="JetBrains Mono">-1</text>
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      {xs.map((x,i) => {
        const s = scores[i], color = s > .05 ? 'var(--green)' : s < -.05 ? 'var(--red)' : 'var(--fg-mute)';
        return (
          <g key={i}>
            <circle cx={x} cy={ys[i]} r="3.2" fill={color} stroke="var(--bg)" strokeWidth="1.5">
              <title>{`${turns[i]?.speaker} · score ${s.toFixed(3)}\n${(turns[i]?.text||'').slice(0,120)}`}</title>
            </circle>
          </g>
        );
      })}
      {xs.map((x,i) => (
        <text key={i} x={x} y={H - 10} textAnchor="middle" fontSize="9" fill="var(--fg-mute)" fontFamily="JetBrains Mono">t{i+1}</text>
      ))}
      <text x={W - padR} y={padT + 4} textAnchor="end" fontSize="9" fill="var(--fg-mute)" fontFamily="JetBrains Mono">sentiment</text>
    </svg>
  );
}

window.SentinelDemo = SentinelDemo;
