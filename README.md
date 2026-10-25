# HCM Lite — Saylani Hackathon Beginner Track

A responsive HR management demo built with HTML, CSS and vanilla JavaScript. Data is saved in browser `localStorage`; no framework or backend is used.

## Features
- First-run company and admin setup
- Role-based login for Admin and Employee
- Add and delete employee accounts
- Attendance check-in/check-out with configurable late and half-day rules
- Leave request submission and admin approval/rejection
- Leave balance calculation
- Dashboard statistics and recent attendance
- Rule-based smart helper on both dashboards
- Monthly demo payslip with print / Save as PDF
- Responsive layout for mobile and desktop

## Project structure
```text
hcm_lite_assignment/
├── index.html
├── setup.html
├── admin.html
├── employees.html
├── leaves.html
├── settings.html
├── employee.html
├── payslip.html
├── css/style.css
└── js/
    ├── storage.js
    ├── auth.js
    └── app.js
```

## Run locally
1. Extract the ZIP file.
2. Open `index.html` in a modern browser. If your browser blocks some local-file behavior, use VS Code with the Live Server extension.
3. Choose **Open first-time setup**.
4. Create a company and admin account.
5. Sign in as admin, open Employees, and create an employee login.
6. Sign out and sign in as that employee to test attendance, leave and payslip.
7. To test leave approval, sign out and return to the admin account.

## Demo notes
- The app begins with no user accounts or sample employees.
- This is a learning prototype. Passwords are stored in localStorage as plain text, which is not suitable for a real HR system.
- Data is stored per browser/device and is not shared between users or devices.
- Payslip uses a simple salary amount; tax and deductions are not calculated.
- Camera-based face detection, GPS validation, charts and a real LLM API are not implemented in this version.

## Before submission
- Test the complete workflow in your browser.
- Add your own name and any required class details to your submission notes.
- Upload the project to your own GitHub repository.
- Host it on GitHub Pages, Netlify or Vercel, then submit the repository and hosted links on the Saylani LMS.
