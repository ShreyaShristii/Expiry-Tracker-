import Login from "./Login";
import Signup from "./Signup";
import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS = {
  Active:          { color: "#10B981", bg: "#D1FAE5" },
  "Expiring Soon": { color: "#F59E0B", bg: "#FEF3C7" },
  Expired:         { color: "#EF4444", bg: "#FEE2E2" },
};

const calcDaysLeft = (date) => Math.ceil((new Date(date) - Date.now()) / 864e5);
const calcStatus   = (date) => {
  const d = calcDaysLeft(date);
  if (d < 0)  return "Expired";
  if (d <= 7) return "Expiring Soon";
  return "Active";
};

const CATEGORIES = {
  OTT: { color: "#E50914", icon: "📺" },
  Grocery: { color: "#16A34A", icon: "🛒" },
  Medicine: { color: "#EC4899", icon: "💊" },
  Document: { color: "#3B82F6", icon: "📄" },
  Gadget: { color: "#8B5CF6", icon: "⚙️" },
};

const getBrand = (name, cat) => {
  const n = name.toLowerCase();
  if (cat && CATEGORIES[cat]) return CATEGORIES[cat].color;
  return "#6366F1";
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [mode,  setMode]  = useState("login");
  const [page, setPage] = useState("home");
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [name,  setName]  = useState("");
  const [category,   setCategory]   = useState("OTT");
  const [validityType, setValidityType] = useState("renewal");
  const [validTill,  setValidTill]  = useState("");
  const [price, setPrice] = useState("");
  const [reminderDays, setReminderDays] = useState("7");
  const [renewalCycle, setRenewalCycle] = useState("monthly");
  
  const [quantity, setQuantity] = useState("");
  const [dosage, setDosage] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [guaranteeEndDate, setGuaranteeEndDate] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [addError, setAddError] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (!token) { setItems([]); return; }
    fetch(`${API}/api/items`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setNotifications(data.data || []))
      .catch(console.error);
  }, [token, items]);

  const resetCategoryFields = () => {
    setQuantity("");
    setDosage("");
    setDocumentType("");
    setWarrantyEndDate("");
    setGuaranteeEndDate("");
  };

  const add = async () => {
    if (!name) { setAddError("Please enter a name."); return; }
    if (!validTill)  { setAddError("Please select a date."); return; }
    
    setAddError("");

    const payload = {
      name,
      category,
      validityType,
      validTill,
      cost: Number(price) || 0,
      reminderDays: Number(reminderDays) || 7,
      renewalCycle,
    };

    if (quantity) payload.quantity = Number(quantity);
    if (dosage) payload.dosage = dosage;
    if (documentType) payload.documentType = documentType;
    if (warrantyEndDate) payload.warrantyEndDate = warrantyEndDate;
    if (guaranteeEndDate) payload.guaranteeEndDate = guaranteeEndDate;

    const res = await fetch(`${API}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      setItems(p => [data, ...p]);
      setName("");
      setCategory("OTT");
      setValidityType("renewal");
      setValidTill("");
      setPrice("");
      setReminderDays("7");
      setRenewalCycle("monthly");
      resetCategoryFields();
    } else {
      setAddError(data?.message || "Something went wrong.");
    }
  };

  const del = async () => {
    if (!deleteModal) return;
    await fetch(`${API}/api/items/${deleteModal.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(p => p.filter(i => i._id !== deleteModal.id));
    setDeleteModal(null);
  };

  const renew = async (id) => {
    try {
      const res = await fetch(`${API}/api/items/${id}/renew`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setItems(p => p.map(item => item._id === id ? data.item : item));
      } else {
        alert(data.message || "Failed to renew item");
      }
    } catch (error) {
      console.error("Renew error:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setItems([]);
    setMode("login");
    setPage("home");
    window.location.reload();
  };

  const handleLogin = (t) => {
    localStorage.setItem("token", t);
    setToken(t);
    setPage("home");
  };

  if (!token) {
    return mode === "login"
      ? <Login    onLogin={handleLogin} switchMode={() => setMode("signup")} />
      : <Signup   onLogin={handleLogin} switchMode={() => setMode("login")}  />;
  }

  const filtered = useMemo(() =>
    items
      .filter(i => {
        const ok1 = i.name.toLowerCase().includes(search.toLowerCase());
        const ok2 = filter === "All" || calcStatus(i.validTill) === filter;
        return ok1 && ok2;
      })
      .sort((a, b) => new Date(a.validTill) - new Date(b.validTill)),
  [items, search, filter]);

  const groupedByCategory = useMemo(() => {
    const groups = {};
    filtered.forEach(item => {
      const cat = item.category && CATEGORIES[item.category] ? item.category : "Miscellaneous";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filtered]);

  const categoryOrder = ["OTT", "Grocery", "Medicine", "Document", "Gadget", "Miscellaneous"];
  const sortedCategories = categoryOrder.filter(cat => groupedByCategory[cat]);

  const counts = {
    total:   items.length,
    active:  items.filter(i => calcStatus(i.validTill) === "Active").length,
    soon:    items.filter(i => calcStatus(i.validTill) === "Expiring Soon").length,
    expired: items.filter(i => calcStatus(i.validTill) === "Expired").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%);
          font-family: 'Inter', sans-serif;
          color: #1F2937;
          min-height: 100vh;
        }

        .app-container {
          display: flex;
          height: 100vh;
          background: #F9FAFB;
        }

        /* NAVBAR */
        .navbar {
          background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-toggle {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        }

        .navbar-logo {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .btn-logout {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: .2s;
        }

        .btn-logout:hover {
          background: rgba(255,255,255,0.3);
        }

        /* SIDEBAR */
        .sidebar {
          width: 240px;
          background: white;
          border-right: 1px solid #E5E7EB;
          padding: 80px 0 24px 0;
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          transition: transform 0.3s;
        }

        .sidebar.closed {
          transform: translateX(-100%);
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          margin: 4px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all .2s;
          font-size: 14px;
          color: #6B7280;
          border: none;
          background: none;
          width: calc(100% - 16px);
          text-align: left;
        }

        .sidebar-item:hover {
          background: #F3F4F6;
          color: #6366F1;
        }

        .sidebar-item.active {
          background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
        }

        /* MAIN */
        .main-content {
          flex: 1;
          margin-left: 240px;
          margin-top: 64px;
          overflow-y: auto;
          background: #F9FAFB;
        }

        .main-content.full {
          margin-left: 0;
        }

        .content-wrapper {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .page-subtitle {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 32px;
        }

        /* STATS */
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border-left: 4px solid var(--color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: var(--color);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* FORM */
        .form-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }

        .form-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        input, select {
          flex: 1;
          min-width: 120px;
          padding: 10px 12px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #111827;
          outline: none;
          transition: border-color .2s;
        }

        input:focus, select:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        input::placeholder {
          color: #9CA3AF;
        }

        .btn-add {
          padding: 10px 24px;
          background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: .2s;
        }

        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .form-error {
          color: #EF4444;
          font-size: 12px;
          margin-top: 8px;
        }

        /* CATEGORIES SECTION */
        .category-section {
          margin-bottom: 40px;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #E5E7EB;
        }

        .category-icon {
          font-size: 24px;
        }

        .category-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .category-count {
          margin-left: auto;
          font-size: 12px;
          color: #9CA3AF;
          background: #F3F4F6;
          padding: 4px 10px;
          border-radius: 20px;
        }

        /* GRID */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border-left: 4px solid var(--brand);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: .2s;
        }

        .card:hover {
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .c-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .c-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 2px;
        }

        .c-cat {
          font-size: 11px;
          color: #9CA3AF;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .c-days {
          font-size: 13px;
          font-weight: 600;
          color: #6B7280;
          margin-bottom: 12px;
        }

        .c-info {
          font-size: 12px;
          color: #9CA3AF;
          margin-bottom: 4px;
        }

        .actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-action {
          flex: 1;
          padding: 8px;
          border: 1px solid #E5E7EB;
          background: white;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: .2s;
          color: #6B7280;
        }

        .btn-action:hover {
          border-color: #6366F1;
          color: #6366F1;
          background: #F9FAFB;
        }

        .btn-delete {
          padding: 8px 12px;
          border: 1px solid #FEE2E2;
          background: white;
          border-radius: 6px;
          color: #9CA3AF;
          cursor: pointer;
          font-size: 12px;
          transition: .2s;
        }

        .btn-delete:hover {
          border-color: #EF4444;
          color: #EF4444;
        }

        .empty {
          text-align: center;
          padding: 48px 24px;
          color: #9CA3AF;
        }

        /* HOME PAGE */
        .home-hero {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          padding: 60px 32px;
          border-radius: 16px;
          margin-bottom: 40px;
          text-align: center;
        }

        .home-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          margin-bottom: 12px;
        }

        .home-hero p {
          font-size: 16px;
          opacity: 0.9;
          max-width: 500px;
          margin: 0 auto;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .feature-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .feature-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .feature-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .feature-text {
          font-size: 13px;
          color: #6B7280;
        }

        /* ABOUT PAGE */
        .about-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .about-section h2 {
          color: #111827;
          margin-bottom: 12px;
          font-size: 18px;
        }

        .about-section p {
          color: #6B7280;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          padding: 32px;
          border-radius: 12px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        .modal h3 {
          color: #111827;
          margin-bottom: 12px;
        }

        .modal p {
          color: #6B7280;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-actions button {
          flex: 1;
          padding: 10px;
          border: 1px solid #E5E7EB;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: .2s;
        }

        .modal-actions button:last-child {
          background: #EF4444;
          color: white;
          border-color: #EF4444;
        }

        .modal-actions button:last-child:hover {
          background: #DC2626;
        }
      `}</style>

      <div className="app-container">
        {/* NAVBAR */}
        <div className="navbar">
          <div className="navbar-left">
            <button className="nav-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="navbar-logo">✨ Expiry Tracker</div>
          </div>
          <div className="navbar-right">
            <button className="btn-logout" onClick={logout}>Log out</button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
          {[
            { id: "home", icon: "🏠", label: "Home" },
            { id: "dashboard", icon: "📊", label: "Dashboard" },
            { id: "items", icon: "📋", label: "My Items" },
            { id: "stats", icon: "📈", label: "Statistics" },
            { id: "about", icon: "ℹ️", label: "About" },
            { id: "settings", icon: "⚙️", label: "Settings" },
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                setPage(item.id);
                setSidebarOpen(false);
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          <div className="content-wrapper">

            {/* HOME PAGE */}
            {page === "home" && (
              <>
                <div className="home-hero">
                  <h1>Welcome to Expiry Tracker</h1>
                  <p>Never miss an expiration date again. Track subscriptions, groceries, medicines, documents, and warranties all in one place.</p>
                </div>

                <div className="feature-grid">
                  <div className="feature-card">
                    <div className="feature-icon">📺</div>
                    <div className="feature-title">OTT Subscriptions</div>
                    <div className="feature-text">Track Netflix, Spotify, and other subscriptions</div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🛒</div>
                    <div className="feature-title">Grocery Items</div>
                    <div className="feature-text">Keep track of grocery expiry dates</div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">💊</div>
                    <div className="feature-title">Medicines</div>
                    <div className="feature-text">Never use expired medicines</div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📄</div>
                    <div className="feature-title">Documents</div>
                    <div className="feature-text">Track passport and license validity</div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">⚙️</div>
                    <div className="feature-title">Gadget Warranty</div>
                    <div className="feature-text">Monitor warranty and guarantee periods</div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🔔</div>
                    <div className="feature-title">Smart Alerts</div>
                    <div className="feature-text">Get notified before things expire</div>
                  </div>
                </div>

                <button className="btn-add" onClick={() => setPage("dashboard")} style={{width: '100%', padding: '12px'}}>
                  Start Tracking →
                </button>
              </>
            )}

            {/* DASHBOARD PAGE */}
            {page === "dashboard" && (
              <>
                <div className="page-title">Dashboard</div>
                <div className="page-subtitle">Quick overview of your items</div>

                <div className="stats">
                  <div className="stat-card" style={{"--color": "#10B981"}}>
                    <div className="stat-number">{counts.total}</div>
                    <div className="stat-label">Total Items</div>
                  </div>
                  <div className="stat-card" style={{"--color": "#10B981"}}>
                    <div className="stat-number">{counts.active}</div>
                    <div className="stat-label">Active</div>
                  </div>
                  <div className="stat-card" style={{"--color": "#F59E0B"}}>
                    <div className="stat-number">{counts.soon}</div>
                    <div className="stat-label">Expiring Soon</div>
                  </div>
                  <div className="stat-card" style={{"--color": "#EF4444"}}>
                    <div className="stat-number">{counts.expired}</div>
                    <div className="stat-label">Expired</div>
                  </div>
                </div>

                {notifications.length > 0 && (
                  <div className="form-card" style={{background: '#FEF3C7', borderLeft: '4px solid #F59E0B'}}>
                    <strong>⏰ {notifications.length} item{notifications.length !== 1 ? "s" : ""} expiring soon!</strong>
                    <p style={{marginTop: '8px', color: '#92400E', fontSize: '13px'}}>
                      {notifications.map(n => n.name).join(", ")}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ADD ITEMS PAGE */}
            {page === "dashboard" && (
              <>
                <div className="form-card">
                  <div className="form-title">Add New Item</div>
                  <div className="form-row">
                    <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    <select value={category} onChange={e => {setCategory(e.target.value); resetCategoryFields();}}>
                      <option value="OTT">📺 OTT</option>
                      <option value="Grocery">🛒 Grocery</option>
                      <option value="Medicine">💊 Medicine</option>
                      <option value="Document">📄 Document</option>
                      <option value="Gadget">⚙️ Gadget</option>
                    </select>
                    <input type="date" value={validTill} onChange={e => setValidTill(e.target.value)} />
                  </div>

                  <div className="form-row">
                    <select value={validityType} onChange={e => setValidityType(e.target.value)}>
                      <option value="expiry">Expiry</option>
                      <option value="renewal">Renewal</option>
                      <option value="warranty">Warranty</option>
                    </select>
                    {validityType === "renewal" && (
                      <select value={renewalCycle} onChange={e => setRenewalCycle(e.target.value)}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                    <input type="number" placeholder="Reminder (days)" value={reminderDays} onChange={e => setReminderDays(e.target.value)} />
                    <input type="number" placeholder="Cost ₹" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>

                  {(category === "Grocery" || category === "Medicine" || category === "Document" || category === "Gadget") && (
                    <div className="form-row" style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB'}}>
                      {category === "Grocery" && <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />}
                      {category === "Medicine" && <input placeholder="Dosage (e.g., 500mg)" value={dosage} onChange={e => setDosage(e.target.value)} />}
                      {category === "Document" && <input placeholder="Type (e.g., Passport)" value={documentType} onChange={e => setDocumentType(e.target.value)} />}
                      {category === "Gadget" && (
                        <>
                          <input type="date" value={warrantyEndDate} onChange={e => setWarrantyEndDate(e.target.value)} placeholder="Warranty" />
                          <input type="date" value={guaranteeEndDate} onChange={e => setGuaranteeEndDate(e.target.value)} placeholder="Guarantee" />
                        </>
                      )}
                    </div>
                  )}

                  <div className="form-row" style={{marginTop: '12px'}}>
                    <button className="btn-add" onClick={add}>Add Item</button>
                  </div>
                  {addError && <div className="form-error">⚠ {addError}</div>}
                </div>
              </>
            )}

            {/* ITEMS PAGE */}
            {page === "items" && (
              <>
                <div className="page-title">My Items</div>
                <div className="page-subtitle">All your tracked items</div>

                <div className="form-card">
                  <div className="form-row">
                    <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{flex: 1}} />
                    <select value={filter} onChange={e => setFilter(e.target.value)} style={{flex: 0.3}}>
                      <option>All</option>
                      <option>Active</option>
                      <option>Expiring Soon</option>
                      <option>Expired</option>
                    </select>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="empty">No items found.</div>
                ) : (
                  sortedCategories.map(category => (
                    <div key={category} className="category-section">
                      <div className="category-header">
                        <span className="category-icon">{CATEGORIES[category]?.icon || "📦"}</span>
                        <span className="category-title">{category}</span>
                        <span className="category-count">{groupedByCategory[category].length} items</span>
                      </div>
                      <div className="grid">
                        {groupedByCategory[category].map(item => {
                          const status = calcStatus(item.validTill);
                          const s = STATUS[status];
                          const brand = getBrand(item.name, item.category);
                          const daysLeft = calcDaysLeft(item.validTill);

                          return (
                            <div key={item._id} className="card" style={{"--brand": brand}}>
                              <div className="c-icon">{CATEGORIES[item.category]?.icon || "📦"}</div>
                              <div className="c-name">{item.name}</div>
                              <div className="c-cat">{item.category || "—"}</div>

                              <div className="badge" style={{background: s.bg, color: s.color}}>
                                {status}
                              </div>

                              <div className="c-days">
                                {daysLeft >= 0
                                  ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                                  : `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} overdue`}
                              </div>

                              {item.quantity && <div className="c-info">📦 Qty: {item.quantity}</div>}
                              {item.dosage && <div className="c-info">💊 {item.dosage}</div>}
                              {item.documentType && <div className="c-info">📄 {item.documentType}</div>}
                              {item.warrantyEndDate && <div className="c-info">⚙️ Warranty: {new Date(item.warrantyEndDate).toLocaleDateString()}</div>}
                              {item.guaranteeEndDate && <div className="c-info">✓ Guarantee: {new Date(item.guaranteeEndDate).toLocaleDateString()}</div>}

                              <div className="actions">
                                <button className="btn-action" onClick={() => renew(item._id)}>↻ Renew</button>
                                <button className="btn-delete" onClick={() => setDeleteModal({id: item._id, name: item.name})}>Remove</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* STATS PAGE */}
            {page === "stats" && (
              <>
                <div className="page-title">Statistics</div>
                <div className="page-subtitle">Detailed breakdown of your items</div>

                <div className="stats">
                  <div className="stat-card" style={{"--color": "#6366F1"}}>
                    <div className="stat-number">{counts.total}</div>
                    <div className="stat-label">Total Items</div>
                  </div>
                  <div className="stat-card" style={{"--color": "#10B981"}}>
                    <div className="stat-number">{counts.active}</div>
                    <div className="stat-label">Active</div>
                  </div>
                  <div className="stat-card" style={{"--color": "#F59E0B"}}>
                    <div className="stat-number">{counts.soon}</div>
                    <div className="stat-label">Expiring Soon</div>
                  </div>
                  <div className="stat-card" style={{"--color": "#EF4444"}}>
                    <div className="stat-number">{counts.expired}</div>
                    <div className="stat-label">Expired</div>
                  </div>
                </div>

                <div className="feature-grid">
                  {Object.entries(CATEGORIES).map(([cat, data]) => {
                    const count = items.filter(i => i.category === cat).length;
                    return (
                      <div key={cat} className="feature-card">
                        <div className="feature-icon">{data.icon}</div>
                        <div className="feature-title">{cat}</div>
                        <div style={{fontSize: '24px', fontWeight: '700', color: data.color, marginTop: '8px'}}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ABOUT PAGE */}
            {page === "about" && (
              <>
                <div className="page-title">About Expiry Tracker</div>
                <div className="page-subtitle">Learn more about our service</div>

                <div className="about-section">
                  <h2>What is Expiry Tracker?</h2>
                  <p>Expiry Tracker is your personal assistant to never forget expiration dates. Whether it's your favorite streaming service, groceries, medicines, important documents, or gadget warranties—we've got you covered.</p>
                </div>

                <div className="about-section">
                  <h2>Key Features</h2>
                  <p>✨ Track multiple categories of items</p>
                  <p>📲 Smart notifications before items expire</p>
                  <p>📊 Detailed statistics and insights</p>
                  <p>🔄 Automatic renewal tracking</p>
                  <p>💾 Secure cloud storage</p>
                </div>

                <div className="about-section">
                  <h2>Contact & Support</h2>
                  <p>Email: support@expirytracker.com</p>
                  <p>Version: 1.0.0</p>
                  <p>© 2024 Expiry Tracker. All rights reserved.</p>
                </div>
              </>
            )}

            {/* SETTINGS PAGE */}
            {page === "settings" && (
              <>
                <div className="page-title">Settings</div>
                <div className="page-subtitle">Manage your preferences</div>

                <div className="about-section">
                  <h2>Notification Settings</h2>
                  <p>Default reminder days: 7 days before expiry</p>
                  <p style={{marginTop: '12px', fontSize: '12px', color: '#9CA3AF'}}>Customize individual reminders for each item from the Items page</p>
                </div>

                <div className="about-section">
                  <h2>Account</h2>
                  <p>Theme: Dark Mode with Purple/Blue Gradient</p>
                  <p>Storage: Cloud (MongoDB)</p>
                </div>

                <div className="about-section">
                  <h2>Privacy</h2>
                  <p>Your data is encrypted and secure. We never share your information with third parties.</p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete "{deleteModal.name}"?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteModal(null)}>Cancel</button>
              <button onClick={del}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}