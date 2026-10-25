function byId(id){return document.getElementById(id)}
function setText(id,value){const el=byId(id);if(el)el.textContent=value}
function setMsg(id,msg,error=false){const el=byId(id);if(el){el.textContent=msg;el.classList.toggle("error",error)}}
function statusClass(status){return String(status||"not checked in").toLowerCase().replace(/\s+/g,"-")}
function statusPill(status){return `<span class="status ${statusClass(status)}">${escapeHTML(status||"Not checked in")}</span>`}
function personCell(user){return `<div class="person-cell"><span class="mini-avatar">${escapeHTML((user?.name||"?").slice(0,1).toUpperCase())}</span><span><span class="person-name">${escapeHTML(user?.name||"Unknown")}</span><span class="sub-text">${escapeHTML(user?.username||"")}</span></span></div>`}
function renderAdmin(){
  const db=getDB(), employees=db.users.filter(u=>u.role==="employee"), today=todayISO();
  setText("welcomeText",`Welcome back. Here's what's happening at ${db.company.name}.`);
  setText("todayLabel",new Date().toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short",year:"numeric"}));
  setText("adminAvatar",(getCurrentUser()?.name||"A").slice(0,1).toUpperCase());
  setText("totalEmployees",employees.length);
  const records=db.attendance.filter(a=>a.date===today);
  setText("presentCount",records.filter(a=>a.checkIn).length);
  setText("lateCount",records.filter(a=>["Late","Half day"].includes(a.status)).length);
  setText("pendingCount",db.leaves.filter(l=>l.status==="Pending").length);
  const tbody=byId("attendanceTable");
  if(tbody){
    const rows=records.slice().sort((a,b)=>b.checkIn.localeCompare(a.checkIn)).map(a=>{const u=db.users.find(x=>x.id===a.userId);return `<tr><td>${personCell(u)}</td><td>${escapeHTML(u?.department||"—")}</td><td>${formatTime(a.checkIn)}</td><td>${statusPill(a.status)}</td></tr>`}).join("");
    tbody.innerHTML=rows||`<tr><td colspan="4" class="muted">No attendance records yet today.</td></tr>`;
  }
}
function renderEmployees(){
  const db=getDB(), employees=db.users.filter(u=>u.role==="employee");
  setText("employeeCountLabel",`${employees.length} employee${employees.length===1?"":"s"}`);
  const search=(byId("employeeSearch")?.value||"").toLowerCase();
  const tbody=byId("employeesTable");if(!tbody)return;
  const filtered=employees.filter(u=>[u.name,u.username,u.department].some(v=>String(v||"").toLowerCase().includes(search)));
  tbody.innerHTML=filtered.map(u=>`<tr><td>${personCell(u)}</td><td>${escapeHTML(u.username)}</td><td>${escapeHTML(u.department)}</td><td>${money(u.salary)}</td><td><button class="btn ghost" data-delete-user="${u.id}" style="padding:6px 9px;font-size:10px">Delete</button></td></tr>`).join("")||`<tr><td colspan="5" class="muted">No employees found. Add your first employee above.</td></tr>`;
  tbody.querySelectorAll("[data-delete-user]").forEach(btn=>btn.addEventListener("click",()=>{
    const id=btn.dataset.deleteUser;const u=getUserById(id);
    if(!confirm(`Delete ${u?.name||"this employee"} and their associated records?`))return;
    const fresh=getDB();fresh.users=fresh.users.filter(x=>x.id!==id);fresh.attendance=fresh.attendance.filter(x=>x.userId!==id);fresh.leaves=fresh.leaves.filter(x=>x.userId!==id);saveDB(fresh);renderEmployees();
  }));
}
function initEmployeeForm(){
 const form=byId("employeeForm");if(!form)return;
 form.addEventListener("submit",e=>{e.preventDefault();const db=getDB();const username=byId("empUsername").value.trim();
 if(db.users.some(u=>u.username.toLowerCase()===username.toLowerCase()))return setMsg("employeeMessage","That username already exists.",true);
 db.users.push({id:uid("user"),name:byId("empName").value.trim(),username,password:byId("empPassword").value,role:"employee",department:byId("empDepartment").value.trim(),salary:Number(byId("empSalary").value),leaveQuota:Number(byId("empQuota").value),createdAt:new Date().toISOString()});
 saveDB(db);form.reset();byId("empQuota").value=db.company.defaultQuota;setMsg("employeeMessage","Employee and login created successfully.");renderEmployees();
 });
}
function renderLeaves(){
 const db=getDB(), filter=byId("leaveFilter")?.value||"all",tbody=byId("leavesTable");if(!tbody)return;
 const leaves=db.leaves.filter(l=>filter==="all"||l.status.toLowerCase()===filter).slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 tbody.innerHTML=leaves.map(l=>{const u=db.users.find(x=>x.id===l.userId);const actions=l.status==="Pending"?`<div style="display:flex;gap:5px"><button class="btn primary" data-decision="${l.id}|Approved" style="padding:6px 8px;font-size:10px">Approve</button><button class="btn ghost" data-decision="${l.id}|Rejected" style="padding:6px 8px;font-size:10px">Reject</button></div>`:`${statusPill(l.status)}<span class="sub-text">${escapeHTML(l.comment||"")}</span>`;
 return `<tr><td>${personCell(u)}</td><td>${escapeHTML(l.type)}</td><td>${formatDate(l.start)} – ${formatDate(l.end)}</td><td>${dayCount(l.start,l.end)}</td><td style="white-space:normal;min-width:130px">${escapeHTML(l.reason)}</td><td>${actions}</td></tr>`}).join("")||`<tr><td colspan="6" class="muted">No leave requests yet.</td></tr>`;
 tbody.querySelectorAll("[data-decision]").forEach(btn=>btn.addEventListener("click",()=>{const [id,decision]=btn.dataset.decision.split("|");let comment=prompt(`Optional comment for ${decision.toLowerCase()}:`);if(comment===null)return;const fresh=getDB();const leave=fresh.leaves.find(l=>l.id===id);if(!leave)return;
 if(decision==="Approved"&&leave.type!=="Unpaid"){const u=fresh.users.find(x=>x.id===leave.userId);const remaining=remainingLeave(u);if(dayCount(leave.start,leave.end)>remaining)return alert(`Not enough leave balance. Remaining: ${remaining} day(s).`)}
 leave.status=decision;leave.comment=comment.trim();leave.reviewedAt=new Date().toISOString();saveDB(fresh);renderLeaves();
 }));
}
function renderSettings(){
 const db=getDB();if(!byId("settingsForm"))return;
 byId("settingsCompany").value=db.company.name;byId("officeStart").value=db.company.officeStart;byId("graceMinutes").value=db.company.graceMinutes;byId("defaultQuota").value=db.company.defaultQuota;byId("halfDayAfter").value=db.company.halfDayAfter;
 byId("settingsForm").addEventListener("submit",e=>{e.preventDefault();const fresh=getDB();fresh.company={...fresh.company,name:byId("settingsCompany").value.trim(),officeStart:byId("officeStart").value,graceMinutes:Number(byId("graceMinutes").value),defaultQuota:Number(byId("defaultQuota").value),halfDayAfter:Number(byId("halfDayAfter").value)};saveDB(fresh);setMsg("settingsMessage","Settings saved successfully.");});
}
function appendChat(logId,text,isUser=false){const log=byId(logId);if(!log)return;const div=document.createElement("div");div.className=isUser?"user-bubble":"bot-bubble";div.textContent=text;log.appendChild(div);log.scrollTop=log.scrollHeight}
function answerHelper(question, user){
 const q=question.toLowerCase(),db=getDB(),today=todayISO(),employees=db.users.filter(u=>u.role==="employee");
 if(user.role==="admin"){
   if(q.includes("employee")||q.includes("team")||q.includes("staff"))return `You currently have ${employees.length} employee(s).`;
   if(q.includes("leave")){const onLeave=employees.filter(u=>db.leaves.some(l=>l.userId===u.id&&l.status==="Approved"&&l.start<=today&&l.end>=today));if(q.includes("how many")||q.includes("count"))return `${onLeave.length} employee(s) are on approved leave today.`;return onLeave.length?`On approved leave today: ${onLeave.map(u=>u.name).join(", ")}.`:"No employees are on approved leave today."}
   if(q.includes("late")){const late=db.attendance.filter(a=>a.date===today&&["Late","Half day"].includes(a.status)).map(a=>db.users.find(u=>u.id===a.userId)?.name).filter(Boolean);return late.length?`Late today: ${late.join(", ")}.`:"No late attendance records today."}
   if(q.includes("present"))return `${db.attendance.filter(a=>a.date===today&&a.checkIn).length} employee(s) have checked in today.`;
   return "Try asking: How many employees do we have? Who is on leave today? Who was late today?";
 }
 const record=getAttendanceFor(user.id,today);
 if(q.includes("leave")&&(q.includes("left")||q.includes("balance")||q.includes("how many")))return `You have ${remainingLeave(user)} day(s) of leave remaining.`;
 if(q.includes("late"))return record?`Today's status is ${record.status}. Your check-in was ${formatTime(record.checkIn)}.`:"You have not checked in today, so no late status is recorded.";
 if(q.includes("hour")||q.includes("work")){const rows=db.attendance.filter(a=>a.userId===user.id&&a.checkOut&&a.checkIn&&a.date>=(()=>{const d=new Date();d.setDate(d.getDate()-6);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`})());const hours=rows.reduce((sum,a)=>sum+(new Date(a.checkOut)-new Date(a.checkIn))/3600000,0);return `Your recorded work time over the last 7 days is ${hours.toFixed(1)} hour(s). Only completed check-in/out records are counted.`}
 if(q.includes("salary")||q.includes("payslip"))return `Your monthly salary is ${money(user.salary)}. Open My payslip to view or print your salary slip.`;
 return "Try asking: How many leaves do I have left? Was I late today? How many hours did I work this week?";
}
function initHelper(formId,inputId,logId){const form=byId(formId);if(!form)return;form.addEventListener("submit",e=>{e.preventDefault();const input=byId(inputId),q=input.value.trim();if(!q)return;appendChat(logId,q,true);appendChat(logId,answerHelper(q,getCurrentUser()));input.value="";});}
function renderEmployee(){
 const user=getCurrentUser();if(!user)return;const db=getDB(),today=todayISO(),record=getAttendanceFor(user.id,today);
 setText("employeeWelcome",`Hello, ${user.name.split(" ")[0]}`);setText("employeeAvatar",user.name.slice(0,1).toUpperCase());setText("myTodayStatus",record?.status||"Not checked in");setText("myLeaveBalance",`${remainingLeave(user)} days`);setText("mySalary",money(user.salary));setText("checkinDate",formatDate(today));
 const clock=()=>setText("liveClock",new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}));clock();setInterval(clock,1000);
 const inBtn=byId("checkInBtn"),outBtn=byId("checkOutBtn");
 if(inBtn)inBtn.disabled=!!record?.checkIn;
 if(outBtn)outBtn.disabled=!record?.checkIn||!!record?.checkOut;
 if(record?.checkOut)setText("checkinHint",`You checked in at ${formatTime(record.checkIn)} and checked out at ${formatTime(record.checkOut)}.`);
 else if(record?.checkIn)setText("checkinHint",`Checked in at ${formatTime(record.checkIn)}. Remember to check out when leaving.`);
 const tbody=byId("myAttendanceTable");if(tbody){const rows=db.attendance.filter(a=>a.userId===user.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);tbody.innerHTML=rows.map(a=>`<tr><td>${formatDate(a.date)}</td><td>${formatTime(a.checkIn)}</td><td>${formatTime(a.checkOut)}</td><td>${statusPill(a.status)}</td></tr>`).join("")||`<tr><td colspan="4" class="muted">No attendance records yet.</td></tr>`}
 if(inBtn)inBtn.addEventListener("click",()=>{const fresh=getDB();if(fresh.attendance.some(a=>a.userId===user.id&&a.date===today))return setMsg("attendanceMessage","You have already checked in today.",true);const checkIn=new Date().toISOString();fresh.attendance.push({id:uid("att"),userId:user.id,date:today,checkIn,checkOut:null,status:calculateStatus(checkIn,fresh.company)});saveDB(fresh);setMsg("attendanceMessage",`Checked in at ${formatTime(checkIn)}. Status: ${calculateStatus(checkIn,fresh.company)}.`);renderEmployee();});
 if(outBtn)outBtn.addEventListener("click",()=>{const fresh=getDB(),r=fresh.attendance.find(a=>a.userId===user.id&&a.date===today);if(!r||r.checkOut)return setMsg("attendanceMessage","No active check-in found.",true);r.checkOut=new Date().toISOString();saveDB(fresh);setMsg("attendanceMessage",`Checked out at ${formatTime(r.checkOut)}.`);renderEmployee();});
 const lf=byId("leaveForm");if(lf){const start=byId("leaveStart"),end=byId("leaveEnd");start.min=today;end.min=today;start.addEventListener("change",()=>{end.min=start.value||today;if(end.value&&end.value<start.value)end.value=start.value});
 lf.addEventListener("submit",e=>{e.preventDefault();const s=start.value,en=end.value;if(en<s)return setMsg("leaveMessage","End date must be on or after start date.",true);const days=dayCount(s,en),type=byId("leaveType").value;if(type!=="Unpaid"&&days>remainingLeave(user))return setMsg("leaveMessage",`Not enough leave balance. You have ${remainingLeave(user)} day(s) left.`,true);const fresh=getDB();fresh.leaves.push({id:uid("leave"),userId:user.id,type,start:s,end:en,reason:byId("leaveReason").value.trim(),status:"Pending",comment:"",createdAt:new Date().toISOString()});saveDB(fresh);lf.reset();setMsg("leaveMessage","Leave request submitted. Waiting for admin review.");});}
}
function renderPayslip(){const user=getCurrentUser();if(!user)return;const db=getDB();setText("slipCompany",db.company.name);setText("slipName",user.name);setText("slipDepartment",user.department||"—");setText("slipPeriod",new Date().toLocaleDateString(undefined,{month:"long",year:"numeric"}));setText("slipId",user.id.toUpperCase());setText("slipSalary",money(user.salary));setText("slipNet",money(user.salary));}
document.addEventListener("DOMContentLoaded",()=>{
 const page=location.pathname.split("/").pop();
 if(page==="admin.html"){renderAdmin();initHelper("adminHelperForm","adminQuestion","adminChat")}
 if(page==="employees.html"){renderEmployees();initEmployeeForm();byId("employeeSearch")?.addEventListener("input",renderEmployees)}
 if(page==="leaves.html"){renderLeaves();byId("leaveFilter")?.addEventListener("change",renderLeaves)}
 if(page==="settings.html")renderSettings();
 if(page==="employee.html"){renderEmployee();initHelper("employeeHelperForm","employeeQuestion","employeeChat")}
 if(page==="payslip.html")renderPayslip();
});
