import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, AudioLines, Bookmark, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clipboard, Clock3, FileText, FlaskConical, ImagePlus, Layers3, LayoutDashboard, LoaderCircle, Menu, Plus, RotateCcw, ScanLine, Settings2, ShieldCheck, Sparkles, Target, Trash2, UsersRound, Video, WandSparkles, X } from 'lucide-react';
import demoReport from '../shared/demo-report.json';

const MODULES = [
  { name: '卖点拆解', full: '产品卖点拆解', sub: '从产品功能，到用户收益', icon: ScanLine },
  { name: '人群分析', full: '找到值得主攻的人群', sub: '不是所有人，都是你的用户', icon: UsersRound },
  { name: '场景分析', full: '让产品进入真实生活', sub: '在具体的时刻，回应具体的需求', icon: LayoutDashboard },
  { name: '买点翻译', full: '把卖点，翻译成购买理由', sub: '少一点参数，多一点「对我有什么用」', icon: AudioLines },
  { name: '创意测试矩阵', full: '让好策略，变成可测试的内容', sub: '一个人群 × 一个场景 × 一个核心买点', icon: FlaskConical },
];
const DIMENSIONS = ['功能', '效果', '情绪', '信任', '差异化'];
const SAMPLE = { productName: '轻行双层随行杯', category: '家居日用 / 水杯', price: '69', details: '450mL 高硼硅玻璃杯，双层杯身设计；配有可拆卸茶滤，适合泡茶和日常饮水；硅胶握持套，旋拧式杯盖，产品介绍标示防漏。\n以上为合成示例资料，尚未提供防漏实测、清洗说明、耐温范围和竞品对比。', platform: '抖音' };
const STATUS = { provided: '资料给出', hypothesis: '策略假设', unverified: '待验证' };
const safeArray = value => Array.isArray(value) ? value : [];
const readStored = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };

function CupArt({ small = false }) {
  return <svg className={small ? 'cup-art small' : 'cup-art'} viewBox="0 0 220 230" aria-label="随行杯示例插画" role="img">
    <defs>
      <linearGradient id="glass" x1="0" x2="1"><stop stopColor="#f7f1df" stopOpacity=".8"/><stop offset=".35" stopColor="#fffdf4" stopOpacity=".5"/><stop offset=".8" stopColor="#cbc9b6" stopOpacity=".6"/><stop offset="1" stopColor="#f5f0df"/></linearGradient>
      <linearGradient id="coffee" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#92704d"/><stop offset="1" stopColor="#c9a67a"/></linearGradient>
      <linearGradient id="sleeve" x1="0" x2="1"><stop stopColor="#85917c"/><stop offset=".5" stopColor="#a5af97"/><stop offset="1" stopColor="#74836c"/></linearGradient>
      <filter id="shadow"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <ellipse cx="111" cy="211" rx="57" ry="8" fill="#676448" opacity=".15" filter="url(#shadow)"/>
    <g transform="rotate(-9 110 125)">
      <path d="M65 54H157L147 191Q146 204 110 204Q74 204 73 191Z" fill="url(#glass)" stroke="#c3c2ac" strokeWidth="1.2"/>
      <path d="M73 80H149L141 187Q138 195 110 195Q82 195 80 186Z" fill="url(#coffee)" opacity=".8"/>
      <ellipse cx="111" cy="80" rx="38" ry="6" fill="#75533b" opacity=".8"/>
      <path d="M65 109Q110 118 153 109L149 164Q110 175 69 164Z" fill="url(#sleeve)"/>
      {[78, 84, 90, 96, 102, 108, 114, 120, 126, 132, 138, 144].map((x, i) => <path key={x} d={`M${x} 117L${x + (i < 6 ? 2 : -2)} 162`} stroke="#65765e" opacity=".28" strokeWidth="1"/>)}
      <text x="109" y="144" textAnchor="middle" fill="#f7f5e8" fontSize="11" letterSpacing="3" fontFamily="Georgia">QING</text>
      <path d="M64 48Q110 37 157 48V65Q110 76 64 65Z" fill="#66765d"/>
      <ellipse cx="110" cy="48" rx="47" ry="9" fill="#8b9980"/>
      <ellipse cx="110" cy="47" rx="36" ry="5.2" fill="#a7b29a"/>
      <rect x="103" y="41" width="24" height="7" rx="3.5" fill="#5f7158"/>
      <path d="M75 73L82 106M80 177L82 188" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".65"/>
    </g>
    <path d="M167 169q22-25 31-3-18 1-27 11" fill="#c2cab0"/><path d="M174 175q17-10 25-1-17 12-25 7" fill="#a7b799"/>
  </svg>;
}

