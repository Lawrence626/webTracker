

let bhws = [];

// ===== BHW PAGINATION STATE =====
let bhwCurrentPage = 1;
let bhwItemsPerPage = 10;
let bhwSearchQuery = "";
function openApprovedModal() {
  const modal = document.getElementById("approvedModal");
  if (modal) {
    loadApprovedModal();  // ✅ Load the approved BHWs data
    modal.classList.add("show");
    console.log("✅ Approved modal opened");
  } else {
    console.error("❌ Approved modal not found");
  }
}
let bhwViewMode = "grid"; // Default view: grid or list

function toggleBhwViewMenu() {
    document.getElementById("bhwViewDropdown").classList.toggle("hidden");
}

function setBhwView(viewType) {
    const container = document.getElementById("bhwList");

    container.classList.remove("workers-list", "workers-table", "workers-grid");

    if (viewType === "list") {
        container.classList.add("workers-list");
    } else if (viewType === "table") {
        container.classList.add("workers-table");
    } else {
        container.classList.add("workers-grid");
    }

    bhwViewMode = viewType;
    renderBhwList();
    document.getElementById("bhwViewDropdown").classList.add("hidden");
}


function switchBhwView(viewMode) {
  bhwViewMode = viewMode;
  
  // Save view preference to localStorage
  localStorage.setItem("bhwViewMode", viewMode);
  
  // Close the dropdown menu
  const dropdown = document.getElementById("bhwViewDropdown");
  if (dropdown) dropdown.classList.add("hidden");
  
  // Update active menu item
  document.querySelectorAll("#bhwViewDropdown .dropdown-item").forEach(item => {
    item.classList.remove("active");
  });
  event.target.closest(".dropdown-item")?.classList.add("active");
  
  // Re-render with new view
  renderBhwList();
}

// ===== BHW PAGINATION FUNCTIONS =====
function changeBhwItemsPerPage(value) {
  bhwItemsPerPage = parseInt(value);
  bhwCurrentPage = 1; // Reset to first page
  renderBhwList();
  updateBhwPaginationUI();
}

function bhwNextPage() {
  const totalBhws = getFilteredAndSearchedBhws().length;
  const totalPages = Math.ceil(totalBhws / bhwItemsPerPage);
  if (bhwCurrentPage < totalPages) {
    bhwCurrentPage++;
    renderBhwList();
    updateBhwPaginationUI();
  }
}

function bhwPreviousPage() {
  if (bhwCurrentPage > 1) {
    bhwCurrentPage--;
    renderBhwList();
    updateBhwPaginationUI();
  }
}

// Get filtered and searched BHWs
function getFilteredAndSearchedBhws() {
  let filtered = bhws;
  
  // Filter for only approved BHWs
  filtered = filtered.filter(bhw => bhw.status && bhw.status.toLowerCase() === "approved");
  
  // Apply search filter
  if (bhwSearchQuery) {
    filtered = filtered.filter(bhw => {
      const fullName = `${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}`.toLowerCase();
      const email = (bhw.email || "").toLowerCase();
      return fullName.includes(bhwSearchQuery) || email.includes(bhwSearchQuery);
    });
  }
  
  return filtered;
}

// Get paginated BHWs
function getPaginatedBhws() {
  const allFiltered = getFilteredAndSearchedBhws();
  const startIndex = (bhwCurrentPage - 1) * bhwItemsPerPage;
  const endIndex = startIndex + bhwItemsPerPage;
  return allFiltered.slice(startIndex, endIndex);
}

// Update BHW pagination UI
function updateBhwPaginationUI() {
  const total = getFilteredAndSearchedBhws().length;
  const totalPages = Math.ceil(total / bhwItemsPerPage) || 1;
  
  // Update page info
  document.getElementById("bhwPageInfo").textContent = `Page ${bhwCurrentPage} of ${totalPages}`;
  
  // Update button states
  document.getElementById("bhwPrevBtn").disabled = bhwCurrentPage === 1;
  document.getElementById("bhwNextBtn").disabled = bhwCurrentPage >= totalPages;
}


async function loadAllBhw() {
  try {
    const res = await fetch("http://localhost:5236/api/bhw/all");
    if (!res.ok) throw new Error("Failed to load BHWs");

    bhws = await res.json(); // ✅ populate global array
    console.log("✅ Loaded BHWs:", bhws);

    // Re-render dashboard sections
    renderPendingList();
    renderApprovedList();
    renderStats();
  } catch (err) {
    console.error("❌ Error loading all BHWs:", err);
  }
}



function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

//document.addEventListener("DOMContentLoaded", loadApprovedBHWs);





// === SWITCH SECTIONS ===
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  let navBtn = document.querySelector(`.nav-btn[data-section="${id}"]`);
  if (navBtn) navBtn.classList.add("active");

  if (id === "status") {
    initCharts();
  }
  if (id === "profile") {
    loadProfile();
  }
  
  if (id === "workers") {
    renderBhwList();
  }
}


function loadProfile() {
  if (!adminUser) {
    console.error("⚠️ adminUser not loaded yet — skipping loadProfile()");
    return;
  }

  // Helper function to safely set text content
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value || "—";
  };

  setText("adminName", `${adminUser.firstname || ""} ${adminUser.middlename || ""} ${adminUser.surname || ""}`.trim());
  setText("adminAge", adminUser.age);
  setText("adminBirthday", adminUser.birthday);
  setText("adminEmail", adminUser.email);
  setText("adminContact", adminUser.contact);
  setText("adminAddress", adminUser.address);
  setText("adminYears", adminUser.years);

  const img = document.getElementById("profileImage");
  if (img && adminUser.photo) {
    img.src = adminUser.photo.startsWith("http")
      ? adminUser.photo
      : `http://localhost:5236/${adminUser.photo}`;
  }

  // Load certifications for admin profile
  loadAdminCertifications();
}


document.getElementById("uploadProfile").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("profileImage").src = e.target.result;
      adminUser.photo = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});



async function renderBhwList() {
  const container = document.getElementById("bhwList");
  
  // Update search query
  const searchInput = document.getElementById("workerSearch");
  bhwSearchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  // Reset to first page when search changes
  bhwCurrentPage = 1;
  
  container.innerHTML = "";

  try {
    // ✅ Fetch all BHWs
    const res = await fetch("http://localhost:5236/api/bhw/all");
    bhws = await res.json();

    // ✅ Get paginated BHWs
    const paginatedBhws = getPaginatedBhws();

    // ✅ Show "no results" message
    if (paginatedBhws.length === 0) {
      const totalFiltered = getFilteredAndSearchedBhws().length;
      if (totalFiltered === 0) {
        container.innerHTML = `<p style="color: gray; text-align: center;">No approved BHWs found.</p>`;
      }
      updateBhwPaginationUI();
      return;
    }

    // Route to appropriate view
    if (bhwViewMode === "list") {
      renderBhwListView(paginatedBhws, container);
    } else if (bhwViewMode === "table") {
      renderBhwTableView(paginatedBhws, container);
    } else {
      renderBhwGridView(paginatedBhws, container);
    }
    
    // Update pagination UI
    updateBhwPaginationUI();

  } catch (err) {
    console.error("❌ Error loading BHWs:", err);
    container.innerHTML = "<p style='color:red;'>⚠️ Failed to load BHWs. Please check your backend.</p>";
  }
}

