import Login from "./Login";
import Signup from "./Signup";
import { useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const STATUS = {
  Active:          { color: "#853953", bg: "#FCF1F6" },
  "Expiring Soon": { color: "#D97706", bg: "#FFFBEB" },
  Expired:         { color: "#DC2626", bg: "#FEF2F2" },
};

const calcDaysLeft = (date) => Math.ceil((new Date(date) - Date.now()) / 864e5);
const calcStatus   = (date) => {
  const d = calcDaysLeft(date);
  if (d < 0)  return "Expired";
  if (d <= 7) return "Expiring Soon";
  return "Active";
};

const CATEGORIES = {
  OTT: { color: "#853953", icon: "📺" },
  Grocery: { color: "#10B981", icon: "🛒" },
  Medicine: { color: "#F59E0B", icon: "💊" },
  Document: { color: "#3B82F6", icon: "📄" },
  Gadget: { color: "#8B5CF6", icon: "⚙️" },
};

const CATEGORY_CONTENT = {
  OTT: {
    title: "OTT Subscriptions",
    problem: "Paying for subscriptions you forgot about? Overlapping streaming services?",
    benefits: [
      "Track all your streaming subscriptions in one place",
      "Get reminded before renewal dates",
      "See total monthly spending on entertainment",
      "Never pay for unused subscriptions again"
    ],
    story: "Sarah was paying for 5 streaming services she forgot about. Lost ₹2,400/month. Now she tracks and saves ₹1,500 monthly.",
    icon: "📺"
  },
  Grocery: {
    title: "Grocery Items",
    problem: "Spoiled food in your fridge? Wasting money on expired groceries?",
    benefits: [
      "Monitor expiry dates of fresh produce",
      "Reduce food waste at home",
      "Plan meals better with expiry tracking",
      "Save money on wasted groceries"
    ],
    story: "Rajesh wasted ₹3,000/month on expired items. With tracking, he reduced waste by 70% and feeds his family better.",
    icon: "🛒"
  },
  Medicine: {
    title: "Medicines",
    problem: "Used expired medicine? Missed medication doses? Health at risk?",
    benefits: [
      "Never use expired medicine accidentally",
      "Track prescription expiry dates",
      "Remember dosage schedules easily",
      "Protect your family's health"
    ],
    story: "Priya's mother took expired medicine causing side effects. Now she tracks all medicines and ensures family safety.",
    icon: "💊"
  },
  Document: {
    title: "Documents & Licenses",
    problem: "Expired passport? License expired at traffic stop? Legal trouble?",
    benefits: [
      "Track passport validity dates",
      "Get reminders for license renewal",
      "Never miss important document deadlines",
      "Avoid legal complications"
    ],
    story: "Amit missed his visa renewal and faced visa denial. Now he tracks all documents and never misses deadlines.",
    icon: "📄"
  },
  Gadget: {
    title: "Gadget Warranty",
    problem: "Gadget breaks after warranty expires? Lose ₹20,000+ repairs?",
    benefits: [
      "Track warranty end dates exactly",
      "Plan repairs before warranty expires",
      "Know guarantee coverage period",
      "Save on unexpected repair costs"
    ],
    story: "Neha's laptop screen broke 10 days after warranty ended. Cost ₹15,000. Now she tracks warranties and plans ahead.",
    icon: "⚙️"
  }
};

const getBrand = (name, cat) => {
  const n = name.toLowerCase();
  if (cat && CATEGORIES[cat]) return CATEGORIES[cat].color;
  return "#8B5CF6";
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState("");
  const [mode,  setMode]  = useState("login");
  const [page, setPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
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
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (!token) { setItems([]); setUserName(""); return; }

    // fetch current user's profile (name) and items in parallel
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (r.ok && d?.user) setUserName(d.user.name || "");
        else setUserName("");
      })
      .catch(() => setUserName(""));

    fetch(`${API}/api/items`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          console.error("Items fetch failed:", data);
          setItems([]);
          return;
        }
        setItems(Array.isArray(data) ? data : data?.items || []);
      })
      .catch(error => {
        console.error("Items fetch error:", error);
        setItems([]);
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetch(`${API}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => {
          const data = await r.json().catch(() => null);
          if (!r.ok) {
            console.error("Notifications fetch failed:", data);
            setNotifications([]);
            return;
          }
          setNotifications(Array.isArray(data) ? data : data?.data || []);
        })
        .catch(error => {
          console.error("Notifications fetch error:", error);
          setNotifications([]);
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

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
      setAddError("");
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
    setPage("login");
    setSelectedCategory(null);
    setCategoryInfo(null);
    setSidebarOpen(true);
  };

  const handleLogin = (t, redirect) => {
    localStorage.setItem("token", t);
    setToken(t);
    setMode("login");
    setPage(redirect || "home");
  };

  const handleSidebarNav = (pageId) => {
    setPage(pageId);
    setSelectedCategory(null);
    setCategoryInfo(null);
  };

  const handleCategoryClick = (catName) => {
    setCategoryInfo(catName);
    setPage("category-info");
  };

  const handleGetStarted = (catName) => {
    setCategory(catName);
    setPage("dashboard");
    resetCategoryFields();
  };

  if (!token) {
    return mode === "login"
      ? <Login    onLogin={handleLogin} switchMode={() => setMode("signup")} />
      : <Signup   onLogin={handleLogin} switchMode={() => setMode("login")}  />;
  }

  const filtered = useMemo(() => {
    let result = items.filter(i => {
      const ok1 = i.name.toLowerCase().includes(search.toLowerCase());
      const ok2 = filter === "All" || calcStatus(i.validTill) === filter;
      const ok3 = !selectedCategory || i.category === selectedCategory;
      return ok1 && ok2 && ok3;
    });
    return result.sort((a, b) => new Date(a.validTill) - new Date(b.validTill));
  }, [items, search, filter, selectedCategory]);

  const groupedByCategory = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const cat = item.category && CATEGORIES[item.category] ? item.category : "Miscellaneous";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

  const categoryOrder = ["OTT", "Grocery", "Medicine", "Document", "Gadget"];

  const counts = {
    total:   items.length,
    active:  items.filter(i => calcStatus(i.validTill) === "Active").length,
    soon:    items.filter(i => calcStatus(i.validTill) === "Expiring Soon").length,
    expired: items.filter(i => calcStatus(i.validTill) === "Expired").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #F9F7F5;
          font-family: 'DM Sans', sans-serif;
          color: #2C2C2C;
          min-height: 100vh;
        }

        .app-container {
          display: flex;
          height: 100vh;
          background: #F9F7F5;
        }

        .navbar {
          background: #FFFFFF;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          padding: 0 40px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-toggle {
          background: none;
          border: none;
          color: #2C2C2C;
          font-size: 20px;
          cursor: pointer;
          display: none;
          transition: color 0.2s;
        }

        .nav-toggle:hover {
          color: #853953;
        }

        @media (max-width: 768px) {
          .nav-toggle {
            display: block;
          }
        }

        .navbar-logo {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #2C2C2C;
          letter-spacing: -0.5px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .navbar-logo:hover {
          color: #853953;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .btn-logout {
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          border: none;
          color: #FFFFFF;
          padding: 11px 24px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .btn-logout:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(133, 57, 83, 0.25);
        }

        .sidebar {
          width: 240px;
          background: #FFFFFF;
          box-shadow: 2px 0 12px rgba(0,0,0,0.03);
          padding: 90px 0 24px 0;
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          transition: transform 0.3s ease;
          z-index: 99;
        }

        .sidebar.closed {
          transform: translateX(-100%);
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 20px;
          margin: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          color: #8B8B8B;
          border: none;
          background: none;
          width: calc(100% - 24px);
          text-align: left;
          font-weight: 500;
        }

        .sidebar-item:hover {
          background: #F5F1ED;
          color: #2C2C2C;
        }

        .sidebar-item.active {
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(133, 57, 83, 0.2);
        }

        .main-content {
          flex: 1;
          margin-left: 240px;
          margin-top: 70px;
          overflow-y: auto;
          background: #F9F7F5;
          transition: margin-left 0.3s ease;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
          }
        }

        .content-wrapper {
          padding: 56px 60px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 10px;
          letter-spacing: -0.6px;
        }

        .page-subtitle {
          font-size: 14px;
          color: #999;
          margin-bottom: 48px;
          font-weight: 400;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .stat-card {
          background: #FFFFFF;
          border: 1px solid #F0E8E3;
          border-radius: 8px;
          padding: 28px;
          transition: all 0.3s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .stat-card:hover {
          border-color: #E0D5CC;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }

        .stat-number {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .category-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }

        .category-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #FFFFFF;
          border: 1.5px solid #F0E8E3;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #2C2C2C;
          transition: all 0.2s;
        }

        .category-btn:hover {
          border-color: #853953;
          background: #FCF1F6;
        }

        .category-btn.active {
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          color: #FFFFFF;
          border-color: #853953;
          box-shadow: 0 2px 8px rgba(133, 57, 83, 0.2);
        }

        .category-btn-icon {
          font-size: 14px;
        }

        .category-btn-count {
          font-size: 10px;
          opacity: 0.7;
        }

        .form-card {
          background: #FFFFFF;
          border: 1px solid #F0E8E3;
          border-radius: 8px;
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .form-title {
          font-size: 14px;
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          padding: 12px 14px;
          border: 1.5px solid #F0E8E3;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C2C2C;
          outline: none;
          transition: all 0.2s;
          background: #FFFFFF;
        }

        input:focus, select:focus {
          border-color: #853953;
          box-shadow: 0 0 0 3px rgba(133, 57, 83, 0.08);
        }

        input::placeholder {
          color: #D0D0D0;
        }

        .btn-add {
          padding: 12px 28px;
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          border: none;
          border-radius: 6px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(133, 57, 83, 0.15);
        }

        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(133, 57, 83, 0.25);
        }

        .form-error {
          color: #DC2626;
          font-size: 12px;
          margin-top: 10px;
          font-weight: 500;
          background: #FEF2F2;
          padding: 10px 14px;
          border-radius: 6px;
          border-left: 3px solid #DC2626;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .card {
          background: #FFFFFF;
          border: 1.5px solid #F0E8E3;
          border-left: 4px solid var(--brand);
          border-radius: 8px;
          padding: 24px;
          transition: all 0.3s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .card:hover {
          border-color: #E0D5CC;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-4px);
        }

        .c-icon {
          font-size: 28px;
          margin-bottom: 12px;
          display: block;
        }

        .c-name {
          font-size: 15px;
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 4px;
        }

        .c-cat {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 14px;
          letter-spacing: 0.3px;
          font-weight: 600;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .c-days {
          font-size: 13px;
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 12px;
        }

        .c-info {
          font-size: 12px;
          color: #888;
          margin-bottom: 6px;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        .btn-action {
          flex: 1;
          padding: 10px;
          border: 1.5px solid #F0E8E3;
          background: #FFFFFF;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #2C2C2C;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .btn-action:hover {
          border-color: #853953;
          background: #FCF1F6;
          color: #853953;
        }

        .btn-delete {
          padding: 10px 12px;
          border: 1.5px solid #F0E8E3;
          background: #FFFFFF;
          border-radius: 6px;
          color: #999;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .btn-delete:hover {
          border-color: #DC2626;
          color: #DC2626;
          background: #FEF2F2;
        }

        .empty {
          text-align: center;
          padding: 80px 24px;
          color: #999;
          font-size: 14px;
        }

        .home-hero {
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          color: #FFFFFF;
          padding: 96px 56px;
          border-radius: 8px;
          margin-bottom: 60px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(133, 57, 83, 0.15);
        }

        .home-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .home-hero p {
          font-size: 16px;
          opacity: 0.9;
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
          font-weight: 400;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .feature-card {
          background: #FFFFFF;
          padding: 36px;
          border: 1px solid #F0E8E3;
          border-radius: 8px;
          text-align: center;
          transition: all 0.3s;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .feature-card:hover {
          border-color: #853953;
          box-shadow: 0 8px 24px rgba(133, 57, 83, 0.1);
          transform: translateY(-6px);
        }

        .feature-icon {
          font-size: 44px;
          margin-bottom: 16px;
          display: block;
        }

        .feature-title {
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 8px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .feature-text {
          font-size: 13px;
          color: #888;
          line-height: 1.5;
        }

        .about-section {
          background: #FFFFFF;
          padding: 36px;
          border: 1px solid #F0E8E3;
          border-radius: 8px;
          margin-bottom: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .about-section h2 {
          color: #2C2C2C;
          margin-bottom: 14px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .about-section p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 10px;
          font-size: 13px;
        }

        .category-hero {
          background: linear-gradient(135deg, var(--brand-color) 0%, rgba(97, 45, 83, 0.8) 100%);
          color: #FFFFFF;
          padding: 96px 56px;
          border-radius: 8px;
          margin-bottom: 48px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        .category-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 44px;
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .category-hero-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .category-hero p {
          font-size: 18px;
          opacity: 0.95;
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .benefit-card {
          background: #FFFFFF;
          padding: 32px;
          border: 1px solid #F0E8E3;
          border-radius: 8px;
          border-left: 4px solid var(--brand-color);
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .benefit-card h3 {
          font-size: 14px;
          color: #2C2C2C;
          margin-bottom: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .benefit-card p {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
        }

        .story-card {
          background: #FFFFFF;
          padding: 36px;
          border: 1px solid #F0E8E3;
          border-radius: 8px;
          margin-bottom: 32px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .story-card h2 {
          font-size: 14px;
          color: #2C2C2C;
          margin-bottom: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .story-card p {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          font-style: italic;
        }

        .get-started-btn {
          width: 100%;
          padding: 16px;
          background: var(--brand-color);
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s;
          margin-bottom: 48px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }

        .get-started-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.16);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(44, 44, 44, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: #FFFFFF;
          padding: 48px;
          border-radius: 8px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          border: 1px solid #F0E8E3;
          box-shadow: 0 16px 48px rgba(0,0,0,0.15);
        }

        .modal h3 {
          color: #2C2C2C;
          margin-bottom: 12px;
          font-size: 16px;
          font-weight: 700;
        }

        .modal p {
          color: #666;
          margin-bottom: 28px;
          font-size: 13px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-actions button {
          flex: 1;
          padding: 12px;
          border: 1.5px solid #F0E8E3;
          background: #FFFFFF;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s;
          color: #2C2C2C;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .modal-actions button:last-child {
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          color: #FFFFFF;
          border-color: #853953;
          box-shadow: 0 2px 8px rgba(133, 57, 83, 0.15);
        }

        .modal-actions button:last-child:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(133, 57, 83, 0.25);
        }

        .modal-actions button:first-child:hover {
          background: #F5F1ED;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #F9F7F5;
        }

        ::-webkit-scrollbar-thumb {
          background: #D8D3D8;
          border-radius: 2px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #C0B5C0;
        }
      `}</style>

      <div className="app-container">
        {/* NAVBAR */}
        <div className="navbar">
          <div className="navbar-left">
            <button className="nav-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="navbar-logo" onClick={() => handleSidebarNav("home")}>Expiry Tracker</div>
          </div>
          <div className="navbar-right">
            <button className="btn-logout" onClick={logout}>Logout</button>
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
              onClick={() => handleSidebarNav(item.id)}
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
                  <h1>Expiry Tracker</h1>
                  <p>Never miss an important date. Track subscriptions, groceries, medicines, documents, and warranties in one elegant interface.</p>
                </div>

                <div className="feature-grid">
                  {Object.entries(CATEGORY_CONTENT).map(([key, content]) => (
                    <div 
                      key={key}
                      className="feature-card" 
                      onClick={() => handleCategoryClick(key)}
                    >
                      <div className="feature-icon">{content.icon}</div>
                      <div className="feature-title">{content.title}</div>
                      <div className="feature-text">Click to learn how we solve everyday problems</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CATEGORY INFO PAGE */}
            {page === "category-info" && categoryInfo && (
              <>
                <div 
                  className="category-hero"
                  style={{"--brand-color": CATEGORIES[categoryInfo]?.color}}
                >
                  <div className="category-hero-icon">{CATEGORY_CONTENT[categoryInfo].icon}</div>
                  <h1>{CATEGORY_CONTENT[categoryInfo].title}</h1>
                  <p>"{CATEGORY_CONTENT[categoryInfo].problem}"</p>
                </div>

                <div className="benefits-grid">
                  {CATEGORY_CONTENT[categoryInfo].benefits.map((benefit, idx) => (
                    <div key={idx} className="benefit-card" style={{"--brand-color": CATEGORIES[categoryInfo]?.color}}>
                      <h3>✓ Benefit {idx + 1}</h3>
                      <p>{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="story-card">
                  <h2>Real Story</h2>
                  <p>"{CATEGORY_CONTENT[categoryInfo].story}"</p>
                </div>

                <button 
                  className="get-started-btn"
                  style={{background: CATEGORIES[categoryInfo]?.color}}
                  onClick={() => handleGetStarted(categoryInfo)}
                >
                  Get Started Now
                </button>
              </>
            )}

            {/* DASHBOARD PAGE */}
            {page === "dashboard" && (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                  <div>
                    <div className="page-title">Dashboard</div>
                    <div className="page-subtitle">Overview of your tracked items</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: 18, fontWeight: 700}}>Hello{userName ? `, ${userName}` : ""} 👋</div>
                    <div style={{fontSize: 12, color: '#888'}}>Welcome back</div>
                  </div>
                </div>

                <div className="stats">
                  <div className="stat-card">
                    <div className="stat-number">{counts.total}</div>
                    <div className="stat-label">Total Items</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{counts.active}</div>
                    <div className="stat-label">Active</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{counts.soon}</div>
                    <div className="stat-label">Expiring Soon</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{counts.expired}</div>
                    <div className="stat-label">Expired</div>
                  </div>
                </div>

                {notifications.length > 0 && (
                  <div className="form-card" style={{borderLeft: '4px solid #D97706', background: '#FFFBEB'}}>
                    <strong style={{color: '#92400E'}}>⚠ {notifications.length} item{notifications.length !== 1 ? "s" : ""} expiring soon!</strong>
                    <p style={{marginTop: '10px', color: '#999', fontSize: '12px'}}>
                      {notifications.map(n => n.name).join(", ")}
                    </p>
                  </div>
                )}

                <div className="form-card">
                  <div className="form-title">Add Item</div>
                  <div className="form-row">
                    <input placeholder="Item Name" value={name} onChange={e => setName(e.target.value)} />
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
                    <div className="form-row" style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0E8E3'}}>
                      {category === "Grocery" && <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />}
                      {category === "Medicine" && <input placeholder="Dosage (e.g., 500mg)" value={dosage} onChange={e => setDosage(e.target.value)} />}
                      {category === "Document" && <input placeholder="Type (e.g., Passport)" value={documentType} onChange={e => setDocumentType(e.target.value)} />}
                      {category === "Gadget" && (
                        <>
                          <input type="date" value={warrantyEndDate} onChange={e => setWarrantyEndDate(e.target.value)} />
                          <input type="date" value={guaranteeEndDate} onChange={e => setGuaranteeEndDate(e.target.value)} />
                        </>
                      )}
                    </div>
                  )}

                  <div className="form-row" style={{marginTop: '16px'}}>
                    <button className="btn-add" onClick={add}>Add</button>
                  </div>
                  {addError && <div className="form-error">{addError}</div>}
                </div>
              </>
            )}

            {/* ITEMS PAGE */}
            {page === "items" && (
              <>
                <div className="page-title">My Items</div>
                <div className="page-subtitle">Filter by category to view specific items</div>

                <div className="form-card">
                  <div className="form-row">
                    <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{flex: 1}} />
                    <select value={filter} onChange={e => setFilter(e.target.value)} style={{flex: '0 0 140px'}}>
                      <option>All</option>
                      <option>Active</option>
                      <option>Expiring Soon</option>
                      <option>Expired</option>
                    </select>
                  </div>
                </div>

                <div className="form-card">
                  <div style={{fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'}}>Filter by Category</div>
                  <div className="category-buttons">
                    <button 
                      className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      <span>All</span>
                      <span className="category-btn-count">({items.length})</span>
                    </button>
                    {categoryOrder.map(cat => {
                      const count = groupedByCategory[cat]?.length || 0;
                      if (count === 0) return null;
                      return (
                        <button
                          key={cat}
                          className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          <span className="category-btn-icon">{CATEGORIES[cat]?.icon}</span>
                          <span>{cat}</span>
                          <span className="category-btn-count">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="empty">No items in this category</div>
                ) : (
                  <div className="grid">
                    {filtered.map(item => {
                      const status = calcStatus(item.validTill);
                      const s = STATUS[status];
                      const brand = getBrand(item.name, item.category);
                      const daysLeft = calcDaysLeft(item.validTill);

                      return (
                        <div key={item._id} className="card" style={{"--brand": brand}}>
                          <span className="c-icon">{CATEGORIES[item.category]?.icon}</span>
                          <div className="c-name">{item.name}</div>
                          <div className="c-cat">{item.category}</div>

                          <div className="badge" style={{background: s.bg, color: s.color}}>
                            {status}
                          </div>

                          <div className="c-days">
                            {daysLeft >= 0
                              ? `${daysLeft} days left`
                              : `${Math.abs(daysLeft)} days overdue`}
                          </div>

                          {item.quantity && <div className="c-info">📦 {item.quantity} qty</div>}
                          {item.dosage && <div className="c-info">💊 {item.dosage}</div>}
                          {item.documentType && <div className="c-info">📄 {item.documentType}</div>}
                          {item.warrantyEndDate && <div className="c-info">⚙️ {new Date(item.warrantyEndDate).toLocaleDateString()}</div>}
                          {item.guaranteeEndDate && <div className="c-info">✓ {new Date(item.guaranteeEndDate).toLocaleDateString()}</div>}

                          <div className="actions">
                            <button className="btn-action" onClick={() => renew(item._id)}>Renew</button>
                            <button className="btn-delete" onClick={() => setDeleteModal({id: item._id, name: item.name})}>Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* STATS PAGE */}
            {page === "stats" && (
              <>
                <div className="page-title">Statistics</div>
                <div className="page-subtitle">Detailed breakdown of your items</div>

                <div className="stats">
                  <div className="stat-card">
                    <div className="stat-number">{counts.total}</div>
                    <div className="stat-label">Total Items</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{counts.active}</div>
                    <div className="stat-label">Active</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{counts.soon}</div>
                    <div className="stat-label">Expiring Soon</div>
                  </div>
                  <div className="stat-card">
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
                        <div style={{fontSize: '24px', fontWeight: '700', color: data.color, marginTop: '12px'}}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ABOUT PAGE */}
            {page === "about" && (
              <>
                <div className="page-title">About</div>
                <div className="page-subtitle">Learn more about Expiry Tracker</div>

                <div className="about-section">
                  <h2>What is Expiry Tracker?</h2>
                  <p>Expiry Tracker helps you manage all important dates in your life. Track subscriptions, groceries, medicines, documents, and warranties with smart reminders and elegant simplicity.</p>
                </div>

                <div className="about-section">
                  <h2>Features</h2>
                  <p>✓ Multi-category tracking system</p>
                  <p>✓ Smart reminders before expiry</p>
                  <p>✓ Detailed statistics and insights</p>
                  <p>✓ Secure cloud storage</p>
                  <p>✓ Clean, minimal interface</p>
                </div>

                <div className="about-section">
                  <h2>Support</h2>
                  <p>Email: support@expirytracker.com</p>
                  <p>Version: 1.0.0</p>
                  <p>© 2024 Expiry Tracker</p>
                </div>
              </>
            )}

            {/* SETTINGS PAGE */}
            {page === "settings" && (
              <>
                <div className="page-title">Settings</div>
                <div className="page-subtitle">Manage your preferences</div>

                <div className="about-section">
                  <h2>Notifications</h2>
                  <p>Default reminder: 7 days before expiry</p>
                  <p style={{marginTop: '8px', fontSize: '12px', color: '#999'}}>Customize individual reminders for each item</p>
                </div>

                <div className="about-section">
                  <h2>Account</h2>
                  <p>Theme: Burgundy & Plum</p>
                  <p>Storage: Secure Cloud</p>
                </div>

                <div className="about-section">
                  <h2>Privacy</h2>
                  <p>Your data is encrypted and never shared with third parties. Your privacy is our priority.</p>
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
