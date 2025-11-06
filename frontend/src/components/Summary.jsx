import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

const COLORS = [
  "#6366F1", // indigo
  "#22C55E", // green
  "#F97316", // orange
  "#06B6D4", // cyan
  "#E11D48", // rose
  "#84CC16", // lime
  "#A855F7", // purple
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
];

export default function Summary({ group, refreshToken = 0 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const timeoutRef = useRef(null);

  async function load() {
    if (!group?.id) return;
    try {
      const res = await API.get(`/group/${group.id}/summary`);
      setData(res.data);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr("Failed to load summary");
    }
  }

  // Load on mount/refresh
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, refreshToken]);

  // Optional global event listener (with robust id compare + tiny retry)
  useEffect(() => {
    function onSaved(e) {
      const currentId = String(group?.id ?? "");
      const eventId = String(e?.detail?.groupId ?? "");
      if (currentId && eventId && currentId === eventId) {
        load();
        // small delayed refetch to avoid race with DB commit
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(load, 200);
      }
    }
    window.addEventListener("autosplit:assignmentsSaved", onSaved);
    return () => {
      window.removeEventListener("autosplit:assignmentsSaved", onSaved);
      clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [String(group?.id ?? "")]);

  // Refresh when window/tab regains focus (nice UX, no visual change)
  useEffect(() => {
    function onFocus() {
      load();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [String(group?.id ?? "")]);

  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!data) return <div>Loading summary...</div>;

  const pieData = (data.members || [])
    .map((m) => ({
      name: m.name,
      value: Math.max(0, Math.round((m.total_owed || 0) * 100) / 100),
    }))
    .filter((d) => d.value > 0);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Monthly Summary</h3>
      <p>Active bills: {data.bill_count}</p>

      {/* Single chart rendered once inside a responsive container */}
      <div style={{ width: 420, height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              label
              isAnimationActive={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <h4>Who owes what</h4>
      <ul>
        {data.members.map((m) => (
          <li key={m.id}>
            {m.name}: ₹{Number(m.total_owed || 0).toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
