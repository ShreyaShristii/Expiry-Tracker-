import { useState, useEffect } from "react";
import Login from "./Login";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (token) {
      fetch("http://localhost:5000/api/items", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setItems(data));
    }
  }, [token]);

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>

      {items.length === 0 && <p>No items found.</p>}

      {items.map(item => (
        <div
          key={item._id}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "8px"
          }}
        >
          <h3>{item.name}</h3>
          <p>Category: {item.category}</p>
          <p>Status: {item.status}</p>
          <p>Valid Till: {new Date(item.validTill).toDateString()}</p>
        </div>
      ))}
    </div>
  );
}

export default App;