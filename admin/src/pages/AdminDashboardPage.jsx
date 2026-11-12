import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight, BookOpen, Check, ChevronDown, ChevronFirst, ChevronLeft, ChevronRight, CircleAlert, ListFilter, LogOut,
  GraduationCap, LayoutDashboard, Menu, Pencil, Plus, RefreshCw, Search, Trash2, X,
  Activity, BadgePercent, BookOpenCheck, ClipboardList, Download, Inbox, LibraryBig, Megaphone, MessageSquare, Shield, Ticket, Users, UsersRound, Wallet,
} from 'lucide-react';
import { apiRequest, downloadAdminFile } from '../services/api.js';
import { getAdminToken } from '../auth/adminSession.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const emptyCourse = {
  title: '', category: 'Design', level: 'Beginner', instructor: '',
  duration: '', hours: '20 hours', lessons: 12, price: 999, oldPrice: 1499,
  image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=85',
  color: 'lavender', status: 'published',
};

const panels = [
  ['analytics', 'Reports & analytics', Activity],
  ['learning', 'Course content', BookOpen],
  ['learners', 'Learners & enrollments', Users],
  ['payments', 'Orders & promotions', Wallet],
  ['content', 'Content & campaigns', Megaphone],
  ['support', 'Support & reviews', MessageSquare],
  ['settings', 'Settings & admin access', Shield],
];

const rolePanels = {
  owner: panels.map(([id]) => id),
  course_manager: ['learning', 'learners', 'payments', 'content', 'support', 'settings'],
  support: ['learners', 'content', 'support', 'settings'],
  finance: ['analytics', 'payments', 'settings'],
};

const roleLabels = {
  owner: 'Owner',
  course_manager: 'Course manager',
  support: 'Support',
  finance: 'Finance',
};

const ADMIN_VIEW_KEY = 'skillpath-admin-view';

function getInitialAdminView() {
  const savedView = sessionStorage.getItem(ADMIN_VIEW_KEY);
  const validViews = new Set([
    'overview',
    'courses',
    'homepage-courses',
    'learners',
    'enrollments',
    ...panels.map(([id]) => `tools:${id}`),
  ]);
  return validViews.has(savedView) ? savedView : 'overview';
}

/* ------------------------------------------------------------------ */
/*  Shared style tokens                                                */
/* ------------------------------------------------------------------ */

const labelClass = 'grid gap-1.5 text-xs font-medium text-slate-600';
const inputClass = 'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50 disabled:text-slate-500';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50';
const softButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/20 disabled:cursor-not-allowed disabled:opacity-50';
const dangerButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50';
const linkClass = 'text-xs font-semibold text-violet-700 transition hover:text-violet-900 hover:underline';
const dangerLinkClass = 'text-xs font-semibold text-rose-600 transition hover:text-rose-800 hover:underline';
const iconButtonClass = 'grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20';

const navbarRingStyle = {
  padding: '6px',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
  background: 'linear-gradient(90deg, #7A1F2B 0%, #A52A32 22%, #D34B2F 48%, #E97832 68%, #C94C2D 84%, #7A1F2B 100%)',
};

const navbarRingFadeMask = {
  WebkitMaskImage: 'linear-gradient(#000, #000), linear-gradient(to right, #000, transparent), linear-gradient(to left, #000, transparent)',
  maskImage: 'linear-gradient(#000, #000), linear-gradient(to right, #000, transparent), linear-gradient(to left, #000, transparent)',
  WebkitMaskSize: '100% calc(100% - 28px), 90px 30px, 90px 30px',
  maskSize: '100% calc(100% - 28px), 90px 30px, 90px 30px',
  WebkitMaskPosition: 'top left, bottom left, bottom right',
  maskPosition: 'top left, bottom left, bottom right',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

const badgeTones = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

function statusTone(status) {
  const value = String(status || '').toLowerCase();
  if (['published', 'active', 'paid', 'approved', 'resolved', 'configured'].includes(value)) return 'green';
  if (['draft', 'pending', 'open', 'in_progress', 'partially_refunded', 'normal'].includes(value)) return 'amber';
  if (['suspended', 'disabled', 'failed', 'rejected', 'urgent', 'high'].includes(value)) return 'rose';
  return 'slate';
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAnalyticsPeriodRange(period, now = new Date()) {
  if (period === 'sixMonths') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }
  if (period === 'year') {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31),
    };
  }
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function buildTrendSeries(dailyItems, valueKey, period, fromValue, toValue) {
  const from = fromValue ? new Date(`${fromValue}T00:00:00`) : getAnalyticsPeriodRange(period).from;
  const to = toValue ? new Date(`${toValue}T00:00:00`) : getAnalyticsPeriodRange(period).to;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return [];

  const dayCount = Math.round((new Date(to.getFullYear(), to.getMonth(), to.getDate()) - new Date(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000) + 1;
  const groupByMonth = period === 'sixMonths' || period === 'year' || (period === 'custom' && dayCount > 62);
  const totals = new Map();
  dailyItems.forEach((item) => {
    const dateKey = String(item._id || '').slice(0, 10);
    if (!dateKey) return;
    const key = groupByMonth ? dateKey.slice(0, 7) : dateKey;
    totals.set(key, (totals.get(key) || 0) + Number(item[valueKey] || 0));
  });

  const series = [];
  let cursor = new Date(from.getFullYear(), groupByMonth ? from.getMonth() : from.getMonth(), groupByMonth ? 1 : from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), groupByMonth ? 1 : to.getDate());
  while (cursor <= end) {
    const key = groupByMonth
      ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      : formatDateInput(cursor);
    const label = groupByMonth
      ? cursor.toLocaleDateString('en-IN', { month: 'short' })
      : String(cursor.getDate());
    const detail = groupByMonth
      ? cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : cursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    series.push({ key, label, detail, value: totals.get(key) || 0 });
    if (groupByMonth) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

function formatAdminDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}

function formatAdminCurrency(value, currency = 'INR') {
  const amount = Number(value);
  return value !== null && value !== undefined && Number.isFinite(amount)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
    : 'Not recorded';
}

/* ------------------------------------------------------------------ */
/*  Shared UI building blocks                                          */
/* ------------------------------------------------------------------ */

function Badge({ tone = 'slate', children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${badgeTones[tone] || badgeTones.slate}`}>{children}</span>;
}

function Banner({ tone = 'error', children, onDismiss }) {
  const isError = tone === 'error';
  const Icon = isError ? CircleAlert : Check;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current?.(), 2000);
    return () => window.clearTimeout(timer);
  }, [children]);

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${isError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`} role={isError ? 'alert' : 'status'}>
      <Icon className="mt-0.5 shrink-0" size={18} />
      <span className="flex-1">{children}</span>
      {onDismiss && <button aria-label="Dismiss message" className="rounded p-0.5 opacity-70 transition hover:opacity-100" onClick={onDismiss} type="button"><X size={16} /></button>}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="m-0 text-xs font-semibold uppercase tracking-wider text-violet-600">{eyebrow}</p>}
        <h1 className="m-0 mt-1 font-[Manrope,sans-serif] text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {description && <p className="m-0 mt-1.5 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

function Card({ title, description, icon: Icon, actions, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600"><Icon size={18} /></span>}
            <div className="min-w-0">
              <h2 className="m-0 font-[Manrope,sans-serif] text-base font-bold text-slate-900">{title}</h2>
              {description && <p className="m-0 mt-0.5 text-xs text-slate-500">{description}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Icon size={22} /></span>
      <p className="m-0 mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="m-0 mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
    </div>
  );
}

function SkeletonTable({ columns, rows = 5, title, sharp = false, avatars = false, minWidth = '640px' }) {
  const widths = ['w-3/4', 'w-2/3', 'w-1/2', 'w-4/5', 'w-3/5'];
  return (
    <div className={`overflow-hidden border border-slate-200 bg-white ${sharp ? '' : 'rounded-xl'}`}>
      {title && <div className="border-b border-slate-100 px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200" /></div>}
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse ${minWidth === '900px' ? 'min-w-[900px]' : minWidth === '760px' ? 'min-w-[760px]' : 'min-w-[640px]'}`}>
          <thead>
            <tr>{Array.from({ length: columns }, (_, index) => <th className="border-b border-slate-200 px-4 py-3" key={index}><div className="h-2.5 w-3/4 rounded bg-slate-200" /></th>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr className="border-b border-slate-100" key={row}>
                {Array.from({ length: columns }, (_, column) => (
                  <td className="px-4 py-3" key={column}>
                    <div className="flex items-center gap-2">
                      {avatars && column === 0 && <span className="size-8 shrink-0 rounded-full bg-slate-100" />}
                      <span className={`block h-3 rounded bg-slate-100 ${widths[(row + column) % widths.length]}`} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkeletonPanel({ className = '', lines = 4 }) {
  return (
    <div className={`space-y-4 rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <div className="h-5 w-36 rounded bg-slate-200" />
      {Array.from({ length: lines }, (_, index) => <div className={`h-9 rounded bg-slate-100 ${index === 0 ? 'w-full' : ''}`} key={index} />)}
    </div>
  );
}

function AdminSectionSkeleton({ view, showHeader = true }) {
  const isOverview = view === 'overview';
  const headerAction = view === 'courses' || view === 'homepage-courses'
    ? 'h-9 w-28'
    : view === 'enrollments'
      ? 'h-6 w-20'
      : view.startsWith('tools:')
        ? 'h-9 w-24'
        : '';
  const header = showHeader && (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <div className="h-7 w-52 rounded bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
      </div>
      {headerAction && <div className={`${headerAction} rounded-lg bg-slate-100`} />}
    </div>
  );

  let content;
  if (isOverview) {
    content = (
      <>
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <div className="h-16 rounded-lg bg-slate-100" key={item} />)}
        </div>
        <div className="grid gap-6 border-t border-slate-200 pt-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1.1fr)]">
          <div className="min-h-64 space-y-4 lg:border-r lg:border-slate-200 lg:pr-8">
            <div className="h-6 w-44 rounded bg-slate-200" />
            {[0, 1, 2, 3, 4].map((item) => <div className="h-10 border-b border-slate-100 bg-slate-50" key={item} />)}
          </div>
          <div className="min-h-64 space-y-4 lg:pl-8">
            <div className="h-6 w-36 rounded bg-slate-200" />
            {[0, 1, 2, 3].map((item) => <div className="h-12 border-b border-slate-100 bg-slate-50" key={item} />)}
          </div>
        </div>
      </>
    );
  } else if (view === 'courses') {
    content = (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 px-4 py-3">
          <div className="space-y-2"><div className="h-5 w-28 rounded bg-slate-200" /><div className="h-3 w-40 rounded bg-slate-100" /></div>
          <div className="h-10 w-full rounded-lg bg-slate-100 sm:w-72" />
        </div>
        <div className="grid gap-4 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div className="overflow-hidden border border-slate-200 bg-white" key={item}>
              <div className="h-32 bg-slate-100" />
              <div className="space-y-3 p-3">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
                <div className="h-8 border-t border-slate-100 pt-2"><div className="h-4 w-20 rounded bg-slate-100" /></div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  } else if (view === 'learners') {
    content = (
      <>
        <div className="h-10 w-full rounded-lg bg-slate-100 sm:w-72" />
        <SkeletonTable columns={6} rows={7} sharp avatars minWidth="900px" />
      </>
    );
  } else if (view === 'enrollments') {
    content = <SkeletonTable columns={2} rows={7} minWidth="640px" />;
  } else if (view === 'tools:analytics') {
    content = (
      <div className="space-y-6">
        <SkeletonPanel className="min-h-32" lines={2} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[0, 1, 2, 3, 4].map((item) => <div className="h-24 rounded-2xl border border-slate-200 bg-white p-5" key={item}><div className="h-3 w-20 rounded bg-slate-100" /><div className="mt-4 h-6 w-24 rounded bg-slate-200" /></div>)}</div>
        <div className="grid gap-4 lg:grid-cols-2"><SkeletonPanel className="h-64" lines={1} /><SkeletonPanel className="h-64" lines={1} /></div>
        <div className="grid gap-4 xl:grid-cols-2"><SkeletonTable columns={3} rows={4} title=" " /><SkeletonTable columns={3} rows={4} title=" " /></div>
      </div>
    );
  } else if (view === 'tools:learning') {
    content = (
      <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4"><SkeletonPanel lines={4} /><SkeletonPanel lines={3} /></div>
        <div className="space-y-6"><SkeletonPanel lines={5} /><SkeletonTable columns={4} rows={4} title=" " /><SkeletonPanel lines={3} /></div>
      </div>
    );
  } else if (view === 'tools:learners') {
    content = (
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="space-y-4"><div className="flex gap-2"><div className="h-10 flex-1 rounded-lg bg-slate-100" /><div className="h-10 w-24 rounded-lg bg-slate-200" /></div><SkeletonTable columns={5} rows={5} title=" " /></div>
          <div className="space-y-4"><div className="h-10 rounded-lg bg-slate-100" /><SkeletonTable columns={5} rows={4} title=" " /></div>
        </div>
        <div className="space-y-4"><SkeletonPanel lines={4} /><SkeletonPanel lines={3} /></div>
      </div>
    );
  } else if (view === 'tools:payments') {
    content = (
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2"><SkeletonPanel lines={5} /><SkeletonPanel lines={4} /></div>
        <SkeletonTable columns={5} rows={4} title=" " />
        <SkeletonTable columns={6} rows={6} title=" " />
      </div>
    );
  } else if (view === 'tools:content') {
    content = (
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6"><SkeletonPanel lines={6} /><SkeletonPanel lines={4} /><SkeletonPanel lines={4} /></div>
        <SkeletonPanel lines={6} />
      </div>
    );
  } else if (view === 'tools:support') {
    content = (
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {[0, 1].map((column) => <div className="space-y-4" key={column}><div className="h-6 w-52 rounded bg-slate-200" />{[0, 1, 2].map((item) => <SkeletonPanel className="min-h-40" key={item} lines={3} />)}</div>)}
      </div>
    );
  } else if (view === 'tools:settings') {
    content = (
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <SkeletonPanel lines={7} />
        <SkeletonPanel lines={6} />
      </div>
    );
  } else {
    content = <div className="grid gap-6 md:grid-cols-2"><SkeletonPanel lines={5} /><SkeletonPanel lines={4} /></div>;
  }

  return (
    <div aria-label="Loading admin section" className="animate-pulse space-y-6" role="status">
      {header}
      {content}
    </div>
  );
}

function Avatar({ name }) {
  const letters = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{letters}</span>;
}

function Field({ label, value, onChange, type = 'text', required = false, ...props }) {
  return (
    <label className={labelClass}>
      <span>{label}{required && <span className="text-rose-500"> *</span>}</span>
      <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} {...props} />
    </label>
  );
}

function OperationsForm({ children, onSubmit }) {
  return <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>{children}</form>;
}

