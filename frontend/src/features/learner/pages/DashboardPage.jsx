import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, Bell, BookOpen, Check, ChevronDown, ChevronRight,
  Clock3, Compass, CreditCard, GraduationCap, LayoutDashboard, Menu, MoreHorizontal,
  Play, Search, ShieldCheck, Sparkles, Star, Video, X,
} from 'lucide-react';
import CourseCard from '../../courses/components/CourseCard.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getJson, postJson } from '../../../services/api.js';

const dashboardTailwindStyles = `
  [&]:[--font-size-caption:0.75rem] [&]:[--font-size-small:0.875rem] [&]:[--font-size-body:1rem] [&]:[--font-size-lead:1.125rem] [&]:[--font-size-title:1.375rem]
  [&]:[--font-size-heading:2rem] [&]:[--font-size-display:clamp(3rem,_6vw,_4.75rem)] [&]:[--line-height-body:1.65] [&]:[--line-height-heading:1.2] [&]:[font-size:var(--font-size-body)]
  [&]:[line-height:var(--line-height-body)] [&]:[font-family:'DM_Sans',_sans-serif] [&]:[color:#24252d] [&]:[background:#f6f7fb] [&]:[font-synthesis:none]
  [&]:[text-rendering:optimizeLegibility] [&]:[-webkit-font-smoothing:antialiased] [&]:[--ink:#24252d] [&]:[--muted:#8d8f9b] [&]:[--purple:#7658e8]
  [&]:[--line:#ececf2] [&]:[--surface:#fff] [&]:[box-sizing:border-box] [&]:[margin:0] [&]:[min-width:0] [&]:[overflow-x:hidden]
  [&]:[min-height:100vh] [&_button]:[font:inherit] [&_input]:[font:inherit] [&_button]:[cursor:pointer] [&_button:focus-visible]:[outline:3px_solid_#aa9bff]
  [&_button:focus-visible]:[outline-offset:2px] [&_input:focus-visible]:[outline:3px_solid_#aa9bff] [&_input:focus-visible]:[outline-offset:2px] [&_.sidebar]:[width:248px] [&_.sidebar]:[position:fixed]
  [&_.sidebar]:[inset:0_auto_0_0] [&_.sidebar]:[z-index:20] [&_.sidebar]:[background:#fff] [&_.sidebar]:[border-right:1px_solid_#ededf1] [&_.sidebar]:[padding:27px_17px_17px]
  [&_.sidebar]:[display:flex] [&_.sidebar]:[flex-direction:column] [&_.brand]:[display:flex] [&_.brand]:[align-items:center] [&_.brand]:[gap:10px]
  [&_.brand]:[padding:0_9px] [&_.brand]:[color:#282632] [&_.brand]:[font:800_20px_Manrope,_sans-serif] [&_.brand]:[letter-spacing:-1px] [&_.brand]:[text-decoration:none]
  [&_.brand-mark]:[width:31px] [&_.brand-mark]:[height:31px] [&_.brand-mark]:[display:grid] [&_.brand-mark]:[place-items:center] [&_.brand-mark]:[color:white]
  [&_.brand-mark]:[background:#7658e8] [&_.brand-mark]:[border-radius:10px] [&_.brand-dot]:[color:#7658e8] [&_.sidebar-label]:[font-size:0.6875rem] [&_.sidebar-label]:[font-weight:700]
  [&_.sidebar-label]:[color:#a4a4b0] [&_.sidebar-label]:[letter-spacing:1.3px] [&_.sidebar-label]:[margin:44px_10px_12px] [&_.side-nav]:[display:grid] [&_.side-nav]:[gap:4px]
  [&_.nav-item]:[width:100%] [&_.nav-item]:[display:flex] [&_.nav-item]:[align-items:center] [&_.nav-item]:[gap:12px] [&_.nav-item]:[min-height:42px]
  [&_.nav-item]:[border:0] [&_.nav-item]:[padding:0_11px] [&_.nav-item]:[background:transparent] [&_.nav-item]:[color:#777987] [&_.nav-item]:[text-align:left]
  [&_.nav-item]:[font-size:var(--font-size-small)] [&_.nav-item]:[font-weight:500] [&_.nav-item]:[border-radius:8px] [&_.nav-item]:[transition:background_.16s,_color_.16s] [&_.nav-item:hover]:[background:#f8f7fd]
  [&_.nav-item:hover]:[color:#5141ae] [&_.nav-item.active]:[background:#f0edff] [&_.nav-item.active]:[color:#684ce2] [&_.nav-item.active]:[font-weight:700] [&_.nav-count]:[margin-left:auto]
  [&_.nav-count]:[font-size:var(--font-size-caption)] [&_.nav-count]:[min-width:19px] [&_.nav-count]:[height:19px] [&_.nav-count]:[border-radius:6px] [&_.nav-count]:[background:#fbe9e6]
  [&_.nav-count]:[color:#e27164] [&_.nav-count]:[display:grid] [&_.nav-count]:[place-items:center] [&_.category-label]:[margin-top:37px] [&_.category-nav_.nav-item]:[min-height:39px]
  [&_.sidebar-spacer]:[flex:1] [&_.sidebar-spacer]:[min-height:24px] [&_.help-card]:[border:1px_solid_#eeecf5] [&_.help-card]:[background:linear-gradient(140deg,_#fcfbff,_#f8f6ff)] [&_.help-card]:[border-radius:11px]
  [&_.help-card]:[padding:14px_13px_12px] [&_.help-card]:[margin:0_2px_17px] [&_.help-icon]:[width:29px] [&_.help-icon]:[height:29px] [&_.help-icon]:[display:grid]
  [&_.help-icon]:[place-items:center] [&_.help-icon]:[border-radius:8px] [&_.help-icon]:[background:#ede8ff] [&_.help-icon]:[color:#7658e8] [&_.help-icon]:[margin-bottom:10px]
  [&_.help-card_strong]:[display:block] [&_.help-card_strong]:[font-size:var(--font-size-small)] [&_.help-card_p]:[color:#8d8b98] [&_.help-card_p]:[font-size:var(--font-size-caption)] [&_.help-card_p]:[margin:5px_0_10px]
  [&_.help-card_button]:[padding:0] [&_.help-card_button]:[border:0] [&_.help-card_button]:[color:#6f54db] [&_.help-card_button]:[background:none] [&_.help-card_button]:[font-size:var(--font-size-small)]
  [&_.help-card_button]:[font-weight:700] [&_.help-card_button]:[display:flex] [&_.help-card_button]:[align-items:center] [&_.help-card_button]:[gap:5px] [&_.profile-button]:[display:flex]
  [&_.profile-button]:[align-items:center] [&_.profile-button]:[text-align:left] [&_.profile-button]:[width:100%] [&_.profile-button]:[border:0] [&_.profile-button]:[border-top:1px_solid_#efeff3]
  [&_.profile-button]:[padding:15px_3px_1px] [&_.profile-button]:[background:transparent] [&_.avatar]:[flex:0_0_auto] [&_.avatar]:[display:grid] [&_.avatar]:[place-items:center]
  [&_.avatar]:[font-weight:700] [&_.avatar]:[color:#6c55c9] [&_.avatar]:[background:#ece8ff] [&_.avatar]:[border-radius:50%] [&_.avatar-user]:[color:#a24f44]
  [&_.avatar-user]:[background:#fce4dd] [&_.profile-button_.avatar]:[width:33px] [&_.profile-button_.avatar]:[height:33px] [&_.profile-button_.avatar]:[font-size:0.6875rem] [&_.profile-copy]:[display:grid]
  [&_.profile-copy]:[gap:3px] [&_.profile-copy]:[margin-left:9px] [&_.profile-copy_strong]:[font-size:var(--font-size-small)] [&_.profile-copy_span]:[color:#a0a0aa] [&_.profile-copy_span]:[font-size:var(--font-size-caption)]
  [&_.profile-more]:[margin-left:auto] [&_.profile-more]:[color:#9999a4] [&_.main-content]:[margin-left:248px] [&_.main-content]:[min-height:100vh] [&_.topbar]:[height:68px]
  [&_.topbar]:[padding:0_45px] [&_.topbar]:[display:flex] [&_.topbar]:[justify-content:space-between] [&_.topbar]:[align-items:center] [&_.topbar]:[border-bottom:1px_solid_#ececf1]
  [&_.topbar]:[background:rgba(255,255,255,.77)] [&_.breadcrumbs]:[display:flex] [&_.breadcrumbs]:[align-items:center] [&_.breadcrumbs]:[gap:9px] [&_.breadcrumbs]:[font-size:var(--font-size-small)]
  [&_.breadcrumbs]:[color:#a0a0a9] [&_.breadcrumbs_svg]:[color:#c1c1c9] [&_.breadcrumbs_strong]:[color:#44444d] [&_.breadcrumbs_strong]:[font-weight:600] [&_.topbar-actions]:[display:flex]
  [&_.topbar-actions]:[align-items:center] [&_.topbar-actions]:[gap:20px] [&_.top-search]:[height:35px] [&_.top-search]:[width:240px] [&_.top-search]:[padding:0_10px]
  [&_.top-search]:[display:flex] [&_.top-search]:[align-items:center] [&_.top-search]:[gap:8px] [&_.top-search]:[border:1px_solid_#ececf1] [&_.top-search]:[background:#fff]
  [&_.top-search]:[border-radius:7px] [&_.top-search]:[color:#9696a1] [&_.top-search_input]:[width:100%] [&_.top-search_input]:[min-width:0] [&_.top-search_input]:[border:0]
  [&_.top-search_input]:[outline:0] [&_.top-search_input]:[font-size:var(--font-size-small)] [&_.top-search_input]:[color:#444] [&_.top-search_input]:[background:transparent] [&_.top-search_input::placeholder]:[color:#a7a7b0]
  [&_.top-search_kbd]:[white-space:nowrap] [&_.top-search_kbd]:[border:1px_solid_#e8e8ed] [&_.top-search_kbd]:[border-radius:4px] [&_.top-search_kbd]:[padding:2px_4px] [&_.top-search_kbd]:[font:9px_'DM_Sans',_sans-serif]
  [&_.top-search_kbd]:[color:#a3a3ad] [&_.icon-button]:[border:0] [&_.icon-button]:[background:transparent] [&_.icon-button]:[display:grid] [&_.icon-button]:[place-items:center]
  [&_.icon-button]:[color:#747580] [&_.notification-button]:[position:relative] [&_.notification-button_i]:[position:absolute] [&_.notification-button_i]:[width:5px] [&_.notification-button_i]:[height:5px]
  [&_.notification-button_i]:[border:1px_solid_white] [&_.notification-button_i]:[border-radius:50%] [&_.notification-button_i]:[background:#e5796d] [&_.notification-button_i]:[right:0] [&_.notification-button_i]:[top:0]
  [&_.top-avatar]:[width:30px] [&_.top-avatar]:[height:30px] [&_.top-avatar]:[font-size:9px] [&_.mobile-menu]:[display:none] [&_.page-wrap]:[max-width:1510px]
  [&_.page-wrap]:[margin:0_auto] [&_.page-wrap]:[padding:30px_45px_20px] [&_.welcome-row]:[display:flex] [&_.welcome-row]:[align-items:flex-end] [&_.welcome-row]:[justify-content:space-between]
  [&_.welcome-row]:[margin-bottom:23px] [&_.eyebrow]:[color:#9898a5] [&_.eyebrow]:[font-size:0.6875rem] [&_.eyebrow]:[font-weight:700] [&_.eyebrow]:[letter-spacing:1.2px]
  [&_.section-kicker]:[color:#9898a5] [&_.section-kicker]:[font-size:0.6875rem] [&_.section-kicker]:[font-weight:700] [&_.section-kicker]:[letter-spacing:1.2px] [&_.eyebrow]:[display:flex]
  [&_.eyebrow]:[align-items:center] [&_.eyebrow]:[gap:7px] [&_.eyebrow-line]:[width:15px] [&_.eyebrow-line]:[height:1px] [&_.eyebrow-line]:[background:#8c79e9]
  [&_h1]:[margin-top:0] [&_h2]:[margin-top:0] [&_h3]:[margin-top:0] [&_p]:[margin-top:0] [&_h1]:[margin:8px_0_5px]
  [&_h1]:[font:700_26px_Manrope,_sans-serif] [&_h1]:[letter-spacing:-1.05px] [&_.wave]:[color:#ecb458] [&_.wave]:[font-size:1.5rem] [&_.wave]:[vertical-align:2px]
  [&_.welcome-subtitle]:[color:#9697a1] [&_.welcome-subtitle]:[font-size:var(--font-size-caption)] [&_.welcome-subtitle]:[margin:0] [&_.outline-button]:[height:35px] [&_.outline-button]:[display:flex]
  [&_.outline-button]:[align-items:center] [&_.outline-button]:[gap:8px] [&_.outline-button]:[padding:0_12px] [&_.outline-button]:[border:1px_solid_#e9e7f2] [&_.outline-button]:[border-radius:7px]
  [&_.outline-button]:[background:#fff] [&_.outline-button]:[color:#5f5e68] [&_.outline-button]:[font-size:var(--font-size-small)] [&_.outline-button]:[font-weight:600] [&_.outline-button:hover]:[border-color:#bfb2f8]
  [&_.outline-button:hover]:[color:#684ce2] [&_.stats-grid]:[display:grid] [&_.stats-grid]:[grid-template-columns:repeat(4,_minmax(0,_1fr))] [&_.stats-grid]:[gap:12px] [&_.stats-grid]:[margin-bottom:21px]
  [&_.stat-card]:[min-height:112px] [&_.stat-card]:[padding:13px_14px_11px] [&_.stat-card]:[border:1px_solid_#ececf2] [&_.stat-card]:[border-radius:9px] [&_.stat-card]:[background:#fff]
  [&_.stat-primary]:[background:#f6f4ff] [&_.stat-primary]:[border-color:#ebe6ff] [&_.stat-top]:[display:flex] [&_.stat-top]:[align-items:center] [&_.stat-top]:[justify-content:space-between]
  [&_.stat-top]:[color:#777984] [&_.stat-top]:[font-size:var(--font-size-caption)] [&_.stat-icon]:[width:27px] [&_.stat-icon]:[height:27px] [&_.stat-icon]:[display:grid]
  [&_.stat-icon]:[place-items:center] [&_.stat-icon]:[border-radius:7px] [&_.stat-icon]:[color:#6e52df] [&_.stat-icon]:[background:#e9e4ff] [&_.stat-icon-lavender]:[color:#b16db8]
  [&_.stat-icon-lavender]:[background:#faeefa] [&_.stat-icon-peach]:[color:#df8965] [&_.stat-icon-peach]:[background:#fff0e8] [&_.stat-icon-yellow]:[color:#d29d3f] [&_.stat-icon-yellow]:[background:#fff4d9]
  [&_.stat-value]:[margin-top:5px] [&_.stat-value]:[color:#292a32] [&_.stat-value]:[font:700_25px_Manrope,_sans-serif] [&_.stat-value]:[letter-spacing:-.8px] [&_.stat-total]:[color:#aaaab4]
  [&_.stat-total]:[font:500_11px_'DM_Sans',_sans-serif] [&_.stat-total]:[letter-spacing:0] [&_.stat-unit]:[color:#aaaab4] [&_.stat-unit]:[font:500_11px_'DM_Sans',_sans-serif] [&_.stat-unit]:[letter-spacing:0]
  [&_.stat-footer]:[display:flex] [&_.stat-footer]:[align-items:center] [&_.stat-footer]:[gap:7px] [&_.stat-footer]:[margin-top:2px] [&_.stat-footer]:[color:#a0a0aa]
  [&_.stat-footer]:[font-size:var(--font-size-caption)] [&_.trend]:[color:#6f54dd] [&_.trend]:[font-weight:600] [&_.trend]:[display:flex] [&_.trend]:[align-items:center]
  [&_.trend]:[gap:2px] [&_.trend.positive]:[color:#51a67b] [&_.trend.neutral]:[color:#d69552] [&_.streak-dots]:[display:flex] [&_.streak-dots]:[gap:7px]
  [&_.streak-dots]:[margin-top:5px] [&_.streak-dots_div]:[display:grid] [&_.streak-dots_div]:[justify-items:center] [&_.streak-dots_div]:[gap:3px] [&_.streak-dots_div]:[color:#aaaab3]
  [&_.streak-dots_div]:[font-size:0.6875rem] [&_.streak-dots_b]:[display:grid] [&_.streak-dots_b]:[place-items:center] [&_.streak-dots_b]:[width:15px] [&_.streak-dots_b]:[height:15px]
  [&_.streak-dots_b]:[border-radius:50%] [&_.streak-dots_b]:[background:#f1f0f5] [&_.streak-dots_.day-done]:[color:#ce9c39] [&_.streak-dots_.day-done_b]:[background:#fff0c8] [&_.promo-banner]:[height:211px]
  [&_.promo-banner]:[position:relative] [&_.promo-banner]:[overflow:hidden] [&_.promo-banner]:[border-radius:11px] [&_.promo-banner]:[margin-bottom:28px] [&_.promo-banner]:[color:#fff]
  [&_.promo-banner]:[background:#29233d] [&_.promo-banner::before]:[content:''] [&_.promo-banner::before]:[position:absolute] [&_.promo-banner::before]:[width:400px] [&_.promo-banner::before]:[height:400px]
  [&_.promo-banner::before]:[top:-250px] [&_.promo-banner::before]:[right:10%] [&_.promo-banner::before]:[border:1px_solid_rgba(255,255,255,.06)] [&_.promo-banner::before]:[border-radius:50%] [&_.promo-banner::before]:[box-shadow:0_0_0_34px_rgba(255,255,255,.025),_0_0_0_75px_rgba(255,255,255,.025)]
  [&_.promo-copy]:[position:relative] [&_.promo-copy]:[z-index:2] [&_.promo-copy]:[padding:19px_25px] [&_.promo-tag]:[display:flex] [&_.promo-tag]:[gap:6px]
  [&_.promo-tag]:[align-items:center] [&_.promo-tag]:[color:#ccbaff] [&_.promo-tag]:[font-size:0.6875rem] [&_.promo-tag]:[font-weight:700] [&_.promo-tag]:[letter-spacing:1px]
  [&_.promo-copy_h2]:[margin:9px_0_6px] [&_.promo-copy_h2]:[font:700_23px/1.1_Manrope,_sans-serif] [&_.promo-copy_h2]:[letter-spacing:-.7px] [&_.promo-copy_h2_em]:[color:#c3aeff] [&_.promo-copy_h2_em]:[font-style:normal]
  [&_.promo-copy_p]:[margin:0_0_10px] [&_.promo-copy_p]:[color:#c1bdcc] [&_.promo-copy_p]:[font-size:var(--font-size-caption)] [&_.promo-copy_p]:[line-height:1.6] [&_.promo-button]:[height:27px]
  [&_.promo-button]:[display:flex] [&_.promo-button]:[align-items:center] [&_.promo-button]:[gap:9px] [&_.promo-button]:[border:0] [&_.promo-button]:[border-radius:5px]
  [&_.promo-button]:[background:#f3edff] [&_.promo-button]:[color:#4c3a95] [&_.promo-button]:[padding:0_10px] [&_.promo-button]:[font-size:var(--font-size-caption)] [&_.promo-button]:[font-weight:700]
  [&_.promo-button:hover]:[background:#fff] [&_.promo-art]:[position:absolute] [&_.promo-art]:[width:50%] [&_.promo-art]:[height:100%] [&_.promo-art]:[right:2%]
  [&_.promo-art]:[top:0] [&_.promo-art]:[display:grid] [&_.promo-art]:[place-items:center] [&_.art-orbit]:[position:absolute] [&_.art-orbit]:[border:1px_solid_rgba(188,170,255,.22)]
  [&_.art-orbit]:[border-radius:50%] [&_.art-orbit]:[transform:rotate(-24deg)] [&_.orbit-one]:[width:250px] [&_.orbit-one]:[height:133px] [&_.orbit-two]:[width:310px]
  [&_.orbit-two]:[height:165px] [&_.orbit-two]:[transform:rotate(27deg)] [&_.art-circle]:[width:127px] [&_.art-circle]:[height:127px] [&_.art-circle]:[display:grid]
  [&_.art-circle]:[place-items:center] [&_.art-circle]:[color:#f6d69e] [&_.art-circle]:[border:1px_solid_rgba(255,255,255,.24)] [&_.art-circle]:[border-radius:38%_62%_56%_44%_/_44%_43%_57%_56%] [&_.art-circle]:[background:linear-gradient(145deg,_#7160ad,_#4a426a)]
  [&_.art-circle]:[box-shadow:0_17px_50px_#18152780] [&_.art-circle]:[transform:rotate(-8deg)] [&_.art-circle_svg]:[transform:rotate(8deg)] [&_.art-pill]:[position:absolute] [&_.art-pill]:[display:flex]
  [&_.art-pill]:[align-items:center] [&_.art-pill]:[gap:6px] [&_.art-pill]:[padding:8px_11px] [&_.art-pill]:[border:1px_solid_rgba(255,255,255,.15)] [&_.art-pill]:[border-radius:7px]
  [&_.art-pill]:[background:#ffffff16] [&_.art-pill]:[backdrop-filter:blur(7px)] [&_.art-pill]:[color:#f3eaff] [&_.art-pill]:[font-size:9px] [&_.pill-one]:[top:36px]
  [&_.pill-one]:[right:12%] [&_.pill-one_svg]:[color:#e7be78] [&_.pill-two]:[bottom:35px] [&_.pill-two]:[left:18%] [&_.pill-two_svg]:[color:#f4c368]
  [&_.art-sparkle]:[position:absolute] [&_.art-sparkle]:[color:#e7c288] [&_.spark-one]:[top:41px] [&_.spark-one]:[left:28%] [&_.spark-one]:[font-size:17px]
  [&_.spark-two]:[right:18%] [&_.spark-two]:[bottom:38px] [&_.spark-two]:[font-size:22px] [&_.spark-two]:[color:#bca9ff] [&_.spark-three]:[left:12%]
  [&_.spark-three]:[top:88px] [&_.spark-three]:[font-size:16px] [&_.promo-bottom]:[position:absolute] [&_.promo-bottom]:[right:22px] [&_.promo-bottom]:[bottom:11px]
  [&_.promo-bottom]:[left:25px] [&_.promo-bottom]:[display:flex] [&_.promo-bottom]:[justify-content:space-between] [&_.promo-bottom]:[color:#918ca1] [&_.promo-bottom]:[font-size:0.625rem]
  [&_.promo-bottom]:[font-weight:600] [&_.promo-bottom]:[letter-spacing:1.1px] [&_.content-grid]:[display:grid] [&_.content-grid]:[grid-template-columns:minmax(0,_1.65fr)_minmax(275px,_.87fr)] [&_.content-grid]:[gap:22px]
  [&_.content-grid]:[align-items:start] [&_.section-heading]:[display:flex] [&_.section-heading]:[align-items:flex-end] [&_.section-heading]:[justify-content:space-between] [&_.section-heading]:[margin-bottom:15px]
  [&_.section-heading_h2]:[margin:5px_0_0] [&_.section-heading_h2]:[font:700_17px_Manrope,_sans-serif] [&_.section-heading_h2]:[letter-spacing:-.5px] [&_.live-heading_h2]:[margin:5px_0_0] [&_.live-heading_h2]:[font:700_17px_Manrope,_sans-serif]
  [&_.live-heading_h2]:[letter-spacing:-.5px] [&_.text-link]:[display:flex] [&_.text-link]:[gap:6px] [&_.text-link]:[align-items:center] [&_.text-link]:[padding:0_0_2px]
  [&_.text-link]:[color:#7154dd] [&_.text-link]:[border:0] [&_.text-link]:[background:none] [&_.text-link]:[font-size:var(--font-size-caption)] [&_.text-link]:[font-weight:700]
  [&_.course-controls]:[display:flex] [&_.course-controls]:[justify-content:space-between] [&_.course-controls]:[align-items:center] [&_.course-controls]:[margin-bottom:13px] [&_.filter-tabs]:[display:flex]
  [&_.filter-tabs]:[gap:16px] [&_.filter-tabs_button]:[display:flex] [&_.filter-tabs_button]:[gap:6px] [&_.filter-tabs_button]:[align-items:center] [&_.filter-tabs_button]:[padding:0_0_6px]
  [&_.filter-tabs_button]:[border:0] [&_.filter-tabs_button]:[border-bottom:2px_solid_transparent] [&_.filter-tabs_button]:[background:transparent] [&_.filter-tabs_button]:[color:#9a9aa5] [&_.filter-tabs_button]:[font-size:var(--font-size-caption)]
  [&_.filter-tabs_button.selected]:[color:#5c43cf] [&_.filter-tabs_button.selected]:[border-color:#7256e3] [&_.filter-tabs_button.selected]:[font-weight:700] [&_.filter-tabs_button_span]:[min-width:16px] [&_.filter-tabs_button_span]:[padding:2px_4px]
  [&_.filter-tabs_button_span]:[border-radius:5px] [&_.filter-tabs_button_span]:[background:#f0edff] [&_.filter-tabs_button_span]:[font-size:0.6875rem] [&_.filter-tabs_button_span]:[text-align:center] [&_.filter-wrap]:[position:relative]
  [&_.filter-button]:[display:flex] [&_.filter-button]:[align-items:center] [&_.filter-button]:[gap:8px] [&_.filter-button]:[padding:6px_8px] [&_.filter-button]:[border:1px_solid_#ececf1]
  [&_.filter-button]:[border-radius:6px] [&_.filter-button]:[color:#71727d] [&_.filter-button]:[background:#fff] [&_.filter-button]:[font-size:var(--font-size-caption)] [&_.filter-menu]:[position:absolute]
  [&_.filter-menu]:[z-index:5] [&_.filter-menu]:[top:calc(100%_+_4px)] [&_.filter-menu]:[right:0] [&_.filter-menu]:[width:140px] [&_.filter-menu]:[padding:4px]
  [&_.filter-menu]:[border:1px_solid_#ececf2] [&_.filter-menu]:[border-radius:7px] [&_.filter-menu]:[background:#fff] [&_.filter-menu]:[box-shadow:0_8px_25px_#27233b14] [&_.filter-menu_button]:[display:flex]
  [&_.filter-menu_button]:[width:100%] [&_.filter-menu_button]:[align-items:center] [&_.filter-menu_button]:[justify-content:space-between] [&_.filter-menu_button]:[border:0] [&_.filter-menu_button]:[border-radius:4px]
  [&_.filter-menu_button]:[padding:8px] [&_.filter-menu_button]:[background:transparent] [&_.filter-menu_button]:[color:#666773] [&_.filter-menu_button]:[text-align:left] [&_.filter-menu_button]:[font-size:var(--font-size-caption)]
  [&_.filter-menu_button:hover]:[background:#f6f4ff] [&_.course-grid]:[display:grid] [&_.course-grid]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [&_.course-grid]:[gap:13px] [&_.course-card]:[overflow:hidden]
  [&_.course-card]:[min-width:0] [&_.course-card]:[border:1px_solid_#ececf1] [&_.course-card]:[border-radius:9px] [&_.course-card]:[background:#fff] [&_.course-card]:[transition:transform_.18s,_box-shadow_.18s]
  [&_.course-card:hover]:[transform:translateY(-2px)] [&_.course-card:hover]:[box-shadow:0_10px_25px_#2c24430d] [&_.course-image-wrap]:[height:117px] [&_.course-image-wrap]:[position:relative] [&_.course-image-wrap]:[overflow:hidden]
  [&_.course-image-wrap]:[background:#efedf4] [&_.course-image]:[width:100%] [&_.course-image]:[height:100%] [&_.course-image]:[display:block] [&_.course-image]:[object-fit:cover]
  [&_.course-image]:[transition:transform_.3s] [&_.course-card:hover_.course-image]:[transform:scale(1.04)] [&_.course-image-wrap::after]:[content:''] [&_.course-image-wrap::after]:[position:absolute] [&_.course-image-wrap::after]:[inset:45%_0_0]
  [&_.course-image-wrap::after]:[background:linear-gradient(transparent,_#10101840)] [&_.course-image-wrap::after]:[pointer-events:none] [&_.course-category]:[position:absolute] [&_.course-category]:[z-index:1] [&_.course-category]:[top:9px]
  [&_.course-category]:[left:9px] [&_.course-category]:[padding:4px_7px] [&_.course-category]:[border-radius:4px] [&_.course-category]:[font-size:0.6875rem] [&_.course-category]:[font-weight:700]
  [&_.course-category.lavender]:[background:#efe8ff] [&_.course-category.lavender]:[color:#6747c9] [&_.course-category.mint]:[background:#e1f4e9] [&_.course-category.mint]:[color:#32835f] [&_.course-category.peach]:[background:#ffede3]
  [&_.course-category.peach]:[color:#bd7252] [&_.course-category.blue]:[background:#e1efff] [&_.course-category.blue]:[color:#4678ad] [&_.course-category.yellow]:[background:#fff2d6] [&_.course-category.yellow]:[color:#b0872e]
  [&_.course-more]:[position:absolute] [&_.course-more]:[z-index:2] [&_.course-more]:[top:7px] [&_.course-more]:[right:8px] [&_.course-more]:[width:26px]
  [&_.course-more]:[height:26px] [&_.course-more]:[display:grid] [&_.course-more]:[place-items:center] [&_.course-more]:[border:0] [&_.course-more]:[border-radius:6px]
  [&_.course-more]:[background:#ffffffdb] [&_.course-more]:[color:#646570] [&_.course-body]:[padding:11px_11px_10px] [&_.course-rating]:[display:flex] [&_.course-rating]:[align-items:center]
  [&_.course-rating]:[gap:4px] [&_.course-rating]:[color:#9b9ba6] [&_.course-rating]:[font-size:0.6875rem] [&_.course-rating_svg]:[color:#e9b44f] [&_.course-rating_strong]:[color:#55545d]
  [&_.course-rating_strong]:[font-size:0.75rem] [&_.level-dot]:[color:#c5c4cc] [&_.course-body_h3]:[min-height:0] [&_.course-body_h3]:[margin:7px_0_5px] [&_.course-body_h3]:[color:#33343c]
  [&_.course-body_h3]:[font:700_11px/1.45_Manrope,_sans-serif] [&_.course-body_h3]:[letter-spacing:-.1px] [&_.course-instructor]:[display:flex] [&_.course-instructor]:[align-items:center] [&_.course-instructor]:[gap:6px]
  [&_.course-instructor]:[color:#777883] [&_.course-instructor]:[font-size:0.6875rem] [&_.avatar-small]:[width:19px] [&_.avatar-small]:[height:19px] [&_.avatar-small]:[font-size:0.625rem]
  [&_.course-facts]:[display:flex] [&_.course-facts]:[justify-content:space-between] [&_.course-facts]:[padding:9px_0] [&_.course-facts]:[margin-top:8px] [&_.course-facts]:[border-top:1px_solid_#f0f0f3]
  [&_.course-facts]:[color:#9696a0] [&_.course-facts]:[font-size:0.6875rem] [&_.course-facts_span]:[display:flex] [&_.course-facts_span]:[align-items:center] [&_.course-facts_span]:[gap:4px]
  [&_.progress-wrap]:[margin:0_0_9px] [&_.progress-label]:[display:flex] [&_.progress-label]:[justify-content:space-between] [&_.progress-label]:[color:#9898a3] [&_.progress-label]:[font-size:0.6875rem]
  [&_.progress-label]:[margin-bottom:4px] [&_.progress-label_strong]:[color:#7054dc] [&_.progress-track]:[height:4px] [&_.progress-track]:[background:#efedf5] [&_.progress-track]:[border-radius:5px]
  [&_.progress-track]:[overflow:hidden] [&_.progress-track_span]:[display:block] [&_.progress-track_span]:[height:100%] [&_.progress-track_span]:[background:#795ce5] [&_.progress-track_span]:[border-radius:inherit]
  [&_.course-bottom]:[display:flex] [&_.course-bottom]:[align-items:center] [&_.course-bottom]:[justify-content:space-between] [&_.course-bottom]:[border-top:1px_solid_#f0f0f3] [&_.course-bottom]:[padding-top:8px]
  [&_.price]:[display:flex] [&_.price]:[align-items:baseline] [&_.price]:[gap:5px] [&_.price_strong]:[color:#33333b] [&_.price_strong]:[font-size:var(--font-size-small)]
  [&_.price_del]:[color:#aeafb8] [&_.price_del]:[font-size:0.6875rem] [&_.course-action]:[height:27px] [&_.course-action]:[display:flex] [&_.course-action]:[align-items:center]
  [&_.course-action]:[justify-content:center] [&_.course-action]:[gap:4px] [&_.course-action]:[padding:0_9px] [&_.course-action]:[border:0] [&_.course-action]:[border-radius:5px]
  [&_.course-action]:[background:#f0edff] [&_.course-action]:[color:#694dd4] [&_.course-action]:[font-size:var(--font-size-caption)] [&_.course-action]:[font-weight:700] [&_.course-action:hover]:[background:#e5dfff]
  [&_.continue-button]:[color:#34855d] [&_.continue-button]:[background:#e9f6ee] [&_.continue-button:hover]:[background:#d9f0e2] [&_.empty-state]:[text-align:center] [&_.empty-state]:[border:1px_dashed_#dedbe9]
  [&_.empty-state]:[border-radius:9px] [&_.empty-state]:[padding:35px_15px] [&_.empty-state]:[background:#fff] [&_.empty-state_>_div]:[width:36px] [&_.empty-state_>_div]:[height:36px]
  [&_.empty-state_>_div]:[display:grid] [&_.empty-state_>_div]:[place-items:center] [&_.empty-state_>_div]:[margin:0_auto_10px] [&_.empty-state_>_div]:[border-radius:50%] [&_.empty-state_>_div]:[color:#7558e4]
  [&_.empty-state_>_div]:[background:#f0edff] [&_.empty-state_h3]:[margin:0_0_4px] [&_.empty-state_h3]:[font:700_13px_Manrope,_sans-serif] [&_.empty-state_p]:[margin:0_0_12px] [&_.empty-state_p]:[color:#9696a0]
  [&_.empty-state_p]:[font-size:var(--font-size-small)] [&_.empty-state_button]:[border:0] [&_.empty-state_button]:[background:transparent] [&_.empty-state_button]:[color:#6c4ed9] [&_.empty-state_button]:[font-size:var(--font-size-caption)]
  [&_.empty-state_button]:[font-weight:700] [&_.right-column]:[display:grid] [&_.right-column]:[gap:13px] [&_.live-card]:[border:1px_solid_#ececf1] [&_.live-card]:[border-radius:9px]
  [&_.live-card]:[background:#fff] [&_.learning-tip]:[border:1px_solid_#ececf1] [&_.learning-tip]:[border-radius:9px] [&_.learning-tip]:[background:#faf8ff] [&_.weekly-card]:[border:1px_solid_#ececf1]
  [&_.weekly-card]:[border-radius:9px] [&_.weekly-card]:[background:#fff] [&_.live-card]:[padding:15px_13px_10px] [&_.live-heading]:[display:flex] [&_.live-heading]:[align-items:center]
  [&_.live-heading]:[justify-content:space-between] [&_.live-heading]:[padding:0_1px_12px] [&_.live-heading_h2]:[font-size:1.375rem] [&_.live-heading_.section-kicker]:[font-size:0.6875rem] [&_.round-arrow]:[width:27px]
  [&_.round-arrow]:[height:27px] [&_.round-arrow]:[display:grid] [&_.round-arrow]:[place-items:center] [&_.round-arrow]:[border:1px_solid_#ececf2] [&_.round-arrow]:[border-radius:50%]
  [&_.round-arrow]:[color:#6b6b76] [&_.round-arrow]:[background:#fff] [&_.live-item]:[display:grid] [&_.live-item]:[grid-template-columns:63px_minmax(0,_1fr)] [&_.live-item]:[gap:9px]
  [&_.live-item]:[position:relative] [&_.live-item]:[padding:11px_0] [&_.live-item]:[border-top:1px_solid_#f0f0f3] [&_.class-time]:[align-self:start] [&_.class-time]:[display:grid]
  [&_.class-time]:[gap:4px] [&_.class-time]:[padding-top:3px] [&_.class-time_strong]:[color:#44444d] [&_.class-time_strong]:[font:700_12px_Manrope,_sans-serif] [&_.class-time_span]:[color:#a0a0aa]
  [&_.class-time_span]:[font-size:0.6875rem] [&_.class-time_span]:[white-space:nowrap] [&_.class-time.live_strong]:[color:#e06f62] [&_.class-details]:[min-width:0] [&_.class-details_>_strong]:[display:block]
  [&_.class-details_>_strong]:[overflow:hidden] [&_.class-details_>_strong]:[color:#44444d] [&_.class-details_>_strong]:[font-size:0.6875rem] [&_.class-details_>_strong]:[line-height:1.4] [&_.class-details_>_strong]:[text-overflow:ellipsis]
  [&_.class-details_>_strong]:[white-space:nowrap] [&_.class-details_>_span]:[display:block] [&_.class-details_>_span]:[overflow:hidden] [&_.class-details_>_span]:[margin-top:3px] [&_.class-details_>_span]:[color:#9999a3]
  [&_.class-details_>_span]:[font-size:0.6875rem] [&_.class-details_>_span]:[text-overflow:ellipsis] [&_.class-details_>_span]:[white-space:nowrap] [&_.class-meta]:[display:flex] [&_.class-meta]:[align-items:center]
  [&_.class-meta]:[gap:5px] [&_.class-meta]:[margin-top:8px] [&_.class-meta]:[color:#85858f] [&_.class-meta]:[font-size:0.6875rem] [&_.class-status]:[margin-left:auto]
  [&_.class-status]:[color:#9696a0] [&_.class-status]:[white-space:nowrap] [&_.class-status]:[font-size:0.625rem] [&_.class-status.live]:[color:#df7266] [&_.join-button]:[grid-column:2]
  [&_.join-button]:[justify-self:start] [&_.join-button]:[display:flex] [&_.join-button]:[align-items:center] [&_.join-button]:[gap:5px] [&_.join-button]:[height:23px]
  [&_.join-button]:[margin-top:-1px] [&_.join-button]:[padding:0_8px] [&_.join-button]:[border:0] [&_.join-button]:[border-radius:4px] [&_.join-button]:[color:#8c8b96]
  [&_.join-button]:[background:#f5f5f8] [&_.join-button]:[font-size:0.6875rem] [&_.join-button]:[font-weight:600] [&_.join-button.live]:[color:#fff] [&_.join-button.live]:[background:#e67668]
  [&_.join-button.live:hover]:[background:#d65f53] [&_.live-dot]:[width:5px] [&_.live-dot]:[height:5px] [&_.live-dot]:[border-radius:50%] [&_.live-dot]:[background:white]
  [&_.live-dot]:[box-shadow:0_0_0_3px_#ffffff38] [&_.schedule-link]:[width:100%] [&_.schedule-link]:[display:flex] [&_.schedule-link]:[align-items:center] [&_.schedule-link]:[justify-content:center]
  [&_.schedule-link]:[gap:6px] [&_.schedule-link]:[margin-top:4px] [&_.schedule-link]:[padding:10px_0_1px] [&_.schedule-link]:[border:0] [&_.schedule-link]:[border-top:1px_solid_#f0f0f3]
  [&_.schedule-link]:[color:#6f53dc] [&_.schedule-link]:[background:transparent] [&_.schedule-link]:[font-size:0.6875rem] [&_.schedule-link]:[font-weight:700] [&_.all-caught-up]:[display:flex]
  [&_.all-caught-up]:[gap:7px] [&_.all-caught-up]:[align-items:center] [&_.all-caught-up]:[padding:16px_3px] [&_.all-caught-up]:[color:#6f997e] [&_.all-caught-up]:[font-size:0.6875rem]
  [&_.learning-tip]:[padding:13px_14px_10px] [&_.learning-tip]:[border-color:#eeebf7] [&_.tip-top]:[display:flex] [&_.tip-top]:[align-items:center] [&_.tip-top]:[gap:7px]
  [&_.tip-top]:[color:#a09aa9] [&_.tip-top]:[font-size:0.6875rem] [&_.tip-top]:[font-weight:700] [&_.tip-top]:[letter-spacing:1px] [&_.tip-icon]:[width:25px]
  [&_.tip-icon]:[height:25px] [&_.tip-icon]:[display:grid] [&_.tip-icon]:[place-items:center] [&_.tip-icon]:[border-radius:7px] [&_.tip-icon]:[background:#eee8ff]
  [&_.tip-icon]:[color:#7455df] [&_.tip-top_button]:[display:grid] [&_.tip-top_button]:[place-items:center] [&_.tip-top_button]:[margin-left:auto] [&_.tip-top_button]:[border:0]
  [&_.tip-top_button]:[background:transparent] [&_.tip-top_button]:[color:#95919f] [&_.learning-tip_blockquote]:[margin:12px_0_13px] [&_.learning-tip_blockquote]:[color:#4b465a] [&_.learning-tip_blockquote]:[font:600_12px/1.6_Manrope,_sans-serif]
  [&_.learning-tip_blockquote]:[letter-spacing:-.15px] [&_.spotlight-person]:[display:flex] [&_.spotlight-person]:[align-items:center] [&_.spotlight-person]:[gap:8px] [&_.spotlight-avatar]:[width:28px]
  [&_.spotlight-avatar]:[height:28px] [&_.spotlight-avatar]:[color:#a45369] [&_.spotlight-avatar]:[background:#f8dfe7] [&_.spotlight-avatar]:[font-size:8px] [&_.spotlight-person_>_div:nth-child(2)]:[display:grid]
  [&_.spotlight-person_>_div:nth-child(2)]:[gap:3px] [&_.spotlight-person_strong]:[color:#4a4852] [&_.spotlight-person_strong]:[font-size:0.6875rem] [&_.spotlight-person_span]:[color:#9c99a4] [&_.spotlight-person_span]:[font-size:0.625rem]
  [&_.quote-stars]:[display:flex] [&_.quote-stars]:[gap:2px] [&_.quote-stars]:[margin-left:auto] [&_.quote-stars]:[color:#e9b44f] [&_.story-footer]:[display:flex]
  [&_.story-footer]:[justify-content:space-between] [&_.story-footer]:[align-items:center] [&_.story-footer]:[margin-top:12px] [&_.story-footer]:[padding-top:9px] [&_.story-footer]:[border-top:1px_solid_#eeebf3]
  [&_.story-footer]:[color:#aaa6b1] [&_.story-footer]:[font-size:0.625rem] [&_.story-footer]:[letter-spacing:.5px] [&_.story-footer_button]:[display:flex] [&_.story-footer_button]:[align-items:center]
  [&_.story-footer_button]:[gap:4px] [&_.story-footer_button]:[border:0] [&_.story-footer_button]:[color:#7558df] [&_.story-footer_button]:[background:transparent] [&_.story-footer_button]:[font-size:0.6875rem]
  [&_.story-footer_button]:[font-weight:700] [&_.story-footer_button]:[letter-spacing:0] [&_.weekly-card]:[padding:13px_14px_11px] [&_.weekly-head]:[display:flex] [&_.weekly-head]:[justify-content:space-between]
  [&_.weekly-head]:[align-items:center] [&_.weekly-head]:[color:#9595a0] [&_.weekly-head]:[font-size:0.6875rem] [&_.weekly-head]:[font-weight:700] [&_.weekly-head]:[letter-spacing:.8px]
  [&_.weekly-head_button]:[display:flex] [&_.weekly-head_button]:[align-items:center] [&_.weekly-head_button]:[gap:4px] [&_.weekly-head_button]:[border:0] [&_.weekly-head_button]:[background:transparent]
  [&_.weekly-head_button]:[color:#777782] [&_.weekly-head_button]:[font-size:0.6875rem] [&_.weekly-head_button]:[font-weight:500] [&_.weekly-head_button]:[letter-spacing:0] [&_.weekly-chart]:[display:flex]
  [&_.weekly-chart]:[height:83px] [&_.weekly-chart]:[gap:9px] [&_.weekly-chart]:[margin-top:10px] [&_.chart-y]:[display:flex] [&_.chart-y]:[flex-direction:column]
  [&_.chart-y]:[justify-content:space-between] [&_.chart-y]:[padding-bottom:12px] [&_.chart-y]:[color:#aaaab4] [&_.chart-y]:[font-size:0.625rem] [&_.chart-bars]:[flex:1]
  [&_.chart-bars]:[display:flex] [&_.chart-bars]:[justify-content:space-around] [&_.chart-bars]:[border-bottom:1px_solid_#f0eff3] [&_.chart-bars]:[background:repeating-linear-gradient(to_bottom,_transparent_0,_transparent_26px,_#f4f3f6_27px,_transparent_28px)] [&_.chart-day]:[width:20px]
  [&_.chart-day]:[display:flex] [&_.chart-day]:[flex-direction:column] [&_.chart-day]:[align-items:center] [&_.chart-day]:[justify-content:flex-end] [&_.chart-day]:[gap:4px]
  [&_.chart-day]:[color:#a2a2ad] [&_.chart-day]:[font-size:0.625rem] [&_.bar-track]:[height:62px] [&_.bar-track]:[width:8px] [&_.bar-track]:[display:flex]
  [&_.bar-track]:[align-items:flex-end] [&_.bar-track]:[overflow:hidden] [&_.bar-track]:[border-radius:4px] [&_.bar-track]:[background:#f2effe] [&_.bar-track_i]:[width:100%]
  [&_.bar-track_i]:[border-radius:4px] [&_.bar-track_i]:[background:#cabffa] [&_.bar-track_i.bar-highlight]:[background:#795de4] [&_.weekly-footer]:[display:flex] [&_.weekly-footer]:[align-items:center]
  [&_.weekly-footer]:[justify-content:space-between] [&_.weekly-footer]:[margin-top:10px] [&_.weekly-footer]:[padding-top:8px] [&_.weekly-footer]:[border-top:1px_solid_#f0f0f3] [&_.weekly-footer]:[color:#9696a1]
  [&_.weekly-footer]:[font-size:0.6875rem] [&_.weekly-footer_>_span]:[display:flex] [&_.weekly-footer_>_span]:[align-items:center] [&_.weekly-footer_>_span]:[gap:5px] [&_.weekly-footer_i]:[width:7px]
  [&_.weekly-footer_i]:[height:7px] [&_.weekly-footer_i]:[border-radius:2px] [&_.weekly-footer_i]:[background:#795de4] [&_.weekly-footer_strong]:[color:#4b4b55] [&_.weekly-footer_strong]:[font-size:0.75rem]
  [&_.weekly-footer_strong_span]:[color:#a0a0aa] [&_.weekly-footer_strong_span]:[font-weight:400] [&_.page-footer]:[display:flex] [&_.page-footer]:[justify-content:space-between] [&_.page-footer]:[align-items:center]
  [&_.page-footer]:[margin-top:25px] [&_.page-footer]:[padding-top:12px] [&_.page-footer]:[border-top:1px_solid_#eaeaf0] [&_.page-footer]:[color:#aaaab3] [&_.page-footer]:[font-size:0.6875rem]
  [&_.page-footer_div]:[display:flex] [&_.page-footer_div]:[gap:15px] [&_.page-footer_button]:[border:0] [&_.page-footer_button]:[padding:0] [&_.page-footer_button]:[background:transparent]
  [&_.page-footer_button]:[color:#9696a0] [&_.page-footer_button]:[font-size:0.6875rem] [&_.toast]:[position:fixed] [&_.toast]:[z-index:60] [&_.toast]:[right:24px]
  [&_.toast]:[bottom:24px] [&_.toast]:[display:flex] [&_.toast]:[align-items:center] [&_.toast]:[gap:10px] [&_.toast]:[max-width:min(390px,_calc(100vw_-_32px))]
  [&_.toast]:[padding:12px_13px] [&_.toast]:[border:1px_solid_#e9e6f3] [&_.toast]:[border-radius:9px] [&_.toast]:[background:#fff] [&_.toast]:[box-shadow:0_10px_34px_#29233d1c]
  [&_.toast]:[color:#45434f] [&_.toast]:[font-size:11px] [&_.toast_>_div]:[width:22px] [&_.toast_>_div]:[height:22px] [&_.toast_>_div]:[display:grid]
  [&_.toast_>_div]:[place-items:center] [&_.toast_>_div]:[flex:0_0_auto] [&_.toast_>_div]:[border-radius:50%] [&_.toast_>_div]:[background:#e8f6ed] [&_.toast_>_div]:[color:#47a071]
  [&_.toast_>_button]:[display:grid] [&_.toast_>_button]:[place-items:center] [&_.toast_>_button]:[margin-left:4px] [&_.toast_>_button]:[border:0] [&_.toast_>_button]:[background:transparent]
  [&_.toast_>_button]:[color:#999] [&_.modal-backdrop]:[position:fixed] [&_.modal-backdrop]:[z-index:50] [&_.modal-backdrop]:[inset:0] [&_.modal-backdrop]:[display:grid]
  [&_.modal-backdrop]:[place-items:center] [&_.modal-backdrop]:[padding:16px] [&_.modal-backdrop]:[background:#201d2d80] [&_.modal-backdrop]:[backdrop-filter:blur(3px)] [&_.checkout-modal]:[width:min(100%,_410px)]
  [&_.checkout-modal]:[position:relative] [&_.checkout-modal]:[padding:25px] [&_.checkout-modal]:[border-radius:13px] [&_.checkout-modal]:[background:#fff] [&_.checkout-modal]:[box-shadow:0_24px_80px_#1714214d]
  [&_.modal-close]:[position:absolute] [&_.modal-close]:[top:13px] [&_.modal-close]:[right:13px] [&_.modal-close]:[width:29px] [&_.modal-close]:[height:29px]
  [&_.modal-close]:[display:grid] [&_.modal-close]:[place-items:center] [&_.modal-close]:[border:1px_solid_#ecebf0] [&_.modal-close]:[border-radius:7px] [&_.modal-close]:[background:#fff]
  [&_.modal-close]:[color:#7b7b85] [&_.checkout-icon]:[width:39px] [&_.checkout-icon]:[height:39px] [&_.checkout-icon]:[display:grid] [&_.checkout-icon]:[place-items:center]
  [&_.checkout-icon]:[margin-bottom:15px] [&_.checkout-icon]:[border-radius:11px] [&_.checkout-icon]:[background:#f0edff] [&_.checkout-icon]:[color:#7255df] [&_.checkout-modal_h2]:[margin:7px_0_5px]
  [&_.checkout-modal_h2]:[color:#2f2c39] [&_.checkout-modal_h2]:[font:700_19px_Manrope,_sans-serif] [&_.checkout-modal_h2]:[letter-spacing:-.5px] [&_.checkout-subtitle]:[margin:0] [&_.checkout-subtitle]:[color:#92919c]
  [&_.checkout-subtitle]:[font-size:var(--font-size-caption)] [&_.checkout-course]:[display:flex] [&_.checkout-course]:[align-items:center] [&_.checkout-course]:[gap:11px] [&_.checkout-course]:[margin:20px_0_15px]
  [&_.checkout-course]:[padding:10px] [&_.checkout-course]:[border:1px_solid_#efedf3] [&_.checkout-course]:[border-radius:8px] [&_.checkout-course]:[background:#fcfbfe] [&_.checkout-course_img]:[width:53px]
  [&_.checkout-course_img]:[height:43px] [&_.checkout-course_img]:[object-fit:cover] [&_.checkout-course_img]:[border-radius:5px] [&_.checkout-course_div]:[display:grid] [&_.checkout-course_div]:[gap:5px]
  [&_.checkout-course_strong]:[color:#46434f] [&_.checkout-course_strong]:[font-size:var(--font-size-caption)] [&_.checkout-course_span]:[color:#9998a3] [&_.checkout-course_span]:[font-size:0.6875rem] [&_.checkout-line]:[display:flex]
  [&_.checkout-line]:[justify-content:space-between] [&_.checkout-line]:[padding:8px_0] [&_.checkout-line]:[color:#777681] [&_.checkout-line]:[font-size:var(--font-size-caption)] [&_.checkout-total]:[display:flex]
  [&_.checkout-total]:[justify-content:space-between] [&_.checkout-total]:[padding:8px_0] [&_.checkout-total]:[color:#34313e] [&_.checkout-total]:[font-size:var(--font-size-small)] [&_.checkout-line.discount]:[color:#47a071]
  [&_.checkout-total]:[margin-top:5px] [&_.checkout-total]:[padding-top:13px] [&_.checkout-total]:[border-top:1px_solid_#eeeef2] [&_.checkout-total_strong:last-child]:[font:700_17px_Manrope,_sans-serif] [&_.pay-button]:[width:100%]
  [&_.pay-button]:[height:41px] [&_.pay-button]:[display:flex] [&_.pay-button]:[justify-content:center] [&_.pay-button]:[align-items:center] [&_.pay-button]:[gap:7px]
  [&_.pay-button]:[margin-top:9px] [&_.pay-button]:[border:0] [&_.pay-button]:[border-radius:7px] [&_.pay-button]:[background:#7154dc] [&_.pay-button]:[color:white]
  [&_.pay-button]:[font-size:var(--font-size-caption)] [&_.pay-button]:[font-weight:700] [&_.pay-button:hover]:[background:#6042d1] [&_.secure-note]:[display:flex] [&_.secure-note]:[align-items:center]
  [&_.secure-note]:[justify-content:center] [&_.secure-note]:[gap:5px] [&_.secure-note]:[margin-top:12px] [&_.secure-note]:[color:#8a8993] [&_.secure-note]:[font-size:0.6875rem]
  [&_.secure-note_svg]:[color:#4ba276] [&_.demo-notice]:[margin:7px_0_0] [&_.demo-notice]:[color:#aaa9b2] [&_.demo-notice]:[text-align:center] [&_.demo-notice]:[font-size:0.625rem]
  [@media((min-width:1500px))]:[&_.page-wrap]:[padding-right:58px] [@media((min-width:1500px))]:[&_.page-wrap]:[padding-left:58px] [@media((min-width:1500px))]:[&_.course-image-wrap]:[height:137px] [@media((min-width:1500px))]:[&_.promo-banner]:[height:225px] [@media((max-width:1190px))]:[&_.sidebar]:[width:220px]
  [@media((max-width:1190px))]:[&_.main-content]:[margin-left:220px] [@media((max-width:1190px))]:[&_.topbar]:[padding:0_30px] [@media((max-width:1190px))]:[&_.page-wrap]:[padding-right:30px] [@media((max-width:1190px))]:[&_.page-wrap]:[padding-left:30px] [@media((max-width:1190px))]:[&_.content-grid]:[grid-template-columns:minmax(0,_1.45fr)_minmax(255px,_.85fr)]
  [@media((max-width:1190px))]:[&_.content-grid]:[gap:15px] [@media((max-width:1190px))]:[&_.stats-grid]:[gap:9px] [@media((max-width:1190px))]:[&_.stat-card]:[padding-right:10px] [@media((max-width:1190px))]:[&_.stat-card]:[padding-left:10px] [@media((max-width:930px))]:[&_.content-grid]:[grid-template-columns:minmax(0,_1fr)]
  [@media((max-width:930px))]:[&_.right-column]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [@media((max-width:930px))]:[&_.right-column]:[align-items:start] [@media((max-width:930px))]:[&_.live-card]:[grid-row:span_2] [@media((max-width:930px))]:[&_.weekly-card]:[grid-column:2] [@media((max-width:930px))]:[&_.stats-grid]:[grid-template-columns:repeat(2,_minmax(0,_1fr))]
  [@media((max-width:930px))]:[&_.top-search]:[width:200px] [@media((max-width:650px))]:[&_.sidebar]:[transform:translateX(-100%)] [@media((max-width:650px))]:[&_.sidebar]:[transition:transform_.2s_ease] [@media((max-width:650px))]:[&_.sidebar]:[box-shadow:10px_0_35px_#18152812] [@media((max-width:650px))]:[&_.sidebar.sidebar-open]:[transform:translateX(0)]
  [@media((max-width:650px))]:[&_.sidebar-scrim]:[display:block] [@media((max-width:650px))]:[&_.sidebar-scrim]:[position:fixed] [@media((max-width:650px))]:[&_.sidebar-scrim]:[z-index:19] [@media((max-width:650px))]:[&_.sidebar-scrim]:[inset:0] [@media((max-width:650px))]:[&_.sidebar-scrim]:[border:0]
  [@media((max-width:650px))]:[&_.sidebar-scrim]:[background:#17152565] [@media((max-width:650px))]:[&_.main-content]:[margin-left:0] [@media((max-width:650px))]:[&_.topbar]:[height:59px] [@media((max-width:650px))]:[&_.topbar]:[padding:0_16px] [@media((max-width:650px))]:[&_.mobile-menu]:[display:grid]
  [@media((max-width:650px))]:[&_.mobile-menu]:[place-items:center] [@media((max-width:650px))]:[&_.mobile-menu]:[padding:3px] [@media((max-width:650px))]:[&_.mobile-menu]:[border:0] [@media((max-width:650px))]:[&_.mobile-menu]:[background:transparent] [@media((max-width:650px))]:[&_.mobile-menu]:[color:#6c6d77]
  [@media((max-width:650px))]:[&_.breadcrumbs]:[margin-right:auto] [@media((max-width:650px))]:[&_.breadcrumbs]:[margin-left:10px] [@media((max-width:650px))]:[&_.breadcrumbs]:[font-size:10px] [@media((max-width:650px))]:[&_.topbar-actions]:[gap:13px]   [@media((max-width:650px))]:[&_.top-search]:[width:34px!important]
  [@media((max-width:650px))]:[&_.top-search]:[height:34px] [@media((max-width:650px))]:[&_.top-search]:[justify-content:center] [@media((max-width:650px))]:[&_.top-search]:[padding:0] [@media((max-width:650px))]:[&_.top-search]:[border:0] [@media((max-width:650px))]:[&_.top-search]:[background:transparent]
  [@media((max-width:650px))]:[&_.top-search_input]:[display:none] [@media((max-width:650px))]:[&_.top-search_kbd]:[display:none] [@media((max-width:650px))]:[&_.top-avatar]:[display:none] [@media((max-width:650px))]:[&_.page-wrap]:[padding:23px_16px_16px] [@media((max-width:650px))]:[&_.welcome-row]:[align-items:flex-start]
  [@media((max-width:650px))]:[&_.welcome-row]:[gap:10px] [@media((max-width:650px))]:[&_h1]:[font-size:1.75rem] [@media((max-width:650px))]:[&_.welcome-subtitle]:[max-width:230px] [@media((max-width:650px))]:[&_.welcome-subtitle]:[line-height:1.5] [@media((max-width:650px))]:[&_.outline-button]:[flex:0_0_auto]
  [@media((max-width:650px))]:[&_.outline-button]:[height:31px] [@media((max-width:650px))]:[&_.outline-button]:[padding:0_8px] [@media((max-width:650px))]:[&_.outline-button]:[font-size:9px] [@media((max-width:650px))]:[&_.outline-button]:[margin-top:22px] [@media((max-width:650px))]:[&_.outline-button_svg]:[width:14px]
  [@media((max-width:650px))]:[&_.stats-grid]:[gap:8px] [@media((max-width:650px))]:[&_.stats-grid]:[margin-bottom:16px] [@media((max-width:650px))]:[&_.stat-card]:[min-height:105px] [@media((max-width:650px))]:[&_.stat-card]:[padding:11px] [@media((max-width:650px))]:[&_.stat-top]:[font-size:9px]
  [@media((max-width:650px))]:[&_.stat-value]:[font-size:23px] [@media((max-width:650px))]:[&_.promo-banner]:[height:199px] [@media((max-width:650px))]:[&_.promo-banner]:[margin-bottom:23px] [@media((max-width:650px))]:[&_.promo-copy]:[padding:17px_16px] [@media((max-width:650px))]:[&_.promo-copy_h2]:[font-size:1.625rem]
  [@media((max-width:650px))]:[&_.promo-copy_p]:[font-size:8px] [@media((max-width:650px))]:[&_.promo-art]:[width:44%] [@media((max-width:650px))]:[&_.promo-art]:[right:-3%] [@media((max-width:650px))]:[&_.promo-art]:[opacity:.8] [@media((max-width:650px))]:[&_.art-circle]:[width:91px]
  [@media((max-width:650px))]:[&_.art-circle]:[height:91px] [@media((max-width:650px))]:[&_.art-circle_svg]:[width:62px] [@media((max-width:650px))]:[&_.orbit-one]:[width:175px] [@media((max-width:650px))]:[&_.orbit-one]:[height:100px] [@media((max-width:650px))]:[&_.orbit-two]:[width:205px]
  [@media((max-width:650px))]:[&_.orbit-two]:[height:128px] [@media((max-width:650px))]:[&_.art-pill]:[padding:6px_7px] [@media((max-width:650px))]:[&_.art-pill]:[font-size:7px] [@media((max-width:650px))]:[&_.pill-one]:[right:5%] [@media((max-width:650px))]:[&_.pill-one]:[top:30px]
  [@media((max-width:650px))]:[&_.pill-two]:[left:0] [@media((max-width:650px))]:[&_.pill-two]:[bottom:33px] [@media((max-width:650px))]:[&_.promo-bottom]:[left:16px] [@media((max-width:650px))]:[&_.promo-bottom]:[right:15px] [@media((max-width:650px))]:[&_.content-grid]:[gap:20px]
  [@media((max-width:650px))]:[&_.right-column]:[grid-template-columns:minmax(0,_1fr)] [@media((max-width:650px))]:[&_.live-card]:[grid-column:auto] [@media((max-width:650px))]:[&_.live-card]:[grid-row:auto] [@media((max-width:650px))]:[&_.weekly-card]:[grid-column:auto] [@media((max-width:650px))]:[&_.weekly-card]:[grid-row:auto]
  [@media((max-width:650px))]:[&_.course-grid]:[gap:9px] [@media((max-width:650px))]:[&_.course-image-wrap]:[height:100px] [@media((max-width:650px))]:[&_.course-body]:[padding:9px_8px] [@media((max-width:650px))]:[&_.course-body_h3]:[font-size:10px] [@media((max-width:650px))]:[&_.course-facts]:[font-size:0.625rem]
  [@media((max-width:650px))]:[&_.course-facts_span]:[gap:2px] [@media((max-width:650px))]:[&_.course-action]:[padding:0_7px] [@media((max-width:650px))]:[&_.course-action]:[font-size:8px] [@media((max-width:650px))]:[&_.price_strong]:[font-size:11px] [@media((max-width:650px))]:[&_.price_del]:[font-size:7px]
  [@media((max-width:390px))]:[&_.welcome-row]:[display:block] [@media((max-width:390px))]:[&_.outline-button]:[margin-top:12px] [@media((max-width:390px))]:[&_.course-image-wrap]:[height:85px] [@media((max-width:390px))]:[&_.course-rating]:[gap:3px] [@media((max-width:390px))]:[&_.course-rating]:[font-size:7px]
  [@media((max-width:390px))]:[&_.course-facts_svg]:[width:11px] [&_.top-search_kbd]:[font-size:var(--font-size-caption)] [&_h1]:[font-size:var(--font-size-heading)] [&_h1]:[line-height:var(--line-height-heading)] [&_.stat-value]:[font-size:1.875rem]
  [&_.stat-total]:[font-size:var(--font-size-caption)] [&_.stat-unit]:[font-size:var(--font-size-caption)] [&_.promo-copy_h2]:[font-size:1.875rem] [&_.promo-copy_h2]:[line-height:1.15] [&_.section-heading_h2]:[font-size:1.375rem]
  [&_.section-heading_h2]:[line-height:var(--line-height-heading)] [&_.live-heading_h2]:[line-height:var(--line-height-heading)] [&_.course-body_h3]:[font-size:var(--font-size-small)] [&_.course-body_h3]:[line-height:1.45] [&_.empty-state_h3]:[font-size:var(--font-size-body)]
  [&_.class-time_strong]:[font-size:var(--font-size-small)] [&_.learning-tip_blockquote]:[font-size:var(--font-size-small)] [&_.learning-tip_blockquote]:[line-height:1.55] [&_.checkout-modal_h2]:[font-size:var(--font-size-title)]
`;

