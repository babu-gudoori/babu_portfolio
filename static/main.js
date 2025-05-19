function showSection(sectionId) {
  // Hide all sections (including admin)
  document.querySelectorAll('section').forEach(section => {
    section.style.display = 'none';
  });

  // Hide admin dashboard if visible
  toggleDashboard(false);  // ✅ Hide admin dashboard

  // Show the selected section
  const target = document.getElementById(sectionId + '-section');
  if (target) {
    target.style.display = 'flex'; // or 'block' based on layout
  }

  // Highlight the active navbar link
  const navbarLinks = document.querySelectorAll('.navbar a');
  navbarLinks.forEach(link => link.classList.remove('active'));

  const activeLink = document.querySelector(`.navbar a[onclick="showSection('${sectionId}')"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // ✅ Save selected section to localStorage
  localStorage.setItem("activeSection", sectionId);
}





// admin use //
let logoClickCount = 0;
let clickTimer;

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("logo");

  logo.addEventListener("click", (e) => {
    e.preventDefault();
    logoClickCount++;

    if (logoClickCount === 3) {
      document.getElementById("admin-login-section").style.display = "flex";
    }

    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => logoClickCount = 0, 2000);
  });

  // Handle login form
  document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;

    try {
      const response = await fetch('/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      // 🔽 Response status check
      if (!response.ok) {
        alert(`❌ Server responded with status: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toggleAdmin(false);
        showDashboard(data.requests);
      } else {
        document.getElementById("login-error").style.display = "block";
      }

    } catch (error) {
      console.error("❌ Network error:", error);
      alert("❌ Unable to connect to server. Please try again.");
    }



  });



});



function toggleAdmin(show) {
  document.getElementById("admin-login-section").style.display = show ? "flex" : "none";
}

function toggleDashboard(show) {
  document.getElementById("admin-dashboard").style.display = show ? "flex" : "none";
}

function showDashboard(requests) {
  toggleDashboard(true);
  localStorage.setItem("activeSection", "admin-dashboard"); // ✅ Save current section

  const tableBody = document.querySelector("#hire-requests-table tbody");
  tableBody.innerHTML = "";

  requests.forEach(req => {
    const row = `<tr>
      <td>${req.id}</td>
      <td>${req.name}</td>
      <td>${req.email}</td>
      <td>${req.message}</td>
      <td>${req.submitted_at}</td> <!-- ✅ New Date Column -->
    </tr>`;
    tableBody.innerHTML += row;
  });
}