function renderBhwGridView(filteredBhw, container) {
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
  container.style.gap = "20px";
  
  filteredBhw.forEach(bhw => {
    const card = document.createElement("div");
    card.className = "bhw-card";
    const bhwPhotoSrc = bhw.photo 
      ? (bhw.photo.startsWith("http") ? bhw.photo : `http://localhost:5236/${bhw.photo}`)
      : "logo/logo.png";
    card.innerHTML = `
      <div class="bhw-info">
        <img src="${bhwPhotoSrc}" alt="${bhw.firstname} ${bhw.surname}" class="bhw-photo">
        <div class="bhw-details">
          <h3>${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}</h3>
          <p><strong>Age:</strong> ${bhw.age}</p>
          <p><strong>Email:</strong> ${bhw.email}</p>
          <p><strong>Contact:</strong> ${bhw.contact}</p>
          <p><strong>Address:</strong> ${bhw.address}</p>
        </div>
      </div>
      <div class="bhw-actions">
        <button class="edit-btn" onclick="editBhw(${bhw.bhwId})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
        <button class="delete-btn" onclick="deleteBhw(${bhw.bhwId})"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderBhwListView(filteredBhw, container) {
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "12px";
  
  filteredBhw.forEach(bhw => {
    const card = document.createElement("div");
    card.className = "bhw-card bhw-list-card";
    const bhwPhotoSrc = bhw.photo 
      ? (bhw.photo.startsWith("http") ? bhw.photo : `http://localhost:5236/${bhw.photo}`)
      : "logo/logo.png";
    card.innerHTML = `
      <div class="bhw-info">
        <img src="${bhwPhotoSrc}" alt="${bhw.firstname} ${bhw.surname}" class="bhw-photo">
        <div class="bhw-details">
          <h3>${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}</h3>
          <p><strong>Age:</strong> ${bhw.age} | <strong>Email:</strong> ${bhw.email}</p>
          <p><strong>Contact:</strong> ${bhw.contact}</p>
          <p><strong>Address:</strong> ${bhw.address}</p>
        </div>
      </div>
      <div class="bhw-actions">
        <button class="edit-btn" onclick="editBhw(${bhw.bhwId})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
        <button class="delete-btn" onclick="deleteBhw(${bhw.bhwId})"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderBhwTableView(filteredBhw, container) {
  container.style.display = "block";
  container.innerHTML = "";

container.classList.remove("workers-grid");
container.classList.add("workers-table");

  const table = document.createElement("table");
  table.className = "bhw-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Age</th>
        <th>Email</th>
        <th>Contact</th>
        <th>Address</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${filteredBhw.map((bhw) => `
        <tr>
          <td><strong>${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}</strong></td>
          <td>${bhw.age}</td>
          <td>${bhw.email}</td>
          <td>${bhw.contact}</td>
          <td>${bhw.address}</td>
          <td><button class="edit-btn" onclick="editBhw(${bhw.bhwId})"><i class="fa-solid fa-pen-to-square"></i>Edit</button><button class="delete-btn" onclick="deleteBhw(${bhw.bhwId})"><i class="fa-solid fa-trash"></i>Delete</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;
  container.appendChild(table);
}

async function editBhw(bhwId) {
  try {
    const res = await fetch(`http://localhost:5236/api/bhw/${bhwId}`);
    if (!res.ok) {
      alert("Failed to fetch BHW details");
      return;
    }

    const bhw = await res.json();

    const formattedBirthday = bhw.birthday
      ? new Date(bhw.birthday).toISOString().split("T")[0]
      : "";

    // ✅ Use showFormModal with properly formatted data
    showFormModal("Edit BHW", { 
      ...bhw, 
      birthday: formattedBirthday,
      yearsOfService: bhw.yearsOfService || bhw.years // Handle both field names
    }, async (updatedBhw) => {
      try {
        const updateRes = await fetch(`http://localhost:5236/api/bhw/${bhwId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Firstname: updatedBhw.firstname,
            Middlename: updatedBhw.middlename,
            Surname: updatedBhw.surname,
            Age: parseInt(updatedBhw.age),
            Birthday: updatedBhw.birthday,
            YearsOfService: parseInt(updatedBhw.years),
            Address: updatedBhw.address,
            Contact: updatedBhw.contact,
            Email: updatedBhw.email,
            Password: updatedBhw.password,
            Status: bhw.status // ✅ Keep existing status
          })
        });

        if (updateRes.ok) {
          // ✅ Close modal properly
          const modal = document.getElementById("modal");
          if (modal) modal.classList.remove("show");
          
          alert("✅ Updated successfully");
          
          // ✅ Refresh the list
          await renderBhwList();
          await loadAllBhw();
          await renderStats();
        } else {
          const err = await updateRes.json();
          alert(err.message || "Update failed");
        }
      } catch (err) {
        console.error("Error updating BHW:", err);
        alert("⚠️ Error updating BHW");
      }
    });

  } catch (err) {
    console.error("Error fetching BHW:", err);
    alert("⚠️ Error loading BHW details");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  renderBhwList(); // ensures BHWs load with edit/delete buttons
});


/*document.addEventListener("DOMContentLoaded", () => {
  renderBhwList();
});
*/

// ✅ Get logged-in admin email (you should store this after login)
// ✅ Get logged-in admin email (store this after login)
const loggedAdminEmail = localStorage.getItem("loggedAdminEmail");



// === OPEN EDIT PROFILE MODAL ===
function openEditProfileModal() {
  if (!adminUser) return alert("⚠️ Profile not loaded yet!");

  document.getElementById("editFirstname").value = adminUser.firstname || "";
  document.getElementById("editMiddlename").value = adminUser.middlename || "";
  document.getElementById("editSurname").value = adminUser.surname || "";
  document.getElementById("editAge").value = adminUser.age || "";
  document.getElementById("editBirthday").value = adminUser.birthday?.split("T")[0] || "";
  document.getElementById("editEmail").value = adminUser.email || "";
  document.getElementById("editContact").value = adminUser.contact || "";
  document.getElementById("editAddress").value = adminUser.address || "";
  document.getElementById("editYears").value = adminUser.years || "";

  // Use CSS class to show modal (CSS uses .modal.show { display:flex !important })
  const editModal = document.getElementById("editProfileModal");
  if (editModal) editModal.classList.add("show");
}

function closeEditProfileModal() {
  const editModal = document.getElementById("editProfileModal");
  if (editModal) editModal.classList.remove("show");
}

// === SAVE CHANGES ===
document.getElementById("editProfileForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const birthdayInput = document.getElementById("editBirthday").value;
  const birthdayDate = birthdayInput ? birthdayInput.split("T")[0] : "";

  const updatedAdmin = {
    firstname: document.getElementById("editFirstname").value,
    middlename: document.getElementById("editMiddlename").value,
    surname: document.getElementById("editSurname").value,
    age: parseInt(document.getElementById("editAge").value) || 0,
    birthday: birthdayDate,
    email: document.getElementById("editEmail").value,
    contact: document.getElementById("editContact").value,
    address: document.getElementById("editAddress").value,
    years: parseInt(document.getElementById("editYears").value) || 0,
  };

  console.log("📤 Sending birthday as:", birthdayDate);

  try {
    const res = await fetch(`http://localhost:5236/api/admin/${adminUser.adminId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedAdmin),
    });

    if (res.ok) {
      alert("✅ Profile updated successfully!");
      closeEditProfileModal();
      await loadAdminProfile();
    } else {
      const err = await res.json();
      alert("❌ Update failed: " + (err.message || "Unknown error"));
    }
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    alert("⚠️ Error updating profile");
  }
});






// === RENDER PENDING LIST (Dashboard) ===
function renderPendingList() {
  const list = document.getElementById("pendingList");
  
  if (!list) {
    console.warn("⚠️ pendingList element not found - skipping render");
    return; // Exit gracefully if element doesn't exist
  }
  
  list.innerHTML = "";

  bhws.forEach((bhw, i) => {
    if (bhw.status === "pending") {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.marginBottom = "8px";

      li.innerHTML = `
        <span>${bhw.firstname} ${bhw.middlename} ${bhw.surname} (${bhw.email})</span>
        <div>
         <button onclick="approveBHW(${bhw.bhwId})" class="btn-approve">Approve</button>
          <button onclick="rejectBHW(${bhw.bhwId})" class="btn-reject">Reject</button>
        </div>
      `;
      list.appendChild(li);
    }
  });
}


// === RENDER APPROVED LIST (Dashboard) ===
function renderApprovedList() {
  const list = document.getElementById("approvedList");
  
  if (!list) {
    console.warn("⚠️ approvedList element not found - skipping render");
    return;
  }
  
  list.innerHTML = "";

  bhws.filter(b => b.status === "approved").forEach(bhw => {
    const fullName = `${bhw.firstname} ${bhw.middlename} ${bhw.surname}`;
    const li = document.createElement("li");
    li.textContent = `${fullName} (${bhw.email})`;
    list.appendChild(li);
  });
}

// === RENDER STATS (Dashboard) ===
async function renderStats() {
  try {
    const [approvedRes, pendingRes, rejectedRes] = await Promise.all([
      fetch("http://localhost:5236/api/bhw/approved"),
      fetch("http://localhost:5236/api/bhw/pending"),
      fetch("http://localhost:5236/api/bhw/rejected")
    ]);

    const approved = await approvedRes.json();
    const pending = await pendingRes.json();
    const rejected = await rejectedRes.json();

    // Update counts
    const approvedCount = document.getElementById("approvedCount");
    const pendingCount = document.getElementById("pendingCount");
    const rejectedCount = document.getElementById("rejectedCount");

    if (approvedCount) approvedCount.textContent = approved.length;
    if (pendingCount) pendingCount.textContent = pending.length;
    if (rejectedCount) rejectedCount.textContent = rejected.length;

  } catch (err) {
    console.error("❌ Error loading stats:", err);
  }
}

// === CONFIRM MODAL ===
function showConfirm(message, onYes) {
  const modal = document.getElementById("modal");
  const body = document.getElementById("modalBody");

  body.innerHTML = `
    <h3 class="modal-title">${message}</h3>
    <div class="modal-actions">
      <button id="confirmYes" class="btn-primary">Yes</button>
      <button id="confirmNo" class="btn-no">Cancel</button>
    </div>
  `;

  modal.classList.add("show");

  document.getElementById("confirmYes").onclick = () => {
    modal.classList.remove("show");
    setTimeout(() => onYes(), 300);
  };

  document.getElementById("confirmNo").onclick = () => modal.classList.remove("show");
  document.getElementById("modalClose").onclick = () => modal.classList.remove("show");
}


// === FORM MODAL FOR ADD/EDIT BHW ===
function showFormModal(title, existingData = null, onSave) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");

  const isEditMode = existingData !== null;

  modalBody.innerHTML = `
    <div class="modern-modal-header">
      <h2>${title}</h2>
    </div>
    
    <form id="bhwForm" class="modern-bhw-form">
      <div class="form-row">
        <div class="form-group">
          <label for="bhwSurname">Surname <span class="required">*</span></label>
          <input type="text" id="bhwSurname" required value="${existingData?.surname || ''}">
        </div>
        
        <div class="form-group">
          <label for="bhwFirstname">First Name <span class="required">*</span></label>
          <input type="text" id="bhwFirstname" required value="${existingData?.firstname || ''}">
        </div>
      </div>

      <div class="form-group">
        <label for="bhwMiddlename">Middle Name (Optional)</label>
        <input type="text" id="bhwMiddlename" value="${existingData?.middlename || ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="bhwAge">Age <span class="required">*</span></label>
          <input type="number" id="bhwAge" required min="18" max="100" value="${existingData?.age || ''}">
        </div>
        
        <div class="form-group">
          <label for="bhwBirthday">Birthday <span class="required">*</span></label>
          <input type="date" id="bhwBirthday" required value="${existingData?.birthday || ''}">
        </div>
        
        <div class="form-group">
          <label for="bhwYears">Years of Service <span class="required">*</span></label>
          <input type="number" id="bhwYears" required min="0" value="${existingData?.yearsOfService || existingData?.years || ''}">
        </div>
      </div>

      <div class="form-group">
        <label for="bhwAddress">Address <span class="required">*</span></label>
        <input type="text" id="bhwAddress" required value="${existingData?.address || ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="bhwContact">Contact Number <span class="required">*</span></label>
          <input type="tel" id="bhwContact" required placeholder="09XXXXXXXXX" value="${existingData?.contact || ''}">
        </div>
        
        <div class="form-group">
          <label for="bhwEmail">Email <span class="required">*</span></label>
          <input type="email" id="bhwEmail" required value="${existingData?.email || ''}">
        </div>
      </div>

      <div class="password-section">
        <div class="section-title">
          <i class="fas fa-lock"></i>
          <span>${isEditMode ? 'Change Password (Optional)' : 'Set Password'}</span>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="bhwPassword">Password ${isEditMode ? '' : '<span class="required">*</span>'}</label>
            <div class="password-input-wrapper">
              <input 
                type="password" 
                id="bhwPassword" 
                ${isEditMode ? '' : 'required'}
                minlength="6"
                placeholder="${isEditMode ? 'Leave blank to keep current' : 'Min. 6 characters'}"
              >
              <i class="fas fa-eye toggle-password" data-target="bhwPassword"></i>
            </div>
          </div>
          
          <div class="form-group">
            <label for="bhwConfirmPassword">Confirm Password ${isEditMode ? '' : '<span class="required">*</span>'}</label>
            <div class="password-input-wrapper">
              <input 
                type="password" 
                id="bhwConfirmPassword" 
                ${isEditMode ? '' : 'required'}
                placeholder="Re-enter password"
              >
              <i class="fas fa-eye toggle-password" data-target="bhwConfirmPassword"></i>
            </div>
          </div>
        </div>
        
        <small id="passwordNote" class="password-hint">
          <i class="fas fa-info-circle"></i> Password must be at least 6 characters
        </small>
      </div>

      <div class="modal-actions-modern">
        <button type="button" class="btn-cancel-modern" id="cancelModal">
          <i class="fas fa-times"></i> Cancel
        </button>
        <button type="submit" class="btn-save-modern">
          <i class="fas fa-${isEditMode ? 'check' : 'plus'}"></i> ${isEditMode ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  `;

  // Show modal
  // Use the CSS `.show` class so the modal becomes visible (CSS uses .modal.show { display:flex !important })
  modal.classList.add("show");
  
  // Close handlers
  modalClose.onclick = () => modal.classList.remove("show");
  document.getElementById("cancelModal").onclick = () => modal.classList.remove("show");

  const form = document.getElementById("bhwForm");
  const passwordInput = document.getElementById("bhwPassword");
  const confirmInput = document.getElementById("bhwConfirmPassword");

  // Toggle show/hide password
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const targetId = icon.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const isHidden = input.type === "password";

      input.type = isHidden ? "text" : "password";
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    });
  });

  // Form submit handler
  form.onsubmit = async (e) => {
    e.preventDefault();

    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    // Validate password if provided
    if (password) {
      if (password.length < 6) {
        alert("Password must be at least 6 characters!");
        passwordInput.focus();
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        confirmInput.focus();
        return;
      }
    } else if (!isEditMode) {
      alert("Password is required!");
      passwordInput.focus();
      return;
    }

    const bhwData = {
      surname: document.getElementById("bhwSurname").value.trim(),
      firstname: document.getElementById("bhwFirstname").value.trim(),
      middlename: document.getElementById("bhwMiddlename").value.trim() || null,
      age: document.getElementById("bhwAge").value,
      birthday: document.getElementById("bhwBirthday").value,
      years: document.getElementById("bhwYears").value,
      address: document.getElementById("bhwAddress").value.trim(),
      contact: document.getElementById("bhwContact").value.trim(),
      email: document.getElementById("bhwEmail").value.trim()
    };

    // Include password if provided
    if (password) {
      bhwData.password = password;
    } else if (existingData?.password) {
      bhwData.password = existingData.password;
    }

    onSave(bhwData);
  };
}


