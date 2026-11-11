import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronDown, Lightbulb } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';

const groups = ['Basics', 'Core concepts', 'Tools and workflow', 'Standards and management', 'Advanced and career'];
const navbarAccent = 'linear-gradient(90deg, #7A1F2B 0%, #A52A32 22%, #D34B2F 48%, #E97832 68%, #C94C2D 84%, #7A1F2B 100%)';

const topics = [
  {
    id: 'what-is-bim', group: 0, title: 'What is BIM?',
    body: [
      'Building Information Modeling (BIM) is a process of creating and managing a digital representation of a building or infrastructure asset, including its physical and functional characteristics. The model is a shared source of information that architects, engineers, contractors and owners all work from.',
      'BIM is not just 3D modeling. A 3D model only describes geometry. In BIM every element (wall, door, pipe, beam) carries data such as material, fire rating, cost, manufacturer and maintenance schedule, and the elements are linked, so changing one view updates every other view.',
    ],
    table: { head: ['', 'CAD (2D/3D)', 'BIM'], rows: [
      ['Unit of work', 'Lines, arcs, surfaces', 'Intelligent objects (wall, door, duct)'],
      ['Data', 'Mostly graphical', 'Geometry plus attributes'],
      ['Changes', 'Edit each drawing separately', 'Edit once, all views update'],
      ['Outputs', 'Drawings', 'Drawings, schedules, quantities, simulations'],
    ] },
    links: [['BIM overview (Wikipedia)', 'https://en.wikipedia.org/wiki/Building_information_modeling'], ['buildingSMART International', 'https://www.buildingsmart.org']],
  },
  {
    id: 'benefits-challenges', group: 0, title: 'Benefits and challenges',
    body: ['BIM reduces rework by catching design conflicts before construction, but adopting it needs investment in software, training and changed working habits.'],
    points: [
      'Benefits: better coordination, fewer clashes on site, accurate quantities, faster approvals, lower lifecycle cost, better visualization for clients.',
      'Challenges: high initial software and hardware cost, skill shortage, resistance to change, unclear data ownership, and interoperability problems between software.',
      'Most failures come from process, not software: no agreed standards, no clear responsibility for the model, or unrealistic expectations on detail.',
    ],
  },
  {
    id: 'dimensions', group: 1, title: 'BIM dimensions (3D to 7D)',
    body: ['"Dimensions" describe the kind of information added to the geometric model. The numbering is a convention, and some organisations extend it beyond 7D.'],
    table: { head: ['Dimension', 'Adds', 'Used for'], rows: [
      ['3D', 'Geometry and object data', 'Design, visualization, coordination'],
      ['4D', 'Time / schedule', 'Construction sequencing, site logistics'],
      ['5D', 'Cost', 'Quantity takeoff, estimating, budget tracking'],
      ['6D', 'Sustainability and energy', 'Energy analysis, carbon and lifecycle studies'],
      ['7D', 'Facility management', 'Maintenance, asset data, operations'],
    ] },
  },
  {
    id: 'lod', group: 1, title: 'Level of Development (LOD) and LOI',
    body: [
      'LOD describes how reliable and detailed a model element is at a given stage. LOI (Level of Information) describes the non-graphical data attached to it. The LOD specification published by BIMForum uses the levels below.',
    ],
    table: { head: ['Level', 'Meaning'], rows: [
      ['LOD 100', 'Concept: symbol or generic mass, approximate'],
      ['LOD 200', 'Generic element with approximate size, shape and location'],
      ['LOD 300', 'Specific element with accurate size, shape and location'],
      ['LOD 350', 'LOD 300 plus connections and interfaces with other elements'],
      ['LOD 400', 'Fabrication-ready detail'],
      ['LOD 500', 'As-built, field verified'],
    ] },
    points: ['A higher LOD is not always better. Model only what the project stage and the BIM Execution Plan require.'],
    links: [['BIMForum LOD Specification', 'https://bimforum.org/resources/']],
  },
  {
    id: 'parametric', group: 1, title: 'Parametric modeling and families',
    body: [
      'Parametric modeling means objects are driven by rules and parameters instead of fixed shapes. A door can have width, height, fire rating and hardware as parameters, and relations such as "a window must sit inside a wall". Move the wall and the window follows.',
      'In Revit, reusable components are called families (for example a door or a pump). Families can be system (walls, floors), loadable (doors, furniture) or in-place (one-off custom geometry). Good families are light, correctly parametrised and carry the right data.',
    ],
  },
  {
    id: 'lifecycle', group: 1, title: 'BIM across the project lifecycle',
    body: ['BIM is used from the first sketch to demolition, not only during design.'],
    points: [
      'Planning and design: site analysis, concept massing, energy and daylight studies, design reviews.',
      'Pre-construction: coordination, clash detection, quantity takeoff, cost estimates, 4D phasing.',
      'Construction: prefabrication, site logistics, progress tracking, RFIs and submittals linked to the model.',
      'Operation: as-built handover, asset data (COBie), maintenance planning, renovation and digital twin.',
    ],
  },
  {
    id: 'software', group: 2, title: 'BIM software',
    body: ['No single tool does everything. Teams combine authoring, coordination, analysis and review tools and exchange data through open formats.'],
    table: { head: ['Tool', 'Main use'], rows: [
      ['Autodesk Revit', 'Architecture, structure and MEP authoring'],
      ['Navisworks', 'Federated model review, clash detection, 4D'],
      ['ArchiCAD', 'Architectural BIM authoring (Graphisoft)'],
      ['Tekla Structures', 'Detailed steel and concrete modeling'],
      ['Solibri', 'Model checking and quality assurance'],
      ['Dynamo', 'Visual-programming automation for Revit'],
    ] },
    links: [['Revit', 'https://www.autodesk.com/products/revit/overview'], ['Navisworks', 'https://www.autodesk.com/products/navisworks/overview'], ['Solibri', 'https://www.solibri.com'], ['Dynamo', 'https://dynamobim.org']],
  },
  {
    id: 'authoring', group: 2, title: 'Model authoring and documentation',
    body: ['Authoring means building the model from intelligent elements and then generating documents from it.'],
    points: [
      'Set up first: project units, levels, grids, shared coordinates and worksets.',
      'Model elements: walls, floors, roofs, doors, windows, stairs, columns, beams, ducts and pipes.',
      'Documentation: plans, sections, elevations, 3D views, sheets and schedules are all views of the same model.',
      'Keep a clean model: name views and families consistently, purge unused content, and audit regularly.',
    ],
  },
  {
    id: 'clash', group: 2, title: 'Clash detection and coordination',
    body: [
      'Each discipline (architecture, structure, MEP) models separately. In coordination their models are combined into a federated model and tested for conflicts, such as a duct passing through a beam.',
      'Clashes are classed as hard (two objects occupy the same space), soft (clearance or access zone violated) and workflow clashes (sequence or time conflicts). Results are grouped, assigned, resolved and re-tested in regular coordination meetings.',
    ],
    points: ['Tip: agree on tolerances and clash rules up front, otherwise thousands of irrelevant clashes bury the real ones.'],
  },
  {
    id: '4d-5d', group: 2, title: '4D scheduling and 5D quantity takeoff',
    body: [
      '4D links model elements to tasks in a construction schedule, so you can play the build sequence and spot logistic problems, such as crane position or overlapping trades, before they happen.',
      '5D extracts quantities directly from the model (areas, volumes, lengths, counts) and attaches unit rates for estimates. Accuracy depends on model quality, so the model must be built with takeoff in mind.',
    ],
  },
  {
    id: 'cde', group: 2, title: 'Common Data Environment (CDE)',
    body: [
      'A CDE is the single, agreed digital space where project information is created, shared and stored. It avoids version confusion by controlling who can see what and in which state.',
      'Under ISO 19650 information moves through four states: Work in Progress, Shared, Published and Archive. Examples of CDE platforms include Autodesk Construction Cloud, Trimble Connect and Bentley ProjectWise.',
    ],
  },
  {
    id: 'standards', group: 3, title: 'Open standards: IFC, COBie, BCF',
    body: ['Open formats let different software exchange data without being locked to one vendor (openBIM).'],
    points: [
      'IFC (Industry Foundation Classes): neutral file format for BIM data, maintained by buildingSMART and standardised as ISO 16739.',
      'COBie: structured spreadsheet-style format for handing over asset data to the facility owner.',
      'BCF (BIM Collaboration Format): lightweight format for sharing issues and comments between tools without sending whole models.',
    ],
    links: [['IFC (buildingSMART)', 'https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/'], ['openBIM', 'https://www.buildingsmart.org/about/openbim/']],
  },
  {
    id: 'iso-19650', group: 3, title: 'ISO 19650 and BIM levels',
    body: [
      'ISO 19650 is the international standard for organising and managing information over the whole life of a built asset. It defines roles (appointing party, lead appointed party, task teams), information requirements and the CDE workflow.',
      'The older UK "BIM Levels" described maturity: Level 0 (CAD, paper), Level 1 (2D/3D CAD with managed data), Level 2 (collaborative discipline models in a shared environment) and Level 3 (fully integrated open data). The UK now frames this as "BIM according to the ISO 19650 series".',
    ],
    links: [['ISO 19650-1:2018', 'https://www.iso.org/standard/68078.html'], ['UK BIM Framework', 'https://ukbimframework.org'], ['US National BIM Standard', 'https://www.nationalbimstandard.org']],
  },
  {
    id: 'bep', group: 3, title: 'BIM Execution Plan (BEP)',
    body: ['The BEP is the document that explains how BIM will be delivered on a specific project. A pre-contract BEP states the supplier\'s proposed approach, and a post-contract BEP is the agreed working plan.'],
    points: [
      'Project goals and BIM uses.',
      'Roles, responsibilities and team contacts.',
      'Modeling standards: naming, coordinates, LOD/LOI per stage.',
      'Software versions and exchange formats.',
      'Coordination schedule, clash rules and issue management.',
      'CDE structure, security and handover requirements.',
    ],
  },
  {
    id: 'roles', group: 3, title: 'BIM roles',
    body: ['Titles vary between companies, but these roles appear on most projects.'],
    table: { head: ['Role', 'Responsibility'], rows: [
      ['BIM Modeler / Technician', 'Builds and maintains discipline models'],
      ['BIM Coordinator', 'Combines models, runs clash detection, tracks issues'],
      ['BIM Manager', 'Sets standards, manages the BEP, software and team quality'],
      ['Information Manager', 'Runs the CDE and information delivery (ISO 19650)'],
      ['BIM Director / Strategist', 'Organisation-wide BIM strategy and adoption'],
    ] },
  },
  {
    id: 'advanced', group: 4, title: 'Advanced technologies',
    body: ['BIM is increasingly combined with other technologies.'],
    points: [
      'Laser scanning and photogrammetry: capture existing conditions as point clouds (scan-to-BIM).',
      'Drones and reality capture: site progress monitoring against the model.',
      'AR / VR: walk through the model before it is built, or overlay it on site.',
      'Digital twin: the model connected to live sensor data for operations.',
      'Automation and AI: scripts (Dynamo, Python) and tools that check models, generate options or classify elements.',
      'Prefabrication and 3D printing: model-driven manufacturing of components.',
    ],
  },
  {
    id: 'career', group: 4, title: 'Career path and interview questions',
    body: ['Typical path: BIM modeler, then coordinator, then BIM manager, then director. Civil, architecture and mechanical/electrical diploma or degree holders all enter through BIM modeling, and certifications such as Autodesk Certified Professional help show skill.'],
    points: [
      'What is the difference between BIM and CAD?',
      'Explain LOD 300 vs LOD 400.',
      'What is a federated model and why is it used?',
      'How do you handle clash detection on a live project?',
      'What does a BIM Execution Plan contain?',
      'What is IFC and why does it matter?',
    ],
  },
];

