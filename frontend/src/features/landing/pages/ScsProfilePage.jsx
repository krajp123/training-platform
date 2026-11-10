import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpRight, BadgeCheck, Check, ChevronDown, FileText,
  Hand, MapPin, Pencil, Plus, Upload, X,
} from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import { deleteJson, getBlob, getJson, patchJson, uploadFile } from '../../../services/api.js';

const emptyProfile = {
  name: '',
  identifier: '',
  type: '',
  headline: '',
  jobTitle: '',
  companyName: '',
  experienceYears: '',
  specialization: '',
  location: '',
  about: '',
  languages: [],
  skills: { Expert: [], Intermediate: [], Beginner: [] },
  workExperience: [],
  education: [],
  certifications: [],
  badges: [],
  interests: [],
  applauds: 0,
  resume: null,
};

const sectionLinks = [
  ['about', 'About Me'],
  ['skills', 'Skills'],
  ['experience', 'Work Experience'],
  ['education', 'Education'],
  ['certifications', 'Certifications'],
];

const sectionFields = {
  personal: [
    { key: 'name', label: 'Full name', required: true, placeholder: 'e.g. Alex Morgan' },
    { key: 'headline', label: 'Profile headline', placeholder: 'e.g. BIM Coordinator | Revit & Digital Construction' },
    { key: 'jobTitle', label: 'Current role', placeholder: 'e.g. BIM Coordinator' },
    { key: 'companyName', label: 'Company name', placeholder: 'e.g. Acme Design Studio' },
    { key: 'experienceYears', label: 'Years of experience', type: 'number', min: 0, max: 80, step: 0.5, placeholder: 'e.g. 3' },
    { key: 'specialization', label: 'Specialization', placeholder: 'e.g. Structural BIM' },
    { key: 'location', label: 'Location', placeholder: 'City, country' },
  ],
  about: [
    { key: 'about', label: 'About me', type: 'textarea', rows: 5, maxLength: 2000, placeholder: 'Share your background, strengths, and what you are working towards.' },
    { key: 'languages', label: 'Languages', type: 'tags', placeholder: 'Type a language and press Enter' },
  ],
  skills: [
    { key: 'Expert', label: 'Expert', type: 'tags', placeholder: 'Add an expert skill' },
    { key: 'Intermediate', label: 'Intermediate', type: 'tags', placeholder: 'Add an intermediate skill' },
    { key: 'Beginner', label: 'Beginner', type: 'tags', placeholder: 'Add a beginner skill' },
  ],
  workExperience: [
    { key: 'title', label: 'Job title', required: true, placeholder: 'e.g. BIM Modeler' },
    { key: 'company', label: 'Company', placeholder: 'Company or organization' },
    { key: 'type', label: 'Employment type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Other'] },
    { key: 'dates', label: 'Employment dates', type: 'monthRange' },
    { key: 'location', label: 'Location', placeholder: 'City, country or Remote' },
    { key: 'skills', label: 'Skills used', type: 'tags', placeholder: 'Add a skill used in this role' },
    { key: 'points', label: 'Key responsibilities and achievements', type: 'list', rows: 3, hint: 'Use a new line for each point.', placeholder: 'Describe a responsibility or measurable achievement on each line.' },
  ],
  education: [
    { key: 'institution', label: 'Institution', required: true, placeholder: 'School, college, or university' },
    { key: 'degree', label: 'Degree or qualification', placeholder: 'e.g. Bachelor of Technology' },
    { key: 'dates', label: 'Study period', type: 'monthRange', currentLabel: 'Currently studying' },
    { key: 'field', label: 'Field of study', placeholder: 'e.g. Civil Engineering' },
  ],
  certifications: [
    { key: 'title', label: 'Certification', required: true, placeholder: 'Certification name' },
    { key: 'issuer', label: 'Issuing organization', placeholder: 'Organization or provider' },
    { key: 'date', label: 'Date earned', type: 'month' },
    { key: 'credential', label: 'Credential ID or link', placeholder: 'ID or https://credential.example' },
  ],
};

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S';
}

function notifyAvatarChanged() {
  const user = JSON.parse(localStorage.getItem('scs_user') || 'null');
  if (user) window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: user }));
}

const levelRank = { Expert: 3, Intermediate: 2, Beginner: 1 };
const levelAccent = { Beginner: '#B88600', Intermediate: '#C23E5C', Expert: '#6D28D9' };
const navbarGradient = 'linear-gradient(90deg, #7A1F2B 0%, #A52A32 22%, #D34B2F 48%, #E97832 68%, #C94C2D 84%, #7A1F2B 100%)';
const levelChip = {
  Beginner: 'bg-[#B88600] text-white',
  Intermediate: 'bg-[#C23E5C] text-white',
  Expert: 'bg-[#6D28D9] text-white',
};

