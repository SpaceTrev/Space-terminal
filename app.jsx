import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── THEMES ──────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:"#060d1a", bgHeader:"#08111f", bgSidebar:"#07101e", bgCard:"#0d1828",
    bgHover:"#111e30", bgInput:"#0d1828", bgAIBubble:"#0d1e35", bgUserBubble:"#0d1828",
    bgActiveTF:"#1a2a40", border:"#1a2a40", borderSub:"#0d1a2e",
    text:"#c8d8f0", textStrong:"#e2e8f8", textMuted:"#4a6080", textSub:"#6a88aa", textSymbol:"#8899bb",
    accent:"#ff6b35", accentBlue:"#7dd3fc", up:"#00d4aa", down:"#ff4d6d",
    candleGrad1:"#1a2234", candleGrad2:"#0d1421", candleGrid:"#1e2d45",
    scrollTrack:"#060d1a", scrollThumb:"#1a2a40",
    sendBtnText:"#060d1a", sendDisabled:"#1a2a40", sendDisabledTxt:"#4a6080",
    activeRow:"#112038", tabActive:"#0d1828", tabInactive:"transparent",
    badge:"#1a2a40", badgeText:"#7dd3fc",
  },
  light: {
    bg:"#f2f5fb", bgHeader:"#ffffff", bgSidebar:"#f8fafd", bgCard:"#ffffff",
    bgHover:"#edf1fa", bgInput:"#ffffff", bgAIBubble:"#fff7f3", bgUserBubble:"#eef4ff",
    bgActiveTF:"#e4eaf8", border:"#dce3f0", borderSub:"#edf0f8",
    text:"#2a3650", textStrong:"#0f1d32", textMuted:"#8a9ab8", textSub:"#5a6f90", textSymbol:"#7a8faa",
    accent:"#e05a1a", accentBlue:"#1d4ed8", up:"#059669", down:"#dc2626",
    candleGrad1:"#edf1fa", candleGrad2:"#e2e8f5", candleGrid:"#cdd5e8",
    scrollTrack:"#f2f5fb", scrollThumb:"#dce3f0",
    sendBtnText:"#ffffff", sendDisabled:"#e4eaf8", sendDisabledTxt:"#8a9ab8",
    activeRow:"#deeaff", tabActive:"#ffffff", tabInactive:"transparent",
    badge:"#e4eaf8", badgeText:"#1d4ed8",
  },
};

// ─── FX SYMBOL DATA ───────────────────────────────────────────────────────────
const FX_DATA = {
  "EUR/USD": { bid:"1.0844", ask:"1.0847", spread:"3.0",  change:"+0.0023", pct:"+0.21%", up:true,  O:"1.0831", H:"1.0864", L:"1.0819", C:"1.0847", vol:"84.2K",  sparkline:[20,22,21,25,24,27,26,28,27,30], baseSeed:1082,  type:"fx" },
  "GBP/USD": { bid:"1.2631", ask:"1.2634", spread:"3.0",  change:"-0.0041", pct:"-0.32%", up:false, O:"1.2658", H:"1.2671", L:"1.2618", C:"1.2634", vol:"61.5K",  sparkline:[30,28,29,26,25,23,24,22,23,20], baseSeed:1263,  type:"fx" },
  "USD/JPY": { bid:"149.80", ask:"149.82", spread:"2.0",  change:"+0.34",   pct:"+0.23%", up:true,  O:"149.48", H:"150.12", L:"149.21", C:"149.82", vol:"112.8K", sparkline:[18,19,21,20,22,23,22,24,25,26], baseSeed:14982, type:"fx" },
  "XAU/USD": { bid:"2933.80",ask:"2934.50",spread:"70.0", change:"+12.40",  pct:"+0.43%", up:true,  O:"2921.10",H:"2941.30",L:"2918.40",C:"2934.50",vol:"38.1K",  sparkline:[15,17,16,19,20,22,21,24,23,25], baseSeed:29345, type:"fx" },
  "BTC/USD": { bid:"84,150", ask:"84,210", spread:"60.0", change:"-1,240",  pct:"-1.45%", up:false, O:"85,610", H:"86,220", L:"83,940", C:"84,210", vol:"24.7K",  sparkline:[32,30,28,31,29,26,27,24,22,20], baseSeed:84210, type:"fx" },
};