function DataTable({ title, headers, children, compact = false, className = '' }) {
  return (
    <div className={`min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      {title && <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{title}</div>}
      <div className={compact ? 'w-full' : 'overflow-x-auto'}>
        <table className={`w-full border-collapse text-left ${compact ? 'table-fixed text-xs' : 'min-w-[640px] text-sm'}`}>
          <thead className={`${compact ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-500'} font-semibold uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            <tr>{headers.map((header) => <th className={`${compact ? 'whitespace-normal px-2 py-2' : 'whitespace-nowrap px-4 py-3'}`} key={header}>{header}</th>)}</tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 ${compact ? '[&_td]:break-words [&_td]:px-2 [&_td]:py-2 [&_td]:text-xs' : ''}`}>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ children, className = '' }) {
  return <td className={`px-4 py-3 align-middle text-slate-700 ${className}`}>{children}</td>;
}

function EmptyRow({ cols, children }) {
  return <tr><td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={cols}>{children}</td></tr>;
}

function NavItem({ icon: Icon, label, count, active, collapsed = false, onClick }) {
  return (
    <button
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      className={`group flex h-10 w-full items-center rounded-lg text-sm font-medium transition-[background-color,color,padding,gap] duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${active ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
      type="button"
    >
      <Icon className={`shrink-0 ${active ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}`} size={18} />
      <span className={`overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity] duration-200 ${collapsed ? 'max-w-0 flex-1 opacity-0' : 'max-w-48 flex-1 opacity-100'}`}>{label}</span>
      {count !== undefined && <span className={`overflow-hidden whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold transition-[max-width,opacity,padding] duration-200 ${collapsed ? 'max-w-0 px-0 opacity-0' : 'max-w-12 opacity-100'} ${active ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
    </button>
  );
}

function NavGroup({ label, children, collapsed = false }) {
  return (
    <div className="mt-6 first:mt-0">
      <p className={`m-0 mb-2 overflow-hidden whitespace-nowrap px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-[height,opacity] duration-200 ${collapsed ? 'h-0 opacity-0' : 'h-4 opacity-100'}`}>{label}</p>
      <div className="grid gap-0.5">{children}</div>
    </div>
  );
}

function LearnerPhoto({ learner, onError, className = '' }) {
  const [src, setSrc] = useState('');
  const initials = (learner.name || 'U').slice(0, 2).toUpperCase();

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    const token = getAdminToken();

    fetch(`/api/admin/learners/${encodeURIComponent(learner.id)}/avatar`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    }).then(async (response) => {
      if (response.status === 404) return null;
      if (response.status === 401) window.dispatchEvent(new Event('admin-session-expired'));
      if (!response.ok) {
        let message = 'Could not load learner profile photo.';
        try {
          const data = await response.json();
          message = data.error || message;
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
        throw new Error(message);
      }
      return response.blob();
    }).then((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    }).catch((error) => {
      if (error.name !== 'AbortError') onError(error);
    });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [learner.id, onError]);

  return (
    <span className={className || 'grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-[10px] font-bold text-slate-700'}>
      {src
        ? <img alt="" className="h-full w-full object-cover" src={src} />
        : initials}
    </span>
  );
}

function AdminDashboardPage({ onLogout }) {
  const [courses, setCourses] = useState([]);
  const [homepageCourseIds, setHomepageCourseIds] = useState([]);
  const [homepageCourseSelection, setHomepageCourseSelection] = useState([]);
  const [homepageCourseQuery, setHomepageCourseQuery] = useState('');
  const [homepageCoursePage, setHomepageCoursePage] = useState(1);
  const [savingHomepageCourses, setSavingHomepageCourses] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [editingId, setEditingId] = useState(null);
  const [overview, setOverview] = useState({ courses: 0, learners: 0, enrollments: 0, revenue: 0, orders: 0, openSupportTickets: 0, recentActivity: [] });
  const [adminRole, setAdminRole] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [learners, setLearners] = useState([]);
  const [learnerQuery, setLearnerQuery] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentQuery, setEnrollmentQuery] = useState('');
  const [selectedEnrollmentLearner, setSelectedEnrollmentLearner] = useState(null);
  const [enrollmentLearnerLoading, setEnrollmentLearnerLoading] = useState(false);
  const [enrollmentCoursePage, setEnrollmentCoursePage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState(getInitialAdminView);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 32);
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
  const [editingSections, setEditingSections] = useState([]);
  const [editingSectionId, setEditingSectionId] = useState('');
  const [editingSectionsOpen, setEditingSectionsOpen] = useState(false);
  const [editingSectionsLoading, setEditingSectionsLoading] = useState(false);
  const [removingSectionId, setRemovingSectionId] = useState('');
  const [recentActivityPage, setRecentActivityPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [selectedLearnerProfile, setSelectedLearnerProfile] = useState(null);
  const [learnerProfileLoading, setLearnerProfileLoading] = useState(false);
  const learnerSearchInitialized = useRef(false);
  const enrollmentLearnerRequest = useRef(0);
  const handleLearnerPhotoError = useCallback((photoError) => setError(photoError.message), []);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const { admin } = await apiRequest('/api/admin-auth/me');
      setAdminRole(admin.role);
      setAdminEmail(admin.email);
      const canManageCatalog = ['owner', 'course_manager'].includes(admin.role);
      const canManageLearners = ['owner', 'course_manager', 'support'].includes(admin.role);
      const canViewEnrollments = ['owner', 'course_manager', 'support', 'finance'].includes(admin.role);
      const [courseData, overviewData, learnerData, enrollmentData, homepageCourses] = await Promise.all([
        canManageCatalog ? apiRequest('/api/courses/admin') : Promise.resolve([]),
        apiRequest('/api/admin/overview'),
        canManageLearners ? apiRequest('/api/admin/learners') : Promise.resolve({ learners: [] }),
        canViewEnrollments ? apiRequest('/api/admin/enrollments') : Promise.resolve({ enrollments: [] }),
        canManageCatalog ? apiRequest('/api/courses/admin/homepage-featured') : Promise.resolve({ courseIds: [] }),
      ]);
      setCourses(courseData);
      setHomepageCourseIds(homepageCourses.courseIds);
      setHomepageCourseSelection(homepageCourses.courseIds);
      setOverview(overviewData);
      setLearners(learnerData.learners);
      setEnrollments(enrollmentData.enrollments);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const openEnrollmentLearner = async (enrollment) => {
    if (!enrollment.learnerId) return;
    const requestId = enrollmentLearnerRequest.current + 1;
    enrollmentLearnerRequest.current = requestId;
    setEnrollmentCoursePage(1);
    setError('');
    setEnrollmentLearnerLoading(true);
    setSelectedEnrollmentLearner({
      learner: { id: enrollment.learnerId, name: enrollment.learnerName, identifier: enrollment.learnerIdentifier },
      enrollments: null,
    });
    try {
      const details = await apiRequest(`/api/admin/enrollments/learners/${encodeURIComponent(enrollment.learnerId)}`);
      if (enrollmentLearnerRequest.current === requestId) setSelectedEnrollmentLearner(details);
    } catch (requestError) {
      if (enrollmentLearnerRequest.current === requestId) {
        setSelectedEnrollmentLearner(null);
        setError(requestError.message);
      }
    } finally {
      if (enrollmentLearnerRequest.current === requestId) setEnrollmentLearnerLoading(false);
    }
  };

  const closeEnrollmentLearner = () => {
    enrollmentLearnerRequest.current += 1;
    setSelectedEnrollmentLearner(null);
    setEnrollmentLearnerLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(ADMIN_VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
    const updateScrollState = () => {
      const scrollY = window.scrollY;
      setIsScrolled((scrolled) => {
        if (!scrolled && scrollY > 32) return true;
        if (scrolled && scrollY < 8) return false;
        return scrolled;
      });
    };
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  const updateCourseField = (event) => {
    const { name, value } = event.target;
    setCourseForm((current) => ({ ...current, [name]: value }));
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Course cover must be a JPEG, PNG, or WebP image smaller than 5 MB.');
      event.target.value = '';
      return;
    }

    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { url } = await apiRequest('/api/courses/image', { method: 'POST', body: formData });
      setCourseForm((current) => ({ ...current, image: url }));
    } catch (uploadError) {
      setError(uploadError.message);
    }
    event.target.value = '';
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const savedCourse = await apiRequest(
        editingId ? `/api/courses/${editingId}` : '/api/courses',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(Object.entries(courseForm).filter(([, value]) => value !== ''))),
        },
      );
      setCourses((current) => editingId
        ? current.map((course) => course.id === editingId ? savedCourse : course)
        : [...current, savedCourse]);
      if (savedCourse.status !== 'published') {
        setHomepageCourseIds((current) => current.filter((id) => id !== savedCourse.id));
        setHomepageCourseSelection((current) => current.filter((id) => id !== savedCourse.id));
      }
      setCourseForm(emptyCourse);
      setEditingId(null);
      setNotice(editingId ? 'Course updated.' : 'Course created.');
      setCourseDrawerOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeEditingSection = async (section) => {
    if (!window.confirm(`Remove "${section.title}" and all of its lessons from this course?`)) return;
    setError('');
    setNotice('');
    setRemovingSectionId(section.id);
    try {
      await apiRequest(`/api/admin/platform/courses/${editingId}/sections/${section.id}`, { method: 'DELETE' });
      const remainingSections = editingSections.filter((item) => item.id !== section.id);
      setEditingSections(remainingSections);
      if (editingSectionId === section.id) setEditingSectionId(remainingSections[0]?.id || '');
      setCourses((current) => current.map((course) => course.id === editingId
        ? { ...course, sections: (course.sections || []).filter((item) => item.id !== section.id) }
        : course));
      setNotice('Course section removed.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRemovingSectionId('');
    }
  };

  const startEditing = (course) => {
    setEditingId(course.id);
    setCourseForm({
      title: course.title,
      category: course.category,
      level: course.level,
      instructor: course.instructor,
      duration: course.duration,
      hours: course.hours || '20 hours',
      lessons: course.lessons,
      price: course.price,
      oldPrice: course.oldPrice,
      image: course.image,
      color: course.color,
      status: course.status || 'published',
    });
    setCourseDrawerOpen(true);
  };

  const removeCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}" and its scheduled classes?`)) return;
    setError('');
    try {
      await apiRequest(`/api/courses/${course.id}`, { method: 'DELETE' });
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setHomepageCourseIds((current) => current.filter((id) => id !== course.id));
      setHomepageCourseSelection((current) => current.filter((id) => id !== course.id));
      setNotice('Course deleted.');
      if (editingId === course.id) {
        setCourseForm(emptyCourse);
        setEditingId(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const searchLearners = async (search) => {
    setError('');
    try {
      const result = await apiRequest(`/api/admin/learners?search=${encodeURIComponent(search)}`);
      setLearners(result.learners);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const openLearnerProfile = (learner) => {
    const profileTab = window.open(
      `/profile?learnerProfile=${encodeURIComponent(learner.id)}`,
      '_blank',
    );
    if (profileTab) {
      profileTab.opener = null;
    } else {
      setError('Allow pop-ups to open the learner profile in a new tab.');
    }
  };

  useEffect(() => {
    if (!learnerSearchInitialized.current) {
      learnerSearchInitialized.current = true;
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      searchLearners(learnerQuery);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [learnerQuery]);

  const changeLearnerStatus = async (learner) => {
    const status = learner.status === 'suspended' ? 'active' : 'suspended';
    const verb = status === 'suspended' ? 'Suspend' : 'Restore access for';
    if (!window.confirm(`${verb} ${learner.name || learner.identifier}?`)) return;
    setError('');
    try {
      await apiRequest(`/api/admin/learners/${learner.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setLearners((current) => current.map((item) => item.id === learner.id ? { ...item, status } : item));
      setNotice(status === 'suspended' ? 'Learner access suspended.' : 'Learner access restored.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const filteredCourses = courses.filter((course) =>
    `${course.title} ${course.category} ${course.instructor}`.toLowerCase().includes(query.trim().toLowerCase()));
  const publishedCourses = courses.filter((course) => course.status === 'published' || !course.status);
  const filteredHomepageCourses = courses.filter((course) =>
    `${course.title} ${course.category} ${course.instructor} ${course.level}`
      .toLowerCase()
      .includes(homepageCourseQuery.trim().toLowerCase()));
  const homepageCoursesPerPage = 12;
  const homepageCoursePageCount = Math.ceil(filteredHomepageCourses.length / homepageCoursesPerPage);
  const currentHomepageCoursePage = Math.min(homepageCoursePage, Math.max(1, homepageCoursePageCount));
  const visibleHomepageCourses = filteredHomepageCourses.slice(
    (currentHomepageCoursePage - 1) * homepageCoursesPerPage,
    currentHomepageCoursePage * homepageCoursesPerPage,
  );
  const selectedHomepageCourses = homepageCourseSelection
    .map((id) => courses.find((course) => course.id === id))
    .filter(Boolean);
  const hasHomepageCourseSelectionChanged = homepageCourseSelection.length !== homepageCourseIds.length
    || homepageCourseSelection.some((id, index) => id !== homepageCourseIds[index]);
  const coursesPerPage = 12;
  const coursePageCount = Math.ceil(filteredCourses.length / coursesPerPage);
  const currentCoursePage = Math.min(coursePage, Math.max(1, coursePageCount));
  const visibleCourses = filteredCourses.slice(
    (currentCoursePage - 1) * coursesPerPage,
    currentCoursePage * coursesPerPage,
  );
  const learnerCourses = selectedEnrollmentLearner?.enrollments || [];
  const enrollmentCoursesPerPage = 10;
  const enrollmentCoursePageCount = Math.ceil(learnerCourses.length / enrollmentCoursesPerPage);
  const currentEnrollmentCoursePage = Math.min(enrollmentCoursePage, Math.max(1, enrollmentCoursePageCount));
  const visibleEnrollmentCourses = learnerCourses.slice(
    (currentEnrollmentCoursePage - 1) * enrollmentCoursesPerPage,
    currentEnrollmentCoursePage * enrollmentCoursesPerPage,
  );
  const filteredEnrollments = enrollments.filter((enrollment) =>
    `${enrollment.learnerName} ${enrollment.learnerIdentifier} ${enrollment.courseTitle}`
      .toLowerCase()
      .includes(enrollmentQuery.trim().toLowerCase()));

  /* ---------------------------- UI-only helpers --------------------------- */
  const closeCourseDrawer = () => {
    setCourseDrawerOpen(false);
    setEditingId(null);
    setCourseForm(emptyCourse);
  };

  const openNewCourse = () => {
    setEditingId(null);
    setCourseForm(emptyCourse);
    setView('courses');
    setCourseDrawerOpen(true);
    setSidebarOpen(false);
  };

  const toggleHomepageCourse = (courseId) => {
    setError('');
    setHomepageCourseSelection((current) => current.includes(courseId)
      ? current.filter((id) => id !== courseId)
      : current.length < 3 ? [...current, courseId] : current);
  };

  const openHomepageCourseSelector = () => {
    setHomepageCourseSelection(homepageCourseIds);
    setHomepageCourseQuery('');
    setHomepageCoursePage(1);
    setError('');
    setView('homepage-courses');
    window.scrollTo({ top: 0 });
  };

  const closeHomepageCourseSelector = () => {
    setHomepageCourseSelection(homepageCourseIds);
    setError('');
    setView('courses');
    window.scrollTo({ top: 0 });
  };

  const saveHomepageCourses = async () => {
    setError('');
    setSavingHomepageCourses(true);
    try {
      const result = await apiRequest('/api/courses/admin/homepage-featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: homepageCourseSelection }),
      });
      setHomepageCourseIds(result.courseIds);
      setHomepageCourseSelection(result.courseIds);
      setNotice('Homepage courses updated.');
      setView('courses');
      window.scrollTo({ top: 0 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingHomepageCourses(false);
    }
  };

  const goTo = (nextView) => {
    enrollmentLearnerRequest.current += 1;
    setSelectedEnrollmentLearner(null);
    setEnrollmentLearnerLoading(false);
    setView(nextView);
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!courseDrawerOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') closeCourseDrawer(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [courseDrawerOpen]);

  useEffect(() => {
    if (!courseDrawerOpen || !editingId) {
      setEditingSections([]);
      setEditingSectionId('');
      setEditingSectionsOpen(false);
      setEditingSectionsLoading(false);
      return undefined;
    }
    let active = true;
    setEditingSections([]);
    setEditingSectionsLoading(true);
    apiRequest(`/api/admin/platform/courses/${editingId}/sections`)
      .then(({ sections }) => {
        if (active) {
          setEditingSections(sections);
          setEditingSectionId(sections[0]?.id || '');
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setEditingSectionsLoading(false);
      });
    return () => { active = false; };
  }, [courseDrawerOpen, editingId]);

  const showCatalog = ['owner', 'course_manager'].includes(adminRole);
  const showLearners = ['owner', 'course_manager', 'support'].includes(adminRole);
  const showEnrollments = ['owner', 'course_manager', 'support', 'finance'].includes(adminRole);
  const showActivity = ['owner', 'finance'].includes(adminRole);
  const toolPanels = panels.filter(([id]) => (rolePanels[adminRole] || []).includes(id));
  const activeToolPanel = view.startsWith('tools:') ? panels.find(([id]) => id === view.slice(6)) : null;
  useEffect(() => {
    if (!adminRole) return;
    const allowedViews = [
      'overview',
      ...(showCatalog ? ['courses', 'homepage-courses'] : []),
      ...(showLearners ? ['learners'] : []),
      ...(showEnrollments ? ['enrollments'] : []),
      ...toolPanels.map(([id]) => `tools:${id}`),
    ];
    if (!allowedViews.includes(view)) setView('overview');
  }, [adminRole, showCatalog, showLearners, showEnrollments, toolPanels, view]);
  const viewTitle = activeToolPanel
    ? activeToolPanel[1]
    : { overview: 'Dashboard', courses: 'Courses', 'homepage-courses': 'Homepage courses', learners: 'Learners', enrollments: 'Enrollments' }[view];
  const formatCount = (value) => Number(value || 0).toLocaleString('en-IN');
  const recentActivityPageSize = 4;
  const recentActivityPageCount = Math.ceil(overview.recentActivity.length / recentActivityPageSize);
  const currentRecentActivityPage = Math.min(recentActivityPage, Math.max(1, recentActivityPageCount));
  const visibleRecentActivity = overview.recentActivity.slice(
    (currentRecentActivityPage - 1) * recentActivityPageSize,
    currentRecentActivityPage * recentActivityPageSize,
  );

  const statCards = [
    { label: 'Total courses', value: overview.courses, icon: LibraryBig, target: showCatalog ? 'courses' : null, cta: 'Manage courses' },
    { label: 'Learners', value: overview.learners, icon: UsersRound, target: showLearners ? 'learners' : null, cta: 'Manage learners' },
    { label: 'Enrollments', value: overview.enrollments, icon: BookOpenCheck, target: showEnrollments ? 'enrollments' : null, cta: 'View enrollments' },
  ];

  const quickActions = [
    showCatalog && { icon: Plus, title: 'Add a new course', text: 'Create a course for your catalog', onClick: openNewCourse },
    showLearners && { icon: Users, title: 'Manage learners', text: 'Search accounts and control access', onClick: () => goTo('learners') },
    showEnrollments && { icon: ClipboardList, title: 'Review enrollments', text: 'Track and update learner progress', onClick: () => goTo('enrollments') },
    toolPanels.length > 0 && { icon: Activity, title: toolPanels[0][1], text: 'Open your platform tools', onClick: () => goTo(`tools:${toolPanels[0][0]}`) },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white font-['DM_Sans',sans-serif] text-slate-800 antialiased">
      {sidebarOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} type="button" />}

      {/* ------------------------------ Sidebar ------------------------------ */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:bottom-0 lg:left-0 lg:top-0 lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-64'} ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className={`flex h-16 shrink-0 items-center border-b border-slate-100 transition-[padding] duration-300 ${sidebarCollapsed ? 'justify-center gap-1 px-2 lg:justify-between' : 'justify-between px-5'}`}>
          <button aria-label="Go to admin overview" className={`flex min-w-0 items-center justify-start overflow-hidden border-0 bg-transparent p-0 text-left ${sidebarCollapsed ? 'lg:w-7 lg:justify-center' : ''}`} onClick={() => goTo('overview')} type="button">
            <img
              alt="SCS Academy"
              className={`h-9 shrink-0 object-contain object-left transition-[width,height] duration-300 ${sidebarCollapsed ? 'w-[130px] lg:h-7 lg:w-7' : 'w-[130px]'}`}
              src="/academy-logo-cropped.png"
            />
          </button>
          <button
            aria-label="Refresh dashboard data"
            className="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-slate-500 transition hover:bg-slate-100 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            onClick={refresh}
            title="Refresh data"
            type="button"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={17} />
          </button>
          <button aria-label="Close menu" className="rounded-lg border-0 bg-transparent p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} type="button"><X size={18} /></button>
        </div>

        <button
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-4 top-5 z-20 hidden size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_2px_8px_#15162920] transition-[color,background-color,box-shadow,transform] duration-200 hover:scale-105 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20 lg:flex"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav aria-label="Admin navigation" className="flex-1 overflow-hidden px-3 py-5">
          <NavGroup collapsed={sidebarCollapsed} label="Workspace">
            <NavItem active={view === 'overview'} collapsed={sidebarCollapsed} icon={LayoutDashboard} label="Dashboard" onClick={() => goTo('overview')} />
            {showCatalog && <NavItem active={view === 'courses' || view === 'homepage-courses'} collapsed={sidebarCollapsed} count={courses.length} icon={BookOpen} label="Courses" onClick={() => goTo('courses')} />}
            {showLearners && <NavItem active={view === 'learners'} collapsed={sidebarCollapsed} count={overview.learners} icon={Users} label="Learners" onClick={() => goTo('learners')} />}
            {showEnrollments && <NavItem active={view === 'enrollments'} collapsed={sidebarCollapsed} count={overview.enrollments} icon={ClipboardList} label="Enrollments" onClick={() => goTo('enrollments')} />}
          </NavGroup>
          {toolPanels.length > 0 && (
            <NavGroup collapsed={sidebarCollapsed} label="Platform tools">
              {toolPanels.map(([id, title, Icon]) => <NavItem active={view === `tools:${id}`} collapsed={sidebarCollapsed} icon={Icon} key={id} label={title} onClick={() => goTo(`tools:${id}`)} />)}
            </NavGroup>
          )}
        </nav>

        <div className={`shrink-0 border-t border-slate-100 p-3 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center rounded-xl bg-slate-50 p-2.5 transition-[gap] duration-300 ${sidebarCollapsed ? 'justify-center gap-1 lg:flex-col lg:gap-2 lg:px-1.5' : 'gap-3'}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">AD</span>
            <div className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap leading-tight transition-[max-width,opacity] duration-200 ${sidebarCollapsed ? 'max-w-0 opacity-0 lg:hidden' : 'max-w-40 opacity-100'}`}>
              <strong className="block truncate text-sm text-slate-800">Platform admin</strong>
              <small className="block truncate text-xs text-slate-500">{roleLabels[adminRole] || 'Administrator'}</small>
            </div>
            <button aria-label="Sign out" className="rounded-lg border-0 bg-transparent p-2 text-slate-400 transition hover:bg-white hover:text-rose-600" onClick={onLogout} title="Sign out" type="button"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {/* -------------------------------- Main -------------------------------- */}
      <div className={`transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <header className={`fixed right-0 top-0 z-50 h-[96px] px-4 pt-6 transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-[720px]:h-[78px] max-[720px]:px-2 max-[720px]:pt-4 ${sidebarCollapsed ? 'left-0 lg:left-24' : 'left-0 lg:left-72'}`}>
          <div className={`relative mx-0 flex h-[72px] w-full max-w-none items-center justify-between gap-[clamp(18px,3vw,40px)] border bg-white px-[clamp(18px,2.4vw,36px)] text-[#202330] transition-[translate,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-[720px]:h-[62px] max-[720px]:px-[18px] ${isScrolled ? '-translate-y-6 rounded-t-none rounded-b-[28px] border-transparent shadow-[0_8px_24px_#15162918] max-[720px]:-translate-y-4' : 'translate-y-0 rounded-2xl border-[#e7e9ef] shadow-[0_8px_30px_#15162920]'}`}>
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500 motion-reduce:transition-none ${isScrolled ? 'opacity-100' : 'opacity-0'}`}
              style={navbarRingFadeMask}
            >
              <div className="absolute inset-0 rounded-[inherit]" style={navbarRingStyle} />
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <button aria-label="Open menu" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden" onClick={() => setSidebarOpen(true)} type="button"><Menu size={18} /></button>
              <button aria-label="Go to admin overview" className="inline-flex h-11 w-[126px] shrink-0 items-center border-0 bg-transparent p-0 sm:w-[145px]" onClick={() => goTo('overview')} type="button">
                <img className="h-full w-full object-contain" src="/academy-logo-cropped.png" alt="SCS Academy" />
              </button>
              <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 border-l border-slate-200 pl-3 text-sm sm:flex">
                <button className="rounded border-0 bg-transparent p-1 text-slate-400 transition hover:bg-slate-100 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30" onClick={() => goTo('overview')} type="button">Admin</button>
                <ChevronRight className="shrink-0 text-slate-300" size={14} />
                <strong className="truncate font-semibold text-slate-800">{viewTitle}</strong>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <a className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 no-underline transition hover:bg-violet-50 xl:inline-flex" href="http://127.0.0.1:5173" rel="noreferrer" target="_blank">Open learner site <ArrowUpRight size={15} /></a>
              <div className="relative ml-1 border-l border-slate-200 pl-2 sm:ml-2 sm:pl-3">
                <button
                  aria-expanded={profileOpen}
                  aria-label="Open admin account menu"
                  className="grid size-10 place-items-center rounded-full border-2 border-white bg-[#7A1F2B] p-0 text-sm font-bold uppercase text-white shadow-[0_0_0_1px_#e1e5ec] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                  onClick={() => setProfileOpen((open) => !open)}
                  type="button"
                >
                  {(adminEmail.split('@')[0] || 'AD').slice(0, 2).toUpperCase()}
                </button>
                {profileOpen && (
                  <>
                    <button aria-label="Close admin account menu" className="fixed inset-0 z-30 cursor-default border-0 bg-transparent" onClick={() => setProfileOpen(false)} type="button" />
                    <div className="absolute right-0 top-full z-40 mt-3 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_#10101b20]">
                      <div className="border-b border-slate-100 px-3 py-2.5">
                        <strong className="block truncate text-sm text-slate-800">{adminEmail || 'Platform admin'}</strong>
                        <span className="mt-0.5 block text-xs text-slate-500">{roleLabels[adminRole] || 'Administrator'}</span>
                      </div>
                      <button className="mt-1 flex w-full items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50" onClick={onLogout} type="button">
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div aria-hidden="true" className="h-[96px] shrink-0 max-[720px]:h-[78px]" />

        <main aria-busy={loading} className={`w-full px-4 sm:px-6 lg:px-8 ${view === 'overview' ? 'space-y-4 py-4 lg:py-5' : view === 'courses' ? 'space-y-3 py-3 lg:py-4' : 'space-y-6 py-6 lg:py-8'}`}>
          {error && <Banner onDismiss={() => setError('')} tone="error">{error}</Banner>}
          {notice && <Banner onDismiss={() => setNotice('')} tone="success">{notice}</Banner>}

          <div className={loading ? 'hidden' : 'contents'}>
          {/* ------------------------------ Overview ------------------------------ */}
          {view === 'overview' && (
            <>
              <PageHeader description="Manage your learning catalog, learners, and enrollments." title="Admin Dashboard" />

              <section aria-label="Platform statistics" className="grid gap-3 sm:grid-cols-3">
                {statCards.map(({ label, value, icon: Icon, target, cta }) => (
                  <article className="flex min-w-0 items-center gap-3 py-2 sm:px-3 sm:first:pl-0 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-slate-200 sm:[&:not(:first-child)]:pl-5" key={label}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-800 text-white">
                      <Icon size={17} strokeWidth={1} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-xs font-medium text-slate-500">{label}</p>
                      {loading ? <div className="mt-1.5 h-6 w-10 animate-pulse rounded bg-slate-100" /> : <strong className="mt-0.5 block font-[Manrope,sans-serif] text-xl font-bold leading-tight tracking-tight text-slate-900">{formatCount(value)}</strong>}
                    </div>
                    {target && <button aria-label={cta} className="inline-flex shrink-0 items-center gap-0.5 rounded-md border-0 bg-transparent px-1.5 py-1 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-900" onClick={() => goTo(target)} type="button"><span className="hidden md:inline">{cta}</span><ChevronRight size={14} /></button>}
                  </article>
                ))}
              </section>

              <div className={`mt-2 grid gap-6 border-t border-slate-200 pt-6 ${showActivity ? 'lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1.1fr)] lg:gap-0' : ''}`}>
                {showActivity && (
                  <section aria-labelledby="recent-activity-title" className="min-w-0 lg:border-r lg:border-slate-200 lg:pr-8">
                    <header className="mb-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="text-[#7A1F2B]" size={20} />
                        <h2 className="m-0 font-[Manrope,sans-serif] text-xl font-extrabold leading-tight tracking-[-.02em] text-[#112e49]" id="recent-activity-title">Recent activity</h2>
                      </div>
                      <p className="m-0 mt-1.5 text-sm text-slate-500">Latest administrative changes across the platform</p>
                    </header>
                    {overview.recentActivity.length > 0 ? (
                      <ul className="m-0 list-none divide-y divide-slate-200/70 p-0">
                        {visibleRecentActivity.map((item, index) => (
                          <li className="flex items-center gap-3 py-2" key={`${item.action}-${item.resourceId}-${index}`}>
                            <span className="grid h-7 w-9 shrink-0 place-items-center text-slate-500"><Activity size={15} /></span>
                            <div className="min-w-0 flex-1">
                              <p className="m-0 truncate text-sm font-semibold capitalize text-slate-800">{item.action.replaceAll('.', ' ')}</p>
                              <p className="m-0 mt-0.5 truncate text-xs text-slate-500">{item.actor} · {item.resource} {item.resourceId}</p>
                            </div>
                            <time className="hidden shrink-0 text-xs text-slate-400 sm:block">{new Date(item.createdAt).toLocaleString()}</time>
                          </li>
                        ))}
                      </ul>
                    ) : <EmptyState description="Changes made by admins will show up here." icon={Activity} title="No administrative changes recorded yet." />}
                    {recentActivityPageCount > 1 && (
                      <nav aria-label="Recent activity pages" className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                        <button
                          aria-label="Previous recent activity page"
                          className={`${softButtonClass} !px-2.5 !py-1.5`}
                          disabled={currentRecentActivityPage === 1}
                          onClick={() => setRecentActivityPage((page) => Math.max(1, page - 1))}
                          type="button"
                        >
                          <ChevronLeft size={15} /> Previous
                        </button>
                        <span className="text-xs font-medium text-slate-500">
                          Page {currentRecentActivityPage} of {recentActivityPageCount}
                        </span>
                        <button
                          aria-label="Next recent activity page"
                          className={`${softButtonClass} !px-2.5 !py-1.5`}
                          disabled={currentRecentActivityPage === recentActivityPageCount}
                          onClick={() => setRecentActivityPage((page) => Math.min(recentActivityPageCount, page + 1))}
                          type="button"
                        >
                          Next <ChevronRight size={15} />
                        </button>
                      </nav>
                    )}
                  </section>
                )}

                <section aria-labelledby="quick-actions-title" className={`min-w-0 ${showActivity ? 'lg:pl-8' : ''}`}>
                  <header className="mb-3 border-b border-slate-200 pb-3">
                    <h2 className="m-0 font-[Manrope,sans-serif] text-xl font-extrabold leading-tight tracking-[-.02em] text-[#112e49]" id="quick-actions-title">Quick actions</h2>
                    <p className="m-0 mt-1.5 text-sm text-slate-500">Jump straight into common tasks</p>
                  </header>
                  {quickActions.length > 0 ? quickActions.map(({ icon: Icon, title, text, onClick }) => (
                    <button className="flex w-full items-center gap-3 border-0 border-b border-slate-200/70 bg-transparent px-1 py-3 text-left transition-colors hover:bg-slate-100/70" key={title} onClick={onClick} type="button">
                      <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-500"><Icon size={16} /></span>
                      <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-800">{title}</strong><span className="block truncate text-xs text-slate-500">{text}</span></span>
                      <ChevronRight className="shrink-0 text-slate-300" size={16} />
                    </button>
                  )) : <EmptyState title="No actions available" />}
                </section>
              </div>
            </>
          )}

          {/* ------------------------------- Courses ------------------------------- */}
          {view === 'courses' && showCatalog && (
            <>
              <PageHeader
                actions={
                  <>
                    <button className={softButtonClass} onClick={openHomepageCourseSelector} type="button"><Plus size={16} /> Add course to home page</button>
                    <button className={buttonClass} onClick={openNewCourse} type="button"><Plus size={16} /> Add course</button>
                  </>
                }
                title="Course Management"
              />
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 px-4 py-3">
                  <div>
                    <h2 className="m-0 font-[Manrope,sans-serif] text-base font-bold text-slate-900">All courses</h2>
                    <p className="m-0 mt-0.5 text-xs text-slate-500">{filteredCourses.length === courses.length ? `${courses.length} courses in your catalog` : `Showing ${filteredCourses.length} of ${courses.length} courses`}</p>
                  </div>
                  <label className="relative block w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input aria-label="Search courses" className={`${inputClass} pl-9`} onChange={(event) => { setQuery(event.target.value); setCoursePage(1); }} placeholder="Search by title, category or instructor" value={query} />
                  </label>
                </div>
                <div className="p-3">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleCourses.map((course) => (
                      <article className="flex min-w-0 flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md" key={course.id}>
                        <img alt="" className="h-32 w-full bg-slate-100 object-cover" loading="lazy" src={course.image} />
                        <div className="flex flex-1 flex-col p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="m-0 line-clamp-2 min-h-9 font-[Manrope,sans-serif] text-sm font-bold leading-[18px] text-slate-900" title={course.title}>{course.title}</h3>
                            <Badge tone={statusTone(course.status || 'published')}>{course.status || 'published'}</Badge>
                          </div>
                          <dl className="m-0 grid gap-1.5 text-sm">
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <dt className="shrink-0 text-xs font-medium text-slate-500">Instructor</dt>
                              <dd className="m-0 min-w-0 truncate text-right text-xs font-semibold text-slate-800" title={course.instructor}>{course.instructor}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-xs font-medium text-slate-500">Level</dt>
                              <dd className="m-0 text-right text-xs font-semibold text-slate-800">{course.level}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-xs font-medium text-slate-500">Duration</dt>
                              <dd className="m-0 text-right text-xs font-semibold text-slate-800">{course.duration}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-xs font-medium text-slate-500">Course hours</dt>
                              <dd className="m-0 text-right text-xs font-semibold text-slate-800">{course.hours || '—'}</dd>
                            </div>
                          </dl>
                          <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2">
                            <span className="text-xs font-medium text-slate-500">Price</span>
                            <div className="flex items-baseline gap-2">
                              <strong className="text-xs font-bold text-slate-900">₹{Number(course.price).toLocaleString('en-IN')}</strong>
                              {Number(course.oldPrice) > Number(course.price) && <span className="text-xs text-slate-400 line-through">₹{Number(course.oldPrice).toLocaleString('en-IN')}</span>}
                            </div>
                          </div>
                          <div className="mt-auto flex justify-end gap-1.5 border-t border-slate-100 pt-2">
                            <button aria-label={`Edit ${course.title}`} className={iconButtonClass} onClick={() => startEditing(course)} title="Edit course" type="button"><Pencil size={15} /></button>
                            <button aria-label={`Delete ${course.title}`} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/20" onClick={() => removeCourse(course)} title="Delete course" type="button"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      </article>
                    ))}
                    {loading && courses.length === 0 && [0, 1, 2, 3].map((item) => (
                      <div aria-hidden="true" className="h-64 animate-pulse rounded-xl bg-slate-100" key={`skeleton-${item}`} />
                    ))}
                  </div>
                </div>
                {!loading && filteredCourses.length === 0 && (
                  <EmptyState
                    description={courses.length ? 'Try a different search term.' : 'Add your first course to start building the catalog.'}
                    icon={BookOpen}
                    title={courses.length ? 'No matching courses' : 'No courses available yet'}
                  />
                )}
                {coursePageCount > 1 && (
                  <nav aria-label="Course pages" className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                    <button
                      className={`${softButtonClass} !px-2.5 !py-1.5`}
                      disabled={currentCoursePage === 1}
                      onClick={() => setCoursePage((page) => Math.max(1, page - 1))}
                      type="button"
                    >
                      <ChevronLeft size={15} /> Previous
                    </button>
                    <span className="text-xs font-medium text-slate-500">
                      Showing {(currentCoursePage - 1) * coursesPerPage + 1}–{Math.min(currentCoursePage * coursesPerPage, filteredCourses.length)} of {filteredCourses.length} courses · Page {currentCoursePage} of {coursePageCount}
                    </span>
                    <button
                      className={`${softButtonClass} !px-2.5 !py-1.5`}
                      disabled={currentCoursePage === coursePageCount}
                      onClick={() => setCoursePage((page) => Math.min(coursePageCount, page + 1))}
                      type="button"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </nav>
                )}
              </div>
            </>
          )}

          {view === 'homepage-courses' && showCatalog && (
            <div className="space-y-5">
              <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    aria-label="Back to course management"
                    className="grid size-10 shrink-0 place-items-center border-0 bg-transparent p-0 text-slate-600 transition hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
                    onClick={closeHomepageCourseSelector}
                    title="Back to course management"
                    type="button"
                  >
                    <ChevronFirst aria-hidden="true" size={28} strokeWidth={1} />
                  </button>
                  <div className="min-w-0">
                    <h1 className="m-0 font-[Manrope,sans-serif] text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Add courses to home page</h1>
                  </div>
                </div>
                <button
                  className={buttonClass}
                  disabled={savingHomepageCourses || !hasHomepageCourseSelectionChanged || !homepageCourseSelection.every((id) => publishedCourses.some((course) => course.id === id))}
                  onClick={saveHomepageCourses}
                  type="button"
                >
                  {savingHomepageCourses ? 'Saving…' : 'Save homepage courses'}
                </button>
              </header>

              <label className="relative ml-auto block w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  aria-label="Search courses to add to home page"
                  className={`${inputClass} !rounded-none pl-9`}
                  onChange={(event) => {
                    setHomepageCourseQuery(event.target.value);
                    setHomepageCoursePage(1);
                  }}
                  placeholder="Search title, category or instructor"
                  type="search"
                  value={homepageCourseQuery}
                />
              </label>

              <section aria-label="Course catalog for homepage selection" className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm">
                {visibleHomepageCourses.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                      <thead className="bg-slate-100 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                        <tr>
                          <th className="border-b border-r border-slate-200 px-3 py-3 text-center">Select</th>
                          <th className="border-b border-r border-slate-200 px-3 py-3">Course</th>
                          <th className="border-b border-r border-slate-200 px-3 py-3">Category</th>
                          <th className="border-b border-r border-slate-200 px-3 py-3">Level</th>
                          <th className="border-b border-r border-slate-200 px-3 py-3">Instructor</th>
                          <th className="border-b border-r border-slate-200 px-3 py-3">Duration</th>
                          <th className="border-b border-r border-slate-200 px-3 py-3 text-right">Lessons</th>
                          <th className="border-b border-r border-slate-200 px-3 py-3 text-right">Price</th>
                          <th className="border-b border-slate-200 px-3 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleHomepageCourses.map((course) => {
                          const selected = homepageCourseSelection.includes(course.id);
                          const isPublished = course.status === 'published' || !course.status;
                          const canSelect = selected || (isPublished && homepageCourseSelection.length < 3);
                          return (
                            <tr className="bg-white transition-colors hover:bg-slate-50" key={course.id}>
                              <td className="border-b border-r border-slate-200 px-3 py-2.5 text-center">
                                <input
                                  aria-label={`${selected ? 'Remove' : 'Add'} ${course.title} ${selected ? 'from' : 'to'} homepage`}
                                  checked={selected}
                                  className="size-4 cursor-pointer align-middle accent-violet-600 disabled:cursor-not-allowed"
                                  disabled={!canSelect}
                                  onChange={() => toggleHomepageCourse(course.id)}
                                  type="checkbox"
                                />
                              </td>
                              <td className="max-w-[280px] border-b border-r border-slate-200 px-3 py-2.5">
                                <div className="flex min-w-0 items-center gap-3">
                                  <img alt="" className="size-10 shrink-0 bg-slate-100 object-cover" loading="lazy" src={course.image} />
                                  <span className="min-w-0">
                                    <span className="block truncate font-semibold text-slate-900" title={course.title}>{course.title}</span>
                                    <span className="block truncate text-xs text-slate-500">ID: {course.id}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="border-b border-r border-slate-200 px-3 py-2.5 text-slate-700">{course.category || '—'}</td>
                              <td className="border-b border-r border-slate-200 px-3 py-2.5 text-slate-700">{course.level || '—'}</td>
                              <td className="max-w-48 truncate border-b border-r border-slate-200 px-3 py-2.5 text-slate-700" title={course.instructor}>{course.instructor || '—'}</td>
                              <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 text-slate-700">{course.duration || '—'}</td>
                              <td className="border-b border-r border-slate-200 px-3 py-2.5 text-right tabular-nums text-slate-700">{course.lessons ?? '—'}</td>
                              <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 text-right tabular-nums text-slate-700">₹{Number(course.price).toLocaleString('en-IN')}</td>
                              <td className="border-b border-slate-200 px-3 py-2.5">
                                <Badge tone={statusTone(course.status || 'published')}>{course.status || 'published'}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    description={courses.length ? 'Try another search term.' : 'Add courses to your catalog before selecting homepage courses.'}
                    icon={BookOpen}
                    title={courses.length ? 'No matching courses' : 'No courses available'}
                  />
                )}

                {homepageCoursePageCount > 1 && (
                  <nav aria-label="Homepage course pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                    <button
                      className={`${softButtonClass} !px-2.5 !py-1.5`}
                      disabled={currentHomepageCoursePage === 1}
                      onClick={() => setHomepageCoursePage((page) => Math.max(1, page - 1))}
                      type="button"
                    >
                      <ChevronLeft size={15} /> Previous
                    </button>
                    <span className="text-center text-xs font-medium text-slate-500">
                      Showing {(currentHomepageCoursePage - 1) * homepageCoursesPerPage + 1}–{Math.min(currentHomepageCoursePage * homepageCoursesPerPage, filteredHomepageCourses.length)} of {filteredHomepageCourses.length} courses · Page {currentHomepageCoursePage} of {homepageCoursePageCount}
                    </span>
                    <button
                      className={`${softButtonClass} !px-2.5 !py-1.5`}
                      disabled={currentHomepageCoursePage === homepageCoursePageCount}
                      onClick={() => setHomepageCoursePage((page) => Math.min(homepageCoursePageCount, page + 1))}
                      type="button"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </nav>
                )}
              </section>
            </div>
          )}

          {/* ------------------------------- Learners ------------------------------- */}
          {view === 'learners' && showLearners && (
            <div className="space-y-4">
              <PageHeader
                actions={
                  <label className="relative block w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input aria-label="Search learners" className={`${inputClass} pl-9`} onChange={(event) => setLearnerQuery(event.target.value)} placeholder="Search name or email" value={learnerQuery} />
                  </label>
                }
                title="Learners"
              />

              <div className="overflow-hidden border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                    <thead className="bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="border-b border-r border-slate-200 px-4 py-3">Learner</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3">Email</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3">Phone number</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3">Joined</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3">Status</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody aria-busy={loading} className="bg-white">
                      {loading ? Array.from({ length: 5 }, (_, index) => (
                        <tr aria-hidden="true" className="animate-pulse" key={`learner-skeleton-${index}`}>
                          <td className="border-b border-r border-slate-200 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="size-8 shrink-0 rounded-full bg-slate-200" />
                              <span className="h-3 w-28 rounded bg-slate-200" />
                            </div>
                          </td>
                          <td className="border-b border-r border-slate-200 px-4 py-3"><span className="block h-3 w-36 rounded bg-slate-200" /></td>
                          <td className="border-b border-r border-slate-200 px-4 py-3"><span className="block h-3 w-24 rounded bg-slate-200" /></td>
                          <td className="border-b border-r border-slate-200 px-4 py-3"><span className="block h-3 w-20 rounded bg-slate-200" /></td>
                          <td className="border-b border-r border-slate-200 px-4 py-3"><span className="block h-5 w-16 rounded-full bg-slate-200" /></td>
                          <td className="border-b border-slate-200 px-4 py-3"><span className="ml-auto block h-3 w-12 rounded bg-slate-200" /></td>
                        </tr>
                      )) : learners.map((learner) => (
                        <tr className="align-middle transition hover:bg-slate-50" key={learner.id}>
                          <td className="border-b border-r border-slate-200 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <LearnerPhoto learner={learner} onError={handleLearnerPhotoError} />
                              <button
                                className="border-0 bg-transparent p-0 text-left font-medium text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                onClick={() => openLearnerProfile(learner)}
                                type="button"
                              >
                                {learner.name || 'Unnamed learner'}
                              </button>
                            </div>
                          </td>
                          <td className="border-b border-r border-slate-200 px-4 py-3 whitespace-nowrap text-slate-600">
                            {learner.type === 'email' || learner.identifier?.includes('@')
                              ? <a className="text-blue-600 hover:text-blue-700 hover:underline" href={`mailto:${learner.identifier}`}>{learner.identifier}</a>
                              : 'Not available'}
                          </td>
                          <td className="border-b border-r border-slate-200 px-4 py-3 whitespace-nowrap text-slate-600">{learner.phone || 'Not available'}</td>
                          <td className="border-b border-r border-slate-200 px-4 py-3 whitespace-nowrap text-slate-600">{learner.createdAt ? new Date(learner.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="border-b border-r border-slate-200 px-4 py-3">
                            <Badge tone={statusTone(learner.status)}>{learner.status}</Badge>
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3 text-right">
                            <button
                              className={`border-0 bg-transparent p-0 text-[11px] font-semibold shadow-none transition focus-visible:outline-2 focus-visible:outline-offset-2 ${learner.status === 'suspended' ? 'text-slate-600 hover:text-slate-900 focus-visible:outline-slate-500' : 'text-rose-600 hover:text-rose-800 focus-visible:outline-rose-500'}`}
                              onClick={() => changeLearnerStatus(learner)}
                              type="button"
                            >
                              {learner.status === 'suspended' ? 'Restore' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!loading && !learners.length && <div className="px-4 py-10"><EmptyState description="Try a different name or email." icon={Users} title="No learner accounts found." /></div>}
              </div>
            </div>
          )}

          {/* ------------------------------ Enrollments ------------------------------ */}
          {view === 'enrollments' && showEnrollments && (
            <>
              {selectedEnrollmentLearner ? (
                <section className="space-y-7">
                  <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        aria-label="Back to enrollments"
                        className="grid size-10 shrink-0 place-items-center border-0 bg-transparent p-0 text-slate-600 transition hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
                        onClick={closeEnrollmentLearner}
                        title="Back to enrollments"
                        type="button"
                      >
                        <ChevronFirst aria-hidden="true" size={28} strokeWidth={1} />
                      </button>
                      <p className="m-0 min-w-0 truncate text-sm text-blue-600">{selectedEnrollmentLearner.learner?.identifier || 'Learner details'}</p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-sm text-slate-500">
                        {enrollmentLearnerLoading
                          ? 'Loading course records…'
                          : `${selectedEnrollmentLearner.enrollments?.length ?? 0} course${selectedEnrollmentLearner.enrollments?.length === 1 ? '' : 's'} enrolled`}
                      </span>
                    </div>
                  </header>

                  {enrollmentLearnerLoading ? (
                    <p className="m-0 py-12 text-center text-sm text-slate-500">Loading course enrollments…</p>
                  ) : selectedEnrollmentLearner.enrollments?.length ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-sm">
                          <colgroup>
                            <col className="w-[27%]" />
                            <col className="w-[23%]" />
                            <col className="w-[18%]" />
                            <col className="w-[16%]" />
                            <col className="w-[16%]" />
                          </colgroup>
                          <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-4 py-2 pl-0">Course</th>
                              <th className="px-4 py-2">Instructor</th>
                              <th className="px-4 py-2">Date enrolled</th>
                              <th className="px-4 py-2">Amount paid</th>
                              <th className="px-4 py-2 pr-0">Course progress</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {visibleEnrollmentCourses.map((item) => {
                              const progress = Math.min(100, Math.max(0, Number(item.progress) || 0));
                              return (
                                <tr className="transition hover:bg-slate-50/70" key={item.courseId}>
                                  <td className="px-4 py-4 pl-0 font-semibold text-slate-900">{item.courseTitle}</td>
                                  <td className="px-4 py-4 text-slate-600">{item.instructorName || 'Not specified'}</td>
                                  <td className="px-4 py-4 text-slate-600">{formatAdminDate(item.purchasedAt || item.createdAt)}</td>
                                  <td className="px-4 py-4 font-medium text-emerald-700">{formatAdminCurrency(item.purchasePrice, item.currency)}</td>
                                  <td className="px-4 py-4 pr-0">
                                    <div className="flex items-center gap-2.5">
                                      <div aria-label={`${progress}% complete`} className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100" role="img">
                                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} />
                                      </div>
                                      <span className="text-xs tabular-nums text-slate-600">{progress}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {enrollmentCoursePageCount > 1 && (
                        <nav aria-label="Learner course pages" className="flex items-center justify-between border-t border-slate-200 pt-3">
                          <button
                            aria-label="Previous course page"
                            className={`${softButtonClass} !px-2.5 !py-1.5`}
                            disabled={currentEnrollmentCoursePage === 1}
                            onClick={() => setEnrollmentCoursePage((page) => Math.max(1, page - 1))}
                            type="button"
                          >
                            <ChevronLeft size={15} /> Previous
                          </button>
                          <span className="text-xs font-medium text-slate-500">
                            Showing {(currentEnrollmentCoursePage - 1) * enrollmentCoursesPerPage + 1}–{Math.min(currentEnrollmentCoursePage * enrollmentCoursesPerPage, learnerCourses.length)} of {learnerCourses.length} courses · Page {currentEnrollmentCoursePage} of {enrollmentCoursePageCount}
                          </span>
                          <button
                            aria-label="Next course page"
                            className={`${softButtonClass} !px-2.5 !py-1.5`}
                            disabled={currentEnrollmentCoursePage === enrollmentCoursePageCount}
                            onClick={() => setEnrollmentCoursePage((page) => Math.min(enrollmentCoursePageCount, page + 1))}
                            type="button"
                          >
                            Next <ChevronRight size={15} />
                          </button>
                        </nav>
                      )}
                    </>
                  ) : (
                    <EmptyState description="This learner has no course enrollment records." icon={ClipboardList} title="No courses found." />
                  )}
                </section>
              ) : (
                <div className="space-y-4">
                  <PageHeader
                    actions={
                      <label className="relative block w-full sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                          aria-label="Search enrollments"
                          className={`${inputClass} pl-9`}
                          onChange={(event) => setEnrollmentQuery(event.target.value)}
                          placeholder="Search learner or course"
                          value={enrollmentQuery}
                        />
                      </label>
                    }
                    title="Enrollments"
                  />
                  <div className="overflow-hidden border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                        <thead className="bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          <tr>
                            <th className="border-b border-r border-slate-200 px-4 py-3">Learner</th>
                            <th className="border-b border-r border-slate-200 px-4 py-3">Email</th>
                            <th className="border-b border-slate-200 px-4 py-3">Course</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {filteredEnrollments.map((enrollment) => (
                            <tr className="align-middle transition hover:bg-slate-50" key={enrollment.id}>
                              <td className="border-b border-r border-slate-200 px-4 py-2">
                                <div className="flex items-center gap-2.5">
                                  {showLearners && enrollment.learnerId
                                    ? <LearnerPhoto className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-[10px] font-bold text-slate-700" learner={{ id: enrollment.learnerId, name: enrollment.learnerName }} onError={handleLearnerPhotoError} />
                                    : <Avatar name={enrollment.learnerName} />}
                                  {enrollment.learnerId ? (
                                    <button className="border-0 bg-transparent p-0 text-left font-medium text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" onClick={() => openEnrollmentLearner(enrollment)} type="button">
                                      {enrollment.learnerName}
                                    </button>
                                  ) : <span className="font-medium text-slate-800">{enrollment.learnerName}</span>}
                                </div>
                              </td>
                              <td className="border-b border-r border-slate-200 px-4 py-2 whitespace-nowrap text-blue-600">
                                {enrollment.learnerIdentifier?.includes('@')
                                  ? <a className="hover:text-blue-700 hover:underline" href={`mailto:${enrollment.learnerIdentifier}`}>{enrollment.learnerIdentifier}</a>
                                  : 'Not available'}
                              </td>
                              <td className="border-b border-slate-200 px-4 py-2 font-medium text-slate-800">
                                {enrollment.courseTitle}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!filteredEnrollments.length && (
                      <div className="px-4 py-10">
                        <EmptyState
                          description={enrollments.length ? 'Try another learner name, email or course.' : 'Enrollments will appear here once learners join a course.'}
                          icon={ClipboardList}
                          title={enrollments.length ? 'No matching enrollments.' : 'No enrollment records yet.'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ----------------------------- Platform tools ----------------------------- */}
          {activeToolPanel && (
            <AdminOperationsPage
              courses={courses}
              learners={learners}
              onPanelChange={(id) => setView(id ? `tools:${id}` : 'overview')}
              onRefresh={refresh}
              panel={view.slice(6)}
            />
          )}
          </div>
          {loading && <AdminSectionSkeleton view={view} />}

        </main>
      </div>

      {/* ------------------------- Course create / edit drawer ------------------------- */}
      {courseDrawerOpen && (
        <div aria-labelledby="course-drawer-title" aria-modal="true" className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <button aria-label="Close panel" className="absolute inset-0 cursor-default bg-slate-900/40" onClick={closeCourseDrawer} type="button" />
          <form className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" id="course-form" onSubmit={submitCourse}>
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">{editingId ? <Pencil size={18} /> : <Plus size={18} />}</span>
                <div>
                  <h2 className="m-0 font-[Manrope,sans-serif] text-lg font-bold text-slate-900" id="course-drawer-title">{editingId ? 'Edit course' : 'Add a course'}</h2>
                  <p className="m-0 mt-0.5 text-xs text-slate-500">{editingId ? 'Update the details below and save your changes.' : 'Fill in the details to add a course to your catalog.'}</p>
                </div>
              </div>
              <button aria-label="Close panel" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={closeCourseDrawer} type="button"><X size={18} /></button>
            </header>

            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
              <section>
                <h3 className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Basic details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`${labelClass} sm:col-span-2`}>Course title<input className={inputClass} name="title" onChange={updateCourseField} placeholder="e.g. Product Design Fundamentals" required value={courseForm.title} /></label>
                  <label className={labelClass}>Level<select className={inputClass} name="level" onChange={updateCourseField} value={courseForm.level}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
                  <label className={`${labelClass} sm:col-span-2`}>Publishing<select className={inputClass} name="status" onChange={updateCourseField} value={courseForm.status}><option value="published">Published</option><option value="draft">Draft</option></select></label>
                </div>
              </section>

              {editingId && (
                <section>
                  <h3 className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Course sections</h3>
                  <div className="relative">
                    <button
                      aria-controls="course-sections-menu"
                      aria-expanded={editingSectionsOpen}
                      className={`${inputClass} flex items-center justify-between gap-2 text-left`}
                      disabled={editingSectionsLoading || !editingSections.length}
                      onClick={() => setEditingSectionsOpen((open) => !open)}
                      type="button"
                    >
                      <span className="truncate">
                        {editingSectionsLoading
                          ? 'Loading sections…'
                          : editingSections.find((section) => section.id === editingSectionId)?.title || 'Choose a section'}
                      </span>
                      <ChevronDown className="shrink-0 text-slate-500" size={16} />
                    </button>
                    {editingSectionsOpen && (
                      <div
                        className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                        id="course-sections-menu"
                        role="group"
                        aria-label="Course sections"
                      >
                        {editingSections.map((section) => (
                          <div className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${editingSectionId === section.id ? 'bg-violet-50' : 'hover:bg-slate-50'}`} key={section.id}>
                            <button
                              className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-sm font-medium text-slate-700"
                              onClick={() => {
                                setEditingSectionId(section.id);
                                setEditingSectionsOpen(false);
                              }}
                              type="button"
                            >
                              {section.title}
                            </button>
                            <button
                              className={dangerLinkClass}
                              disabled={Boolean(removingSectionId)}
                              onClick={() => removeEditingSection(section)}
                              type="button"
                            >
                              {removingSectionId === section.id ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {!editingSectionsLoading && !editingSections.length && (
                      <p className="m-0 mt-2 text-sm text-slate-500">No sections in this course yet.</p>
                    )}
                  </div>
                </section>
              )}

              <section>
                <h3 className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Instructor &amp; content</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`${labelClass} sm:col-span-2`}>Instructor<input className={inputClass} name="instructor" onChange={updateCourseField} placeholder="Instructor name" required value={courseForm.instructor} /></label>
                  <label className={labelClass}>Duration<input className={inputClass} name="duration" onChange={updateCourseField} placeholder="e.g. 8 weeks" required value={courseForm.duration} /></label>
                  <label className={labelClass}>Hours<input className={inputClass} name="hours" onChange={updateCourseField} placeholder="e.g. 20 hours" value={courseForm.hours} /></label>
                  <label className={labelClass}>Lessons<input className={inputClass} min="1" name="lessons" onChange={updateCourseField} required type="number" value={courseForm.lessons} /></label>
                </div>
              </section>

              <section>
                <h3 className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Pricing</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>Price (INR)<input className={inputClass} min="0" name="price" onChange={updateCourseField} required type="number" value={courseForm.price} /></label>
                  <label className={labelClass}>Original price (INR)<input className={inputClass} min="0" name="oldPrice" onChange={updateCourseField} required type="number" value={courseForm.oldPrice} /></label>
                </div>
              </section>

              <section>
                <h3 className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Cover image</h3>
                <div className="grid gap-4">
                  <div className={labelClass}>
                    <span>Course image URL</span>
                    <div className="flex gap-2">
                      <input className={`${inputClass} flex-1`} name="image" onChange={updateCourseField} placeholder="Paste image URL" required type="url" value={courseForm.image} />
                      <label className={`${softButtonClass} shrink-0 cursor-pointer !px-3`}>
                        Upload
                        <input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverImageUpload} type="file" />
                      </label>
                    </div>
                  </div>
                  {courseForm.image && <img alt="Course cover preview" className="h-40 w-full rounded-xl border border-slate-200 bg-slate-100 object-cover" key={courseForm.image} onError={(event) => { event.currentTarget.style.display = 'none'; }} src={courseForm.image} />}
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button className={softButtonClass} onClick={closeCourseDrawer} type="button">Cancel</button>
              <button className={buttonClass} type="submit">{editingId ? <Pencil size={15} /> : <Plus size={16} />}{editingId ? 'Save changes' : 'Create course'}</button>
            </footer>
          </form>
        </div>
      )}

      {selectedLearnerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
          <button
            aria-label="Close learner profile"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedLearnerProfile(null)}
            type="button"
          />
          <section aria-labelledby="learner-profile-title" aria-modal="true" className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl" role="dialog">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#7A1F2B] px-5 py-4 text-white sm:px-7">
              <div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Learner account</p>
                <h2 className="m-0 mt-1 text-xl font-bold" id="learner-profile-title">MY SCS Profile</h2>
              </div>
              <button
                aria-label="Close learner profile"
                className="grid size-9 place-items-center border border-white/30 text-white hover:bg-white/10"
                onClick={() => setSelectedLearnerProfile(null)}
                type="button"
              >
                <X size={18} />
              </button>
            </header>

            <div className="overflow-y-auto p-4 sm:p-7">
              {learnerProfileLoading ? (
                <p className="m-0 py-12 text-center text-sm text-slate-500">Loading learner profile…</p>
              ) : (() => {
                const learner = selectedLearnerProfile.learner;
                const profile = learner.profile || {};
                const skills = profile.skills && typeof profile.skills === 'object' ? profile.skills : {};
                const workExperience = Array.isArray(profile.workExperience) ? profile.workExperience : [];
                const education = Array.isArray(profile.education) ? profile.education : [];
                const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
                const languages = Array.isArray(profile.languages) ? profile.languages : [];
                const interests = Array.isArray(profile.interests) ? profile.interests : [];

                return (
                  <div className="space-y-5">
                    <section className="flex flex-wrap items-center gap-4 border border-slate-200 p-4 sm:p-5">
                      <LearnerPhoto className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[20px] bg-[#641a25] text-xl font-bold text-[#E97832]" learner={learner} onError={handleLearnerPhotoError} />
                      <div className="min-w-0 flex-1">
                        <h3 className="m-0 text-xl font-bold text-slate-900">{learner.name || 'Learner'}</h3>
                        <p className="m-0 mt-1 text-sm text-slate-600">{profile.headline || profile.jobTitle || 'MY SCS learner profile'}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>{learner.identifier || 'Email not available'}</span>
                          <span>{learner.phone || 'Phone not available'}</span>
                          {profile.location && <span>{profile.location}</span>}
                        </div>
                      </div>
                    </section>

                    <section className="border border-slate-200 p-4 sm:p-5">
                      <h3 className="m-0 text-sm font-bold text-slate-900">About Me</h3>
                      <p className="m-0 mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{profile.about || 'No introduction added yet.'}</p>
                      {(profile.companyName || profile.experienceYears || profile.specialization) && (
                        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                          {profile.companyName && <p className="m-0"><span className="block text-xs text-slate-400">Company</span><span className="font-medium text-slate-700">{profile.companyName}</span></p>}
                          {profile.experienceYears && <p className="m-0"><span className="block text-xs text-slate-400">Experience</span><span className="font-medium text-slate-700">{profile.experienceYears}</span></p>}
                          {profile.specialization && <p className="m-0"><span className="block text-xs text-slate-400">Specialization</span><span className="font-medium text-slate-700">{profile.specialization}</span></p>}
                        </div>
                      )}
                      <p className="m-0 mt-3 text-xs text-slate-500"><strong className="text-slate-700">Languages:</strong> {languages.length ? languages.join(', ') : 'None added'}</p>
                    </section>

                    <section className="border border-slate-200 p-4 sm:p-5">
                      <h3 className="m-0 text-sm font-bold text-slate-900">Skills</h3>
                      <div className="mt-3 space-y-3">
                        {Object.entries(skills).map(([level, entries]) => Array.isArray(entries) && entries.length > 0 && (
                          <div key={level}>
                            <p className="m-0 mb-2 text-xs font-semibold text-slate-500">{level}</p>
                            <div className="flex flex-wrap gap-2">{entries.map((skill) => <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700" key={skill}>{skill}</span>)}</div>
                          </div>
                        ))}
                        {!Object.values(skills).some((entries) => Array.isArray(entries) && entries.length > 0) && <p className="m-0 text-sm text-slate-500">No skills added yet.</p>}
                      </div>
                    </section>

                    {[
                      ['Work Experience', workExperience, (item) => item.title || 'Position', (item) => [item.company, item.type, item.dates].filter(Boolean).join(' · ')],
                      ['Education', education, (item) => item.institution || 'Education', (item) => [item.degree, item.field, item.dates].filter(Boolean).join(' · ')],
                      ['Certifications', certifications, (item) => item.title || 'Certification', (item) => [item.issuer, item.date].filter(Boolean).join(' · ')],
                    ].map(([title, entries, getTitle, getSubtitle]) => (
                      <section className="border border-slate-200 p-4 sm:p-5" key={title}>
                        <h3 className="m-0 text-sm font-bold text-slate-900">{title}</h3>
                        {entries.length ? (
                          <div className="mt-3 space-y-3">
                            {entries.map((item, index) => (
                              <article className={index ? 'border-t border-slate-100 pt-3' : ''} key={`${title}-${index}`}>
                                <h4 className="m-0 text-sm font-semibold text-slate-800">{getTitle(item)}</h4>
                                {getSubtitle(item) && <p className="m-0 mt-1 text-xs text-slate-500">{getSubtitle(item)}</p>}
                                {item.location && <p className="m-0 mt-1 text-xs text-slate-500">{item.location}</p>}
                                {Array.isArray(item.skills) && item.skills.length > 0 && <p className="m-0 mt-1 text-xs text-slate-600">Skills: {item.skills.join(', ')}</p>}
                                {Array.isArray(item.points) && item.points.length > 0 && <ul className="mb-0 mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">{item.points.map((point) => <li key={point}>{point}</li>)}</ul>}
                                {item.credential && <p className="m-0 mt-1 break-all text-xs text-slate-500">{item.credential}</p>}
                              </article>
                            ))}
                          </div>
                        ) : <p className="m-0 mt-3 text-sm text-slate-500">None added yet.</p>}
                      </section>
                    ))}

                    <section className="border border-slate-200 p-4 sm:p-5">
                      <h3 className="m-0 text-sm font-bold text-slate-900">Interests</h3>
                      <p className="m-0 mt-3 text-sm text-slate-600">{interests.length ? interests.join(' · ') : 'No interests added yet.'}</p>
                    </section>
                  </div>
                );
              })()}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;

function AdminOperationsPage({ courses, learners, onRefresh, panel, onPanelChange }) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [panelLoading, setPanelLoading] = useState(true);
  const [role, setRole] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [trendPeriod, setTrendPeriod] = useState('month');
  const [filters, setFilters] = useState(() => {
    const range = getAnalyticsPeriodRange('month');
    return { from: formatDateInput(range.from), to: formatDateInput(range.to), courseId: '', category: '' };
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoUrl: '', durationMinutes: 0, preview: false, attachments: '[]' });
  const [sectionTitle, setSectionTitle] = useState('');
  const [importJson, setImportJson] = useState('');
  const [learnerSearch, setLearnerSearch] = useState('');
  const [learnerResults, setLearnerResults] = useState(learners);
  const [learnerProfile, setLearnerProfile] = useState(null);
  const [learnerForm, setLearnerForm] = useState({ learnerId: '', courseId: '' });
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', value: 10, maxUses: 0, startsAt: '', endsAt: '' });
  const [coupons, setCoupons] = useState([]);
  const [promotionForm, setPromotionForm] = useState({ title: '', courseId: '', startsAt: '', endsAt: '', bannerText: '' });
  const [promotions, setPromotions] = useState([]);
  const [contentType, setContentType] = useState('announcements');
  const [content, setContent] = useState([]);
  const [contentForm, setContentForm] = useState({ title: '', body: '', link: '', status: 'draft', publishAt: '', kind: 'faq' });
  const [campaign, setCampaign] = useState({ subject: '', body: '' });
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [settings, setSettings] = useState({ platformName: '', supportEmail: '', timezone: 'Asia/Kolkata', categories: [], notifications: { email: false, announcements: true } });
  const [settingsCategory, setSettingsCategory] = useState('');
  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', role: 'course_manager' });
  const [accountEmail, setAccountEmail] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpRequested, setEmailOtpRequested] = useState(false);

  const visibleLearners = useMemo(() => learnerResults || learners, [learnerResults, learners]);
  const visiblePanels = rolePanels[role] || [];
  useEffect(() => {
    apiRequest('/api/admin-auth/me')
      .then(({ admin }) => {
        setRole(admin.role);
        setAccountEmail(admin.email);
        setNewAccountEmail(admin.email);
        const allowed = rolePanels[admin.role] || [];
        if (!allowed.includes(panel)) onPanelChange(allowed[0] || '');
      })
      .catch((requestError) => {
        setError(requestError.message);
        setPanelLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!role) return undefined;
    if (!visiblePanels.includes(panel)) {
      setPanelLoading(false);
      return undefined;
    }

    let active = true;
    const requests = [];
    setPanelLoading(true);
    if (panel === 'analytics') requests.push(loadAnalytics());
    if (panel === 'learning' && selectedCourseId) requests.push(loadSections(selectedCourseId));
    if (panel === 'learners') {
      setLearnerResults(learners);
      requests.push(loadEnrollments());
    }
    if (panel === 'payments') {
      if (['owner', 'finance'].includes(role)) requests.push(loadOrders());
      if (['owner', 'course_manager', 'finance'].includes(role)) requests.push(loadCoupons());
      if (['owner', 'course_manager'].includes(role)) requests.push(loadPromotions());
    }
    if (panel === 'content') requests.push(loadContent());
    if (panel === 'support') {
      if (['owner', 'support'].includes(role)) requests.push(loadTickets());
      requests.push(loadReviews());
    }
    if (panel === 'settings') {
      if (role === 'owner') {
        requests.push(loadSettings(), loadAdmins());
      }
    }

    Promise.all(requests).finally(() => {
      if (active) setPanelLoading(false);
    });
    return () => { active = false; };
  }, [panel, role]);

  useEffect(() => {
    if (panel === 'learning' && selectedCourseId) loadSections(selectedCourseId);
  }, [selectedCourseId]);

  useEffect(() => {
    setLearnerResults(learners);
  }, [learners]);

  useEffect(() => {
    if (selectedSectionId) {
      const section = sections.find((item) => item.id === selectedSectionId);
      setLessons(section?.lessons || []);
    } else {
      setLessons([]);
    }
  }, [sections, selectedSectionId]);

  async function perform(action, message, reload) {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const result = await action();
      if (reload) await reload();
      setNotice(message || 'Saved.');
      return result;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function loadAnalytics(nextFilters = filters) {
    const query = new URLSearchParams(Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value)));
    try { setAnalytics(await apiRequest(`/api/admin/platform/analytics?${query}`)); } catch (requestError) { setError(requestError.message); }
  }
  function changeTrendPeriod(period) {
    setTrendPeriod(period);
    if (period === 'custom') return;
    const range = getAnalyticsPeriodRange(period);
    const nextFilters = { ...filters, from: formatDateInput(range.from), to: formatDateInput(range.to) };
    setFilters(nextFilters);
    loadAnalytics(nextFilters);
  }
  function exportReport(type) {
    const query = new URLSearchParams({ type, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
    return perform(() => downloadAdminFile(`/api/admin/platform/reports/export?${query}`, `${type}.csv`), `${type} report downloaded.`);
  }
  async function loadSections(courseId = selectedCourseId) {
    if (!courseId) return;
    try {
      const data = await apiRequest(`/api/admin/platform/courses/${courseId}/sections`);
      setSections(data.sections);
      if (!data.sections.some((section) => section.id === selectedSectionId)) setSelectedSectionId(data.sections[0]?.id || '');
    } catch (requestError) { setError(requestError.message); }
  }
  async function loadEnrollments(search = enrollmentSearch) {
    try {
      const query = new URLSearchParams({ ...(search ? { search } : {}) });
      const data = await apiRequest(`/api/admin/platform/enrollments?${query}`);
      setEnrollments(data.enrollments);
    } catch (requestError) { setError(requestError.message); }
  }
  async function loadOrders(search = orderSearch) {
    try {
      const query = new URLSearchParams({ ...(search ? { search } : {}) });
      const data = await apiRequest(`/api/payments/orders?${query}`);
      setOrders(data.orders);
    } catch (requestError) { setError(requestError.message); }
  }
  async function loadCoupons() {
    try { setCoupons((await apiRequest('/api/admin/platform/coupons')).coupons); } catch (requestError) { setError(requestError.message); }
  }
  async function loadPromotions() {
    try { setPromotions((await apiRequest('/api/admin/platform/promotions')).promotions); } catch (requestError) { setError(requestError.message); }
  }
  async function loadContent() {
    try { setContent((await apiRequest(`/api/admin/platform/content/${contentType}`)).items); } catch (requestError) { setError(requestError.message); }
  }
  async function loadTickets() {
    try { setTickets((await apiRequest('/api/admin/platform/support/tickets')).tickets); } catch (requestError) { setError(requestError.message); }
  }
  async function loadReviews() {
    try { setReviews((await apiRequest('/api/admin/platform/reviews')).reviews); } catch (requestError) { setError(requestError.message); }
  }
  async function loadSettings() {
    try {
      const data = await apiRequest('/api/admin/platform/settings');
      setSettings({ ...data.settings, categories: data.categories, integrations: data.integrations });
    } catch (requestError) { if (requestError.status !== 403) setError(requestError.message); }
  }
  async function loadAdmins() {
    try { setAdmins((await apiRequest('/api/admin-auth/users')).admins); } catch (requestError) { setError(requestError.message); }
  }

  async function createSection(event) {
    event.preventDefault();
    if (!selectedCourseId) return;
    await perform(async () => {
      await apiRequest(`/api/admin/platform/courses/${selectedCourseId}/sections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: sectionTitle }) });
      setSectionTitle('');
    }, 'Course section created.', () => loadSections());
  }

  async function addLesson(event) {
    event.preventDefault();
    if (!selectedCourseId || !selectedSectionId) return;
    await perform(async () => {
      let attachments;
      try { attachments = JSON.parse(lessonForm.attachments || '[]'); } catch { throw new Error('Attachments must be a valid JSON array.'); }
      if (!Array.isArray(attachments)) throw new Error('Attachments must be a JSON array.');
      await apiRequest(`/api/admin/platform/courses/${selectedCourseId}/sections/${selectedSectionId}/lessons`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lessonForm, durationMinutes: Number(lessonForm.durationMinutes), attachments }),
      });
      setLessonForm({ title: '', description: '', videoUrl: '', durationMinutes: 0, preview: false, attachments: '[]' });
    }, 'Lesson added.', () => loadSections());
  }

  async function removeLesson(lessonId) {
    await perform(
      () => apiRequest(`/api/admin/platform/courses/${selectedCourseId}/sections/${selectedSectionId}/lessons/${lessonId}`, { method: 'DELETE' }),
      'Lesson removed.',
      () => loadSections(),
    );
  }

  async function importCourses(event) {
    event.preventDefault();
    await perform(async () => {
      let parsed;
      try { parsed = JSON.parse(importJson); } catch { throw new Error('Paste a valid JSON array of courses.'); }
      const result = await apiRequest('/api/admin/platform/courses/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courses: parsed }) });
      setImportJson('');
      await onRefresh();
      return result;
    }, 'Course import completed.');
  }

  async function searchLearners(event) {
    event.preventDefault();
    await perform(async () => {
      const result = await apiRequest(`/api/admin/platform/learners?search=${encodeURIComponent(learnerSearch)}`);
      setLearnerResults(result.learners);
    }, '');
  }

  async function showLearner(learner) {
    setLearnerForm((current) => ({ ...current, learnerId: learner.id }));
    await perform(async () => {
      setLearnerProfile(await apiRequest(`/api/admin/learners/${learner.id}/profile`));
    }, '');
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!learnerProfile) return;
    await perform(async () => {
      await apiRequest(`/api/admin/learners/${learnerProfile.learner.id}/profile`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: learnerProfile.learner.name, profile: learnerProfile.learner.profile || {} }),
      });
      await showLearner({ id: learnerProfile.learner.id });
    }, 'Learner profile saved.');
  }

  async function manualEnroll(event) {
    event.preventDefault();
    await perform(async () => {
      await apiRequest('/api/admin/platform/enrollments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId: learnerForm.learnerId, courseId: Number(learnerForm.courseId) }),
      });
      await loadEnrollments();
    }, 'Course access granted.');
  }

  async function createCoupon(event) {
    event.preventDefault();
    await perform(async () => {
      await apiRequest('/api/admin/platform/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...couponForm, value: Number(couponForm.value), maxUses: Number(couponForm.maxUses) }),
      });
      setCouponForm({ code: '', discountType: 'percent', value: 10, maxUses: 0, startsAt: '', endsAt: '' });
    }, 'Coupon created.', loadCoupons);
  }

  async function createContent(event) {
    event.preventDefault();
    await perform(async () => {
      await apiRequest(`/api/admin/platform/content/${contentType}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contentForm),
      });
      setContentForm({ title: '', body: '', link: '', status: 'draft', publishAt: '', kind: 'faq' });
    }, 'Content item created.', loadContent);
  }

  async function sendCampaign(event) {
    event.preventDefault();
    await perform(() => apiRequest('/api/admin/platform/campaigns/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campaign),
    }), 'Campaign processed.');
  }

  async function saveSettings(event) {
    event.preventDefault();
    await perform(() => apiRequest('/api/admin/platform/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { ...settings, categories: settings.categories } }),
    }), 'Platform settings saved.', loadSettings);
  }

  async function requestEmailOtp(event) {
    event.preventDefault();
    const result = await perform(() => apiRequest('/api/admin-auth/account/email/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newAccountEmail }),
    }), 'Verification code sent.');
    if (result) {
      setEmailOtpRequested(true);
      setEmailOtp('');
    }
  }

  async function verifyEmailOtp(event) {
    event.preventDefault();
    const result = await perform(() => apiRequest('/api/admin-auth/account/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newAccountEmail, otp: emailOtp }),
    }), 'Admin email updated.');
    if (result) {
      setAccountEmail(result.email);
      setNewAccountEmail(result.email);
      setEmailOtp('');
      setEmailOtpRequested(false);
      await onRefresh();
    }
  }

  async function sendPasswordResetLink() {
    await perform(() => apiRequest('/api/admin-auth/account/password-reset', { method: 'POST' }), 'Password reset link sent.');
  }

  async function createAdmin(event) {
    event.preventDefault();
    await perform(async () => {
      await apiRequest('/api/admin-auth/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminForm) });
      setAdminForm({ email: '', password: '', role: 'course_manager' });
    }, 'Admin account created.', loadAdmins);
  }

  async function action(url, body, message, reload) {
    await perform(() => apiRequest(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }), message, reload);
  }

  const selectedCourse = courses.find((course) => String(course.id) === String(selectedCourseId));
  const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))];

  const activePanel = panels.find(([id]) => id === panel);

  const enrollmentTrend = buildTrendSeries(analytics?.enrollmentTrend || [], 'enrollments', trendPeriod, filters.from, filters.to);
  const revenueTrend = buildTrendSeries(analytics?.revenueTrend || [], 'amount', trendPeriod, filters.from, filters.to);
  const maxEnrollmentCount = Math.max(1, ...enrollmentTrend.map((point) => point.value));
  const maxRevenueAmount = Math.max(1, ...revenueTrend.map((point) => point.value));
  function renderTrendChart(items, maxValue, colorClass, formatValue, metricLabel) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const average = items.length ? total / items.length : 0;
    const formatAverage = metricLabel === 'revenue'
      ? formatValue(Math.round(average))
      : average.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const peak = items.reduce((highest, item) => item.value > highest.value ? item : highest, { value: 0, label: '—', detail: 'No activity' });
    const dailySeries = trendPeriod === 'month' || (trendPeriod === 'custom' && items.length <= 62);
    const slotClass = dailySeries ? 'w-5 shrink-0' : 'min-w-[34px] flex-1';
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-slate-200 bg-slate-200">
          <div className="bg-white px-2.5 py-1.5">
            <span className="block text-[11px] leading-4 text-slate-500">Total</span>
            <strong className="block font-[Manrope,sans-serif] text-base font-bold leading-5 text-slate-900">{formatValue(total)}</strong>
          </div>
          <div className="bg-white px-2.5 py-1.5">
            <span className="block text-[11px] leading-4 text-slate-500">Average per {dailySeries ? 'day' : 'month'}</span>
            <strong className="block font-[Manrope,sans-serif] text-base font-bold leading-5 text-slate-900">{formatAverage}</strong>
          </div>
          <div className="bg-white px-2.5 py-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="block text-[11px] leading-4 text-slate-500">Peak</span>
              <span className="truncate text-right text-[10px] leading-4 text-slate-500" title={peak.detail}>{peak.detail}</span>
            </div>
            <strong className="block font-[Manrope,sans-serif] text-base font-bold leading-5 text-slate-900">{formatValue(peak.value)}</strong>
          </div>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <div aria-label={`${metricLabel} trend chart`} className="flex h-40 min-w-full items-end gap-1 border-b border-slate-200 px-1">
            {items.map((item) => {
              const title = `${item.detail}: ${formatValue(item.value)} ${metricLabel}`;
              return (
                <div aria-label={title} className={`flex h-full flex-col items-center justify-end ${slotClass}`} key={item.key} title={title}>
                  <div className="flex h-28 w-full items-end justify-center border-b border-slate-100">
                    <div className={`w-3/5 min-w-[5px] ${colorClass}`} style={{ height: `${item.value > 0 ? Math.max(4, (item.value / maxValue) * 100) : 0}%` }} />
                  </div>
                  <span className="mt-1 h-6 text-center text-[10px] leading-4 text-slate-500" title={item.detail}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="platform-tools">
      <PageHeader
        title={activePanel ? activePanel[1] : 'Platform operations'}
      />
      {error && <Banner onDismiss={() => setError('')} tone="error">{error}</Banner>}
      {notice && <Banner onDismiss={() => setNotice('')} tone="success">{notice}</Banner>}

      {panelLoading ? <AdminSectionSkeleton showHeader={false} view={`tools:${panel}`} /> : (
        <>
      {/* ----------------------------- Reports & analytics ----------------------------- */}
      {panel === 'analytics' && (
        <div className="space-y-6">
          <section aria-label="Report filters">
            <button
              aria-controls="analytics-filters"
              aria-expanded={filtersOpen}
              className={`${softButtonClass} !rounded-none`}
              onClick={() => setFiltersOpen((open) => !open)}
              type="button"
            >
              <ListFilter size={15} />
              Filter
              <ChevronRight className={`transition-transform duration-300 ${filtersOpen ? 'rotate-90' : ''}`} size={14} />
            </button>
            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${filtersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} id="analytics-filters">
              <div className="min-h-0 overflow-hidden">
                <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); setTrendPeriod('custom'); loadAnalytics(); }}>
                  <div className="grid grid-cols-1 gap-px overflow-hidden border border-slate-300 bg-slate-200 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                    <label className="flex min-w-0 items-center justify-between gap-2 bg-white px-2.5 py-2 text-xs font-medium text-slate-600">
                      <span className="shrink-0">From</span>
                      <input className="min-w-0 border-0 bg-transparent p-0 text-right text-xs text-slate-900 outline-none focus:ring-0" onChange={(event) => setFilters({ ...filters, from: event.target.value })} type="date" value={filters.from} />
                    </label>
                    <label className="flex min-w-0 items-center justify-between gap-2 bg-white px-2.5 py-2 text-xs font-medium text-slate-600">
                      <span className="shrink-0">To</span>
                      <input className="min-w-0 border-0 bg-transparent p-0 text-right text-xs text-slate-900 outline-none focus:ring-0" onChange={(event) => setFilters({ ...filters, to: event.target.value })} type="date" value={filters.to} />
                    </label>
                    <label className="flex min-w-0 items-center justify-between gap-2 bg-white px-2.5 py-2 text-xs font-medium text-slate-600">
                      <span className="shrink-0">Course</span>
                      <select className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-xs text-slate-900 outline-none focus:ring-0" onChange={(event) => setFilters({ ...filters, courseId: event.target.value })} value={filters.courseId}>
                        <option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                      </select>
                    </label>
                    <label className="flex min-w-0 items-center justify-between gap-2 bg-white px-2.5 py-2 text-xs font-medium text-slate-600">
                      <span className="shrink-0">Category</span>
                      <select className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-xs text-slate-900 outline-none focus:ring-0" onChange={(event) => setFilters({ ...filters, category: event.target.value })} value={filters.category}>
                        <option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button className={`${buttonClass} !rounded-none`} type="submit">Apply filters</button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[['Learners', analytics?.learners], ['Courses', analytics?.courses], ['Enrollments', analytics?.enrollments], ['Orders', analytics?.orders], ['Revenue', `₹${Number(analytics?.revenue || 0).toLocaleString('en-IN')}`]].map(([label, value]) => (
              <article className="rounded-none border border-slate-200 bg-white px-4 py-3 shadow-sm" key={label}>
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <strong className={`mt-1 block font-[Manrope,sans-serif] text-xl font-bold tracking-tight ${label === 'Revenue' ? 'text-emerald-600' : 'text-slate-900'}`}>{value ?? '—'}</strong>
              </article>
            ))}
          </div>

          <div aria-label="Reporting period" className="grid w-fit grid-cols-3 divide-x divide-slate-200 border border-slate-300 bg-white">
            {[
              ['month', 'This month'],
              ['sixMonths', 'Last 6 months'],
              ['year', 'This year'],
            ].map(([period, label]) => (
              <button
                aria-pressed={trendPeriod === period}
                className={`min-h-8 px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${trendPeriod === period ? 'bg-violet-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                key={period}
                onClick={() => changeTrendPeriod(period)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card bodyClassName="p-3" className="!rounded-none" description={trendPeriod === 'month' ? 'Daily enrollments for this month' : trendPeriod === 'year' ? 'Monthly enrollments from January to December' : 'Monthly enrollments for the selected period'} title="Enrollment trend">
              {renderTrendChart(enrollmentTrend, maxEnrollmentCount, 'bg-violet-500', (value) => value.toLocaleString('en-IN'), 'enrollments')}
            </Card>
            <Card bodyClassName="p-3" className="!rounded-none" description={trendPeriod === 'month' ? 'Daily revenue for this month' : trendPeriod === 'year' ? 'Monthly revenue from January to December' : 'Monthly revenue for the selected period'} title="Revenue trend">
              {renderTrendChart(revenueTrend, maxRevenueAmount, 'bg-emerald-500', (value) => `₹${value.toLocaleString('en-IN')}`, 'revenue')}
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable className="!rounded-none" compact headers={['Course', 'Category', 'Enrollments']} title="Popular courses">
              {(analytics?.popularCourses || []).map((item) => <tr key={item.courseId}><Cell className="font-semibold text-slate-900">{item.title}</Cell><Cell>{item.category}</Cell><Cell>{item.enrollments}</Cell></tr>)}
              {!analytics?.popularCourses?.length && <EmptyRow cols={3}>No popular courses in the selected range.</EmptyRow>}
            </DataTable>
            <DataTable className="!rounded-none" compact headers={['Learner', 'Email or phone', 'Joined']} title="Recent sign-ups">
              {(analytics?.recentSignups || []).map((item) => <tr key={item.id}><Cell className="font-semibold text-slate-900">{item.name || 'Learner'}</Cell><Cell className="!text-blue-700">{item.identifier}</Cell><Cell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</Cell></tr>)}
              {!analytics?.recentSignups?.length && <EmptyRow cols={3}>No recent sign-ups.</EmptyRow>}
            </DataTable>
          </div>

          <section aria-labelledby="export-reports-title" className="space-y-2">
            <div>
              <h2 className="m-0 font-[Manrope,sans-serif] text-base font-bold text-slate-900" id="export-reports-title">Export reports</h2>
              <p className="m-0 mt-0.5 text-xs text-slate-500">Download the data as CSV</p>
            </div>
            <div className="flex flex-wrap gap-2">{['courses', 'learners', 'enrollments', 'orders'].map((type) => <button className={`${softButtonClass} !rounded-none capitalize`} key={type} onClick={() => exportReport(type)} type="button"><Download size={14} />Export {type}</button>)}</div>
          </section>
        </div>
      )}

      {/* --------------------------------- Course content --------------------------------- */}
      {panel === 'learning' && (
        <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card title="Course structure">
              <div className="space-y-4">
                <label className={labelClass}>Course<select className={inputClass} onChange={(event) => setSelectedCourseId(event.target.value)} value={selectedCourseId}><option value="">Choose a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                {selectedCourse && <p className="m-0 flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">Status: <Badge tone={statusTone(selectedCourse.status || 'published')}>{selectedCourse.status || 'published'}</Badge></p>}
                {selectedCourse && <p className="m-0 text-xs leading-5 text-slate-500">Use the Courses page to publish, draft, or archive a course.</p>}
                <form className="space-y-3 border-t border-slate-100 pt-4" onSubmit={createSection}>
                  <label className={labelClass}>Add a section<input className={inputClass} onChange={(event) => setSectionTitle(event.target.value)} placeholder="e.g. Getting started" required value={sectionTitle} /></label>
                  <button className={`${buttonClass} w-full`} disabled={!selectedCourseId || busy}><BookOpen size={14} />Add section</button>
                </form>
              </div>
            </Card>
            <Card bodyClassName="p-3" title="Sections">
              <div className="space-y-3 p-2">
                <label className={labelClass}>Section<select className={inputClass} onChange={(event) => setSelectedSectionId(event.target.value)} value={selectedSectionId}><option value="">Choose a section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card description={selectedSectionId ? 'Add a lesson to the selected section' : 'Choose a section to add lessons'} title="New lesson">
              <OperationsForm onSubmit={addLesson}>
                <Field label="Lesson title" onChange={(title) => setLessonForm({ ...lessonForm, title })} required value={lessonForm.title} />
                <Field label="Video / preview URL" onChange={(videoUrl) => setLessonForm({ ...lessonForm, videoUrl })} placeholder="https://" value={lessonForm.videoUrl} />
                <Field label="Duration in minutes" min="0" onChange={(durationMinutes) => setLessonForm({ ...lessonForm, durationMinutes })} type="number" value={lessonForm.durationMinutes} />
                <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-600"><input checked={lessonForm.preview} className="h-4 w-4 rounded border-slate-300 accent-violet-600" onChange={(event) => setLessonForm({ ...lessonForm, preview: event.target.checked })} type="checkbox" />Allow as public preview</label>
                <label className={`${labelClass} sm:col-span-2`}>Description<textarea className={inputClass} onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })} rows="2" value={lessonForm.description} /></label>
                <label className={`${labelClass} sm:col-span-2`}>Attachments JSON array<textarea className={`${inputClass} font-mono text-xs`} onChange={(event) => setLessonForm({ ...lessonForm, attachments: event.target.value })} placeholder='[{"name":"Slides","url":"https://..."}]' rows="2" value={lessonForm.attachments} /></label>
                <div className="sm:col-span-2"><button className={buttonClass} disabled={!selectedSectionId || busy}><Plus size={15} />Add lesson</button></div>
              </OperationsForm>
            </Card>

            <DataTable headers={['Lesson', 'Duration', 'Visibility', 'Action']} title="Lessons in this section">
              {lessons.map((lesson) => <tr key={lesson.id}><Cell>{lesson.title}<div className="text-xs text-slate-400">{lesson.description}</div></Cell><Cell>{lesson.durationMinutes || 0} min</Cell><Cell><Badge tone={lesson.preview ? 'blue' : 'slate'}>{lesson.preview ? 'Public preview' : 'Enrolled learners'}</Badge></Cell><Cell><button className={dangerLinkClass} onClick={() => removeLesson(lesson.id)} type="button">Delete</button></Cell></tr>)}
              {!lessons.length && <EmptyRow cols={4}>No lessons in this section.</EmptyRow>}
            </DataTable>

            <Card description="Paste a JSON array of courses (max 500) or export the current catalog" title="Bulk import &amp; export">
              <form className="grid gap-4" onSubmit={importCourses}>
                <label className={labelClass}>Courses JSON<textarea className={`${inputClass} font-mono text-xs`} onChange={(event) => setImportJson(event.target.value)} placeholder='[{"title":"Course","category":"Design","level":"Beginner","instructor":"Name","duration":"8 weeks","price":1000,"lessons":12}]' rows="4" value={importJson} /></label>
                <div className="flex flex-wrap gap-2">
                  <button className={buttonClass} disabled={busy}>Import catalog</button>
                  <button className={softButtonClass} onClick={() => perform(() => downloadAdminFile('/api/admin/platform/reports/export?type=courses', 'courses.csv'), 'Course catalog exported.')} type="button"><Download size={14} />Export catalog CSV</button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------ Learners & enrollments ------------------------------ */}
      {panel === 'learners' && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="space-y-4">
              <form className="flex flex-wrap gap-2" onSubmit={searchLearners}>
                <label className="relative block min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input aria-label="Search learners" className={`${inputClass} pl-9`} onChange={(event) => setLearnerSearch(event.target.value)} placeholder="Search learner name, email or phone" value={learnerSearch} />
                </label>
                <button className={buttonClass}>Search</button>
              </form>
              <DataTable headers={['Learner', 'Email / phone', 'Status', 'Joined', 'Actions']} title="Learners">
                {visibleLearners.map((learner) => (
                  <tr key={learner.id}>
                    <Cell><button className="border-0 bg-transparent p-0 text-left font-semibold text-violet-700 hover:underline" onClick={() => showLearner(learner)} type="button">{learner.name || 'Unnamed learner'}</button><div className="text-[10px] text-slate-400">{learner.id}</div></Cell>
                    <Cell>{learner.identifier}</Cell>
                    <Cell><Badge tone={statusTone(learner.status)}>{learner.status}</Badge></Cell>
                    <Cell>{learner.createdAt ? new Date(learner.createdAt).toLocaleDateString() : '—'}</Cell>
                    <Cell><div className="flex items-center gap-3"><button className={linkClass} onClick={() => showLearner(learner)} type="button">View</button><button className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline" onClick={() => perform(() => apiRequest(`/api/admin/learners/${learner.id}/request-login-code`, { method: 'POST' }), 'Login code sent through the configured channel.')} type="button">Send login code</button></div></Cell>
                  </tr>
                ))}
                {!visibleLearners.length && <EmptyRow cols={5}>No learners found.</EmptyRow>}
              </DataTable>
            </div>

            <div className="space-y-4">
              <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); loadEnrollments(); }}>
                <input aria-label="Filter enrollments" className={`${inputClass} flex-1`} onChange={(event) => setEnrollmentSearch(event.target.value)} placeholder="Filter enrollments by learner or course" value={enrollmentSearch} />
                <button className={softButtonClass}>Filter</button>
              </form>
              <DataTable headers={['Learner', 'Course', 'Progress', 'Enrolled', 'Access']} title="Enrollments">
                {enrollments.map((item) => (
                  <tr key={item.id}>
                    <Cell>{item.learnerName}<div className="text-xs text-slate-400">{item.learnerIdentifier}</div></Cell>
                    <Cell>{item.courseTitle}</Cell>
                    <Cell><div className="flex items-center gap-2"><div aria-hidden="true" className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, Number(item.progress) || 0))}%` }} /></div><span className="text-xs text-slate-600">{item.progress}%</span></div></Cell>
                    <Cell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</Cell>
                    <Cell><div className="flex items-center gap-3"><button className={dangerLinkClass} onClick={() => perform(() => apiRequest(`/api/admin/platform/enrollments/${item.id}`, { method: 'DELETE' }), 'Enrollment revoked.', loadEnrollments)} type="button">Revoke</button>{['owner', 'course_manager'].includes(role) && <button className={linkClass} onClick={() => perform(() => apiRequest(`/api/admin/platform/enrollments/${item.id}/transfer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: Number(prompt('New published course ID?')) }) }), 'Enrollment transferred.', loadEnrollments)} type="button">Transfer</button>}</div></Cell>
                  </tr>
                ))}
                {!enrollments.length && <EmptyRow cols={5}>No enrollments found.</EmptyRow>}
              </DataTable>
            </div>
          </div>

          <div className="space-y-6">
            <Card description="Select a learner from the list first" title="Grant course access">
              <form className="space-y-4" onSubmit={manualEnroll}>
                <Field label="Learner ID (select a learner)" onChange={(learnerId) => setLearnerForm({ ...learnerForm, learnerId })} required value={learnerForm.learnerId} />
                <label className={labelClass}>Published course<select className={inputClass} onChange={(event) => setLearnerForm({ ...learnerForm, courseId: event.target.value })} required value={learnerForm.courseId}><option value="">Select a course</option>{courses.filter((course) => course.status === 'published' || !course.status).map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                <button className={`${buttonClass} w-full`}>Enroll learner</button>
              </form>
            </Card>
            {learnerProfile && (
              <Card title="Learner account">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={learnerProfile.learner.name} />
                    <p className="m-0 text-xs leading-5 text-slate-600">{learnerProfile.learner.identifier}<br />Joined {learnerProfile.learner.createdAt ? new Date(learnerProfile.learner.createdAt).toLocaleDateString() : '—'} · {learnerProfile.enrollments.length} courses</p>
                  </div>
                  <Field label="Name" onChange={(name) => setLearnerProfile({ ...learnerProfile, learner: { ...learnerProfile.learner, name } })} value={learnerProfile.learner.name || ''} />
                  {['owner', 'support'].includes(role) && <button className={`${buttonClass} w-full`} onClick={saveProfile} type="button">Save profile</button>}
                  <div className="space-y-2">{learnerProfile.enrollments.map((item) => <p className="m-0 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700" key={item.courseId}><span className="truncate">{item.courseTitle}</span><strong>{item.progress}%</strong></p>)}</div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------- Orders & promotions ------------------------------- */}
      {panel === 'payments' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card description="Offer a percentage or fixed discount" icon={BadgePercent} title="Create discount coupon">
              <OperationsForm onSubmit={createCoupon}>
                <Field label="Coupon code" onChange={(code) => setCouponForm({ ...couponForm, code: code.toUpperCase() })} required value={couponForm.code} />
                <label className={labelClass}>Discount type<select className={inputClass} onChange={(event) => setCouponForm({ ...couponForm, discountType: event.target.value })} value={couponForm.discountType}><option value="percent">Percent</option><option value="fixed">Fixed INR</option></select></label>
                <Field label="Value" min="1" onChange={(value) => setCouponForm({ ...couponForm, value })} required type="number" value={couponForm.value} />
                <Field label="Maximum uses (0 = unlimited)" min="0" onChange={(maxUses) => setCouponForm({ ...couponForm, maxUses })} type="number" value={couponForm.maxUses} />
                <Field label="Starts at (optional)" onChange={(startsAt) => setCouponForm({ ...couponForm, startsAt })} type="datetime-local" value={couponForm.startsAt} />
                <Field label="Ends at (optional)" onChange={(endsAt) => setCouponForm({ ...couponForm, endsAt })} type="datetime-local" value={couponForm.endsAt} />
                <div className="sm:col-span-2"><button className={`${buttonClass} w-full sm:w-auto`} disabled={busy}>Create coupon</button></div>
              </OperationsForm>
            </Card>
            <Card description="Show a banner for a course during a time window" icon={Megaphone} title="Schedule promotion">
              <OperationsForm onSubmit={async (event) => { event.preventDefault(); await perform(async () => { await apiRequest('/api/admin/platform/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...promotionForm, courseId: Number(promotionForm.courseId), startsAt: new Date(promotionForm.startsAt).toISOString(), endsAt: new Date(promotionForm.endsAt).toISOString() }) }); setPromotionForm({ title: '', courseId: '', startsAt: '', endsAt: '', bannerText: '' }); }, 'Promotion scheduled.', loadPromotions); }}>
                <Field label="Promotion title" onChange={(title) => setPromotionForm({ ...promotionForm, title })} required value={promotionForm.title} />
                <label className={labelClass}>Course<select className={inputClass} onChange={(event) => setPromotionForm({ ...promotionForm, courseId: event.target.value })} required value={promotionForm.courseId}><option value="">Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                <Field label="Starts" onChange={(startsAt) => setPromotionForm({ ...promotionForm, startsAt })} required type="datetime-local" value={promotionForm.startsAt} />
                <Field label="Ends" onChange={(endsAt) => setPromotionForm({ ...promotionForm, endsAt })} required type="datetime-local" value={promotionForm.endsAt} />
                <div className="sm:col-span-2"><Field label="Banner text" onChange={(bannerText) => setPromotionForm({ ...promotionForm, bannerText })} value={promotionForm.bannerText} /></div>
                <div className="sm:col-span-2"><button className={`${buttonClass} w-full sm:w-auto`} disabled={busy}>Schedule promotion</button></div>
              </OperationsForm>
            </Card>
          </div>

          <DataTable headers={['Code', 'Discount', 'Uses', 'Window', 'Status', 'Action']} title="Coupons">
            {coupons.map((coupon) => <tr key={coupon.id}><Cell><strong className="font-mono text-slate-900">{coupon.code}</strong></Cell><Cell>{coupon.discountType === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`}</Cell><Cell>{coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}</Cell><Cell>{coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString() : 'No expiry'}</Cell><Cell><Badge tone={statusTone(coupon.status)}>{coupon.status}</Badge></Cell><Cell><button className={linkClass} onClick={() => action(`/api/admin/platform/coupons/${coupon.id}`, { status: coupon.status === 'active' ? 'inactive' : 'active' }, 'Coupon status updated.', loadCoupons)} type="button">{coupon.status === 'active' ? 'Disable' : 'Enable'}</button></Cell></tr>)}
            {!coupons.length && <EmptyRow cols={6}>No coupons created yet.</EmptyRow>}
          </DataTable>

          {['owner', 'course_manager'].includes(role) && (
            <DataTable headers={['Promotion', 'Course', 'Starts', 'Ends', 'Action']} title="Scheduled promotions">
              {promotions.map((promo) => <tr key={promo.id}><Cell>{promo.title}<div className="text-xs text-slate-400">{promo.bannerText}</div></Cell><Cell>{promo.courseTitle}</Cell><Cell>{new Date(promo.startsAt).toLocaleString()}</Cell><Cell>{new Date(promo.endsAt).toLocaleString()}</Cell><Cell><button className={dangerLinkClass} onClick={() => perform(() => apiRequest(`/api/admin/platform/promotions/${promo.id}`, { method: 'DELETE' }), 'Promotion removed.', loadPromotions)} type="button">Remove</button></Cell></tr>)}
              {!promotions.length && <EmptyRow cols={5}>No promotions scheduled.</EmptyRow>}
            </DataTable>
          )}

          {['owner', 'finance'].includes(role) && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block min-w-[220px] max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input aria-label="Search orders" className={`${inputClass} pl-9`} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search order, name or email" value={orderSearch} />
                </label>
                <button className={buttonClass} onClick={() => loadOrders()} type="button">Search orders</button>
                <button className={softButtonClass} onClick={() => perform(() => downloadAdminFile('/api/admin/platform/reports/export?type=orders', 'orders.csv'), 'Orders exported.')} type="button"><Download size={14} />Export</button>
              </div>
              <DataTable headers={['Order / learner', 'Courses', 'Amount', 'Status', 'Payment / refunds', 'Action']} title="Orders">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <Cell><strong className="text-slate-900">{order.razorpayOrderId || order.id}</strong><div className="text-xs text-slate-400">{order.userName} · {order.userEmail}</div></Cell>
                    <Cell>{order.courseTitles?.join(', ') || '—'}</Cell>
                    <Cell>₹{Number(order.amount).toLocaleString('en-IN')}</Cell>
                    <Cell><Badge tone={statusTone(order.status)}>{String(order.status).replaceAll('_', ' ')}</Badge>{order.failureReason && <div className="mt-1 text-xs text-rose-500">{order.failureReason}</div>}</Cell>
                    <Cell>{order.razorpayPaymentId || 'No captured payment'}{order.refunds?.map((refund) => <div className="text-xs text-slate-500" key={refund.id}>₹{refund.amount} · {refund.status}</div>)}</Cell>
                    <Cell>{['paid', 'partially_refunded'].includes(order.status) && <button className={dangerLinkClass} onClick={() => { const amount = prompt(`Refund amount (INR, max ₹${order.amount - (order.refundedAmount || 0)})`, String(order.amount - (order.refundedAmount || 0))); if (amount !== null) perform(() => apiRequest(`/api/payments/orders/${order.razorpayOrderId}/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(amount) }) }), 'Refund request completed.', loadOrders); }} type="button">Refund</button>}</Cell>
                  </tr>
                ))}
                {!orders.length && <EmptyRow cols={6}>No orders found.</EmptyRow>}
              </DataTable>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ Content & campaigns ------------------------------ */}
      {panel === 'content' && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card description="Pick a content type, then add or manage items" title="Content library">
              <div className="space-y-5">
                <div className="flex flex-wrap items-end gap-2">
                  <label className={`${labelClass} min-w-48`}>Manage<select className={inputClass} onChange={(event) => setContentType(event.target.value)} value={contentType}><option value="announcements">Announcements</option><option value="banners">Homepage banners</option><option value="help">FAQs &amp; policies</option><option value="templates">Email templates</option></select></label>
                  <button className={softButtonClass} onClick={loadContent} type="button"><RefreshCw size={14} />Reload</button>
                </div>
                <OperationsForm onSubmit={createContent}>
                  <Field label="Title" onChange={(title) => setContentForm({ ...contentForm, title })} required value={contentForm.title} />
                  {contentType === 'help' && <label className={labelClass}>Content type<select className={inputClass} onChange={(event) => setContentForm({ ...contentForm, kind: event.target.value })} value={contentForm.kind}><option value="faq">FAQ</option><option value="policy">Policy / help article</option></select></label>}
                  <label className={`${labelClass} sm:col-span-2`}>Message / content<textarea className={inputClass} onChange={(event) => setContentForm({ ...contentForm, body: event.target.value })} required rows="3" value={contentForm.body} /></label>
                  {contentType === 'banners' && <Field label="Link (optional)" onChange={(link) => setContentForm({ ...contentForm, link })} placeholder="https://" value={contentForm.link} />}
                  <label className={labelClass}>Status<select className={inputClass} onChange={(event) => setContentForm({ ...contentForm, status: event.target.value })} value={contentForm.status}><option value="draft">Draft</option><option value="published">Published</option></select></label>
                  <Field label="Schedule publish (optional)" onChange={(publishAt) => setContentForm({ ...contentForm, publishAt })} type="datetime-local" value={contentForm.publishAt} />
                  <div className="sm:col-span-2"><button className={buttonClass}>Save content</button></div>
                </OperationsForm>
              </div>
            </Card>

            <div className="space-y-3">
              {content.map((item) => (
                <article className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={item.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{item.title}</strong><Badge tone={statusTone(item.status)}>{item.status}</Badge><span className="text-[11px] uppercase tracking-wide text-slate-400">{item.type}</span></div>
                    <p className="m-0 mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">{item.body}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className={linkClass} onClick={() => action(`/api/admin/platform/content/${contentType}/${item.id}`, { status: item.status === 'published' ? 'draft' : 'published' }, 'Content status updated.', loadContent)} type="button">{item.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                    <button className={dangerLinkClass} onClick={() => perform(() => apiRequest(`/api/admin/platform/content/${contentType}/${item.id}`, { method: 'DELETE' }), 'Content removed.', loadContent)} type="button">Delete</button>
                  </div>
                </article>
              ))}
              {!content.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white"><EmptyState icon={Megaphone} title="No content has been added." /></div>}
            </div>
          </div>

          {['owner', 'support'].includes(role) && (
            <Card description="Send an email to opted-in learners" icon={Megaphone} title="Email campaign">
              <OperationsForm onSubmit={sendCampaign}>
                <div className="sm:col-span-2"><Field label="Subject" onChange={(subject) => setCampaign({ ...campaign, subject })} required value={campaign.subject} /></div>
                <label className={`${labelClass} sm:col-span-2`}>Plain text email<textarea className={inputClass} onChange={(event) => setCampaign({ ...campaign, body: event.target.value })} required rows="6" value={campaign.body} /></label>
                <p className="m-0 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500 sm:col-span-2">Requires SMTP configuration. Sends to active, opted-in email accounts only; delivery counts are recorded.</p>
                <div className="sm:col-span-2"><button className={`${buttonClass} w-full`} disabled={busy}>Send campaign</button></div>
              </OperationsForm>
            </Card>
          )}
        </div>
      )}

      {/* ------------------------------- Support & reviews ------------------------------- */}
      {panel === 'support' && (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          {['owner', 'support'].includes(role) && (
            <div className="space-y-4">
              <h2 className="m-0 flex items-center gap-2 font-[Manrope,sans-serif] text-base font-bold text-slate-900"><Ticket size={18} className="text-violet-600" />Learner support requests</h2>
              {tickets.map((ticket) => (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={ticket.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong className="text-sm text-slate-900">{ticket.subject}</strong>
                    <div className="flex items-center gap-1.5"><Badge tone={statusTone(ticket.status)}>{String(ticket.status).replaceAll('_', ' ')}</Badge><Badge tone={statusTone(ticket.priority)}>{ticket.priority}</Badge></div>
                  </div>
                  <p className="m-0 mt-2 text-sm leading-6 text-slate-600">{ticket.body}</p>
                  <p className="m-0 mt-2 text-xs text-slate-400">{ticket.userName} · {ticket.userEmail}</p>
                  <form className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); action(`/api/admin/platform/support/tickets/${ticket.id}`, { status: form.get('status'), priority: form.get('priority'), note: form.get('note') }, 'Ticket updated.', loadTickets); }}>
                    <select aria-label="Ticket status" className={inputClass} defaultValue={ticket.status} name="status"><option>open</option><option>in_progress</option><option>resolved</option><option>closed</option></select>
                    <select aria-label="Ticket priority" className={inputClass} defaultValue={ticket.priority} name="priority"><option>low</option><option>normal</option><option>high</option><option>urgent</option></select>
                    <input aria-label="Internal note" className={`${inputClass} sm:col-span-2`} name="note" placeholder="Add internal note" />
                    <button className={softButtonClass}>Update</button>
                  </form>
                  {ticket.notes?.map((note, index) => <p className="mb-0 mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900" key={index}><strong>{note.author}:</strong> {note.body}</p>)}
                </article>
              ))}
              {!tickets.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white"><EmptyState icon={Ticket} title="No support tickets." /></div>}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="m-0 flex items-center gap-2 font-[Manrope,sans-serif] text-base font-bold text-slate-900"><GraduationCap size={18} className="text-violet-600" />Course reviews &amp; feedback</h2>
            {reviews.map((review) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={review.id}>
                <div className="flex items-center justify-between gap-2"><strong className="text-sm text-slate-900">{review.userName} · {review.rating}/5</strong><Badge tone={statusTone(review.status)}>{review.status}</Badge></div>
                <p className="m-0 mt-2 text-sm leading-6 text-slate-600">{review.body}</p>
                {review.status === 'pending' && (
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button className={buttonClass} onClick={() => action(`/api/admin/platform/reviews/${review.id}`, { status: 'approved' }, 'Review approved.', loadReviews)} type="button">Approve</button>
                    <button className={softButtonClass} onClick={() => action(`/api/admin/platform/reviews/${review.id}`, { status: 'rejected' }, 'Review rejected.', loadReviews)} type="button">Reject</button>
                  </div>
                )}
              </article>
            ))}
            {!reviews.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white"><EmptyState icon={MessageSquare} title="No reviews reported or submitted." /></div>}
          </div>
        </div>
      )}

      {/* ----------------------------- Settings & admin access ----------------------------- */}
      {panel === 'settings' && (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          {role === 'owner' && (
            <Card description="General configuration and integration status" icon={Shield} title="Platform settings &amp; integrations">
              <form className="space-y-4" onSubmit={saveSettings}>
                <Field label="Platform name" onChange={(platformName) => setSettings({ ...settings, platformName })} value={settings.platformName || ''} />
                <Field label="Support email" onChange={(supportEmail) => setSettings({ ...settings, supportEmail })} type="email" value={settings.supportEmail || ''} />
                <Field label="Timezone" onChange={(timezone) => setSettings({ ...settings, timezone })} value={settings.timezone || ''} />
                <label className={labelClass}>Course categories (comma separated)<input className={inputClass} onChange={(event) => setSettings({ ...settings, categories: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} value={(settings.categories || []).join(', ')} /></label>
                <label className="flex items-center gap-2.5 text-sm text-slate-700"><input checked={settings.notifications?.announcements ?? true} className="h-4 w-4 rounded border-slate-300 accent-violet-600" onChange={(event) => setSettings({ ...settings, notifications: { ...settings.notifications, announcements: event.target.checked } })} type="checkbox" />Enable learner announcements</label>
                <button className={buttonClass}>Save settings</button>
                <div className="border-t border-slate-100 pt-4">
                  <strong className="text-sm text-slate-900">Integration readiness</strong>
                  <p className="m-0 mb-3 mt-1 text-xs text-slate-500">Credentials are environment-only and never displayed here.</p>
                  <div className="flex flex-wrap gap-2">{Object.entries(settings.integrations || {}).map(([name, enabled]) => <Badge key={name} tone={enabled ? 'green' : 'amber'}>{name}: {enabled ? 'configured' : 'not configured'}</Badge>)}</div>
                </div>
              </form>
            </Card>
          )}

          <Card description="Manage the email and password used to sign in" icon={Shield} title="Admin sign-in &amp; security">
            <div className="space-y-5">
              <section className="space-y-3">
                <div>
                  <strong className="text-sm text-slate-900">Current email</strong>
                  <p className="m-0 mt-1 break-all text-sm text-slate-600">{accountEmail}</p>
                </div>
                <form className="space-y-3" onSubmit={emailOtpRequested ? verifyEmailOtp : requestEmailOtp}>
                  <Field label="New email" onChange={setNewAccountEmail} required type="email" value={newAccountEmail} />
                  {emailOtpRequested && (
                    <Field
                      label="Six-digit verification code"
                      maxLength="6"
                      onChange={setEmailOtp}
                      required
                      value={emailOtp}
                      inputMode="numeric"
                    />
                  )}
                  <button className={buttonClass} disabled={busy} type="submit">
                    {emailOtpRequested ? 'Verify code and change email' : 'Send verification code'}
                  </button>
                  {emailOtpRequested && <button className={linkClass} disabled={busy} onClick={requestEmailOtp} type="button">Send a new code</button>}
                </form>
              </section>
              <section className="border-t border-slate-100 pt-4">
                <strong className="text-sm text-slate-900">Change password</strong>
                <p className="m-0 mb-3 mt-1 text-xs leading-5 text-slate-500">We’ll send a one-time password reset link to your current email. The link expires after 30 minutes.</p>
                <button className={softButtonClass} disabled={busy || !accountEmail} onClick={sendPasswordResetLink} type="button">Email password reset link</button>
              </section>
            </div>
          </Card>

          {role === 'owner' && (
            <Card description="Create admins and control what they can access" icon={Users} title="Admin accounts &amp; roles">
              <div className="space-y-5">
                <OperationsForm onSubmit={createAdmin}>
                  <Field label="Admin email" onChange={(email) => setAdminForm({ ...adminForm, email })} required type="email" value={adminForm.email} />
                  <Field label="Initial password (12+ characters)" minLength="12" onChange={(password) => setAdminForm({ ...adminForm, password })} required type="password" value={adminForm.password} />
                  <label className={labelClass}>Role<select className={inputClass} onChange={(event) => setAdminForm({ ...adminForm, role: event.target.value })} value={adminForm.role}><option value="course_manager">Course manager</option><option value="support">Support</option><option value="finance">Finance</option></select></label>
                  <div className="self-end"><button className={buttonClass}><Plus size={15} />Add admin</button></div>
                </OperationsForm>
                <DataTable headers={['Email', 'Role', 'Status', 'Source', 'Actions']}>
                  {admins.map((admin) => (
                    <tr key={admin.id || admin.email}>
                      <Cell>{admin.email}</Cell>
                      <Cell>{roleLabels[admin.role] || admin.role}</Cell>
                      <Cell><Badge tone={statusTone(admin.status || 'active')}>{admin.status || 'active'}</Badge></Cell>
                      <Cell>{admin.source}</Cell>
                      <Cell>{admin.source === 'managed' && <div className="flex items-center gap-3"><select aria-label={`Role for ${admin.email}`} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs" onChange={(event) => action(`/api/admin-auth/users/${admin.id}`, { role: event.target.value }, 'Admin role updated.', loadAdmins)} value={admin.role}><option value="course_manager">Course manager</option><option value="support">Support</option><option value="finance">Finance</option></select><button className={admin.status === 'disabled' ? linkClass : dangerLinkClass} onClick={() => action(`/api/admin-auth/users/${admin.id}`, { status: admin.status === 'disabled' ? 'active' : 'disabled' }, 'Admin access updated.', loadAdmins)} type="button">{admin.status === 'disabled' ? 'Enable' : 'Disable'}</button></div>}</Cell>
                    </tr>
                  ))}
                </DataTable>
                <p className="m-0 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">Roles: owner manages settings and admins; course manager manages catalog and enrollments; support manages learner access, tickets and reviews; finance manages reports, orders, refunds and coupons.</p>
              </div>
            </Card>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}