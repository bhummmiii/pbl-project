// user_login.js

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch('/api/users/login', { // make sure endpoint matches backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if(data.token) {
            // Save JWT to localStorage
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.user.id);

            // Redirect to homepage/dashboard
            window.location.href = "Index.html";
        } else {
            alert(data.message || "Invalid credentials.");
        }
    } catch(err) {
        console.error("Login error:", err);
        alert("Server error, please try again.");
    }
});
