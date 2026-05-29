// site.jsx — Jupyter notebook UI with interactive cells, menus, and keyboard shortcuts.

const { useState, useEffect, useRef, useCallback } = React;
const S = window.SITE;

// ── Cell IDs & metadata ───────────────────────────────────────────────────────
const CELL_IDS = ['research','projects','demo','awards','stack','contact'];
const RUN_TIMES  = {research:'0.04s',projects:'0.02s',demo:'0.31s',awards:'0.01s',stack:'0.00s',contact:'0.00s'};
const RUN_DELAYS = {research:460,projects:300,demo:560,awards:200,stack:130,contact:110};

function freshCells() {
  return Object.fromEntries(CELL_IDS.map(id => [id, {run:false, running:false, num:null}]));
}

// ── Menu definitions ──────────────────────────────────────────────────────────
const MENUS = {
  Cell: [
    {label:'Run Cell',                action:'run-active',      shortcut:'Ctrl-Enter'},
    {label:'Run Cell and Advance',    action:'run-select',      shortcut:'Shift-Enter'},
    {label:'Run All',                 action:'run-all'},
    {label:'Run All Above',           action:'run-above'},
    {label:'Run All Below',           action:'run-below'},
    null,
    {label:'Clear Output',            action:'clear-active'},
    {label:'Clear All Outputs',       action:'clear-all'},
  ],
  Kernel: [
    {label:'Restart',                 action:'restart'},
    {label:'Restart & Run All',       action:'restart-run-all'},
    {label:'Restart & Clear Output',  action:'restart-clear'},
  ],
};

// ── Syntax colour helpers ─────────────────────────────────────────────────────
const K   = ({children}) => <span style={{color:'var(--kw)'}}>{children}</span>;
const Str = ({children}) => <span style={{color:'var(--str)'}}>{children}</span>;
const Num = ({children}) => <span style={{color:'var(--num)'}}>{children}</span>;
const Cls = ({children}) => <span style={{color:'var(--cls)'}}>{children}</span>;
const Cm  = ({children}) => <span style={{color:'var(--fg-mute)',fontStyle:'italic'}}>{children}</span>;

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({message}) {
  if (!message) return null;
  return (
    <div style={{
      position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
      background:'var(--surf2)', border:'1px solid var(--rule)',
      color:'var(--fg)', fontFamily:'JetBrains Mono,monospace', fontSize:12,
      padding:'8px 18px', borderRadius:5, zIndex:1000, pointerEvents:'none',
      boxShadow:'0 4px 20px rgba(0,0,0,.5)', whiteSpace:'nowrap',
    }}>{message}</div>
  );
}

// ── Cell run button ───────────────────────────────────────────────────────────
function RunBtn({onRun, running}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); onRun(); }}
      title="Run cell  (Shift+Enter)"
      className="run-btn"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:'absolute', top:7, right:8,
        background: !running && hovered ? 'var(--accent)' : 'var(--surf)',
        border:'1px solid ' + (!running && hovered ? 'var(--accent)' : 'var(--rule)'),
        color: running ? 'var(--fg-mute)' : hovered ? '#1a0a02' : 'var(--accent)',
        borderRadius:3, padding:'2px 8px', fontSize:11,
        cursor: running ? 'wait' : 'pointer',
        fontFamily:'JetBrains Mono,monospace', fontWeight:600,
        transition:'background .15s ease, border-color .15s ease, color .15s ease',
        zIndex:2,
      }}
    >{running ? '■' : '▶ Run'}</button>
  );
}