function Tag({ children, tone = '', className = '' }) { return <span className={`tag ${tone} ${className}`}>{children}</span>; }
function Status({ value }) { return <span className={`status ${value || 'hypothesis'}`}><span />{STATUS[value] || '策略判断'}</span>; }
function SectionTitle({ active, count }) {
  const item = MODULES[active];
  return <div className="section-heading"><div className="section-title"><span className="section-number">0{active + 1}</span><div><h2>{item.full}</h2><p>{item.sub}</p></div></div>{count && <span className="section-count">{count}</span>}</div>;
}

function SellingPoints({ report }) {
  const [filter, setFilter] = useState('全部维度');
  const items = safeArray(report.sellingPoints).filter(p => filter === '全部维度' || p.dimension === filter);
  return <><div className="dimension-filters"><button className={filter === '全部维度' ? 'selected' : ''} onClick={() => setFilter('全部维度')}>全部维度</button>{DIMENSIONS.map((d, i) => <button key={d} className={`dimension-${i} ${filter === d ? 'selected' : ''}`} onClick={() => setFilter(d)}><span />{d}</button>)}</div>
    <div className="selling-grid">{items.map((point, index) => <article className={`selling-card dimension-${DIMENSIONS.indexOf(point.dimension)}`} key={`${point.dimension}-${index}`}>
      <div className="selling-card-top"><span className="dimension-label"><span className="check-dot"><Check size={12}/></span>{point.dimension}</span><Status value={point.status}/></div>
      <h3>{point.title}</h3><p className="card-content">{point.content}</p>
      <div className="visual-tip"><Video size={14}/><span>{point.visual}</span></div><div className="evidence"><FileText size={12}/>{point.evidence}</div>
    </article>)}{filter === '全部维度' && <article className="selling-guide"><div className="mini-icon"><Target size={21}/></div><span className="eyebrow">先讲哪一个？</span><h3>{report.prioritySellingPoint}</h3><p>从有资料支持、用户有感知、镜头易表达的卖点开始。</p><div className="guide-footer"><Sparkles size={13}/>{safeArray(report.supportingPoints).join(' · ')}</div></article>}</div>
    <div className="insight-note"><ShieldCheck size={17}/><p><strong>好卖点，经得起追问。</strong>资料给出不等于独立实测。效果与独有优势，需要对应材料支持。</p></div></>;
}

function Audiences({ report }) {
  return <><div className="audience-grid">{safeArray(report.audiences).map((a, i) => <article className={`audience-card audience-${i}`} key={a.id || i}>
    <div className="audience-top"><span className="avatar-icon"><UsersRound size={22}/></span><Tag tone={i === 0 ? 'green' : 'muted'}>{a.role}人群</Tag></div><h3>{a.name}</h3><p className="audience-description">{a.description}</p>
    <div className="metric-list">{safeArray(a.metrics).map(m => <div className="metric" key={m.label} title={m.reason}><span>{m.label}</span><div className="metric-bars">{[1,2,3].map(n => <i key={n} className={n <= ({ 高: 3, 中: 2, 低: 1 }[m.value] || 1) ? 'filled' : ''}/>)}</div><b>{m.value}</b></div>)}</div>
    <dl className="detail-list"><dt>购买触发</dt><dd>{a.trigger}</dd><dt>核心需求</dt><dd>{a.need}</dd><dt>主要顾虑</dt><dd>{a.concern}</dd><dt>对应卖点</dt><dd>{a.sellingPoint}</dd></dl>
    <div className="role-line">购买：{a.buyer} · 使用：{a.user}{a.influencer && ` · 决策影响：${a.influencer}`}</div><div className="format-tags">{safeArray(a.formats).map(f => <Tag key={f}>{f}</Tag>)}</div><div className="audience-reason"><Target size={14}/><span>{a.reason}</span></div>
  </article>)}</div><div className="insight-note"><CircleHelp size={17}/><p>以上人群及高／中／低为基于现有资料的策略判断，条形仅表达相对优先级，不代表市场统计或购买概率。</p></div></>;
}