function DashboardPage() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [activeCategory, setActiveCategory] = useState('All courses');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All levels');
  const [showFilter, setShowFilter] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [courseList, setCourseList] = useState([]);
  const [toast, setToast] = useState('');
  const [modalCourse, setModalCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    let active = true;
    Promise.all([
      getJson('/api/courses'),
      getJson('/api/live-classes'),
    ]).then(([loadedCourses, loadedClasses]) => {
      if (!active) return;
      setCourseList(loadedCourses);
      setClasses(loadedClasses);
      setLoadError('');
    }).catch((error) => {
      if (!active) return;
      setLoadError(error.message);
    }).finally(() => {
      if (active) setLoadingCourses(false);
    });
    return () => { active = false; };
  }, []);

  const enrolled = courseList.filter((course) => course.enrolled);
  const visibleCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courseList.filter((course) => {
      const matchesCategory = activeCategory === 'All courses' || course.category === activeCategory;
      const matchesSearch = !query || `${course.title} ${course.category} ${course.instructor}`.toLowerCase().includes(query);
      const matchesLevel = filter === 'All levels' || course.level === filter;
      const matchesPage = activeNav !== 'My learning' || course.enrolled;
      return matchesCategory && matchesSearch && matchesLevel && matchesPage;
    });
  }, [activeCategory, activeNav, courseList, filter, search]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const selectNav = (label) => {
    setActiveNav(label);
    setMenuOpen(false);
    if (label === 'Live classes') document.getElementById('live-classes')?.scrollIntoView({ behavior: 'smooth' });
    else document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
  };

  const buyCourse = async (course) => {
    try {
      const result = await postJson('/api/enrollments', { courseId: course.id });
      setCourseList((current) => current.map((item) => item.id === course.id ? result.course : item));
      setModalCourse(null);
      setActiveNav('My learning');
      notify(`You're enrolled in ${course.title}!`);
    } catch (error) {
      notify(error.message);
    }
  };

  const joinClass = (classItem) => {
    notify(`Class room link for "${classItem.title}" is not configured yet.`);
  };

  return (
    <div className={`app-shell ${dashboardTailwindStyles}`}>
      <DashboardSidebar
        activeNav={activeNav}
        activeCategory={activeCategory}
        classes={classes}
        menuOpen={menuOpen}
        onNavSelect={selectNav}
        onCategorySelect={(name) => {
          setActiveCategory(name);
          selectNav('Explore courses');
        }}
        onNotify={notify}
      />

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          <div className="breadcrumbs"><span>Pages</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <label className="top-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You’re all caught up!')}><Bell size={19} /><i /></button>
            <div className="top-avatar avatar-user">AK</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line" /> {today.toUpperCase()}</div><h1>{activeNav === 'My learning' ? 'Your learning journey' : 'Good morning, Arjun'} <span className="wave">✦</span></h1><p className="welcome-subtitle">{activeNav === 'My learning' ? 'Pick up where you left off and keep making progress.' : 'Ready to learn something new today?'}</p></div>
            <button className="outline-button" onClick={() => { setActiveNav('Explore courses'); setActiveCategory('All courses'); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }}><Compass size={16} /> Explore catalog</button>
          </section>

          <section className="stats-grid" aria-label="Learning statistics">
            <div className="stat-card stat-primary"><div className="stat-top"><span>Courses in progress</span><span className="stat-icon"><BookOpen size={17} /></span></div><div className="stat-value">{enrolled.length.toString().padStart(2, '0')}<span className="stat-total"> / 08</span></div><div className="stat-footer"><span className="trend"><ArrowDownRight size={13} /> Keep it up</span><span>Active courses</span></div></div>
            <div className="stat-card"><div className="stat-top"><span>Learning hours</span><span className="stat-icon stat-icon-lavender"><Clock3 size={17} /></span></div><div className="stat-value">24.5<span className="stat-unit"> hrs</span></div><div className="stat-footer"><span className="trend positive">+12.5%</span><span>vs. last month</span></div></div>
            <div className="stat-card"><div className="stat-top"><span>Certificates earned</span><span className="stat-icon stat-icon-peach"><ShieldCheck size={17} /></span></div><div className="stat-value">03</div><div className="stat-footer"><span className="trend neutral">You're on a roll</span><span>Keep going!</span></div></div>
            <div className="stat-card stat-streak"><div className="stat-top"><span>Learning streak</span><span className="stat-icon stat-icon-yellow"><Sparkles size={17} /></span></div><div className="stat-value">07<span className="stat-unit"> days</span></div><div className="streak-dots">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <div key={`${day}-${i}`} className={i < 4 ? 'day-done' : ''}><span>{day}</span><b>{i < 4 ? <Check size={12} /> : ''}</b></div>)}</div></div>
          </section>

          <section className="promo-banner">
            <div className="promo-copy"><span className="promo-tag"><Sparkles size={12} /> YOUR NEXT BIG THING</span><h2>Small steps.<br />Big <em>possibilities.</em></h2><p>Build skills that move your career forward.<br />Your next chapter starts here.</p><button className="promo-button" onClick={() => { document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }}>Find your course <ArrowRight size={15} /></button></div>
            <div className="promo-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-circle"><GraduationCap size={85} strokeWidth={1.15} /></div><div className="art-pill pill-one"><Play size={13} fill="currentColor" /> Learn by doing</div><div className="art-pill pill-two"><Star size={13} fill="currentColor" /> 4.9 avg rating</div><div className="art-sparkle spark-one">✳</div><div className="art-sparkle spark-two">✦</div><div className="art-sparkle spark-three">✧</div></div>
            <div className="promo-bottom"><span>DESIGNED FOR YOUR NEXT CHAPTER</span><span>01 — 03</span></div>
          </section>

          <section className="content-grid">
            <div className="courses-section" id="courses">
              <div className="section-heading"><div><div className="section-kicker">CURATED FOR YOU</div><h2>{activeNav === 'My learning' ? 'Continue learning' : activeCategory === 'All courses' ? 'Popular courses' : activeCategory + ' courses'}</h2></div><button className="text-link" onClick={() => { setActiveNav('Explore courses'); setActiveCategory('All courses'); setShowAll(!showAll); }}>{showAll ? 'Show less' : 'View all courses'} <ArrowRight size={15} /></button></div>
              <div className="course-controls">
                <div className="filter-tabs"><button className={activeNav !== 'My learning' ? 'selected' : ''} onClick={() => setActiveNav('Explore courses')}>Discover</button><button className={activeNav === 'My learning' ? 'selected' : ''} onClick={() => setActiveNav('My learning')}>My learning <span>{enrolled.length}</span></button></div>
                <div className="filter-wrap"><button className="filter-button" onClick={() => setShowFilter(!showFilter)}><span>{filter}</span><ChevronDown size={15} /></button>{showFilter && <div className="filter-menu">{['All levels', 'Beginner', 'Intermediate'].map((level) => <button key={level} onClick={() => { setFilter(level); setShowFilter(false); }}>{level}{filter === level && <Check size={14} />}</button>)}</div>}</div>
              </div>
              <div className="course-grid">
                {visibleCourses.slice(0, showAll ? visibleCourses.length : 4).map((course) => <CourseCard key={course.id} course={course} onEnroll={() => course.enrolled ? notify('You are already enrolled in this course.') : setModalCourse(course)} onContinue={() => notify(`Opening your next lesson in ${course.title}.`)} />)}
              </div>
              {loadingCourses && <div className="empty-state">Loading courses…</div>}
              {!loadingCourses && loadError && <div className="empty-state"><h3>Could not reach the platform API</h3><p>{loadError} Make sure the backend is running.</p></div>}
              {!loadingCourses && !loadError && visibleCourses.length === 0 && <div className="empty-state"><div><Search size={21} /></div><h3>No courses found</h3><p>Try a different search or choose another category.</p><button onClick={() => { setSearch(''); setFilter('All levels'); setActiveCategory('All courses'); }}>Clear filters</button></div>}
            </div>

            <aside className="right-column">
              <section className="live-card" id="live-classes">
                <div className="live-heading"><div><div className="section-kicker">DON'T MISS OUT</div><h2>Live classes</h2></div><button className="round-arrow" aria-label="View all classes" onClick={() => notify('You’re viewing all upcoming classes.')}><ArrowRight size={16} /></button></div>
                <div className="live-list">
                  {classes.slice(0, 3).map((item) => <div className="live-item" key={item.id}><div className={`class-time ${item.color}`}><strong>{item.time.split(' ')[0]}</strong><span>{item.time.split(' ')[1]} · {item.date}</span></div><div className="class-details"><strong>{item.title}</strong><span>{item.course}</span><div className="class-meta"><div className="avatar avatar-small">{item.initials}</div><span>{item.instructor}</span><span className={`class-status ${item.color}`}>{item.status}</span></div></div><button className={`join-button ${item.color}`} onClick={() => joinClass(item)}>{item.color === 'live' ? <><span className="live-dot" /> Join</> : 'Remind me'}</button></div>)}
                  {classes.length === 0 && <div className="all-caught-up"><Check size={16} /> You're all caught up! Check back for new classes.</div>}
                </div>
                <button className="schedule-link" onClick={() => notify('Your full class schedule is up to date.')}>View full schedule <ArrowRight size={14} /></button>
              </section>
              <section className="learning-tip"><div className="tip-top"><div className="tip-icon"><Sparkles size={16} /></div><span>STUDENT SPOTLIGHT</span><button aria-label="More student spotlights" onClick={() => notify('More stories coming soon.')}><MoreHorizontal size={19} /></button></div><blockquote>“I went from not knowing where to start to landing my first design role in just 4 months.”</blockquote><div className="spotlight-person"><div className="avatar spotlight-avatar">RM</div><div><strong>Riya Mehta</strong><span>Product Designer at Razorpay</span></div><div className="quote-stars"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div></div><div className="story-footer"><span>ALUMNI STORY · 4 MIN READ</span><button aria-label="Read student story" onClick={() => notify('Student story opening soon.')}>Read story <ArrowRight size={13} /></button></div></section>
              <section className="weekly-card"><div className="weekly-head"><span>YOUR WEEK</span><button onClick={() => notify('Showing this week’s activity.')}>This week <ChevronDown size={13} /></button></div><div className="weekly-chart"><div className="chart-y"><span>4h</span><span>2h</span><span>0h</span></div><div className="chart-bars">{[{ d: 'M', h: 38 }, { d: 'T', h: 65 }, { d: 'W', h: 48 }, { d: 'T', h: 84 }, { d: 'F', h: 55 }, { d: 'S', h: 30 }, { d: 'S', h: 15 }].map((item, index) => <div className="chart-day" key={`${item.d}-${index}`}><div className="bar-track"><i style={{ height: `${item.h}%` }} className={index === 3 ? 'bar-highlight' : ''} /></div><span>{item.d}</span></div>)}</div></div><div className="weekly-footer"><span><i /> Study time</span><strong>8.5 hrs <span>this week</span></strong></div></section>
            </aside>
          </section>
          <footer className="page-footer"><span>© 2026 Skillpath Learning, Inc.</span><div><button onClick={() => notify('Help center opening soon.')}>Help center</button><button onClick={() => notify('Privacy policy opening soon.')}>Privacy</button><button onClick={() => notify('Terms opening soon.')}>Terms</button></div></footer>
        </div>
      </main>

      {menuOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      {toast && <div className="toast"><div><Check size={15} /></div>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
      {modalCourse && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalCourse(null); }}><div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="modal-close" aria-label="Close checkout" onClick={() => setModalCourse(null)}><X size={18} /></button><div className="checkout-icon"><CreditCard size={22} /></div><div className="section-kicker">SECURE CHECKOUT</div><h2 id="checkout-title">Ready to start learning?</h2><p className="checkout-subtitle">You’re one step away from your next big skill.</p><div className="checkout-course"><img src={modalCourse.image} alt="" /><div><strong>{modalCourse.title}</strong><span>{modalCourse.duration} · {modalCourse.lessons} lessons</span></div></div><div className="checkout-line"><span>Course access</span><span>₹{modalCourse.oldPrice.toLocaleString('en-IN')}</span></div><div className="checkout-line discount"><span>Early learner discount</span><span>− ₹{(modalCourse.oldPrice - modalCourse.price).toLocaleString('en-IN')}</span></div><div className="checkout-total"><strong>Total due today</strong><strong>₹{modalCourse.price.toLocaleString('en-IN')}</strong></div><button className="pay-button" onClick={() => buyCourse(modalCourse)}>Confirm enrollment <ArrowRight size={16} /></button><div className="secure-note"><ShieldCheck size={14} /> Secure checkout · 30-day money-back guarantee</div><p className="demo-notice">Demo checkout — no payment will be collected.</p></div></div>}
    </div>
  );
}

export default DashboardPage;