// ─── FUTURES DATA ─────────────────────────────────────────────────────────────
const FUTURES_DATA = {
  "ES1! (S&P 500)":  { bid:"5,608.50", ask:"5,609.25", spread:"0.75", change:"+24.50", pct:"+0.44%", up:true,  O:"5,584.75", H:"5,621.00", L:"5,578.25", C:"5,609.25", vol:"1.24M", expiry:"Jun 25", sparkline:[22,24,23,26,27,29,28,31,30,33], baseSeed:56092, type:"futures" },
  "NQ1! (Nasdaq)":   { bid:"19,764.50",ask:"19,766.25",spread:"1.75", change:"-86.25",  pct:"-0.43%", up:false, O:"19,852.50",H:"19,901.75",L:"19,742.25",C:"19,766.25",vol:"642K",  expiry:"Jun 25", sparkline:[34,32,31,28,29,27,26,24,22,21], baseSeed:19766, type:"futures" },
  "YM1! (Dow)":      { bid:"41,842.00", ask:"41,846.00",spread:"4.0",  change:"+182.00",pct:"+0.44%", up:true,  O:"41,664.00",H:"41,912.00",L:"41,598.00",C:"41,846.00",vol:"218K",  expiry:"Jun 25", sparkline:[19,21,20,23,24,26,25,28,27,30], baseSeed:41846, type:"futures" },
  "CL1! (Crude Oil)":{ bid:"68.32",     ask:"68.34",    spread:"0.02", change:"-0.84",  pct:"-1.21%", up:false, O:"69.16",    H:"69.48",    L:"68.10",    C:"68.34",    vol:"389K",  expiry:"Apr 26", sparkline:[28,26,27,24,23,21,22,20,19,18], baseSeed:6834,  type:"futures" },
  "GC1! (Gold)":     { bid:"2,932.80",  ask:"2,933.40", spread:"0.60", change:"+11.80", pct:"+0.40%", up:true,  O:"2,921.60", H:"2,940.20", L:"2,917.40", C:"2,933.40", vol:"198K",  expiry:"Apr 26", sparkline:[16,18,17,20,21,23,22,25,24,26], baseSeed:29334, type:"futures" },
  "ZN1! (10Y T-Note)":{ bid:"109.203",  ask:"109.219",  spread:"0.016",change:"-0.281", pct:"-0.26%", up:false, O:"109.484",  H:"109.531",  L:"109.172",  C:"109.219",  vol:"1.08M", expiry:"Jun 25", sparkline:[26,24,25,22,21,19,20,18,17,16], baseSeed:10922, type:"futures" },
  "6E1! (EUR Fut)":  { bid:"1.0841",    ask:"1.0844",   spread:"3.0",  change:"+0.0021",pct:"+0.19%", up:true,  O:"1.0823",   H:"1.0861",   L:"1.0815",   C:"1.0844",   vol:"312K",  expiry:"Jun 25", sparkline:[21,23,22,25,24,27,26,28,27,29], baseSeed:10844, type:"futures" },
  "6J1! (JPY Fut)":  { bid:"0.006681",  ask:"0.006682", spread:"0.1",  change:"+0.000015",pct:"+0.22%",up:true, O:"0.006666", H:"0.006695", L:"0.006660", C:"0.006682", vol:"156K",  expiry:"Jun 25", sparkline:[17,18,20,19,21,22,21,23,24,25], baseSeed:6682,  type:"futures" },
};

const ALL_SYMBOL_DATA = { ...FX_DATA, ...FUTURES_DATA };

