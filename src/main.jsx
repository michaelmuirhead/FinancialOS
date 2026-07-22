import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Home, WalletCards, CalendarDays, ArrowRightLeft, ClipboardList,
  Landmark, PiggyBank, Target, TrendingUp, ReceiptText, FileText,
  Settings, Bell, CircleDollarSign, AlertTriangle, CheckCircle2, Download, PlusCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './styles.css';

const navItems = [
  [Home, 'Dashboard'], [WalletCards, 'Paycheck Planner'], [CalendarDays, 'Bills & Calendar'],
  [ArrowRightLeft, 'Transactions'], [ClipboardList, 'Budget'], [Landmark, 'Debt Payoff'],
  [PiggyBank, 'Sinking Funds'], [Target, 'Savings Goals'], [TrendingUp, 'Net Worth'],
  [ReceiptText, 'Tax Center'], [FileText, 'Reports'], [FileText, 'Documents'], [Settings, 'Settings']
];

const cashFlow = [
  { day: 'Jul 1', income: 0, expenses: 0, balance: 1800 },
  { day: 'Jul 5', income: 2700, expenses: 900, balance: 3600 },
  { day: 'Jul 10', income: 2700, expenses: 1800, balance: 4500 },
  { day: 'Jul 15', income: 5400, expenses: 3200, balance: 5800 },
  { day: 'Jul 20', income: 5400, expenses: 4100, balance: 5100 },
  { day: 'Jul 25', income: 9340, expenses: 6100, balance: 7080 },
  { day: 'Jul 31', income: 9340, expenses: 7698, balance: 8245 }
];

const budgetData = [
  { name: 'Housing', value: 2400 }, { name: 'Transportation', value: 900 },
  { name: 'Food', value: 1000 }, { name: 'Utilities', value: 550 },
  { name: 'Insurance', value: 500 }, { name: 'Giving', value: 620 },
  { name: 'Other', value: 1530 }
];

const netWorthData = [
  { month: 'Aug', value: 165000 }, { month: 'Sep', value: 168500 }, { month: 'Oct', value: 171000 },
  { month: 'Nov', value: 170200 }, { month: 'Dec', value: 174800 }, { month: 'Jan', value: 176100 },
  { month: 'Feb', value: 179400 }, { month: 'Mar', value: 181000 }, { month: 'Apr', value: 183900 },
  { month: 'May', value: 186745 }, { month: 'Jun', value: 188600 }, { month: 'Jul', value: 190400 }
];

const bills = [
  { date: 'JUL 22', name: 'Car Payment', detail: 'Due tomorrow', amount: 483.21 },
  { date: 'JUL 24', name: 'Electric Bill', detail: 'Due in 3 days', amount: 156.00 },
  { date: 'JUL 26', name: 'Phone Bill', detail: 'Due in 5 days', amount: 142.57 },
  { date: 'JUL 29', name: 'Internet', detail: 'Due in 8 days', amount: 74.99 },
  { date: 'AUG 01', name: 'Groceries Budget', detail: 'Fund next pay period', amount: 200.00 }
];

const debts = [
  { name: 'Discover Card', balance: 4325.34, rate: 24.24, pct: 74 },
  { name: 'Chase Freedom', balance: 3182.88, rate: 21.49, pct: 58 },
  { name: 'Toyota Loan', balance: 8745.21, rate: 5.49, pct: 43 },
  { name: 'Medical Bill', balance: 2186.00, rate: 0, pct: 25 }
];

const goals = [
  { name: 'Emergency Fund', current: 5900, target: 10000 },
  { name: 'Vacation 2026', current: 1250, target: 3000 },
  { name: 'Christmas', current: 600, target: 1200 },
  { name: 'New Vehicle Fund', current: 2100, target: 6000 }
];

const formatMoney = n => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function MetricCard({ label, value, note, icon: Icon, accent = 'green' }) {
  return <div className="metric-card">
    <div className={`metric-icon ${accent}`}><Icon size={22} /></div>
    <div><div className="muted small">{label}</div><div className="metric-value">{value}</div><div className="muted tiny">{note}</div></div>
  </div>;
}

