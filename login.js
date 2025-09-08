document.addEventListener('DOMContentLoaded', () => {
    // --- THEME SWITCHER ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const THEME_KEY = 'potsun-theme';

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    };

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Load initial theme on page load
    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

    // --- DOM Elements ---
    const ui = {
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        loginBox: document.querySelector('.login-box'),
        title: document.querySelector('.login-box h1'),
        subtitle: document.querySelector('.login-box .login-subtitle'),
        inputs: {
            loginUsername: document.getElementById('username'),
            loginPassword: document.getElementById('password'),
            registerUsername: document.getElementById('register-username'),
            registerPassword: document.getElementById('register-password'),
            confirmPassword: document.getElementById('confirm-password'),
        },
        messages: {
            loginError: document.getElementById('login-error-message'),
            register: document.getElementById('register-message'),
        },
        toggles: {
            showRegister: document.getElementById('show-register'),
            showLogin: document.getElementById('show-login'),
        }
    };

    // --- CONSTANTS ---
    const CONSTANTS = {
        USERS_STORAGE_KEY: 'potsun-users',
    };

    // --- Hashing Utility (ใช้ Web Crypto API) ---
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        // แปลง ArrayBuffer เป็น Hex String เพื่อให้จัดเก็บได้ง่าย
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // --- View Toggling ---
    const switchView = (view) => {
        if (view === 'register') {
            ui.loginForm.style.display = 'none';
            ui.registerForm.style.display = 'block';
            ui.title.textContent = 'สมัครสมาชิก';
            ui.subtitle.textContent = 'สร้างบัญชีเพื่อเริ่มใช้งาน';
        } else { // 'login'
            ui.registerForm.style.display = 'none';
            ui.loginForm.style.display = 'block';
            ui.title.textContent = 'POTSUN';
            ui.subtitle.textContent = 'กรุณาเข้าสู่ระบบเพื่อใช้งาน';
        }
    };

    ui.toggles.showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('register');
    });

    ui.toggles.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('login');
    });

    // --- Login Logic ---
    ui.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = ui.inputs.loginUsername.value;
        const password = ui.inputs.loginPassword.value;

        // เพิ่มผู้ใช้ทดสอบเพื่อความสะดวก (ควรลบออกในเวอร์ชันจริง)
        if (username === 'admin' && password === '1234') {
            loginSuccess();
            return;
        }

        // ตรวจสอบผู้ใช้ที่ลงทะเบียนจาก localStorage
        const users = JSON.parse(localStorage.getItem(CONSTANTS.USERS_STORAGE_KEY)) || [];
        const hashedPassword = await hashPassword(password);
        const foundUser = users.find(user => user.username === username && user.password === hashedPassword);

        if (foundUser) {
            loginSuccess();
        } else {
            ui.messages.loginError.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
            ui.messages.loginError.style.display = 'block';
        }
    });

    function loginSuccess() {
        // ตั้งค่าสถานะการล็อกอินใน sessionStorage เพื่อให้หน้าหลักสามารถตรวจสอบได้
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'index.html';
    }

    // --- Registration Logic ---
    ui.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = ui.inputs.registerUsername.value.trim();
        const password = ui.inputs.registerPassword.value;
        const confirmPassword = ui.inputs.confirmPassword.value;

        if (!username || !password) {
            showRegisterMessage('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showRegisterMessage('รหัสผ่านไม่ตรงกัน', 'error');
            return;
        }
        if (username.toLowerCase() === 'admin') {
            showRegisterMessage('ชื่อผู้ใช้นี้ไม่สามารถใช้งานได้', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem(CONSTANTS.USERS_STORAGE_KEY)) || [];
        const existingUser = users.find(user => user.username === username);

        if (existingUser) {
            showRegisterMessage('ชื่อผู้ใช้นี้มีอยู่แล้ว', 'error');
            return;
        }

        const hashedPassword = await hashPassword(password);
        users.push({ username, password: hashedPassword });
        localStorage.setItem(CONSTANTS.USERS_STORAGE_KEY, JSON.stringify(users));
        showRegisterMessage('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ', 'success');
        setTimeout(() => ui.toggles.showLogin.click(), 2000);
    });

    function showRegisterMessage(message, type) {
        ui.messages.register.textContent = message;
        ui.messages.register.className = type === 'success' ? 'success-message' : 'error-message';
        ui.messages.register.style.display = 'block';
    }
});
