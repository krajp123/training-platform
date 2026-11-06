import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Check, ChevronDown, FileText,
  GraduationCap, Hand, Heart, Languages, MapPin, Pencil, Plus, ShieldCheck,
  Sparkles, Upload, UserRound, X,
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

function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e9edf3] px-5 py-4 sm:px-6">
      <h2 className="flex items-center gap-2.5 font-[Manrope] text-base font-bold text-[#172338]">
        <Icon size={18} className="text-[#5945c7]" aria-hidden="true" />
        {children}
      </h2>
      {action}
    </div>
  );
}

function ProfileCard({ icon: Icon, title, action, children }) {
  return (
    <section className="overflow-hidden border border-[#e2e7ef] bg-white shadow-[0_8px_24px_#19294708]">
      <SectionTitle icon={Icon} action={action}>{title}</SectionTitle>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function EditButton({ editing, onClick }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-8 items-center gap-1.5 border border-[#e0e4ed] px-2.5 text-xs font-bold text-[#5945c7] transition-colors hover:border-[#5945c7] hover:bg-[#f5f3ff]">
      {editing ? <X size={13} /> : <Pencil size={13} />}
      {editing ? 'Cancel' : 'Edit'}
    </button>
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
            <li key={`${tag}-${index}`} className="inline-flex items-center gap-1.5 border border-[#e1dbff] bg-[#f5f3ff] py-1 pl-2.5 pr-1 text-xs font-semibold text-[#5140ad]">
              {tag}
              <button
                type="button"
                onClick={() => onChange(definition.key, tags.filter((_, itemIndex) => itemIndex !== index))}
                className="grid size-5 place-items-center text-[#7568b7] hover:bg-[#e9e4ff] hover:text-[#bd4654]"
                aria-label={`Remove ${tag}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        className="w-full border border-[#dce2ec] bg-white px-3 py-2.5 text-sm text-[#27354b] outline-none transition placeholder:text-[#9aa4b4] focus:border-[#7664d8] focus:ring-2 focus:ring-[#7664d8]/10"
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
      <p className="m-0 text-[11px] font-normal text-[#8993a4]">Press Enter or comma to add each item.</p>
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
  const inputClass = 'min-w-0 flex-1 border border-[#dce2ec] bg-white px-3 py-2.5 text-sm text-[#27354b] outline-none focus:border-[#7664d8] focus:ring-2 focus:ring-[#7664d8]/10';

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
        <span className="text-xs text-[#8993a4]">to</span>
        <input
          type="month"
          className={inputClass}
          value={range?.end || ''}
          disabled={range?.current}
          onChange={(event) => updateRange(range?.start || '', event.target.value, false)}
          aria-label={`${definition.label} end`}
        />
      </div>
      <label className="inline-flex w-fit items-center gap-2 text-xs font-medium text-[#68758a]">
        <input
          type="checkbox"
          checked={range?.current || false}
          onChange={(event) => updateRange(range?.start || '', '', event.target.checked)}
          className="size-4 accent-[#5945c7]"
        />
        {definition.currentLabel || 'Currently working here'}
      </label>
      <p className="m-0 text-[11px] font-normal text-[#8993a4]">Choose a start month and end month, or mark it as current.</p>
    </div>
  );
}

function Field({ definition, value, onChange }) {
  const content = definition.type === 'list'
    ? (Array.isArray(value) ? value : []).join('\n')
    : value ?? '';
  const className = 'w-full border border-[#dce2ec] bg-white px-3 py-2.5 text-sm text-[#27354b] outline-none transition placeholder:text-[#9aa4b4] focus:border-[#7664d8] focus:ring-2 focus:ring-[#7664d8]/10';
  return (
    <div className="grid gap-1.5 text-xs font-bold text-[#536078]">
      <span>{definition.label}{definition.required && <span className="ml-1 text-[#bd4654]" aria-hidden="true">*</span>}</span>
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
      {definition.hint && <span className="text-[11px] font-normal text-[#8993a4]">{definition.hint}</span>}
    </div>
  );
}

function SaveActions({ saving, onSave, onCancel }) {
  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-[#edf0f4] pt-4">
      <button type="button" onClick={onCancel} disabled={saving} className="min-h-9 border border-[#dce2ec] px-3 text-xs font-bold text-[#5b6679] hover:bg-[#f7f8fb]">Cancel</button>
      <button type="button" onClick={onSave} disabled={saving} className="inline-flex min-h-9 items-center gap-1.5 bg-[#5945c7] px-3.5 text-xs font-bold text-white hover:bg-[#4634ab] disabled:opacity-60">
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
      <section role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title" className="my-auto w-full max-w-[420px] border border-[#e2e7ef] bg-white p-5 shadow-[0_24px_70px_#11132255] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="avatar-crop-title" className="m-0 font-[Manrope] text-lg font-bold text-[#172338]">Adjust profile photo</h2>
            <p className="mb-0 mt-1 text-xs text-[#778297]">Drag to reposition, then adjust the zoom.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="grid size-8 shrink-0 place-items-center text-[#68758a] hover:bg-[#f3f4f8] disabled:opacity-50" aria-label="Cancel photo adjustment"><X size={18} /></button>
        </div>
        <div
          ref={viewportRef}
          className="relative mx-auto aspect-square w-[min(78vw,320px)] touch-none cursor-grab overflow-hidden bg-[#ece9ff] active:cursor-grabbing"
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
        <label className="mt-5 grid gap-2 text-xs font-semibold text-[#536078]">
          Zoom
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => updateZoom(event.target.value)} className="w-full accent-[#5945c7]" />
          <span className="flex justify-between text-[11px] font-normal text-[#8993a4]"><span>Fit</span><span>{Math.round(zoom * 100)}%</span><span>3×</span></span>
        </label>
        {(error || cropError) && <p className="mb-0 mt-3 text-xs font-semibold text-[#bd4654]" role="alert">{cropError || error}</p>}
        <div className="mt-5 flex justify-end gap-2 border-t border-[#edf0f4] pt-4">
          <button type="button" onClick={onCancel} disabled={saving} className="min-h-9 border border-[#dce2ec] px-3 text-xs font-bold text-[#5b6679] hover:bg-[#f7f8fb] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={saveCrop} disabled={!imageSize || saving} className="inline-flex min-h-9 items-center gap-2 bg-[#5945c7] px-3.5 text-xs font-bold text-white hover:bg-[#4634ab] disabled:cursor-wait disabled:opacity-60">
            <Check size={14} /> {saving ? 'Uploading…' : 'Use this photo'}
          </button>
        </div>
      </section>
    </div>
  );
}

function ScsProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeSection, setActiveSection] = useState('about');
  const [aboutExpanded, setAboutExpanded] = useState(false);
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
  const token = localStorage.getItem('scs_session_token');
  const name = profile.name || 'Your name';
  const initial = useMemo(() => initials(name), [name]);

  useEffect(() => {
    let active = true;
    getJson('/api/auth/profile')
      .then(({ profile: loaded }) => {
        if (active) {
          setProfile({ ...emptyProfile, ...loaded, skills: { ...emptyProfile.skills, ...loaded.skills } });
          setLoadError('');
          notifyAvatarChanged();
          if (loaded.avatar?.filename) {
            getBlob('/api/auth/profile/avatar')
              .then((image) => {
                if (active) setAvatarUrl(URL.createObjectURL(image));
              })
              .catch((error) => {
                if (active) setAvatarError(error.message);
              });
          }
        }
      })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

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
      const file = await getBlob('/api/auth/profile/resume');
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

  const editCollection = (section, icon, title, entries, fields, emptyText) => {
    const isEditing = editing === section;
    const startEditing = () => beginEdit(
      section,
      section === 'workExperience' ? [...entries, createEmptyEntry(fields)] : entries,
    );
    return (
      <section id={section === 'workExperience' ? 'experience' : section} className="scroll-mt-24">
        <ProfileCard
          icon={icon}
          title={title}
          action={['workExperience', 'education'].includes(section) && !isEditing ? (
            <button type="button" onClick={startEditing} className="inline-flex min-h-8 items-center gap-1.5 border border-[#e0e4ed] px-2.5 text-xs font-bold text-[#5945c7] transition-colors hover:border-[#5945c7] hover:bg-[#f5f3ff]">
              <Plus size={13} /> {section === 'workExperience' ? 'Add experience' : 'Add education'}
            </button>
          ) : (
            <EditButton editing={isEditing} onClick={() => isEditing ? cancelEdit() : startEditing()} />
          )}
        >
          {isEditing ? (
            <>
              <div className="grid gap-4">
                {draft.map((entry, index) => (
                  <div key={`${section}-${index}`} className="border border-[#e5e9f0] p-4">
                    <div className="mb-3 flex justify-end">
                      <button type="button" onClick={() => removeEntry(index)} className="inline-flex items-center gap-1 text-xs font-bold text-[#bd4654]"><X size={13} /> Remove</button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {fields.map((field) => <Field key={field.key} definition={field} value={entry[field.key]} onChange={(key, value) => updateEntry(index, key, value)} />)}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setDraft((current) => [...current, createEmptyEntry(fields)])} className="mt-3 inline-flex min-h-9 items-center gap-1.5 border border-[#dce2ec] px-3 text-xs font-bold text-[#5945c7] hover:bg-[#f5f3ff]"><Plus size={14} /> Add {title.toLowerCase()}</button>
              <SaveActions saving={saving} onSave={() => saveSection(section)} onCancel={cancelEdit} />
            </>
          ) : entries.length ? (
            <div className="divide-y divide-[#e9edf3]">
              {entries.map((entry, index) => (
                <article key={`${section}-${index}`} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <h3 className="m-0 text-sm font-bold text-[#25334a]">{entry.title || entry.institution || title}</h3>
                      <p className="mb-0 mt-1 text-sm text-[#657188]">{entry.company || entry.issuer || entry.degree || entry.field || ''}{entry.type ? ` · ${entry.type}` : ''}</p>
                    </div>
                    <p className="m-0 whitespace-nowrap pt-0.5 text-xs font-semibold text-[#66738a]">{entry.dates ? formatMonthRange(entry.dates) : formatMonth(entry.date)}</p>
                  </div>
                  {entry.location && <p className="mb-0 mt-2 inline-flex items-center gap-1 text-xs text-[#66738a]"><MapPin size={13} /> {entry.location}</p>}
                  {formatList(entry.skills) && <p className="mb-0 mt-3 text-xs text-[#5945c7]"><strong>Skills:</strong> {formatList(entry.skills)}</p>}
                  {formatList(entry.points) && <ul className="mb-0 mt-3 list-inside list-disc space-y-1 text-[13px] leading-5 text-[#56637a]">{entry.points.map((point) => <li key={point}>{point}</li>)}</ul>}
                  {entry.credential && <p className="mb-0 mt-2 break-all text-xs text-[#66738a]">{entry.credential}</p>}
                </article>
              ))}
            </div>
          ) : <p className="m-0 text-sm text-[#778297]">{emptyText}</p>}
        </ProfileCard>
      </section>
    );
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f7fb] font-['DM_Sans',_sans-serif] text-[#26334a]">
      <div className="sticky top-0 z-50 h-[72px] bg-[#10101b] max-[720px]:h-[62px]">
        <Navbar />
      </div>
      <main className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-7 lg:px-8">
        {loadError && <p className="mb-4 border border-[#f1c8cc] bg-[#fff4f4] p-3 text-sm text-[#a23340]" role="alert">{loadError}</p>}
        {!token && <p className="mb-4 border border-[#f1d8a8] bg-[#fff9eb] p-3 text-sm text-[#805a1b]">Sign in to load and save your profile.</p>}

        <section className="relative">
          <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-24 w-screen -translate-x-1/2 bg-[linear-gradient(115deg,#5144b8_0%,#3f79c9_48%,#33b8ae_100%)] sm:h-28" />
          <div className="relative z-10 grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7">
            <div className="min-w-0 pt-8 sm:pt-10">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                <div className="relative size-24 shrink-0 sm:size-28">
                  <div className="grid size-full place-items-center overflow-hidden border-4 border-white bg-[#ece9ff] font-[Manrope] text-3xl font-extrabold text-[#5b47c9] shadow-sm">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`${name}'s profile`} className="size-full object-cover" />
                    ) : initials(name)}
                  </div>
                  <div ref={avatarMenuRef} className="absolute bottom-2 right-2 z-20">
                    <button
                      type="button"
                      onClick={() => setAvatarMenuOpen((open) => !open)}
                      disabled={avatarUploading}
                      className="grid size-8 place-items-center rounded-full border border-[#e1e6ef] bg-white/95 text-[#5945c7] shadow-md transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
                      aria-label="Profile photo options"
                      aria-haspopup="menu"
                      aria-expanded={avatarMenuOpen}
                      title="Profile photo options"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    {avatarMenuOpen && (
                      <div role="menu" className="absolute right-0 top-full mt-2 w-44 overflow-hidden border border-[#e2e7ef] bg-white py-1 shadow-[0_12px_30px_#19294720]">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAvatarMenuOpen(false);
                            avatarInput.current?.click();
                          }}
                          className="flex min-h-10 w-full items-center gap-2.5 px-3 text-left text-xs font-semibold text-[#354258] transition hover:bg-[#f6f5ff] hover:text-[#5945c7]"
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
                            className="flex min-h-10 w-full items-center gap-2.5 border-t border-[#edf0f4] px-3 text-left text-xs font-semibold text-[#bd4654] transition hover:bg-[#fff5f5] disabled:opacity-60"
                          >
                            <X size={15} aria-hidden="true" />
                            Remove image
                          </button>
                        )}
                        <p className="m-0 border-t border-[#edf0f4] px-3 py-2 text-[10px] font-medium text-[#8993a4]">JPEG, PNG, or WebP · Max 2 MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadAvatar}
                    className="sr-only"
                    aria-label="Choose profile photo"
                  />
                </div>
              </div>
              {avatarError && <p className="mb-0 mt-3 max-w-sm text-xs font-semibold text-[#bd4654]" role="alert">{avatarError}</p>}
              {editing === 'personal' ? (
                <div className="mt-5">
                  <div className="grid gap-3 sm:grid-cols-2">{sectionFields.personal.map((field) => <Field key={field.key} definition={field} value={draft[field.key]} onChange={updateDraft} />)}</div>
                  <SaveActions saving={saving} onSave={() => saveSection('personal')} onCancel={cancelEdit} />
                </div>
              ) : (
                <div className="mt-4 max-w-3xl">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <h2 className="m-0 flex flex-wrap items-center gap-2 font-[Manrope] text-xl font-bold tracking-[-.03em] text-[#172338] sm:text-[22px]">{name}{profile.name && <BadgeCheck size={17} className="fill-[#21b49a] text-white" aria-label="Verified learner" />}</h2>
                    <EditButton editing={false} onClick={() => beginEdit('personal', Object.fromEntries(sectionFields.personal.map(({ key }) => [key, profile[key] || ''])))} />
                  </div>
                  <div className="mt-3 flex max-w-[440px] items-center gap-3 py-1">
                    <span className="grid size-8 shrink-0 place-items-center text-[#5945c7]">
                      <FileText size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-xs font-bold text-[#27354b]">{profile.resume ? 'Resume' : 'Upload your resume'}</p>
                      <p className="m-0 mt-0.5 truncate text-[11px] text-[#778297]">
                        {profile.resume
                          ? `${profile.resume.filename} · ${(profile.resume.size / 1024 / 1024).toFixed(2)} MB`
                          : 'PDF, DOC, or DOCX · Up to 5 MB'}
                      </p>
                    </div>
                    {profile.resume ? (
                      <>
                        <button
                          type="button"
                          onClick={downloadResume}
                          disabled={resumeBusy}
                          className="grid size-8 shrink-0 place-items-center text-[#5945c7] transition hover:bg-[#f5f3ff] disabled:opacity-50"
                          aria-label="Download resume"
                          title="Download resume"
                        >
                          <ArrowDownToLine size={17} aria-hidden="true" />
                        </button>
                        <div ref={resumeMenuRef} className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setResumeMenuOpen((open) => !open)}
                            disabled={resumeBusy}
                            className="grid size-8 place-items-center text-[#5945c7] transition hover:bg-[#f5f3ff] disabled:opacity-50"
                            aria-label="Resume options"
                            aria-haspopup="menu"
                            aria-expanded={resumeMenuOpen}
                            title="Resume options"
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          {resumeMenuOpen && (
                            <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-36 border border-[#e2e7ef] bg-white py-1 shadow-[0_12px_30px_#19294720]">
                              <button type="button" role="menuitem" onClick={() => { setResumeMenuOpen(false); fileInput.current?.click(); }} className="flex min-h-9 w-full items-center gap-2 px-3 text-left text-xs font-semibold text-[#354258] hover:bg-[#f6f5ff] hover:text-[#5945c7]">
                                <Upload size={14} aria-hidden="true" /> Update
                              </button>
                              <button type="button" role="menuitem" onClick={removeResume} disabled={resumeBusy} className="flex min-h-9 w-full items-center gap-2 border-t border-[#edf0f4] px-3 text-left text-xs font-semibold text-[#bd4654] hover:bg-[#fff5f5] disabled:opacity-50">
                                <X size={14} aria-hidden="true" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        disabled={saving}
                        className="grid size-8 shrink-0 place-items-center text-[#5945c7] transition hover:bg-[#f5f3ff] disabled:opacity-50"
                        aria-label="Upload resume"
                        title="Upload resume"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                    )}
                    <input ref={fileInput} className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={uploadResume} />
                  </div>
                  {resumeError && <p className="mb-0 mt-1 text-xs font-semibold text-[#c2414f]" role="alert">{resumeError}</p>}
                  <div className="mt-2.5 grid gap-1.5 text-[13px] leading-5 text-[#526077] sm:text-sm">
                    {(profile.headline || profile.jobTitle) && (
                      <p className="m-0 font-medium text-[#27354b]">
                        {profile.headline}
                        {profile.headline && profile.jobTitle && <span className="px-2 text-[#a0a9b8]">|</span>}
                        {profile.jobTitle}
                      </p>
                    )}
                    {profile.experienceYears && (
                      <p className="m-0">
                        <span className="font-semibold text-[#344258]">Total years of work experience:</span>{' '}
                        {/\byears?\b/i.test(String(profile.experienceYears)) ? profile.experienceYears : `${profile.experienceYears}+ years`}
                      </p>
                    )}
                    {profile.specialization && <p className="m-0"><span className="font-semibold text-[#344258]">Specialization:</span> {profile.specialization}</p>}
                    {profile.location && <p className="m-0 inline-flex items-center gap-1.5 text-xs text-[#68758a] sm:text-[13px]"><MapPin size={14} /> {profile.location}</p>}
                    {profile.applauds > 0 && <p className="m-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#168566] sm:text-[13px]"><Hand size={15} /> {profile.applauds} Applauds</p>}
                  </div>
                </div>
              )}
              <nav className="mt-4 flex flex-wrap" aria-label="Profile sections">
                {sectionLinks.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(event) => jumpToSection(event, id)} className={`border-l border-[#d9deea] px-4 py-1 text-xs font-bold leading-4 no-underline transition-colors first:border-l-0 first:pl-0 ${activeSection === id ? 'text-[#5945c7]' : 'text-[#737e91] hover:text-[#5945c7]'}`}>{label}</a>)}
              </nav>
            </div>
            <div className="grid content-start gap-5 pt-5 lg:pt-14">
              <ProfileCard icon={ShieldCheck} title="Badges" action={<EditButton editing={editing === 'badges'} onClick={() => editing === 'badges' ? cancelEdit() : beginEdit('badges', { badges: profile.badges })} />}>
                {editing === 'badges' ? (
                  <><Field definition={{ key: 'badges', label: 'Badges (one per line)', list: true }} value={draft.badges} onChange={updateDraft} /><SaveActions saving={saving} onSave={() => saveSection('badges')} onCancel={cancelEdit} /></>
                ) : profile.badges.length ? <ul className="m-0 grid gap-2 p-0">{profile.badges.map((badge) => <li key={badge} className="flex items-center gap-2 text-sm text-[#536078]"><BadgeCheck size={16} className="text-[#19a88a]" />{badge}</li>)}</ul> : <p className="m-0 text-sm text-[#778297]">No badges added yet.</p>}
              </ProfileCard>
              <ProfileCard icon={Heart} title="Interests" action={<EditButton editing={editing === 'interests'} onClick={() => editing === 'interests' ? cancelEdit() : beginEdit('interests', { interests: profile.interests })} />}>
                {editing === 'interests' ? (
                  <><Field definition={{ key: 'interests', label: 'Interests (one per line)', list: true }} value={draft.interests} onChange={updateDraft} /><SaveActions saving={saving} onSave={() => saveSection('interests')} onCancel={cancelEdit} /></>
                ) : profile.interests.length ? <div className="flex flex-wrap gap-2">{profile.interests.map((interest) => <span key={interest} className="border border-[#e3e7ef] bg-[#f7f8fb] px-2.5 py-1 text-xs font-semibold text-[#58657a]">{interest}</span>)}</div> : <p className="m-0 text-sm text-[#778297]">No interests added yet.</p>}
              </ProfileCard>
            </div>
          </div>
        </section>

        {saveError && <p className="mt-4 border border-[#f1c8cc] bg-[#fff4f4] p-3 text-sm text-[#a23340]" role="alert">{saveError}</p>}
        {loading ? <p className="py-10 text-center text-sm text-[#68758a]">Loading your profile…</p> : (
          <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid min-w-0 gap-5">
              <section id="about" className="scroll-mt-24 pb-3">
                <div className="mb-4 flex min-h-9 items-center justify-between gap-4">
                  <h2 className="m-0 flex items-center gap-2.5 font-[Manrope] text-base font-bold text-[#172338]">
                    <UserRound size={18} className="text-[#5945c7]" aria-hidden="true" />
                    About Me
                  </h2>
                  <EditButton editing={editing === 'about'} onClick={() => editing === 'about' ? cancelEdit() : beginEdit('about', { about: profile.about })} />
                </div>
                {editing === 'about' ? (
                  <>
                    <Field definition={sectionFields.about[0]} value={draft.about} onChange={updateDraft} />
                    <SaveActions saving={saving} onSave={() => saveSection('about', { about: draft.about })} onCancel={cancelEdit} />
                  </>
                ) : (
                  <>
                    <p className={`m-0 whitespace-pre-wrap text-sm leading-7 text-[#526077] ${aboutExpanded ? '' : 'line-clamp-4'}`}>{profile.about || <span className="text-[#778297]">Add a short introduction about yourself.</span>}</p>
                    {profile.about.length > 200 && <button type="button" onClick={() => setAboutExpanded((expanded) => !expanded)} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#5945c7]">{aboutExpanded ? 'Read Less' : 'Read More'} <ChevronDown size={15} className={aboutExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>}
                  </>
                )}
              </section>

              <section id="languages" className="scroll-mt-24 py-3">
                <div className="mb-3 flex min-h-9 items-center justify-between gap-4">
                  <h2 className="m-0 flex items-center gap-2.5 font-[Manrope] text-base font-bold text-[#27354b]">
                    <Languages size={17} className="text-[#5945c7]" aria-hidden="true" />
                    Languages Spoken
                  </h2>
                  <EditButton editing={editing === 'languages'} onClick={() => editing === 'languages' ? cancelEdit() : beginEdit('languages', { languages: profile.languages })} />
                </div>
                {editing === 'languages' ? (
                  <>
                    <Field definition={sectionFields.about[1]} value={draft.languages} onChange={updateDraft} />
                    <SaveActions saving={saving} onSave={() => saveSection('about', { languages: draft.languages })} onCancel={cancelEdit} />
                  </>
                ) : (
                  <p className="m-0 text-sm text-[#5e6b80]">{Array.isArray(profile.languages) && profile.languages.length ? profile.languages.join(', ') : <span className="text-[#778297]">No languages added yet.</span>}</p>
                )}
              </section>

              <section id="skills" className="scroll-mt-24">
                <ProfileCard icon={Sparkles} title="Skills" action={<EditButton editing={editing === 'skills'} onClick={() => editing === 'skills' ? cancelEdit() : beginEdit('skills', profile.skills)} />}>
                  {editing === 'skills' ? (
                    <><div className="grid gap-3">{sectionFields.skills.map((field) => <Field key={field.key} definition={field} value={draft[field.key]} onChange={updateDraft} />)}</div><SaveActions saving={saving} onSave={() => saveSection('skills', { skills: draft })} onCancel={cancelEdit} /></>
                  ) : Object.entries(profile.skills).some(([, entries]) => entries.length) ? (
                    <div className="grid gap-4">{Object.entries(profile.skills).map(([level, entries]) => entries.length > 0 && <div key={level} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3"><span className="shrink-0 pt-1.5 text-xs font-semibold text-[#526078] sm:w-28">{level}</span><div className="flex min-w-0 flex-1 flex-wrap gap-2">{entries.map((skill) => <span key={skill} className="border border-[#dfe5ee] bg-[#f7f8fa] px-3 py-1.5 text-xs font-medium text-[#42516a]">{skill}</span>)}</div></div>)}</div>
                  ) : <p className="m-0 text-sm text-[#778297]">Add your skills and proficiency levels.</p>}
                </ProfileCard>
              </section>

              {editCollection('workExperience', BriefcaseBusiness, 'Work Experience', profile.workExperience, sectionFields.workExperience, 'No work experience added yet.')}
              {editCollection('education', GraduationCap, 'Education', profile.education, sectionFields.education, 'No education added yet.')}
              {editCollection('certifications', BadgeCheck, 'Certifications', profile.certifications, sectionFields.certifications, 'No certifications added yet.')}
            </div>

            <aside className="grid min-w-0 content-start gap-5 lg:sticky lg:top-5">
              <section className="border border-[#e2e7ef] bg-white p-5 shadow-[0_8px_24px_#19294708]">
                <h2 className="m-0 font-[Manrope] text-sm font-bold text-[#27354b]">Profile visibility</h2>
                <p className="mb-0 mt-2 text-xs leading-5 text-[#68758a]">Your profile helps mentors and the learning community understand your experience.</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#168566]"><ShieldCheck size={15} /> Student profile</div>
              </section>
              <a href="/dashboard" className="inline-flex min-h-11 items-center justify-between border border-[#dce2ed] bg-white px-4 text-sm font-bold text-[#4b5870] no-underline hover:border-[#7664d8] hover:text-[#5945c7]">Go to My Learning <ArrowUpRight size={16} /></a>
            </aside>
          </div>
        )}
      </main>
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
      <Footer />
    </div>
  );
}

export default ScsProfilePage;