function togglePassword(fieldId, icon) {
  const input = document.getElementById(fieldId);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}
// 🔁 Auto-refresh dashboard after add/delete
async function refreshDashboard() {
  try {
    await loadBHWs();       // refresh approved + pending lists
    await renderStats();    // refresh dashboard counters
  } catch (err) {
    console.error("❌ Dashboard refresh failed:", err);
  }
}



// === ACTIONS ===
function addBhw() {
    showFormModal("Add New BHW", null, async (newBhw) => {
        try {
            const payload = {
                Surname: newBhw.surname,
                Firstname: newBhw.firstname,
                Middlename: newBhw.middlename,
                Age: parseInt(newBhw.age),
                Birthday: newBhw.birthday,
                YearsOfService: parseInt(newBhw.years),
                Address: newBhw.address,
                Contact: newBhw.contact,
                Email: newBhw.email,
                Password: newBhw.password
            };

            const response = await fetch("http://localhost:5236/api/admin/add-bhw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${response.status}`);
            }

            const data = await response.json().catch(() => ({}));

            // Close modal
            const modal = document.getElementById("modal");
            if (modal) modal.classList.remove("show");
      setTimeout(async () => {
  alert("✅ " + (data.message || "BHW successfully added."));
  await renderBhwList();
  await refreshDashboard();  // 🔁 update dashboard immediately
}, 300);


        } catch (error) {
            console.error("Error adding BHW:", error);
            alert("⚠️ Cannot connect to backend. Make sure the server is running.");
        }
    });

    
}






