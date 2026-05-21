// site-data.jsx — All the content in one place. Easy to edit.

const SITE = {
  name: 'Alexander Arutchev',
  handle: '@AlexArutchev',
  role: 'high school researcher · developer',
  location: 'Northbrook, IL',
  notebook: 'alex-arutchev.ipynb',
  links: {
    linkedin: 'https://www.linkedin.com/in/alex-arutchev-585778310/',
    github:   'https://github.com/AlexArutchev',
    paper:    'https://openreview.net/pdf?id=6ZvINpYdOA',
    tremor:   'https://main-sepia-delta.vercel.app',
    nbjh:     'https://nbjhmathteam.org',
    sentinel: 'https://github.com/Pranav-A72/SENTINEL',
    resume:   'https://drive.google.com/file/d/1S_Pc5xus6-apXojpKks0dJDSbtBNU6u9/view?usp=sharing',
  },
  bio: `I'm a rising senior at Glenbrook North studying how LLMs drift emotionally across multi-step workflows, with a paper accepted at the NeurIPS 2025 MTI-LLM Workshop. I also build things: a supply chain contagion tracker that maps earnings shocks through knowledge graphs, and an interactive math platform that helped send a student to Illinois state.`,
  papers: [
    {
      venue: 'NeurIPS \'25 W',
      title: 'SENTINEL: Sentiment Evolution and Narrative Tracking in Extended LLM Interactions',
      authors: 'P. Anuraag · E. Xu · A. Arutchev · A. Nerenberg',
      year: 2025,
      role: '',
      tl: 'We show that emotional hallucinations in LLMs follow a distinct dynamic from factual ones, emerging in oscillatory bursts rather than accumulating linearly. SENTINEL introduces three complementary metrics (MAD, Variance, Drift Propagation Index) to quantify sentiment drift across five frontier LLMs. Token-level Integrated Gradients attribution reveals that just 12 tokens account for 73.8% of sentiment-bearing signal across 3,092 highlighted tokens, offering practical levers for mitigation in high-stakes agentic workflows.',
      stats: [
        ['MAD',  'mean absolute drift'],
        ['Var',  'variance over turns'],
        ['DPI',  'drift propagation index'],
      ],
      paperUrl: 'https://openreview.net/pdf?id=6ZvINpYdOA',
      codeUrl:  'https://github.com/Pranav-A72/SENTINEL',
    },
  ],
  projects: [
    {
      name: 'tremor',
      tagline: 'supply-chain contagion tracker',
      status: 'live',
      year: 2026,
      where: 'HackWithChicago 3.0 · with Mitchell Magid',
      blurb: 'Supply chain contagion tracker co-built with Mitchell Magid at HackWithChicago 3.0. Pick any company, set an earnings shock, and instantly see every connected company ranked by exposure, with an AI-generated analyst narrative. Describe a scenario in plain English and the system extracts company and magnitude automatically.',
      stack: ['Next.js','TypeScript','Neo4j','AI pipeline'],
      links: [['live demo','https://main-sepia-delta.vercel.app'],['github','https://github.com/hwc-contagion/main']],
    },
    {
      name: 'nbjh-math-team',
      tagline: 'platform for the Northbrook Jr. High math team',
      status: 'live',
      year: 2025,
      where: '~15 weekly users',
      blurb: 'Interactive web platform for the Northbrook Junior High math team, built to supplement weekly in-person coaching. Features AMC 8 problems, interactive math games, and lesson slides. The team sent its first student to the MathCounts State competition in five years.',
      stack: ['HTML/CSS','JavaScript'],
      links: [['live site','https://nbjhmathteam.org'],['github','https://github.com/AlexArutchev/nbjhmathteam']],
    },
    {
      name: 'sentinel-pipeline',
      tagline: 'ML pipeline behind the NeurIPS paper',
      status: 'pub',
      year: 2025,
      where: 'open source',
      blurb: 'Full ML pipeline for the NeurIPS paper. Processes IMDB reviews, MultiFC news, and Big Five essays through five frontier LLMs. Token-level attribution via Integrated Gradients (Captum); validated with one-way ANOVA (η²p up to .20, p < .001).',
      stack: ['Python','PyTorch','Captum','spaCy','Pandas'],
      links: [['github','https://github.com/Pranav-A72/SENTINEL']],
    },
  ],
  // sorted by relevance
  awards: [
    [2025, 'NeurIPS Workshop',    'MTI-LLM · paper accepted'],
    [2026, 'ACT',                 '36 / 36 composite'],
    [2026, 'Illinois Math State', '2nd place · individual'],
    [2025, 'AIME',                'qualifier'],
    [2025, 'USACO',               'silver division'],
    [2026, 'HMMT (Harvard-MIT)',  '2× qualifier'],
    [2025, 'SAT',                 '1550 / 1600'],
    [2025, 'AP Scholar',          'College Board'],
  ],
  education: {
    school: 'Glenbrook North High School',
    range: '2023 – present',
    note: 'Glenbrook Academy · 1 of 14 selected per grade',
    gpa: '4.96 / 5.00 weighted',
    courses: ['AP Calc BC: 5','AP CS A: 5','Multivariable Calc','Linear Algebra','Math Team · 2× HMMT','Varsity Chess','Varsity Tennis'],
  },
  stack: {
    'Languages':   ['Python','Java','JavaScript','TypeScript','HTML/CSS'],
    'ML & Data':   ['PyTorch','spaCy','Captum','Pandas','NumPy','Matplotlib'],
    'Tools':       ['Next.js','Neo4j','Git / GitHub','Jupyter','Overleaf'],
  },
};

window.SITE = SITE;
