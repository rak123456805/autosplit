import React, { useState } from "react";
import axios from "axios";
import AssignItems from "./AssignItems";
import Summary from "./Summary"; // ensure this exists

export default function Upload({ group }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0); // triggers Summary reload

  async function upload() {
    if (!file) return alert("Please select a file first!");
    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("group_id", group?.id || 1);

      const res = await axios.post("http://localhost:5000/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: false,
      });

      setResult(res.data);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  }

  const handleSaved = () => setRefreshToken((n) => n + 1);

  return (
    <div style={{ marginTop: 20, border: "1px solid #ddd", padding: 12, maxWidth: 800 }}>
      <h3>Upload a bill (screenshot or scan)</h3>

      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={upload} disabled={loading}>
        {loading ? "Uploading..." : "Upload & Parse"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h4>Detected Items</h4>
          <ul>
            {result.items.map((it) => (
              <li key={it.id}>
                {it.description} — ₹{it.price.toFixed(2)}
              </li>
            ))}
          </ul>

          <AssignItems group={group} bill={result} onSaved={handleSaved} />

          
        </div>
      )}
    </div>
  );
}