// === SEARCH LISTENERS ===
document.getElementById("workerSearch").addEventListener("input", renderBhwList);



async function deleteBhw(bhwId) {
  const confirmDelete = confirm("Are you sure you want to delete this BHW?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`http://localhost:5236/api/bhw/${bhwId}`, { method: "DELETE" });
    const data = await res.json();

   if (res.ok) {
  alert(data.message || "BHW deleted successfully.");
  await renderBhwList();     // refresh worker list
  await refreshDashboard();  // 🔁 refresh dashboard immediately
}
 else {
      alert(data.message || "❌ Failed to delete BHW.");
    }
  } catch (err) {
    console.error("Error deleting BHW:", err);
    alert("⚠️ Error deleting BHW");
  }
}



let charts = {};

async function initCharts() {
  try {
    const res = await fetch("http://localhost:5236/api/admin/chart-data");
    if (!res.ok) throw new Error("Failed to fetch chart data");
    const data = await res.json();

    const labels = data.labels || [];
    const values = data.values || [];

    if (labels.length === 0) {
      console.warn("⚠️ No valid illness data found.");
      return;
    }

    // ✅ Destroy old charts
    Object.values(charts).forEach(ch => ch.destroy());
    charts = {};

    // ✅ Common chart options
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1800,
        easing: "easeInOutQuart"
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#222",
            font: { size: 13, weight: "bold" },
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        title: {
          display: true,
          text: "Common Illnesses Among BRGY SAN FRANCISCO Residents",
          color: "#1e293b",
          font: { size: 20, weight: "bold", family: "Poppins" },
          padding: { top: 10, bottom: 25 }
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleFont: { size: 15, weight: "bold", family: "Poppins" },
          bodyFont: { size: 13, family: "Poppins" },
          cornerRadius: 10,
          padding: 12
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(180,180,180,0.15)" },
          ticks: { color: "#374151", font: { size: 13 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#374151", font: { size: 13 } }
        }
      }
    };

    // ✅ Chart definitions (Dashboard + Profile + Status)
    const chartList = [
      { id: "barChart", type: "bar", colors: ["#4e4bf3ff", "#38f9d7"] },
      { id: "areaChart", type: "line", colors: ["#16f7a1ff", "#047deeff"] },
      { id: "barChartProfile", type: "bar", colors: ["#4e4bf3ff", "#38f9d7"] },
      { id: "areaChartProfile", type: "line", colors: ["#16f7a1ff", "#047deeff"] },
      { id: "barChartStatus", type: "bar", colors: ["#4e4bf3ff", "#38f9d7"] },
      { id: "areaChartStatus", type: "line", colors: ["#16f7a1ff", "#047deeff"] }
    ];

    // ✅ Build each chart
    chartList.forEach(({ id, type, colors }) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);

      charts[id] = new Chart(ctx, {
        type,
        data: {
          labels,
          datasets: [{
            label: "Cases",
            data: values,
            backgroundColor: gradient,
            borderColor: colors[1],
            borderWidth: 3,
            pointBackgroundColor: "#fff",
            pointBorderColor: colors[1],
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBorderWidth: 2,
            fill: true,
            tension: 0.4,
            hoverBackgroundColor: colors[1],
            hoverBorderColor: "#1e293b"
          }]
        },
        options: {
          ...baseOptions,
          elements: {
            bar: {
              borderRadius: 10,
              borderSkipped: false,
              shadowOffsetX: 3,
              shadowOffsetY: 3,
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.15)"
            },
            line: {
              borderJoinStyle: "round",
              borderCapStyle: "round"
            }
          }
        }
      });
    });

    console.log("✨ Beautiful charts rendered successfully!");
  } catch (err) {
    console.error("❌ Error initializing charts:", err);
  }
}


// Reload every 30 seconds automatically
setInterval(initCharts, 30000);

// Or call manually after resident add/update/delete
async function onResidentAdded() {
  await initCharts();
}



window.onload = async function () {
  await loadAdminProfile();
  
  // Restore saved view preference from localStorage
  const savedBhwViewMode = localStorage.getItem("bhwViewMode");
  if (savedBhwViewMode) {
    bhwViewMode = savedBhwViewMode;
  }
  
  await loadAllBhw();   // ✅ load your BHW data
  renderBhwList();      // ✅ render with saved view mode
  showSection("dashboard");
};

// === IMPORT & EXPORT (APPEND + EXCEL SUPPORT) ===

