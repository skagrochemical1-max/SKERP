// ─── STATE ──────────────────────────────────────────────
const CREDENTIALS = { admin: "admin123", user: "invoice2024" };
const LS_KEY = "inv_builder_data";
const LS_INV_NUM_KEY = "inv_num_counter"; // tracks the last-used invoice number
let qrInstance = null;
// Track if invoice is saved since last edit
window._invoiceSavedOnce = false;
var rows = [];
let logoDataUrl = null;

// ─── GOOGLE SHEETS INVENTORY ──────────────────────────
// Replace this URL with your published CSV link:
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3fr73zic9149bFs5vc4QQ2uyfgvuuvTHpNFyhjrsW9xwfA4u-Ctv--c0YSuU5bbpeZhdcxcVvshjf/pub?output=csv";
let inventoryData = [];

async function fetchInventory() {
  if (!SHEET_CSV_URL || !SHEET_CSV_URL.startsWith("http")) return;
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error("Network response was not ok");
    const csvText = await res.text();

    const lines = csvText.split("\n");
    if (lines.length > 1) {
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        let row = [],
          inQuotes = false,
          val = "";
        for (let char of lines[i]) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === "," && !inQuotes) {
            row.push(val);
            val = "";
          } else val += char;
        }
        row.push(val);
        if (row.length >= 3) {
          parsedData.push({
            brand: row[0].replace(/^"|"$/g, "").trim(),
            desc: row[1].replace(/^"|"$/g, "").trim(),
            price: parseFloat(row[2].replace(/[^0-9.]/g, "")) || 0,
          });
        }
      }
      if (parsedData.length > 0) inventoryData = parsedData;
    }
  } catch (err) {
    console.warn(
      "Failed to fetch inventory from Google Sheets. Using fallback data.",
      err,
    );
  }
}

// ─── AUTOCOMPLETE UI LOGIC ─────────────────────────────
let currentAcInput = null;
let acSelectedIndex = -1;
// Mark invoice as unsaved on any edit
function markInvoiceUnsaved() {
  window._invoiceSavedOnce = false;
}
// Attach markInvoiceUnsaved to all relevant input fields (run after DOM ready)
document.addEventListener("DOMContentLoaded", function() {
  ["sidebar", "main"].forEach(function(parentId) {
    const parent = document.getElementById(parentId);
    if (parent) {
      parent.querySelectorAll("input, textarea, select").forEach(function(el) {
        el.addEventListener("input", markInvoiceUnsaved);
        el.addEventListener("change", markInvoiceUnsaved);
      });
    }
  });
});

function closeAutocomplete() {
  const dropdown = $("autocomplete-dropdown");
  if (dropdown) {
    dropdown.classList.remove("active");
    dropdown.innerHTML = "";
    if (dropdown._cleanup) dropdown._cleanup();
  }
  document.body.style.overflow = "";
  currentAcInput = null;
  acSelectedIndex = -1;
}

function showAutocomplete(inputField) {
  currentAcInput = inputField;
  filterAutocomplete();
  // Prevent background scroll on mobile when dropdown is open
  document.body.style.overflow = "hidden";
  // Add keyboard navigation and live filtering
  inputField.onkeydown = function (e) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    const items = dropdown
      ? dropdown.querySelectorAll(".autocomplete-item")
      : [];
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      acSelectedIndex = (acSelectedIndex + 1) % items.length;
      items.forEach((el, i) =>
        el.classList.toggle("focused", i === acSelectedIndex),
      );
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      acSelectedIndex = (acSelectedIndex - 1 + items.length) % items.length;
      items.forEach((el, i) =>
        el.classList.toggle("focused", i === acSelectedIndex),
      );
    } else if (e.key === "Enter" && items.length) {
      if (acSelectedIndex >= 0 && acSelectedIndex < items.length) {
        e.preventDefault();
        items[acSelectedIndex].dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true }),
        );
      }
    } else {
      // For all other keys (including Backspace), re-filter after a short delay
      setTimeout(() => {
        filterAutocomplete();
      }, 0);
    }
  };
}

function filterAutocomplete() {
  if (!currentAcInput) return;

  const fieldType = currentAcInput.getAttribute("data-field"); // 'brand' or 'desc' (we use 'name' internally)
  const val = currentAcInput.value.toLowerCase().trim();

  let matches = [];

  if (fieldType === "brand") {
    const uniqueBrands = new Set();
    for (let item of inventoryData) {
      if (!val || (item.brand && item.brand.toLowerCase().startsWith(val))) {
        if (!uniqueBrands.has(item.brand)) {
          uniqueBrands.add(item.brand);
          // We use isBrandOnly to know how to render and auto-fill
          matches.push({ isBrandOnly: true, brand: item.brand });
        }
      }
    }
  } else {
    for (let item of inventoryData) {
      if (!val || (item.desc && item.desc.toLowerCase().startsWith(val))) {
        matches.push(item);
      }
    }
  }

  // Limit to top 15 results for performance
  matches = matches.slice(0, 15);

  renderAutocompleteDropdown(matches, currentAcInput);
}

function renderAutocompleteDropdown(items, inputEl) {
  acSelectedIndex = -1;
  let dropdown = $("autocomplete-dropdown");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "autocomplete-dropdown";
    dropdown.className = "autocomplete-dropdown";
    document.body.appendChild(dropdown);
  }
  // Always rebind outside click to close dropdown
  document.removeEventListener("click", window._acClickHandler, true);
  window._acClickHandler = function (e) {
    if (e.target !== currentAcInput && !dropdown.contains(e.target)) {
      closeAutocomplete();
    }
  };
  document.addEventListener("click", window._acClickHandler, true);
  // Ensure dropdown scrolls internally if content overflows
  dropdown.style.maxHeight = "200px";
  dropdown.style.overflowY = "auto";
  dropdown.style.overscrollBehavior = "contain";
  dropdown.style.zIndex = "10000";

  dropdown.innerHTML = "";
  if (items.length === 0) {
    const div = document.createElement("div");
    div.className = "autocomplete-item no-results";
    div.style.color = '#888';
    div.style.cursor = 'default';
    div.textContent = "No results";
    dropdown.appendChild(div);
  } else {
    items.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      if (item.isBrandOnly) {
        div.innerHTML = `<div class=\"autocomplete-brand\">${item.brand}</div>`;
      } else {
        div.innerHTML = `<div class=\"autocomplete-brand\">${item.desc}</div>`;
      }
      div.addEventListener("mousedown", (e) => {
        e.preventDefault(); // prevent input blur
        selectAutocompleteItem(item, inputEl);
      });
      dropdown.appendChild(div);
    });
  }
  // Reset focus
  acSelectedIndex = -1;

  // Position dropdown (fix for mobile scroll)
  const rect = inputEl.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  dropdown.style.left = rect.left + scrollLeft + "px";
  dropdown.style.top = rect.bottom + scrollTop + 2 + "px";
  dropdown.style.width = Math.max(rect.width, 220) + "px";

  // Reposition dropdown on scroll/resize
  function repositionDropdown() {
    if (!dropdown.classList.contains("active")) return;
    const rect = inputEl.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    dropdown.style.left = rect.left + scrollLeft + "px";
    dropdown.style.top = rect.bottom + scrollTop + 2 + "px";
    dropdown.style.width = Math.max(rect.width, 220) + "px";
  }
  window.addEventListener("scroll", repositionDropdown, true);
  window.addEventListener("resize", repositionDropdown);
  // Remove listeners when dropdown closes
  dropdown._cleanup = () => {
    window.removeEventListener("scroll", repositionDropdown, true);
    window.removeEventListener("resize", repositionDropdown);
  };

  dropdown.classList.add("active");
  acSelectedIndex = -1;
}