function Scenes({ report }) {
  return <div className="scene-grid">{safeArray(report.scenes).map((s, i) => <article className={`scene-card dimension-${i}`} key={s.id || i}><div className="scene-head"><span className="scene-index">0{i + 1}</span><Status value={s.status}/></div><h3>{s.title}</h3><p className="scene-person">{s.person} · {s.trigger}</p><div className="scene-action"><b>正在发生</b><p>{s.action}</p><p>{s.problem}</p></div><dl className="detail-list"><dt>想要的结果</dt><dd>{s.desired}</dd><dt>商品如何参与</dt><dd>{s.participation}</dd></dl><div className="scene-visual"><Video size={17}/><div><b>把场景拍出来</b><p>{s.visual}</p></div></div></article>)}</div>;
}

function Translations({ report }) {
  return <><div className="translation-labels"><span>产品有什么 <span>SELLING POINT</span></span><span/><span>与用户有什么关系 <span>BUYING REASON</span></span></div><div className="translation-list">{safeArray(report.translations).map((t,i) => <article className="translation-row" key={i}><div className={`translation-source dimension-${DIMENSIONS.indexOf(t.dimension)}`}><Tag>{t.dimension}</Tag><h3>{t.feature}</h3><p>{t.audience} · {t.scene}</p></div><div className="translation-arrow"><ArrowRight size={20}/></div><div className="translation-target"><h3>{t.reason}</h3><blockquote>“{t.expression}”</blockquote><div className="translation-evidence"><Status value={t.status}/><span>{t.evidence}</span></div></div></article>)}</div><div className="core-reason"><Sparkles size={22}/><div><span>这款产品，最值得先讲的购买理由</span><p>{report.coreReason}</p></div></div></>;
}

function Matrix({ report }) {
  const [filter, setFilter] = useState('全部形式');
  const [expanded, setExpanded] = useState(report.recommendation?.id || 'A1');
  const items = safeArray(report.matrix).filter(m => filter === '全部形式' || m.format === filter);
  return <><div className="matrix-toolbar"><div className="segmented">{['全部形式', '纯产品', '人物引流', '剧情带货'].map(f => <button className={filter === f ? 'active' : ''} onClick={() => setFilter(f)} key={f}>{f}</button>)}</div><span>{items.length} 个创意 · 点击展开拍摄思路</span></div>
    <div className="matrix-list">{items.map(m => <article className={`matrix-card ${expanded === m.id ? 'expanded' : ''}`} key={m.id}><button className="matrix-summary" aria-expanded={expanded === m.id} onClick={() => setExpanded(expanded === m.id ? '' : m.id)}><span className="matrix-id">{m.id}</span><div className="matrix-target"><span>{m.audience}</span><small>{m.scene}</small></div><div className="matrix-buy"><span>{m.buyingReason}</span>{m.id === report.recommendation?.id && <Tag tone="green"><Sparkles size={11}/>建议先做</Tag>}</div><Tag tone={m.format === '纯产品' ? 'purple' : m.format === '人物引流' ? 'blue' : 'pink'}>{m.format}</Tag><span className="priority-dot">{m.priority}优先级</span><ChevronDown size={17} className="expand-chevron"/></button>{expanded === m.id && <div className="matrix-detail"><div><span className="step-label">01 / 前三秒</span><h4>{m.hook}</h4><p>{m.opening}</p></div><div><span className="step-label">02 / 展示买点</span><p>{m.middle}</p></div><div><span className="step-label">03 / 结尾行动</span><p>{m.ending}</p></div><div className="matrix-materials"><FileText size={13}/><span>所需素材：{m.materials} {m.evidence}</span></div></div>}</article>)}</div>
    {report.recommendation && <div className="recommendation"><div className="mini-icon"><FlaskConical size={20}/></div><div><h3>第一条，先从 {report.recommendation.id} 开始</h3><p>{report.recommendation.reason}</p><small>A/B 测试建议：{report.recommendation.abSuggestion}</small></div></div>}
  </>;
}