// ── Cell shell ────────────────────────────────────────────────────────────────
function CellShell({n, kind, children, active, onClick, id, running, onRun}) {
  const isCode = kind === 'code';
  const gutter = () => {
    if (kind === 'code') {
      if (running)             return <>In [<span style={{color:'var(--accent)'}}>*</span>]:</>;
      if (n !== null && n >= 0) return <>In [<span style={{color:'var(--blue)'}}>{n}</span>]:</>;
      return                          <>In [ ]:</>;
    }
    if (kind === 'out')  return <>Out[<span style={{color:'var(--accent)'}}>{n}</span>]:</>;
    if (kind === 'md')   return <span style={{opacity:.4}}>md</span>;
  };
  return (
    <div id={id} onClick={onClick} className={'cell cell-'+kind+(active?' cell-active':'')} style={{
      display:'grid', gridTemplateColumns:'68px minmax(0,1fr)',
      marginBottom: kind==='out' ? 18 : 4, cursor:'default', position:'relative',
    }}>
      <div className="cell-gutter mono" style={{
        fontSize:11, color:'var(--fg-mute)', textAlign:'right', paddingRight:14,
        paddingTop: isCode ? 12 : kind==='md' ? 8 : 4, userSelect:'none', whiteSpace:'nowrap',
      }}>{gutter()}</div>
      <div className={'cell-body cell-body-'+kind} style={{
        background: isCode ? 'var(--code)' : 'transparent',
        border: isCode ? '1px solid var(--rule)' : 'none',
        borderLeft: isCode ? '3px solid '+(running ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--blue)') : 'none',
        borderRadius: isCode ? 4 : 0,
        padding: kind==='md' ? '6px 0' : kind==='out' ? '4px 0' : '10px 14px',
        minWidth:0, position:'relative',
        transition:'border-left-color .2s',
      }}>
        {children}
        {isCode && onRun && <RunBtn onRun={onRun} running={running}/>}
      </div>
    </div>
  );
}