function selectAutocompleteItem(item, inputEl) {
  const rid = inputEl.getAttribute("data-rid");
  const row = rows.find((r) => r.id === rid);
  if (!row) return;

  if (item.isBrandOnly) {
    // Set the brand
    row.brand = item.brand;
    // Find the first product for this brand
    const match = inventoryData.find((d) => d.brand === item.brand);
    if (match) {
      row.name = match.desc;
      row.price = match.price;
    }
    // Desktop table
    const tr = document.getElementById("rt_" + rid)?.closest("tr");
    if (tr) {
      const bInput = tr.querySelector('input[data-field="brand"]');
      const nInput = tr.querySelector('input[data-field="name"]');
      const pInput = tr.querySelector('input[data-field="price"]');
      if (bInput) bInput.value = item.brand;
      if (nInput && match) nInput.value = match.desc;
      if (pInput && match) pInput.value = match.price;
      const span = $("rt_" + rid);
      if (span)
        span.textContent = row.total > 0 ? "₹" + INR.format(row.total) : "—";
    }
    // Mobile sidebar cards
    const mLine = document.getElementById("mob-card-" + rid);
    if (mLine) {
      const bInput = mLine.querySelector('input[data-field="brand"]');
      const nInput = mLine.querySelector('input[data-field="name"]');
      const pInput = mLine.querySelector('input[data-field="price"]');
      if (bInput) bInput.value = item.brand;
      if (nInput && match) nInput.value = match.desc;
      if (pInput && match) pInput.value = match.price;
      const mobTotal = $("mob-rt-" + rid);
      if (mobTotal)
        mobTotal.textContent =
          row.total > 0 ? "₹" + INR.format(row.total) : "—";
    }
  } else {
    // Update data model
    row.brand = item.brand;
    row.desc = item.desc;
    row.price = item.price;
    row.total = (row.qty || 0) * row.price;
    // Update DOM inputs
    // Desktop table
    const tr = document.getElementById("rt_" + rid)?.closest("tr");
    if (tr) {
      const bInput = tr.querySelector('input[data-field="brand"]');
      const nInput = tr.querySelector('input[data-field="name"]');
      const pInput = tr.querySelector('input[data-field="price"]');
      if (bInput) bInput.value = item.brand;
      if (nInput) nInput.value = item.desc;
      if (pInput) pInput.value = item.price;
      const span = $("rt_" + rid);
      if (span)
        span.textContent = row.total > 0 ? "₹" + INR.format(row.total) : "—";
    }
    // Mobile sidebar cards
    const mLine = document.getElementById("mob-card-" + rid);
    if (mLine) {
      const bInput = mLine.querySelector('input[data-field="brand"]');
      const nInput = mLine.querySelector('input[data-field="name"]');
      const pInput = mLine.querySelector('input[data-field="price"]');
      if (bInput) bInput.value = item.brand;
      if (nInput) nInput.value = item.desc;
      if (pInput) pInput.value = item.price;
      const mobTotal = $("mob-rt-" + rid);
      if (mobTotal)
        mobTotal.textContent =
          row.total > 0 ? "₹" + INR.format(row.total) : "—";
    }
  }

  // Sync identical data to the row model just to be sure
  recalcAll();
  autoSave();
  closeAutocomplete();
}

// ─── INVOICE NUMBER HELPERS ──────────────────────────────
function getNextInvoiceNum() {
  const last = parseInt(localStorage.getItem(LS_INV_NUM_KEY) || "0", 10);
  return last + 1;
}

function saveInvoiceNum(n) {
  localStorage.setItem(LS_INV_NUM_KEY, String(n));
}

function formatInvNum(n) {
  // Pad to at least 3 digits: 1→"001", 12→"012", 999→"999", 1000→"1000"
  return String(n).padStart(3, "0");
}

// ─── HELPERS ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const INR = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toast(msg, type = "") {
  const t = $("toast");
  t.textContent = msg;
  t.className = type === "error" ? "error show" : "show";
  setTimeout(() => (t.className = ""), 2500);
}

// ─── USER LOGIN ────────────────────────────────
// Predefined users
const USERS = [
  { username: "Tirth", password: "Tirth", mobile: "9664675227" },
  { username: "Dharmesh", password: "Dharmesh", mobile: "9106714212" },
  { username: "Bhavin", password: "Bhavin", mobile: "9924426959" },
  { username: "Meet", password: "Meet", mobile: "7778078032" },
  // Add more users here
];

function showProfileSymbol(username) {
  let profile = document.getElementById("profile-symbol");
  let toolbarBrand = document.querySelector(".toolbar-brand");
  let toolbarActions = document.querySelector(".toolbar-actions");
  // Get mobile from localStorage
  let mobile = localStorage.getItem("inv_user_mobile") || "";
  if (!profile) {
    profile = document.createElement("div");
    profile.id = "profile-symbol";
    profile.textContent = username ? username.charAt(0).toUpperCase() : "";
    profile.title = mobile ? `Mobile: ${mobile}` : "";
    // Desktop: show in toolbar actions
    if (window.innerWidth > 768 && toolbarActions) {
      profile.style =
        "margin-left: 16px; width: 36px; height: 36px; background: #334155; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;";
      toolbarActions.appendChild(profile);
    } else if (toolbarBrand) {
      // Mobile: show at the right edge of the screen
      profile.style =
        "position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; background: #334155; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; z-index: 1000;";
      document.body.appendChild(profile);
    } else {
      document.body.appendChild(profile);
    }
  } else {
    profile.textContent = username ? username.charAt(0).toUpperCase() : "";
    profile.title = mobile ? `Mobile: ${mobile}` : "";
    // Update style if screen size changes
    if (window.innerWidth > 768 && toolbarActions) {
      profile.style =
        "margin-left: 16px; width: 36px; height: 36px; background: #334155; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;";
      if (profile.parentNode !== toolbarActions)
        toolbarActions.appendChild(profile);
    } else if (toolbarBrand) {
      profile.style =
        "position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; background: #334155; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; z-index: 1000;";
      if (profile.parentNode !== document.body)
        document.body.appendChild(profile);
    } else {
      if (profile.parentNode !== document.body)
        document.body.appendChild(profile);
    }
  }
}

