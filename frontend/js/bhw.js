

// default residents acc
let residents = [];
const API_BASE = "http://localhost:5236/api/residents";

// ===== PAGINATION & FILTERING STATE =====
let currentFilter = "all"; // "all", "senior", "child", "pwd"
let currentPage = 1;
let itemsPerPage = 10;
let filteredResidents = [];

// Get filtered residents based on current filter
function getFilteredResidents() {
  let filtered = residents;
  
  if (currentFilter === "senior") {
    filtered = residents.filter(r => r.age >= 60);
  } else if (currentFilter === "child") {
    filtered = residents.filter(r => r.age <= 17);
  } else if (currentFilter === "pwd") {
    filtered = residents.filter(r => r.isPwd === true);
  }
  
  return filtered;
}

// Go to next page
function nextPage() {
  const total = getFilteredResidents().length;
  const totalPages = Math.ceil(total / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderResidents();
    updatePaginationUI();
  }
}

// Go to previous page
function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderResidents();
    updatePaginationUI();
  }
}

// Change items per page
function changeItemsPerPage(value) {
  itemsPerPage = parseInt(value);
  currentPage = 1; // Reset to first page
  renderResidents();
  updatePaginationUI();
}

// Filter residents by category
function filterResidents(category) {
  currentFilter = category;
  currentPage = 1; // Reset to first page
  
  // Update UI active state
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active"); 
  });
  const activeBtnId = {
    "all": "filterAll",
    "senior": "filterSenior",
    "child": "filterChild",
    "pwd": "filterPwd"
  }[category];
  
  if (document.getElementById(activeBtnId)) {
    document.getElementById(activeBtnId).classList.add("active");
  }
  
  renderResidents();
  updatePaginationUI();
}