// === TRUE EXCEL EXPORT (.xlsx) ===
function exportBhw() {
  // Filter only APPROVED BHWs
  const approvedBhws = bhws.filter(bhw => bhw.status.toLowerCase() === 'approved');

  if (approvedBhws.length === 0) {
    alert("⚠️ No approved BHWs to export.");
    return;
  }

  // Prepare worksheet data
  const headers = [
    "Surname", "First Name", "Middle Name", "Age", "Birthday",
    "Years", "Address", "Contact", "Email", "Password", "Status"
  ];

  const rows = approvedBhws.map(bhw => [
    bhw.surname, bhw.firstname, bhw.middlename, bhw.age, bhw.birthday,
    bhw.years, bhw.address, bhw.contact, bhw.email, bhw.password, bhw.status
  ]);

  const worksheetData = [headers, ...rows];

  // Create worksheet and workbook
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Approved_BHW_List");

  // Generate Excel file and trigger download
  const filename = `Approved_BHW_List_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, filename);

  alert("✅ Exported " + approvedBhws.length + " approved BHWs successfully as " + filename);
}

// ✅ PENDING MODAL
function openPendingModal() {
    loadPendingModal();
    const modal = document.getElementById("pendingModal");
  // Use the CSS-controlled `.show` class so !important rules in CSS are respected
  modal.classList.add("show");
}

function closePendingModal() {
    const modal = document.getElementById("pendingModal");
  modal.classList.remove("show");
}

// ✅ REJECTED MODAL
function openRejectedModal() {
    loadRejectedModal();
    const modal = document.getElementById("rejectedModal");
  modal.classList.add("show");
}

function closeRejectedModal() {
    const modal = document.getElementById("rejectedModal");
  modal.classList.remove("show");
}


function closeApprovedModal() {
    const modal = document.getElementById("approvedModal");
  modal.classList.remove("show");
}

async function loadPendingModal() {
    try {
        const res = await fetch("http://localhost:5236/api/bhw/pending");
        if (!res.ok) throw new Error("Failed to load pending BHWs");

        const pending = await res.json();
        const contentDiv = document.getElementById("pendingModalContent");
        
        if (!contentDiv) {
            console.error("❌ pendingModalContent element not found!");
            return;
        }
        
        if (pending.length === 0) {
            contentDiv.innerHTML = '<p style="text-align:center; color:#999; padding:40px;"><i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 15px;"></i>No pending BHWs.</p>';
            return;
        }

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #ffa500 0%, #ffb84d 100%); color: white;">';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Name</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Email</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Contact</th>';
        html += '<th style="padding: 14px; text-align: center; border: 1px solid #ddd;">Actions</th>';
        html += '</tr></thead><tbody>';

        pending.forEach((bhw, idx) => {
            html += '<tr style="background: ' + (idx % 2 === 0 ? 'white' : '#f8f9fa') + '; border: 1px solid #eee;">';
            html += `<td style="padding: 12px; border: 1px solid #ddd;"><strong>${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}</strong></td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;">${bhw.email || "N/A"}</td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;">${bhw.contact || "N/A"}</td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                <button class="action-btn approve" onclick="approveBHW(${bhw.bhwId})" style="background: #00b894; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 12px;">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="action-btn reject" onclick="rejectBHW(${bhw.bhwId})" style="background: #ff6b6b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-times"></i> Reject
                </button>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        contentDiv.innerHTML = html;

    } catch (err) {
        console.error("❌ Error loading pending modal:", err);
    }
}