function doLogin() {
  const u = $("l-user").value.trim();
  const p = $("l-pass").value;
  const found = USERS.find(
    (user) => user.username === u && user.password === p,
  );
  if (found) {
    localStorage.setItem("inv_auth", u);
    localStorage.setItem("inv_user_mobile", found.mobile);
    $("login-screen").style.display = "none";
    $("toolbar").classList.remove("hidden");
    $("app").classList.remove("hidden");
    bootApp();
    // Set phone number for sidebar and preview
    setUserPhone(found.mobile);
    showUserMobile(found.mobile);
    showProfileSymbol(u);
  } else if (CREDENTIALS[u] && CREDENTIALS[u] === p) {
    localStorage.setItem("inv_auth", u);
    localStorage.setItem("inv_user_mobile", "");
    $("login-screen").style.display = "none";
    $("toolbar").classList.remove("hidden");
    $("app").classList.remove("hidden");
    bootApp();
    setUserPhone("");
    showUserMobile("");
  } else {
    toast("Invalid credentials", "error");
    $("l-pass").value = "";
  }
}
$("l-pass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});
$("l-user").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("l-pass").focus();
});

function doLogout() {
  localStorage.removeItem("inv_auth");
  localStorage.removeItem("inv_user_mobile");
  location.reload();
}

// Display mobile number for logged-in user
// Removed floating mobile number display
function showUserMobile(mobile) {
  // No-op: mobile number display removed
}

// Set phone number everywhere for logged-in user
function setUserPhone(mobile) {
  // Sidebar input
  const phoneInput = document.getElementById("s-phone");
  if (phoneInput) {
    phoneInput.value = mobile || "";
    phoneInput.dispatchEvent(new Event("input"));
    // Show mobile below phone input
    let mobInfo = document.getElementById("user-mobile-info");
    if (!mobInfo) {
      mobInfo = document.createElement("div");
      mobInfo.id = "user-mobile-info";
      mobInfo.style = "font-size:12px;color:#334155;margin-top:2px;";
      phoneInput.parentNode.appendChild(mobInfo);
    }
    mobInfo.textContent = mobile ? `Logged-in Mobile: ${mobile}` : "";
  }
  // Preview (paper)
  const paperPhone = document.getElementById("p-phone");
  if (paperPhone) {
    paperPhone.textContent = mobile || "—";
  }
}
// Show mobile if already logged in
window.addEventListener("DOMContentLoaded", () => {
  const auth = localStorage.getItem("inv_auth");
  const mobile = localStorage.getItem("inv_user_mobile");
  if (auth && (mobile || mobile === "")) {
    setUserPhone(mobile);
    showUserMobile(mobile);
    showProfileSymbol(auth);
  }
});

// ─── DEFAULT LOGO LOADER ───────────────────────────────────
// Converts logo.jpg to a dataURL so html2canvas can render it in PDFs.
// The logo is already visible via CSS display:block + HTML src attribute.
// This function just upgrades it to a dataURL for PDF reliability.
async function loadDefaultLogo() {
  const candidates = ["logo.jpg", "public/logo.jpg"];

  // Always ensure logo elements stay visible with an <img> src fallback chain
  const sbImg    = $("logo-preview-sb");
  const paperImg = $("paper-logo");
  const navImg   = $("navbar-logo");
  const loginImg = $("brand-logo");

  // Make all logo images visible immediately — don't wait for async
  [sbImg, paperImg, navImg, loginImg].forEach((el) => {
    if (el) el.style.display = "block";
  });

  // Try to fetch as dataURL for PDF support (html2canvas needs inline data)
  for (const path of candidates) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) continue;
      const blob = await resp.blob();
      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoDataUrl = ev.target.result;
          if (sbImg)    { sbImg.src    = logoDataUrl; sbImg.style.display    = "block"; }
          if (paperImg) { paperImg.src = logoDataUrl; paperImg.style.display = "block"; }
          if (navImg)   { navImg.src   = logoDataUrl; navImg.style.display   = "block"; }
          if (loginImg) { loginImg.src = logoDataUrl; loginImg.style.display = "block"; }
          resolve();
        };
        reader.onerror = () => resolve(); // don't crash if FileReader fails
        reader.readAsDataURL(blob);
      });
      return; // success — stop trying other paths
    } catch (e) {
      // Try next candidate
    }
  }
  // Final fallback: keep existing src= attributes visible (already done above)
}

// ─── BOOT ─────────────────────────────────────────────────
async function bootApp() {
  // Track whether we loaded an existing invoice from history
  // so downloadPDF knows not to bump the invoice number counter.
  window._invoiceLoadedFromHistory = false;

  // Check if we are loading from history
  const hash = window.location.hash;
  if (hash.startsWith("#edit=")) {
    const uniqueId = hash.replace("#edit=", "");
    window.location.hash = ""; // clear hash so reload works normally

    toast("Loading invoice...", "show");
    try {
      const invoiceData = await apiGetInvoice(uniqueId);
      if (!invoiceData) throw new Error("Invoice not found");

      // Attach the row uniqueId for legacy formatted invoices so they can overwrite themselves
      if (!invoiceData.meta) invoiceData._legacyUniqueId = uniqueId;

      restoreInvoiceUI(invoiceData);
      // Mark that this session started from a history edit
      window._invoiceLoadedFromHistory = true;
      toast("Invoice loaded");
    } catch (e) {
      toast("Error loading invoice", "error");
      console.error(e);
      bootDefault();
    }
  } else {
    bootDefault();
  }

  // Always run these critical system initializers regardless of new or edit mode
  fetchInventory();
  if (!logoDataUrl) loadDefaultLogo();
  bindSidebarInputs();

  // PDF btn
  $("pdf-btn").onclick = downloadPDF;

  // Save button logic: prevent duplicate invoices
  const saveBtn = document.getElementById("save-cloud-btn");
  if (saveBtn) {
    saveBtn.onclick = () => saveToCloud();
  }

  // Init mobile layout
  initMobile();

  // Recompute everything visually after all setup is done
  setTimeout(() => {
    refreshPaper();
    recalcAll();
    autoSave(); // Snapshot state
  }, 50);
}

function bootDefault() {
  // set today's date
  const today = new Date().toISOString().split("T")[0];
  if (!$("s-inv-date").value) $("s-inv-date").value = today;

  loadSaved();

  if (!rows.length) addRow();

  // Auto-set invoice number if field is empty or not yet meaningful
  const invNumEl = $("s-inv-num");
  if (!invNumEl.value || invNumEl.value === "") {
    const next = getNextInvoiceNum();
    invNumEl.value = formatInvNum(next);
  }
  // New invoice loaded from scratch — not from history
  window._invoiceLoadedFromHistory = false;
}

// Check if already logged in
window.addEventListener("DOMContentLoaded", () => {
  localStorage.removeItem(LS_KEY);
  const auth = localStorage.getItem("inv_auth");
  const mobile = localStorage.getItem("inv_user_mobile");
  if (auth && (mobile || mobile === "")) {
    $("login-screen").style.display = "none";
    $("toolbar").classList.remove("hidden");
    $("app").classList.remove("hidden");
    bootApp();
    setUserPhone(mobile);
    showUserMobile(mobile);
  }
});

// ─── SIDEBAR → PAPER SYNC ────────────────────────────────
const SYNC_MAP = {
  "s-company": ["p-company", "p-from-name"],
  "s-address": ["p-address"],
  "s-phone": ["p-phone"],
  "s-email": ["p-email"],
  "s-gstin": ["p-gstin"],
  "s-signatory": ["p-signatory"],
  "s-inv-num": ["p-inv-num"],
  "s-bank-name": ["p-bank-name"],
  "s-bank-acc": ["p-bank-acc"],
  "s-bank-ifsc": ["p-bank-ifsc"],
  "s-upi": ["p-upi"],
};