function markdown(report) {
  const out = [`# ${report.productName} · 商品策略报告`, report.summary, `核心购买理由：${report.coreReason}`, '\n## 资料依据', ...safeArray(report.sources).map(s => `- ${s.id} ${s.label}：${s.content}`), '\n## 01 产品卖点拆解'];
  safeArray(report.sellingPoints).forEach(p => out.push(`### ${p.dimension}：${p.title}`, p.content, `依据：${p.evidence}（${STATUS[p.status] || '策略判断'}）`, `画面：${p.visual}`));
  out.push(`优先主讲：${report.prioritySellingPoint}`, `辅助：${safeArray(report.supportingPoints).join('、')}`, '\n## 02 人群分析');
  safeArray(report.audiences).forEach(a => out.push(`### ${a.role}：${a.name}`, a.description, `购买者：${a.buyer}；使用者：${a.user}；影响者：${a.influencer}`, `购买触发：${a.trigger}`, `需求：${a.need}`, `顾虑：${a.concern}`, `对应卖点：${a.sellingPoint}`, `内容形式：${safeArray(a.formats).join('、')}`, ...safeArray(a.metrics).map(m => `${m.label}：${m.value}（${m.reason}）`), `优先级：${a.priority}（${a.reason}）`));
  out.push('\n## 03 场景分析'); safeArray(report.scenes).forEach(s => out.push(`### ${s.title}`, `${s.person}，${s.trigger}`, `${s.action}。${s.problem}`, `期望：${s.desired}`, `商品参与：${s.participation}`, `画面：${s.visual}（${STATUS[s.status] || '策略假设'}）`));
  out.push('\n## 04 卖点翻译成买点'); safeArray(report.translations).forEach(t => out.push(`### ${t.dimension}：${t.feature}`, `${t.audience} · ${t.scene}`, `购买理由：${t.reason}`, `可用表达：“${t.expression}”`, `依据：${t.evidence}（${STATUS[t.status] || '策略判断'}）`));
  out.push('\n## 05 人群×场景×买点创意测试矩阵'); safeArray(report.matrix).forEach(m => out.push(`### ${m.id} ${m.format} · ${m.priority}优先级`, `人群：${m.audience}；场景：${m.scene}；买点：${m.buyingReason}`, `前三秒：${m.opening}；文案：${m.hook}`, `中段：${m.middle}`, `结尾：${m.ending}`, `素材：${m.materials}；依据：${m.evidence}`));
  if (report.recommendation) out.push(`建议先做：${report.recommendation.id}，${report.recommendation.reason}`, `A/B建议：${report.recommendation.abSuggestion}`);
  out.push('\n## 待补资料', ...safeArray(report.missingInfo).map(s => `- ${s}`), '\n以上为基于输入资料的内容策略；人群、场景及创意判断需要真实测试，不承诺销量或转化结果。');
  return out.join('\n\n');
}

