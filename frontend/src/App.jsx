import Login from "./Login";
import Signup from "./Signup";
import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ───────── STATUS ───────── */
const STATUS = {
  Active:          { color: "#3D8F6A", bg: "#EDF7F2" },
  "Expiring Soon": { color: "#C2752A", bg: "#FEF3E8" },
  Expired:         { color: "#A94040", bg: "#FBF0F0" },
};

const calcDaysLeft = (date) => Math.ceil((new Date(date) - Date.now()) / 864e5);
const calcStatus   = (date) => {
  const d = calcDaysLeft(date);
  if (d < 0)  return "Expired";
  if (d <= 7) return "Expiring Soon";
  return "Active";
};

/* ───────── BRAND COLORS ───────── */
const BRAND = {
  netflix:"#E50914", spotify:"#1DB954", "adobe cc":"#FF0000", adobe:"#FF0000",
  youtube:"#FF0000", apple:"#555555", notion:"#000000", slack:"#4A154B",
  figma:"#A259FF", github:"#24292E", dropbox:"#0061FF", zoom:"#2D8CFF",
  discord:"#5865F2", amazon:"#FF9900", prime:"#00A8E0", linkedin:"#0A66C2",
  twitter:"#1DA1F2", xbox:"#107C10", playstation:"#003087", canva:"#7D2AE8",
  grammarly:"#15C39A", duolingo:"#58CC02", headspace:"#F47D31",
  calm:"#3F51B5", hulu:"#1CE783", disney:"#113CCF", hotstar:"#1F80E0",
};
const CAT_COLORS = {
  music:"#1DB954", entertainment:"#E50914", design:"#A259FF",
  productivity:"#0061FF", gaming:"#107C10", education:"#F59E0B",
  fitness:"#F47D31", news:"#374151", cloud:"#0EA5E9",
  social:"#1DA1F2", finance:"#16A34A", health:"#EC4899",
};
const getBrand = (name, cat) => {
  const n = name.toLowerCase();
  for (const k of Object.keys(BRAND)) if (n.includes(k)) return BRAND[k];
  const c = (cat || "").toLowerCase();
  for (const k of Object.keys(CAT_COLORS)) if (c.includes(k)) return CAT_COLORS[k];
  return "#C4B8AA";
};