function bindSidebarInputs() {
  // Simple sync inputs
  Object.keys(SYNC_MAP).forEach((srcId) => {
    const el = $(srcId);
    if (!el) return;
    el.addEventListener("input", () => {
      SYNC_MAP[srcId].forEach((destId) => {
        const dest = $(destId);
        if (dest) dest.textContent = el.value || "—";
      });
      autoSave();
    });
  });

  // Date fields
  $("s-inv-date").addEventListener("change", () => {
    $("p-inv-date").textContent = formatDate($("s-inv-date").value) || "—";
    autoSave();
  });
  $("s-due-date").addEventListener("change", () => {
    const v = $("s-due-date").value;
    $("p-due-line").style.display = v ? "" : "none";
    $("p-due-date").textContent = formatDate(v) || "";
    autoSave();
  });

  // Client — auto title-case: first letter of every word uppercase, rest lowercase
  $("s-client-name").addEventListener("input", function () {
    const el = this;
    const start = el.selectionStart;   // save cursor position
    const end   = el.selectionEnd;
    const titled = el.value
      .split(" ")
      .map((word) =>
        word.length > 0
          ? word[0].toUpperCase() + word.slice(1).toLowerCase()
          : ""
      )
      .join(" ");
    if (el.value !== titled) {
      el.value = titled;
      el.setSelectionRange(start, end); // restore cursor so editing mid-word still works
    }
    $("p-client-name").textContent = el.value || "Client Name";
    autoSave();
  });
  $("s-client-addr").addEventListener("input", () => {
    $("p-client-sub").textContent = [
      $("s-client-addr").value,
      $("s-client-phone").value,
      $("s-client-gstin").value,
    ]
      .filter(Boolean)
      .join(" | ");
    autoSave();
  });
  $("s-client-phone").addEventListener("input", () => {
    $("s-client-addr").dispatchEvent(new Event("input"));
  });
  $("s-client-gstin").addEventListener("input", () => {
    $("s-client-addr").dispatchEvent(new Event("input"));
  });

  // Intro / Terms
  $("s-intro").addEventListener("input", () => {
    $("p-intro").textContent = $("s-intro").value || "";
    autoSave();
  });
  $("s-terms").addEventListener("input", () => {
    const v = $("s-terms").value.trim();
    $("p-terms").textContent = v;
    $("p-terms").style.display = v ? "" : "none";
    autoSave();
  });
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function refreshPaper() {
  // Sync all sidebar→paper
  Object.keys(SYNC_MAP).forEach((srcId) => {
    const el = $(srcId);
    if (!el) return;
    const val = el.value;
    SYNC_MAP[srcId].forEach((destId) => {
      const dest = $(destId);
      if (dest) dest.textContent = val || "—";
    });
  });
  $("p-inv-date").textContent = formatDate($("s-inv-date").value) || "—";
  const due = $("s-due-date").value;
  $("p-due-line").style.display = due ? "" : "none";
  if (due) $("p-due-date").textContent = formatDate(due);
  $("p-client-name").textContent = $("s-client-name").value || "Client Name";
  $("p-client-sub").textContent = [
    $("s-client-addr").value,
    $("s-client-phone").value,
    $("s-client-gstin").value,
  ]
    .filter(Boolean)
    .join(" | ");
  $("p-intro").textContent = $("s-intro").value || "";
  const terms = $("s-terms").value.trim();
  $("p-terms").textContent = terms;
  $("p-terms").style.display = terms ? "" : "none";
  if (logoDataUrl) {
    $("paper-logo").src = logoDataUrl;
    $("paper-logo").style.display = "block";
  }
  updateQR();
}

// ─── LOGO UPLOAD ──────────────────────────────────────────
function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    logoDataUrl = ev.target.result;
    $("logo-preview-sb").src = logoDataUrl;
    $("logo-preview-sb").style.display = "block";
    $("logo-placeholder").style.display = "none";
    $("paper-logo").src = logoDataUrl;
    $("paper-logo").style.display = "block";
    autoSave();
  };
  reader.readAsDataURL(file);
}

// ─── ITEM ROWS ────────────────────────────────────────────
var rowCounter = 0;

function addRow(data = {}) {
  rowCounter++;
  const rid = "row_" + rowCounter;
  rows.push({
    id: rid,
    brand: data.brand || "",
    name: data.name || "",
    desc: data.desc || "",
    qty: data.qty || 1,
    price: data.price || 0,
    total: data.total || 0,
  });
  renderRows();
}