async function loadRejectedModal() {
    try {
        const res = await fetch("http://localhost:5236/api/bhw/rejected");
        if (!res.ok) throw new Error("Failed to load rejected BHWs");

        const rejected = await res.json();
        console.log("📋 Rejected BHWs loaded:", rejected);
        
        const contentDiv = document.getElementById("rejectedModalContent");
        
        if (!contentDiv) {
            console.error("❌ rejectedModalContent element not found!");
            return;
        }
        
        if (rejected.length === 0) {
            contentDiv.innerHTML = '<p style="text-align:center; color:#999; padding:40px;"><i class="fas fa-ban" style="font-size: 48px; display: block; margin-bottom: 15px;"></i>No rejected BHWs.</p>';
            return;
        }

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: white;">';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Name</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Email</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Contact</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Status</th>';
        html += '</tr></thead><tbody>';

        rejected.forEach((bhw, idx) => {
            html += '<tr style="background: ' + (idx % 2 === 0 ? 'white' : '#f8f9fa') + '; border: 1px solid #eee;">';
            html += `<td style="padding: 12px; border: 1px solid #ddd;"><strong>${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}</strong></td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;">${bhw.email || "N/A"}</td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;">${bhw.contact || "N/A"}</td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;"><span style="background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Rejected</span></td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        contentDiv.innerHTML = html;

        console.log("✅ Rejected modal populated with", rejected.length, "BHWs");

    } catch (err) {
        console.error("❌ Error loading rejected modal:", err);
        alert("Failed to load rejected BHWs");
    }
}



async function loadApprovedModal() {
    try {
        const res = await fetch("http://localhost:5236/api/bhw/approved");
        if (!res.ok) throw new Error("Failed to load approved BHWs");

        const approved = await res.json();
        console.log("📋 Approved BHWs loaded:", approved);
        
        const contentDiv = document.getElementById("approvedModalContent");
        
        if (!contentDiv) {
            console.error("❌ approvedModalContent element not found!");
            return;
        }
        
        if (approved.length === 0) {
            contentDiv.innerHTML = '<p style="text-align:center; color:#999; padding:40px;"><i class="fas fa-check-double" style="font-size: 48px; display: block; margin-bottom: 15px;"></i>No approved BHWs.</p>';
            return;
        }

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: linear-gradient(135deg, #00b894 0%, #0066cc 100%); color: white;">';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Name</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Email</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Contact</th>';
        html += '<th style="padding: 14px; text-align: left; border: 1px solid #ddd;">Status</th>';
        html += '</tr></thead><tbody>';

        approved.forEach((bhw, idx) => {
            html += '<tr style="background: ' + (idx % 2 === 0 ? 'white' : '#f8f9fa') + '; border: 1px solid #eee;">';
            html += `<td style="padding: 12px; border: 1px solid #ddd;"><strong>${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}</strong></td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;">${bhw.email || "N/A"}</td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;">${bhw.contact || "N/A"}</td>`;
            html += `<td style="padding: 12px; border: 1px solid #ddd;"><span style="background: #00b894; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Approved</span></td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        contentDiv.innerHTML = html;

        console.log("✅ Approved modal populated with", approved.length, "BHWs");

    } catch (err) {
        console.error("❌ Error loading approved modal:", err);
    }
}





// ✅ IMPORT BHW (Excel / CSV / JSON) - WITH AUTO-APPROVE
async function importBhw(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function (e) {
    let importedData = [];

    try {
      if (file.name.endsWith(".json")) {
        importedData = JSON.parse(e.target.result);
      } else {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const firstSheet = workbook.SheetNames[0];
        importedData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
      }

      if (!importedData || importedData.length === 0) {
        alert("No data found in imported file.");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // ✅ SAVE EACH BHW
      for (const bhwData of importedData) {
        try {
          const bhwObj = {
            Surname: bhwData.Surname || bhwData.surname || "",
            Firstname: bhwData.Firstname || bhwData.firstname || "",
            Middlename: bhwData.Middlename || bhwData.middlename || "",
            Age: parseInt(bhwData.Age || bhwData.age) || 0,
            Birthday: bhwData.Birthday || bhwData.birthday 
              ? new Date(bhwData.Birthday || bhwData.birthday).toISOString() 
              : null,
            YearsOfService: parseInt(bhwData.YearsOfService || bhwData.years || 0),
            Address: bhwData.Address || bhwData.address || "",
            Contact: bhwData.Contact || bhwData.contact || "",
            Email: (bhwData.Email || bhwData.email || "").trim(),
            Password: (bhwData.Password || bhwData.password || "12345").trim(),
            Status: "Approved" // ✅ Set status to approved
          };

          // ✅ USE THE ADMIN ENDPOINT (NOT /api/bhw/add)
          const res = await fetch("http://localhost:5236/api/admin/add-bhw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bhwObj)
          });

          if (res.ok) {
            successCount++;
            console.log(`✅ Added & Approved: ${bhwObj.Firstname} ${bhwObj.Surname}`);
          } else {
            failCount++;
            const errData = await res.json().catch(() => ({}));
            console.warn(`⚠️ Failed to save BHW: ${bhwObj.Firstname} ${bhwObj.Surname} - ${errData.message}`);
          }

        } catch (err) {
          failCount++;
          console.error("❌ Error saving BHW:", err);
        }
      }

      // ✅ SUMMARY
      alert(`✅ BHW Import completed! ${successCount} saved & approved, ${failCount} failed.`);

      // 🔄 Refresh UI lists
      await loadAllBhw();
      renderBhwList();
      renderApprovedList();
      renderPendingList();
      renderStats();

      // ✅ OPEN APPROVED MODAL
      setTimeout(() => {
        console.log("🔍 Opening approved modal after import...");
        openApprovedModal(); // ✅ This now properly loads and opens the modal
      }, 500);

    } catch (err) {
      console.error("❌ Error reading file:", err);
      alert("❌ Error reading file! Please check format.");
    }
  };

  // Read file format properly
  if (file.name.endsWith(".json")) {
    reader.readAsText(file);
  } else {
    reader.readAsBinaryString(file);
  }
}

// Helper: Convert any input to consistent BHW object
function formatBhw(data) {
  return {
    surname: data.Surname || data.surname || "",
    firstname: data["First Name"] || data.firstname || "",
    middlename: data["Middle Name"] || data.middlename || "",
    age: parseInt(data.Age || data.age) || 0,
    birthday: data.Birthday || data.birthday || "",
    years: parseInt(data.Years || data.years) || 0,
    address: data.Address || data.address || "",
    contact: data.Contact || data.contact || "",
    email: data.Email || data.email || "",
    password: data.Password || data.password || "12345",
    status: data.Status || data.status || "pending"
  };
}

let adminUser = null;

async function loadAdminProfile() {
  try {
    const res = await fetch("http://localhost:5236/api/admin");
    if (!res.ok) throw new Error("Failed to load admin profile");

    const data = await res.json();
    console.log("✅ API raw response:", res);
    console.log("✅ Parsed admin:", data);

    // Handle both single object or array
    const admin = Array.isArray(data) ? data[0] : data;

    if (!admin || typeof admin !== "object") {
      throw new Error("Invalid admin data format");
    }

    // ✅ Store globally so other functions can use it
    adminUser = admin;
    
    // ✅ Store adminId in localStorage for certifications
    if (admin.adminId) {
      localStorage.setItem("adminId", admin.adminId);
    }

    // Build name and initials
    const fullName = `${admin.firstname || ""} ${admin.surname || ""}`.trim();
    const initials =
      (admin.firstname ? admin.firstname[0] : "") +
      (admin.surname ? admin.surname[0] : "");

    // Update top bar (safe DOM checks)
    const pName = document.getElementById("profileName");
    const pInitials = document.getElementById("profileInitials");
    if (pName) pName.textContent = fullName;
    if (pInitials) pInitials.textContent = initials.toUpperCase();

    // ✅ Display admin name below welcome message
    const welcomeName = document.getElementById("adminWelcomeName");
    if (welcomeName) welcomeName.textContent = fullName;

    // ✅ Safely fill the profile section
    const safeSet = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (value !== null && value !== undefined && value !== "") ? value : "—";
    };

    safeSet("adminName", `${admin.firstname || ""} ${admin.middlename || ""} ${admin.surname || ""}`.trim());
    safeSet("adminAge", admin.age);
    
    // Format birthday to YYYY-MM-DD only
    let birthdayDisplay = "";
    if (admin.birthday) {
      // Extract just the date part (YYYY-MM-DD)
      birthdayDisplay = admin.birthday.split("T")[0];
      console.log("📅 Birthday raw:", admin.birthday, "→ Formatted:", birthdayDisplay);
    }
    safeSet("adminBirthday", birthdayDisplay);
    
    safeSet("adminEmail", admin.email);
    safeSet("adminContact", admin.contact);
    safeSet("adminAddress", admin.address);
    safeSet("adminYears", admin.years);

    // ✅ Profile image (safe path handling)
    const img = document.getElementById("profileImage");
    if (img && admin.photo) {
      img.src = admin.photo.startsWith("http")
        ? admin.photo
        : `http://localhost:5236/${admin.photo}`;
    }


  } catch (err) {
    console.error("❌ loadAdminProfile error:", err);
  }
}



async function loadBHWs() {
  const approvedRes = await fetch("http://localhost:5236/api/bhw/approved");
  const pendingRes = await fetch("http://localhost:5236/api/bhw/pending");
  const approved = await approvedRes.json();
  const pending = await pendingRes.json();

  const approvedList = document.getElementById("approvedList");
  const pendingList = document.getElementById("pendingList");
  const approvedCount = document.getElementById("approvedCount");
  const pendingCount = document.getElementById("pendingCount");

  if (approvedList) approvedList.innerHTML = approved.map(b => `
    <li>
      <img src="${b.photo ? 'http://localhost:5236/' + b.photo : 'logo/logo.png'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:8px;">
      ${b.firstname} ${b.surname} (${b.email})
    </li>
  `).join("");

  if (pendingList) pendingList.innerHTML = pending.map(b => `
    <li>
      <img src="${b.photo ? 'http://localhost:5236/' + b.photo : 'logo/logo.png'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:8px;">
      ${b.firstname} ${b.surname} (${b.email})
      <button onclick="approveBHW(${b.bhwId})">Approve</button>
      <button onclick="rejectBHW(${b.bhwId})">Reject</button>
    </li>
  `).join("");

  if (approvedCount) approvedCount.textContent = approved.length;
  if (pendingCount) pendingCount.textContent = pending.length;
}



// Upload admin profile picture
document.getElementById("uploadProfile")?.addEventListener("change", async (e) => {
  e.preventDefault();
  e.stopPropagation(); // prevent dashboard redirect

  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append("file", file);

  try {
    const res = await fetch(`http://localhost:5236/api/upload/admin/${adminUser.adminId}`, {
      method: "POST",
      body: fd
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById("profileImage").src = `http://localhost:5236/${data.photoPath}`;
      alert("✅ Profile updated successfully!");
    } else {
      alert(data.message || "Upload failed");
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Upload failed due to network error");
  }
});

document.getElementById("workerSearch").addEventListener("input", renderBhwList);



// connect logout buttons if they are plain buttons with onclick already set, fensure they call logout()
// Example: <button onclick="logout()">Logout</button>

window.addEventListener("load", async () => {
  await loadAdminProfile();
  await loadBHWs();
  
  
});


function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear(); // remove saved BHW info
    window.location.href = "Frontpage.html"; // redirect to login page
  }
}


 const API_BASE = "http://localhost:5236/api/bhw";
        const AUTH_BASE = "http://localhost:5236/api/auth";

        // ✅ Single DOMContentLoaded - walang duplicate
        document.addEventListener("DOMContentLoaded", async () => {
            const userRole = localStorage.getItem("userRole");
            const userEmail = localStorage.getItem("userEmail");
            const userFirstname = localStorage.getItem("userFirstname");

            if (!userRole || !userEmail) {
                alert("Please login first!");
                window.location.href = "Frontpage.html";
                return;
            }

            // Update UI
            document.getElementById("profileName").textContent = userFirstname;
            document.getElementById("profileInitials").textContent = userFirstname[0].toUpperCase();
            document.getElementById("profileNameDisplay").textContent = userFirstname;
            document.getElementById("profileRole").textContent = userRole;

            // Load BHW lists
            await loadBhwLists();

         
        });

     // ✅ Load approved & pending BHWs
async function loadBhwLists() {
    try {
        const [approvedRes, pendingRes, rejectedRes] = await Promise.all([
            fetch(`${API_BASE}/approved`),
            fetch(`${API_BASE}/pending`),
            fetch(`${API_BASE}/rejected`)
        ]);

        const approved = await approvedRes.json();
        const pending = await pendingRes.json();
        const rejected = await rejectedRes.json();

        // Update counts
        document.getElementById("approvedCount").textContent = approved.length;
        document.getElementById("pendingCount").textContent = pending.length;
        document.getElementById("rejectedCount").textContent = rejected.length;

        // Update notification badge
        const badge = document.querySelector('.notification .badge');
        if (badge) {
            badge.textContent = pending.length;
            badge.style.display = pending.length > 0 ? 'inline-block' : 'none';
        }

        // Clear and populate lists
        const approvedList = document.getElementById("approvedModalList");
        const pendingList = document.getElementById("pendingModalList");
        const rejectedList = document.getElementById("rejectedModalList");

        if (approvedList) approvedList.innerHTML = "";
        if (pendingList) pendingList.innerHTML = "";
        if (rejectedList) rejectedList.innerHTML = "";

        // Render Approved
        if (approvedList) {
            approved.forEach(bhw => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <img src="${bhw.photo ? 'http://localhost:5236/' + bhw.photo : 'logo/logo.png'}"
                         style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:8px;">
                    <span>${bhw.firstname || ""} ${bhw.surname || ""} (${bhw.email || ""})</span>
                `;
                approvedList.appendChild(li);
            });
        }

        // Render Pending
        if (pendingList) {
            pending.forEach(bhw => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <img src="${bhw.photo ? 'http://localhost:5236/' + bhw.photo : 'logo/logo.png'}"
                         style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:8px;">
                    <span>${bhw.firstname || ""} ${bhw.surname || ""} (${bhw.email || ""})</span>
                    <button class="action-btn approve" onclick="approveBHW(${bhw.bhwId})">Approve</button>
                    <button class="action-btn reject" onclick="rejectBHW(${bhw.bhwId})">Reject</button>
                `;
                pendingList.appendChild(li);
            });
        }

        // Render Rejected
        if (rejectedList) {
            rejected.forEach(bhw => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <img src="${bhw.photo ? 'http://localhost:5236/' + bhw.photo : 'logo/logo.png'}"
                         style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:8px;">
                    <span>${bhw.firstname || ""} ${bhw.surname || ""} (${bhw.email || ""})</span>
                `;
                rejectedList.appendChild(li);
            });
        }

    } catch (err) {
        console.error("❌ Error loading BHW lists:", err);
    }
}

async function approveBHW(bhwId) {
  try {
    const res = await fetch(`http://localhost:5236/api/bhw/${bhwId}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(`Failed to approve: ${error.message || res.statusText}`);
      return;
    }

    const data = await res.json();
    alert(data.message || "✅ BHW approved!");
    
    closePendingModal();
    await loadAllBhw();
    await loadBhwLists();
    await renderStats(); // ← Add this to update counts
  } catch (err) {
    console.error("❌ Approve error:", err);
    alert("⚠️ Cannot connect to server.");
  }
}

async function rejectBHW(bhwId) {
  try {
    const res = await fetch(`http://localhost:5236/api/bhw/${bhwId}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(`Failed to reject: ${error.message || res.statusText}`);
      return;
    }

    const data = await res.json();
    alert(data.message || "❌ BHW rejected.");
    
    closePendingModal();
    await loadAllBhw();
    await loadBhwLists();
    await renderStats(); // ← Add this to update counts
  } catch (err) {
    console.error("❌ Reject error:", err);
    alert("⚠️ Cannot connect to server.");
  }
}


// ✅ Attach buttons
function attachActionButtons() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const id = btn.getAttribute('data-bhw-id');
            const action = btn.getAttribute('data-action');
            await updateStatus(id, action);
        });
    });
}

// ✅ Single updateStatus (no duplicates!)
async function updateStatus(id, action) {
    try {
        const res = await fetch(`${API_BASE}/${id}/${action}`, { method: "PUT" });
        const data = await res.json();

        alert(data.message || `BHW ${action}d successfully`);
        
        // Add notification based on action
        const bhw = bhws.find(b => b.id === id);
        const bhwName = bhw ? bhw.firstname + ' ' + bhw.surname : 'BHW';
        
        if (action === 'approve') {
            addNotification('BHW Approved ✓', `${bhwName} has been approved as a Barangay Health Worker`, 'approved');
        } else if (action === 'reject') {
            addNotification('BHW Rejected', `${bhwName}'s application has been rejected`, 'rejected');
        }
        
        await loadBhwLists();

    } catch (err) {
        console.error("❌ Error updating BHW:", err);
        alert("Failed to update status.");
    }
}



// ✅ NOTIFICATION SYSTEM
let notifications = [];

// Add notification to the dropdown
function addNotification(title, message, type = 'pending') {
    const notification = {
        id: Date.now(),
        title: title,
        message: message,
        type: type, // 'pending', 'approved', 'rejected'
        time: new Date()
    };
    
    notifications.unshift(notification); // Add to the beginning
    updateNotificationUI();
    
    // Auto-remove after 10 seconds if not viewed
    setTimeout(() => {
        removeNotification(notification.id);
    }, 10000);
}

// Remove specific notification
function removeNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    updateNotificationUI();
}