function Panel({ title, action, children, className = '' }) {
  return <section className={`panel ${className}`}>
    <div className="panel-header"><h2>{title}</h2>{action && <button>{action}</button>}</div>
    {children}
  </section>;
}

function App() {
  const [active, setActive] = useState('Dashboard');
  const [period, setPeriod] = useState('This Month');
  const [showAllBills, setShowAllBills] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(window.matchMedia('(display-mode: standalone)').matches);

  useEffect(() => {
    const onPrompt = event => { event.preventDefault(); setInstallPrompt(event); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };
  const safeToSpend = useMemo(() => 1312.47, []);
  const visibleBills = showAllBills ? bills : bills.slice(0, 4);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><CircleDollarSign size={24}/></div><div><strong>Our Financial OS</strong><span>Faith. Family. Freedom.</span></div></div>
      <nav>{navItems.map(([Icon, label]) => <button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-note"><strong>Secure local MVP</strong><span>Sample data only</span></div>
    </aside>

    <main>
      <header className="topbar">
        <div><p>Welcome back, Michael</p><span>Tuesday, July 21, 2026</span></div>
        <div className="top-actions">{installPrompt && !installed && <button className="install-button" onClick={installApp}><Download size={17}/><span>Install</span></button>}<select value={period} onChange={e=>setPeriod(e.target.value)}><option>This Month</option><option>Last Month</option><option>Year to Date</option></select><button aria-label="Notifications"><Bell size={20}/><span className="badge">3</span></button><div className="avatar">MM</div></div>
      </header>

      <div className="content">
        <div className="page-title"><div><h1>{active}</h1><p>Your household financial snapshot — {period.toLowerCase()}.</p></div></div>

        <div className="metrics-grid">
          <MetricCard label="Total Cash" value="$8,245.61" note="Checking + savings" icon={WalletCards}/>
          <MetricCard label="Monthly Income" value="$9,340.00" note="Two household incomes" icon={TrendingUp}/>
          <MetricCard label="Bills Paid" value="$5,184.36" note="76% complete" icon={CheckCircle2} accent="blue"/>
          <MetricCard label="Safe to Spend" value={formatMoney(safeToSpend)} note="After bills, goals & buffer" icon={PiggyBank} accent="purple"/>
          <MetricCard label="Net Worth" value="$190,400" note="Up $3,655 this month" icon={Landmark}/>
        </div>

        <div className="dashboard-grid top-row">
          <Panel title="Cash Flow This Month" className="span-2">
            <div className="cash-summary"><div><span>Income</span><strong className="positive">$9,340.00</strong></div><div><span>Expenses</span><strong className="negative">$7,697.54</strong></div><div><span>Surplus</span><strong className="positive">$1,642.46</strong></div></div>
            <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={cashFlow}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis/><Tooltip/><Area type="monotone" dataKey="income" stroke="#1b9e5a" fill="#dff5e8"/><Area type="monotone" dataKey="expenses" stroke="#dc4b4b" fill="#fde8e8"/><Area type="monotone" dataKey="balance" stroke="#2f6fed" fill="#e5edff"/></AreaChart></ResponsiveContainer></div>
          </Panel>

          <Panel title="Budget Progress">
            <div className="donut-wrap"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={budgetData} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={2}>{budgetData.map((_,i)=><Cell key={i} fill={`hsl(${210+i*35} 70% 55%)`}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>68%</strong><span>used</span></div></div>
            <div className="budget-status">You are <strong>$2,312 under budget</strong></div>
          </Panel>

          <Panel title="Upcoming — Next 14 Days" action="Calendar">
            <div className="bill-list">{visibleBills.map(b=><div className="bill" key={b.name}><div className="date-box">{b.date}</div><div className="bill-main"><strong>{b.name}</strong><span>{b.detail}</span></div><strong>{formatMoney(b.amount)}</strong></div>)}</div>
            <button className="text-button" onClick={()=>setShowAllBills(!showAllBills)}>{showAllBills?'Show fewer':'View all bills'}</button>
          </Panel>
        </div>

        <div className="dashboard-grid middle-row">
          <Panel title="Paycheck Planner">
            <div className="paycards"><div className="pay-card"><div className="pay-head"><strong>Michael — Jul 23</strong><span>Available</span></div><dl><div><dt>Income</dt><dd>$2,710.00</dd></div><div><dt>Bills</dt><dd>($1,982.15)</dd></div><div><dt>Goals</dt><dd>($500.00)</dd></div><div><dt>Cash to Use</dt><dd className="positive">$227.85</dd></div></dl></div><div className="pay-card"><div className="pay-head"><strong>Deisha — Jul 30</strong><span>Planned</span></div><dl><div><dt>Income</dt><dd>$1,960.00</dd></div><div><dt>Bills</dt><dd>($1,467.21)</dd></div><div><dt>Goals</dt><dd>($250.00)</dd></div><div><dt>Cash to Use</dt><dd className="positive">$242.79</dd></div></dl></div></div>
          </Panel>

          <Panel title="Debt Overview">
            <div className="debt-total"><div><span>Total Debt</span><strong>$18,439.43</strong></div><div className="mini-ring">29%</div></div>
            <div>{debts.map(d=><div className="debt-row" key={d.name}><div><strong>{d.name}</strong><span>{formatMoney(d.balance)} · {d.rate}% APR</span></div><div className="progress"><span style={{width:`${d.pct}%`}}/></div></div>)}</div>
          </Panel>

          <Panel title="Savings Goals">
            <div>{goals.map(g=>{const pct=Math.round(g.current/g.target*100); return <div className="goal-row" key={g.name}><div><strong>{g.name}</strong><span>{formatMoney(g.current)} / {formatMoney(g.target)}</span></div><div className="progress"><span style={{width:`${pct}%`}}/></div><em>{pct}%</em></div>})}</div>
          </Panel>

          <Panel title="Alerts & Notifications">
            <div className="alerts"><div><AlertTriangle size={18}/><p><strong>Credit utilization is 87%</strong><span>Consider a payment to lower it below 30%.</span></p></div><div><AlertTriangle size={18}/><p><strong>Electric bill is higher</strong><span>$156.00 versus $121.43 last month.</span></p></div><div><Bell size={18}/><p><strong>Restaurants are over budget</strong><span>You are $143 over this month.</span></p></div></div>
          </Panel>
        </div>

        <div className="dashboard-grid bottom-row">
          <Panel title="Net Worth Trend" className="span-2"><div className="chart small-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={netWorthData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis domain={['dataMin - 5000','dataMax + 5000']}/><Tooltip/><Line type="monotone" dataKey="value" stroke="#1b9e5a" strokeWidth={3}/></LineChart></ResponsiveContainer></div></Panel>
          <Panel title="Quick Actions"><div className="quick-grid"><button>Add Transaction</button><button>Add Bill</button><button>Upload Statement</button><button>Add Goal</button></div></Panel>
          <Panel title="Documents"><div className="document-list"><span>July Bank Statements</span><span>Insurance Policies</span><span>Tax Documents 2025</span><span>Annual Financial Plan</span></div></Panel>
        </div>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[
          [Home, 'Dashboard'], [WalletCards, 'Paychecks'], [PlusCircle, 'Add'], [CalendarDays, 'Bills'], [TrendingUp, 'Goals']
        ].map(([Icon,label]) => <button key={label} className={(active===label || (label==='Paychecks'&&active==='Paycheck Planner') || (label==='Bills'&&active==='Bills & Calendar') || (label==='Goals'&&active==='Savings Goals'))?'active':''} onClick={()=>setActive(label==='Paychecks'?'Paycheck Planner':label==='Bills'?'Bills & Calendar':label==='Goals'?'Savings Goals':label==='Add'?'Transactions':label)}><Icon size={21}/><span>{label}</span></button>)}
      </nav>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