function renderRows() {
  const tbody = $("items-tbody");
  tbody.innerHTML = "";
  rows.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${i + 1}</td>
      <td><input class="tbl-input" style="font-weight:600" placeholder="Brand Name" value="${esc(row.brand)}" data-rid="${row.id}" data-field="brand" autocomplete="off" onfocus="showAutocomplete(this)" oninput="filterAutocomplete(); updateRowField(this)" onchange="updateRowField(this)"/></td>
      <td><input class="tbl-input" placeholder="Product Name" value="${esc(row.name)}" data-rid="${row.id}" data-field="name" autocomplete="off" onfocus="showAutocomplete(this)" oninput="filterAutocomplete(); updateRowField(this)" onchange="updateRowField(this)"/>
        <div style="margin-top:2px"><input class="tbl-input" style="font-size:10px;color:#94a3b8" placeholder="Desc (opt.)" value="${esc(row.desc)}" data-rid="${row.id}" data-field="desc" onchange="updateRowField(this)" oninput="updateRowField(this)"/></div>
      </td>
      <td><input class="tbl-input num-input" type="number" min="1" value="${row.qty}" data-rid="${row.id}" data-field="qty" onchange="calcRow(this)" oninput="calcRow(this)" onfocus="selectQtyInput(this)" onblur="resetQtyIfEmpty(this)" onkeydown="qtyBackspaceHandler(event, this)"/></td>
      <td><input class="tbl-input price-input" type="number" min="0" step="0.01" value="${row.price || ""}" placeholder="0.00" data-rid="${row.id}" data-field="price" onchange="calcRow(this)" oninput="calcRow(this)"/></td>
      <td><span class="row-total" id="rt_${row.id}">${row.total > 0 ? "₹" + INR.format(row.total) : "—"}</span></td>
      <td class="no-print"><button class="remove-row" onclick="removeRow('${row.id}')" title="Remove">✕</button></td>`;
    tbody.appendChild(tr);
  });
  recalcAll();
  renderMobItems();
}

// ─── MOBILE SIDEBAR ITEMS RENDERER ───────────────────────
function renderMobItems() {
  const container = $("mob-items-list");
  if (!container) return;
  container.innerHTML = "";
  if (!rows.length) {
    container.innerHTML =
      '<div style="text-align:center;color:#475569;font-size:13px;padding:16px 0">No items yet. Tap Add Item below.</div>';
    return;
  }
  rows.forEach((row, i) => {
    const card = document.createElement("div");
    card.className = "mob-item-card";
    card.id = "mob-card-" + row.id;
    card.innerHTML = `
                <div class="mob-item-card-header">
                        <span class="mob-item-num">Item ${i + 1}</span>
                        <button class="mob-item-remove" onclick="removeRow('${row.id}')" title="Remove item">✕</button>
                </div>
                    <span class="sb-label">Brand Name</span>
                    <input class="sb-input" placeholder="Brand Name" value="${esc(row.brand)}"
                        data-rid="${row.id}" data-field="brand" autocomplete="off" onfocus="showAutocomplete(this)" oninput="filterAutocomplete(); mobUpdateField(this)" />
                    <span class="sb-label">Product Name</span>
                    <input class="sb-input" placeholder="Product Name" value="${esc(row.name)}"
                        data-rid="${row.id}" data-field="name" autocomplete="off" onfocus="showAutocomplete(this)" oninput="filterAutocomplete(); mobUpdateField(this)" />
                    <span class="sb-label">Description (optional)</span>
                    <input class="sb-input" placeholder="Short description" value="${esc(row.desc)}"
                        data-rid="${row.id}" data-field="desc" oninput="mobUpdateField(this)" />
                    <div class="sb-row">
                        <div>
                            <span class="sb-label">Quantity</span>
                            <input class="sb-input" type="number" min="1" placeholder="1" value="${row.qty}"
                              data-rid="${row.id}" data-field="qty" oninput="mobCalcField(this)" onfocus="selectQtyInput(this)" onblur="resetQtyIfEmpty(this)" onkeydown="qtyBackspaceHandler(event, this)" />
                        // Quantity input behaviors
                        function selectQtyInput(input) {
                          // Auto-select value on focus
                          input.select();
                        }

                        function qtyBackspaceHandler(e, input) {
                          // If Backspace is pressed and all is selected, clear
                          if (e.key === "Backspace") {
                            if (input.value && input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                              input.value = "";
                              e.preventDefault();
                            }
                          }
                        }

                        function resetQtyIfEmpty(input) {
                          // If left empty after edit, reset to 1
                          if (!input.value || input.value === "0") {
                            input.value = "1";
                            // Update row data
                            const rid = input.dataset.rid;
                            const row = rows.find(r => r.id === rid);
                            if (row) {
                              row.qty = 1;
                              recalcAll();
                              autoSave();
                            }
                          }
                        }
                        </div>
                        <div>
                            <span class="sb-label">Unit Price (₹)</span>
                            <input class="sb-input" type="number" min="0" step="0.01" placeholder="0.00" value="${row.price || ""}"
                                data-rid="${row.id}" data-field="price" oninput="mobCalcField(this)" />
                        </div>
                    </div>
                    <div class="mob-item-total">
                        <span>Total</span>
                        <span class="mob-item-total-value" id="mob-rt-${row.id}">${row.total > 0 ? "₹" + INR.format(row.total) : "—"}</span>
                    </div>`;
    container.appendChild(card);
  });
}

function mobUpdateField(el) {
  const rid = el.dataset.rid,
    f = el.dataset.field;
  const row = rows.find((r) => r.id === rid);
  if (!row) return;
  row[f] = el.value;
  // Sync to the paper table input directly using correct selector
  const tableInput = document.querySelector(
    `#items-tbody input[data-rid="${rid}"][data-field="${f}"]`,
  );
  if (tableInput) {
    tableInput.value = el.value;
  }
  recalcAll();
  autoSave();
}

function mobCalcField(el) {
  const rid = el.dataset.rid,
    f = el.dataset.field;
  const row = rows.find((r) => r.id === rid);
  if (!row) return;
  row[f] = parseFloat(el.value) || 0;
  row.total = (row.qty || 0) * (row.price || 0);
  // Update total display in sidebar card
  const mobTotal = $("mob-rt-" + rid);
  if (mobTotal)
    mobTotal.textContent = row.total > 0 ? "₹" + INR.format(row.total) : "—";
  // Update total in paper table
  const span = $("rt_" + rid);
  if (span)
    span.textContent = row.total > 0 ? "₹" + INR.format(row.total) : "—";
  // Sync to the paper table input directly using correct selector
  const tableInput = document.querySelector(
    `#items-tbody input[data-rid="${rid}"][data-field="${f}"]`,
  );
  if (tableInput) {
    tableInput.value = el.value;
  }
  recalcAll();
  autoSave();
}