// Load residents for logged-in BHW
async function loadResidents() {
  const bhwId = localStorage.getItem("bhwId");
  if (!bhwId) {
    console.error("No BHW ID found — please log in again.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5236/api/residents/bybhw/${bhwId}`);
    if (!res.ok) throw new Error("Failed to load residents.");
    residents = await res.json();

    // Render residents table/cards
    renderResidents();
    
    // ✅ Update dashboard stats
    updateDashboardStats();
    
    // ✅ Initialize charts after residents are loaded
    initCharts();
  } catch (err) {
    console.error("❌ Error loading residents:", err);
  }
}


// ✅ Call it once on load
window.addEventListener("load", async () => {
    // Restore saved view preference from localStorage
    const savedResidentsViewMode = localStorage.getItem("residentsViewMode");
    if (savedResidentsViewMode) {
        residentsViewMode = savedResidentsViewMode;
    }
    
    await loadResidents();
    renderResidents();  // ✅ render with saved view mode
});



// single editingIndex
let editingIndex = null;



// ---------- Modal toggle (the Add New Resident button calls this) ----------
function toggleResidentForm() {
  const modal = document.getElementById("residentModal");
  if (!modal) return;
  if (modal.classList.contains("hidden")) {
    openResidentModal(null);
  } else {
    closeResidentModal();
  }
}

// ---------- Open Resident Modal (Add or Edit) ----------
function openResidentModal(index = null) {
  const modal = document.getElementById("residentModal");
  const form = document.getElementById("residentForm");
  const titleEl = document.querySelector("#residentModal h2");
  if (!modal || !form) return;

  if (index !== null && residents[index]) {
    // ---- EDIT MODE ----
    editingIndex = index;
    const r = residents[index];

    // populate fields
    form.surname.value = r.surname || "";
    form.firstname.value = r.firstname || "";
    form.middlename.value = r.middlename || "";
    form.age.value = r.age || "";
    form.birthday.value = r.birthday
  ? new Date(r.birthday).toISOString().split("T")[0]
  : "";
    form.occupation.value = r.occupation || "";
    form.house.value = r.house || "";
    form.years.value = r.years || "";
    form.bloodType.value = r.bloodType || "";
    form.illness.value = r.illness || "";
    form.civilStatus.value = r.civilStatus || "";
    form.education.value = r.education || "";
    form.children.value = r.children || "";
    form.contact.value = r.contact || "";
    form.address.value = r.address || "";
    form.mapX.value = r.mapX || "";
    form.mapY.value = r.mapY || "";
    document.getElementById("isPwd").checked = r.isPwd || false;

    titleEl.innerText = "Edit Resident";
    form.querySelector(".save-btn").textContent = "Update Resident";
  } else {
    // ---- ADD MODE ----
    editingIndex = null;
    form.reset();
    form.mapX.value = "";
    form.mapY.value = "";
    document.getElementById("isPwd").checked = false;
    titleEl.innerText = "Add New Resident";
    form.querySelector(".save-btn").textContent = "Save Resident";
  }
    modal.classList.add("show");   // ✅ SHOW MODAL

  modal.classList.remove("hidden");
}

// ---------- Save or Update Resident (auto-refresh residents only) ----------
async function saveResident(event) {
  if (event) event.preventDefault();

  const form = document.getElementById("residentForm");
  const bhwId = parseInt(localStorage.getItem("bhwId"));

  if (!bhwId) {
    alert("No BHW ID found. Please login again.");
    window.location.href = "Frontpage.html";
    return;
  }

  const residentObj = {
    AddedByType: "BHW",
    AddedById: bhwId,
    AddedByBhwId: bhwId,
    Surname: form.surname.value.trim(),
    Firstname: form.firstname.value.trim(),
    Middlename: form.middlename.value.trim(),
    Age: parseInt(form.age.value) || 0,
    Birthday: form.birthday.value ? new Date(form.birthday.value).toISOString() : null,
    Occupation: form.occupation.value.trim(),
    House: form.house.value.trim(),
    Years: parseInt(form.years.value) || 0,
    BloodType: form.bloodType.value.trim(),
    Illness: form.illness.value.trim(),
    CivilStatus: form.civilStatus.value.trim(),
    Education: form.education.value.trim(),
    Children: parseInt(form.children.value) || 0,
    Contact: form.contact.value.trim(),
    Address: form.address.value.trim(),
    MapX: parseFloat(form.mapX.value) || 0,
    MapY: parseFloat(form.mapY.value) || 0,
    IsPwd: document.getElementById("isPwd").checked
  };

  const mapX = parseFloat(form.mapX.value);
  const mapY = parseFloat(form.mapY.value);

  if (!form.firstname.value.trim() || !form.surname.value.trim() || !form.address.value.trim()) {
    alert("⚠ Please complete all required fields.");
    return;
  }

  if (isNaN(mapX) || isNaN(mapY) || mapX === 0 || mapY === 0) {
    alert("⚠ Please select the resident's location on the map before saving.");
    return;
  }

  try {
    let res, data;

    if (editingIndex !== null && residents[editingIndex]) {
      // --- UPDATE ---
      const residentId = residents[editingIndex].residentId;
      res = await fetch(`http://localhost:5236/api/residents/${residentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(residentObj)
      });
      data = await res.json();
      alert(data.message || "Resident updated successfully!");
    } else {
      // --- ADD NEW ---
      res = await fetch("http://localhost:5236/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(residentObj)
      });
      data = await res.json();
      alert(data.message || "Resident added successfully!");
    }

    closeResidentModal();

    // ✅ Auto-refresh residents (no page reload)
    await refreshAllResidents();

  } catch (err) {
    console.error("❌ Error saving/updating resident:", err);
    alert("Failed to save/update resident.");
  }
}


async function refreshAllResidents() {
  try {
    // Re-fetch the logged-in BHW's residents
    await loadResidents();

    // Reset filter and pagination
    currentFilter = "all";
    currentPage = 1;
    searchQuery = "";
    
    // Update filter button UI
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById("filterAll").classList.add("active");
    
    // Clear search input
    const residentSearchEl = document.getElementById("residentSearch");
    if (residentSearchEl) residentSearchEl.value = "";

    // Also refresh the resident cards (dashboard list)
    if (typeof renderResidents === "function") {
      renderResidents();
    }

    // Refresh map markers
    renderMapResidents();
    
    // ✅ Rebuild charts automatically
    initCharts();

    console.log("✅ Residents refreshed without reloading the full page.");
  } catch (err) {
    console.error("❌ Error refreshing residents:", err);
  }
}


// ---------- Login Function ----------
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch("http://localhost:5236/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    const data = await response.json();

    // Save login info for later
    localStorage.setItem("loggedInEmail", data.email);
    localStorage.setItem("loggedInName", data.firstname + " " + data.surname);
    localStorage.setItem("loggedInId", data.bhwId);

    // Redirect to BHW profile
    window.location.href = "bhw-profile.html";
  } else {
    alert("Invalid login. Please try again.");
  }
}






// ---------- Load BHW Profile on page load ----------
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole");

  if (!role) {
    alert("Please login first!");
    window.location.href = "Frontpag.html";
    return;
  }

  if (role !== "BHW") {
    alert("Access denied!");
    window.location.href = "Frontpage.html";
    return;
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const bhwId = localStorage.getItem("bhwId");
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");

  try {
    // ✅ Fetch latest data for this BHW
    const response = await fetch(`http://localhost:5236/api/bhw/by-email/${email}`);

    if (!response.ok) throw new Error("Failed to load BHW profile");

    const bhw = await response.json();

    // ✅ Fill sidebar profile
    document.getElementById("profileName").innerText = `${bhw.firstname} ${bhw.surname}`;
    document.getElementById("profileInitials").innerText =
      `${bhw.firstname[0]}${bhw.surname[0]}`.toUpperCase();

    // ✅ Fill dashboard greeting
    document.getElementById("userGreeting").innerText = `${bhw.firstname} ${bhw.surname}`;

    // ✅ Fill detailed profile info
    document.getElementById("adminName").innerText = `${bhw.firstname} ${bhw.middlename || ""} ${bhw.surname}`;
    document.getElementById("adminAge").innerText = bhw.age || "N/A";
    document.getElementById("adminBirthday").innerText = bhw.birthday
      ? bhw.birthday.split("T")[0]
      : "N/A";
    document.getElementById("adminEmail").innerText = bhw.email || "N/A";
    document.getElementById("adminContact").innerText = bhw.contact || "N/A";
    document.getElementById("adminAddress").innerText = bhw.address || "N/A";
    document.getElementById("adminYears").innerText = bhw.yearsOfService || "0";

    // ✅ Optional: show role
    document.getElementById("profileRole").innerText = "Barangay Health Worker";

    // ✅ Optional: Load their residents list
    await loadResidentsFromBackend();
  } catch (err) {
    console.error("❌ Profile load error:", err);
    alert("Failed to load profile data.");
  }
});





function closeResidentModal() {
  const modal = document.getElementById("residentModal");
  const form = document.getElementById("residentForm");
  if (!modal || !form) return;
    modal.classList.remove("show");  // ✅ HIDE MODAL
  modal.classList.add("hidden");
  form.reset();
  editingIndex = null;
  // clear modal marker
  if (residentMarker && typeof residentMap !== 'undefined' && residentMap) {
    residentMap.removeLayer(residentMarker);
    residentMarker = null;
  }
  // reset save button text
  const saveBtn = form.querySelector(".save-btn");
  if (saveBtn) saveBtn.textContent = "Save Resident";
}

// ---------- Resident Map Picker (modal) ----------

let residentMap = null;
let residentMarker = null;
(function initResidentMap() {
  const rm = document.getElementById("residentMap");
  if (!rm || typeof L === "undefined") return;

  // create a proper LatLngBounds so we can call .contains()
  const bounds = L.latLngBounds([[0, 0], [1000, 1000]]);

  residentMap = L.map("residentMap", {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 4,
  });

  L.imageOverlay("logo/barangay_map.png", bounds).addTo(residentMap);
  residentMap.fitBounds(bounds);

  // click to add marker
  residentMap.on("click", function(e) {
    // use the LatLngBounds.contains method on the bounds object
    if (!bounds.contains(e.latlng)) {
      alert("⚠ Please select a location inside Brgy. San Francisco.");
      return;
    }
    if (residentMarker) residentMap.removeLayer(residentMarker);
    residentMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(residentMap);

    // save coords into hidden fields (if present)
    const mx = document.getElementById("mapX");
    const my = document.getElementById("mapY");
    if (mx) mx.value = e.latlng.lat;
    if (my) my.value = e.latlng.lng;
  });

  // make sure map resizes properly if the modal was hidden on load
  setTimeout(() => residentMap.invalidateSize(), 200);
})();


// ✅ Make sure resident form has only ONE submit listener
const residentForm = document.getElementById("residentForm");
if (residentForm) {
  residentForm.removeEventListener("submit", saveResident);
  residentForm.addEventListener("submit", saveResident);
}

// ---------- Delete Resident (auto-refresh after delete) ----------
async function deleteResident(id) {
  if (!confirm("Are you sure you want to delete this resident?")) return;

  try {
    const res = await fetch(`http://localhost:5236/api/residents/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete resident.");

    const data = await res.json();
    alert(data.message || "Resident deleted successfully!");

 
    await refreshAllResidents();
  } catch (err) {
    console.error("❌ Error deleting resident:", err);
    alert("Failed to delete resident.");
  }
}


// ✅ Fetch ONLY residents added by the currently logged-in BHW
async function loadResidentsFromBackend() {
  const bhwId = localStorage.getItem("bhwId");
  if (!bhwId) {
    console.error("No BHW ID found — please login again.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5236/api/residents/bybhw/${bhwId}`);
    if (!res.ok) throw new Error("Failed to load residents.");

    residents = await res.json(); // store only their own residents

    // Render list + update count
    renderResidents(residents);
    const countEl = document.getElementById("residentCount");
    if (countEl) countEl.textContent = `(${residents.length} total)`;

    // Update map markers
    renderMapResidents();

  } catch (err) {
    console.error("❌ Error loading residents:", err);
    alert("Failed to load residents for your account.");
  }


}

// ===== VIEW MODE FOR RESIDENTS =====
let residentsViewMode = "grid"; 

function switchResidentView(viewMode) {
  residentsViewMode = viewMode;
  
  // Save view preference to localStorage
  localStorage.setItem("residentsViewMode", viewMode);
  
  // Close the dropdown menu
  const dropdown = document.getElementById("viewDropdown");
  if (dropdown) dropdown.classList.add("hidden");
  
  // Update active menu item
  document.querySelectorAll(".dropdown-item").forEach(item => {
    item.classList.remove("active");
  });
  event.target.closest(".dropdown-item")?.classList.add("active");
  
  // Re-render with new view
  renderResidents();
}

function toggleViewMenu() {
  const dropdown = document.getElementById("viewDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
}

// ---------- Render residents (cards) ----------
function renderResidents() {
  const list = document.getElementById("residentsList");
  if (!list) return;
  list.innerHTML = "";

  // Get paginated residents based on current filter
  const paginatedData = getPaginatedResidents();

  // Choose rendering method based on view mode
  if (residentsViewMode === "list") {
    renderResidentsList(paginatedData);
  } else if (residentsViewMode === "table") {
    renderResidentsTable(paginatedData);
  } else {
    renderResidentsGrid(paginatedData);
  }
  
  // Update pagination UI
  updatePaginationUI();
}


function renderResidentsList(filteredResidents = residents) {
  const list = document.getElementById("residentsList");
  list.classList.remove("grid-view", "table-view");
  list.classList.add("list-view");
  
  filteredResidents.forEach((r, idx) => {
    const card = document.createElement("div");
    card.className = "resident-card list-card";
    card.innerHTML = `
      <h3>${escapeHtml(r.firstname)} ${escapeHtml(r.middlename || "")} ${escapeHtml(r.surname)}</h3>
      <p><strong>Age:</strong> ${r.age ?? "N/A"}</p>
      <p><strong>Birthday:</strong> ${r.birthday ? new Date(r.birthday).toISOString().split("T")[0] : "N/A"}</p>
      <p><strong>Occupation:</strong> ${escapeHtml(r.occupation || "N/A")}</p>
      <p><strong>Civil Status:</strong> ${escapeHtml(r.civilStatus || "N/A")}</p>
      <p><strong>Blood Type:</strong> ${escapeHtml(r.bloodType || "N/A")}</p>
      <p><strong>Illness:</strong> ${escapeHtml(r.illness || "None")}</p>
      <p><strong>Education:</strong> ${escapeHtml(r.education || "N/A")}</p>
      <p><strong>House:</strong> ${escapeHtml(r.house || "N/A")}</p>
      <p><strong>Years:</strong> ${r.years ?? 0}</p>
      <p><strong>Children:</strong> ${r.children ?? 0}</p>
      <p><strong>Contact:</strong> ${r.contact || "N/A"}</p>
      <p><strong>Address:</strong> ${escapeHtml(r.address || "N/A")}</p>
      <div class="card-actions">
        <button class="edit-btn" onclick="openResidentModal(${idx})"> <i class="fa-solid fa-pen-to-square"></i>Edit</button>
        <button class="delete-btn" onclick="deleteResident(${r.residentId})"><i class="fa-solid fa-trash"></i>Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function escapeHtml(str) {
  if (str === null || typeof str === 'undefined') return "";
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// ===== GRID VIEW (Old Design - Compact cards) =====
function renderResidentsGrid(filteredResidents = residents) {
  const list = document.getElementById("residentsList");
  list.classList.remove("list-view", "table-view");
  list.classList.add("grid-view");
  
  filteredResidents.forEach((r, idx) => {
    const card = document.createElement("div");
    card.className = "resident-card grid-card";
    card.innerHTML = `
      <h3>${escapeHtml(r.firstname)} ${escapeHtml(r.middlename || "")} ${escapeHtml(r.surname)}</h3>
      <p><strong>Age:</strong> ${r.age ?? "N/A"}</p>
      <p><strong>Birthday:</strong> ${r.birthday ? new Date(r.birthday).toISOString().split("T")[0] : "N/A"}</p>
      <p><strong>Occupation:</strong> ${escapeHtml(r.occupation || "N/A")}</p>
      <p><strong>Civil Status:</strong> ${escapeHtml(r.civilStatus || "N/A")}</p>
      <p><strong>Blood Type:</strong> ${escapeHtml(r.bloodType || "N/A")}</p>
      <p><strong>Illness:</strong> ${escapeHtml(r.illness || "None")}</p>
      <p><strong>Education:</strong> ${escapeHtml(r.education || "N/A")}</p>
      <p><strong>House:</strong> ${escapeHtml(r.house || "N/A")}</p>
      <p><strong>Years:</strong> ${r.years ?? 0}</p>
      <p><strong>Children:</strong> ${r.children ?? 0}</p>
      <p><strong>Contact:</strong> ${r.contact || "N/A"}</p>
      <p><strong>Address:</strong> ${escapeHtml(r.address || "N/A")}</p>
      <div class="card-actions">
        <button class="edit-btn" onclick="openResidentModal(${idx})"><i class="fa-solid fa-pen-to-square"></i>Edit</button>
        <button class="delete-btn" onclick="deleteResident(${r.residentId})"><i class="fa-solid fa-trash"></i>Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

// ===== TABLE VIEW =====
function renderResidentsTable(filteredResidents = residents) {
  const list = document.getElementById("residentsList");
  list.classList.remove("list-view", "grid-view");
  list.classList.add("table-view");
  
  const table = document.createElement("table");
  table.className = "residents-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Age</th>
        <th>Occupation</th>
        <th>House</th>
        <th>Contact</th>
        <th>Address</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${filteredResidents.map((r, idx) => `
        <tr>
          <td>${escapeHtml(r.firstname)} ${escapeHtml(r.middlename || "")} ${escapeHtml(r.surname)}</td>
          <td>${r.age ?? "N/A"}</td>
          <td>${escapeHtml(r.occupation || "N/A")}</td>
          <td>${escapeHtml(r.house || "N/A")}</td>
          <td>${r.contact || "N/A"}</td>
          <td>${escapeHtml(r.address || "N/A")}</td>
          <td>
            <button class="edit-btn" onclick="openResidentModal(${idx})"><i class="fa-solid fa-pen-to-square"></i>Edit</button>
            <button class="delete-btn" onclick="deleteResident(${r.residentId})"><i class="fa-solid fa-trash"></i>Delete</button>
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;
  list.appendChild(table);
}

// ===== UPDATE DASHBOARD STATS =====
function updateDashboardStats() {
  const totalResidents = residents.length;
  const illnessCount = residents.filter(r => r.illness && r.illness.trim() && !["none", "n/a", "nil"].includes(r.illness.toLowerCase())).length;
  const ownHouseCount = residents.filter(r => r.house === "Own").length;
  const rentingCount = residents.filter(r => r.house === "Renting").length;
  const activeContacts = residents.filter(r => r.contact && r.contact.trim()).length;
  
  // Update the DOM elements
  document.getElementById("totalResidents").textContent = totalResidents;
  document.getElementById("illnessCount").textContent = illnessCount;
  document.getElementById("ownHouseCount").textContent = ownHouseCount;
  document.getElementById("rentingCount").textContent = rentingCount;
  document.getElementById("activeContacts").textContent = activeContacts;
  
  // Update resident count in residents section
  document.getElementById("residentCount").textContent = `(${totalResidents} residents)`;
}

// ---------- Search (dashboard + residents) ----------
const dashSearchEl = document.getElementById("dashboardSearch");
const residentSearchEl = document.getElementById("residentSearch");
// ===== SEARCH FILTER =====
let searchQuery = "";

function applySearchFilter(query) {
  searchQuery = query.toLowerCase();
  currentPage = 1; // Reset to first page
  renderResidents();
}

// Get filtered residents with search combined
function getFilteredAndSearchedResidents() {
  let filtered = getFilteredResidents();
  
  if (searchQuery) {
    filtered = filtered.filter(r =>
      (`${r.firstname} ${r.middlename} ${r.surname} ${r.address} ${r.occupation}`).toLowerCase().includes(searchQuery)
    );
  }
  
  return filtered;
}

// Override getPaginatedResidents to use search
function getPaginatedResidents() {
  const allFiltered = getFilteredAndSearchedResidents();
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return allFiltered.slice(startIndex, endIndex);
}

// Update pagination UI to use search-aware count
function updatePaginationUI() {
  const total = getFilteredAndSearchedResidents().length;
  const totalPages = Math.ceil(total / itemsPerPage) || 1;
  
  // Update page info
  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
  
  // Update button states
  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages;
}

if (dashSearchEl) dashSearchEl.addEventListener("input", (e) => applySearchFilter(e.target.value));
if (residentSearchEl) residentSearchEl.addEventListener("input", (e) => applySearchFilter(e.target.value));

// ---------- Main Leaflet Map (MAP status bar) ----------
// ---------- MAP status bar (SS map only) ----------
let map = null, markersLayer = null;
(function initMap() {
  const mapEl = document.getElementById('mapContainer');
  if (!mapEl || typeof L === 'undefined') return;

  const bounds = L.latLngBounds([[0, 0], [1000, 1000]]);

  map = L.map('mapContainer', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 4,
  });

  L.imageOverlay("logo/barangay_map.png", bounds).addTo(map);
  map.fitBounds(bounds);

  markersLayer = L.layerGroup().addTo(map);
})();


function renderMapResidents() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  residents.forEach((r, idx) => {
    if (r.mapX && r.mapY) {
      const marker = L.marker([r.mapX, r.mapY]).addTo(markersLayer);

      // clickable marker - zoom and show details
      marker.on("click", () => {
        // Auto zoom in with animation
        map.flyTo([r.mapX, r.mapY], 3, {
          duration: 1.5,
          easeLinearity: 0.25
        });
        
        // Show details panel after zoom
        setTimeout(() => {
          showMapDetails(r, idx);
        }, 800);
      });
    }
  });
}

function showMapDetails(resident, idx) {
  const panel = document.getElementById("mapDetailsPanel");
  const body = document.getElementById("mapDetailsBody");
  
  body.innerHTML = `
    <div class="map-resident-card">
      <h3>${escapeHtml(resident.firstname)} ${escapeHtml(resident.middlename || "")} ${escapeHtml(resident.surname)}</h3>
      <p><strong>Age:</strong> ${resident.age ?? "N/A"}</p>
      <p><strong>Birthday:</strong> ${resident.birthday ? new Date(resident.birthday).toISOString().split("T")[0] : "N/A"}</p>
      <p><strong>Occupation:</strong> ${escapeHtml(resident.occupation || "N/A")}</p>
      <p><strong>Civil Status:</strong> ${escapeHtml(resident.civilStatus || "N/A")}</p>
      <p><strong>Blood Type:</strong> ${escapeHtml(resident.bloodType || "N/A")}</p>
      <p><strong>Illness:</strong> ${escapeHtml(resident.illness || "None")}</p>
      <p><strong>Education:</strong> ${escapeHtml(resident.education || "N/A")}</p>
      <p><strong>House:</strong> ${escapeHtml(resident.house || "N/A")}</p>
      <p><strong>Years:</strong> ${resident.years ?? 0}</p>
      <p><strong>Children:</strong> ${resident.children ?? 0}</p>
      <p><strong>Contact:</strong> ${resident.contact || "N/A"}</p>
      <p><strong>Address:</strong> ${escapeHtml(resident.address || "N/A")}</p>
      <div class="card-actions">
        <button class="edit-btn" onclick="openResidentModal(${idx})">
          <i class="fas fa-pen-to-square"></i> View Full Details
        </button>
      </div>
    </div>
  `;
  
  panel.classList.remove("hidden");
}

function closeMapDetails() {
  const panel = document.getElementById("mapDetailsPanel");
  panel.classList.add("hidden");
  
  // Auto zoom out to full map view
  if (map) {
    map.flyTo([500, 500], -1, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }
}


function zoomAndOpenDetails(index) {
  const res = residents[index];
  if (!res || !map) return;

  // Zoom in first
 map.setView([res.mapX, res.mapY], 2, { animate: true });


  // After zoom, open modal
  setTimeout(() => {
    openResidentModal(index);
  }, 500);
}

// ---------- Sidebar navigation ----------
(function initSidebar() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const sectionId = btn.getAttribute("data-section");
      sections.forEach(sec => sec.classList.remove("active"));
      const el = document.getElementById(sectionId);
      if (el) el.classList.add("active");
      // make sure map resizes correctly when showing map
      if (sectionId === "map" && map) {
        setTimeout(() => map.invalidateSize(), 200);
      }
    });
  });
})();

// ---------- Wire form submit and click-outside modal ----------
(function wireUp() {
  const form = document.getElementById("residentForm");
  const modal = document.getElementById("residentModal");
  if (form) {
    // prevent duplicate listeners if form already uses onsubmit attribute in HTML
    form.removeEventListener("submit", saveResident);
    form.addEventListener("submit", saveResident);
  }
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeResidentModal();
    });
  }
})();


let charts = {};

function initCharts() {
  // Add small delay to ensure canvas elements are visible
  setTimeout(() => {
    if (!residents || residents.length === 0) {
      console.warn("⚠️ No residents found, skipping charts.");
      return;
    }

    // ✅ Count valid illnesses
    const illnessCount = {};
    residents.forEach(r => {
      const illness = (r.illness || "").trim();
      if (!illness || ["none", "n/a", "nil", "default"].includes(illness.toLowerCase())) return;
      illnessCount[illness] = (illnessCount[illness] || 0) + 1;
    });

    if (Object.keys(illnessCount).length === 0) {
      console.warn("⚠️ No valid illness data found.");
      return;
    }

    // ✅ Prepare data
    const labels = Object.keys(illnessCount);
    const values = Object.values(illnessCount);

    // ✅ Destroy old charts
    Object.values(charts).forEach(ch => ch.destroy());
    charts = {};

    // ✅ Common chart options
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: "easeInOutQuart",
        delay: (context) => {
          let delay = 0;
          if (context.type === 'data') {
            delay = context.dataIndex * 50 + context.datasetIndex * 100;
          } else if (context.type === 'title') {
            delay = 300;
          }
          return delay;
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#222",
            font: { size: 13, weight: "bold" },
            usePointStyle: true,
            pointStyle: "circle",
            animation: {
              duration: 400
            }
          }
        },
        title: {
          display: true,
          text: "Common Illnesses Among Residents",
          color: "#1e293b",
          font: { size: 20, weight: "bold", family: "Poppins" },
          padding: { top: 10, bottom: 25 },
          animation: {
            duration: 600
          }
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleFont: { size: 15, weight: "bold", family: "Poppins" },
          bodyFont: { size: 13, family: "Poppins" },
          cornerRadius: 10,
          padding: 12,
          animation: {
            duration: 200
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(180,180,180,0.15)" },
          ticks: { color: "#374151", font: { size: 13 } },
          animation: {
            duration: 800,
            delay: (context) => {
              return context.index * 30;
            }
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#374151", font: { size: 13 } },
          animation: {
            duration: 800,
            delay: (context) => {
              return context.index * 30;
            }
          }
        }
      }
    };

    // ✅ Chart definitions
    const chartList = [
      { id: "barChart", type: "bar", colors: ["#4e4bf3ff", "#38f9d7"] },
      { id: "areaChart", type: "line", colors: ["#16f7a1ff", "#047deeff"] },
      { id: "barChartProfile", type: "bar", colors: ["#4e4bf3ff", "#38f9d7"] },
      { id: "areaChartProfile", type: "line", colors: ["#16f7a1ff", "#047deeff"] }
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
  }, 100); // Small delay to ensure canvas elements are ready
}



let bhwUser = null; // will be filled after fetch



// === SECTION SWITCHER ===
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // highlight sidebar nav
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  let navBtn = document.querySelector(`.nav-btn[data-section="${id}"]`);
  if (navBtn) navBtn.classList.add("active");

  // reload profile info if profile section
  if (id === "profile") {
    loadProfile();
    // ✅ Initialize charts for profile section too
    setTimeout(() => {
      initCharts();
      // Trigger window resize to ensure charts resize properly
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
  // ✅ Initialize charts when Status section is clicked
  if (id === "status") {
    setTimeout(() => {
      initCharts();
      // Trigger window resize to ensure charts resize properly
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
}






// Open Edit Profile Modal
function openEditProfileModal() {
  if (!bhwUser) {
    alert("Profile not loaded yet. Please refresh the page.");
    return;
  }

  document.getElementById("editFirstname").value = bhwUser.firstname || "";
  document.getElementById("editMiddlename").value = bhwUser.middlename || "";
  document.getElementById("editSurname").value = bhwUser.surname || "";
  document.getElementById("editAge").value = bhwUser.age || "";
  document.getElementById("editBirthday").value = bhwUser.birthday ? bhwUser.birthday.split("T")[0] : "";
  document.getElementById("editEmail").value = bhwUser.email || "";
  document.getElementById("editContact").value = bhwUser.contact || "";
  document.getElementById("editAddress").value = bhwUser.address || "";
  document.getElementById("editYears").value = bhwUser.yearsOfService || 0;

  document.getElementById("editProfileModal").classList.add("show");
}

// Close Edit Profile Modal
function closeEditProfileModal() {
  document.getElementById("editProfileModal").classList.remove("show");
}

document.getElementById("editProfileForm")?.addEventListener("submit", async function(e) {
  e.preventDefault();

  const bhwId = localStorage.getItem("bhwId");
  if (!bhwId) {
    alert("No BHW ID found. Please log in again.");
    window.location.href = "Frontpage.html";
    return;
  }

  // collect updated data
  const updatedBhw = {
    firstname: document.getElementById("editFirstname").value.trim(),
    middlename: document.getElementById("editMiddlename").value.trim(),
    surname: document.getElementById("editSurname").value.trim(),
    age: parseInt(document.getElementById("editAge").value) || 0,
    birthday: document.getElementById("editBirthday").value
      ? new Date(document.getElementById("editBirthday").value).toISOString()
      : null,
    email: document.getElementById("editEmail").value.trim(),
    contact: document.getElementById("editContact").value.trim(),
    address: document.getElementById("editAddress").value.trim(),
    yearsOfService: parseInt(document.getElementById("editYears").value) || 0
  };

  try {
    const response = await fetch(`http://localhost:5236/api/bhw/${bhwId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedBhw)
    });

    if (!response.ok) throw new Error("Failed to update profile");
    const data = await response.json();

    alert(data.message || "Profile updated successfully!");

    // update local state and UI
    bhwUser = { ...bhwUser, ...updatedBhw };
    loadProfile();
    closeEditProfileModal();

  } catch (err) {
    console.error("❌ Error updating profile:", err);
    alert("Failed to update profile. Please try again.");
  }
});

async function reloadBhwProfile() {
  const bhwId = localStorage.getItem("bhwId");
  if (!bhwId) return;

  const res = await fetch(`http://localhost:5236/api/bhw/${bhwId}`);
  if (!res.ok) return;
  bhwUser = await res.json();
  loadProfile();
}


/*
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "status") {
    // Example: new random data each time you open Status
    const newData = [
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 100)
    ];

    Object.values(charts).forEach(chart => {
      chart.data.datasets[0].data = newData;
      chart.update(); // triggers animated transition
    });
  }
}
*/




// ---------- Resident Map Picker (popup modal with SS map) ----------
// ---------- Resident Map Picker (popup modal with SS map) ----------
let pickerMap = null;
let pickerMarker = null;
function openMapPicker(existingX = null, existingY = null) {
  const modal = document.getElementById("mapPickerModal");
  const container = document.getElementById("mapPicker");
  if (!modal || !container || typeof L === "undefined") {
    console.warn("Map picker modal or container missing, or Leaflet not loaded.");
    return;
  }

  // show modal (use same 'show' class pattern you use for other modals)
  modal.classList.remove("hidden");
  modal.classList.add("show");

  // small delay so modal is visible and container has dimensions
  setTimeout(() => {
    const bounds = L.latLngBounds([[0, 0], [1000, 1000]]);
    if (!pickerMap) {
      pickerMap = L.map("mapPicker", {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 4,
      });
      L.imageOverlay("logo/barangay_map.png", bounds).addTo(pickerMap);
      pickerMap.fitBounds(bounds);

      pickerMap.on("click", function (e) {
        if (!bounds.contains(e.latlng)) {
          alert("⚠ Please select a location inside Brgy. San Francisco.");
          return;
        }
        if (pickerMarker) pickerMap.removeLayer(pickerMarker);
        pickerMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(pickerMap);
        const mx = document.getElementById("mapX");
        const my = document.getElementById("mapY");
        if (mx) mx.value = e.latlng.lat;
        if (my) my.value = e.latlng.lng;
      });
    } else {
      pickerMap.invalidateSize();
    }

    // if editing, place existing marker & center
    if (existingX !== null && existingY !== null && !isNaN(existingX) && !isNaN(existingY)) {
      if (pickerMarker) pickerMap.removeLayer(pickerMarker);
      pickerMarker = L.marker([existingX, existingY]).addTo(pickerMap);
      pickerMap.setView([existingX, existingY], 1);
    }
  }, 250);
}

function closeMapPicker() {
  const modal = document.getElementById("mapPickerModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("show");
}


// ====== Resident Map Sidebar Pins ======
let sidebarMap = null;
let sidebarMarkers = {}; // store markers per resident ID or name

function initSidebarMap() {
  sidebarMap = L.map("mapContainer", {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 4,
  });

  const bounds = [[0,0], [1000,1000]]; // match your image resolution
  L.imageOverlay("logo/barangay_map.png", bounds).addTo(sidebarMap);
  sidebarMap.fitBounds(bounds);
}

// Call this when saving or editing a resident
function updateResidentPin(resident) {
  if (!sidebarMap) initSidebarMap();

  // Remove old marker if exists
  if (sidebarMarkers[resident.surname]) {
    sidebarMap.removeLayer(sidebarMarkers[resident.surname]);
  }

  // Add new marker
  const marker = L.marker([resident.mapX, resident.mapY]).addTo(sidebarMap);

  // Bind popup with resident details
  marker.bindPopup(`
    <b>${resident.firstname} ${resident.middlename} ${resident.surname}</b><br>
    Age: ${resident.age}<br>
    Birthday: ${resident.birthday}<br>
    Occupation: ${resident.occupation}<br>
    Illness: ${resident.illness || "None"}<br>
    Address: ${resident.address}
  `);

  // On click → zoom in & ask if open details
  marker.on("click", function () {
    sidebarMap.setView([resident.mapX, resident.mapY], 3); // zoom in closer
    marker.openPopup();
    setTimeout(() => {
      if (confirm("Do you want to open full details of this resident?")) {
        // TODO: open your resident details modal here
        toggleResidentForm(resident); 
      }
    }, 300);
  });

  // Store reference so it can be replaced on edit
  sidebarMarkers[resident.surname] = marker;
}

let slideIndex = 0;
let playing = true;
let slideTimer;

function showSlides(n) {
  let slides = document.querySelectorAll(".slide");
  slides.forEach(s => s.style.display = "none");

  slideIndex += n || 1; // if n provided, move manually; else auto +1
  if (slideIndex > slides.length) slideIndex = 1;
  if (slideIndex < 1) slideIndex = slides.length;

  slides[slideIndex - 1].style.display = "block";
}

// Auto start slideshow
function startSlides() {
  slideTimer = setInterval(() => showSlides(1), 4000);
  document.getElementById("toggleBtn").innerText = "⏸";
  playing = true;
}

// Pause slideshow
function pauseSlides() {
  clearInterval(slideTimer);
  document.getElementById("toggleBtn").innerText = "▶";
  playing = false;
}

// Toggle button
document.getElementById("toggleBtn").addEventListener("click", function() {
  if (playing) pauseSlides();
  else startSlides();
});

// Arrow buttons
document.querySelector(".prev").addEventListener("click", function() {
  showSlides(-1);
  if (playing) { clearInterval(slideTimer); startSlides(); }
});

document.querySelector(".next").addEventListener("click", function() {
  showSlides(1);
  if (playing) { clearInterval(slideTimer); startSlides(); }
});


// ---------- Expose globals ----------
window.toggleResidentForm = toggleResidentForm;
window.openResidentModal = openResidentModal;
window.closeResidentModal = closeResidentModal;
window.saveResident = saveResident;
window.deleteResident = deleteResident;
window.renderResidents = renderResidents;
window.renderMapResidents = renderMapResidents;


// ---------- Import & Export Residents ----------

// ✅ EXPORT to Excel
function exportResidents() {
  if (residents.length === 0) {
    alert("No resident data to export.");
    return;
  }

  // Convert array of objects to worksheet
  const worksheet = XLSX.utils.json_to_sheet(residents);
  const workbook = XLSX.utils.book_new();-
  XLSX.utils.book_append_sheet(workbook, worksheet, "Residents");

  // Generate Excel file
  XLSX.writeFile(workbook, "Residents_List.xlsx");
}

// ✅ IMPORT from Excel/CSV/JSON
async function importResidents(event) {
  const file = event.target.files[0];
  if (!file) return;

  const bhwId = parseInt(localStorage.getItem("bhwId"));
  if (!bhwId) {
    alert("No BHW ID found. Please login again.");
    window.location.href = "Frontpage.html";
    return;
  }

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
        alert("No data found in the imported file.");
        return;
      }

      // ✅ Save each imported resident to the database
      let successCount = 0;
      let failCount = 0;

      for (const residentData of importedData) {
        try {
          const residentObj = {
            AddedByType: "BHW",
            AddedById: bhwId,
            AddedByBhwId: bhwId,
            Surname: residentData.Surname || residentData.surname || "",
            Firstname: residentData.Firstname || residentData.firstname || "",
            Middlename: residentData.Middlename || residentData.middlename || "",
            Age: parseInt(residentData.Age || residentData.age) || 0,
            Birthday: residentData.Birthday || residentData.birthday ? new Date(residentData.Birthday || residentData.birthday).toISOString() : null,
            Occupation: residentData.Occupation || residentData.occupation || "",
            House: residentData.House || residentData.house || "",
            Years: parseInt(residentData.Years || residentData.years) || 0,
            BloodType: residentData.BloodType || residentData.bloodType || "",
            Illness: residentData.Illness || residentData.illness || "",
            CivilStatus: residentData.CivilStatus || residentData.civilStatus || "",
            Education: residentData.Education || residentData.education || "",
            Children: parseInt(residentData.Children || residentData.children) || 0,
            Contact: residentData.Contact || residentData.contact || "",
            Address: residentData.Address || residentData.address || "",
            MapX: parseFloat(residentData.MapX || residentData.mapX) || 0,
            MapY: parseFloat(residentData.MapY || residentData.mapY) || 0
          };

          // ✅ Send to backend
          const res = await fetch("http://localhost:5236/api/residents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(residentObj)
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
            console.warn(`⚠️ Failed to save resident: ${residentData.Firstname} ${residentData.Surname}`);
          }
        } catch (err) {
          failCount++;
          console.error("❌ Error saving resident:", err);
        }
      }

      // ✅ Show result and refresh
      alert(`✅ Import completed! ${successCount} residents saved, ${failCount} failed.`);
      
      // Refresh the residents list
      await refreshAllResidents();

    } catch (err) {
      console.error("❌ Error reading file:", err);
      alert("❌ Error reading file! Please check format.");
    }
  };

  if (file.name.endsWith(".json")) {
    reader.readAsText(file);
  } else {
    reader.readAsBinaryString(file);
  }
}


// Load BHW profile from backend



async function loadBhwProfile() {
  try {
    const bhwId = localStorage.getItem("bhwId");
    if (!bhwId) {
      console.warn("⚠️ No BHW ID found in localStorage");
      return;
    }

    const res = await fetch("http://localhost:5236/api/bhw/approved");
    if (!res.ok) throw new Error("Failed to fetch BHW list");

    const list = await res.json();
    console.log("✅ BHW list fetched:", list);

    const my = Array.isArray(list)
      ? list.find(b => b.bhwId == bhwId)
      : list.bhwId == bhwId
      ? list
      : null;

    if (!my) {
      console.error(`❌ BHW with ID ${bhwId} not found`);
      return;
    }

    bhwUser = my; // ✅ store globally for loadProfile()

    // Update top header info safely
    const fullName = `${my.firstname || ""} ${my.surname || ""}`.trim();
    const initials =
      (my.firstname ? my.firstname[0] : "") +
      (my.surname ? my.surname[0] : "");

    const pName = document.getElementById("profileName");
    const pInitials = document.getElementById("profileInitials");
    const pImage = document.getElementById("profileImage");

    if (pName) pName.textContent = fullName;
    if (pInitials) pInitials.textContent = initials.toUpperCase();
    if (pImage && my.photo) {
      pImage.src = my.photo.startsWith("http")
        ? my.photo
        : `http://localhost:5236/${my.photo}`;
    }

    console.log("✅ BHW profile loaded successfully:", bhwUser);

  } catch (err) {
    console.error("❌ loadBhwProfile error:", err);
  }
}


function loadProfile() {
  if (!bhwUser) {
    console.error("⚠️ BHW user not loaded yet");
    return;
  }

  const bhw = bhwUser;

  // helper to safely set text
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  };

  setText("adminName", `${bhw.firstname || ""} ${bhw.middlename || ""} ${bhw.surname || ""}`.trim());
  setText("adminAge", bhw.age ?? "N/A");
  setText("adminBirthday", bhw.birthday ? bhw.birthday.split("T")[0] : "N/A");
  setText("adminEmail", bhw.email ?? "N/A");
  setText("adminContact", bhw.contact ?? "N/A");
  setText("adminAddress", bhw.address ?? "N/A");
  setText("adminYears", bhw.yearsOfService ?? "0");

  const img = document.getElementById("profileImage");
  if (img) {
    img.src = bhw.photo
      ? (bhw.photo.startsWith("http")
        ? bhw.photo
        : `http://localhost:5236/${bhw.photo}`)
      : "logo/logo.png";
  }

  const pName = document.getElementById("profileName");
  const pInitials = document.getElementById("profileInitials");
  const pDisplay = document.getElementById("profileNameDisplay");

  if (pName) pName.textContent = `${bhw.firstname || ""} ${bhw.surname || ""}`.trim();
  if (pInitials)
    pInitials.textContent = `${(bhw.firstname?.[0] || "")}${(bhw.surname?.[0] || "")}`.toUpperCase();
  if (pDisplay)
    pDisplay.textContent = `${bhw.firstname || ""} ${bhw.surname || ""}`.trim();
}


// Upload bhw profile photo
document.getElementById("uploadProfile")?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  const bhwId = localStorage.getItem("bhwId");
  const res = await fetch(`http://localhost:5236/api/upload/bhw/${bhwId}`, {
    method: "POST",
    body: fd
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById("profileImage").src = `http://localhost:5236/${data.photoPath}`;
    alert("Profile updated");
  } else {
    alert(data.message || "Upload failed");
  }
});