function Section({ id, title, action, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[#d3dad9] py-8 first:border-t-0 first:pt-2 sm:py-9">
      <div className="flex items-center justify-between gap-4">
        <h2 className="m-0 font-[Bricolage_Grotesque,sans-serif] text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[#17262b]">{title}</h2>
        {action}
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

function ProfileActionButton({ icon: Icon, children, onClick, tone = 'light' }) {
  const tones = {
    light: 'border-[#17262b]/20 bg-white text-[#17262b] hover:border-[#7A1F2B] hover:bg-[#7A1F2B] hover:text-white',
    dark: 'border-white/25 bg-transparent text-white hover:border-white hover:bg-white hover:text-[#7A1F2B]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0b44c] ${tones[tone]}`}
    >
      <Icon size={14} aria-hidden="true" />
      {children}
    </button>
  );
}

function EditButton({ editing, onClick, tone, hidden = false }) {
  if (hidden) return null;
  return (
    <ProfileActionButton icon={editing ? X : Pencil} onClick={onClick} tone={tone}>
      {editing ? 'Cancel' : 'Edit'}
    </ProfileActionButton>
  );
}

function TagsField({ definition, value, onChange }) {
  const [input, setInput] = useState('');
  const tags = Array.isArray(value) ? value : [];
  const addTag = () => {
    const tag = input.trim().replace(/,$/, '').trim();
    if (tag && !tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      onChange(definition.key, [...tags, tag]);
    }
    setInput('');
  };

  return (
    <div className="grid gap-2">
      {tags.length > 0 && (
        <ul className="m-0 flex flex-wrap gap-2 p-0" aria-label={`${definition.label} added`}>
          {tags.map((tag, index) => (
            <li key={`${tag}-${index}`} className="inline-flex items-center gap-1.5 rounded-md border border-[#D34B2F]/30 bg-[#f9e8e3] py-1 pl-2.5 pr-1 text-xs font-semibold text-[#7A1F2B]">
              {tag}
              <button
                type="button"
                onClick={() => onChange(definition.key, tags.filter((_, itemIndex) => itemIndex !== index))}
                className="grid size-5 place-items-center text-[#A52A32] hover:bg-[#f3d9d4] hover:text-[#7A1F2B]"
                aria-label={`Remove ${tag}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        className="w-full rounded-md border border-[#c4cecd] bg-white px-3 py-2.5 text-sm text-[#17262b] outline-none transition placeholder:text-[#8a9899] focus:border-[#A52A32] focus:ring-2 focus:ring-[#A52A32]/10"
        value={input}
        placeholder={definition.placeholder}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        aria-label={definition.label}
      />
      <p className="m-0 text-[11px] font-normal text-[#6f8083]">Press Enter or comma to add each item.</p>
    </div>
  );
}

function parseMonthRange(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2})\s*(?:-|–|to)\s*(\d{4}-\d{2}|present|current|ongoing)?$/i);
  return match
    ? { start: match[1], end: /^\d{4}-\d{2}$/.test(match[2] || '') ? match[2] : '', current: /^(present|current|ongoing)$/i.test(match[2] || '') }
    : null;
}

function formatMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value || '')) return value || '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}-01T00:00:00.000Z`));
}

function formatMonthRange(value) {
  const range = parseMonthRange(value);
  if (!range) return value || '';
  return `${formatMonth(range.start)} – ${range.current ? 'Present' : formatMonth(range.end)}`.trim();
}

function MonthRangeField({ definition, value, onChange }) {
  const range = parseMonthRange(value);
  const updateRange = (start, end, current) => {
    onChange(definition.key, start ? `${start} – ${current ? 'Present' : end}`.trim() : '');
  };
  const inputClass = 'min-w-0 flex-1 rounded-md border border-[#c4cecd] bg-white px-3 py-2.5 text-sm text-[#17262b] outline-none focus:border-[#A52A32] focus:ring-2 focus:ring-[#A52A32]/10';

  if (value && !range) {
    return (
      <input
        className={`${inputClass} w-full`}
        value={value}
        placeholder="e.g. Aug 2022 – Present"
        onChange={(event) => onChange(definition.key, event.target.value)}
        aria-label={definition.label}
      />
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <input
          type="month"
          className={inputClass}
          value={range?.start || ''}
          onChange={(event) => updateRange(event.target.value, range?.end || '', range?.current || false)}
          aria-label={`${definition.label} start`}
        />
        <span className="text-xs text-[#6f8083]">to</span>
        <input
          type="month"
          className={inputClass}
          value={range?.end || ''}
          disabled={range?.current}
          onChange={(event) => updateRange(range?.start || '', event.target.value, false)}
          aria-label={`${definition.label} end`}
        />
      </div>
      <label className="inline-flex w-fit items-center gap-2 text-xs font-medium text-[#5b6b70]">
        <input
          type="checkbox"
          checked={range?.current || false}
          onChange={(event) => updateRange(range?.start || '', '', event.target.checked)}
          className="size-4 accent-[#12363f]"
        />
        {definition.currentLabel || 'Currently working here'}
      </label>
      <p className="m-0 text-[11px] font-normal text-[#6f8083]">Choose a start month and end month, or mark it as current.</p>
    </div>
  );
}

function Field({ definition, value, onChange }) {
  const content = definition.type === 'list'
    ? (Array.isArray(value) ? value : []).join('\n')
    : value ?? '';
  const className = 'w-full rounded-md border border-[#c4cecd] bg-white px-3 py-2.5 text-sm text-[#17262b] outline-none transition placeholder:text-[#8a9899] focus:border-[#A52A32] focus:ring-2 focus:ring-[#A52A32]/10';
  return (
    <div className="grid gap-1.5 text-xs font-bold text-[#3f5256]">
      <span>{definition.label}{definition.required && <span className="ml-1 text-[#b3372f]" aria-hidden="true">*</span>}</span>
      {definition.type === 'tags' ? (
        <TagsField definition={definition} value={value} onChange={onChange} />
      ) : definition.type === 'monthRange' ? (
        <MonthRangeField definition={definition} value={value} onChange={onChange} />
      ) : definition.type === 'select' ? (
        <select
          className={className}
          value={content}
          onChange={(event) => onChange(definition.key, event.target.value)}
          aria-label={definition.label}
        >
          <option value="">Select employment type</option>
          {content && !definition.options.includes(content) && <option value={content}>{content}</option>}
          {definition.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : definition.type === 'textarea' || definition.type === 'list' ? (
        <textarea
          className={`${className} min-h-24 resize-y`}
          rows={definition.rows}
          maxLength={definition.maxLength}
          value={content}
          placeholder={definition.placeholder}
          aria-label={definition.label}
          onChange={(event) => onChange(definition.key, definition.type === 'list' ? event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) : event.target.value)}
        />
      ) : (
        <input
          className={className}
          type={definition.type || 'text'}
          min={definition.min}
          max={definition.max}
          step={definition.step}
          maxLength={definition.maxLength}
          required={definition.required}
          value={content}
          placeholder={definition.placeholder}
          onChange={(event) => onChange(definition.key, event.target.value)}
        />
      )}
      {definition.hint && <span className="text-[11px] font-normal text-[#6f8083]">{definition.hint}</span>}
    </div>
  );
}

function SaveActions({ saving, onSave, onCancel }) {
  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-[#dbe2e1] pt-4">
      <button type="button" onClick={onCancel} disabled={saving} className="min-h-9 rounded-md border border-[#c4cecd] px-3 text-xs font-bold text-[#3f5256] hover:bg-[#eef2f1]">Cancel</button>
      <button type="button" onClick={onSave} disabled={saving} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#7A1F2B] px-3.5 text-xs font-bold text-white hover:bg-[#A52A32] disabled:opacity-60">
        <Check size={14} /> {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

function formatList(value) {
  return Array.isArray(value) && value.length ? value.join(' · ') : '';
}

function AvatarCropDialog({ file, error, saving, onCancel, onSave }) {
  const [source, setSource] = useState('');
  const [imageSize, setImageSize] = useState(null);
  const [viewportSize, setViewportSize] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropError, setCropError] = useState('');
  const viewportRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const observer = new ResizeObserver(([entry]) => setViewportSize(entry.contentRect.width));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const imageScale = imageSize && viewportSize
    ? Math.max(viewportSize / imageSize.width, viewportSize / imageSize.height) * zoom
    : 0;
  const renderedWidth = imageSize ? imageSize.width * imageScale : 0;
  const renderedHeight = imageSize ? imageSize.height * imageScale : 0;

  const clampOffset = (point, scale = imageScale) => {
    if (!imageSize || !viewportSize || !scale) return point;
    const maxX = Math.max(0, (imageSize.width * scale - viewportSize) / 2);
    const maxY = Math.max(0, (imageSize.height * scale - viewportSize) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, point.x)),
      y: Math.max(-maxY, Math.min(maxY, point.y)),
    };
  };

  const updateZoom = (value) => {
    const nextZoom = Number(value);
    setZoom(nextZoom);
    const nextScale = imageSize && viewportSize
      ? Math.max(viewportSize / imageSize.width, viewportSize / imageSize.height) * nextZoom
      : 0;
    setOffset((current) => clampOffset(current, nextScale));
  };

  const saveCrop = async () => {
    if (!imageSize || !viewportSize) return;
    setCropError('');
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const scale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight) * zoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const sourceX = Math.max(0, Math.min(image.naturalWidth - viewportSize / scale, (width - viewportSize) / (2 * scale) - offset.x / scale));
      const sourceY = Math.max(0, Math.min(image.naturalHeight - viewportSize / scale, (height - viewportSize) / (2 * scale) - offset.y / scale));
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare the profile photo crop.');
      context.drawImage(
        image,
        sourceX,
        sourceY,
        viewportSize / scale,
        viewportSize / scale,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not export the cropped image.')), file.type);
      });
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const croppedFile = new File([blob], `profile-photo.${extension}`, { type: file.type });
      const saved = await onSave(croppedFile);
      if (!saved) setCropError('The image could not be uploaded. Please try again.');
    } catch (cropFailure) {
      setCropError(cropFailure.message || 'Could not crop this image. Please try another file.');
    }
  };

  const startDrag = (event) => {
    if (!imageSize || saving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, offset };
  };

  const moveDrag = (event) => {
    if (!dragRef.current) return;
    setOffset(clampOffset({
      x: dragRef.current.offset.x + event.clientX - dragRef.current.x,
      y: dragRef.current.offset.y + event.clientY - dragRef.current.y,
    }));
  };

  const stopDrag = () => { dragRef.current = null; };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#111322]/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title" className="my-auto w-full max-w-[420px] rounded-2xl border border-[#d3dad9] bg-white p-5 shadow-[0_24px_70px_#11132255] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="avatar-crop-title" className="m-0 font-[Bricolage_Grotesque,sans-serif] text-lg font-bold text-[#17262b]">Adjust profile photo</h2>
            <p className="mb-0 mt-1 text-xs text-[#5b6b70]">Drag to reposition, then adjust the zoom.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="grid size-8 shrink-0 place-items-center text-[#5b6b70] hover:bg-[#e6ecea] disabled:opacity-50" aria-label="Cancel photo adjustment"><X size={18} /></button>
        </div>
        <div
          ref={viewportRef}
          className="relative mx-auto aspect-square w-[min(78vw,320px)] touch-none cursor-grab overflow-hidden rounded-2xl bg-[#d9e6e5] active:cursor-grabbing"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          aria-label="Drag image to adjust crop"
        >
          {source && (
            <img
              src={source}
              alt="Profile photo crop preview"
              onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              onError={() => setCropError('Could not read this image. Please choose another one.')}
              draggable="false"
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: renderedWidth,
                height: renderedHeight,
                left: `calc(50% + ${offset.x}px)`,
                top: `calc(50% + ${offset.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 border border-white/80 shadow-[inset_0_0_0_1px_#11132220]" />
        </div>
        <label className="mt-5 grid gap-2 text-xs font-semibold text-[#3f5256]">
          Zoom
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => updateZoom(event.target.value)} className="w-full accent-[#12363f]" />
          <span className="flex justify-between text-[11px] font-normal text-[#6f8083]"><span>Fit</span><span>{Math.round(zoom * 100)}%</span><span>3×</span></span>
        </label>
        {(error || cropError) && <p className="mb-0 mt-3 text-xs font-semibold text-[#b3372f]" role="alert">{cropError || error}</p>}
        <div className="mt-5 flex justify-end gap-2 border-t border-[#dbe2e1] pt-4">
          <button type="button" onClick={onCancel} disabled={saving} className="min-h-9 rounded-md border border-[#c4cecd] px-3 text-xs font-bold text-[#3f5256] hover:bg-[#eef2f1] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={saveCrop} disabled={!imageSize || saving} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#12363f] px-3.5 text-xs font-bold text-white hover:bg-[#0c2a31] disabled:cursor-wait disabled:opacity-60">
            <Check size={14} /> {saving ? 'Uploading…' : 'Use this photo'}
          </button>
        </div>
      </section>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-20 pt-6 sm:px-7 lg:px-8 lg:pt-8" aria-busy="true" aria-label="Loading profile">
      <div className="grid items-start gap-8 lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-12">
        <div className="min-h-[460px] animate-pulse rounded-[22px] bg-[#f1f2f4] p-6 sm:p-7">
          <div className="size-32 rounded-[26px] bg-[#e1e3e7] sm:size-36" />
          <div className="mt-7 h-8 w-3/4 rounded bg-[#e1e3e7]" />
          <div className="mt-5 grid gap-3">
            <div className="h-4 w-4/5 rounded bg-[#e1e3e7]" />
            <div className="h-4 w-full rounded bg-[#e1e3e7]" />
            <div className="h-4 w-5/6 rounded bg-[#e1e3e7]" />
          </div>
          <div className="mt-7 h-20 rounded-xl bg-[#e1e3e7]" />
        </div>
        <div className="min-w-0 animate-pulse">
          <div className="mb-8 flex gap-6 border-b border-[#e5e7eb] pb-3">
            {[20, 16, 28, 16, 24].map((width, index) => <div key={index} className="h-4 rounded bg-[#e1e3e7]" style={{ width: `${width * 4}px` }} />)}
          </div>
          {[0, 1, 2].map((section) => (
            <div key={section} className="border-b border-[#e5e7eb] py-8 first:pt-2">
              <div className="h-7 w-40 rounded bg-[#e1e3e7]" />
              <div className="mt-6 grid gap-3">
                <div className="h-4 w-full rounded bg-[#f1f2f4]" />
                <div className="h-4 w-11/12 rounded bg-[#f1f2f4]" />
                <div className="h-4 w-3/4 rounded bg-[#f1f2f4]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading your profile…</span>
    </main>
  );
}

function ScsProfilePage({ adminLearnerId = '', adminToken = '', logoSrc = '/images/logo.png' }) {
  const isAdminPreview = Boolean(adminLearnerId);
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeSection, setActiveSection] = useState('about');
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const aboutTextRef = useRef(null);
  const personalEditFormRef = useRef(null);
  const [resumeError, setResumeError] = useState('');
  const [resumeMenuOpen, setResumeMenuOpen] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState(null);
  const fileInput = useRef(null);
  const avatarInput = useRef(null);
  const avatarMenuRef = useRef(null);
  const resumeMenuRef = useRef(null);
  const token = isAdminPreview ? adminToken : localStorage.getItem('scs_session_token');
  const name = profile.name || 'Your name';
  const initial = useMemo(() => initials(name), [name]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        let loaded;
        if (isAdminPreview) {
          const response = await fetch(`/api/admin/learners/${encodeURIComponent(adminLearnerId)}/profile`, {
            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Could not load learner profile.');
          loaded = { ...result.learner.profile, name: result.learner.name, identifier: result.learner.identifier, type: result.learner.type, phone: result.learner.phone };
        } else {
          ({ profile: loaded } = await getJson('/api/auth/profile'));
        }
        if (!active) return;
        setProfile({ ...emptyProfile, ...loaded, skills: { ...emptyProfile.skills, ...loaded.skills } });
        setLoadError('');
        if (!isAdminPreview) notifyAvatarChanged();
        if (isAdminPreview) {
          const response = await fetch(`/api/admin/learners/${encodeURIComponent(adminLearnerId)}/avatar`, {
            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
          });
          if (response.status !== 404) {
            if (!response.ok) {
              const result = await response.json();
              throw new Error(result.error || 'Could not load learner profile photo.');
            }
            if (active) setAvatarUrl(URL.createObjectURL(await response.blob()));
          }
        } else if (loaded.avatar?.filename) {
          try {
            const image = await getBlob('/api/auth/profile/avatar');
            if (active) setAvatarUrl(URL.createObjectURL(image));
          } catch (error) {
            if (active) setAvatarError(error.message);
          }
        }
      } catch (error) {
        if (active) setLoadError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [adminLearnerId, adminToken, isAdminPreview]);

  useEffect(() => {
    if (editing !== 'personal' || !personalEditFormRef.current) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const top = personalEditFormRef.current.getBoundingClientRect().top + window.scrollY - 112;
      window.scrollTo({
        top,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editing]);

  useEffect(() => () => {
    if (avatarUrl.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
  }, [avatarUrl]);

  useEffect(() => {
    if (!avatarMenuOpen && !resumeMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!avatarMenuRef.current?.contains(event.target)) setAvatarMenuOpen(false);
      if (!resumeMenuRef.current?.contains(event.target)) setResumeMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setAvatarMenuOpen(false);
        setResumeMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [avatarMenuOpen, resumeMenuOpen]);

  const beginEdit = (section, value) => {
    setEditing(section);
    setDraft(structuredClone(value));
    setSaveError('');
  };

  const cancelEdit = () => {
    setEditing('');
    setDraft(null);
    setSaveError('');
  };

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const saveSection = async (section, data = draft) => {
    const requiredFields = section === 'personal'
      ? sectionFields.personal.filter((field) => field.required)
      : (sectionFields[section] || []).filter((field) => field.required);
    const entries = Array.isArray(data) ? data : [data];
    for (const [index, entry] of entries.entries()) {
      const missingField = requiredFields.find(({ key }) => !String(entry?.[key] || '').trim());
      if (missingField) {
        setSaveError(`${missingField.label} is required${Array.isArray(data) ? ` for entry ${index + 1}` : ''}.`);
        return;
      }
      const dates = parseMonthRange(entry?.dates);
      if (dates?.start && dates.end && dates.end < dates.start) {
        setSaveError(`The end date must be after the start date${Array.isArray(data) ? ` for entry ${index + 1}` : ''}.`);
        return;
      }
      if (dates?.start && !dates.end && !dates.current) {
        setSaveError(`Choose an end date or mark the entry as current${Array.isArray(data) ? ` for entry ${index + 1}` : ''}.`);
        return;
      }
    }
    setSaving(true);
    setSaveError('');
    try {
      const sectionData = Array.isArray(data) ? { [section]: data } : data;
      const result = await patchJson('/api/auth/profile', { section, data: sectionData });
      setProfile((current) => ({ ...current, ...result.profile, skills: { ...current.skills, ...result.profile.skills } }));
      if (section === 'personal' && data.name) {
        const user = { ...(JSON.parse(localStorage.getItem('scs_user') || '{}')), name: data.name };
        localStorage.setItem('scs_user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('scs-auth-state', { detail: user }));
      }
      setEditing('');
      setDraft(null);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const jumpToSection = (event, id) => {
    event.preventDefault();
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const toggleAboutExpanded = () => {
    const element = aboutTextRef.current;
    if (!element) return;

    const nextExpanded = !aboutExpanded;
    element.style.height = `${element.getBoundingClientRect().height}px`;
    setAboutExpanded(nextExpanded);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.style.height = nextExpanded ? 'auto' : '7rem';
      return;
    }
    window.requestAnimationFrame(() => {
      element.style.height = nextExpanded ? `${element.scrollHeight}px` : '7rem';
    });
  };

  const finishAboutHeightTransition = (event) => {
    if (event.propertyName === 'height') {
      event.currentTarget.style.height = aboutExpanded ? 'auto' : '7rem';
    }
  };

  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      setResumeError('Choose a PDF, DOC, or DOCX file under 5 MB.');
      event.target.value = '';
      return;
    }
    setResumeError('');
    setSaving(true);
    try {
      const result = await uploadFile('/api/auth/profile/resume', 'resume', file);
      setProfile((current) => ({ ...current, resume: result.resume }));
    } catch (error) {
      setResumeError(error.message);
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const downloadResume = async () => {
    setResumeError('');
    setResumeBusy(true);
    try {
      let file;
      if (isAdminPreview) {
        const response = await fetch(`/api/admin/learners/${encodeURIComponent(adminLearnerId)}/resume`, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
        if (response.status === 401) window.dispatchEvent(new Event('admin-session-expired'));
        if (!response.ok) {
          let message = `Request failed with status ${response.status}.`;
          try {
            const result = await response.json();
            message = result.error || message;
          } catch (error) {
            if (!(error instanceof SyntaxError)) throw error;
          }
          throw new Error(message);
        }
        file = await response.blob();
      } else {
        file = await getBlob('/api/auth/profile/resume');
      }
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = profile.resume?.filename || 'resume';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setResumeError(error.message);
    } finally {
      setResumeBusy(false);
    }
  };

  const removeResume = async () => {
    setResumeError('');
    setResumeBusy(true);
    try {
      await deleteJson('/api/auth/profile/resume');
      setProfile((current) => ({ ...current, resume: null }));
      setResumeMenuOpen(false);
    } catch (error) {
      setResumeError(error.message);
    } finally {
      setResumeBusy(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
      setAvatarError('Choose a JPEG, PNG, or WebP image smaller than 2 MB.');
      event.target.value = '';
      return;
    }
    setAvatarError('');
    setAvatarCropFile(file);
    event.target.value = '';
  };

  const saveCroppedAvatar = async (file) => {
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const result = await uploadFile('/api/auth/profile/avatar', 'avatar', file);
      setProfile((current) => ({ ...current, avatar: result.avatar }));
      setAvatarUrl(URL.createObjectURL(file));
      notifyAvatarChanged();
      setAvatarMenuOpen(false);
      setAvatarCropFile(null);
      return true;
    } catch (error) {
      setAvatarError(error.message);
      return false;
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarError('');
    setAvatarUploading(true);
    try {
      await deleteJson('/api/auth/profile/avatar');
      setProfile((current) => ({ ...current, avatar: null }));
      setAvatarUrl('');
      notifyAvatarChanged();
      setAvatarMenuOpen(false);
    } catch (error) {
      setAvatarError(error.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeEntry = (index) => setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const updateEntry = (index, key, value) => setDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const createEmptyEntry = (fields) => Object.fromEntries(
    fields.map(({ key, type }) => [key, type === 'tags' || type === 'list' ? [] : '']),
  );

  const editCollection = (section, title, entries, fields, emptyText, layout = 'timeline') => {
    const isEditing = editing === section;
    const startEditing = () => beginEdit(section, [...entries, createEmptyEntry(fields)]);
    const dateText = (entry) => (entry.dates ? formatMonthRange(entry.dates) : formatMonth(entry.date));
    const subtitle = (entry) => `${entry.company || entry.issuer || entry.degree || entry.field || ''}${entry.type ? ` · ${entry.type}` : ''}`;
    const entryDetails = (entry) => (
      <>
        {dateText(entry) && <p className="m-0 text-xs font-semibold text-[#1d6b73]">{dateText(entry)}</p>}
        <h3 className="m-0 mt-1 font-[Bricolage_Grotesque,sans-serif] text-lg font-semibold leading-snug text-[#17262b]">{entry.title || entry.institution || title}</h3>
        {subtitle(entry) && <p className="mb-0 mt-1 text-sm text-[#4b5d62]">{subtitle(entry)}</p>}
        {entry.location && <p className="mb-0 mt-2 inline-flex items-center gap-1 text-xs text-[#5b6b70]"><MapPin size={13} /> {entry.location}</p>}
        {Array.isArray(entry.skills) && entry.skills.length > 0 && (
          <div className="mt-3">
            <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-[#5B21B6]">Skills</p>
            <ul className="m-0 flex flex-wrap gap-2 p-0" aria-label="Skills used">
              {entry.skills.map((skill, index) => (
                <li key={`${skill}-${index}`} className="list-none rounded-full border border-[#D8B4FE] bg-[#F3E8FF] px-3 py-1 text-xs font-semibold text-[#5B21B6]">
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        )}
        {formatList(entry.points) && (
          <ul className="mb-0 mt-4 grid list-none gap-2 p-0 text-sm leading-6 text-[#3f5256]">
            {entry.points.map((point) => <li key={point} className="relative pl-4 before:absolute before:left-0 before:top-[11px] before:size-1.5 before:rounded-[2px] before:bg-[#f0b44c]">{point}</li>)}
          </ul>
        )}
        {entry.credential && <p className="mb-0 mt-2 break-all text-xs text-[#5b6b70]">{entry.credential}</p>}
      </>
    );
    return (
      <Section
        id={section === 'workExperience' ? 'experience' : section}
        title={title}
        action={isAdminPreview ? null : ['workExperience', 'education'].includes(section) && !isEditing ? (
          <ProfileActionButton icon={Plus} onClick={startEditing}>
            {section === 'workExperience' ? 'Add experience' : 'Add education'}
          </ProfileActionButton>
        ) : (
          <EditButton editing={isEditing} onClick={() => isEditing ? cancelEdit() : startEditing()} />
        )}
      >
        {isEditing ? (
          <>
            <div className="grid gap-4">
              {draft.map((entry, index) => (
                <div key={`${section}-${index}`} className="rounded-xl border border-[#d3dad9] bg-white p-4 sm:p-5">
                  <div className="mb-3 flex justify-end">
                    <button type="button" onClick={() => removeEntry(index)} className="inline-flex items-center gap-1 text-xs font-bold text-[#b3372f]"><X size={13} /> Remove</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map((field) => <Field key={field.key} definition={field} value={entry[field.key]} onChange={(key, value) => updateEntry(index, key, value)} />)}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDraft((current) => [...current, createEmptyEntry(fields)])} className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#c4cecd] bg-white px-3 text-xs font-bold text-[#12363f] hover:bg-[#e1eeed]"><Plus size={14} /> Add another {title.toLowerCase()}</button>
            <SaveActions saving={saving} onSave={() => saveSection(section)} onCancel={cancelEdit} />
          </>
        ) : entries.length ? (
          layout === 'tiles' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {entries.map((entry, index) => (
                <article key={`${section}-${index}`} className="min-w-0 rounded-xl border border-[#d3dad9] bg-white p-5">
                  {entryDetails(entry)}
                </article>
              ))}
            </div>
          ) : (
            <ol className="relative m-0 grid list-none gap-10 p-0 before:absolute before:bottom-1 before:left-[5px] before:top-2 before:w-px before:bg-[#b9c7c6]">
              {entries.map((entry, index) => (
                <li key={`${section}-${index}`} className="relative min-w-0 pl-9">
                  <span className="absolute left-0 top-[5px] size-[11px] rounded-full border-2 border-[#12363f] bg-[#edf0ee]" aria-hidden="true" />
                  {entryDetails(entry)}
                </li>
              ))}
            </ol>
          )
        ) : <p className="m-0 text-sm text-[#5b6b70]">{emptyText}</p>}
      </Section>
    );
  };

  const aboutLong = profile.about.length > 200;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FFFFFF] font-['DM_Sans',_sans-serif] text-[#17262b]">
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=DM+Sans:wght@400;500;600;700&display=swap');"}</style>
      <Navbar logoSrc={logoSrc} isHomePageOverride={isAdminPreview ? false : undefined} />
      {loading ? <ProfilePageSkeleton /> : (
      <main className="mx-auto max-w-[1240px] px-4 pb-20 pt-6 sm:px-7 lg:px-8 lg:pt-8">
        {loadError && <p className="mb-4 rounded-lg border border-[#e8b9b4] bg-[#fdf1ef] p-3 text-sm text-[#8f2d26]" role="alert">{loadError}</p>}
        {!token && !isAdminPreview && <p className="mb-4 rounded-lg border border-[#ecd29b] bg-[#fdf6e4] p-3 text-sm text-[#7a5614]">Sign in to load and save your profile.</p>}

        <div className="grid items-start gap-8 lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-12">
          <aside className="min-w-0 lg:self-start">
            <div
              className="relative rounded-[22px] border border-white/15 p-6 text-white sm:p-7"
              style={{
                background: 'linear-gradient(135deg, #4f1820 0%, #7A1F2B 30%, #8e292c 58%, #80321f 82%, #642619 100%)',
              }}
            >
              {editing !== 'personal' && !isAdminPreview && (
                <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
                  <button
                    type="button"
                    onClick={() => beginEdit('personal', Object.fromEntries(sectionFields.personal.map(({ key }) => [key, profile[key] || ''])))}
                    className="grid size-9 place-items-center rounded-full border border-white/30 text-white transition-colors hover:border-[#E97832] hover:bg-[#E97832] hover:text-[#4f1820] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E97832]"
                    aria-label="Edit personal profile"
                    title="Edit personal profile"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
              <div className="relative size-32 sm:size-36">
                <div className="grid size-full place-items-center overflow-hidden rounded-[26px] bg-[#641a25] font-[Bricolage_Grotesque,sans-serif] text-4xl font-bold text-[#E97832]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`${name}'s profile`} className="size-full object-cover" />
                  ) : initials(name)}
                </div>
                {!isAdminPreview && <div ref={avatarMenuRef} className="absolute -bottom-2 -right-2 z-20">
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen((open) => !open)}
                    disabled={avatarUploading}
                    className="grid size-9 place-items-center rounded-full border-2 border-[#7A1F2B] bg-[#E97832] text-[#4f1820] transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-60"
                    aria-label="Profile photo options"
                    aria-haspopup="menu"
                    aria-expanded={avatarMenuOpen}
                    title="Profile photo options"
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  {avatarMenuOpen && (
                    <div role="menu" className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg bg-white py-1 text-[#17262b] shadow-[0_14px_34px_#00000040]">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          avatarInput.current?.click();
                        }}
                        className="flex min-h-10 w-full items-center gap-2.5 px-3 text-left text-xs font-semibold transition hover:bg-[#e6efee]"
                      >
                        <Upload size={15} aria-hidden="true" />
                        {avatarUrl ? 'Upload new image' : 'Upload image'}
                      </button>
                      {(avatarUrl || profile.avatar) && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={removeAvatar}
                          disabled={avatarUploading}
                          className="flex min-h-10 w-full items-center gap-2.5 border-t border-[#dbe2e1] px-3 text-left text-xs font-semibold text-[#b3372f] transition hover:bg-[#fdf1ef] disabled:opacity-60"
                        >
                          <X size={15} aria-hidden="true" />
                          Remove image
                        </button>
                      )}
                      <p className="m-0 border-t border-[#dbe2e1] px-3 py-2 text-[10px] font-medium text-[#6f8083]">JPEG, PNG, or WebP · Max 2 MB</p>
                    </div>
                  )}
                </div>}
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadAvatar}
                  className="sr-only"
                  aria-label="Choose profile photo"
                />
              </div>
              {avatarError && <p className="mb-0 mt-4 text-xs font-semibold text-[#ffb4a8]" role="alert">{avatarError}</p>}

              {editing !== 'personal' && (
                <>
                  <div className="mt-6">
                    <h1 title={name} className="m-0 flex min-w-0 items-center gap-2 whitespace-nowrap font-[Bricolage_Grotesque,sans-serif] text-[clamp(18px,2.2vw,28px)] font-bold leading-[1.1] tracking-[-0.02em]">
                      <span className="truncate">{name}</span>
                      {profile.name && <BadgeCheck size={20} className="fill-[#E97832] text-[#7A1F2B]" aria-label="Verified learner" />}
                    </h1>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm leading-6 text-white/80">
                    {(profile.headline || profile.jobTitle || profile.companyName) && (
                      <p className="m-0 font-medium text-white">
                        {profile.headline}
                        {profile.headline && profile.jobTitle && <span className="px-2 text-white/40">|</span>}
                        {profile.jobTitle}
                      </p>
                    )}
                    {profile.companyName && <p className="m-0"><span className="font-semibold text-white">Company:</span> {profile.companyName}</p>}
                    {profile.experienceYears && (
                      <p className="m-0">
                        <span className="font-semibold text-white">Total years of work experience:</span>{' '}
                        {/\byears?\b/i.test(String(profile.experienceYears)) ? profile.experienceYears : `${profile.experienceYears}+ years`}
                      </p>
                    )}
                    {profile.specialization && <p className="m-0"><span className="font-semibold text-white">Specialization:</span> {profile.specialization}</p>}
                    {profile.location && <p className="m-0 inline-flex items-center gap-1.5"><MapPin size={14} className="shrink-0 text-[#E97832]" /> {profile.location}</p>}
                    {profile.applauds > 0 && <p className="m-0 inline-flex items-center gap-1.5 font-semibold text-[#E97832]"><Hand size={15} /> {profile.applauds} Applauds</p>}
                  </div>

                  <div className="mt-6 rounded-xl bg-white/[0.08] p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#E97832]">
                        <FileText size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-xs font-bold text-white">{profile.resume ? 'Resume' : isAdminPreview ? 'No resume uploaded' : 'Upload your resume'}</p>
                        <p className="m-0 mt-0.5 truncate text-[11px] text-white/65">
                          {profile.resume
                            ? `${profile.resume.filename} · ${(profile.resume.size / 1024 / 1024).toFixed(2)} MB`
                            : 'PDF, DOC, or DOCX · Up to 5 MB'}
                        </p>
                      </div>
                      {profile.resume ? (
                        <>
                          {!isAdminPreview && <div ref={resumeMenuRef} className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setResumeMenuOpen((open) => !open)}
                              disabled={resumeBusy}
                              className="grid size-8 place-items-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                              aria-label="Resume options"
                              aria-haspopup="menu"
                              aria-expanded={resumeMenuOpen}
                              title="Resume options"
                            >
                              <Pencil size={15} aria-hidden="true" />
                            </button>
                            {resumeMenuOpen && (
                              <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-lg bg-white py-1 text-[#17262b] shadow-[0_14px_34px_#00000040]">
                                <button type="button" role="menuitem" onClick={() => { setResumeMenuOpen(false); fileInput.current?.click(); }} className="flex min-h-9 w-full items-center gap-2 px-3 text-left text-xs font-semibold hover:bg-[#e6efee]">
                                  <Upload size={14} aria-hidden="true" /> Update
                                </button>
                                <button type="button" role="menuitem" onClick={removeResume} disabled={resumeBusy} className="flex min-h-9 w-full items-center gap-2 border-t border-[#dbe2e1] px-3 text-left text-xs font-semibold text-[#b3372f] hover:bg-[#fdf1ef] disabled:opacity-50">
                                  <X size={14} aria-hidden="true" /> Delete
                                </button>
                              </div>
                            )}
                          </div>}
                          <button
                            type="button"
                            onClick={downloadResume}
                            disabled={resumeBusy}
                            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#E97832] px-2.5 text-xs font-bold text-[#4f1820] transition-colors hover:bg-[#f18a49] disabled:opacity-50"
                            aria-label="Download resume"
                            title="Download resume"
                          >
                            <ArrowDownToLine size={16} aria-hidden="true" />
                            <span>Download</span>
                          </button>
                        </>
                      ) : isAdminPreview ? null : (
                        <button
                          type="button"
                          onClick={() => fileInput.current?.click()}
                          disabled={saving}
                          className="grid size-8 shrink-0 place-items-center rounded-md bg-[#E97832] text-[#4f1820] transition-colors hover:bg-[#f18a49] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
                          aria-label="Upload resume"
                          title="Upload resume"
                        >
                          <Upload size={15} aria-hidden="true" />
                        </button>
                      )}
                      <input ref={fileInput} className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={uploadResume} />
                    </div>
                    {resumeError && <p className="mb-0 mt-2 text-xs font-semibold text-[#ffb4a8]" role="alert">{resumeError}</p>}
                  </div>
                </>
              )}

            </div>
          </aside>

          <div className="min-w-0">
            <nav className="sticky top-0 z-20 -mx-1 mb-8 flex gap-1 overflow-x-auto bg-white px-1 backdrop-blur" aria-label="Profile sections">
              {sectionLinks.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(event) => jumpToSection(event, id)}
                  className={`relative whitespace-nowrap px-4 py-3 text-sm no-underline transition-colors ${activeSection === id ? 'font-bold text-[#a52a32]' : 'font-medium text-[#5b6b70] hover:text-[#17262b]'}`}
                >
                  {label}
                  {activeSection === id && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5"
                      style={{ background: navbarGradient }}
                    />
                  )}
                </a>
              ))}
            </nav>

            {editing === 'personal' && (
              <div ref={personalEditFormRef} className="mb-8 scroll-mt-28 rounded-2xl border border-[#d3dad9] bg-white p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">{sectionFields.personal.map((field) => <Field key={field.key} definition={field} value={draft[field.key]} onChange={updateDraft} />)}</div>
                <SaveActions saving={saving} onSave={() => saveSection('personal')} onCancel={cancelEdit} />
              </div>
            )}

            {saveError && <p className="mb-6 rounded-lg border border-[#e8b9b4] bg-[#fdf1ef] p-3 text-sm text-[#8f2d26]" role="alert">{saveError}</p>}
              <div>
                <Section
                  id="about"
                  title="About Me"
                  action={<EditButton hidden={isAdminPreview} editing={editing === 'about'} onClick={() => editing === 'about' ? cancelEdit() : beginEdit('about', { about: profile.about })} />}
                >
                  {editing === 'about' ? (
                    <>
                      <Field definition={sectionFields.about[0]} value={draft.about} onChange={updateDraft} />
                      <SaveActions saving={saving} onSave={() => saveSection('about', { about: draft.about })} onCancel={cancelEdit} />
                    </>
                  ) : (
                    <>
                      <p
                        ref={aboutTextRef}
                        id="about-description"
                        onTransitionEnd={finishAboutHeightTransition}
                        className="m-0 h-28 max-w-[68ch] overflow-hidden whitespace-pre-wrap text-[15px] leading-7 text-[#3f5256] transition-[height] duration-500 ease-in-out motion-reduce:transition-none"
                      >
                        {profile.about || <span className="text-[#5b6b70]">Add a short introduction about yourself.</span>}
                      </p>
                      {aboutLong && <button type="button" onClick={toggleAboutExpanded} aria-expanded={aboutExpanded} aria-controls="about-description" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#1d6b73] hover:text-[#12363f]">{aboutExpanded ? 'Read Less' : 'Read More'} <ChevronDown size={15} className={`transition-transform duration-300 motion-reduce:transition-none ${aboutExpanded ? 'rotate-180' : ''}`} /></button>}
                    </>
                  )}
                </Section>

                <Section
                  id="languages"
                  title="Languages Spoken"
                  action={<EditButton hidden={isAdminPreview} editing={editing === 'languages'} onClick={() => editing === 'languages' ? cancelEdit() : beginEdit('languages', { languages: profile.languages })} />}
                >
                  {editing === 'languages' ? (
                    <>
                      <Field definition={sectionFields.about[1]} value={draft.languages} onChange={updateDraft} />
                      <SaveActions saving={saving} onSave={() => saveSection('about', { languages: draft.languages })} onCancel={cancelEdit} />
                    </>
                  ) : (
                    <p className="m-0 text-[15px] text-[#3f5256]">{Array.isArray(profile.languages) && profile.languages.length ? profile.languages.join(', ') : <span className="text-[#5b6b70]">No languages added yet.</span>}</p>
                  )}
                </Section>

                <Section
                  id="skills"
                  title="Skills"
                  action={<EditButton hidden={isAdminPreview} editing={editing === 'skills'} onClick={() => editing === 'skills' ? cancelEdit() : beginEdit('skills', profile.skills)} />}
                >
                  {editing === 'skills' ? (
                    <><div className="grid gap-4">{sectionFields.skills.map((field) => <Field key={field.key} definition={field} value={draft[field.key]} onChange={updateDraft} />)}</div><SaveActions saving={saving} onSave={() => saveSection('skills', { skills: draft })} onCancel={cancelEdit} /></>
                  ) : Object.entries(profile.skills).some(([, entries]) => entries.length) ? (
                    <div className="grid gap-6">
                      {Object.entries(profile.skills).map(([level, entries]) => entries.length > 0 && (
                        <div key={level}>
                          <div className="mb-3 flex items-center gap-2.5">
                            <span className="flex gap-1" aria-hidden="true">
                              {[1, 2, 3].map((step) => <span key={step} className={`size-2 rounded-full ${step <= (levelRank[level] || 1) ? '' : 'bg-[#e2e4e7]'}`} style={step <= (levelRank[level] || 1) ? { backgroundColor: levelAccent[level] || levelAccent.Beginner } : undefined} />)}
                            </span>
                            <h3 className="m-0 text-sm font-semibold text-[#17262b]">{level}</h3>
                          </div>
                          <div className="flex min-w-0 flex-wrap gap-2">
                            {entries.map((skill) => <span key={skill} className={`rounded-md px-3 py-1.5 text-[13px] font-medium ${levelChip[level] || levelChip.Beginner}`}>{skill}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="m-0 text-sm text-[#5b6b70]">Add your skills and proficiency levels.</p>}
                </Section>

                {editCollection('workExperience', 'Work Experience', profile.workExperience, sectionFields.workExperience, 'No work experience added yet.')}
                {editCollection('education', 'Education', profile.education, sectionFields.education, 'No education added yet.')}
                {editCollection('certifications', 'Certifications', profile.certifications, sectionFields.certifications, 'No certifications added yet.', 'tiles')}

                <Section
                  id="badges"
                  title="Badges"
                  action={<EditButton hidden={isAdminPreview} editing={editing === 'badges'} onClick={() => editing === 'badges' ? cancelEdit() : beginEdit('badges', { badges: profile.badges })} />}
                >
                  {editing === 'badges' ? (
                    <><Field definition={{ key: 'badges', label: 'Badges (one per line)', list: true }} value={draft.badges} onChange={updateDraft} /><SaveActions saving={saving} onSave={() => saveSection('badges')} onCancel={cancelEdit} /></>
                  ) : profile.badges.length ? <ul className="m-0 grid list-none gap-2.5 p-0">{profile.badges.map((badge) => <li key={badge} className="flex items-center gap-2.5 text-[15px] text-[#3f5256]"><BadgeCheck size={18} className="shrink-0 text-[#1d6b73]" />{badge}</li>)}</ul> : <p className="m-0 text-sm text-[#5b6b70]">No badges added yet.</p>}
                </Section>

                <Section
                  id="interests"
                  title="Interests"
                  action={<EditButton hidden={isAdminPreview} editing={editing === 'interests'} onClick={() => editing === 'interests' ? cancelEdit() : beginEdit('interests', { interests: profile.interests })} />}
                >
                  {editing === 'interests' ? (
                    <><Field definition={{ key: 'interests', label: 'Interests (one per line)', list: true }} value={draft.interests} onChange={updateDraft} /><SaveActions saving={saving} onSave={() => saveSection('interests')} onCancel={cancelEdit} /></>
                  ) : profile.interests.length ? <div className="flex flex-wrap gap-2">{profile.interests.map((interest) => <span key={interest} className="rounded-full border border-[#c4cecd] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#3f5256]">{interest}</span>)}</div> : <p className="m-0 text-sm text-[#5b6b70]">No interests added yet.</p>}
                </Section>
              </div>
          </div>
        </div>
      </main>
      )}
      {avatarCropFile && (
        <AvatarCropDialog
          file={avatarCropFile}
          error={avatarError}
          saving={avatarUploading}
          onCancel={() => {
            if (!avatarUploading) {
              setAvatarCropFile(null);
              setAvatarError('');
            }
          }}
          onSave={saveCroppedAvatar}
        />
      )}
      <Footer logoSrc={logoSrc} />
    </div>
  );
}

export default ScsProfilePage;