function esc(s) {
  return String(s || "")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function updateRowField(el) {
  const rid = el.dataset.rid,
    f = el.dataset.field;
  const row = rows.find((r) => r.id === rid);
  if (row) {
    row[f] = el.value;
    recalcAll();
    autoSave();
  }
}

function calcRow(el) {
  const rid = el.dataset.rid,
    f = el.dataset.field;
  const row = rows.find((r) => r.id === rid);
  if (!row) return;
  row[f] = parseFloat(el.value) || 0;
  row.total = (row.qty || 0) * (row.price || 0);
  const span = $("rt_" + rid);
  if (span)
    span.textContent = row.total > 0 ? "₹" + INR.format(row.total) : "—";
  recalcAll();
  autoSave();
}

function removeRow(rid) {
  rows = rows.filter((r) => r.id !== rid);
  renderRows();
  autoSave();
}

// ─── CALCULATIONS ─────────────────────────────────────────
function recalcAll() {
  // Always recalculate each row's total before summing and update display
  rows.forEach((r) => {
    r.total = (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0);
    // Update desktop/table total cell
    const span = document.getElementById("rt_" + r.id);
    if (span) span.textContent = r.total > 0 ? "₹" + INR.format(r.total) : "—";
    // Update mobile total cell
    const mobTotal = document.getElementById("mob-rt-" + r.id);
    if (mobTotal)
      mobTotal.textContent = r.total > 0 ? "₹" + INR.format(r.total) : "—";
  });
  const sub = rows.reduce((s, r) => s + (r.total || 0), 0);
  const gstRate = parseFloat($("gst-rate").value) || 0;
  const gstOn = gstRate > 0;
  const gst = gstOn ? Math.round(sub * (gstRate / 100) * 100) / 100 : 0;
  const grand = sub + gst;
  $("p-subtotal").textContent = "₹" + INR.format(sub);
  $("p-gst").textContent = "₹" + INR.format(gst);
  $("p-grand").textContent = "₹" + INR.format(grand);
  $("p-gst-row").style.display = gstOn ? "" : "none";
  const label = $("p-gst-label");
  if (label) label.textContent = `GST(${gstRate} %)`;
}

// ─── QR CODE ─────────────────────────────────────────────
function updateQR() {
  const show = $("qr-toggle").checked;
  $("qr-block").style.display = show ? "" : "none";
  if (!show) return;
  const upi = $("s-upi").value.trim() || "business@bank";
  const name = $("s-company").value.trim() || "Business";
  const canvas = $("qr-canvas");
  canvas.innerHTML = "";
  qrInstance = null;
  try {
    qrInstance = new QRCode(canvas, {
      text: `upi://pay?pa=${upi}&pn=${encodeURIComponent(name)}`,
      width: 90,
      height: 90,
      colorDark: "#000",
      colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (e) {}
}

// ─── PDF DOWNLOAD ─────────────────────────────────────────
async function downloadPDF() {
  // ── AUTO-SAVE before downloading ──────────────────────
  // Only auto-save if not already saved since last edit
  if (!window._invoiceSavedOnce) {
    try {
      await saveToCloud(true /*isSilent*/);
    } catch (autoSaveErr) {
      console.warn("Auto-save before PDF failed (non-critical):", autoSaveErr);
      // Continue with PDF generation even if auto-save fails
    }
  }

  const btn = $("pdf-btn");
  const mobBtn = $("mob-pdf-btn");
  if (btn) {
    btn.innerHTML =
      '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">autorenew</span> Generating...';
    btn.disabled = true;
  }
  if (mobBtn) {
    mobBtn.disabled = true;
    mobBtn.classList.add("active");
  }

  // Inject PDF-mode styles
  const pdfStyle = document.createElement("style");
  pdfStyle.id = "pdf-mode-style";
  pdfStyle.textContent = `
                .no-print, .remove-row, .add-row-btn { display: none !important; }
                .items-table thead th:last-child,
                .items-table tbody td:last-child { display: none !important; }
                .items-table { table-layout: fixed !important; width: 100% !important; border-collapse: collapse !important; }
                .items-table thead th:nth-child(1) { width: 36px !important; }
                .items-table thead th:nth-child(2) { width: auto !important; }
                .items-table thead th:nth-child(3) { width: auto !important; }
                .items-table thead th:nth-child(4) { width: 68px !important; }
                .items-table thead th:nth-child(5) { width: 80px !important; }
                .items-table thead th:nth-child(6) { width: 90px !important; }
                .items-table tbody td { overflow: visible !important; white-space: normal !important; word-break: break-word !important; padding: 8px 10px !important; vertical-align: top !important; }
                .items-table tbody td:nth-child(1) { white-space: nowrap !important; }
                .pdf-cell-text { font-family:'Inter',sans-serif; font-size:12px; color:#1e293b; white-space:normal; word-break:break-word; line-height:16px; min-height:16px; }
                .pdf-cell-text.brand-text { font-weight:700; color:#1e293b; }
                .pdf-cell-text.desc-text { font-size:10px; color:#94a3b8; margin-top:4px; line-height:14px; min-height:14px; }
                .pdf-cell-text.num-text { text-align:center; }
                .pdf-cell-text.price-text { text-align:right; }
                .table-scroll-wrap { overflow: visible !important; }
                #invoice-paper { box-shadow:none !important; min-height:0 !important; height:auto !important; overflow:visible !important; margin: 0 !important; }
                #paper-logo { max-width: 160px !important; max-height: 100px !important; object-fit: contain !important; display: block !important; }
                body, html, #main { overflow: visible !important; height: auto !important; max-height: none !important; position: static !important; }
            `;
  document.head.appendChild(pdfStyle);

  const paper = $("invoice-paper");
  const main = document.getElementById("main");
  let wasHidden = false;
  if (main && main.classList.contains("panel-hidden")) {
    main.classList.remove("panel-hidden");
    wasHidden = true;
    await new Promise((r) => requestAnimationFrame(r));
  }

  const savedTransform = paper.style.transform;
  const savedTransformOrigin = paper.style.transformOrigin;
  const savedWidth = paper.style.width;
  const savedMinWidth = paper.style.minWidth;
  const savedDisplay = paper.style.display;

  paper.style.transform = "none";
  paper.style.transformOrigin = "top left";
  paper.style.width = "794px";
  paper.style.minWidth = "794px";
  paper.style.height = "auto";
  paper.style.display = "";

  const paperLogo = $("paper-logo");
  const savedLogoSrc = paperLogo ? paperLogo.src : null;
  let logoWasHidden = false;
  let replacements = [];

  await new Promise((r) => setTimeout(r, 150));

  try {
    await new Promise((r) => setTimeout(r, 150));

    if (paperLogo && logoDataUrl) {
      paperLogo.src = logoDataUrl;
      await new Promise((r) => requestAnimationFrame(r));
    } else if (paperLogo && !logoDataUrl) {
      paperLogo.style.display = "none";
      logoWasHidden = true;
    }

    // Swap inputs → divs for proper text rendering
    paper.querySelectorAll(".tbl-input").forEach((input) => {
      const div = document.createElement("div");
      div.className = "pdf-cell-text";
      if (input.classList.contains("num-input")) div.classList.add("num-text");
      if (input.classList.contains("price-input"))
        div.classList.add("price-text");
      if (input.style.fontWeight === "600") div.classList.add("brand-text");
      if (input.style.fontSize && input.style.fontSize.includes("10"))
        div.classList.add("desc-text");
      div.textContent = input.value || "";
      input.parentNode.insertBefore(div, input);
      input.style.display = "none";
      replacements.push({ input, div });
    });

    // Wait for the text to wrap to multiple lines and expand the table rows
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 50));

    // ── Measure atomic block positions BEFORE canvas capture ──
    // Each block must never be split across two pages.
    const paperRect = paper.getBoundingClientRect();

    function domPx(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.height === 0) return null; // Ignore hidden elements
      // Add large safety margin to prevent clipping and buffer against html2canvas line-height measurement drift
      return {
        top: r.top - paperRect.top - 2,
        bottom: r.bottom - paperRect.top + 20,
      };
    }

    const atomicBlocks = [];

    // Table header
    paper.querySelectorAll(".items-table thead tr").forEach((tr) => {
      const px = domPx(tr);
      if (px) atomicBlocks.push(px);
    });

    // Each table body row
    paper.querySelectorAll("#items-tbody tr").forEach((tr) => {
      const px = domPx(tr);
      if (px) atomicBlocks.push(px);
    });

    // Totals + footer merged as one atomic block
    let bsTop = null,
      bsBottom = null;
    [".totals-wrap", ".paper-footer", ".paper-notes"].forEach((sel) => {
      const el = paper.querySelector(sel);
      const px = domPx(el);
      if (!px) return;
      if (bsTop === null || px.top < bsTop) bsTop = px.top;
      if (bsBottom === null || px.bottom > bsBottom) bsBottom = px.bottom;
    });
    if (bsTop !== null) atomicBlocks.push({ top: bsTop, bottom: bsBottom });

    const captureW = 794;
    const captureH = paper.scrollHeight;

    const canvas = await html2canvas(paper, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: captureW,
      height: captureH,
      windowWidth: captureW,
      windowHeight: captureH,
    });

    if (
      !canvas ||
      !canvas.width ||
      !canvas.height ||
      canvas.width <= 0 ||
      canvas.height <= 0
    ) {
      toast("PDF generation failed: invalid canvas", "error");
      return;
    }

    // Restore inputs
    replacements.forEach(({ input, div }) => {
      div.remove();
      input.style.display = "";
    });
    replacements = [];

    const { jsPDF } = window.jspdf;
    const pW = 210,
      pH = 297; // A4 mm

    // px → mm conversion
    const pxToMm = pW / canvas.width;
    // DOM pixels → canvas pixels scale
    const domToCanvas = canvas.width / captureW;
    // A4 page height in canvas pixels (with 8mm bottom margin for breathing room)
    const safePageH = (pH - 8) / pxToMm;
    const totalH = canvas.height;

    // Convert atomic blocks to canvas pixel space
    const cBlocks = atomicBlocks.map((b) => ({
      top: b.top * domToCanvas,
      bottom: b.bottom * domToCanvas,
    }));

    // ── Compute row-aware page cut points ──
    // Each cut is an exact canvas-pixel Y where we slice.
    const cuts = [0];
    let pageStart = 0;
    for (let guard = 0; guard < 50; guard++) {
      const idealEnd = pageStart + safePageH;
      if (idealEnd >= totalH) break; // rest fits on current page

      // Find blocks that straddle the ideal cut line → move cut above them
      let safeCut = idealEnd;
      for (const blk of cBlocks) {
        if (blk.top < idealEnd && blk.bottom > idealEnd) {
          // Block straddles cut — move cut to just before this block
          safeCut = Math.min(safeCut, blk.top - 1);
        }
      }

      // Prevent infinite loop if a block is taller than a full page
      if (safeCut <= pageStart + 10) safeCut = idealEnd;

      cuts.push(safeCut);
      pageStart = safeCut;
    }
    cuts.push(totalH); // sentinel

    const imgFullH = (totalH * pW) / canvas.width;
    if (!imgFullH || isNaN(imgFullH) || imgFullH <= 0) {
      toast("PDF generation failed: image height invalid", "error");
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    if (cuts.length <= 2) {
      // Single page — place image directly
      const imgData = canvas.toDataURL("image/jpeg", 0.97);
      pdf.addImage(imgData, "JPEG", 0, 0, pW, imgFullH);
    } else {
      // Multi-page with smart cuts — slice canvas per page
      for (let i = 0; i < cuts.length - 1; i++) {
        const sliceTop = cuts[i];
        const sliceH = Math.ceil(cuts[i + 1] - sliceTop);
        if (sliceH <= 0) continue;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        sliceCanvas.getContext("2d").drawImage(canvas, 0, -sliceTop);

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.97);
        const sliceHmm = (sliceH * pW) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(sliceData, "JPEG", 0, 0, pW, sliceHmm);
      }
    }

    const num = $("s-inv-num").value || "001";
    pdf.save(`Invoice-${num}.pdf`);
    toast("PDF downloaded! ✓");

    // ── Smart invoice number increment ────────────────
    // Only advance the counter for BRAND NEW invoices.
    // If we are editing an existing invoice loaded from history
    // (window.currentInvoiceId is already set from the saved record),
    // keep the same number — do NOT bump the counter.
    const usedNum = parseInt(num, 10);
    const lastSaved = parseInt(localStorage.getItem(LS_INV_NUM_KEY) || "0", 10);
    const isEditingExisting =
      !!window.currentInvoiceId && window._invoiceLoadedFromHistory;
    if (!isEditingExisting && !isNaN(usedNum) && usedNum >= lastSaved) {
      saveInvoiceNum(usedNum);
    }
  } catch (e) {
    toast("PDF generation failed", "error");
    console.error(e);
  } finally {
    if (main && wasHidden) main.classList.add("panel-hidden");
    replacements.forEach(({ input, div }) => {
      if (div.parentNode) div.remove();
      input.style.display = "";
    });
    const s = document.getElementById("pdf-mode-style");
    if (s) s.remove();
    paper.style.transform = savedTransform;
    paper.style.transformOrigin = savedTransformOrigin;
    paper.style.width = savedWidth;
    paper.style.minWidth = savedMinWidth;
    paper.style.display = savedDisplay;
    if (paperLogo) {
      if (logoDataUrl) {
        paperLogo.src = logoDataUrl;
        paperLogo.style.display = "block";
      } else {
        paperLogo.style.display = "none";
      }
    }
    if (btn) {
      btn.innerHTML =
        '<span class="material-symbols-outlined">download</span> Download PDF';
      btn.disabled = false;
    }
    if (mobBtn) {
      mobBtn.disabled = false;
      mobBtn.classList.remove("active");
    }
  }
}