// Clear all notifications
function clearAllNotifications() {
    notifications = [];
    updateNotificationUI();
}

// Update the notification UI
function updateNotificationUI() {
    const badge = document.getElementById('notificationBadge');
    const notifList = document.getElementById('notificationList');
    
    // Update badge count
    badge.textContent = notifications.length;
    badge.style.display = notifications.length > 0 ? 'block' : 'none';
    
    // Update notification list
    if (notifications.length === 0) {
        notifList.innerHTML = '<div class="empty-notification">No notifications yet</div>';
        return;
    }
    
    notifList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.type}">
            <div class="notif-icon">
                ${notif.type === 'pending' ? '⏳' : notif.type === 'approved' ? '✓' : '✕'}
            </div>
            <div class="notif-content">
                <div class="notif-title">${notif.title}</div>
                <div class="notif-message">${notif.message}</div>
                <div class="notif-time">${getTimeAgo(notif.time)}</div>
            </div>
            <button style="background: none; border: none; cursor: pointer; color: #a0aec0;" 
                    onclick="removeNotification(${notif.id})">✕</button>
        </div>
    `).join('');
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return Math.floor(hours / 24) + 'd ago';
}

// Toggle notification dropdown
function toggleNotificationDropdown(event) {
    event.stopPropagation(); // Prevent event bubbling
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notificationDropdown');
    const notification = document.querySelector('.notification');
    
    // If click is outside the notification container, close the dropdown
    if (!notification.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// ✅ LOAD PENDING BHWs AS NOTIFICATIONS
async function loadPendingNotifications() {
    try {
        const res = await fetch("http://localhost:5236/api/bhw/pending");
        if (!res.ok) throw new Error("Failed to load pending BHWs");
        
        const pendingBhws = await res.json();
        console.log("✅ Pending BHWs:", pendingBhws);
        
        // Add each pending BHW as a notification
        pendingBhws.forEach(bhw => {
            addNotification(
                'New Registration',
                `${bhw.firstname} ${bhw.surname} has registered and is pending approval`,
                'pending'
            );
        });
    } catch (err) {
        console.error("❌ Error loading pending notifications:", err);
    }
}

// ====== CERTIFICATIONS MANAGEMENT ======
async function loadAdminCertifications() {
    const adminId = localStorage.getItem("adminId") || (adminUser?.adminId) || "1";
    
    if (!adminId) {
        console.warn("⚠️ No admin ID found");
        const certGrid = document.getElementById("adminCertifications");
        if (certGrid) {
            certGrid.innerHTML = '<div class="empty-state-certs">No certifications added yet. Click "Add Certification" to get started!</div>';
        }
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5236/api/certifications/admin/${adminId}`);
        if (!response.ok) throw new Error("Failed to load certifications");
        
        const certifications = await response.json();
        displayAdminCertifications(certifications);
        console.log("✅ Admin certifications loaded:", certifications);
    } catch (err) {
        console.error("❌ Error loading admin certifications:", err);
        const certGrid = document.getElementById("adminCertifications");
        if (certGrid) {
            certGrid.innerHTML = '<div class="empty-state-certs">No certifications added yet. Click "Add Certification" to get started!</div>';
        }
    }
}

