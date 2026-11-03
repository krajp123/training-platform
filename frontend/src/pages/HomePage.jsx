import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Blocks, BriefcaseBusiness, Check, ChevronDown, Code2,
  GraduationCap, MessageCircle, Palette, Pause, PhoneCall, Play, Sparkles, Star, UserRoundCheck, Video, X, Zap,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';

const bimPrograms = [
  { duration: '1 month', hours: '20 hours', price: '₹4,999', rating: '4.8', description: 'Build practical BIM foundations through guided exercises.' },
  { duration: '6 months', hours: '120 hours', price: '₹24,999', rating: '4.8', description: 'Develop job-ready BIM skills with project-based learning.' },
  { duration: '1 year', hours: '240 hours', price: '₹39,999', rating: '4.8', description: 'Build advanced BIM expertise through a year-long learning path.' },
];

const bimProgramImage =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85';

const courseOutcomes = [
  {
    icon: Palette,
    title: 'Hands-on learning',
    text: 'Build practical skills through real projects and workflows used across the AEC industry.',
  },
  {
    icon: MessageCircle,
    title: 'Personalized support',
    text: 'Get guidance and feedback as you learn from experienced industry professionals.',
  },
  {
    icon: Zap,
    title: 'Measurable outcomes',
    text: 'Apply your new skills, build your portfolio, and take confident next steps in your career.',
  },
];

const benefits = [
  {
    icon: Blocks,
    label: 'PROJECT-BASED',
    title: 'Practice on real projects',
    text: 'Apply BIM and design concepts to guided AEC projects, building practical skills you can use from day one.',
    tone: 'mint',
  },
  {
    icon: UserRoundCheck,
    label: 'EXPERT GUIDANCE',
    title: 'Learn alongside industry experts',
    text: 'Get focused feedback, personal guidance, and live sessions led by professionals working in the industry.',
    tone: 'violet',
  },
  {
    icon: BriefcaseBusiness,
    label: 'CAREER-READY',
    title: 'Build a portfolio that stands out',
    text: 'Turn completed projects into a portfolio that demonstrates your skills and supports your next career move.',
    tone: 'coral',
  },
];

const benefitGridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const benefitCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const courseGuidanceSlides = [
  { src: '/course-guidance-1.png', alt: 'Learning advisor guiding a student through course options' },
  { src: '/course-guidance-2.png', alt: 'Online course consultation with a learning advisor' },
  { src: '/course-guidance-3.png', alt: 'Advisor presenting BIM course choices during a video call' },
];

