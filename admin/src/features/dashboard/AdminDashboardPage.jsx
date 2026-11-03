import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight, BookOpen, CalendarDays, Check, ChevronDown, CircleAlert,
  GraduationCap, LayoutDashboard, Pencil, Plus, RefreshCw, Search, Trash2, X,
} from 'lucide-react';
import { apiRequest } from '../../services/api.js';

const emptyCourse = {
  title: '', category: 'Design', level: 'Beginner', instructor: '',
  duration: '', lessons: 12, price: 999, oldPrice: 1499,
  image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=85',
  color: 'lavender',
};

const adminTailwindStyles = `
  [&]:[--font-size-caption:0.75rem] [&]:[--font-size-small:0.875rem] [&]:[--font-size-body:1rem] [&]:[--font-size-lead:1.125rem] [&]:[--font-size-title:1.375rem]
  [&]:[--font-size-heading:2rem] [&]:[--font-size-display:clamp(3rem,_6vw,_4.75rem)] [&]:[--line-height-body:1.65] [&]:[--line-height-heading:1.2] [&]:[font-size:var(--font-size-body)]
  [&]:[line-height:var(--line-height-body)] [&]:[font-family:'DM_Sans',_sans-serif] [&]:[color:#292a32] [&]:[background:#f6f7fb] [&]:[font-synthesis:none]
  [&]:[text-rendering:optimizeLegibility] [&]:[-webkit-font-smoothing:antialiased] [&]:[--purple:#7658e8] [&]:[box-sizing:border-box] [&]:[margin:0]
  [&]:[min-width:320px] [&]:[min-height:100vh] [&_button]:[font:inherit] [&_input]:[font:inherit] [&_select]:[font:inherit]
  [&_button]:[cursor:pointer] [&_button:focus-visible]:[outline:3px_solid_#aa9bff] [&_button:focus-visible]:[outline-offset:2px] [&_a:focus-visible]:[outline:3px_solid_#aa9bff] [&_a:focus-visible]:[outline-offset:2px]
  [&_input:focus-visible]:[outline:3px_solid_#aa9bff] [&_input:focus-visible]:[outline-offset:2px] [&_select:focus-visible]:[outline:3px_solid_#aa9bff] [&_select:focus-visible]:[outline-offset:2px] [&_.admin-sidebar]:[position:fixed]
  [&_.admin-sidebar]:[inset:0_auto_0_0] [&_.admin-sidebar]:[z-index:4] [&_.admin-sidebar]:[width:238px] [&_.admin-sidebar]:[display:flex] [&_.admin-sidebar]:[flex-direction:column]
  [&_.admin-sidebar]:[padding:26px_17px_17px] [&_.admin-sidebar]:[border-right:1px_solid_#ececf1] [&_.admin-sidebar]:[background:#fff] [&_.admin-brand]:[display:flex] [&_.admin-brand]:[align-items:center]
  [&_.admin-brand]:[gap:9px] [&_.admin-brand]:[padding:0_8px] [&_.admin-brand]:[color:#282632] [&_.admin-brand]:[text-decoration:none] [&_.admin-brand]:[font:800_19px_Manrope,_sans-serif]
  [&_.admin-brand]:[letter-spacing:-.8px] [&_.admin-brand_>_span:first-child]:[width:31px] [&_.admin-brand_>_span:first-child]:[height:31px] [&_.admin-brand_>_span:first-child]:[display:grid] [&_.admin-brand_>_span:first-child]:[place-items:center]
  [&_.admin-brand_>_span:first-child]:[border-radius:9px] [&_.admin-brand_>_span:first-child]:[background:#7658e8] [&_.admin-brand_>_span:first-child]:[color:white] [&_.brand-period]:[margin-left:-9px] [&_.brand-period]:[color:var(--purple)]
  [&_.admin-nav-label]:[margin:48px_10px_12px] [&_.admin-nav-label]:[color:#a4a4b0] [&_.admin-nav-label]:[font-size:0.6875rem] [&_.admin-nav-label]:[font-weight:700] [&_.admin-nav-label]:[letter-spacing:1.2px]
  [&_.admin-nav-item]:[min-height:41px] [&_.admin-nav-item]:[display:flex] [&_.admin-nav-item]:[align-items:center] [&_.admin-nav-item]:[gap:11px] [&_.admin-nav-item]:[margin:2px_0]
  [&_.admin-nav-item]:[padding:0_11px] [&_.admin-nav-item]:[border-radius:7px] [&_.admin-nav-item]:[color:#777987] [&_.admin-nav-item]:[text-decoration:none] [&_.admin-nav-item]:[font-size:var(--font-size-small)]
  [&_.admin-nav-item.active]:[background:#f0edff] [&_.admin-nav-item.active]:[color:#684ce2] [&_.admin-nav-item:hover]:[background:#f0edff] [&_.admin-nav-item:hover]:[color:#684ce2] [&_.admin-nav-item.active]:[font-weight:700]
  [&_.admin-nav-item_>_span]:[margin-left:auto] [&_.admin-nav-item_>_span]:[color:#8e8d99] [&_.admin-nav-item_>_span]:[font-size:var(--font-size-caption)] [&_.admin-sidebar-bottom]:[display:flex] [&_.admin-sidebar-bottom]:[align-items:center]
  [&_.admin-sidebar-bottom]:[gap:9px] [&_.admin-sidebar-bottom]:[margin-top:auto] [&_.admin-sidebar-bottom]:[padding:14px_3px_1px] [&_.admin-sidebar-bottom]:[border-top:1px_solid_#efeff3] [&_.admin-avatar]:[width:32px]
  [&_.admin-avatar]:[height:32px] [&_.admin-avatar]:[display:grid] [&_.admin-avatar]:[place-items:center] [&_.admin-avatar]:[border-radius:50%] [&_.admin-avatar]:[background:#ece8ff]
  [&_.admin-avatar]:[color:#6c55c9] [&_.admin-avatar]:[font-size:9px] [&_.admin-avatar]:[font-weight:700] [&_.admin-sidebar-bottom_div:nth-child(2)]:[display:grid] [&_.admin-sidebar-bottom_div:nth-child(2)]:[gap:3px]
  [&_.admin-sidebar-bottom_strong]:[font-size:var(--font-size-caption)] [&_.admin-sidebar-bottom_small]:[color:#9999a4] [&_.admin-sidebar-bottom_small]:[font-size:var(--font-size-caption)] [&_.admin-sidebar-bottom_>_svg]:[margin-left:auto] [&_.admin-sidebar-bottom_>_svg]:[color:#92929c]
  [&_.admin-main]:[min-height:100vh] [&_.admin-main]:[margin-left:238px] [&_.admin-topbar]:[height:65px] [&_.admin-topbar]:[display:flex] [&_.admin-topbar]:[align-items:center]
  [&_.admin-topbar]:[justify-content:space-between] [&_.admin-topbar]:[padding:0_38px] [&_.admin-topbar]:[border-bottom:1px_solid_#ececf1] [&_.admin-topbar]:[background:#ffffffc9] [&_.admin-topbar_>_div]:[display:flex]
  [&_.admin-topbar_>_div]:[gap:9px] [&_.admin-topbar_>_div]:[align-items:center] [&_.admin-topbar_>_div]:[color:#9999a3] [&_.admin-topbar_>_div]:[font-size:var(--font-size-small)] [&_.admin-topbar_>_div_b]:[color:#cac9d0]
  [&_.admin-topbar_>_div_b]:[font-weight:400] [&_.admin-topbar_>_div_strong]:[color:#45454e] [&_.admin-topbar_>_div_strong]:[font-weight:600] [&_.admin-topbar_>_a]:[display:flex] [&_.admin-topbar_>_a]:[align-items:center]
  [&_.admin-topbar_>_a]:[gap:5px] [&_.admin-topbar_>_a]:[color:#6f53dc] [&_.admin-topbar_>_a]:[text-decoration:none] [&_.admin-topbar_>_a]:[font-size:var(--font-size-small)] [&_.admin-topbar_>_a]:[font-weight:600]
  [&_.admin-content]:[max-width:1450px] [&_.admin-content]:[margin:0_auto] [&_.admin-content]:[padding:30px_38px_20px] [&_.admin-welcome]:[display:flex] [&_.admin-welcome]:[justify-content:space-between]
  [&_.admin-welcome]:[align-items:flex-end] [&_.admin-welcome]:[gap:12px] [&_.admin-welcome]:[margin-bottom:21px] [&_.admin-eyebrow]:[color:#9898a5] [&_.admin-eyebrow]:[font-size:0.6875rem]
  [&_.admin-eyebrow]:[font-weight:700] [&_.admin-eyebrow]:[letter-spacing:1.2px] [&_.admin-welcome_h1]:[margin:7px_0_4px] [&_.admin-welcome_h1]:[font:700_25px_Manrope,_sans-serif] [&_.admin-welcome_h1]:[letter-spacing:-.8px]
  [&_.admin-welcome_p]:[margin:0] [&_.admin-welcome_p]:[color:#9697a1] [&_.admin-welcome_p]:[font-size:var(--font-size-small)] [&_.refresh-button]:[display:flex] [&_.refresh-button]:[align-items:center]
  [&_.refresh-button]:[gap:7px] [&_.refresh-button]:[height:34px] [&_.refresh-button]:[padding:0_11px] [&_.refresh-button]:[border:1px_solid_#e8e7ef] [&_.refresh-button]:[border-radius:6px]
  [&_.refresh-button]:[background:white] [&_.refresh-button]:[color:#62616c] [&_.refresh-button]:[font-size:var(--font-size-caption)] [&_.admin-alert]:[display:flex] [&_.admin-alert]:[align-items:center]
  [&_.admin-alert]:[gap:9px] [&_.admin-alert]:[margin:0_0_12px] [&_.admin-alert]:[padding:10px_12px] [&_.admin-alert]:[border:1px_solid] [&_.admin-alert]:[border-radius:7px]
  [&_.admin-alert]:[font-size:var(--font-size-caption)] [&_.admin-alert_button]:[display:grid] [&_.admin-alert_button]:[place-items:center] [&_.admin-alert_button]:[margin-left:auto] [&_.admin-alert_button]:[border:0]
  [&_.admin-alert_button]:[background:transparent] [&_.admin-alert_button]:[color:inherit] [&_.error-alert]:[border-color:#f1d8d5] [&_.error-alert]:[background:#fff7f6] [&_.error-alert]:[color:#a85248]
  [&_.success-alert]:[border-color:#d7ecdf] [&_.success-alert]:[background:#f4fbf6] [&_.success-alert]:[color:#46835f] [&_.admin-stats]:[display:grid] [&_.admin-stats]:[grid-template-columns:repeat(3,_minmax(0,_1fr))]
  [&_.admin-stats]:[gap:12px] [&_.admin-stats]:[margin-bottom:17px] [&_.admin-stats_article]:[min-height:92px] [&_.admin-stats_article]:[position:relative] [&_.admin-stats_article]:[display:grid]
  [&_.admin-stats_article]:[align-content:space-between] [&_.admin-stats_article]:[padding:14px_15px] [&_.admin-stats_article]:[border:1px_solid_#ececf2] [&_.admin-stats_article]:[border-radius:8px] [&_.admin-stats_article]:[background:white]
  [&_.admin-stats_article_>_span]:[color:#777984] [&_.admin-stats_article_>_span]:[font-size:var(--font-size-caption)] [&_.admin-stats_article_strong]:[font:700_24px_Manrope,_sans-serif] [&_.admin-stats_article_strong]:[letter-spacing:-.5px] [&_.admin-stats_article_>_svg]:[position:absolute]
  [&_.admin-stats_article_>_svg]:[top:13px] [&_.admin-stats_article_>_svg]:[right:13px] [&_.admin-stats_article_>_svg]:[color:#7356df] [&_.admin-panel]:[overflow:hidden] [&_.admin-panel]:[margin-bottom:16px]
  [&_.admin-panel]:[border:1px_solid_#ececf1] [&_.admin-panel]:[border-radius:9px] [&_.admin-panel]:[background:white] [&_.panel-heading]:[display:flex] [&_.panel-heading]:[align-items:center]
  [&_.panel-heading]:[justify-content:space-between] [&_.panel-heading]:[padding:16px_17px] [&_.panel-heading_h2]:[margin:5px_0_0] [&_.panel-heading_h2]:[font:700_16px_Manrope,_sans-serif] [&_.panel-heading_h2]:[letter-spacing:-.3px]
  [&_.panel-count]:[padding:5px_8px] [&_.panel-count]:[border-radius:5px] [&_.panel-count]:[background:#f2efff] [&_.panel-count]:[color:#7054d8] [&_.panel-count]:[font-size:var(--font-size-caption)]
  [&_.panel-count]:[font-weight:600] [&_.course-form]:[margin:0_17px_16px] [&_.course-form]:[padding:14px] [&_.course-form]:[border:1px_solid_#eeecf5] [&_.course-form]:[border-radius:7px]
  [&_.course-form]:[background:#fcfbff] [&_.form-heading]:[display:flex] [&_.form-heading]:[justify-content:space-between] [&_.form-heading]:[align-items:center] [&_.form-heading]:[margin-bottom:12px]
  [&_.form-heading_>_div]:[display:flex] [&_.form-heading_>_div]:[align-items:center] [&_.form-heading_>_div]:[gap:8px] [&_.form-heading_strong]:[font-size:var(--font-size-caption)] [&_.form-icon]:[width:24px]
  [&_.form-icon]:[height:24px] [&_.form-icon]:[display:grid] [&_.form-icon]:[place-items:center] [&_.form-icon]:[border-radius:6px] [&_.form-icon]:[background:#eee9ff]
  [&_.form-icon]:[color:#7557de] [&_.cancel-edit]:[display:flex] [&_.cancel-edit]:[align-items:center] [&_.cancel-edit]:[gap:4px] [&_.cancel-edit]:[padding:3px]
  [&_.cancel-edit]:[border:0] [&_.cancel-edit]:[background:transparent] [&_.cancel-edit]:[color:#8a8893] [&_.cancel-edit]:[font-size:var(--font-size-caption)] [&_.admin-form-grid]:[display:grid]
  [&_.admin-form-grid]:[grid-template-columns:repeat(4,_minmax(0,_1fr))] [&_.admin-form-grid]:[gap:10px] [&_.admin-form-grid_label]:[display:grid] [&_.admin-form-grid_label]:[gap:5px] [&_.admin-form-grid_label]:[color:#72727d]
  [&_.admin-form-grid_label]:[font-size:var(--font-size-caption)] [&_.admin-form-grid_label]:[font-weight:600] [&_.class-form_label]:[display:grid] [&_.class-form_label]:[gap:5px] [&_.class-form_label]:[color:#72727d]
  [&_.class-form_label]:[font-size:var(--font-size-caption)] [&_.class-form_label]:[font-weight:600] [&_.admin-form-grid_.field-wide]:[grid-column:span_2] [&_.admin-form-grid_input]:[width:100%] [&_.admin-form-grid_input]:[min-width:0]
  [&_.admin-form-grid_input]:[height:33px] [&_.admin-form-grid_input]:[padding:0_8px] [&_.admin-form-grid_input]:[border:1px_solid_#e8e7ed] [&_.admin-form-grid_input]:[border-radius:5px] [&_.admin-form-grid_input]:[outline:0]
  [&_.admin-form-grid_input]:[background:white] [&_.admin-form-grid_input]:[color:#4a4a54] [&_.admin-form-grid_input]:[font-size:var(--font-size-caption)] [&_.admin-form-grid_select]:[width:100%] [&_.admin-form-grid_select]:[min-width:0]
  [&_.admin-form-grid_select]:[height:33px] [&_.admin-form-grid_select]:[padding:0_8px] [&_.admin-form-grid_select]:[border:1px_solid_#e8e7ed] [&_.admin-form-grid_select]:[border-radius:5px] [&_.admin-form-grid_select]:[outline:0]
  [&_.admin-form-grid_select]:[background:white] [&_.admin-form-grid_select]:[color:#4a4a54] [&_.admin-form-grid_select]:[font-size:var(--font-size-caption)] [&_.class-form_input]:[width:100%] [&_.class-form_input]:[min-width:0]
  [&_.class-form_input]:[height:33px] [&_.class-form_input]:[padding:0_8px] [&_.class-form_input]:[border:1px_solid_#e8e7ed] [&_.class-form_input]:[border-radius:5px] [&_.class-form_input]:[outline:0]
  [&_.class-form_input]:[background:white] [&_.class-form_input]:[color:#4a4a54] [&_.class-form_input]:[font-size:var(--font-size-caption)] [&_.class-form_select]:[width:100%] [&_.class-form_select]:[min-width:0]
  [&_.class-form_select]:[height:33px] [&_.class-form_select]:[padding:0_8px] [&_.class-form_select]:[border:1px_solid_#e8e7ed] [&_.class-form_select]:[border-radius:5px] [&_.class-form_select]:[outline:0]
  [&_.class-form_select]:[background:white] [&_.class-form_select]:[color:#4a4a54] [&_.class-form_select]:[font-size:var(--font-size-caption)] [&_.admin-form-grid_input:focus]:[border-color:#aa9bff] [&_.admin-form-grid_select:focus]:[border-color:#aa9bff]
  [&_.class-form_input:focus]:[border-color:#aa9bff] [&_.class-form_select:focus]:[border-color:#aa9bff] [&_.admin-form-grid_input::placeholder]:[color:#b0afb8] [&_.class-form_input::placeholder]:[color:#b0afb8] [&_.primary-button]:[display:flex]
  [&_.primary-button]:[align-items:center] [&_.primary-button]:[justify-content:center] [&_.primary-button]:[gap:6px] [&_.primary-button]:[min-height:32px] [&_.primary-button]:[margin-top:12px]
  [&_.primary-button]:[padding:0_11px] [&_.primary-button]:[border:0] [&_.primary-button]:[border-radius:5px] [&_.primary-button]:[background:#7154dc] [&_.primary-button]:[color:white]
  [&_.primary-button]:[font-size:var(--font-size-caption)] [&_.primary-button]:[font-weight:700] [&_.primary-button:hover:not(:disabled)]:[background:#6042d1] [&_.primary-button:disabled]:[cursor:not-allowed] [&_.primary-button:disabled]:[opacity:.55]
  [&_.table-toolbar]:[display:flex] [&_.table-toolbar]:[align-items:center] [&_.table-toolbar]:[justify-content:space-between] [&_.table-toolbar]:[gap:12px] [&_.table-toolbar]:[padding:13px_17px]
  [&_.table-toolbar]:[border-top:1px_solid_#f0eff3] [&_.table-toolbar_h3]:[margin:0_0_3px] [&_.table-toolbar_h3]:[font-size:var(--font-size-caption)] [&_.table-toolbar_>_div_>_span]:[color:#9c9ca6] [&_.table-toolbar_>_div_>_span]:[font-size:0.6875rem]
  [&_.table-search]:[width:min(230px,_42%)] [&_.table-search]:[height:31px] [&_.table-search]:[display:flex] [&_.table-search]:[align-items:center] [&_.table-search]:[gap:6px]
  [&_.table-search]:[padding:0_8px] [&_.table-search]:[border:1px_solid_#ecebf0] [&_.table-search]:[border-radius:5px] [&_.table-search]:[color:#9a99a3] [&_.table-search_input]:[width:100%]
  [&_.table-search_input]:[border:0] [&_.table-search_input]:[outline:0] [&_.table-search_input]:[font-size:var(--font-size-caption)] [&_.table-search_input::placeholder]:[color:#aaa9b2] [&_.table-scroll]:[overflow-x:auto]
  [&_table]:[width:100%] [&_table]:[border-collapse:collapse] [&_table]:[text-align:left] [&_thead]:[background:#fafafd] [&_th]:[padding:10px_13px]
  [&_th]:[color:#9c9ca6] [&_th]:[font-size:0.6875rem] [&_th]:[font-weight:700] [&_th]:[letter-spacing:.5px] [&_th]:[white-space:nowrap]
  [&_td]:[padding:10px_13px] [&_td]:[border-top:1px_solid_#f0f0f3] [&_td]:[color:#72727c] [&_td]:[font-size:var(--font-size-caption)] [&_td]:[white-space:nowrap]
  [&_.table-course]:[display:flex] [&_.table-course]:[align-items:center] [&_.table-course]:[gap:9px] [&_.table-course]:[min-width:200px] [&_.table-course_img]:[width:38px]
  [&_.table-course_img]:[height:32px] [&_.table-course_img]:[object-fit:cover] [&_.table-course_img]:[border-radius:4px] [&_.table-course_img]:[background:#f0eef5] [&_.table-course_div]:[display:grid]
  [&_.table-course_div]:[gap:4px] [&_.table-course_div]:[white-space:normal] [&_.table-course_strong]:[max-width:220px] [&_.table-course_strong]:[color:#41414a] [&_.table-course_strong]:[font-size:var(--font-size-caption)]
  [&_.table-course_span]:[color:#a1a0aa] [&_.table-course_span]:[font-size:0.6875rem] [&_.category-pill]:[display:inline-flex] [&_.category-pill]:[padding:4px_6px] [&_.category-pill]:[border-radius:4px]
  [&_.category-pill]:[background:#f0edff] [&_.category-pill]:[color:#684bcf] [&_.category-pill]:[font-size:0.6875rem] [&_.enrolled-pill]:[display:inline-flex] [&_.enrolled-pill]:[padding:4px_6px]
  [&_.enrolled-pill]:[border-radius:4px] [&_.enrolled-pill]:[background:#edf7f0] [&_.enrolled-pill]:[color:#4c8b63] [&_.enrolled-pill]:[font-size:0.6875rem] [&_.category-pill.mint]:[background:#e6f4ea]
  [&_.category-pill.mint]:[color:#39805f] [&_.category-pill.peach]:[background:#fff0e8] [&_.category-pill.peach]:[color:#bd7252] [&_.category-pill.blue]:[background:#e8f2ff] [&_.category-pill.blue]:[color:#4678ad]
  [&_.category-pill.yellow]:[background:#fff4dc] [&_.category-pill.yellow]:[color:#aa812c] [&_.table-actions]:[display:flex] [&_.table-actions]:[gap:5px] [&_.table-actions_button]:[width:27px]
  [&_.table-actions_button]:[height:27px] [&_.table-actions_button]:[display:grid] [&_.table-actions_button]:[place-items:center] [&_.table-actions_button]:[border:1px_solid_#ecebf1] [&_.table-actions_button]:[border-radius:5px]
  [&_.table-actions_button]:[background:#fff] [&_.table-actions_button]:[color:#777681] [&_.delete-class]:[width:27px] [&_.delete-class]:[height:27px] [&_.delete-class]:[display:grid]
  [&_.delete-class]:[place-items:center] [&_.delete-class]:[border:1px_solid_#ecebf1] [&_.delete-class]:[border-radius:5px] [&_.delete-class]:[background:#fff] [&_.delete-class]:[color:#c27369]
  [&_.table-actions_button:hover]:[border-color:#cfc5f4] [&_.table-actions_button:hover]:[color:#6e50d6] [&_.table-actions_button.delete-action]:[color:#c27369] [&_.table-actions_button.delete-action:hover]:[border-color:#efcfcb] [&_.table-actions_button.delete-action:hover]:[background:#fff8f7]
  [&_.delete-class:hover]:[border-color:#efcfcb] [&_.delete-class:hover]:[background:#fff8f7] [&_.empty-table]:[padding:22px] [&_.empty-table]:[color:#9999a2] [&_.empty-table]:[text-align:center]
  [&_.classes-panel]:[padding-bottom:5px] [&_.class-form]:[display:grid] [&_.class-form]:[grid-template-columns:1.35fr_1.4fr_1fr_.8fr_.8fr_auto] [&_.class-form]:[align-items:end] [&_.class-form]:[gap:9px]
  [&_.class-form]:[margin:0_17px_15px] [&_.class-form]:[padding:13px] [&_.class-form]:[border:1px_solid_#eeecf5] [&_.class-form]:[border-radius:7px] [&_.class-form]:[background:#fcfbff]
  [&_.class-form_.primary-button]:[margin:0] [&_.class-form_.primary-button]:[white-space:nowrap] [&_.class-admin-list]:[padding:0_17px] [&_.class-admin-list_article]:[display:flex] [&_.class-admin-list_article]:[align-items:center]
  [&_.class-admin-list_article]:[gap:10px] [&_.class-admin-list_article]:[padding:11px_0] [&_.class-admin-list_article]:[border-top:1px_solid_#f0f0f3] [&_.schedule-icon]:[width:31px] [&_.schedule-icon]:[height:31px]
  [&_.schedule-icon]:[display:grid] [&_.schedule-icon]:[flex:0_0_auto] [&_.schedule-icon]:[place-items:center] [&_.schedule-icon]:[border-radius:7px] [&_.schedule-icon]:[background:#f0edff]
  [&_.schedule-icon]:[color:#7154dc] [&_.schedule-copy]:[display:grid] [&_.schedule-copy]:[flex:1] [&_.schedule-copy]:[min-width:0] [&_.schedule-copy]:[gap:4px]
  [&_.schedule-copy_strong]:[overflow:hidden] [&_.schedule-copy_strong]:[color:#45444d] [&_.schedule-copy_strong]:[font-size:var(--font-size-caption)] [&_.schedule-copy_strong]:[text-overflow:ellipsis] [&_.schedule-copy_strong]:[white-space:nowrap]
  [&_.schedule-copy_span]:[overflow:hidden] [&_.schedule-copy_span]:[color:#9999a3] [&_.schedule-copy_span]:[font-size:0.6875rem] [&_.schedule-copy_span]:[text-overflow:ellipsis] [&_.schedule-copy_span]:[white-space:nowrap]
  [&_.schedule-time_span]:[overflow:hidden] [&_.schedule-time_span]:[color:#9999a3] [&_.schedule-time_span]:[font-size:0.6875rem] [&_.schedule-time_span]:[text-overflow:ellipsis] [&_.schedule-time_span]:[white-space:nowrap]
  [&_.schedule-time]:[display:grid] [&_.schedule-time]:[gap:4px] [&_.schedule-time]:[min-width:85px] [&_.schedule-time_strong]:[color:#575660] [&_.schedule-time_strong]:[font-size:var(--font-size-caption)]
  [&_.empty-classes]:[padding:16px_0] [&_.empty-classes]:[color:#9999a2] [&_.empty-classes]:[font-size:var(--font-size-caption)] [&_.empty-classes]:[text-align:center] [&_.admin-footer]:[padding:4px_0_16px]
  [&_.admin-footer]:[color:#a2a2ac] [&_.admin-footer]:[font-size:0.6875rem] [@media((max-width:1100px))]:[&_.admin-sidebar]:[width:210px] [@media((max-width:1100px))]:[&_.admin-main]:[margin-left:210px] [@media((max-width:1100px))]:[&_.admin-content]:[padding-right:24px]
  [@media((max-width:1100px))]:[&_.admin-content]:[padding-left:24px] [@media((max-width:1100px))]:[&_.admin-topbar]:[padding-right:24px] [@media((max-width:1100px))]:[&_.admin-topbar]:[padding-left:24px] [@media((max-width:1100px))]:[&_.class-form]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] [@media((max-width:1100px))]:[&_.class-form_.primary-button]:[min-height:33px]
  [@media((max-width:720px))]:[&_.admin-sidebar]:[position:static] [@media((max-width:720px))]:[&_.admin-sidebar]:[width:auto] [@media((max-width:720px))]:[&_.admin-sidebar]:[height:55px] [@media((max-width:720px))]:[&_.admin-sidebar]:[flex-direction:row] [@media((max-width:720px))]:[&_.admin-sidebar]:[align-items:center]
  [@media((max-width:720px))]:[&_.admin-sidebar]:[padding:0_16px] [@media((max-width:720px))]:[&_.admin-sidebar]:[border-right:0] [@media((max-width:720px))]:[&_.admin-sidebar]:[border-bottom:1px_solid_#ececf1] [@media((max-width:720px))]:[&_.admin-brand]:[font-size:17px] [@media((max-width:720px))]:[&_.admin-nav-label]:[display:none]
  [@media((max-width:720px))]:[&_.admin-nav-item]:[display:none] [@media((max-width:720px))]:[&_.admin-sidebar-bottom]:[display:none] [@media((max-width:720px))]:[&_.admin-main]:[margin-left:0] [@media((max-width:720px))]:[&_.admin-topbar]:[height:51px] [@media((max-width:720px))]:[&_.admin-topbar]:[padding:0_16px]
  [@media((max-width:720px))]:[&_.admin-content]:[padding:23px_15px_15px] [@media((max-width:720px))]:[&_.admin-welcome_h1]:[font-size:1.75rem] [@media((max-width:720px))]:[&_.admin-stats]:[gap:7px] [@media((max-width:720px))]:[&_.admin-stats_article]:[min-height:83px] [@media((max-width:720px))]:[&_.admin-stats_article]:[padding:11px]
  [@media((max-width:720px))]:[&_.admin-stats_article_>_span]:[max-width:75px] [@media((max-width:720px))]:[&_.admin-stats_article_>_span]:[font-size:0.6875rem] [@media((max-width:720px))]:[&_.admin-stats_article_strong]:[font-size:20px] [@media((max-width:720px))]:[&_.admin-stats_article_>_svg]:[top:10px] [@media((max-width:720px))]:[&_.admin-stats_article_>_svg]:[right:9px]
  [@media((max-width:720px))]:[&_.admin-stats_article_>_svg]:[width:15px] [@media((max-width:720px))]:[&_.admin-form-grid]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [@media((max-width:720px))]:[&_.class-form]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [@media((max-width:720px))]:[&_.class-form_.primary-button]:[align-self:end] [@media((max-width:720px))]:[&_.schedule-time]:[min-width:60px]
  [@media((max-width:420px))]:[&_.admin-welcome]:[align-items:flex-start] [@media((max-width:420px))]:[&_.admin-welcome]:[flex-direction:column] [@media((max-width:420px))]:[&_.refresh-button]:[height:30px] [@media((max-width:420px))]:[&_.admin-stats_article_>_svg]:[display:none] [@media((max-width:420px))]:[&_.table-toolbar]:[align-items:flex-start]
  [@media((max-width:420px))]:[&_.table-toolbar]:[flex-direction:column] [@media((max-width:420px))]:[&_.table-search]:[width:100%] [@media((max-width:420px))]:[&_.class-admin-list]:[padding:0_11px] [&_.admin-welcome_h1]:[font-size:var(--font-size-heading)] [&_.admin-welcome_h1]:[line-height:var(--line-height-heading)]
  [&_.admin-welcome_p]:[line-height:1.6] [&_.admin-stats_article_strong]:[font-size:1.75rem] [&_.panel-heading_h2]:[font-size:var(--font-size-title)] [&_.panel-heading_h2]:[line-height:var(--line-height-heading)] [&_.empty-table]:[font-size:var(--font-size-caption)]
`;