/* ═══════════════════════════════════════════
   APP
═══════════════════════════════════════════ */
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [mode,  setMode]  = useState("login");
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [name,  setName]  = useState("");
  const [cat,   setCat]   = useState("");
  const [date,  setDate]  = useState("");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [addError, setAddError] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);

  /* ── Sync token to localStorage ── */
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  /* ── Fetch items when token changes ── */
  useEffect(() => {
    if (!token) { setItems([]); return; }
    fetch(`${API}/api/items`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).catch(console.error);
  }, [token]);

  /* ── Fetch notifications ── */
  useEffect(() => {
    if (!token) return;
    
    fetch(`${API}/api/notifications`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(r => r.json())
      .then(data => setNotifications(data.data || []))
      .catch(console.error);
  }, [token, items]);

  /* ── Add ── */
  const add = async () => {
    if (!name) { setAddError("Please enter a subscription name."); return; }
    if (!date)  { setAddError("Please select an expiry date."); return; }
    setAddError("");
    const res = await fetch(`${API}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name,
        category: cat || "General",
        validTill: date,
        cost: Number(price) || 0,
        validityType: "renewal",
        renewalCycle: "monthly",
        reminderDays: 7,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems(p => [data, ...p]);
      setName(""); setCat(""); setDate(""); setPrice("");
    } else {
      setAddError(data?.message || "Something went wrong. Try again.");
    }
  };

  /* ── Delete ── */
  const del = async () => {
    if (!deleteModal) return;
    
    await fetch(`${API}/api/items/${deleteModal.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(p => p.filter(i => i._id !== deleteModal.id));
    setDeleteModal(null);
  };
  /* ── Renew ── */
const renew = async (id) => {
  try {
    const res = await fetch(`${API}/api/items/${id}/renew`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Update the item in the list
      setItems(p => p.map(item => 
        item._id === id ? data.item : item
      ));
    } else {
      alert(data.message || "Failed to renew item");
    }
  } catch (error) {
    console.error("Renew error:", error);
    alert("Error renewing item");
  }
};

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setItems([]);
    setMode("login");
    window.location.reload();
  };

  const handleLogin = (t) => {
    localStorage.setItem("token", t);
    setToken(t);
    window.location.reload();
  };

  /* ── Auth screens ── */
  if (!token) {
    return mode === "login"
      ? <Login    onLogin={handleLogin} switchMode={() => setMode("signup")} />
      : <Signup   onLogin={handleLogin} switchMode={() => setMode("login")}  />;
  }

  /* ── Derived data ── */
  const filtered = useMemo(() =>
    items
      .filter(i => {
        const ok1 = i.name.toLowerCase().includes(search.toLowerCase());
        const ok2 = filter === "All" || calcStatus(i.validTill) === filter;
        return ok1 && ok2;
      })
      .sort((a, b) => new Date(a.validTill) - new Date(b.validTill)),
  [items, search, filter]);

  const totalMonthly = items.reduce((s, i) => s + (Number(i.cost) || 0), 0);
  const counts = {
    total:   items.length,
    active:  items.filter(i => calcStatus(i.validTill) === "Active").length,
    soon:    items.filter(i => calcStatus(i.validTill) === "Expiring Soon").length,
    expired: items.filter(i => calcStatus(i.validTill) === "Expired").length,
  };

  /* ════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Jost:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #F7F3EE;
          font-family: 'Jost', sans-serif;
          color: #3A3228;
        }

        .page {
          max-width: 1150px;
          margin: auto;
          padding: 52px 40px;
        }

        /* ── Header ── */
        .hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .hdr-left h1 {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 600;
          color: #211E1A;
          letter-spacing: -0.3px;
        }
        .hdr-left p {
          font-size: 13px;
          color: #A09080;
          margin-top: 4px;
          font-weight: 300;
        }
        .btn-logout {
          background: transparent;
          border: 1px solid #DDD6CC;
          border-radius: 9px;
          padding: 9px 18px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #7A6E62;
          cursor: pointer;
          transition: .2s;
        }
        .btn-logout:hover { border-color: #A94040; color: #A94040; }

        /* ── Notification Banner ── */
        .notification-banner {
          background: #FEF3E8;
          border: 1px solid #C2752A;
          border-radius: 10px;
          padding: 15px 20px;
          margin-bottom: 20px;
          color: #C2752A;
        }
        .notification-banner strong {
          display: block;
          margin-bottom: 5px;
        }
        .notification-banner p {
          font-size: 13px;
          margin: 0;
        }

        /* ── Stats ── */
        .stats {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .stat {
          flex: 1;
          min-width: 110px;
          background: #fff;
          border: 1px solid #EAE4DC;
          border-radius: 14px;
          padding: 18px 20px;
          position: relative;
          overflow: hidden;
          transition: box-shadow .2s;
        }
        .stat:hover { box-shadow: 0 6px 20px rgba(60,45,30,.07); }
        .stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: var(--c);
          opacity: 0.55;
          border-radius: 0 0 14px 14px;
        }
        .stat-n {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: var(--c);
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-l {
          font-size: 11px;
          color: #B0A498;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        /* ── Controls ── */
        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          align-items: center;
        }
        .form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          background: #fff;
          border: 1px solid #EAE4DC;
          border-radius: 14px;
          padding: 18px 20px;
          align-items: flex-end;
        }

        input, select {
          background: #FAF8F5;
          border: 1px solid #E2DAD0;
          border-radius: 9px;
          padding: 10px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #3A3228;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          flex: 1;
          min-width: 120px;
        }
        input::placeholder { color: #C4BAB0; }
        input:focus, select:focus {
          border-color: #A8957E;
          box-shadow: 0 0 0 3px rgba(168,149,126,.12);
        }

        .btn-add {
          padding: 10px 24px;
          background: #3A3228;
          border: none;
          border-radius: 9px;
          color: #F7F3EE;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background .2s, box-shadow .2s;
        }
        .btn-add:hover { background: #211E1A; box-shadow: 0 4px 14px rgba(33,30,26,.18); }

        /* ── Divider ── */
        .divider {
          font-size: 11px;
          color: #C4BAB0;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .divider::after { content:''; flex:1; height:1px; background:#EAE4DC; }

        /* ── Grid ── */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
          gap: 16px;
        }

        /* ── Card ── */
        .card {
          background: #fff;
          border: 1px solid #EAE4DC;
          border-top: 4px solid var(--brand);
          border-radius: 14px;
          padding: 22px;
          position: relative;
          transition: box-shadow .25s, transform .25s;
        }
        .card:hover {
          box-shadow: 0 10px 32px rgba(60,45,30,.10);
          transform: translateY(-3px);
        }
        .brand-dot {
          position: absolute;
          top: 16px; right: 16px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--brand);
          opacity: 0.7;
        }
        .c-name {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          color: #211E1A;
          margin-bottom: 2px;
          padding-right: 18px;
        }
        .c-cat {
          font-size: 11px;
          color: #B0A498;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 14px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 500;
          margin-bottom: 10px;
        }
        .badge-dot { width:5px; height:5px; border-radius:50%; background: currentColor; flex-shrink:0; }
        .c-days { font-size: 13px; font-weight: 500; color: #5A504A; margin-bottom: 4px; }
        .c-price { font-size: 12px; color: #B0A498; margin-bottom: 16px; }

        .actions { display: flex; gap: 8px; }
        .btn-r {
          flex: 1; padding: 8px;
          background: transparent;
          border: 1px solid #DDD6CC;
          border-radius: 8px;
          color: #7A6E62;
          font-family: 'Jost', sans-serif;
          font-size: 12px; font-weight: 500;
          cursor: pointer;
          transition: border-color .2s, color .2s, background .2s;
        }
        .btn-r:hover { border-color: var(--brand); color: var(--brand); background: rgba(0,0,0,.015); }
        .btn-d {
          padding: 8px 14px;
          background: transparent;
          border: 1px solid #EAE4DC;
          border-radius: 8px;
          color: #C4BAB0;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: border-color .2s, color .2s;
        }
        .btn-d:hover { border-color: #A94040; color: #A94040; }

        .empty {
          grid-column: 1/-1;
          text-align: center;
          padding: 48px;
          color: #B0A498;
          font-size: 13px;
          letter-spacing: 0.3px;
        }
      `}</style>

      <div className="page">

        {/* Header */}
        <div className="hdr">
          <div className="hdr-left">
            <h1>Expiry Tracker</h1>
            <p>Your subscriptions, always in sight.</p>
          </div>
          <button className="btn-logout" onClick={logout}>Log out</button>
        </div>

        {/* Notification Banner */}
        {notifications.length > 0 && (
          <div className="notification-banner">
            <strong>⏰ {notifications.length} subscription{notifications.length !== 1 ? "s" : ""} expiring soon!</strong>
            <p>
              {notifications.map(n => n.name).join(", ")}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="stats">
          {[
            ["Total",         counts.total,   "#8C7E72"],
            ["Active",        counts.active,  "#3D8F6A"],
            ["Expiring Soon", counts.soon,    "#C2752A"],
            ["Expired",       counts.expired, "#A94040"],
            ["Monthly",       `₹${totalMonthly}`, "#7A6E62"],
            ["Annual",        `₹${totalMonthly * 12}`, "#7A6E62"],
          ].map(([l, v, c]) => (
            <div key={l} className="stat" style={{ "--c": c }}>
              <div className="stat-n">{v}</div>
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="controls">
          <input
            placeholder="Search subscriptions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ flex: "0", minWidth: 150 }}>
            <option>All</option>
            <option>Active</option>
            <option>Expiring Soon</option>
            <option>Expired</option>
          </select>
        </div>

        {/* Add Form */}
        <div className="form">
          <input placeholder="Subscription name" value={name}  onChange={e => setName(e.target.value)} />
          <input placeholder="Category"          value={cat}   onChange={e => setCat(e.target.value)} />
          <input type="number" placeholder="Price ₹/mo" value={price} onChange={e => setPrice(e.target.value)} style={{ maxWidth: 140 }} />
          <input type="date"   value={date}  onChange={e => setDate(e.target.value)} style={{ flex: "0", minWidth: 148 }} />
          <button className="btn-add" onClick={add}>Add</button>
        </div>
        {addError && (
          <div style={{ color: "#A94040", fontSize: "13px", marginTop: "-16px", marginBottom: "20px", paddingLeft: "4px" }}>
            ⚠ {addError}
          </div>
        )}

        {/* Cards */}
        <div className="divider">{filtered.length} subscription{filtered.length !== 1 ? "s" : ""}</div>

        <div className="grid">
          {filtered.length === 0 && (
            <div className="empty">No subscriptions found.</div>
          )}

          {filtered.map(item => {
            const status   = calcStatus(item.validTill);
            const s        = STATUS[status];
            const brand    = getBrand(item.name, item.category);
            const daysLeft = calcDaysLeft(item.validTill);

            return (
              <div key={item._id} className="card" style={{ "--brand": brand }}>
                <span className="brand-dot" />
                <div className="c-name">{item.name}</div>
                <div className="c-cat">{item.category || "—"}</div>

                <div className="badge" style={{ background: s.bg, color: s.color }}>
                  <span className="badge-dot" />
                  {status}
                </div>

                <div className="c-days">
                  {daysLeft >= 0
                    ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                    : `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} overdue`}
                </div>
                <div className="c-price">₹{item.cost}/month</div>

                <div className="actions">
                  <button className="btn-r" onClick={() => renew(item._id)}>↻ Renew</button>
                  <button 
                    className="btn-d" 
                    onClick={() => setDeleteModal({ id: item._id, name: item.name })}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
          }}>
            <h3>Delete "{deleteModal.name}"?</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button 
                onClick={() => setDeleteModal(null)}
                style={{
                  padding: "10px 20px",
                  background: "#ddd",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={del}
                style={{
                  padding: "10px 20px",
                  background: "#A94040",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}