const wrap = 'customer-page-container';

const tools = ['Revit', 'Navisworks', 'AutoCAD', 'BIM 360', 'Dynamo', 'Solibri'];

function Table({ head, rows }) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border border-[#e4e7ed]">
      <table className="w-full min-w-[460px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-[#f3f4f8]">{head.map((h, i) => <th key={i} className="border-b border-[#e4e7ed] px-4 py-2.5 font-semibold text-[#112e49]">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="even:bg-[#fafbfd]">
              {r.map((c, j) => <td key={j} className={`border-b border-[#eef0f4] px-4 py-2.5 align-top leading-6 ${j === 0 ? 'font-semibold text-[#112e49]' : 'text-[#4b5b6c]'}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Topic({ topic, index, next }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.article
      id={topic.id}
      data-topic={topic.id}
      className="scroll-mt-24 border-b border-[#e4e7ed] py-9 first:pt-0"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <p className="m-0 text-sm font-semibold text-[#7A1F2B]">{groups[topic.group]} &middot; Topic {index + 1}</p>
      <h2 className="mt-1 font-[Manrope] text-2xl font-bold tracking-[-.02em] text-[#112e49] sm:text-[1.7rem]">{topic.title}</h2>
      {topic.body.map((p, i) => <p key={i} className="mt-4 max-w-[70ch] text-[15px] leading-7 text-[#3d4f61]">{p}</p>)}
      {topic.table && <Table {...topic.table} />}
      {topic.points && (
        <ul className="mt-4 max-w-[70ch] space-y-2 pl-5 text-[15px] leading-7 text-[#3d4f61] marker:text-[#D34B2F]">
          {topic.points.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
      {topic.links && (
        <div className="mt-5">
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-[#7A1F2B] hover:text-[#E97832]">
            <Lightbulb size={15} /> Further reading
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex"><ChevronDown size={15} /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }} className="m-0 mt-2 list-none space-y-1.5 overflow-hidden p-0">
                {topic.links.map(([label, href]) => (
                  <li key={href}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#7A1F2B] underline-offset-2 hover:text-[#E97832] hover:underline">
                      {label} <ArrowUpRight size={13} />
                    </a>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
      {next && (
        <a href={`#${next.id}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7A1F2B] no-underline hover:text-[#E97832]">
          Next: {next.title} <ArrowRight size={15} />
        </a>
      )}
    </motion.article>
  );
}

function BimPage() {
  const [active, setActive] = useState(topics[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.dataset.topic)),
      { rootMargin: '-96px 0px -65% 0px' },
    );
    document.querySelectorAll('[data-topic]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const go = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    window.history.replaceState(null, '', `#${id}`);
  };

  const contents = groups.map((g, gi) => (
    <div key={g} className="mb-5">
      <p className="m-0 mb-1.5 text-[13px] font-bold text-[#112e49]">{g}</p>
      <ul className="m-0 list-none space-y-0.5 p-0">
        {topics.filter((t) => t.group === gi).map((t) => (
          <li key={t.id} className="relative">
            {active === t.id && <motion.span layoutId="toc-mark" className="absolute inset-y-0 left-0 w-[3px] rounded" style={{ background: navbarAccent }} />}
            <a href={`#${t.id}`} onClick={(e) => go(e, t.id)}
              className={`block py-1.5 pl-3 text-sm no-underline ${active === t.id ? 'font-semibold text-[#7A1F2B]' : 'text-[#5a6b7d] hover:text-[#E97832]'}`}>{t.title}</a>
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#12243a]">
      <Navbar />
      <main>
        <section className="bg-white">
          <div className={`${wrap} border-b border-[#e8eaf0] py-12 sm:py-16`}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="m-0 text-sm text-[#687789]"><a href="/" className="text-[#7A1F2B] no-underline hover:text-[#E97832]">Home</a> / Learn BIM</p>
              <h1 className="customer-page-title customer-page-title--spaced text-[#112e49]">Learn Building Information Modeling, topic by topic.</h1>
              <p className="customer-page-lead mt-4 max-w-xl text-[#4b5b6c]">Short, clear lessons on BIM concepts, software, standards and careers. Read them in order or jump straight to what you need.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="inline-flex min-h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white no-underline" style={{ background: navbarAccent }} href="#what-is-bim" onClick={(e) => go(e, 'what-is-bim')}>Start learning <ArrowRight size={16} /></a>
                <a className="inline-flex min-h-11 items-center rounded-lg border border-[#A52A32] bg-white px-5 text-sm font-bold text-[#7A1F2B] no-underline transition-colors hover:border-[#E97832] hover:text-[#E97832]" href="/courses">Explore BIM courses</a>
              </div>
            </motion.div>

          </div>
        </section>

        <div className={`${wrap} grid gap-10 py-10 sm:py-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14`}>
          <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2 lg:[scrollbar-width:thin]">
            <details className="lg:hidden rounded-lg border border-[#e4e7ed] bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-bold text-[#112e49]">Contents</summary>
              <div className="mt-3">{contents}</div>
            </details>
            <nav aria-label="BIM topics" className="hidden lg:block">
              <p className="m-0 mb-3 font-[Manrope] text-base font-bold text-[#112e49]">Contents</p>
              {contents}
            </nav>
          </aside>

          <div className="min-w-0">
            {topics.map((t, i) => <Topic key={t.id} topic={t} index={i} next={topics[i + 1]} />)}

            <motion.div className="mt-10 rounded-xl border border-[#f1d8ce] bg-[#fff8f4] p-6 sm:p-8" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <h2 className="m-0 font-[Manrope] text-xl font-bold text-[#112e49]">Tools you will meet in practice</h2>
              <div className="mt-4 flex flex-wrap gap-2">{tools.map((tool) => <span key={tool} className="rounded-full border border-[#e7b6a4] bg-white px-3 py-1.5 text-xs font-bold text-[#7A1F2B]">{tool}</span>)}</div>
              <a href="/courses" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7A1F2B] no-underline hover:text-[#E97832] hover:underline">See guided BIM courses <ArrowRight size={15} /></a>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BimPage;