// ─── SAVE / LOAD ──────────────────────────────────────────
function getFieldValues() {
  const fields = [
    "s-company",
    "s-address",
    "s-phone",
    "s-email",
    "s-gstin",
    "s-signatory",
    "s-inv-num",
    "s-inv-date",
    "s-due-date",
    "s-client-name",
    "s-client-addr",
    "s-client-phone",
    "s-client-gstin",
    "s-bank-name",
    "s-bank-acc",
    "s-bank-ifsc",
    "s-upi",
    "s-intro",
    "s-terms",
  ];
  const out = {};
  fields.forEach((id) => {
    const el = $(id);
    if (el) out[id] = el.value;
  });
  return out;
}

function setFieldValues(data) {
  Object.entries(data).forEach(([id, val]) => {
    const el = $(id);
    if (el) el.value = val || "";
  });
}

function autoSave() {
  const data = {
    fields: getFieldValues(),
    rows,
    gstRate: $("gst-rate").value,
    qr: $("qr-toggle").checked,
    logo: logoDataUrl,
  };
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.fields) setFieldValues(data.fields);
    if (data.rows && data.rows.length) {
      rows = data.rows;
      renderRows();
    }
    if (data.gstRate !== undefined) $("gst-rate").value = data.gstRate;
    else if (data.gst) $("gst-rate").value = "18"; // migrate old saves
    if (data.qr) $("qr-toggle").checked = true;
    if (data.logo) {
      logoDataUrl = data.logo;
      $("logo-preview-sb").src = data.logo;
      $("logo-preview-sb").style.display = "block";
      $("paper-logo").src = data.logo;
      $("paper-logo").style.display = "block";
      $("logo-placeholder").style.display = "none";
    }
  } catch (e) {}
}

function clearAll() {
  window.currentInvoiceId = null;
  window._invoiceLoadedFromHistory = false; // reset history flag for fresh invoice
  rows = [];
  rowCounter = 0;
  logoDataUrl = null;
  [
    "s-company",
    "s-address",
    "s-phone",
    "s-email",
    "s-gstin",
    "s-signatory",
    "s-client-name",
    "s-client-addr",
    "s-client-phone",
    "s-client-gstin",
    "s-bank-name",
    "s-bank-acc",
    "s-bank-ifsc",
    "s-upi",
    "s-intro",
    "s-terms",
  ].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
  $("s-inv-date").value = new Date().toISOString().split("T")[0];
  $("s-due-date").value = "";
  // Assign the next sequential invoice number
  const next = getNextInvoiceNum();
  $("s-inv-num").value = formatInvNum(next);
  $("p-inv-num").textContent = formatInvNum(next);
  $("gst-rate").value = "0";
  $("qr-toggle").checked = false;
  $("logo-preview-sb").style.display = "none";
  $("logo-placeholder").style.display = "";
  $("paper-logo").style.display = "none";
  // localStorage.removeItem(LS_KEY);
  rows = [];
  renderRows();
  addRow();
  refreshPaper();
  recalcAll();
  toast("New invoice started");
}

// ─── FIXED INFO TOGGLE ────────────────────────────────
let fixedInfoOpen = false;