document.addEventListener("DOMContentLoaded", async () => {
  // Existing popup logic
  const successFlag = document.body.dataset.success;

  if (successFlag === "true") {
    const popup = document.getElementById("success-popup");
    if (popup) {
      popup.style.display = "flex";

      setTimeout(() => {
        popup.style.display = "none";
        window.history.replaceState({}, document.title, "/");
      }, 3000);
    }
  }

  // ✅ Restore section on page reload
  const savedSection = localStorage.getItem("activeSection");
  if (savedSection === "admin-dashboard") {
    try {
      const response = await fetch("/get-requests");
      if (response.ok) {
        const data = await response.json();
        showDashboard(data.requests);
      } else {
        console.warn("Failed to fetch dashboard data.");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  } else if (savedSection) {
    showSection(savedSection);
  }

  const hireModal = document.getElementById("hire-form-modal");
  if (hireModal) {
    hireModal.addEventListener("click", function (e) {
      if (e.target === this) {
        toggleForm(false);
      }
    });
  }

});
function toggleForm(show = true) {
  const modal = document.getElementById("hire-form-modal");
  if (modal) {
    modal.style.display = show ? "flex" : "none";
  }
}


// chatbot start//
window.onload = function () {
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("user-input");
  const introMessage = document.getElementById("introMessage");
  const chatbotContainer = document.querySelector('.chatbot-container');

  // Typing effect intro message on load
  const introText = "I'm Riya, Babu's Assistant";
  let i = 0;

  function typeIntro() {
    if (i < introText.length) {
      introMessage.textContent += introText.charAt(i);
      i++;
      setTimeout(typeIntro, 100);
    } else {
      setTimeout(eraseIntro, 2500); // wait 2.5s then erase
    }
  }

  function eraseIntro() {
    if (i > 0) {
      i--;
      introMessage.textContent = introText.substring(0, i);
      setTimeout(eraseIntro, 50);
    } else {
      introMessage.classList.add("fade-out");
    }
  }

  // Typing the intro message
  typeIntro();

  window.toggleChatbot = function () {
    const box = document.getElementById("chatbotBox");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  };

  window.sendMessage = function () {
    const userText = input.value.trim();
    if (!userText) return;

    appendMessage("user", userText);
    input.value = "";

    showTypingIndicator();

    setTimeout(() => {
      processInput(userText.toLowerCase());
      removeTypingIndicator();
    }, 1000);
  };

  function appendMessage(sender, text) {
    const message = document.createElement("div");
    message.className = sender === "user" ? "user-msg" : "bot-msg";
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "bot-msg typing-indicator";
    typing.textContent = "Riya is typing...";
    typing.id = "typing";
    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
  }

  // --- Fetch and process CSV file ---
  let csvData = [];

  function loadCSV() {
    Papa.parse("static/chatbot-dataset.csv", {
      download: true,
      header: true,
      complete: function (results) {
        csvData = results.data;
        console.log("CSV Loaded!", csvData); // ✅ Check browser console for output
      },
      error: function (err) {
        console.error("CSV Load Error", err);
      }
    });

  }

  window.onload = function () {
    loadCSV(); // Load CSV when page loads

    // Continue with rest of your chatbot setup (already present in your script)
  };

  // --- Process user input using CSV + fallback responses ---
  Papa.parse("static/chatbot-dataset.csv", {
    download: true,
    header: true,
    complete: function (results) {
      csvData = results.data;
      console.log("CSV Loaded!", csvData); // ✅ Check browser console for output
    },
    error: function (err) {
      console.error("CSV Load Error", err);
    }
  });

  function processInput(text) {
    let response = null;

    // First, try to match from CSV
    for (let row of csvData) {
      if (row.question) {
        const variants = row.question.toLowerCase().split("||").map(q => q.trim());
        for (let variant of variants) {
          if (text.includes(variant)) {
            response = row.response;
            break;
          }
        }
      }
      if (response) break;
    }


    // If no match, fallback to built-in rules
    if (!response) {
      if (text.includes("hello") || text.includes("hi") || text.includes("hai")) {
        response = "Hey there! I'm Riya, Babu's assistant!";
      } else if (text.includes("skills")) {
        response = "I'm skilled in Python, Flask, JavaScript, HTML, CSS, and MySQL.";
      } else if (text.includes("education")) {
        response = "B.Tech in Computer Science & Engineering, specialized in AI & ML.";
      } else if (text.includes("projects")) {
        response = "Projects include Portfolio, AI chatbot, sentiment analysis, and more!";
      } else if (text.includes("name") || text.includes("creator")) {
        response = "My creator is a passionate engineer with a focus on AI and web dev.";
      } else {
        response = "Ask me something like: ‘Tell me Babu’s projects’ or ‘What skills does Babu have?’";
      }
    }

    appendMessage("bot", response);
  }

  // Close chatbot when clicking outside
  document.addEventListener('click', function (event) {
    if (!chatbotContainer.contains(event.target)) {
      const box = document.getElementById("chatbotBox");
      box.style.display = "none"; // Close the chat box
    }
  });
};


//chatbot end//


function toggleMenu() {
  const navbar = document.querySelector('.navbar');
  navbar.classList.toggle('active');
}

// Auto-close navbar on link click
document.querySelectorAll('.navbar a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.navbar').classList.remove('active');
  });
});

// Close navbar when clicking outside
document.addEventListener('click', function (event) {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');

  const clickedInsideNavbar = navbar.contains(event.target);
  const clickedHamburger = hamburger.contains(event.target);

  if (!clickedInsideNavbar && !clickedHamburger) {
    navbar.classList.remove('active');
  }
});


new VenoBox({ selector: '.venobox' });