// ===== STAT MODAL FUNCTIONS =====
function showStatModal(type) {
  const modal = document.getElementById("statModal");
  const modalTitle = document.getElementById("statModalTitle");
  const modalContent = document.getElementById("statModalContent");
  
  let title = "";
  let filteredResidents = [];
  
  switch(type) {
    case "all":
      title = "All Residents";
      filteredResidents = residents;
      break;
    case "illness":
      title = "Residents With Illness";
      filteredResidents = residents.filter(r => r.illness && r.illness.trim() && !["none", "n/a", "nil"].includes(r.illness.toLowerCase()));
      break;
    case "ownhouse":
      title = "Residents with Own House";
      filteredResidents = residents.filter(r => r.house === "Own");
      break;
    case "renting":
      title = "Residents with Renting House";
      filteredResidents = residents.filter(r => r.house === "Renting");
      break;
    case "contacts":
      title = "Residents with Active Contacts";
      filteredResidents = residents.filter(r => r.contact && r.contact.trim());
      break;
  }
  
  modalTitle.textContent = title;
  
  if (filteredResidents.length === 0) {
    modalContent.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No residents found in this category.</p>';
  } else {
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: linear-gradient(135deg, #0066cc 0%, #00b894 100%); color: white;">';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Name</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Age</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Contact</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Address</th>';
    
    if (type === "illness") {
      html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Illness</th>';
    }
    if (type === "ownhouse") {
      html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">House Status</th>';
    }
    if (type === "renting") {
      html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">House Status</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    filteredResidents.forEach((r, idx) => {
      html += '<tr style="background: ' + (idx % 2 === 0 ? 'white' : '#f8f9fa') + '; border: 1px solid #eee;">';
      html += `<td style="padding: 12px; border: 1px solid #ddd;"><strong>${r.firstname} ${r.middlename || ""} ${r.surname}</strong></td>`;
      html += `<td style="padding: 12px; border: 1px solid #ddd;">${r.age || "N/A"}</td>`;
      html += `<td style="padding: 12px; border: 1px solid #ddd;">${r.contact || "N/A"}</td>`;
      html += `<td style="padding: 12px; border: 1px solid #ddd;">${r.address || "N/A"}</td>`;
      
      if (type === "illness") {
        html += `<td style="padding: 12px; border: 1px solid #ddd;"><span style="background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${r.illness}</span></td>`;
      }
      if (type === "ownhouse") {
        html += `<td style="padding: 12px; border: 1px solid #ddd;"><span style="background: #ffa500; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Own House</span></td>`;
      }
      if (type === "renting") {
        html += `<td style="padding: 12px; border: 1px solid #ddd;"><span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Renting</span></td>`;
      }
      
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    modalContent.innerHTML = html;
  }
  
  modal.classList.remove("hidden");
  modal.classList.add("show");
}

function closeStatModal() {
  const modal = document.getElementById("statModal");
  modal.classList.add("hidden");
  modal.classList.remove("show");
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear(); // remove saved BHW info
    window.location.href = "Frontpage.html"; // redirect to login page
  }
}

// ===== Certifications Functions =====
let certifications = [];

async function openAddCertModal() {
  const modal = document.getElementById("addCertModal");
  const form = document.getElementById("addCertForm");
  
  if (!modal) {
    console.error("❌ Modal not found!");
    return;
  }
  
  // Reset form
  if (form) {
    form.reset();
  }
  
  // ✅ Show modal properly
  modal.classList.remove("hidden");
  modal.classList.add("show");
}

function closeAddCertModal() {
  const modal = document.getElementById("addCertModal");
  const form = document.getElementById("addCertForm");
  const docFileInput = document.getElementById("certDocument");
  const certLinkInput = document.getElementById("certLink");
  const docPreview = document.getElementById("certDocumentPreview");
  
  if (!modal) return;
  
  // Reset form and inputs
  if (form) {
    form.reset();
  }
  if (docFileInput) {
    docFileInput.value = "";
  }
  if (certLinkInput) {
    certLinkInput.value = "";
  }
  if (docPreview) {
    docPreview.innerHTML = `
      <i class="fa-solid fa-file-pdf"></i>
      <p>Click to upload document</p>
      <small>Supported: PDF, Word, Excel, PowerPoint</small>
    `;
  }
  
  modal.classList.remove("show");
  modal.classList.add("hidden");
}

function loadCertifications() {
  const bhwId = localStorage.getItem("bhwId");
  if (!bhwId) {
    console.warn("⚠️ No BHW ID found, skipping certification load");
    return;
  }
  
  fetchCertificationsFromBackend(bhwId);
}

async function fetchCertificationsFromBackend(bhwId) {
  try {
    const res = await fetch(`http://localhost:5236/api/certifications/bhw/${bhwId}`);
    if (!res.ok) throw new Error("Failed to load certifications");
    
    certifications = await res.json();
    displayCertifications();
    console.log("✅ Certifications loaded from backend:", certifications);
  } catch (err) {
    console.error("❌ Error loading certifications:", err);
    // Continue gracefully - just show empty state
    certifications = [];
    displayCertifications();
  }
}

function displayCertifications() {
  const container = document.getElementById("certificationsList");
  
  if (!container) return;
  
  if (certifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-certificate"></i>
        <p>No certifications added yet</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  certifications.forEach((cert) => {
    const dateObj = new Date(cert.dateReceived);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Build document link section
    let documentHtml = '';
    if (cert.documentPath) {
      const fileIcon = getFileIcon(cert.documentName || "file");
      documentHtml = `
        <div class="cert-document">
          <i class="${fileIcon}"></i>
          <a href="${escapeHtml(cert.documentPath)}" target="_blank" rel="noopener noreferrer" title="Download: ${escapeHtml(cert.documentName)}">
            ${escapeHtml(cert.documentName)}
          </a>
        </div>
      `;
    }
    
    // Build certificate link section
    let certLinkHtml = '';
    if (cert.certificateLink) {
      certLinkHtml = `
        <div class="cert-link">
          <a href="${escapeHtml(cert.certificateLink)}" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-link"></i> View Online
          </a>
        </div>
      `;
    }
    
    html += `
      <div class="cert-card">
        <h4 class="cert-title"><i class="fa-solid fa-certificate"></i> ${escapeHtml(cert.title)}</h4>
        <p class="cert-organization">${escapeHtml(cert.organization)}</p>
        <p class="cert-date">${formattedDate}</p>
        ${cert.description ? `<p class="cert-description">${escapeHtml(cert.description)}</p>` : ''}
        ${documentHtml}
        ${certLinkHtml}
        <div class="cert-actions">
          <button class="btn-delete-cert" onclick="deleteCertification(${cert.certificationId})">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function deleteCertification(id) {
  if (confirm("Are you sure you want to delete this certification?")) {
    deleteCertificationFromBackend(id);
  }
}

async function deleteCertificationFromBackend(certificationId) {
  try {
    const res = await fetch(`http://localhost:5236/api/certifications/${certificationId}`, {
      method: "DELETE"
    });
    
    if (!res.ok) throw new Error("Failed to delete certification");
    
    const data = await res.json();
    alert(data.message || "Certification deleted successfully!");
    
    // Refresh from backend
    const bhwId = localStorage.getItem("bhwId");
    await fetchCertificationsFromBackend(bhwId);
  } catch (err) {
    console.error("❌ Error deleting certification:", err);
    alert("Failed to delete certification");
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 🎨 Get file icon based on file extension
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch(ext) {
    case 'pdf':
      return 'fa-solid fa-file-pdf';
    case 'doc':
    case 'docx':
      return 'fa-solid fa-file-word';
    case 'xls':
    case 'xlsx':
      return 'fa-solid fa-file-excel';
    case 'ppt':
    case 'pptx':
      return 'fa-solid fa-file-powerpoint';
    default:
      return 'fa-solid fa-file';
  }
}

// 🎨 Preview certificate document
function previewCertDocument() {
  const fileInput = document.getElementById("certDocument");
  const preview = document.getElementById("certDocumentPreview");
  
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const fileIcon = getFileIcon(file.name);
    const fileSize = (file.size / 1024).toFixed(2); // Convert to KB
    
    preview.innerHTML = `
      <div class="document-info">
        <i class="${fileIcon}"></i>
        <div class="document-info-text">
          <p>${file.name}</p>
          <small>${fileSize} KB</small>
        </div>
      </div>
    `;
  }
}

// 📥 Download certificate document (now just opens link since we're using URLs)
function downloadCertDocument(index) {
  const cert = certifications[index];
  if (!cert || !cert.documentPath) {
    alert("Document not available for download.");
    return;
  }
  
  // Open in new window
  window.open(cert.documentPath, '_blank');
}

// Setup file upload interactions
document.addEventListener("DOMContentLoaded", function() {
  // Handle document upload area
  const docWrapper = document.querySelector(".document-upload-wrapper");
  const docPreview = document.getElementById("certDocumentPreview");
  const docFileInput = document.getElementById("certDocument");
  
  // Make preview area clickable to open file picker
  if (docPreview && docFileInput) {
    docPreview.addEventListener("click", function() {
      docFileInput.click();
    });
  }
  
  // Drag and drop support for documents
  if (docWrapper) {
    docWrapper.addEventListener("dragover", function(e) {
      e.preventDefault();
      docWrapper.style.backgroundColor = "rgba(0, 102, 204, 0.15)";
      docWrapper.style.borderColor = "#0066cc";
    });
    
    docWrapper.addEventListener("dragleave", function(e) {
      e.preventDefault();
      docWrapper.style.backgroundColor = "";
      docWrapper.style.borderColor = "";
    });
    
    docWrapper.addEventListener("drop", function(e) {
      e.preventDefault();
      docWrapper.style.backgroundColor = "";
      docWrapper.style.borderColor = "";
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // Validate file type
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        const file = files[0];
        
        if (validTypes.includes(file.type) || file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
          docFileInput.files = files;
          previewCertDocument();
        } else {
          alert("Invalid file type. Please upload PDF, Word, Excel, or PowerPoint files.");
        }
      }
    });
  }

  // Handle certification form submission
  const form = document.getElementById("addCertForm");
  if (form) {
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    e.stopPropagation();

    const bhwId = localStorage.getItem("bhwId");
    if (!bhwId) {
      alert("No BHW ID found. Please log in again.");
      return;
    }
    
    const title = document.getElementById("certTitle").value.trim();
    const organization = document.getElementById("certOrganization").value.trim();
    const dateReceived = document.getElementById("certDate").value;
    const description = document.getElementById("certDescription").value.trim();
    const certificateLink = document.getElementById("certLink").value.trim();
    const docFileInput = document.getElementById("certDocument");

    // ✅ Required fields validation
    if (!title || !organization || !dateReceived) {
      alert("Please fill in all required fields.");
      return;
    }

    // ✅ Document OR link validation
    if (!docFileInput.files[0] && certificateLink === "") {
      alert("Please upload a document OR provide a certificate link.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("bhwId", bhwId);
      formData.append("title", title);
      formData.append("organization", organization);
      formData.append("dateReceived", dateReceived);
      formData.append("description", description);
      formData.append("certificateLink", certificateLink);
      
      // ✅ Add file if selected
      if (docFileInput.files && docFileInput.files[0]) {
        formData.append("document", docFileInput.files[0]);
      }
      
      const res = await fetch("http://localhost:5236/api/certifications/add", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add certification");
      }
      
      const data = await res.json();
      alert("✅ Certification added successfully!");
      
      // Reload certifications from backend
      await fetchCertificationsFromBackend(bhwId);
      closeAddCertModal();
      
    } catch (err) {
      console.error("❌ Error adding certification:", err);
      alert("Failed to add certification: " + err.message);
    }
  });
}



   // ✅ Load residents from backend and show in list
    async function loadResidentsFromBackend() {
      const bhwId = parseInt(localStorage.getItem("bhwId") || "1"); // Default BHW ID 1

      try {
        console.log("🌐 Fetching from:", `http://localhost:5236/api/residents/bybhw/${bhwId}`);

        const res = await fetch(`http://localhost:5236/api/residents/bybhw/${bhwId}`);

        console.log("Response status:", res.status);
        if (!res.ok) throw new Error("HTTP " + res.status);

        const residents = await res.json();
        console.log("✅ Residents fetched:", residents);

        renderResidentsFromDB(residents);
      } catch (err) {
        console.error("❌ Error loading residents:", err);
        alert("Failed to load residents: " + err.message);
      }
    }


    // ✅ Display residents from backend in cards
    function renderResidentsFromDB(residents) {
      const list = document.getElementById("residentsList");
      list.innerHTML = "";

      if (!residents.length) {
        list.innerHTML = `<p class="empty-text">No residents found for this BHW.</p>`;
        return;
      }

      residents.forEach((r) => {
        const card = document.createElement("div");
        card.className = "resident-card";
        card.innerHTML = `
      <h3>${r.firstname} ${r.middlename || ""} ${r.surname}</h3>
      <p><strong>Age:</strong> ${r.age}</p>
      <p><strong>Birthday:</strong> ${new Date(r.birthday).toLocaleDateString()}</p>
      <p><strong>Occupation:</strong> ${r.occupation || "N/A"}</p>
      <p><strong>House:</strong> ${r.house || "N/A"}</p>
      <p><strong>Years:</strong> ${r.years}</p>
      <p><strong>Blood Type:</strong> ${r.bloodType || "N/A"}</p>
      <p><strong>Illness:</strong> ${r.illness || "None"}</p>
      <p><strong>Contact:</strong> ${r.contact || "N/A"}</p>
      <p><strong>Address:</strong> ${r.address || "N/A"}</p>
      <div class="card-actions">
        <button class="edit-btn" onclick="editResident(${r.residentId})"><i class="fa-solid fa-pen-to-square">Edit</button>
        <button class="delete-btn" onclick="deleteResidentFromDB(${r.residentId})"><i class="fa-solid fa-trash"></i>Delete</button>
      </div>
    `;
        list.appendChild(card);
      });
    }

    // ✅ Delete resident via backend
    async function deleteResidentFromDB(id) {
      if (!confirm("Are you sure you want to delete this resident?")) return;

      try {
        const res = await fetch(`http://localhost:5236/api/residents/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        alert(data.message || "Resident deleted successfully!");
        loadResidentsFromBackend(); // refresh list after delete
      } catch (err) {
        console.error("❌ Delete error:", err);
        alert("Failed to delete resident.");
      }
    }

    //to check resident in postman http://localhost:5236/api/residents/bybhw/1



  
  // ✅ Load certifications when DOM is ready
  loadCertifications();
});
window.addEventListener("load", async () => {
  loadProfile();
  await loadBhwProfile();
  loadCertifications();
  showSection("dashboard");
  
  // Restore saved view preference from localStorage
  const savedResidentsViewMode = localStorage.getItem("residentsViewMode");
  if (savedResidentsViewMode) {
    residentsViewMode = savedResidentsViewMode;
  }
  
  await loadResidents();
  
  // ✅ Initialize charts after residents are loaded
  setTimeout(() => {
    initCharts();
  }, 500);
});