export default function App() {
  const [form, setForm] = useState({ ...SAMPLE });
  const [images, setImages] = useState([]);
  const [sampleImage, setSampleImage] = useState(true);
  const [report, setReport] = useState(demoReport);
  const [isDemo, setIsDemo] = useState(true);
  const [active, setActive] = useState(0);
  const [view, setView] = useState('workspace');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [settings, setSettings] = useState(() => ({ baseUrl: readStored('zhiwu-model', {}).baseUrl || 'https://api.openai.com/v1', model: readStored('zhiwu-model', {}).model || 'gpt-4o-mini', apiKey: '' }));
  const [configured, setConfigured] = useState(false);
  const [history, setHistory] = useState(() => readStored('zhiwu-reports', []));
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const reportRef = useRef(null);
  const controllerRef = useRef(null);
  useEffect(() => { fetch('/api/health').then(r => r.ok ? r.json() : null).then(data => setConfigured(!!data?.configured)).catch(() => {}); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const onEscape = e => { if (e.key === 'Escape') { setModal(''); setMobileNav(false); } }; window.addEventListener('keydown', onEscape); return () => window.removeEventListener('keydown', onEscape); }, []);
  useLayoutEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="dialog"]');
    const focusable = () => Array.from(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]') || []);
    const trapFocus = e => { if (e.key !== 'Tab') return; const nodes = focusable(); const first = nodes[0]; const last = nodes.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } };
    (dialog?.querySelector('input') || focusable()[0])?.focus();
    document.addEventListener('keydown', trapFocus);
    return () => { document.removeEventListener('keydown', trapFocus); previous?.focus(); };
  }, [modal]);
  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const setModule = index => { setActive(index); setView('workspace'); setMobileNav(false); setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20); };
  const loadSample = () => { setForm({ ...SAMPLE }); setImages([]); setSampleImage(true); setReport(demoReport); setIsDemo(true); setActive(0); setError(''); setView('workspace'); setToast('已载入示例商品与完整的五项分析'); };
  const newReport = () => { if (busy) return; setForm({ productName: '', category: '', price: '', details: '', platform: '抖音' }); setImages([]); setSampleImage(false); setReport(null); setError(''); setView('workspace'); setMobileNav(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const uploadFiles = async files => {
    const list = Array.from(files || []); if (!list.length) return;
    if (images.length + list.length > 4) { setError('最多上传 4 张图片，请先移除部分图片。'); return; }
    if (list.some(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) { setError('请上传 JPG、PNG 或 WebP 格式的图片。'); return; }
    if (list.some(f => f.size > 8 * 1024 * 1024)) { setError('单张图片不能超过 8MB，请压缩后重试。'); return; }
    try { const uploaded = await Promise.all(list.map(file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, dataUrl: reader.result }); reader.onerror = reject; reader.readAsDataURL(file); }))); setImages(current => [...current, ...uploaded]); setSampleImage(false); setError(''); } catch { setError('图片读取失败，请重新选择文件。'); }
  };
  const analyze = async e => {
    e.preventDefault(); if (busy) return;
    if (!form.details.trim() && images.length === 0) { setError('请上传产品图片，或填写产品卖点与详情。'); return; }
    if (!configured && !settings.apiKey.trim() && sampleImage && !images.length && Object.keys(SAMPLE).every(key => form[key] === SAMPLE[key])) { loadSample(); setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth' }), 80); return; }
    if (!configured && !settings.apiKey.trim()) { setError('真实商品分析需要连接 AI 模型；可在模型设置中填写，或先使用示例体验。'); setModal('settings'); return; }
    setBusy(true); setError(''); controllerRef.current = new AbortController();
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, images, settings: settings.apiKey.trim() ? { ...settings, apiKey: settings.apiKey.trim() } : undefined }), signal: controllerRef.current.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '分析暂时未完成，请稍后重试。');
      const result = data.report || data; setReport(result); setIsDemo(false); setActive(0); setToast('五项策略分析已完成'); setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { if (err.name === 'AbortError') setToast('已取消分析，可以修改资料后重试'); else setError(err.message || '服务连接失败，请检查模型设置。'); } finally { setBusy(false); controllerRef.current = null; }
  };
  const saveReport = () => { const item = { id: crypto.randomUUID(), date: new Date().toISOString(), report, isDemo }; const next = [item, ...history].slice(0, 20); try { localStorage.setItem('zhiwu-reports', JSON.stringify(next)); setHistory(next); setToast('报告已保存到本机「我的报告」'); } catch { setToast('本机存储空间不足，请导出报告保存'); } };
  const exportReport = () => { const url = URL.createObjectURL(new Blob([markdown(report)], { type: 'text/markdown;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `${report.productName || '商品'}-策略报告.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setToast('完整五项报告已导出'); };
  const copyReport = async () => { try { await navigator.clipboard.writeText(markdown(report)); setToast('完整五项报告已复制'); } catch { setToast('浏览器未允许复制，请使用「导出报告」'); } };

  return <div className="app-shell">
    {mobileNav && <div className="nav-backdrop" onClick={() => setMobileNav(false)}/>}
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setView('workspace'); }}><span className="brand-icon"><Layers3 size={24}/></span><span><strong>知物<span> ZHIWU</span></strong><small>懂产品，更懂购买理由</small></span></a>
      <button className="new-analysis" onClick={newReport} disabled={busy}><Plus size={17}/>新建商品分析</button>
      <span className="nav-caption">工作空间</span><nav className="primary-nav" aria-label="主导航"><button className={view === 'workspace' ? 'active' : ''} onClick={() => { setView('workspace'); setMobileNav(false); }}><LayoutDashboard size={18}/>策略工作台<span className="nav-active-dot"/></button><button className={view === 'history' ? 'active' : ''} onClick={() => { setView('history'); setMobileNav(false); }}><FileText size={18}/>我的报告{history.length > 0 && <span className="nav-count">{history.length}</span>}</button></nav>
      <div className="nav-divider"/><span className="nav-caption">五步，看清一个产品</span><nav className="framework-nav" aria-label="分析模块">{MODULES.map((m,i) => <button key={m.name} onClick={() => setModule(i)} className={active === i && view === 'workspace' ? 'active' : ''}><span>0{i + 1}</span>{m.name}{active === i && view === 'workspace' && <ChevronRight size={13}/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-stars">✧</span><h4>让每一条内容，都有依据</h4><p>从产品事实出发，找到值得测试的创意。</p><button onClick={() => setModal('help')}>了解分析方法 <ArrowUpRight size={13}/></button></div><button className="sidebar-settings" onClick={() => setModal('settings')}><Settings2 size={17}/>模型设置<span className={`connection-dot ${configured || settings.apiKey ? 'on' : ''}`}/></button><div className="workspace-user"><div className="user-avatar">Z</div><div><strong>我的工作空间</strong><small>商品内容策略 · 创作版</small></div><ShieldCheck size={16}/></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="打开导航" onClick={() => setMobileNav(true)}><Menu size={20}/></button><span>工作空间</span><ChevronRight size={13}/><strong>{view === 'history' ? '我的报告' : '商品分析'}</strong></div><div className="topbar-right"><span className="workspace-status"><i/>专注每一个好产品</span><div className="topbar-divider"/><button className="icon-button" aria-label="使用帮助" onClick={() => setModal('help')}><CircleHelp size={19}/></button><span className="top-avatar">Z</span></div></header>
      <main>
        {view === 'history' ? <><div className="page-heading"><div><span className="eyebrow">YOUR STRATEGY LIBRARY</span><h1>我的报告<span className="heading-dot">.</span></h1><p>好的洞察，值得留下。报告仅保存在当前浏览器中。</p></div><button className="button primary" onClick={newReport}><Plus size={16}/>新建分析</button></div>{!history.length ? <div className="empty-state"><div className="empty-icon"><FileText size={32}/></div><h2>第一份策略报告，从一个产品开始</h2><p>完成分析后点击「保存报告」，即可在这里继续查看。</p><button className="button primary" onClick={() => setView('workspace')}>前往策略工作台 <ArrowRight size={16}/></button></div> : <div className="history-grid">{history.map(item => <article className="history-card" key={item.id}><div className="history-card-head"><span className="file-icon"><FileText size={23}/></span><button className="icon-button" aria-label={`删除 ${item.report.productName} 报告`} onClick={() => { const next = history.filter(h => h.id !== item.id); try { localStorage.setItem('zhiwu-reports', JSON.stringify(next)); setHistory(next); } catch { setToast('删除失败，请重试'); } }}><Trash2 size={16}/></button></div><h3>{item.report.productName}</h3><p>{item.report.summary}</p><div className="history-card-foot"><span>{new Date(item.date).toLocaleDateString('zh-CN')}{item.isDemo ? ' · 示例报告' : ''}</span><button onClick={() => { setReport(item.report); setIsDemo(item.isDemo); setActive(0); setView('workspace'); setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }}>查看报告 <ArrowUpRight size={15}/></button></div></article>)}</div>}</> : <>
          <div className="page-heading"><div><span className="eyebrow"><span/> PRODUCT STRATEGY STUDIO</span><h1>商品策略工作台<span className="heading-dot">.</span></h1><p>读懂产品的价值，找到用户想买的理由。</p></div><button className="button secondary sample-button" onClick={loadSample} disabled={busy}><FlaskConical size={16}/>使用示例<ArrowUpRight size={14}/></button></div>
          <form className="product-form" onSubmit={analyze}>
            <div className="form-topline"><h2><span className="mini-square"><ImagePlus size={16}/></span>先认识你的产品<span>图片 + 详情，让分析更有依据</span></h2><Tag tone="muted">STEP 01</Tag></div>
            <div className="product-form-body"><div className={`upload-zone ${dragging ? 'dragging' : ''} ${sampleImage || images.length ? 'has-image' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) uploadFiles(e.dataTransfer.files); }}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} aria-label="上传产品图片" onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }}/>
              {sampleImage ? <div className="sample-product"><span className="product-photo-label">PRODUCT / 01</span><CupArt/><span className="sample-art-label">示例商品插画</span><button type="button" onClick={() => fileRef.current?.click()} disabled={busy}><ImagePlus size={13}/>替换产品图片</button></div> : images.length ? <div className="image-gallery">{images.map((img,i) => <div className="uploaded-image" key={i}><img src={img.dataUrl} alt={img.name}/><button type="button" aria-label={`移除图片 ${img.name}`} disabled={busy} onClick={() => setImages(current => current.filter((_,idx) => idx !== i))}><X size={13}/></button></div>)}{images.length < 4 && <button type="button" className="add-image" onClick={() => fileRef.current?.click()} disabled={busy}><Plus size={18}/><span>添加图片</span></button>}</div> : <button type="button" className="upload-placeholder" onClick={() => fileRef.current?.click()} disabled={busy}><span><ImagePlus size={26}/></span><strong>上传产品图片</strong><p>点击选择，或将图片拖到这里</p><small>JPG / PNG / WebP<br/>最多 4 张，每张不超过 8MB</small></button>}
            </div><div className="product-fields"><div className="form-row"><label className="field product-name"><span>产品名称 <small>选填，AI 可从图片识别</small></span><input value={form.productName} maxLength={100} placeholder="例如：双层玻璃随行杯" onChange={e => updateForm('productName', e.target.value)} disabled={busy}/></label><label className="field category-field"><span>产品品类</span><input value={form.category} maxLength={100} placeholder="例如：家居日用" onChange={e => updateForm('category', e.target.value)} disabled={busy}/></label><label className="field price-field"><span>售价 <small>选填</small></span><div className="price-input"><span>¥</span><input value={form.price} maxLength={30} placeholder="未提供" onChange={e => updateForm('price', e.target.value)} disabled={busy}/></div></label></div>
              <label className="field details-field"><span>产品卖点与详情 <small>可粘贴参数、详情页文案或用户反馈</small></span><textarea value={form.details} maxLength={12000} placeholder="告诉我们：产品有什么功能？材质、成分、规格是什么？解决什么问题？\n可补充价格、使用方法、目标客户，以及能够支持卖点的资料。" onChange={e => updateForm('details', e.target.value)} disabled={busy}/><span className="character-count">{form.details.length} / 12000</span></label>
              <div className="form-bottom"><div className="platform-selector"><span>内容平台</span>{['抖音','小红书','视频号','快手'].map(p => <button type="button" key={p} className={form.platform === p ? 'active' : ''} onClick={() => updateForm('platform', p)} disabled={busy}>{p}</button>)}</div><button className="button primary generate-button" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin"/> : <WandSparkles size={16}/>}<span>{busy ? '正在构建五项分析…' : '生成五项策略分析'}</span>{!busy && <ArrowRight size={15}/>}</button></div>
            </div></div>
            <div className="form-footnote"><span><ShieldCheck size={13}/>图片仅用于本次模型分析，应用不主动保存图片</span><span>{configured || settings.apiKey ? <><i className="tiny-dot"/>AI 模型已配置</> : <>当前为示例体验<button type="button" onClick={() => setModal('settings')}>连接 AI 模型 <ArrowUpRight size={12}/></button></>}</span></div>
          </form>
          {error && <div className="error-message" role="alert"><CircleHelp size={17}/><p>{error}</p><button className="icon-button" onClick={() => setError('')} aria-label="关闭提示"><X size={16}/></button></div>}
          {busy && <div className="loading-panel" role="status"><div className="loading-illustration"><Layers3 size={26}/><span className="spin"><LoaderCircle size={48}/></span></div><h3>正在连接产品价值与用户需求</h3><p>逐项整理资料依据、目标人群与创意方向，通常需要 30–90 秒。</p><div className="loading-steps">{MODULES.map((m,i) => <span key={m.name}><i/>{m.name}</span>)}</div><button className="text-button" onClick={() => controllerRef.current?.abort()}>取消本次分析</button></div>}
          {report && !busy ? <section ref={reportRef} className="report-section" aria-label="五项策略分析报告">
            <div className="report-topline"><div><span className="eyebrow">YOUR PRODUCT, DECODED</span><h2>你的产品，有了清晰的方向 <span className={`report-badge ${isDemo ? '' : 'real'}`}>{isDemo ? '示例报告' : 'AI 策略报告'}</span></h2></div><div className="report-actions"><button className="icon-button" title="复制完整报告" aria-label="复制完整报告" onClick={copyReport}><Clipboard size={16}/></button><button className="button quiet" onClick={saveReport}><Bookmark size={15}/><span>保存报告</span></button><button className="button secondary" onClick={exportReport}><ArrowDownToLine size={15}/>导出报告</button></div></div>
            <div className="strategy-overview"><div className="overview-icon"><Sparkles size={23}/></div><div className="overview-main"><span>本次策略主线 <b>{report.productName}</b></span><p>{report.summary}</p></div><div className="overview-stats"><span><strong>{safeArray(report.sellingPoints).length}</strong>卖点维度</span><span><strong>{safeArray(report.audiences).length}</strong>候选人群</span><span><strong>{safeArray(report.matrix).length}</strong>测试创意</span></div></div>
            {isDemo && <div className="demo-disclaimer"><span/>以下使用虚构商品资料展示分析方式；替换为你的产品资料后，可连接模型生成专属报告。</div>}
            <div className="report-panel"><div className="module-tabs" role="tablist" aria-label="五项分析">{MODULES.map((m,i) => <button role="tab" aria-selected={active === i} aria-controls={`module-panel-${i}`} id={`module-tab-${i}`} key={m.name} className={active === i ? 'active' : ''} onClick={() => setActive(i)}><span className="tab-number">0{i + 1}</span>{m.name}{active === i && <span className="tab-active-dot"/>}</button>)}</div><div className="module-content" role="tabpanel" id={`module-panel-${active}`} aria-labelledby={`module-tab-${active}`}><SectionTitle active={active} count={[`${new Set(safeArray(report.sellingPoints).map(p => p.dimension)).size} 个价值维度`,`${safeArray(report.audiences).length} 类候选人群`,`${safeArray(report.scenes).length} 个具体场景`,`${safeArray(report.translations).length} 组买点转译`,`${safeArray(report.matrix).length} 条可测试创意`][active]}/>{active === 0 ? <SellingPoints key={report.productName} report={report}/> : active === 1 ? <Audiences report={report}/> : active === 2 ? <Scenes report={report}/> : active === 3 ? <Translations report={report}/> : <Matrix key={report.productName} report={report}/>}</div></div>
            <details className="source-panel"><summary><span><FileText size={15}/>资料依据与待确认项 <Tag tone="muted">{safeArray(report.sources).length} 份依据</Tag></span><ChevronDown size={16}/></summary><div className="source-body"><div><h3>已提供的资料</h3>{safeArray(report.sources).map(s => <p key={s.id}><Tag>{s.id}</Tag><strong>{s.label}</strong> {s.content}</p>)}</div><div><h3>进一步完善分析</h3>{safeArray(report.missingInfo).length ? safeArray(report.missingInfo).map((s,i) => <p key={i}><span className="source-bullet"/>{s}</p>) : <p>当前资料足以支持本次分析。创意效果仍需真实测试。</p>}</div></div></details>
          </section> : !busy && <div className="empty-state starter"><div className="empty-icon"><ScanLine size={32}/></div><h2>一个好产品，值得被看见</h2><p>上传产品图、填写卖点详情，开启五个维度的策略分析。</p><button className="text-button" onClick={loadSample}>先看看示例报告 <ArrowRight size={14}/></button></div>}
          <footer className="page-footer"><span><Layers3 size={14}/>知物 · 让产品价值被看见</span><p>策略提供方向，真实测试给出答案。</p><span>PRODUCT STRATEGY STUDIO</span></footer>
        </>}
      </main>
    </div>
    {modal && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(''); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close icon-button" aria-label="关闭弹窗" onClick={() => setModal('')}><X size={20}/></button>{modal === 'settings' ? <><div className="modal-symbol"><Settings2 size={24}/></div><h2 id="modal-title">连接你的 AI 模型</h2><p className="modal-subtitle">支持 OpenAI 及兼容接口。请选择支持图片理解与 JSON 输出的模型。</p><form onSubmit={e => { e.preventDefault(); try { localStorage.setItem('zhiwu-model', JSON.stringify({ baseUrl: settings.baseUrl, model: settings.model })); } catch {} setModal(''); setToast('模型设置已保存，密钥仅在本次页面中使用'); }}><label className="field"><span>API 地址</span><input type="url" required value={settings.baseUrl} onChange={e => setSettings(s => ({...s,baseUrl:e.target.value}))} placeholder="https://api.openai.com/v1"/></label><label className="field"><span>模型名称</span><input required value={settings.model} onChange={e => setSettings(s => ({...s,model:e.target.value}))} placeholder="gpt-4o-mini"/></label><label className="field"><span>API Key <small>{configured ? '服务器已配置，可留空使用' : '仅在当前页面内存中保留'}</small></span><input type="password" autoComplete="off" value={settings.apiKey} onChange={e => setSettings(s => ({...s,apiKey:e.target.value}))} placeholder={configured ? '使用服务器配置的密钥' : '输入你的模型 API Key'}/></label><div className="settings-note"><ShieldCheck size={17}/><p>密钥不会保存在浏览器存储或报告中。生成时，产品资料会经应用服务发送至你配置的模型提供方，并按其政策处理。</p></div><button className="button primary full-width" type="submit"><Check size={16}/>保存模型设置</button></form><p className="modal-help">也可由部署者通过服务器环境变量配置统一模型。</p></> : <><div className="modal-symbol"><Layers3 size={25}/></div><h2 id="modal-title">从一个产品，到一份内容策略</h2><p className="modal-subtitle">知物遵循「电商商品策略师」的五模块分析框架。</p><div className="help-steps">{MODULES.map((m,i) => <div key={m.name}><span>0{i+1}</span><div><strong>{m.name}</strong><p>{m.sub}</p></div></div>)}</div><div className="settings-note"><ShieldCheck size={18}/><p>产品事实标注资料依据；人群、场景与创意标注策略假设。缺少证据的功效和差异化不会当作结论。</p></div><button className="button primary full-width" onClick={() => setModal('')}>开始探索 <ArrowRight size={16}/></button><p className="modal-help">报告支持本机保存与 Markdown 导出，不承诺销量或转化率。</p></>}</section></div>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