function toggleFixedInfo() {
  fixedInfoOpen = !fixedInfoOpen;
  const block = $("fixed-info-block");
  const chevron = $("fixed-chevron");
  const banner = $("fixed-info-banner");
  if (fixedInfoOpen) {
    block.style.display = "";
    chevron.classList.add("open");
    banner.style.borderBottom = "1px solid #10b98140";
  } else {
    block.style.display = "none";
    chevron.classList.remove("open");
    banner.style.borderBottom = "1px solid #1e3a5f";
  }
}

// Spin animation for PDF btn
const style = document.createElement("style");
style.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
document.head.appendChild(style);

// ─── MOBILE TAB SWITCHING ────────────────────────────
let mobileActivePanel = "edit"; // 'edit' | 'preview'

/**
 * Highlights only the correct nav tab (Edit or Preview).
 * Action tabs (New, Save, PDF) are NEVER given the active class.
 */
function syncMobileNavHighlight() {
  // Only touch nav tabs — not action tabs
  document
    .querySelectorAll(".mob-nav-tab")
    .forEach((tab) => tab.classList.remove("active"));
  if (mobileActivePanel === "edit") {
    $("mob-edit-tab").classList.add("active");
  } else {
    $("mob-preview-tab").classList.add("active");
  }
}

function showMobilePanel(panel) {
  mobileActivePanel = panel;

  const sidebar = $("sidebar");
  const main = $("main");

  if (panel === "edit") {
    sidebar.classList.remove("panel-hidden");
    main.classList.add("panel-hidden");
    main.classList.remove("mob-preview");
  } else {
    sidebar.classList.add("panel-hidden");
    main.classList.remove("panel-hidden");
    main.classList.add("mob-preview"); // disables editing in paper preview
    requestAnimationFrame(() => scalePaperForMobile());
  }

  // Always re-sync highlight AFTER state change
  syncMobileNavHighlight();
}

function mobileNewInvoice() {
  if (!confirm("Start a new invoice? Unsaved data will be cleared.")) return;
  clearAll();
  // Always return to the Edit panel so the user can start typing
  showMobilePanel("edit");
}

// Wire mobile PDF button — action only, does NOT change nav highlight
$("mob-pdf-btn").onclick = () => {
  downloadPDF();
};

// On resize: reset panels and re-scale paper
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    $("sidebar").classList.remove("panel-hidden");
    $("main").classList.remove("panel-hidden");
    scalePaperForMobile(); // removes scale transform
  } else {
    showMobilePanel(mobileActivePanel);
    scalePaperForMobile();
  }
});

// On boot: show mobile tabs, set initial panel, scale paper
function initMobile() {
  if (window.innerWidth <= 768) {
    $("mobile-tabs").classList.remove("hidden");
    showMobilePanel("edit"); // this also calls syncMobileNavHighlight
    scalePaperForMobile();
  } else {
    $("mobile-tabs").classList.add("hidden");
    $("invoice-paper").style.transform = "";
  }
}

// Scale the A4 paper to fit mobile viewport
function scalePaperForMobile() {
  const paper = $("invoice-paper");
  const main = $("main");
  if (!paper || !main) return;
  if (window.innerWidth <= 768) {
    const availW = window.innerWidth - 4; // tiny margin both sides
    const scale = availW / 794;
    paper.style.transform = `scale(${scale})`;
    paper.style.transformOrigin = "top left";
    // Make the #main tall enough to scroll the scaled paper
    main.style.minHeight = Math.ceil(paper.scrollHeight * scale + 100) + "px";
  } else {
    paper.style.transform = "";
    paper.style.transformOrigin = "";
    main.style.minHeight = "";
  }
}

// ─── CLOUD SAVE ──────────────────────────────────────────
async function saveToCloud(isSilent = false) {
  const btn = $("save-cloud-btn");
  const mobBtn = $("mob-save-btn");

  if (!isSilent) {
    if (btn) {
      btn.innerHTML =
        '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">autorenew</span> Saving...';
      btn.disabled = true;
    }
    if (mobBtn) {
      mobBtn.disabled = true;
      mobBtn.style.opacity = "0.5";
    }
  } else {
    if (btn) {
      btn.innerHTML =
        '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">autorenew</span>';
    }
  }

  try {
    // Ensure everything is calculated and synced
    recalcAll();

    // Extract clean JSON from UI using logic from storage.js
    const payload = extractInvoiceJSON(window.currentInvoiceId);

    // Validation
    if (!payload.meta.invoiceNumber) {
      if (!isSilent) throw new Error("Invoice number is missing.");
      return;
    }

    // --- DUPLICATE DETECTION / ID RECOVERY ---
    // Always check for existing record in the cloud to prevent double-saving
    try {
      const cloudInvoices = await apiGetInvoices();
      const existingRow = cloudInvoices.find(inv =>
        (inv.invoiceNumber === payload.meta.invoiceNumber) ||
        (inv.customerName && inv.date &&
         inv.customerName === payload.customer.name &&
         inv.date === payload.meta.date)
      );
      if (existingRow && existingRow.uniqueId) {
        window.currentInvoiceId = existingRow.uniqueId;
        payload.meta.uniqueId = existingRow.uniqueId;
      }
    } catch (recoveryErr) {
      console.warn("Could not check for existing record:", recoveryErr);
    }

    let response;
    let isUpdate = false;
    if (window.currentInvoiceId) {
      // Update existing
      payload.meta.uniqueId = window.currentInvoiceId;
      response = await apiUpdateInvoice(payload);
      isUpdate = true;
    } else {
      // Save new
      response = await apiSaveInvoice(payload);
      window.currentInvoiceId = response.uniqueId; // Ensure we track this for future saves/downloads
    }
    // Mark as saved
    window._invoiceSavedOnce = true;

    if (!isSilent) {
      toast(isUpdate ? "Invoice updated ✓" : "Invoice saved to cloud ✓");
    } else {
      if (btn) {
        btn.innerHTML =
          `<span class="material-symbols-outlined" style="color:#dcfce7">check_circle</span> ${isUpdate ? 'Updated' : 'Saved'}`;
      }
      setTimeout(() => {
        if (btn) {
          btn.innerHTML =
            '<span class="material-symbols-outlined">cloud_upload</span> Save';
        }
      }, 2000);
    }

    // Refresh history cache so the new/updated record shows up immediately in history list
    localStorage.removeItem('invoice_history_cache');

    // Track invoice number locally just to keep sequential generation smooth
    const usedNum = parseInt(payload.meta.invoiceNumber, 10);
    const lastSaved = parseInt(localStorage.getItem(LS_INV_NUM_KEY) || "0", 10);
    if (!isNaN(usedNum) && usedNum >= lastSaved) saveInvoiceNum(usedNum);
  } catch (err) {
    console.error(err);
    if (!isSilent) toast(err.message || "Failed to save", "error");
  } finally {
    if (!isSilent) {
      if (btn) {
        btn.innerHTML =
          '<span class="material-symbols-outlined">cloud_upload</span> Save';
        btn.disabled = false;
      }
      if (mobBtn) {
        mobBtn.disabled = false;
        mobBtn.style.opacity = "1";
      }
    }
  }
}