const TICKER_DATA = [
  { symbol:"ES1!",    price:"5,609.25", pct:"+0.44%", up:true  },
  { symbol:"NQ1!",    price:"19,766",   pct:"-0.43%", up:false },
  { symbol:"YM1!",    price:"41,846",   pct:"+0.44%", up:true  },
  { symbol:"CL1!",    price:"68.34",    pct:"-1.21%", up:false },
  { symbol:"GC1!",    price:"2,933.40", pct:"+0.40%", up:true  },
  { symbol:"EUR/USD", price:"1.0847",   pct:"+0.21%", up:true  },
  { symbol:"GBP/USD", price:"1.2634",   pct:"-0.32%", up:false },
  { symbol:"USD/JPY", price:"149.82",   pct:"+0.23%", up:true  },
  { symbol:"XAU/USD", price:"2934.50",  pct:"+0.43%", up:true  },
  { symbol:"BTC/USD", price:"84,210",   pct:"-1.45%", up:false },
  { symbol:"ZN1!",    price:"109.219",  pct:"-0.26%", up:false },
  { symbol:"6E1!",    price:"1.0844",   pct:"+0.19%", up:true  },
];

const PANELS = [
  { id:"ai",   label:"AI TERMINAL", icon:"⬡" },
  { id:"news", label:"NEWS",        icon:"◉" },
];

const MOCK_NEWS = [
  { time:"09:42", source:"RTRS", headline:"Fed's Powell signals caution on rate path amid sticky inflation data",    hot:true  },
  { time:"09:31", source:"BBG",  headline:"ECB minutes show divided views on June cut timeline",                     hot:false },
  { time:"09:18", source:"WSJ",  headline:"S&P 500 futures extend gains after strong retail data beat",              hot:true  },
  { time:"08:55", source:"FT",   headline:"Crude oil slides below $69 on demand concerns, IEA cuts forecast",        hot:false },
  { time:"08:33", source:"CNBC", headline:"10-year Treasury yields push toward 4.5% on hot CPI print",              hot:true  },
  { time:"08:12", source:"RTRS", headline:"Treasury yields surge after stronger-than-expected retail sales",         hot:true  },
  { time:"07:44", source:"BBG",  headline:"Japan CPI rises above target for 10th consecutive month",                 hot:false },
  { time:"07:20", source:"FT",   headline:"Euro area industrial output contracts for third straight quarter",        hot:false },
];

const TIMEFRAMES = ["1M","5M","15M","1H","4H","D"];

// ─── CANDLE GENERATOR ─────────────────────────────────────────────────────────
function generateCandles(seed, count = 40) {
  let s = Math.abs(Math.round(seed)) || 1;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: count }, (_, i) => {
    const drift = (rng() - 0.495) * seed * 0.0003;
    const base  = seed + Math.sin(i * 0.25) * seed * 0.008 + drift * i;
    const open  = base;
    const close = open + (rng() - 0.48) * seed * 0.004;
    const high  = Math.max(open, close) + rng() * seed * 0.002;
    const low   = Math.min(open, close) - rng() * seed * 0.002;
    return { open, close, high, low, up: close >= open };
  });
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function MiniSparkline({ data, up, t }) {
  const w = 60, h = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display:"block" }}>
      <polyline points={pts} fill="none" stroke={up ? t.up : t.down} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function CandleChart({ symbol, timeframe, t }) {
  const candles = useMemo(() => {
    const sd = ALL_SYMBOL_DATA[symbol];
    const tfMult = TIMEFRAMES.indexOf(timeframe) + 1;
    return generateCandles((sd?.baseSeed ?? 1000) * tfMult * 0.137, 40);
  }, [symbol, timeframe]);

  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices), maxP = Math.max(...allPrices);
  const toY = (p) => ((maxP - p) / (maxP - minP || 1)) * 175 + 12;
  const cW = 10, gap = 4;

  return (
    <svg width="100%" height="200" viewBox={`0 0 ${candles.length * (cW + gap)} 200`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={t.candleGrad1} />
          <stop offset="100%" stopColor={t.candleGrad2} />
        </linearGradient>
      </defs>
      <rect width="100%" height="200" fill="url(#cGrad)" />
      {[0.2, 0.4, 0.6, 0.8].map(p => (
        <line key={p} x1="0" y1={200*p} x2="100%" y2={200*p}
          stroke={t.candleGrid} strokeWidth="1" strokeDasharray="3,3" />
      ))}
      {candles.map((c, i) => {
        const x       = i * (cW + gap);
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const color   = c.up ? t.up : t.down;
        return (
          <g key={i}>
            <line x1={x+cW/2} y1={toY(c.high)} x2={x+cW/2} y2={toY(c.low)} stroke={color} strokeWidth="1" />
            <rect x={x} y={bodyTop} width={cW} height={Math.max(bodyBot-bodyTop,1)} fill={color} opacity="0.88" rx="0.5" />
          </g>
        );
      })}
    </svg>
  );
}