const homeTailwindStyles = `
  [&]:[--font-size-caption:0.75rem] [&]:[--font-size-small:0.875rem] [&]:[--font-size-body:1rem] [&]:[--font-size-lead:1.125rem] [&]:[--font-size-title:1.375rem]
  [&]:[--font-size-heading:2rem] [&]:[--font-size-display:clamp(3rem,_6vw,_4.75rem)] [&]:[--line-height-body:1.65] [&]:[--line-height-heading:1.2] [&]:[font-size:var(--font-size-body)]
  [&]:[line-height:var(--line-height-body)] [&]:[min-height:100vh] [&]:[overflow:hidden] [&]:[color:#f9f8ff] [&]:[background:#10101b]
  [&]:[font-family:'DM_Sans',_sans-serif] [&_a]:[color:inherit] [&_a]:[text-decoration:none] [&_button]:[font:inherit]
  [&_.hero-primary:hover]:[background:rgba(255,255,255,.16)] [&_.hero-primary:hover]:[border-color:white] [&_.hero-primary:hover]:[transform:translateY(-2px)] [&_.hero-primary:hover]:[box-shadow:0_8px_24px_#0003] [&_.hero-secondary:hover]:![color:white] [&_.hero-secondary:hover]:[transform:translateY(-2px)] [&_.hero-secondary:hover_>_span]:[background:rgba(255,255,255,.12)] [&_.hero-secondary:hover_>_span]:[border-color:#ffffff70] [&_.closing-cta_>_button:hover]:[background:white] [&_.closing-cta_>_button:hover]:[border-color:white] [&_.landing-hero]:[position:relative]
  [&_.landing-hero]:[height:calc(100svh_-_90px)] [&_.landing-hero]:[min-height:0] [&_.landing-hero]:[display:grid] [&_.landing-hero]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] [&_.landing-hero]:[align-items:center]
  [&_.landing-hero]:[padding:clamp(16px,_5vh,_52px)_clamp(25px,_9.2vw,_145px)] [&_.landing-hero]:[overflow:hidden] [&_.landing-hero]:[background:#10101b] [&_.landing-hero::before]:[content:''] [&_.landing-hero::before]:[position:absolute]
  [&_.landing-hero::before]:[z-index:1] [&_.landing-hero::before]:[inset:0] [&_.landing-hero::before]:[pointer-events:none] [&_.landing-hero::before]:[background:linear-gradient(90deg,_#10101bed_0%,_#10101bbd_48%,_#10101b70_100%),_linear-gradient(0deg,_#10101b9c,_transparent_40%,_#10101b50)] [&_.hero-background-video]:[position:absolute]
  [&_.hero-background-video]:[z-index:0] [&_.hero-background-video]:[inset:0] [&_.hero-background-video]:[width:100%] [&_.hero-background-video]:[height:100%] [&_.hero-background-video]:[object-fit:cover]
  [&_.hero-background-video]:[object-position:center] [&_.hero-glow]:[position:absolute] [&_.hero-glow]:[pointer-events:none] [&_.hero-glow]:[border-radius:50%] [&_.hero-glow]:[filter:blur(1px)]
  [&_.hero-glow-one]:[width:300px] [&_.hero-glow-one]:[height:300px] [&_.hero-glow-one]:[top:-165px] [&_.hero-glow-one]:[left:22%] [&_.hero-glow-one]:[border:1px_solid_#ffffff0a]
  [&_.hero-glow-one]:[box-shadow:0_0_0_35px_#ffffff04,_0_0_0_78px_#ffffff03] [&_.hero-glow-two]:[width:290px] [&_.hero-glow-two]:[height:290px] [&_.hero-glow-two]:[right:0] [&_.hero-glow-two]:[bottom:-204px]
  [&_.hero-glow-two]:[border:1px_solid_#58ddcc16] [&_.hero-glow-two]:[box-shadow:0_0_0_39px_#58ddcc06] [&_.hero-content]:[position:relative] [&_.hero-content]:[z-index:2] [&_.hero-content]:[grid-column:1_/_-1]
  [&_.hero-content]:[width:100%] [&_.hero-content]:[max-width:900px] [&_.hero-content]:[transform:translateY(-12px)] [&_.hero-announcement]:[display:inline-flex] [&_.hero-announcement]:[align-items:center]
  [&_.hero-announcement]:[gap:8px] [&_.hero-announcement]:[padding:8px_10px] [&_.hero-announcement]:[border:1px_solid_#ffffff17] [&_.hero-announcement]:[border-radius:30px] [&_.hero-announcement]:[background:#ffffff07]
  [&_.hero-announcement]:[color:#ccc2ef] [&_.hero-announcement]:[font-size:0.6875rem] [&_.hero-announcement]:[font-weight:700] [&_.hero-announcement]:[letter-spacing:.9px] [&_.hero-announcement_>_svg]:[margin-left:2px]
  [&_.hero-announcement_>_svg]:[color:#60d9c9] [&_.announcement-pulse]:[width:6px] [&_.announcement-pulse]:[height:6px] [&_.announcement-pulse]:[border-radius:50%] [&_.announcement-pulse]:[background:#61ddc8]
  [&_.announcement-pulse]:[box-shadow:0_0_11px_#61ddc899] [&_.story-image-tag_>_span]:[width:6px] [&_.story-image-tag_>_span]:[height:6px] [&_.story-image-tag_>_span]:[border-radius:50%] [&_.story-image-tag_>_span]:[background:#61ddc8]
  [&_.story-image-tag_>_span]:[box-shadow:0_0_11px_#61ddc899] [&_.hero-content_h1]:[margin:22px_0_15px] [&_.hero-content_h1]:[color:#f7f5ff] [&_.hero-content_h1]:[font:700_clamp(2rem,_4.1vw,_4.25rem)/1.04_Manrope,_sans-serif] [&_.hero-content_h1]:[letter-spacing:-.055em]
  [&_.hero-content_h1_span]:[color:#b9a6ff] [&_.hero-heading-break]:[display:none] [&_.hero-description]:[max-width:640px] [&_.hero-description]:[margin:0] [&_.hero-description]:[color:#aaa7b7]
  [&_.hero-description]:[font-size:var(--font-size-lead)] [&_.hero-description]:[line-height:1.7] [&_.hero-actions]:[display:flex] [&_.hero-actions]:[align-items:center] [&_.hero-actions]:[flex-wrap:wrap]
  [&_.hero-actions]:[gap:14px] [&_.hero-actions]:[margin-top:23px] [&_.hero-primary]:[min-height:43px] [&_.hero-primary]:[display:inline-flex] [&_.hero-primary]:[align-items:center]
  [&_.hero-primary]:[gap:14px] [&_.hero-primary]:[padding:0_15px] [&_.hero-primary]:[border:1px_solid_#ffffff80] [&_.hero-primary]:[border-radius:6px] [&_.hero-primary]:[background:rgba(255,255,255,.08)]
  [&_.hero-primary]:![color:#f9f8ff] [&_.hero-primary]:[font-size:var(--font-size-small)] [&_.hero-primary]:[font-weight:700] [&_.hero-primary]:[transition:transform_.18s,_background_.18s,_border-color_.18s,_box-shadow_.18s] [&_.hero-secondary]:[display:inline-flex]
  [&_.hero-secondary]:[align-items:center] [&_.hero-secondary]:[gap:8px] [&_.hero-secondary]:![color:white] [&_.hero-secondary]:[font-size:16px] [&_.hero-secondary]:[font-weight:700] [&_.hero-secondary]:[transition:color_.18s,_transform_.18s] [&_.hero-secondary_>_span]:[width:28px]
  [&_.hero-secondary_>_span]:[height:28px] [&_.hero-secondary_>_span]:[display:grid] [&_.hero-secondary_>_span]:[place-items:center] [&_.hero-secondary_>_span]:[border:1px_solid_#ffffff30] [&_.hero-secondary_>_span]:[border-radius:50%]
  [&_.hero-secondary_>_span]:[color:#66d8c7] [&_.hero-secondary_>_span]:[transition:background_.18s,_border-color_.18s] [&_.hero-scroll]:[position:absolute] [&_.hero-scroll]:[z-index:2] [&_.hero-scroll]:[bottom:24px] [&_.hero-scroll]:[left:clamp(25px,_9.2vw,_145px)]
  [&_.hero-scroll]:[display:flex] [&_.hero-scroll]:[align-items:center] [&_.hero-scroll]:[gap:8px] [&_.hero-scroll]:![color:#c1bdcc] [&_.hero-scroll]:[font-size:var(--font-size-caption)]
  [&_.hero-scroll]:[letter-spacing:1px] [&_.hero-scroll_>_span]:[width:15px] [&_.hero-scroll_>_span]:[height:1px] [&_.hero-scroll_>_span]:[background:#6b59ab] [&_.hero-scroll_svg]:[color:#65d8c7]
  [&_.hero-index]:[position:absolute] [&_.hero-index]:[z-index:2] [&_.hero-index]:[right:clamp(25px,_9.2vw,_145px)] [&_.hero-index]:[bottom:25px] [&_.hero-index]:[color:#c1bdcc]
  [&_.hero-index]:[font-size:var(--font-size-caption)] [&_.hero-index]:[letter-spacing:1px] [&_.trust-strip]:[box-sizing:border-box] [&_.trust-strip]:[height:90px] [&_.trust-strip]:[padding:10px_clamp(25px,_9.2vw,_145px)_11px] [&_.trust-strip]:[border-top:1px_solid_#e8e7ed] [&_.trust-strip]:[border-bottom:1px_solid_#e8e7ed]
  [&_.trust-strip]:[background:#fff] [&_.trust-strip_>_p]:[margin:0_0_6px] [&_.trust-strip_>_p]:[color:#777482] [&_.trust-strip_>_p]:[text-align:center] [&_.trust-strip_>_p]:[font-size:0.6875rem]
  [&_.trust-strip_>_p]:[font-weight:700] [&_.trust-strip_>_p]:[letter-spacing:1.5px] [&_.trust-stats]:[display:flex] [&_.trust-stats]:[align-items:center] [&_.trust-stats]:[justify-content:space-between]
  [&_.trust-stats]:[gap:15px] [&_.trust-stats_>_div:not(.trust-partner)]:[display:grid] [&_.trust-stats_>_div:not(.trust-partner)]:[gap:3px] [&_.trust-stats_>_div_>_strong]:[color:#24232d] [&_.trust-stats_>_div_>_strong]:[font:700_19px_Manrope,_sans-serif]
  [&_.trust-stats_>_div_>_strong_span]:[color:#62d9c8] [&_.trust-stats_>_div_>_span]:[color:#777482] [&_.trust-stats_>_div_>_span]:[font-size:var(--font-size-caption)] [&_.trust-stats_>_i]:[height:26px] [&_.trust-stats_>_i]:[border-left:1px_solid_#e4e2e9]
  [&_.trust-partner]:[display:grid] [&_.trust-partner]:[gap:5px] [&_.trust-partner]:[color:#777482] [&_.trust-partner]:[font-size:0.6875rem] [&_.trust-partner]:[letter-spacing:1px]
  [&_.trust-partner_strong]:[display:flex] [&_.trust-partner_strong]:[align-items:center] [&_.trust-partner_strong]:[gap:5px] [&_.trust-partner_strong]:[color:#6550bd] [&_.trust-partner_strong]:[font-size:var(--font-size-small)]
  [&_.trust-partner_strong]:[letter-spacing:.4px] [&_.landing-section]:[padding:83px_clamp(25px,_9.2vw,_145px)] [&_.learning-section]:[background-color:#10101b] [&_.learning-section]:[color:#f8f6ff] [&_.section-intro]:[display:flex]
  [&_.section-intro]:[align-items:flex-end] [&_.section-intro]:[justify-content:space-between] [&_.section-intro]:[gap:25px] [&_.section-intro]:[margin-bottom:32px] [&_.landing-kicker]:[display:flex]
  [&_.landing-kicker]:[align-items:center] [&_.landing-kicker]:[gap:7px] [&_.landing-kicker]:[color:#8e899b] [&_.landing-kicker]:[font-size:0.6875rem] [&_.landing-kicker]:[font-weight:700]
  [&_.landing-kicker]:[letter-spacing:1.2px] [&_.landing-kicker_>_span]:[width:14px] [&_.landing-kicker_>_span]:[height:1px] [&_.landing-kicker_>_span]:[background:#63cdbd] [&_.section-intro_h2]:[margin:12px_0_0]
  [&_.section-intro_h2]:[font:700_clamp(29px,_4vw,_44px)/1.12_Manrope,_sans-serif] [&_.section-intro_h2]:[letter-spacing:-1.8px] [&_.story-copy_h2]:[margin:12px_0_0] [&_.story-copy_h2]:[font:700_clamp(29px,_4vw,_44px)/1.12_Manrope,_sans-serif] [&_.story-copy_h2]:[letter-spacing:-1.8px]
  [&_.closing-cta_h2]:[margin:13px_0_9px] [&_.closing-cta_h2]:[font:700_clamp(29px,_4vw,_44px)/1.12_Manrope,_sans-serif] [&_.closing-cta_h2]:[letter-spacing:-1.8px] [&_.section-intro_h2_span]:[color:#8171c6] [&_.section-intro_>_p]:[width:min(330px,_37%)]
  [&_.section-intro_>_p]:[margin:0_0_5px] [&_.section-intro_>_p]:[color:#82808a] [&_.section-intro_>_p]:[font-size:var(--font-size-body)] [&_.section-intro_>_p]:[line-height:1.7] [&_.benefit-grid]:[display:grid]
  [&_.benefit-grid]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] [&_.benefit-grid]:[gap:16px] [&_.benefit-card]:[min-height:230px] [&_.benefit-card]:[position:relative] [&_.benefit-card]:[overflow:hidden] [&_.benefit-card]:[padding:24px]
  [&_.benefit-card]:[border:1px_solid_#ffffff24] [&_.benefit-card]:[border-radius:14px] [&_.benefit-card]:[background:linear-gradient(145deg,_#1b1a2beb,_#11111bd9)] [&_.benefit-card]:[backdrop-filter:blur(12px)] [&_.benefit-card]:[box-shadow:0_14px_40px_#0003]
  [&_.benefit-card]:[transition:border-color_.25s,_box-shadow_.25s] [&_.benefit-card:hover]:[border-color:#ffffff55] [&_.benefit-card:hover]:[box-shadow:0_22px_48px_#0006]
  [&_.benefit-card-top]:[position:relative] [&_.benefit-card-top]:[z-index:1] [&_.benefit-card-top]:[display:flex] [&_.benefit-card-top]:[align-items:center] [&_.benefit-card-top]:[justify-content:space-between]
  [&_.benefit-icon]:[width:46px] [&_.benefit-icon]:[height:46px] [&_.benefit-icon]:[display:grid] [&_.benefit-icon]:[place-items:center] [&_.benefit-icon]:[border-radius:13px]
  [&_.benefit-icon]:[border:1px_solid_#ffffff1c] [&_.benefit-icon.mint]:[color:#72e0ce] [&_.benefit-icon.mint]:[background:#3bbca51f] [&_.benefit-icon.violet]:[color:#c0aaff] [&_.benefit-icon.violet]:[background:#8b69e624]
  [&_.benefit-icon.coral]:[color:#ffb39c] [&_.benefit-icon.coral]:[background:#e985671f] [&_.benefit-number]:[color:#cbc6d7] [&_.benefit-number]:[font:700_10px_Manrope,_sans-serif] [&_.benefit-card-label]:[position:relative]
  [&_.benefit-card-label]:[z-index:1] [&_.benefit-card-label]:[display:block] [&_.benefit-card-label]:[margin-top:22px] [&_.benefit-card-label]:[color:#b9a6ff] [&_.benefit-card-label]:[font-size:0.625rem] [&_.benefit-card-label]:[font-weight:700]
  [&_.benefit-card-label]:[letter-spacing:1.1px] [&_.benefit-card_h3]:[position:relative] [&_.benefit-card_h3]:[z-index:1] [&_.benefit-card_h3]:[margin:7px_0_8px] [&_.benefit-card_h3]:[color:#fff]
  [&_.benefit-card_h3]:[font:700_17px/1.4_Manrope,_sans-serif] [&_.benefit-card_h3]:[letter-spacing:-.35px] [&_.benefit-card_p]:[position:relative] [&_.benefit-card_p]:[z-index:1]
  [&_.benefit-card_p]:[max-width:310px] [&_.benefit-card_p]:[margin:0] [&_.benefit-card_p]:[color:#d0ccdb] [&_.benefit-card_p]:[font-size:var(--font-size-small)] [&_.benefit-card_p]:[line-height:1.7]
  [&_.benefit-card-glow]:[position:absolute] [&_.benefit-card-glow]:[right:-55px] [&_.benefit-card-glow]:[bottom:-90px] [&_.benefit-card-glow]:[width:200px] [&_.benefit-card-glow]:[height:200px]
  [&_.benefit-card-glow]:[border-radius:50%] [&_.benefit-card-glow]:[background:radial-gradient(circle,_#8f79df1c,_transparent_70%)] [&_.benefit-card-glow]:[pointer-events:none]
  [&_.learning-section_.landing-kicker]:[color:#d5d0e0] [&_.learning-section_.section-intro_h2_span]:[color:#b9a6ff] [&_.learning-section_.section-intro_>_p]:[color:#d2ceda]
  [&_.courses-landing]:[color:#f8f6ff] [&_.courses-landing]:[background:#10101b] [&_.courses-intro]:[align-items:flex-end] [&_.courses-intro_h2_span]:[color:#b6a3ff] [&_.all-courses-link]:[display:inline-flex]
  [&_.all-courses-link]:[align-items:center] [&_.all-courses-link]:[gap:8px] [&_.all-courses-link]:[margin-bottom:5px] [&_.all-courses-link]:![color:#bfb0ff] [&_.all-courses-link]:[font-size:var(--font-size-small)]
  [&_.all-courses-link]:[font-weight:700] [&_.catalog-note]:[margin:-13px_0_16px] [&_.catalog-note]:[color:#a8a4b3] [&_.catalog-note]:[font-size:var(--font-size-caption)] [&_.featured-courses]:[display:grid]
  [&_.featured-courses]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] [&_.featured-courses]:[gap:14px] [&_.featured-course]:[min-width:0] [&_.featured-course]:[overflow:hidden] [&_.featured-course]:[border:1px_solid_#ffffff19]
  [&_.featured-course]:[border-radius:9px] [&_.featured-course]:[background:#191824] [&_.featured-course]:[transition:transform_.2s,_border-color_.2s] [&_.featured-course:hover]:[transform:translateY(-4px)] [&_.featured-course:hover]:[border-color:#b7a5ff73]
  [&_.featured-course-link]:[display:block] [&_.featured-image]:[height:177px] [&_.featured-image]:[position:relative] [&_.featured-image]:[overflow:hidden] [&_.featured-image]:[background:#28253a]
  [&_.featured-image::after]:[position:absolute] [&_.featured-image::after]:[inset:40%_0_0] [&_.featured-image::after]:[background:linear-gradient(transparent,_#14131fb0)] [&_.featured-image::after]:[content:''] [&_.featured-image_img]:[width:100%]
  [&_.featured-image_img]:[height:100%] [&_.featured-image_img]:[display:block] [&_.featured-image_img]:[object-fit:cover] [&_.featured-image_img]:[transition:transform_.35s] [&_.featured-course:hover_.featured-image_img]:[transform:scale(1.045)]
  [&_.featured-course-index]:[position:absolute] [&_.featured-course-index]:[z-index:1] [&_.featured-course-index]:[top:11px] [&_.featured-course-index]:[left:11px] [&_.featured-course-index]:[padding:5px_7px]
  [&_.featured-course-index]:[border:1px_solid_#ffffff35] [&_.featured-course-index]:[border-radius:4px] [&_.featured-course-index]:[background:#14131f91] [&_.featured-course-index]:[color:#fff] [&_.featured-course-index]:[font-size:0.6875rem]
  [&_.featured-course-index]:[letter-spacing:.7px] [&_.featured-arrow]:[position:absolute] [&_.featured-arrow]:[z-index:1] [&_.featured-arrow]:[right:10px] [&_.featured-arrow]:[bottom:10px]
  [&_.featured-arrow]:[width:29px] [&_.featured-arrow]:[height:29px] [&_.featured-arrow]:[display:grid] [&_.featured-arrow]:[place-items:center] [&_.featured-arrow]:[border:1px_solid_#ffffff3b]
  [&_.featured-arrow]:[border-radius:50%] [&_.featured-arrow]:[background:#14131f66] [&_.featured-arrow]:[color:white] [&_.featured-info]:[padding:14px] [&_.featured-category]:[color:#9c8be3]
  [&_.featured-category]:[font-size:0.6875rem] [&_.featured-category]:[font-weight:700] [&_.featured-category]:[letter-spacing:1.1px] [&_.teal_.featured-category]:[color:#6dd7c7] [&_.pink_.featured-category]:[color:#e78cba]
  [&_.featured-info_h3]:[min-height:35px] [&_.featured-info_h3]:[margin:7px_0_12px] [&_.featured-info_h3]:[color:#f3f0fa] [&_.featured-info_h3]:[font:700_12px/1.45_Manrope,_sans-serif] [&_.featured-meta]:[display:flex]
  [&_.featured-meta]:[align-items:center] [&_.featured-meta]:[justify-content:space-between] [&_.featured-meta]:[padding-top:10px] [&_.featured-meta]:[border-top:1px_solid_#ffffff13] [&_.featured-meta]:[color:#a19eac]
  [&_.featured-meta]:[font-size:var(--font-size-caption)] [&_.featured-meta_>_span:last-child]:[display:flex] [&_.featured-meta_>_span:last-child]:[align-items:center] [&_.featured-meta_>_span:last-child]:[gap:4px] [&_.featured-meta_>_span:last-child]:[color:#e8ba5a]
  [&_.course-bottom-cta]:[display:flex] [&_.course-bottom-cta]:[justify-content:space-between] [&_.course-bottom-cta]:[align-items:center] [&_.course-bottom-cta]:[gap:15px] [&_.course-bottom-cta]:[margin-top:18px]
  [&_.course-bottom-cta]:[padding-top:15px] [&_.course-bottom-cta]:[border-top:1px_solid_#ffffff15] [&_.course-bottom-cta]:[color:#aaa7b5] [&_.course-bottom-cta]:[font-size:var(--font-size-caption)] [&_.course-bottom-cta_a]:[display:flex]
  [&_.course-bottom-cta_a]:[align-items:center] [&_.course-bottom-cta_a]:[gap:6px] [&_.course-bottom-cta_a]:[color:#c7b9ff] [&_.course-bottom-cta_a]:[font-weight:700] [&_.story-section]:[display:grid]
  [&_.story-section]:[grid-template-columns:1fr_.9fr] [&_.story-section]:[gap:clamp(30px,_7vw,_90px)] [&_.story-section]:[align-items:center] [&_.story-section]:[padding:85px_clamp(25px,_9.2vw,_145px)] [&_.story-section]:[background:#f6f5f9]
  [&_.story-section]:[color:#292633] [&_.story-image]:[height:340px] [&_.story-image]:[position:relative] [&_.story-image]:[overflow:hidden] [&_.story-image]:[border-radius:10px]
  [&_.story-image]:[background:#d6d1de] [&_.story-image_img]:[width:100%] [&_.story-image_img]:[height:100%] [&_.story-image_img]:[object-fit:cover] [&_.story-image_img]:[filter:saturate(.77)]
  [&_.story-image::after]:[position:absolute] [&_.story-image::after]:[inset:45%_0_0] [&_.story-image::after]:[background:linear-gradient(transparent,_#181521a6)] [&_.story-image::after]:[content:''] [&_.story-image-tag]:[position:absolute]
  [&_.story-image-tag]:[z-index:1] [&_.story-image-tag]:[bottom:18px] [&_.story-image-tag]:[left:19px] [&_.story-image-tag]:[display:flex] [&_.story-image-tag]:[align-items:center]
  [&_.story-image-tag]:[gap:8px] [&_.story-image-tag]:[color:white] [&_.story-image-tag]:[font-size:0.6875rem] [&_.story-image-tag]:[font-weight:700] [&_.story-image-tag]:[letter-spacing:1px]
  [&_.story-copy_h2]:[font-size:clamp(2rem,_4vw,_2.75rem)] [&_.story-copy_h2_span]:[color:#816bc8] [&_.story-copy_>_p]:[max-width:385px] [&_.story-copy_>_p]:[margin:14px_0_18px] [&_.story-copy_>_p]:[color:#82808a]
  [&_.story-copy_>_p]:[font-size:var(--font-size-body)] [&_.story-copy_>_p]:[line-height:1.7] [&_.story-quote]:[padding:12px_0_12px_13px] [&_.story-quote]:[border-left:2px_solid_#8a73d6] [&_.story-quote_.quote-stars]:[display:flex]
  [&_.story-quote_.quote-stars]:[gap:2px] [&_.story-quote_.quote-stars]:[margin-left:0] [&_.story-quote_.quote-stars]:[color:#eab951] [&_.story-quote_blockquote]:[max-width:365px] [&_.story-quote_blockquote]:[margin:8px_0]
  [&_.story-quote_blockquote]:[color:#514d5c] [&_.story-quote_blockquote]:[font:600_11px/1.7_Manrope,_sans-serif] [&_.story-quote_>_span]:[color:#9895a0] [&_.story-quote_>_span]:[font-size:var(--font-size-caption)] [&_.story-quote_>_span]:[font-weight:700]
  [&_.story-quote_>_span]:[letter-spacing:.8px] [&_.story-link]:[display:inline-flex] [&_.story-link]:[align-items:center] [&_.story-link]:[gap:7px] [&_.story-link]:[margin-top:14px]
  [&_.story-link]:![color:#7053d9] [&_.story-link]:[font-size:var(--font-size-small)] [&_.story-link]:[font-weight:700] [&_.closing-cta]:[position:relative] [&_.closing-cta]:[overflow:hidden]
  [&_.closing-cta]:[padding:68px_20px_73px] [&_.closing-cta]:[background:radial-gradient(ellipse_at_50%_120%,_#6651aa73,_transparent_54%),_#201d30] [&_.closing-cta]:[color:#fff] [&_.closing-cta]:[text-align:center] [&_.closing-cta_.landing-kicker]:[justify-content:center]
  [&_.closing-cta_.landing-kicker]:[color:#b9b3c8] [&_.closing-cta_.landing-kicker_>_span]:[background:#64d8c8] [&_.closing-cta_h2]:[position:relative] [&_.closing-cta_h2]:[z-index:1] [&_.closing-cta_h2]:[font-size:clamp(2.375rem,_5vw,_3.375rem)]
  [&_.closing-cta_h2_span]:[color:#c1acff] [&_.closing-cta_>_p]:[position:relative] [&_.closing-cta_>_p]:[z-index:1] [&_.closing-cta_>_p]:[margin:0_auto] [&_.closing-cta_>_p]:[color:#c2bdce]
  [&_.closing-cta_>_p]:[font-size:var(--font-size-body)] [&_.closing-cta_>_p]:[line-height:1.7] [&_.closing-cta_>_button]:[position:relative] [&_.closing-cta_>_button]:[z-index:1] [&_.closing-cta_>_button]:[display:inline-flex]
  [&_.closing-cta_>_button]:[align-items:center] [&_.closing-cta_>_button]:[gap:9px] [&_.closing-cta_>_button]:[min-height:40px] [&_.closing-cta_>_button]:[margin-top:19px] [&_.closing-cta_>_button]:[padding:0_14px]
  [&_.closing-cta_>_button]:[border:1px_solid_#c9bbff] [&_.closing-cta_>_button]:[border-radius:6px] [&_.closing-cta_>_button]:[background:#c9bbff] [&_.closing-cta_>_button]:[color:#241e37] [&_.closing-cta_>_button]:[font-size:var(--font-size-small)]
  [&_.closing-cta_>_button]:[font-weight:700] [&_.closing-cta_>_button]:[transition:.18s] [&_.cta-decoration]:[position:absolute] [&_.cta-decoration]:[top:-143px] [&_.cta-decoration]:[left:50%]
  [&_.cta-decoration]:[color:#ffffff05] [&_.cta-decoration]:[font:800_420px_Manrope,_sans-serif] [&_.cta-decoration]:[line-height:1] [&_.cta-decoration]:[transform:translateX(-50%)]
  [&_.marketing-toast]:[position:fixed] [&_.marketing-toast]:[z-index:42] [&_.marketing-toast]:[right:20px] [&_.marketing-toast]:[bottom:20px] [&_.marketing-toast]:[display:flex]
  [&_.marketing-toast]:[align-items:center] [&_.marketing-toast]:[gap:9px] [&_.marketing-toast]:[max-width:min(400px,_calc(100vw_-_32px))] [&_.marketing-toast]:[padding:11px_12px] [&_.marketing-toast]:[border:1px_solid_#ffffff21]
  [&_.marketing-toast]:[border-radius:7px] [&_.marketing-toast]:[background:#242135] [&_.marketing-toast]:[box-shadow:0_12px_35px_#0005] [&_.marketing-toast]:[color:#efedf6] [&_.marketing-toast]:[font-size:var(--font-size-small)]
  [&_.marketing-toast_>_svg]:[flex:0_0_auto] [&_.marketing-toast_>_svg]:[color:#69d6af] [&_.marketing-toast_button]:[display:grid] [&_.marketing-toast_button]:[place-items:center] [&_.marketing-toast_button]:[margin-left:4px]
  [&_.marketing-toast_button]:[border:0] [&_.marketing-toast_button]:[background:transparent] [&_.marketing-toast_button]:[color:#aaa6b5] [&_.auth-backdrop]:[position:fixed] [&_.auth-backdrop]:[z-index:40]
  [&_.auth-backdrop]:[inset:0] [&_.auth-backdrop]:[display:grid] [&_.auth-backdrop]:[place-items:center] [&_.auth-backdrop]:[padding:15px] [&_.auth-backdrop]:[background:#080710b9]
  [&_.auth-backdrop]:[backdrop-filter:blur(5px)] [&_.auth-modal]:[width:min(100%,_390px)] [&_.auth-modal]:[position:relative] [&_.auth-modal]:[padding:25px] [&_.auth-modal]:[border:1px_solid_#ffffff20]
  [&_.auth-modal]:[border-radius:11px] [&_.auth-modal]:[background:#1c1a2a] [&_.auth-modal]:[box-shadow:0_25px_90px_#0008] [&_.auth-close]:[position:absolute] [&_.auth-close]:[top:12px]
  [&_.auth-close]:[right:12px] [&_.auth-close]:[width:28px] [&_.auth-close]:[height:28px] [&_.auth-close]:[display:grid] [&_.auth-close]:[place-items:center]
  [&_.auth-close]:[border:1px_solid_#ffffff1c] [&_.auth-close]:[border-radius:6px] [&_.auth-close]:[background:transparent] [&_.auth-close]:[color:#b7b3c1] [&_.auth-symbol]:[width:38px]
  [&_.auth-symbol]:[height:38px] [&_.auth-symbol]:[display:grid] [&_.auth-symbol]:[place-items:center] [&_.auth-symbol]:[margin-bottom:16px] [&_.auth-symbol]:[border-radius:9px]
  [&_.auth-symbol]:[background:#c5b5ff] [&_.auth-symbol]:[color:#2a2142] [&_.auth-modal_.landing-kicker]:[color:#aaa5b7] [&_.auth-modal_.landing-kicker]:[font-size:7px] [&_.auth-modal_h2]:[margin:8px_0_5px]
  [&_.auth-modal_h2]:[color:#f7f4ff] [&_.auth-modal_h2]:[font:700_20px_Manrope,_sans-serif] [&_.auth-modal_h2]:[letter-spacing:-.6px] [&_.auth-modal_>_p]:[margin:0] [&_.auth-modal_>_p]:[color:#aaa6b4]
  [&_.auth-modal_>_p]:[font-size:var(--font-size-small)] [&_.auth-modal_form]:[display:grid] [&_.auth-modal_form]:[gap:12px] [&_.auth-modal_form]:[margin-top:19px] [&_.auth-modal_form_label]:[display:grid]
  [&_.auth-modal_form_label]:[gap:6px] [&_.auth-modal_form_label]:[color:#c9c6d1] [&_.auth-modal_form_label]:[font-size:var(--font-size-small)] [&_.auth-modal_form_label]:[font-weight:600] [&_.auth-modal_form_input]:[height:37px]
  [&_.auth-modal_form_input]:[padding:0_10px] [&_.auth-modal_form_input]:[border:1px_solid_#ffffff22] [&_.auth-modal_form_input]:[border-radius:5px] [&_.auth-modal_form_input]:[outline:0] [&_.auth-modal_form_input]:[background:#12111b]
  [&_.auth-modal_form_input]:[color:#fff] [&_.auth-modal_form_input]:[font-size:var(--font-size-small)] [&_.auth-modal_form_input:focus]:[border-color:#a994ff] [&_.auth-modal_form_input::placeholder]:[color:#777482] [&_.auth-submit]:[height:38px]
  [&_.auth-submit]:[display:flex] [&_.auth-submit]:[align-items:center] [&_.auth-submit]:[justify-content:center] [&_.auth-submit]:[gap:8px] [&_.auth-submit]:[margin-top:3px]
  [&_.auth-submit]:[border:0] [&_.auth-submit]:[border-radius:5px] [&_.auth-submit]:[background:#c6b7ff] [&_.auth-submit]:[color:#251e3c] [&_.auth-submit]:[font-size:10px]
  [&_.auth-submit]:[font-weight:700] [&_.auth-demo-note]:[margin-top:12px] [&_.auth-demo-note]:[color:#9691a2] [&_.auth-demo-note]:[text-align:center] [&_.auth-demo-note]:[font-size:var(--font-size-caption)]
  [&_.auth-switch]:[display:block] [&_.auth-switch]:[margin:13px_auto_0] [&_.auth-switch]:[padding:0] [&_.auth-switch]:[border:0] [&_.auth-switch]:[background:transparent]
  [&_.auth-switch]:[color:#c7b8ff] [&_.auth-switch]:[font-size:var(--font-size-caption)] [@media((max-width:1000px))]:[&_.landing-hero]:[padding-right:6vw] [@media((max-width:1000px))]:[&_.landing-hero]:[padding-left:6vw] [@media((max-width:1000px))]:[&_.hero-scroll]:[left:6vw]
  [@media((max-width:1000px))]:[&_.landing-hero]:[height:calc(100svh_-_90px)] [@media((max-width:1000px))]:[&_.hero-index]:[right:6vw] [@media((max-width:1000px))]:[&_.trust-strip]:[padding-right:6vw] [@media((max-width:1000px))]:[&_.trust-strip]:[padding-left:6vw] [@media((max-width:1000px))]:[&_.landing-section]:[padding-right:6vw] [@media((max-width:1000px))]:[&_.landing-section]:[padding-left:6vw]
  [@media((max-width:1000px))]:[&_.story-section]:[padding-right:6vw] [@media((max-width:1000px))]:[&_.story-section]:[padding-left:6vw] [@media((max-width:1000px))]:[&_.featured-image]:[height:150px] [@media((min-width:1001px))]:[&_.hero-content_h1]:[font-size:clamp(3.25rem,_4.1vw,_4.25rem)] [@media((min-width:1001px))]:[&_.hero-heading-break]:[display:initial]
  [@media((max-width:720px))]:[&_.landing-hero]:[height:calc(100svh_-_80px)] [@media((max-width:720px))]:[&_.landing-hero]:[grid-template-columns:1fr] [@media((max-width:720px))]:[&_.landing-hero]:[gap:15px] [@media((max-width:720px))]:[&_.landing-hero]:[padding:clamp(16px,_4vh,_36px)_23px] [@media((max-width:720px))]:[&_.hero-content]:[grid-column:1]
  [@media((max-width:720px))]:[&_.hero-content]:[max-width:560px] [@media((max-width:720px))]:[&_.hero-content]:[transform:translateY(31px)] [@media((max-width:720px))]:[&_.hero-content_h1]:[margin-top:18px] [@media((max-width:720px))]:[&_.hero-content_h1]:[font-size:clamp(3rem,_12vw,_4.5rem)] [@media((max-width:720px))]:[&_.hero-content_h1]:[letter-spacing:-3px]
  [@media((max-width:720px))]:[&_.hero-description]:[max-width:450px] [@media((max-width:720px))]:[&_.hero-description]:[font-size:12px] [@media((max-width:720px))]:[&_.hero-actions]:[gap:14px] [@media((max-width:720px))]:[&_.hero-scroll]:[left:23px] [@media((max-width:720px))]:[&_.hero-scroll]:[bottom:20px]
  [@media((max-width:720px))]:[&_.hero-index]:[right:23px] [@media((max-width:720px))]:[&_.hero-index]:[bottom:21px] [@media((max-width:720px))]:[&_.trust-strip]:[height:auto] [@media((max-width:720px))]:[&_.trust-strip]:[padding:10px_23px] [@media((max-width:720px))]:[&_.trust-stats]:[flex-wrap:wrap] [@media((max-width:720px))]:[&_.trust-stats]:[justify-content:space-around]
  [@media((max-width:720px))]:[&_.trust-stats]:[row-gap:10px] [@media((max-width:720px))]:[&_.trust-stats_>_i]:[display:none] [@media((max-width:720px))]:[&_.trust-stats_>_div:not(.trust-partner)]:[width:40%] [@media((max-width:720px))]:[&_.trust-stats_>_div:not(.trust-partner)]:[text-align:center] [@media((max-width:720px))]:[&_.trust-partner]:[width:40%]
  [@media((max-width:720px))]:[&_.trust-partner]:[text-align:center] [@media((max-width:720px))]:[&_.trust-partner_strong]:[justify-content:center] [@media((max-width:720px))]:[&_.landing-section]:[padding:62px_23px] [@media((max-width:720px))]:[&_.section-intro]:[align-items:flex-start] [@media((max-width:720px))]:[&_.section-intro]:[flex-direction:column]
  [@media((max-width:720px))]:[&_.section-intro]:[gap:14px] [@media((max-width:720px))]:[&_.section-intro]:[margin-bottom:23px] [@media((max-width:720px))]:[&_.section-intro_>_p]:[width:min(100%,_440px)] [@media((max-width:720px))]:[&_.benefit-grid]:[grid-template-columns:1fr] [@media((max-width:720px))]:[&_.benefit-grid]:[gap:9px]
  [@media((max-width:720px))]:[&_.benefit-card]:[min-height:140px] [@media((max-width:720px))]:[&_.featured-courses]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [@media((max-width:720px))]:[&_.featured-courses]:[gap:9px] [@media((max-width:720px))]:[&_.featured-course:last-child]:[grid-column:1_/_-1] [@media((max-width:720px))]:[&_.featured-course:last-child_.featured-image]:[height:190px]
  [@media((max-width:720px))]:[&_.featured-image]:[height:133px] [@media((max-width:720px))]:[&_.featured-info]:[padding:11px] [@media((max-width:720px))]:[&_.featured-info_h3]:[font-size:var(--font-size-small)] [@media((max-width:720px))]:[&_.featured-meta]:[align-items:flex-start] [@media((max-width:720px))]:[&_.featured-meta]:[gap:6px]
  [@media((max-width:720px))]:[&_.featured-meta]:[font-size:0.6875rem] [@media((max-width:720px))]:[&_.course-bottom-cta]:[align-items:flex-start] [@media((max-width:720px))]:[&_.course-bottom-cta]:[flex-direction:column] [@media((max-width:720px))]:[&_.story-section]:[grid-template-columns:1fr] [@media((max-width:720px))]:[&_.story-section]:[gap:27px]
  [@media((max-width:720px))]:[&_.story-section]:[padding:62px_23px] [@media((max-width:720px))]:[&_.story-image]:[height:265px]
  [@media((max-width:400px))]:[&_.hero-announcement]:[font-size:7px] [@media((max-width:400px))]:[&_.hero-actions]:[align-items:flex-start] [@media((max-width:400px))]:[&_.hero-actions]:[flex-direction:column] [@media((max-width:400px))]:[&_.featured-courses]:[grid-template-columns:1fr] [@media((max-width:400px))]:[&_.featured-course:last-child]:[grid-column:auto]
  [@media((max-width:400px))]:[&_.featured-image]:[height:175px] [@media((max-width:400px))]:[&_.featured-course:last-child_.featured-image]:[height:175px] [&_.hero-content_h1]:[font-size:clamp(2rem,_4.1vw,_4.25rem)] [&_.trust-stats_>_div_>_strong]:[font-size:1.625rem]
  [&_.section-intro_h2]:[font-size:clamp(2rem,_4vw,_2.75rem)] [&_.section-intro_h2]:[line-height:1.15] [&_.story-copy_h2]:[line-height:1.15] [&_.benefit-number]:[font-size:var(--font-size-caption)] [&_.benefit-card_h3]:[font-size:var(--font-size-title)]
  [&_.course-bottom-cta_a]:[font-size:var(--font-size-small)] [&_.featured-info_h3]:[font-size:var(--font-size-title)] [&_.featured-info_h3]:[line-height:1.4] [&_.story-quote_blockquote]:[font-size:var(--font-size-small)] [&_.story-quote_blockquote]:[line-height:1.65]
  [&_.closing-cta_h2]:[line-height:1.12] [&_.auth-modal_h2]:[font-size:var(--font-size-title)] [@media((max-width:720px))]:[&_.section-intro_h2]:[font-size:clamp(1.875rem,_8vw,_2.5rem)] [@media((max-width:720px))]:[&_.story-copy_h2]:[font-size:clamp(1.875rem,_8vw,_2.5rem)]
  [@media((max-height:600px))]:[&_.landing-hero]:[height:calc(100svh_-_90px)] [@media((max-height:600px))]:[&_.landing-hero]:[padding-top:12px] [@media((max-height:600px))]:[&_.landing-hero]:[padding-bottom:12px] [@media((max-height:600px))]:[&_.hero-content]:[transform:none] [@media((max-height:600px))]:[&_.hero-content_h1]:[margin-top:8px]
  [@media((max-height:600px))]:[&_.hero-content_h1]:[margin-bottom:10px] [@media((max-height:600px))]:[&_.hero-content_h1]:[font-size:clamp(2rem,_8vh,_3rem)] [@media((max-height:600px))]:[&_.hero-description]:[font-size:1rem] [@media((max-height:600px))]:[&_.hero-description]:[line-height:1.4] [@media((max-height:600px))]:[&_.hero-actions]:[gap:10px]
  [@media((max-height:600px))]:[&_.hero-actions]:[margin-top:12px] [@media((max-height:600px))]:[&_.hero-scroll]:[bottom:8px] [@media((max-height:600px))]:[&_.hero-index]:[bottom:8px] [@media((max-height:600px)_and_(max-width:720px))]:[&_.landing-hero]:[height:calc(100svh_-_62px)]
`;

