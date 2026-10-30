import React from 'react';
import {
  ArrowDownRight, ArrowRight, BookOpen, Code2, Compass, FlaskConical,
  GraduationCap, Headphones, LayoutDashboard, MoreHorizontal, Sparkles, Video,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Explore courses', icon: Compass },
  { label: 'My learning', icon: BookOpen },
  { label: 'Live classes', icon: Video },
];

const categories = [
  { name: 'All courses', icon: Compass },
  { name: 'Design', icon: Sparkles },
  { name: 'Development', icon: Code2 },
  { name: 'Data Science', icon: FlaskConical },
  { name: 'Business', icon: LayoutDashboard },
  { name: 'Marketing', icon: ArrowDownRight },
];

function DashboardSidebar({
  activeNav,
  activeCategory,
  classes,
  menuOpen,
  onNavSelect,
  onCategorySelect,
  onNotify,
}) {
  return (
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <a className="brand" href="/" aria-label="Skillpath home">
        <span className="brand-mark"><GraduationCap size={21} strokeWidth={2.5} /></span>
        <span>SCS Academy<span className="brand-dot">.</span></span>
      </a>
      <div className="sidebar-label">MENU</div>
      <nav className="side-nav" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => onNavSelect(label)} className={`nav-item ${activeNav === label ? 'active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            {label === 'Live classes' && <span className="nav-count">{classes.filter((item) => item.date === 'Today').length}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-label category-label">CATEGORIES</div>
      <nav className="side-nav category-nav" aria-label="Course categories">
        {categories.map(({ name, icon: Icon }) => (
          <button key={name} onClick={() => onCategorySelect(name)} className={`nav-item ${activeCategory === name && activeNav === 'Explore courses' ? 'active' : ''}`}>
            <Icon size={17} strokeWidth={1.8} /><span>{name}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="help-card">
        <div className="help-icon"><Headphones size={17} /></div>
        <strong>Need a hand?</strong>
        <p>Our team is here to help you learn.</p>
        <button onClick={() => onNotify('Support team: hello@skillpath.learn')}>Get support <ArrowRight size={14} /></button>
      </div>
      <button className="profile-button" onClick={() => onNotify('Account settings coming soon.')}>
        <span className="avatar avatar-user">AK</span>
        <span className="profile-copy"><strong>Arjun Kumar</strong><span>Free plan</span></span>
        <MoreHorizontal size={19} className="profile-more" />
      </button>
    </aside>
  );
}

export default DashboardSidebar;