function TickerBar({ t }) {
  const [offset, setOffset] = useState(0);
  const ref  = useRef(null);
  const last = useRef(performance.now());
  useEffect(() => {
    let frame;
    const animate = (now) => {
      const dt = now - last.current; last.current = now;
      setOffset(o => {
        const next = o - dt * 0.055;
        return (ref.current && next < -(ref.current.scrollWidth / 2)) ? 0 : next;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const items = [...TICKER_DATA, ...TICKER_DATA];
  return (
    <div style={{ overflow:"hidden", background:t.bg, borderBottom:`1px solid ${t.border}`, height:28, transition:"background 0.25s" }}>
      <div ref={ref} style={{ display:"flex", transform:`translateX(${offset}px)`, whiteSpace:"nowrap", willChange:"transform" }}>
        {items.map((item, i) => (
          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"0 16px", fontSize:11, fontFamily:"'IBM Plex Mono',monospace", borderRight:`1px solid ${t.border}`, height:28 }}>
            <span style={{ color:t.textSymbol, letterSpacing:0.5 }}>{item.symbol}</span>
            <span style={{ color:t.textStrong, fontWeight:600 }}>{item.price}</span>
            <span style={{ color:item.up ? t.up : t.down }}>{item.pct}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── WATCHLIST SECTION ────────────────────────────────────────────────────────
function WatchlistSection({ data, activeSymbol, onSelect, t }) {
  return (
    <>
      {Object.entries(data).map(([symbol, p]) => {
        const isActive = symbol === activeSymbol;
        return (
          <div key={symbol}
            onClick={() => onSelect(symbol)}
            style={{
              padding:"9px 12px",
              borderBottom:`1px solid ${t.borderSub}`,
              cursor:"pointer",
              background: isActive ? t.activeRow : "transparent",
              borderLeft:`3px solid ${isActive ? t.accent : "transparent"}`,
              transition:"background 0.12s",
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.bgHover; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? t.activeRow : "transparent"; }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
              <span style={{ fontSize:11, fontWeight:700, color:isActive ? t.accent : t.textStrong, letterSpacing:0.5 }}>{symbol}</span>
              <span style={{ fontSize:11, color:p.up ? t.up : t.down }}>{p.pct}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, color:t.textMuted }}>B <span style={{ color:t.text }}>{p.bid}</span></div>
                <div style={{ fontSize:10, color:t.textMuted }}>A <span style={{ color:t.text }}>{p.ask}</span></div>
              </div>
              <MiniSparkline data={p.sparkline} up={p.up} t={t} />
            </div>
            {p.expiry && (
              <div style={{ fontSize:9, color:t.textMuted, marginTop:3 }}>
                EXP <span style={{ color:t.accentBlue }}>{p.expiry}</span>
                <span style={{ marginLeft:8 }}>SPD {p.spread}</span>
              </div>
            )}
            {!p.expiry && (
              <div style={{ fontSize:9, color:t.textMuted, marginTop:3 }}>SPD {p.spread}</div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── FUTURES STRIP (below chart) ─────────────────────────────────────────────
function FuturesStrip({ t, onSelect, activeSymbol }) {
  const keyFutures = [
    { sym:"ES1! (S&P 500)",   short:"ES1!", price:"5,609.25", pct:"+0.44%", up:true  },
    { sym:"NQ1! (Nasdaq)",    short:"NQ1!", price:"19,766",   pct:"-0.43%", up:false },
    { sym:"CL1! (Crude Oil)", short:"CL1!", price:"68.34",    pct:"-1.21%", up:false },
    { sym:"GC1! (Gold)",      short:"GC1!", price:"2,933.40", pct:"+0.40%", up:true  },
    { sym:"ZN1! (10Y T-Note)",short:"ZN1!", price:"109.219",  pct:"-0.26%", up:false },
  ];
  return (
    <div style={{ display:"flex", gap:1, borderBottom:`1px solid ${t.border}`, background:t.bgSidebar, flexShrink:0 }}>
      {keyFutures.map((f) => {
        const isActive = activeSymbol === f.sym;
        return (
          <div key={f.short}
            onClick={() => onSelect(f.sym)}
            style={{
              flex:1, padding:"6px 10px", cursor:"pointer",
              background: isActive ? t.activeRow : t.bgSidebar,
              borderBottom: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
              transition:"all 0.12s",
              borderRight:`1px solid ${t.border}`,
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
            onMouseLeave={e => e.currentTarget.style.background = isActive ? t.activeRow : t.bgSidebar}
          >
            <div style={{ fontSize:10, fontWeight:700, color: isActive ? t.accent : t.textSub, letterSpacing:0.5 }}>{f.short}</div>
            <div style={{ fontSize:11, color:t.textStrong, fontWeight:600 }}>{f.price}</div>
            <div style={{ fontSize:10, color:f.up ? t.up : t.down }}>{f.pct}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function BloombergDashboard() {
  const [themeKey, setThemeKey]         = useState("dark");
  const [activePanel, setActivePanel]   = useState("ai");
  const [watchlistTab, setWatchlistTab] = useState("fx");     // "fx" | "futures"
  const [activeSymbol, setActiveSymbol] = useState("EUR/USD");
  const [activeTF, setActiveTF]         = useState("4H");
  const [query, setQuery]               = useState("");
  const [messages, setMessages]         = useState([{
    role:"assistant",
    content:"**SPACE TERMINAL ONLINE** — AI-powered market intelligence. Ask me anything: macro analysis, pair correlations, futures term structure, risk-off flows, central bank divergence...",
  }]);
  const [loading, setLoading] = useState(false);
  const [time, setTime]       = useState(new Date());
  const chatEndRef            = useRef(null);

  const t   = THEMES[themeKey];
  const sym = ALL_SYMBOL_DATA[activeSymbol] || FX_DATA["EUR/USD"];

  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const formatTime = (d) => d.toUTCString().slice(17,25) + " UTC";

  const renderMarkdown = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${t.accentBlue}">$1</strong>`)
      .replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");

  const handleSymbolClick = (symbol) => {
    setActiveSymbol(symbol);
    setQuery(`${symbol} analysis and key levels`);
  };

  const askAI = useCallback(async () => {
    if (!query.trim() || loading) return;
    const userMsg = query.trim();
    setQuery("");
    setMessages(m => [...m, { role:"user", content:userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a Bloomberg Terminal AI — a senior macro strategist and analyst covering FX, equity index futures, commodities, and rates. You work inside Space Trading platform.
Respond in sharp, professional terminal style. Use **bold** for key terms, instruments, levels. Be decisive — real views, not hedges.
Market context: EUR/USD 1.0847, GBP/USD 1.2634, USD/JPY 149.82, ES1! 5609, NQ1! 19766, CL1! 68.34, GC1! 2933, ZN1! 109.22, XAU/USD 2934, BTC 84210. Active: ${activeSymbol} ${activeTF}. Date: Mar 17 2026.
3-6 paragraphs max. Think like a trader.`,
          messages:[
            ...messages.filter(m => m.role !== "system").map(m => ({ role:m.role, content:m.content })),
            { role:"user", content:userMsg },
          ],
          tools:[{ type:"web_search_20250305", name:"web_search" }],
        }),
      });
      const data = await res.json();
      const text = data.content.filter(b => b.type==="text").map(b => b.text).join("\n");
      setMessages(m => [...m, { role:"assistant", content:text || "No response." }]);
    } catch {
      setMessages(m => [...m, { role:"assistant", content:"Connection error. Terminal reconnecting..." }]);
    } finally { setLoading(false); }
  }, [query, messages, loading, activeSymbol, activeTF]);

  const isFutures = sym?.type === "futures";

  return (
    <div style={{ fontFamily:"'IBM Plex Mono','Courier New',monospace", background:t.bg, color:t.text, minHeight:"100vh", display:"flex", flexDirection:"column", transition:"background 0.25s, color 0.25s" }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px", background:t.bgHeader, borderBottom:`1px solid ${t.border}`, transition:"background 0.25s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", gap:8 }}>
            {["#ff6b35","#ffd700","#00d4aa"].map((c,i) => (
              <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}` }} />
            ))}
          </div>
          <span style={{ color:t.accent, fontSize:13, fontWeight:700, letterSpacing:3 }}>SPACE</span>
          <span style={{ color:t.textMuted, fontSize:13, letterSpacing:2 }}>TERMINAL</span>
        </div>
        <div style={{ display:"flex", gap:16, alignItems:"center", fontSize:11, color:t.textMuted }}>
          <span>SESSION: <span style={{ color:t.up }}>LIVE</span></span>
          <span>{formatTime(time)}</span>
          <span style={{ color:t.accentBlue }}>FX · FUTURES · METALS · CRYPTO</span>
          <button onClick={() => setThemeKey(k => k==="dark" ? "light" : "dark")} style={{
            background:t.bgCard, border:`1px solid ${t.border}`, color:t.textSub,
            borderRadius:4, padding:"3px 10px", fontSize:11, fontFamily:"inherit",
            cursor:"pointer", letterSpacing:1, transition:"all 0.2s",
          }}>
            {themeKey==="dark" ? "☀ LIGHT" : "☾ DARK"}
          </button>
        </div>
      </div>

      {/* TICKER */}
      <TickerBar t={t} />

      {/* NAV */}
      <div style={{ display:"flex", background:t.bgHeader, borderBottom:`1px solid ${t.border}`, padding:"0 16px", transition:"background 0.25s" }}>
        {PANELS.map(p => (
          <button key={p.id} onClick={() => setActivePanel(p.id)} style={{
            background:"none", border:"none", cursor:"pointer", padding:"10px 20px",
            fontSize:11, letterSpacing:2, fontFamily:"inherit",
            color:activePanel===p.id ? t.accent : t.textMuted,
            borderBottom:`2px solid ${activePanel===p.id ? t.accent : "transparent"}`,
            transition:"all 0.15s", display:"flex", alignItems:"center", gap:6,
          }}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* BODY */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"280px 1fr", overflow:"hidden", maxHeight:"calc(100vh - 118px)" }}>

        {/* SIDEBAR */}
        <div style={{ borderRight:`1px solid ${t.border}`, overflow:"hidden", background:t.bgSidebar, display:"flex", flexDirection:"column", transition:"background 0.25s" }}>

          {/* Watchlist Tab Switcher */}
          <div style={{ display:"flex", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
            {[
              { id:"fx",      label:"FX / CRYPTO", count: Object.keys(FX_DATA).length },
              { id:"futures", label:"FUTURES",      count: Object.keys(FUTURES_DATA).length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setWatchlistTab(tab.id)} style={{
                flex:1, padding:"8px 6px", background:"none", border:"none", cursor:"pointer",
                fontFamily:"inherit", fontSize:10, letterSpacing:1,
                color: watchlistTab===tab.id ? t.accent : t.textMuted,
                borderBottom:`2px solid ${watchlistTab===tab.id ? t.accent : "transparent"}`,
                display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                transition:"all 0.15s",
              }}>
                {tab.label}
                <span style={{ background:t.badge, color:t.badgeText, fontSize:9, padding:"1px 5px", borderRadius:3, fontWeight:700 }}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Scrollable list */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {watchlistTab === "fx" ? (
              <WatchlistSection data={FX_DATA} activeSymbol={activeSymbol} onSelect={handleSymbolClick} t={t} />
            ) : (
              <WatchlistSection data={FUTURES_DATA} activeSymbol={activeSymbol} onSelect={handleSymbolClick} t={t} />
            )}
          </div>

          {/* Session Status */}
          <div style={{ padding:12, borderTop:`1px solid ${t.border}`, flexShrink:0 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:t.textMuted, marginBottom:8 }}>SESSION STATUS</div>
            {[
              { name:"CME FUTURES",  open:true  },
              { name:"LONDON FX",    open:true  },
              { name:"NEW YORK FX",  open:true  },
              { name:"TOKYO",        open:false },
            ].map(s => (
              <div key={s.name} style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:3 }}>
                <span style={{ color:t.textSub }}>{s.name}</span>
                <span style={{ color:s.open ? t.up : t.textMuted }}>● {s.open ? "OPEN" : "CLOSED"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ overflow:"hidden", display:"flex", flexDirection:"column" }}>

          {/* CHART STRIP */}
          <div style={{ padding:"8px 16px 0", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ display:"flex", gap:12, alignItems:"baseline" }}>
                <span style={{ fontSize:13, fontWeight:700, color:t.accent, letterSpacing:0.5 }}>{activeSymbol}</span>
                {isFutures && (
                  <span style={{ fontSize:9, background:t.badge, color:t.badgeText, padding:"2px 6px", borderRadius:3, letterSpacing:1, fontWeight:700 }}>
                    FUTURES · {sym.expiry}
                  </span>
                )}
                <span style={{ fontSize:19, fontWeight:700, color:t.textStrong }}>{sym.ask}</span>
                <span style={{ fontSize:12, color:sym.up ? t.up : t.down }}>
                  {sym.up ? "▲" : "▼"} {sym.change} ({sym.pct})
                </span>
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {TIMEFRAMES.map(tf => (
                  <button key={tf} onClick={() => setActiveTF(tf)} style={{
                    background: tf===activeTF ? t.bgActiveTF : "none",
                    border: `1px solid ${tf===activeTF ? t.accentBlue : "transparent"}`,
                    color: tf===activeTF ? t.accentBlue : t.textMuted,
                    cursor:"pointer", padding:"2px 7px", borderRadius:3,
                    fontSize:10, fontFamily:"inherit", letterSpacing:1, transition:"all 0.12s",
                  }}>{tf}</button>
                ))}
              </div>
            </div>

            <CandleChart symbol={activeSymbol} timeframe={activeTF} t={t} />

            <div style={{ display:"flex", gap:16, padding:"4px 0 8px", fontSize:10, color:t.textMuted }}>
              <span>O <span style={{ color:t.text }}>{sym.O}</span></span>
              <span>H <span style={{ color:t.up }}>{sym.H}</span></span>
              <span>L <span style={{ color:t.down }}>{sym.L}</span></span>
              <span>C <span style={{ color:t.text }}>{sym.C}</span></span>
              <span>VOL <span style={{ color:t.text }}>{sym.vol}</span></span>
              {isFutures && <span style={{ color:t.accentBlue }}>EXP {sym.expiry}</span>}
            </div>
          </div>

          {/* FUTURES QUICK-SELECT STRIP — always visible */}
          <FuturesStrip t={t} onSelect={handleSymbolClick} activeSymbol={activeSymbol} />

          {/* NEWS */}
          {activePanel === "news" ? (
            <div style={{ flex:1, overflow:"auto" }}>
              <div style={{ padding:"8px 16px", fontSize:10, letterSpacing:2, color:t.textMuted, borderBottom:`1px solid ${t.border}` }}>MARKET NEWS FEED — LIVE</div>
              {MOCK_NEWS.map((n, i) => (
                <div key={i}
                  style={{ display:"flex", gap:12, padding:"10px 16px", borderBottom:`1px solid ${t.borderSub}`, cursor:"pointer", transition:"background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color:t.textMuted, fontSize:11, minWidth:36 }}>{n.time}</span>
                  <span style={{ color:t.accent, fontSize:10, fontWeight:700, minWidth:36, letterSpacing:1 }}>{n.source}</span>
                  {n.hot && <span style={{ color:t.down, fontSize:10 }}>●</span>}
                  <span style={{ fontSize:12, color:t.text, lineHeight:1.4 }}>{n.headline}</span>
                </div>
              ))}
            </div>

          ) : (
            /* AI TERMINAL */
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ flex:1, overflow:"auto", padding:16, display:"flex", flexDirection:"column", gap:12 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{
                      minWidth:28, height:28, borderRadius:"50%",
                      background: m.role==="user" ? t.bgUserBubble : t.bgAIBubble,
                      border:`1px solid ${m.role==="user" ? t.accentBlue : t.accent}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, color:m.role==="user" ? t.accentBlue : t.accent, flexShrink:0,
                    }}>
                      {m.role==="user" ? "U" : "AI"}
                    </div>
                    <div style={{
                      fontSize:12, lineHeight:1.7,
                      color: m.role==="user" ? t.accentBlue : t.text,
                      background: m.role==="user" ? t.bgUserBubble : "transparent",
                      padding: m.role==="user" ? "8px 12px" : 0,
                      border: m.role==="user" ? `1px solid ${t.border}` : "none",
                      borderRadius:4, flex:1,
                    }} dangerouslySetInnerHTML={{ __html:renderMarkdown(m.content) }} />
                  </div>
                ))}
                {loading && (
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ minWidth:28, height:28, borderRadius:"50%", background:t.bgAIBubble, border:`1px solid ${t.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:t.accent }}>AI</div>
                    <div style={{ display:"flex", gap:4, padding:"10px 0", alignItems:"center" }}>
                      {[0,1,2].map(d => (
                        <div key={d} style={{ width:6, height:6, borderRadius:"50%", background:t.accent, animation:"pulse 1.2s ease-in-out infinite", animationDelay:`${d*0.2}s`, opacity:0.7 }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick queries */}
              <div style={{ padding:"8px 16px", display:"flex", gap:6, flexWrap:"wrap", borderTop:`1px solid ${t.border}` }}>
                {[
                  `${activeSymbol} outlook this week`,
                  `${activeSymbol} key levels`,
                  isFutures ? "ES1! vs SPY divergence" : "DXY impact on majors",
                  "Risk-off signals today",
                  "Rates vs equities correlation",
                ].map((q, i) => (
                  <button key={i} onClick={() => setQuery(q)} style={{
                    background:t.bgCard, border:`1px solid ${t.border}`,
                    color:t.textSub, fontSize:10, padding:"4px 10px",
                    borderRadius:2, cursor:"pointer", fontFamily:"inherit",
                    letterSpacing:0.5, transition:"all 0.15s",
                  }}
                    onMouseEnter={e => { e.target.style.borderColor = t.accent; e.target.style.color = t.accent; }}
                    onMouseLeave={e => { e.target.style.borderColor = t.border; e.target.style.color = t.textSub; }}>
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding:"12px 16px", background:t.bgSidebar, borderTop:`1px solid ${t.border}`, display:"flex", gap:10, transition:"background 0.25s" }}>
                <div style={{ flex:1, position:"relative" }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:t.accent, fontSize:12, pointerEvents:"none" }}>⬡</span>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && askAI()}
                    placeholder={`Ask about ${activeSymbol}... or any macro / futures question`}
                    style={{
                      width:"100%", background:t.bgInput, border:`1px solid ${t.border}`,
                      color:t.text, padding:"10px 12px 10px 30px",
                      fontSize:12, fontFamily:"inherit", borderRadius:3,
                      outline:"none", boxSizing:"border-box", transition:"border-color 0.15s, background 0.25s",
                    }}
                    onFocus={e => e.target.style.borderColor = t.accent}
                    onBlur={e  => e.target.style.borderColor = t.border}
                  />
                </div>
                <button onClick={askAI} disabled={loading} style={{
                  background: loading ? t.sendDisabled : t.accent, border:"none",
                  color: loading ? t.sendDisabledTxt : t.sendBtnText,
                  padding:"0 20px", fontSize:11, fontFamily:"inherit", fontWeight:700,
                  letterSpacing:2, cursor:loading ? "not-allowed" : "pointer", borderRadius:3, transition:"all 0.15s",
                }}>
                  {loading ? "..." : "SEND ↵"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${t.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background:${t.scrollThumb}; border-radius:2px; }
        @keyframes pulse {
          0%,100% { opacity:0.3; transform:scale(0.8); }
          50%      { opacity:1;   transform:scale(1.2); }
        }
        input::placeholder { color:${t.textMuted}; opacity:1; }
      `}</style>
    </div>
  );
}
