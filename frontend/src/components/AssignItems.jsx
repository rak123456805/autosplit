import React, { useState, useEffect } from "react";
import API from "../api";

export default function AssignItems({ group, bill, onSaved }) {
  const [members, setMembers] = useState([]);
  const [assignMap, setAssignMap] = useState({}); // itemId -> [memberIds]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await API.get(`/groups/${group.id}`);
        setMembers(res.data.members || []);
      } catch (e) {
        console.error("Failed to load members:", e);
        setError("Failed to load members.");
      }
    }
    if (group?.id) loadMembers();
  }, [group]);

  function toggleAssign(itemId, memberId) {
    const cur = assignMap[itemId] || [];
    const exists = cur.includes(memberId);
    setAssignMap({
      ...assignMap,
      [itemId]: exists ? cur.filter((m) => m !== memberId) : [...cur, memberId],
    });
  }

  async function saveAssignments() {
    try {
      setSaving(true);
      setError("");

      const payload = [];
      for (const it of bill.items) {
        const assigned = assignMap[it.id] || [];
        if ((assigned?.length || 0) === 0) {
          // Default: split equally across all group members
          const allIds = (members || []).map((m) => m.id);
          if (allIds.length > 0) {
            const share = Number(it.price) / allIds.length;
            for (const mid of allIds) {
              payload.push({ item_id: it.id, member_id: mid, share });
            }
          }
        } else {
          const share = Number(it.price) / assigned.length;
          for (const mid of assigned) {
            payload.push({ item_id: it.id, member_id: mid, share });
          }
        }
      }

      await API.post("/assign", { assignments: payload });

      // notify parent to refresh summary
      onSaved?.();

      // also emit a global event, in case Summary listens that way
      window.dispatchEvent(
        new CustomEvent("autosplit:assignmentsSaved", {
          detail: { groupId: group.id },
        })
      );
    } catch (e) {
      console.error("Save failed:", e);
      setError("Failed to save assignments. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h4>Assign Items to People</h4>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Item</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Price</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Assign</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((it) => (
            <tr key={it.id}>
              <td style={{ padding: "8px 6px" }}>{it.description}</td>
              <td style={{ padding: "8px 6px" }}>₹{Number(it.price).toFixed(2)}</td>
              <td style={{ padding: "8px 6px" }}>
                {members.map((m) => {
                  const checked = (assignMap[it.id] || []).includes(m.id);
                  return (
                    <label key={m.id} style={{ marginRight: 10 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssign(it.id, m.id)}
                      />{" "}
                      {m.name}
                    </label>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={saveAssignments}
        disabled={saving}
        style={{
          marginTop: 12,
          padding: "8px 14px",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : "Save Assignments"}
      </button>
    </div>
  );
}