function displayAdminCertifications(certifications) {
    const certGrid = document.getElementById("adminCertifications");
    
    if (!certGrid) return;
    
    certGrid.innerHTML = "";
    
    if (!certifications || certifications.length === 0) {
        certGrid.innerHTML = '<div class="empty-state-certs">No certifications added yet. Click "Add Certification" to get started!</div>';
        return;
    }
    
    certifications.forEach((cert) => {
        const certCard = document.createElement("div");
        certCard.className = "cert-card";
        
        let icon = "fa-certificate";
        if (cert.title && cert.title.toLowerCase().includes("first aid")) icon = "fa-heart";
        if (cert.title && cert.title.toLowerCase().includes("cpr")) icon = "fa-heart-pulse";
        if (cert.title && cert.title.toLowerCase().includes("training")) icon = "fa-graduation-cap";
        
        const dateObj = new Date(cert.dateReceived);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        let contentHTML = `
            <h3 class="cert-card-title">
                <i class="fas ${icon}"></i>
                ${cert.title || "Untitled Certificate"}
            </h3>
        `;
        
        if (cert.organization) {
            contentHTML += `<div class="cert-card-meta"><span><i class="fas fa-building"></i> ${escapeHtml(cert.organization)}</span></div>`;
        }
        
        if (cert.dateReceived) {
            contentHTML += `<div class="cert-card-meta"><span><i class="fas fa-calendar"></i> Issued: ${formattedDate}</span></div>`;
        }
        
        if (cert.description) {
            contentHTML += `<p class="cert-card-description">${escapeHtml(cert.description)}</p>`;
        }
        
        if (cert.documentPath) {
            contentHTML += `<a href="${escapeHtml(cert.documentPath)}" target="_blank" class="cert-card-link"><i class="fas fa-file"></i> View Document</a>`;
        }
        
        if (cert.certificateLink) {
            contentHTML += `<a href="${escapeHtml(cert.certificateLink)}" target="_blank" class="cert-card-link"><i class="fas fa-link"></i> View Certificate</a>`;
        }
        
        contentHTML += `
            <div class="cert-card-actions">
                <button class="cert-delete-btn" onclick="deleteAdminCert(${cert.certificationId})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        certCard.innerHTML = contentHTML;
        certGrid.appendChild(certCard);
    });
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openAddCertModal() {
    const modal = document.getElementById("addCertModal");
    if (modal) modal.classList.add("show");
    const form = document.getElementById("certForm");
    if (form) form.reset();
}

function closeAddCertModal() {
    const modal = document.getElementById("addCertModal");
    if (modal) modal.classList.remove("show");
}

// ✅ Cert document preview function (matches BHW panel exactly)
function previewCertDocument() {
    const input = document.getElementById("certDocument");
    const preview = document.getElementById("certDocumentPreview");
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileName = file.name;
        
        // Determine file type icon
        let icon = "fa-file";
        if (file.type.includes("pdf")) icon = "fa-file-pdf";
        if (file.type.includes("image")) icon = "fa-image";
        if (file.type.includes("word")) icon = "fa-file-word";
        if (file.type.includes("excel") || file.type.includes("spreadsheet")) icon = "fa-file-excel";
        if (file.type.includes("powerpoint")) icon = "fa-file-powerpoint";
        
        preview.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <p>${fileName}</p>
            <small>${(file.size / 1024).toFixed(2)} KB</small>
        `;
    }
}

// ✅ Make document preview box clickable
document.addEventListener("DOMContentLoaded", function() {
    const preview = document.getElementById("certDocumentPreview");
    const input = document.getElementById("certDocument");
    
    if (preview && input) {
        preview.addEventListener("click", () => input.click());
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const certForm = document.getElementById("certForm");
    if (certForm) {
        certForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            e.stopPropagation();

            // ✅ Validation for required fields
            const dateReceived = document.getElementById("certDate").value;
            const certLink = document.getElementById("certLink").value.trim();
            const file = document.getElementById("certDocument").files[0];

            if (!dateReceived) {
                alert("⚠️ Please select the Date Received.");
                return;
            }

            if (!file && certLink === "") {
                alert("⚠️ Please upload a document OR provide a certificate link.");
                return;
            }

            const adminId = localStorage.getItem("adminId") || (adminUser?.adminId) || "1";
            if (!adminId) {
                alert("❌ Admin ID not found. Please log in again.");
                return;
            }

            const formData = new FormData();
            formData.append("adminId", adminId);
            formData.append("title", document.getElementById("certTitle").value);
            formData.append("organization", document.getElementById("certOrganization").value);
            formData.append("dateReceived", dateReceived);
            formData.append("description", document.getElementById("certDescription").value);
            formData.append("certificateLink", certLink);

            if (file) {
                formData.append("document", file);
            }

            try {
                const res = await fetch("http://localhost:5236/api/certifications/admin/add", {
                    method: "POST",
                    body: formData
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Failed to add certification");
                }

                const data = await res.json();
                alert("✅ Certification added successfully!");

                // Clear form and close modal
                certForm.reset();
                const preview = document.getElementById("certDocumentPreview");
                if (preview) {
                    preview.innerHTML = `
                        <i class="fa-solid fa-file-pdf"></i>
                        <p>Click to upload document</p>
                        <small>Supported: PDF, Word, Excel, PowerPoint</small>
                    `;
                }

                closeAddCertModal();

                // Reload certifications
                await loadAdminCertifications();
            } catch (err) {
                console.error("❌ Error adding certification:", err);
                alert("Failed to add certification: " + err.message);
            }
        });
    }
});

function deleteAdminCert(certificationId) {
    if (confirm("Are you sure you want to delete this certification?")) {
        deleteAdminCertFromBackend(certificationId);
    }
}

async function deleteAdminCertFromBackend(certificationId) {
    try {
        const res = await fetch(`http://localhost:5236/api/certifications/${certificationId}`, {
            method: "DELETE"
        });
        
        if (!res.ok) throw new Error("Failed to delete certification");
        
        const data = await res.json();
        alert(data.message || "Certification deleted successfully!");
        
        // Reload certifications
        const adminId = localStorage.getItem("adminId") || (adminUser?.adminId) || "1";
        await loadAdminCertifications();
    } catch (err) {
        console.error("❌ Error deleting certification:", err);
        alert("Failed to delete certification");
    }
}

// === INIT ===
renderBhwList();
renderApprovedList();
renderPendingList();
renderStats();
initCharts();
loadPendingNotifications();  // ✅ Load pending BHWs as notifications on page load
loadAdminCertifications();  // ✅ Load admin certifications when profile section is shown

// ===== BHW SEARCH EVENT LISTENER =====
document.addEventListener("DOMContentLoaded", function() {
  const workerSearchInput = document.getElementById("workerSearch");
  if (workerSearchInput) {
    workerSearchInput.addEventListener("input", () => renderBhwList());
  }
});
