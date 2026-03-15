document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.querySelector('input[name="name"]').value;
  const email = document.querySelector('input[name="email"]').value;
  const phone = document.querySelector('input[name="phone"]').value;
  const password = document.querySelector('input[name="password"]').value;

  try {
    const res = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();
    if (res.ok) {
      // store JWT token
      localStorage.setItem("token", data.token);
      alert("✅ Registration successful!");
      window.location.href = "Index.html"; // redirect to homepage/dashboard
    } else {
      alert("⚠️ " + (data.message || "Registration failed"));
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});
