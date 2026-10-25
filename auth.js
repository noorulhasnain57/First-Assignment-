function setMessage(el, text, error=false) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", !!error);
}
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const db = getDB();
    const username = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const user = db.users.find(u => u.username.toLowerCase() === username && u.password === password);
    if (!user) return setMessage(document.getElementById("loginMessage"), "Incorrect username or password.", true);
    sessionStorage.setItem("hcm_current_user", user.id);
    location.href = user.role === "admin" ? "admin.html" : "employee.html";
  });
  const setupForm = document.getElementById("setupForm");
  if (setupForm) setupForm.addEventListener("submit", e => {
    e.preventDefault();
    const db = getDB();
    if (db.users.some(u => u.role === "admin")) return setMessage(document.getElementById("setupMessage"), "An admin already exists. Please sign in.", true);
    const password = document.getElementById("adminPassword").value;
    if (password !== document.getElementById("confirmPassword").value) return setMessage(document.getElementById("setupMessage"), "Passwords do not match.", true);
    const username = document.getElementById("adminUsername").value.trim();
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) return setMessage(document.getElementById("setupMessage"), "Username is already taken.", true);
    db.company.name = document.getElementById("companyName").value.trim();
    db.users.push({id:uid("user"),name:document.getElementById("adminName").value.trim(),username,password,role:"admin",department:"Administration",salary:0,leaveQuota:db.company.defaultQuota,createdAt:new Date().toISOString()});
    saveDB(db);
    setMessage(document.getElementById("setupMessage"), "Company created! Redirecting to login...");
    setTimeout(() => location.href = "index.html", 900);
  });
  document.querySelectorAll("[data-logout]").forEach(btn => btn.addEventListener("click", () => {
    sessionStorage.removeItem("hcm_current_user"); location.href = "index.html";
  }));
  const page = location.pathname.split("/").pop();
  const user = getCurrentUser();
  const protectedPages = ["admin.html","employees.html","leaves.html","settings.html","employee.html","payslip.html"];
  if (protectedPages.includes(page)) {
    if (!user) { location.replace("index.html"); return; }
    const adminPages = ["admin.html","employees.html","leaves.html","settings.html"];
    const employeePages = ["employee.html","payslip.html"];
    if (adminPages.includes(page) && user.role !== "admin") location.replace("employee.html");
    if (employeePages.includes(page) && user.role !== "employee") location.replace("admin.html");
  }
});