function CodeCell({id, n, runTime, children, active, onClick, running, onRun}) {
  return (
    <CellShell n={n} kind="code" active={active} onClick={onClick} running={running} onRun={onRun}>
      <div className="mono" style={{fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-word',paddingRight:56}}>
        {children}
      </div>
      {n !== null && n >= 0 && !running && (
        <div className="mono" style={{fontSize:10,color:'var(--fg-mute)',marginTop:8,display:'flex',justifyContent:'space-between'}}>
          <span>▶ executed</span><span>{runTime}</span>
        </div>
      )}
    </CellShell>
  );
}

function OutCell({n, children}) {
  return (
    <CellShell n={n} kind="out">
      <div style={{padding:'4px 0'}}>{children}</div>
    </CellShell>
  );
}

function MdCell({children, id}) {
  return <CellShell id={id} kind="md">{children}</CellShell>;
}

// ── Resume button ─────────────────────────────────────────────────────────────
function ResumeBtn() {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a href={S.links.resume} target="_blank" rel="noreferrer" className="mono"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize:12, padding:'5px 12px',
        background: hovered ? '#ff8c3a' : 'var(--accent)',
        color:'#1a0a02', fontWeight:600, borderRadius:4, textDecoration:'none',
        display:'flex', alignItems:'center', gap:6,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(243,119,38,.25)' : 'none',
        transition:'transform .15s ease, background .15s ease, box-shadow .15s ease',
      }}>⬇ resume.pdf</a>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
function Toolbar({onRunAll, onInterrupt, onRestart, onJump, sections, openMenu, setOpenMenu, onMenuAction}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [setOpenMenu]);

  return (
    <header className="toolbar" style={{position:'sticky',top:0,zIndex:50,background:'var(--bg)',borderBottom:'1px solid var(--rule)'}}>
      {/* title bar */}
      <div style={{maxWidth:1180,margin:'0 auto',padding:'10px 24px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
        <a href="#top" className="mono" style={{fontWeight:700,color:'var(--accent)',textDecoration:'none',fontSize:14,display:'flex',alignItems:'center',gap:8}}>
          <JupyterMark/>Jupyter
        </a>
        <span className="mono" style={{fontSize:13,color:'var(--fg)'}}>
          <b>{S.notebook}</b> <span style={{color:'var(--fg-mute)'}}>· last edited just now</span>
        </span>
        <span style={{flex:1}}/>
        <div className="toolbar-nav mono" style={{display:'flex',gap:4,fontSize:12,color:'var(--fg-mute)'}}>
          {sections.map(s => (
            <a key={s.id} href={'#'+s.id} onClick={e=>{e.preventDefault();onJump(s.id);}}
               style={{color:'var(--fg-mute)',textDecoration:'none',padding:'4px 8px',borderRadius:3}}
               className="tnav-link">{s.label}</a>
          ))}
        </div>
        <ResumeBtn />
      </div>

      {/* menu + action bar */}
      <div ref={menuRef} className="tbar-bottom mono" style={{
        maxWidth:1180,margin:'0 auto',padding:'0 24px',display:'flex',
        gap:0,fontSize:11,color:'var(--fg-mute)',borderTop:'1px solid var(--rule-soft)',
        alignItems:'stretch', position:'relative',
      }}>
        {/* menu triggers */}
        {Object.keys(MENUS).map(name => (
          <div key={name} style={{position:'relative'}}>
            <button
              onClick={() => setOpenMenu(openMenu===name ? null : name)}
              className="menu-trigger mono"
              style={{
                background: openMenu===name ? 'var(--surf)' : 'transparent',
                border:'none', color: openMenu===name ? 'var(--fg)' : 'var(--fg-mute)',
                padding:'6px 10px', cursor:'pointer', fontSize:11,
                fontFamily:'JetBrains Mono,monospace',
                borderBottom: openMenu===name ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >{name}</button>
            {openMenu===name && (
              <div style={{
                position:'absolute', top:'100%', left:0,
                background:'var(--surf)', border:'1px solid var(--rule)',
                borderRadius:4, boxShadow:'0 8px 24px rgba(0,0,0,.5)',
                minWidth:240, zIndex:200, padding:'4px 0',
              }}>
                {MENUS[name].map((item, i) =>
                  item === null ? (
                    <div key={i} style={{height:1,background:'var(--rule)',margin:'3px 0'}}/>
                  ) : (
                    <button
                      key={i}
                      disabled={item.disabled}
                      onClick={() => { setOpenMenu(null); onMenuAction(item.action); }}
                      className="menu-item mono"
                      style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        width:'100%', background:'transparent', border:'none',
                        color: item.disabled ? 'var(--fg-mute)' : 'var(--fg)',
                        padding:'5px 16px', cursor: item.disabled ? 'default' : 'pointer',
                        fontSize:11.5, fontFamily:'JetBrains Mono,monospace', textAlign:'left',
                        gap:24,
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span style={{color:'var(--fg-mute)',fontSize:10}}>{item.shortcut}</span>}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}

        <span style={{marginLeft:16,opacity:.5,display:'flex',alignItems:'center'}}>│</span>

        {/* action buttons */}
        {[
          {icon:'▶ Run All', title:'Run all cells',       onClick:onRunAll,    accent:true},
          {icon:'■',         title:'Interrupt kernel',    onClick:onInterrupt},
          {icon:'↻',         title:'Restart kernel',      onClick:onRestart},
        ].map((b,i) => (
          <button key={i} onClick={b.onClick} title={b.title} className="tbar-btn mono" style={{
            background:'transparent', border:'1px solid var(--rule)',
            borderRadius:3, color: b.accent ? 'var(--accent)' : 'var(--fg-mute)',
            padding:'3px 8px', margin:'5px 2px', cursor:'pointer', fontSize:11,
            fontFamily:'JetBrains Mono,monospace',
          }}>{b.icon}</button>
        ))}

        <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,opacity:.8,fontSize:11}}>
          <span style={{color:'var(--green)'}}>● Trusted</span>
          <span>Python 3.11</span>
          <span style={{width:8,height:8,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>
        </span>
      </div>
    </header>
  );
}

function JupyterMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="6.5" cy="3.5" r="1.4" fill="var(--accent)"/>
      <circle cx="6.5" cy="20.5" r="1.4" fill="var(--accent)"/>
      <path d="M3 9c2.5 4 7 6 9 6s6.5-2 9-6" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M3 15c2.5-4 7-6 9-6s6.5 2 9 6" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" opacity=".55"/>
    </svg>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({id, num, title, sub}) {
  return (
    <MdCell id={id}>
      <h2 style={{fontFamily:"'Newsreader',serif",fontSize:'clamp(26px,3vw,34px)',fontWeight:600,margin:'36px 0 4px',letterSpacing:'-.01em'}}>
        <span className="mono" style={{color:'var(--accent)',fontSize:'.72em',marginRight:10,fontWeight:500}}>{num}.</span>
        {title}
      </h2>
      {sub && <p style={{margin:'2px 0 0',color:'var(--fg-mute)',fontSize:14,maxWidth:720}}>{sub}</p>}
    </MdCell>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroCell() {
  return (
    <MdCell id="top">
      <div style={{fontFamily:"'Newsreader',serif",fontWeight:600,fontSize:'clamp(40px,6vw,64px)',lineHeight:1.02,letterSpacing:'-.02em',margin:'20px 0 8px',textWrap:'pretty'}}>
        Alexander Arutchev
      </div>
      <div className="mono" style={{fontSize:13,color:'var(--fg-mute)',marginBottom:18,display:'flex',flexWrap:'wrap',gap:10}}>
        <span style={{background:'var(--surf)',padding:'3px 8px',border:'1px solid var(--rule)',borderRadius:3,color:'var(--fg)'}}>{S.role}</span>
        <span>· {S.location}</span>
        <span>· github <a href={S.links.github} style={{color:'var(--accent)'}}>{S.handle}</a></span>
      </div>
      <p style={{fontSize:'clamp(17px,1.6vw,19px)',lineHeight:1.55,marginTop:8,marginBottom:8,maxWidth:760,color:'var(--fg)',textWrap:'pretty'}}>{S.bio}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:18}}>
        <PillLink href={S.links.paper} primary>📄 read the paper</PillLink>
        <PillLink href="#sec-demo">↓ try the demo</PillLink>
      </div>
    </MdCell>
  );
}

function PillLink({href, children, primary}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a
      href={href}
      target={href.startsWith('#') ? undefined : '_blank'}
      rel="noreferrer"
      className="mono"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize:12, padding:'7px 12px',
        border:'1px solid '+(primary?'var(--accent)':'var(--rule)'),
        background: primary
          ? (hovered ? '#ff8c3a' : 'var(--accent)')
          : (hovered ? 'var(--surf2)' : 'transparent'),
        color: primary?'#1a0a02':'var(--fg)',
        fontWeight: primary?600:500,
        borderRadius:4, textDecoration:'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(243,119,38,.25)' : 'none',
        transition:'transform .15s ease, background .15s ease, box-shadow .15s ease',
        display:'inline-block',
      }}
    >{children}</a>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────
function ResearchSection({cs, onRun, active, setActive}) {
  const p = S.papers[0];
  return (
    <>
      <SectionHeading id="sec-research" num="1" title="Research" sub="One workshop paper, more in progress." />
      <CodeCell n={cs.num} runTime={RUN_TIMES.research} active={active==='research'} running={cs.running}
        onClick={()=>setActive('research')} onRun={()=>onRun('research')}>
        <Cm># latest publication, sorted by year</Cm>{'\n'}
        papers <span style={{color:'var(--fg-mute)'}}>= </span>pd.read_csv(<Str>"publications.csv"</Str>){'\n'}
        papers.sort_values(<Str>"year"</Str>, ascending=<K>False</K>).head()
      </CodeCell>
      {cs.run && (
        <OutCell n={cs.num}>
          <div style={{background:'var(--code)',border:'1px solid var(--rule)',borderRadius:4,padding:16}}>
            <div className="mono" style={{display:'flex',gap:10,fontSize:11,color:'var(--fg-mute)',marginBottom:10,flexWrap:'wrap'}}>
              <span style={{color:'var(--accent)',border:'1px solid var(--accent)',padding:'1px 7px',borderRadius:3}}>{p.venue}</span>
              <span>· {p.year}</span>
              {p.role && <span>· {p.role}</span>}
            </div>
            <div style={{fontSize:'clamp(17px,1.8vw,22px)',fontWeight:600,lineHeight:1.3,color:'var(--fg)',fontFamily:"'Newsreader',serif"}}>{p.title}</div>
            <div className="mono" style={{fontSize:12,color:'var(--fg-mute)',marginTop:6}}>{p.authors}</div>
            <p style={{marginTop:14,marginBottom:12,color:'var(--fg)',lineHeight:1.55,maxWidth:700}}>{p.tl}</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginTop:12,marginBottom:14}}>
              {p.stats.map(([k,v]) => (
                <div key={k} style={{background:'var(--bg)',border:'1px solid var(--rule)',padding:'8px 10px',borderRadius:4}}>
                  <div className="mono" style={{fontSize:11,color:'var(--accent)',fontWeight:600}}>{k}</div>
                  <div className="mono" style={{fontSize:10,color:'var(--fg-mute)'}}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mono" style={{display:'flex',gap:14,fontSize:12}}>
              <a href={p.paperUrl} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>[paper ↗]</a>
              <a href={p.codeUrl}  target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>[code ↗]</a>
            </div>
          </div>
        </OutCell>
      )}
    </>
  );
}

function ProjectsSection({cs, onRun, active, setActive}) {
  return (
    <>
      <SectionHeading id="sec-projects" num="2" title="Projects" sub="Things I've shipped." />
      <CodeCell n={cs.num} runTime={RUN_TIMES.projects} active={active==='projects'} running={cs.running}
        onClick={()=>setActive('projects')} onRun={()=>onRun('projects')}>
        <K>for</K> proj <K>in</K> projects: proj.render_card()
      </CodeCell>
      {cs.run && (
        <OutCell n={cs.num}>
          <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:14}}>
            {S.projects.map((p,i) => <ProjectCard key={p.name} p={p} i={i}/>)}
          </div>
        </OutCell>
      )}
    </>
  );
}

function ProjectCard({p, i}) {
  const statusColor = {live:'var(--green)',pub:'var(--accent)',archived:'var(--fg-mute)'}[p.status]||'var(--fg-mute)';
  return (
    <div style={{background:'var(--code)',border:'1px solid var(--rule)',borderRadius:4,padding:18,display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:8}}>
      <div style={{display:'flex',alignItems:'baseline',gap:12,flexWrap:'wrap'}}>
        <span className="mono" style={{fontSize:11,color:'var(--num)'}}>[{i}]</span>
        <span style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{p.name}</span>
        <span className="mono" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,padding:'2px 8px',border:'1px solid '+statusColor,color:statusColor,borderRadius:3}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:statusColor,boxShadow:'0 0 6px '+statusColor}}/>
          {p.status}
        </span>
        <span className="mono" style={{fontSize:11,color:'var(--fg-mute)',marginLeft:'auto'}}>{p.year} · {p.where}</span>
      </div>
      <div className="mono" style={{fontSize:12,color:'var(--fg-mute)'}}>{p.tagline}</div>
      <p style={{margin:'6px 0 8px',color:'var(--fg)',lineHeight:1.55,maxWidth:760}}>{p.blurb}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
        {p.stack.map(s => (
          <span key={s} className="mono" style={{fontSize:10.5,padding:'2px 7px',background:'var(--surf)',color:'var(--fg-mute)',border:'1px solid var(--rule)',borderRadius:3}}>{s}</span>
        ))}
        <span style={{flex:1}}/>
        {p.links.map(([label,url]) => (
          <a key={label} href={url} target="_blank" rel="noreferrer" className="mono" style={{fontSize:12,color:'var(--accent)',textDecoration:'none',padding:'2px 4px'}}>{label} ↗</a>
        ))}
      </div>
    </div>
  );
}

function DemoSection({cs, onRun, active, setActive}) {
  return (
    <>
      <SectionHeading id="sec-demo" num="3" title="Live SENTINEL widget"
        sub="Paste a multi-turn conversation and watch the sentiment drift in real time. The scorer is a browser-friendly approximation, but the MAD, Variance, and DPI calculations are identical to the paper." />
      <CodeCell n={cs.num} runTime={RUN_TIMES.demo} active={active==='demo'} running={cs.running}
        onClick={()=>setActive('demo')} onRun={()=>onRun('demo')}>
        <K>from</K> sentinel <K>import</K> drift_widget{'\n'}
        drift_widget(scorer=<Str>"bag-of-words"</Str>, mode=<Str>"interactive"</Str>)
      </CodeCell>
      {cs.run && (
        <OutCell n={cs.num}><SentinelDemo/></OutCell>
      )}
    </>
  );
}

function AwardsSection({cs, onRun, active, setActive}) {
  const ed = S.education;
  return (
    <>
      <SectionHeading id="sec-awards" num="4" title="Education & awards" sub="Glenbrook North, '23–'27." />
      <CodeCell n={cs.num} runTime={RUN_TIMES.awards} active={active==='awards'} running={cs.running}
        onClick={()=>setActive('awards')} onRun={()=>onRun('awards')}>
        awards.sort_values(<Str>"relevance"</Str>, ascending=<K>False</K>)
      </CodeCell>
      {cs.run && (
        <OutCell n={cs.num}>
          <div style={{background:'var(--code)',border:'1px solid var(--rule)',borderRadius:4,padding:12,overflowX:'auto'}}>
            <table className="mono" style={{width:'100%',borderCollapse:'collapse',fontSize:12.5,minWidth:360}}>
              <thead>
                <tr style={{color:'var(--fg-mute)',textAlign:'left',borderBottom:'1px solid var(--rule)'}}>
                  <th style={{padding:'6px 8px',fontWeight:500}}>award</th>
                  <th style={{padding:'6px 8px',fontWeight:500}}>detail</th>
                </tr>
              </thead>
              <tbody>
                {S.awards.map(([year,award,note],i) => (
                  <tr key={i} style={{borderBottom:'1px solid var(--rule-soft)'}}>
                    <td style={{padding:'7px 8px',color:'var(--fg)',whiteSpace:'nowrap'}}>{award}</td>
                    <td style={{padding:'7px 8px',color:'var(--fg-mute)'}}>{note} <span style={{color:'var(--num)',fontSize:11}}>· {year}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mono" style={{fontSize:11,color:'var(--fg-mute)',marginTop:8,padding:'0 4px'}}>
            {S.awards.length} rows × 2 columns · sorted by relevance
          </div>
          <div style={{marginTop:16,background:'var(--surf)',border:'1px solid var(--rule)',borderRadius:4,padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'baseline',gap:16,flexWrap:'wrap',marginBottom:10}}>
              <span style={{fontWeight:600,fontSize:14,color:'var(--fg)'}}>{ed.school}</span>
              <span className="mono" style={{fontSize:11,color:'var(--fg-mute)'}}>{ed.range}</span>
              <span className="mono" style={{fontSize:11,color:'var(--num)'}}>{ed.gpa}</span>
              <span className="mono" style={{fontSize:11,color:'var(--fg-mute)'}}>{ed.note}</span>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {ed.courses.map(c => (
                <span key={c} className="mono" style={{fontSize:11,padding:'3px 9px',background:'var(--code)',color:'var(--fg-mute)',border:'1px solid var(--rule)',borderRadius:3}}>{c}</span>
              ))}
            </div>
          </div>
        </OutCell>
      )}
    </>
  );
}

function StackSection({cs, onRun, active, setActive}) {
  return (
    <>
      <SectionHeading id="sec-stack" num="5" title="Stack" sub="Things I reach for first." />
      <CodeCell n={cs.num} runTime={RUN_TIMES.stack} active={active==='stack'} running={cs.running}
        onClick={()=>setActive('stack')} onRun={()=>onRun('stack')}>
        <K>print</K>(stack)
      </CodeCell>
      {cs.run && (
        <OutCell n={cs.num}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
            {Object.entries(S.stack).map(([k,list]) => (
              <div key={k} style={{background:'var(--code)',border:'1px solid var(--rule)',borderRadius:4,padding:14}}>
                <div className="mono" style={{fontSize:10,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>{k}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {list.map(t => (
                    <span key={t} className="mono" style={{fontSize:11.5,padding:'3px 8px',background:'var(--bg)',color:'var(--fg)',border:'1px solid var(--rule)',borderRadius:3}}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </OutCell>
      )}
    </>
  );
}

function ContactSection({cs, onRun, active, setActive}) {
  return (
    <>
      <SectionHeading id="sec-contact" num="6" title="Contact" sub="Best place to reach me." />
      <CodeCell n={cs.num} runTime={RUN_TIMES.contact} active={active==='contact'} running={cs.running}
        onClick={()=>setActive('contact')} onRun={()=>onRun('contact')}>
        contact[<Str>"linkedin"</Str>], contact[<Str>"github"</Str>], contact[<Str>"paper"</Str>], contact[<Str>"resume"</Str>]
      </CodeCell>
      {cs.run && (
        <OutCell n={cs.num}>
          <div style={{background:'var(--code)',border:'1px solid var(--rule)',borderRadius:4,padding:20,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
            <ContactLine label="linkedin" value="/in/alex-arutchev" href={S.links.linkedin}/>
            <ContactLine label="github"   value={S.handle}         href={S.links.github}/>
            <ContactLine label="paper"    value="openreview.net ↗" href={S.links.paper}/>
            <ContactLine label="resume"    value="open in drive ↗"   href={S.links.resume}/>
          </div>
          <div className="mono" style={{fontSize:11,color:'var(--fg-mute)',marginTop:14,textAlign:'center',padding:12,borderTop:'1px dashed var(--rule)'}}>
            <Cm># end of notebook · {new Date().getFullYear()}</Cm>
          </div>
        </OutCell>
      )}
    </>
  );
}

function ContactLine({label, value, href, download}) {
  return (
    <a href={href} download={download||undefined} target={download?undefined:'_blank'} rel="noreferrer" className="mono"
      style={{display:'block',padding:14,background:'var(--bg)',border:'1px solid var(--rule)',borderRadius:4,textDecoration:'none',color:'var(--fg)'}}>
      <div style={{fontSize:10,color:'var(--fg-mute)',textTransform:'uppercase',letterSpacing:'.1em'}}>{label}</div>
      <div style={{fontSize:14,color:'var(--accent)',marginTop:4}}>{value}</div>
    </a>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
const SECTIONS = [
  {id:'top',          label:'~/'},
  {id:'sec-research', label:'research'},
  {id:'sec-projects', label:'projects'},
  {id:'sec-demo',     label:'demo'},
  {id:'sec-awards',   label:'awards'},
  {id:'sec-stack',    label:'stack'},
  {id:'sec-contact',  label:'contact'},
];

function App() {
  const [cells, setCells]       = useState(freshCells);
  const [activeCell, setActive] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [toast, setToast]       = useState(null);
  const counterRef              = useRef(0);
  const toastTimer              = useRef(null);

  // ── toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback(msg => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ── run a single cell ────────────────────────────────────────────────────────
  const runCell = useCallback(id => {
    if (!CELL_IDS.includes(id)) return;
    setCells(prev => {
      if (prev[id].running) return prev;
      return {...prev, [id]: {...prev[id], running:true, run:false}};
    });
    setTimeout(() => {
      counterRef.current += 1;
      const num = counterRef.current;
      setCells(prev => ({...prev, [id]: {run:true, running:false, num}}));
    }, RUN_DELAYS[id]);
  }, []);

  // ── run all cells in sequence ────────────────────────────────────────────────
  const runAll = useCallback(() => {
    CELL_IDS.forEach((id, i) => setTimeout(() => runCell(id), i * 550));
    showToast('Running all cells…');
  }, [runCell, showToast]);

  // ── restart kernel ───────────────────────────────────────────────────────────
  const restart = useCallback((thenRun = false) => {
    counterRef.current = 0;
    setCells(freshCells());
    if (thenRun) setTimeout(runAll, 400);
    showToast(thenRun ? 'Kernel restarted · running all cells…' : 'Kernel restarted · all outputs cleared.');
  }, [runAll, showToast]);

  // ── menu action dispatcher ────────────────────────────────────────────────────
  const handleMenuAction = useCallback(action => {
    const index = activeCell ? CELL_IDS.indexOf(activeCell) : -1;

    const TOASTS = {
      interrupt: 'Kernel interrupted.',
    };

    switch (action) {
      case 'run-active':
      case 'run-select':
        if (activeCell) { runCell(activeCell); }
        else { showToast('No cell selected — click a cell first.'); }
        break;
      case 'run-all':       runAll(); break;
      case 'run-above':
        if (index > 0) { CELL_IDS.slice(0,index).forEach((id,i) => setTimeout(()=>runCell(id), i*500)); showToast('Running all cells above…'); }
        else showToast('No cells above.');
        break;
      case 'run-below':
        if (index >= 0 && index < CELL_IDS.length-1) { CELL_IDS.slice(index+1).forEach((id,i) => setTimeout(()=>runCell(id), i*500)); showToast('Running all cells below…'); }
        else showToast('No cells below.');
        break;
      case 'clear-active':
        if (activeCell) { setCells(prev => ({...prev, [activeCell]: {run:false, running:false, num:null}})); showToast('Output cleared.'); }
        break;
      case 'clear-all':     restart(false); break;
      case 'restart':       restart(false); break;
      case 'restart-run-all': restart(true); break;
      case 'restart-clear': restart(false); break;
      case 'shortcuts':
        showToast('Shift+Enter: run cell · Ctrl+Enter: run in place · A/B: insert cell · DD: delete');
        break;
      default:
        if (TOASTS[action]) showToast(TOASTS[action]);
    }
  }, [activeCell, runCell, runAll, restart, showToast]);

  // ── keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' && e.shiftKey && activeCell) {
        // Shift+Enter: run cell and advance to next
        e.preventDefault();
        runCell(activeCell);
        const idx = CELL_IDS.indexOf(activeCell);
        if (idx < CELL_IDS.length - 1) setActive(CELL_IDS[idx + 1]);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && activeCell) {
        // Ctrl+Enter: run cell in place
        e.preventDefault();
        runCell(activeCell);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeCell, runCell]);

  const jump = id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    history.replaceState(null,'','#'+id);
  };

  const sectionProps = id => ({
    cs: cells[id],
    onRun: runCell,
    active: activeCell,
    setActive,
  });

  return (
    <>
      <style>{`
        .tnav-link:hover  { background:var(--surf); color:var(--fg) !important; }
        .cell-body-code:hover .run-btn { opacity:1 !important; }
        .cell-active .run-btn { opacity:1 !important; }
        .run-btn { opacity:0; }
        .menu-item:not(:disabled):hover { background:var(--selected) !important; color:#fff !important; }
        .menu-trigger:hover { background:var(--surf) !important; color:var(--fg) !important; }
        .tbar-btn:hover { background:var(--surf) !important; color:var(--fg) !important; border-color:var(--fg-mute) !important; }
        a { text-decoration:none; } a:hover { text-decoration:underline; }
        .toolbar-nav a:hover { text-decoration:none; }
        @media (max-width:720px) {
          .toolbar-nav { display:none !important; }
          .tbar-bottom { flex-wrap:wrap; }
          .cell { grid-template-columns:1fr !important; }
          .cell-gutter { padding:4px 0 0 4px !important; text-align:left !important; }
          .demo-split { grid-template-columns:1fr !important; }
          .demo-split>div:first-child { border-right:none !important; border-bottom:1px solid var(--rule) !important; }
        }
      `}</style>
      <Toolbar
        onRunAll={runAll}
        onInterrupt={() => { showToast('Kernel interrupted.'); setCells(prev => Object.fromEntries(Object.entries(prev).map(([k,v]) => [k,{...v,running:false}]))); }}
        onRestart={() => restart(false)}
        onJump={jump}
        sections={SECTIONS}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        onMenuAction={handleMenuAction}
      />
      <main style={{maxWidth:1180,margin:'0 auto',padding:'24px 24px 80px'}}>
        <HeroCell/>
        <ResearchSection {...sectionProps('research')}/>
        <ProjectsSection {...sectionProps('projects')}/>
        <DemoSection     {...sectionProps('demo')}/>
        <AwardsSection   {...sectionProps('awards')}/>
        <StackSection    {...sectionProps('stack')}/>
        <ContactSection  {...sectionProps('contact')}/>
      </main>
      <Toast message={toast}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