function AdminDashboardPage() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [editingId, setEditingId] = useState(null);
  const [classForm, setClassForm] = useState({ title: '', course: '', instructor: '', time: '', date: '' });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [courseData, classData] = await Promise.all([
        apiRequest('/api/courses'),
        apiRequest('/api/live-classes'),
      ]);
      setCourses(courseData);
      setClasses(classData);
      setClassForm((current) => ({ ...current, course: current.course || courseData[0]?.title || '' }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const updateCourseField = (event) => {
    const { name, value } = event.target;
    setCourseForm((current) => ({ ...current, [name]: value }));
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
          body: JSON.stringify(courseForm),
        },
      );
      setCourses((current) => editingId
        ? current.map((course) => course.id === editingId ? savedCourse : course)
        : [...current, savedCourse]);
      setCourseForm(emptyCourse);
      setEditingId(null);
      setNotice(editingId ? 'Course updated.' : 'Course created.');
    } catch (requestError) {
      setError(requestError.message);
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
      lessons: course.lessons,
      price: course.price,
      oldPrice: course.oldPrice,
      image: course.image,
      color: course.color,
    });
    document.getElementById('course-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const removeCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}" and its scheduled classes?`)) return;
    setError('');
    try {
      await apiRequest(`/api/courses/${course.id}`, { method: 'DELETE' });
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setClasses((current) => current.filter((item) => item.course !== course.title));
      setNotice('Course deleted.');
      if (editingId === course.id) {
        setCourseForm(emptyCourse);
        setEditingId(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitClass = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const newClass = await apiRequest('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm),
      });
      setClasses((current) => [...current, newClass]);
      setClassForm((current) => ({ ...current, title: '', instructor: '', time: '', date: '' }));
      setNotice('Live class scheduled.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeClass = async (item) => {
    setError('');
    try {
      await apiRequest(`/api/live-classes/${item.id}`, { method: 'DELETE' });
      setClasses((current) => current.filter((liveClass) => liveClass.id !== item.id));
      setNotice('Live class removed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const filteredCourses = courses.filter((course) =>
    `${course.title} ${course.category} ${course.instructor}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className={`admin-shell ${adminTailwindStyles}`}>
      <aside className="admin-sidebar">
        <a className="admin-brand" href="#dashboard"><span><GraduationCap size={20} /></span> skillpath<span className="brand-period">.</span></a>
        <div className="admin-nav-label">WORKSPACE</div>
        <a className="admin-nav-item active" href="#dashboard"><LayoutDashboard size={17} /> Overview</a>
        <a className="admin-nav-item" href="#courses"><BookOpen size={17} /> Courses <span>{courses.length}</span></a>
        <a className="admin-nav-item" href="#live-classes"><CalendarDays size={17} /> Live classes <span>{classes.length}</span></a>
        <div className="admin-sidebar-bottom"><div className="admin-avatar">AD</div><div><strong>Platform admin</strong><small>Administrator</small></div><ChevronDown size={16} /></div>
      </aside>

      <main className="admin-main" id="dashboard">
        <header className="admin-topbar"><div><span>Pages</span><b>/</b><strong>Admin dashboard</strong></div><a href="http://127.0.0.1:5173" target="_blank" rel="noreferrer">Open learner site <ArrowUpRight size={15} /></a></header>
        <div className="admin-content">
          <section className="admin-welcome"><div><div className="admin-eyebrow">PLATFORM MANAGEMENT</div><h1>Admin dashboard</h1><p>Manage your learning catalog and upcoming classes.</p></div><button className="refresh-button" onClick={refresh}><RefreshCw size={15} /> Refresh data</button></section>

          {error && <div className="admin-alert error-alert"><CircleAlert size={17} /><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}
          {notice && <div className="admin-alert success-alert"><Check size={17} /><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}

          <section className="admin-stats">
            <article><span>Total courses</span><strong>{courses.length.toString().padStart(2, '0')}</strong><BookOpen size={18} /></article>
            <article><span>Upcoming classes</span><strong>{classes.length.toString().padStart(2, '0')}</strong><CalendarDays size={18} /></article>
            <article><span>Enrolled learners</span><strong>{courses.reduce((sum, course) => sum + (course.enrolled ? 1 : 0), 0).toString().padStart(2, '0')}</strong><GraduationCap size={19} /></article>
          </section>

          <section className="admin-panel" id="courses">
            <div className="panel-heading"><div><div className="admin-eyebrow">CATALOG</div><h2>Course management</h2></div><span className="panel-count">{courses.length} courses</span></div>
            <form className="course-form" id="course-form" onSubmit={submitCourse}>
              <div className="form-heading"><div><span className="form-icon"><Plus size={16} /></span><strong>{editingId ? 'Edit course' : 'Add a course'}</strong></div>{editingId && <button className="cancel-edit" type="button" onClick={() => { setEditingId(null); setCourseForm(emptyCourse); }}>Cancel edit <X size={13} /></button>}</div>
              <div className="admin-form-grid">
                <label className="field-wide">Course title<input name="title" value={courseForm.title} onChange={updateCourseField} placeholder="e.g. Product Design Fundamentals" required /></label>
                <label>Category<select name="category" value={courseForm.category} onChange={updateCourseField}><option>Design</option><option>Development</option><option>Data Science</option><option>Business</option><option>Marketing</option></select></label>
                <label>Level<select name="level" value={courseForm.level} onChange={updateCourseField}><option>Beginner</option><option>Intermediate</option></select></label>
                <label>Instructor<input name="instructor" value={courseForm.instructor} onChange={updateCourseField} placeholder="Instructor name" required /></label>
                <label>Duration<input name="duration" value={courseForm.duration} onChange={updateCourseField} placeholder="e.g. 8 weeks" required /></label>
                <label>Lessons<input name="lessons" type="number" min="1" value={courseForm.lessons} onChange={updateCourseField} required /></label>
                <label>Price (INR)<input name="price" type="number" min="0" value={courseForm.price} onChange={updateCourseField} required /></label>
                <label>Original price (INR)<input name="oldPrice" type="number" min="0" value={courseForm.oldPrice} onChange={updateCourseField} required /></label>
                <label className="field-wide">Course image URL<input name="image" type="url" value={courseForm.image} onChange={updateCourseField} required /></label>
              </div>
              <button className="primary-button" type="submit">{editingId ? <Pencil size={15} /> : <Plus size={16} />}{editingId ? 'Save changes' : 'Create course'}</button>
            </form>

            <div className="table-toolbar"><div><h3>All courses</h3><span>{courses.length} courses in your catalog</span></div><label className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses..." /></label></div>
            <div className="table-scroll"><table><thead><tr><th>COURSE</th><th>CATEGORY</th><th>INSTRUCTOR</th><th>PRICE</th><th>ENROLLED</th><th>ACTIONS</th></tr></thead><tbody>
              {filteredCourses.map((course) => <tr key={course.id}><td><div className="table-course"><img src={course.image} alt="" /><div><strong>{course.title}</strong><span>{course.level} · {course.duration}</span></div></div></td><td><span className={`category-pill ${course.color}`}>{course.category}</span></td><td>{course.instructor}</td><td>₹{Number(course.price).toLocaleString('en-IN')}</td><td><span className="enrolled-pill">{course.enrolled ? 'Yes' : 'No'}</span></td><td><div className="table-actions"><button title="Edit course" onClick={() => startEditing(course)}><Pencil size={15} /></button><button className="delete-action" title="Delete course" onClick={() => removeCourse(course)}><Trash2 size={15} /></button></div></td></tr>)}
              {!loading && filteredCourses.length === 0 && <tr><td className="empty-table" colSpan="6">{courses.length ? 'No matching courses.' : 'No courses available yet.'}</td></tr>}
              {loading && <tr><td className="empty-table" colSpan="6">Loading catalog…</td></tr>}
            </tbody></table></div>
          </section>

          <section className="admin-panel classes-panel" id="live-classes">
            <div className="panel-heading"><div><div className="admin-eyebrow">CLASSROOM</div><h2>Live class schedule</h2></div><span className="panel-count">{classes.length} scheduled</span></div>
            <form className="class-form" onSubmit={submitClass}>
              <label>Class title<input value={classForm.title} onChange={(event) => setClassForm({ ...classForm, title: event.target.value })} placeholder="e.g. Portfolio review" required /></label>
              <label>Course<select value={classForm.course} onChange={(event) => setClassForm({ ...classForm, course: event.target.value })} required>{courses.map((course) => <option key={course.id} value={course.title}>{course.title}</option>)}</select></label>
              <label>Instructor<input value={classForm.instructor} onChange={(event) => setClassForm({ ...classForm, instructor: event.target.value })} placeholder="Instructor name" required /></label>
              <label>Time<input value={classForm.time} onChange={(event) => setClassForm({ ...classForm, time: event.target.value })} placeholder="e.g. 03:00 PM" required /></label>
              <label>Date label<input value={classForm.date} onChange={(event) => setClassForm({ ...classForm, date: event.target.value })} placeholder="e.g. Friday" required /></label>
              <button className="primary-button" type="submit" disabled={!courses.length}><Plus size={16} /> Schedule class</button>
            </form>
            <div className="class-admin-list">{classes.map((item) => <article key={item.id}><div className="schedule-icon"><CalendarDays size={17} /></div><div className="schedule-copy"><strong>{item.title}</strong><span>{item.course} · {item.instructor}</span></div><div className="schedule-time"><strong>{item.time}</strong><span>{item.date}</span></div><button className="delete-class" aria-label={`Remove ${item.title}`} onClick={() => removeClass(item)}><Trash2 size={15} /></button></article>)}{!loading && classes.length === 0 && <div className="empty-classes">No live classes scheduled yet.</div>}</div>
          </section>
          <footer className="admin-footer">Skillpath Admin · Changes are shared with the learner site through the API.</footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
