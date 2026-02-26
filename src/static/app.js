document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySearch = document.getElementById("activity-search");
  const headerEmail = document.getElementById("header-email");
  const messageDiv = document.getElementById("message");

  // Modal elements
  const signupModal = document.getElementById("signup-modal");
  const modalEmailDisplay = document.getElementById("modal-email-display");
  const modalActivityDisplay = document.getElementById("modal-activity-display");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalOverlay = signupModal.querySelector(".modal-overlay");

  let pendingActivity = null;

  // Filter displayed activity cards based on search input
  activitySearch.addEventListener("input", () => {
    const query = activitySearch.value.toLowerCase().trim();
    document.querySelectorAll(".activity-card").forEach((card) => {
      const name = card.querySelector("h4").textContent.toLowerCase();
      card.style.display = name.includes(query) ? "" : "none";
    });
  });

  // Show/hide modal helpers
  function openModal(activityName) {
    const email = headerEmail.value.trim();
    if (!email) {
      showMessage("Please enter your email in the header before signing up.", "error");
      headerEmail.focus();
      return;
    }
    pendingActivity = activityName;
    modalEmailDisplay.textContent = email;
    modalActivityDisplay.textContent = activityName;
    signupModal.classList.remove("hidden");
  }

  function closeModal() {
    signupModal.classList.add("hidden");
    pendingActivity = null;
  }

  modalCancelBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Confirm signup from modal
  modalConfirmBtn.addEventListener("click", async () => {
    const email = headerEmail.value.trim();
    const activity = pendingActivity;
    closeModal();

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Handle unregister button clicks (event delegation)
  activitiesList.addEventListener("click", async (event) => {
    // Signup button
    const signupBtn = event.target.closest(".signup-btn");
    if (signupBtn) {
      openModal(signupBtn.dataset.activity);
      return;
    }

    // Unregister button
    const unregisterBtn = event.target.closest(".unregister-btn");
    if (!unregisterBtn) return;

    const activity = unregisterBtn.dataset.activity;
    const email = unregisterBtn.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const isFull = spotsLeft === 0;

        const participantsHTML = details.participants.length > 0
          ? `<ul class="participants-list">${details.participants.map(p => `<li><span class="participant-email">${p}</span><button class="unregister-btn" data-activity="${name}" data-email="${p}" title="Unregister participant">🗑</button></li>`).join("")}</ul>`
          : `<p class="no-participants">No participants yet — be the first!</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-badge ${isFull ? 'spots-full' : spotsLeft <= 3 ? 'spots-low' : 'spots-ok'}">${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left</span></p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${participantsHTML}
          </div>
          <button class="signup-btn" data-activity="${name}" ${isFull ? 'disabled' : ''}>${isFull ? 'Activity Full' : 'Sign Up'}</button>
        `;

        activitiesList.appendChild(activityCard);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Utility: show a toast message
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `toast ${type}`;
    messageDiv.classList.remove("hidden");
    clearTimeout(messageDiv._hideTimer);
    messageDiv._hideTimer = setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Initialize app
  fetchActivities();
});
