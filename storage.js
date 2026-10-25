/* HCM Lite demo storage. All data is stored locally in this browser. */
const DB_KEY = "hcm_lite_db_v1";
function defaultDB() {
  return {
    company: { name: "My Company", officeStart: "09:00", graceMinutes: 10, defaultQuota: 14, halfDayAfter: 120 },
    users: [],
    attendance: [],
    leaves: []
  };
}
function getDB() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    return saved ? { ...defaultDB(), ...JSON.parse(saved) } : defaultDB();
  } catch (e) { return defaultDB(); }
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function uid(prefix="id") { return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
}
function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
function money(value) {
  return "PKR " + Number(value || 0).toLocaleString("en-PK", {maximumFractionDigits:0});
}
function dayCount(start, end) {
  if (!start || !end || end < start) return 0;
  return Math.floor((new Date(end+"T00:00:00") - new Date(start+"T00:00:00")) / 86400000) + 1;
}
function getUserById(id) { return getDB().users.find(u => u.id === id); }
function getCurrentUser() {
  const id = sessionStorage.getItem("hcm_current_user");
  return id ? getUserById(id) : null;
}
function getAttendanceFor(userId, date=todayISO()) {
  return getDB().attendance.find(a => a.userId === userId && a.date === date);
}
function calculateStatus(checkIn, settings) {
  const d = new Date(checkIn);
  const [h,m] = (settings.officeStart || "09:00").split(":").map(Number);
  const start = new Date(d); start.setHours(h,m,0,0);
  const lateMinutes = Math.max(0, Math.floor((d-start)/60000));
  if (lateMinutes > Number(settings.halfDayAfter || 120)) return "Half day";
  if (lateMinutes > Number(settings.graceMinutes || 0)) return "Late";
  return "Present";
}
function approvedLeaveDays(userId) {
  return getDB().leaves.filter(l => l.userId === userId && l.status === "Approved" && l.type !== "Unpaid")
    .reduce((sum,l) => sum + dayCount(l.start,l.end), 0);
}
function remainingLeave(user) {
  return Math.max(0, Number(user.leaveQuota ?? getDB().company.defaultQuota) - approvedLeaveDays(user.id));
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
}