function HomePage() {
  const [activeGuidanceSlide, setActiveGuidanceSlide] = useState(0);
  const [pausedCourseVideos, setPausedCourseVideos] = useState({});
  const [authMode, setAuthMode] = useState('');
  const [notice, setNotice] = useState('');
  const partnerTrackRef = useRef(null);
  const courseVideoRefs = useRef([]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return undefined;

    const timer = window.setInterval(() => {
      setActiveGuidanceSlide((current) => (current + 1) % courseGuidanceSlides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  useEffect(() => {
    const track = partnerTrackRef.current;
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const animation = track.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 24000, iterations: Infinity, easing: 'linear' },
    );

    return () => animation.cancel();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const submitAuth = (event) => {
    event.preventDefault();
    setAuthMode('');
    setNotice('Login and account creation will be connected when authentication is added.');
  };

  return (
    <div className={`marketing-page ${homeTailwindStyles}`}>
      <Navbar onAuth={setAuthMode} />

      <main>
        <section className="landing-hero">
          <video
            className="hero-background-video"
            src="/Hero-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-content">
            <h1>Become the <span>architect</span> of ideas<br />and the <span>engineer</span> of<br className="hero-heading-break" /> innovation.</h1>
            <p className="hero-description">Practical courses. Real projects. People who want to see you grow. Build skills for a career that feels like yours.</p>
            <div className="mb-5 mt-5 overflow-hidden py-3">
              <span className="flex items-center gap-2 text-[15px] font-bold text-white">
                In association with
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
                  <Check size={12} aria-hidden="true" /> Verified
                </span>
              </span>
              <div ref={partnerTrackRef} className="mt-3 flex w-max text-white/85" aria-label="Association partners">
                {[0, 1].map((copy) => (
                  <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-x-8 pr-8">
                    <span className="text-[13px] font-bold tracking-[.08em]">AUTODESK</span>
                    <span className="text-[13px] font-bold tracking-[.1em]">NSDC</span>
                    <span className="font-[Manrope] text-[17px] font-extrabold tracking-[-.04em]">CIOB</span>
                    <span className="font-[Manrope] text-[15px] font-semibold tracking-[-.03em]">Bentley</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-actions">
              <a className="hero-primary" href="#courses">Find your course <ArrowRight size={17} /></a>
              <a className="hero-secondary" href="#how-it-works">Contact Us <PhoneCall size={18} /></a>
            </div>
          </div>
          <a href="#courses" className="hero-scroll"><span /> SCROLL TO EXPLORE <ChevronDown size={13} /></a>
        </section>

        <section className="trust-strip" aria-label="Learner outcomes">
          <p>GOOD THINGS HAPPEN WHEN YOU KEEP LEARNING</p>
          <div className="trust-stats"><div><strong>12k<span>+</span></strong><span>curious learners</span></div><i /><div><strong>40<span>+</span></strong><span>expert-led courses</span></div><i /><div><strong>92<span>%</span></strong><span>finish what they start</span></div><i /><div className="trust-partner">BUILT FOR <strong>WHAT'S NEXT <ArrowUpRight size={13} /></strong></div></div>
        </section>

        <section
          className="landing-section learning-section"
          id="how-it-works"
          style={{
            backgroundImage: "linear-gradient(rgba(12, 11, 20, 0.72), rgba(12, 11, 20, 0.72)), url('/learning-section-bg.jpg')",
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            borderBottom: '1px solid rgba(255, 255, 255, 0.28)',
          }}
        >
          <div className="section-intro"><div><h2>Not just more learning.<br /><span>Learning that goes somewhere.</span></h2></div><p>We bring the right people, useful skills, and real practice together—so your next step feels a little closer.</p></div>
          <motion.div
            className="benefit-grid"
            variants={benefitGridVariants}
            initial={shouldReduceMotion ? false : 'hidden'}
            whileInView={shouldReduceMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.2 }}
          >
            {benefits.map(({ icon: Icon, label, title, text, tone }) => (
              <motion.article
                className="benefit-card"
                key={title}
                variants={benefitCardVariants}
                whileHover={shouldReduceMotion ? undefined : { y: -7, scale: 1.015 }}
              >
                <span className="benefit-card-glow" aria-hidden="true" />
                <div className="benefit-card-top">
                  <div className={`benefit-icon ${tone}`}><Icon size={21} strokeWidth={1.8} /></div>
                </div>
                <span className="benefit-card-label">{label}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section
          className="landing-section courses-landing !px-[clamp(20px,7vw,100px)] !py-[72px] max-[720px]:!px-[20px] max-[720px]:!py-[52px]"
          id="courses"
          style={{
            backgroundImage: "linear-gradient(rgba(16, 16, 27, 0.72), rgba(16, 16, 27, 0.72)), url('/courses-section-bg.jpg')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="mx-auto mb-7 max-w-[650px] text-center">
            <div className="mb-3 flex items-center justify-center gap-3 text-base font-bold tracking-[.18em] text-[#f4f1ff]"><span className="h-px w-8 bg-gradient-to-r from-transparent via-[#b6a3ff] to-transparent" /> OUR COURSES <span className="h-px w-8 bg-gradient-to-r from-transparent via-[#b6a3ff] to-transparent" /></div>
            <h2 className="m-0 font-[Manrope] text-[clamp(1.8125rem,4vw,2.75rem)] font-bold leading-[1.12] tracking-[-.045em] text-[#f7f5ff]">The future of AEC begins with you</h2>
            <p className="mx-auto mb-0 mt-3 max-w-[560px] text-base leading-[1.7] text-[#aaa6b8]">Build in-demand skills through practical programs designed for the architecture, engineering, and construction industry.</p>
          </div>

          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1 max-[640px]:gap-5">
            {bimPrograms.map(({ duration, hours, price, rating, description }, index) => (
              <motion.article
                key={duration}
                className="overflow-hidden rounded-xl border border-[#e4e1eb] bg-white text-[#27243a] shadow-[0_18px_55px_#0005] transition-shadow hover:shadow-[0_24px_64px_#0007]"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                whileHover={shouldReduceMotion ? undefined : { y: -5 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : index * 0.08 }}
              >
                <div className="program-image-wrap group/image relative h-[220px] overflow-hidden bg-[#26243c]">
                  {index < 2 ? (
                    <>
                      <video
                        ref={(video) => {
                          courseVideoRefs.current[index] = video;
                        }}
                        className="h-full w-full object-cover"
                        src={`/video/${index + 1}.mp4`}
                        poster={bimProgramImage}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        aria-label={`BIM Professional Program ${duration} preview`}
                      />
                      <button
                        type="button"
                        className="absolute bottom-3 right-3 z-10 grid size-8 place-items-center rounded-full border border-white/35 bg-black/30 text-white/75 shadow-sm backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-black/55 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        aria-label={`${pausedCourseVideos[index] ? 'Play' : 'Pause'} ${duration} course video`}
                        onClick={() => {
                          const video = courseVideoRefs.current[index];
                          if (!video) return;
                          if (video.paused) {
                            void video.play();
                            setPausedCourseVideos((paused) => ({ ...paused, [index]: false }));
                          } else {
                            video.pause();
                            setPausedCourseVideos((paused) => ({ ...paused, [index]: true }));
                          }
                        }}
                      >
                        {pausedCourseVideos[index]
                          ? <Play size={14} fill="currentColor" aria-hidden="true" />
                          : <Pause size={14} aria-hidden="true" />}
                      </button>
                    </>
                  ) : (
                    <img className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/image:scale-110" src={bimProgramImage} alt="" loading="lazy" />
                  )}
                  {index === 2 && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#17162c]/80 via-transparent to-[#17162c]/10" />}
                </div>
                <div className="p-6">
                  <h3 className="m-0 font-[Manrope] text-xl font-bold text-[#24232d]">BIM Professional Program</h3>
                  <p className="mb-0 mt-2 min-h-10 text-sm leading-5 text-[#686674]">{description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-[#686674]" aria-label={`Course rating ${rating} out of 5`}>
                    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, starIndex) => {
                        const fill = Math.max(0, Math.min(1, Number(rating) - starIndex)) * 100;
                        return (
                          <span key={starIndex} className="relative block size-[15px]">
                            <Star size={15} className="absolute inset-0 fill-[#e5e3eb] text-[#d3d0dc]" />
                            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
                              <Star size={15} className="max-w-none fill-amber-400 text-amber-500" />
                            </span>
                          </span>
                        );
                      })}
                    </span>
                    <span className="font-bold text-[#24232d]">{rating}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-3">
                    <div><span className="block text-xs font-bold uppercase tracking-wider text-[#8e899b]">Course hours</span><span className="mt-1 block text-sm font-semibold text-[#353342]">{hours}</span></div>
                    <div><span className="block text-xs font-bold uppercase tracking-wider text-[#8e899b]">Duration</span><span className="mt-1 block text-sm font-semibold text-[#353342]">{duration}</span></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="mt-1 block text-xl font-bold text-[#24232d]">{price}</span>
                    </div>
                    <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d9d5e5] bg-white px-4 text-sm font-bold !text-black transition-colors hover:bg-[#f3f2f7]" href="/dashboard">
                      Enroll now <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-[920px]">
            <div className="mb-5 text-center">
              <h3 className="m-0 font-[Manrope] text-xl font-bold tracking-tight text-[#f4f1ff]">Skill development that drives results</h3>
              <p className="mb-0 mt-2 text-sm text-[#aaa6b8]">Make today’s most in-demand skills work for your next career move.</p>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 max-[720px]:grid-cols-1 max-[720px]:gap-4">
              {courseOutcomes.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-lg border border-white/[0.08] bg-[#14141f] p-4">
                  <Icon className="text-[#36d6b1]" size={19} aria-hidden="true" />
                  <h4 className="mb-1 mt-3 text-base font-bold text-white">{title}</h4>
                  <p className="m-0 text-sm leading-relaxed text-[#aaa7b5]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="story-section" id="stories">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85" alt="Learners sharing ideas around a table" /></div>
          <div className="story-copy"><div className="landing-kicker"><span /> MADE FOR YOUR MOMENT</div><h2>Your next chapter<br />doesn’t write <span>itself.</span></h2><p>Start with one skill. Find your people. Make a little progress every week. You don’t need it all figured out to begin.</p><div className="story-quote"><div className="quote-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><blockquote>“I stopped waiting until I felt ready. The projects helped me prove I already was.”</blockquote><span>RIYA M. · PRODUCT DESIGNER</span></div><a href="/dashboard" className="story-link">Start learning <ArrowRight size={15} /></a></div>
        </section>

        <motion.section
          className="relative overflow-hidden px-[clamp(25px,9.2vw,145px)] py-12 max-[720px]:px-[23px] max-[720px]:py-8"
          style={{
            backgroundColor: '#10101b',
          }}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
            <div
              className="pointer-events-none absolute inset-[-12px] scale-[1.03] bg-cover bg-center blur-[8px]"
              style={{
                backgroundImage: 'linear-gradient(rgba(16, 16, 27, 0.72), rgba(16, 16, 27, 0.72)), url("/course-guidance-bg.jpg")',
              }}
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#7c5cff]/15 blur-[90px]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-28 right-0 size-96 rounded-full bg-[#2fd4b8]/10 blur-[110px]" aria-hidden="true" />

            <div className="relative z-10 grid grid-cols-[1.05fr_.95fr] items-center gap-10 py-8 max-[960px]:grid-cols-1 max-[960px]:gap-8 max-[720px]:py-4">
              <div>
                <h2 className="mb-0 font-[Manrope] text-[clamp(1.8rem,3.6vw,2.7rem)] font-bold leading-[1.12] tracking-[-.045em] text-white">
                  Not sure where to begin?{' '}
                  <span className="bg-gradient-to-r from-[#c4b3ff] to-[#7ae8d5] bg-clip-text text-transparent">
                    We’ll map your path.
                  </span>
                </h2>
                <p className="mb-0 mt-4 max-w-[540px] text-base leading-[1.75] text-[#c5c1d3]">
                  Tell us what you want to learn and where you’re starting from. Our team can help
                  you find a program that fits your experience and career goals.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href="https://wa.me/?text=Hi%2C%20I%27d%20like%20help%20choosing%20a%20course%20that%20fits%20my%20goals."
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-white px-6 text-sm font-bold !text-[#49358a] shadow-[0_10px_30px_#0003] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f1edff] hover:shadow-[0_14px_36px_#0005] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white max-[480px]:w-full max-[480px]:justify-center"
                  >
                    <PhoneCall size={17} aria-hidden="true" />
                    Request a call
                  </a>
                  <a
                    href="#courses"
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-5 text-sm font-semibold !text-[#e6e1ff] transition-colors hover:border-white/40 hover:bg-white/10 max-[480px]:w-full max-[480px]:justify-center"
                  >
                    Explore programs
                  </a>
                </div>
              </div>

              <div
                className="relative aspect-[4/3] min-h-[250px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b13] shadow-[0_18px_48px_#0005] max-[960px]:aspect-[16/8] max-[720px]:aspect-[4/3]"
                role="region"
                aria-label="Course guidance image carousel"
                aria-roledescription="carousel"
              >
                <AnimatePresence initial={false} mode="sync">
                  <motion.img
                    key={courseGuidanceSlides[activeGuidanceSlide].src}
                    src={courseGuidanceSlides[activeGuidanceSlide].src}
                    alt={courseGuidanceSlides[activeGuidanceSlide].alt}
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={shouldReduceMotion ? false : { x: '100%' }}
                    animate={{ x: 0 }}
                    exit={shouldReduceMotion ? undefined : { x: '-100%' }}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
                    draggable="false"
                  />
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080813]/55 to-transparent" aria-hidden="true" />
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2" role="group" aria-label="Choose a course guidance image">
                  {courseGuidanceSlides.map((slide, index) => (
                    <button
                      key={slide.src}
                      type="button"
                      className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${activeGuidanceSlide === index ? 'w-8 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/90'}`}
                      aria-label={`Show image ${index + 1}`}
                      aria-pressed={activeGuidanceSlide === index}
                      onClick={() => setActiveGuidanceSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
        </motion.section>

      </main>

      <a
        className="fixed bottom-5 right-16 z-30 block size-16 max-w-[42vw] overflow-hidden rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_24px_#25d36699] active:scale-95 max-[720px]:bottom-5 max-[720px]:right-16"
        href="https://wa.me/?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20your%20courses."
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <video className="block h-full w-full scale-[1.8] object-cover object-center" src="/Whatsapp.mp4" autoPlay loop muted playsInline aria-hidden="true" />
      </a>

      <Footer />

      {notice && <div className="marketing-toast"><Check size={16} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}
      {authMode && <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthMode(''); }}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" aria-label="Close dialog" onClick={() => setAuthMode('')}><X size={17} /></button><div className="auth-symbol"><GraduationCap size={22} /></div><div className="landing-kicker"><span /> YOUR NEXT CHAPTER</div><h2 id="auth-title">{authMode === 'login' ? 'Welcome back.' : 'Make room for what’s next.'}</h2><p>{authMode === 'login' ? 'Pick up right where you left off.' : 'Create your free account and start exploring.'}</p><form onSubmit={submitAuth}><label>Email address<input type="email" placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input type="password" placeholder="At least 8 characters" minLength="8" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required /></label><button className="auth-submit" type="submit">{authMode === 'login' ? 'Login' : 'Join now'} <ArrowRight size={15} /></button></form><div className="auth-demo-note">Demo form only — account authentication isn’t connected yet.</div><button className="auth-switch" onClick={() => setAuthMode(authMode === 'login' ? 'join' : 'login')}>{authMode === 'login' ? 'New to Skillpath? Join now' : 'Already learning with us? Login'}</button></section></div>}
    </div>
  );
}

export default HomePage;