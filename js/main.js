const users = [
    { username: "Amelie", password: "05.07.2025" },
    { username: "Yannick", password: "05.07.2025" }
  ];
  
  document.getElementById("loginForm")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const user = document.getElementById("username").value;
    const pw = document.getElementById("password").value;
    const valid = users.find(u => u.username === user && u.password === pw);
  
    if (valid) {
      localStorage.setItem("user", user);
      location.href = "dashboard.html";
    } else {
      document.getElementById("errorMsg").textContent = "Falsche Anmeldedaten.";
    }
  });

