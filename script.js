// Authentication system
const users = [
  { username: 'Max', password: 'admin@123', role: 'admin' },
  { username: 'Roommate', password: 'user@123', role: 'user' }
];

let currentUser = null;

// Check if user is logged in
function checkAuth() {
  const user = localStorage.getItem('currentUser');
  if (user) {
    currentUser = JSON.parse(user);
    applyUserPermissions();
    return true;
  }
  return false;
}

// Login function
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const userType = document.querySelector('input[name="userType"]:checked').value;

  const user = users.find(u =>
    u.username === username &&
    u.password === password &&
    u.role === userType
  );

  if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = './index.html';
  } else {
    document.getElementById('errorMsg').classList.remove('hidden');
  }
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  window.location.href = './authen.html';
}

// Apply user permissions based on role
function applyUserPermissions() {
  if (!currentUser) return;

  if (currentUser.role === 'user') {
    // Hide admin-only elements
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
      el.style.display = 'none';
    });

    // Disable admin actions
    const adminActions = document.querySelectorAll('.admin-action');
    adminActions.forEach(el => {
      el.disabled = true;
      el.classList.add('opacity-50', 'cursor-not-allowed');
    });

    // Update navbar to show logout
    updateNavbar();
  }

  // Add logout button to navbar for both roles
  updateNavbar();
}

// Update navbar with user info and logout
function updateNavbar() {
  const navbar = document.querySelector('nav .max-w-6xl');
  if (!navbar) return;

  // Check if user dropdown already exists
  if (document.getElementById('userDropdown')) return;

  const userDropdown = document.createElement('div');
  userDropdown.className = 'relative';
  userDropdown.id = 'userDropdown';
  userDropdown.innerHTML = `
    <button id="userMenuBtn" class="flex items-center space-x-2 border border-white/20 p-2 rounded-xl text-gray-300 hover:text-white transition">
      <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
        ${currentUser.username.charAt(0).toUpperCase()}
      </div>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>
    
    <div id="userDropdownMenu" class="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl py-2 hidden z-50 backdrop-blur-md">
      <div class="px-4 py-2 border-b border-white/10">
        <p class="text-white font-medium">${currentUser.username}</p>
        <p class="text-gray-400 text-sm capitalize">${currentUser.role}</p>
      </div>
      <button onclick="logout()" class="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center space-x-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        <span>Logout</span>
      </button>
    </div>
  `;

  navbar.appendChild(userDropdown);

  // Add dropdown toggle functionality
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdownMenu = document.getElementById('userDropdownMenu');

  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdownMenu.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    userDropdownMenu.classList.add('hidden');
  });
}

// Protect pages - add this to each page's script
function protectPage() {
  if (!checkAuth()) {
    window.location.href = './authen.html';
  }
}
// Toggle Mobile Menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

let people = JSON.parse(localStorage.getItem("people")) || [];
let items = JSON.parse(localStorage.getItem("items")) || [];

// ========== IMAGE COMPRESSION FUNCTIONS ==========
// Advanced image compression with target size
function compressImageToSize(file, targetSizeKB = 200, maxWidth = 1200, maxHeight = 800) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
      let width = img.width;
      let height = img.height;

      // Calculate dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Progressive compression to achieve target size
      const compressIteration = (quality, attempts = 0) => {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (compressedDataUrl.length * 0.75) / 1024; // Base64 is ~33% larger

        console.log(`Compression attempt ${attempts + 1}: ${quality} quality → ${sizeKB.toFixed(2)}KB`);

        if (sizeKB <= targetSizeKB || quality <= 0.3 || attempts >= 5) {
          resolve({
            dataUrl: compressedDataUrl,
            originalSize: file.size,
            compressedSize: compressedDataUrl.length,
            quality: quality,
            sizeKB: sizeKB,
            dimensions: { width, height }
          });
        } else {
          // Reduce quality and try again
          const newQuality = Math.max(quality - 0.15, 0.3);
          setTimeout(() => compressIteration(newQuality, attempts + 1), 50);
        }
      };

      // Start with high quality
      compressIteration(0.9, 0);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Smart compression based on original file size
function smartCompressImage(file) {
  const originalSizeMB = file.size / (1024 * 1024);

  // Adjust compression based on original file size
  let targetSizeKB, maxWidth, maxHeight;

  if (originalSizeMB > 3) {
    // Large files: aggressive compression
    targetSizeKB = 150;
    maxWidth = 800;
    maxHeight = 600;
  } else if (originalSizeMB > 1) {
    // Medium files: moderate compression
    targetSizeKB = 200;
    maxWidth = 1000;
    maxHeight = 750;
  } else {
    // Small files: light compression
    targetSizeKB = 250;
    maxWidth = 1200;
    maxHeight = 900;
  }

  return compressImageToSize(file, targetSizeKB, maxWidth, maxHeight);
}

// Enhanced image preview with size info
function handleImageUpload() {
  const fileInput = document.getElementById('itemImage');
  const preview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');

  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const originalUrl = URL.createObjectURL(file);
      previewImage.src = originalUrl;
      preview.classList.remove('hidden');

      // Update file size info
      let sizeInfo = preview.querySelector('.size-info');
      if (!sizeInfo) {
        sizeInfo = document.createElement('div');
        sizeInfo.className = 'size-info text-xs text-center mt-2';
        preview.appendChild(sizeInfo);
      }

      const originalSizeKB = (file.size / 1024).toFixed(2);
      sizeInfo.innerHTML = `
        <div class="text-gray-400">Original: <strong>${originalSizeKB} KB</strong></div>
        <div class="text-orange-400 mt-1">Will be compressed to ~200KB</div>
      `;
    } else {
      preview.classList.add('hidden');
    }
  });
}
// ========== END IMAGE COMPRESSION FUNCTIONS ==========

// Save data
function saveData() {
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("items", JSON.stringify(items));
}

// Summary update
function updateSummary() {
  const given = people.reduce((sum, p) => sum + (p.given || 0), 0);
  const spent = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const balance = given - spent;

  if (document.getElementById("givenAmount"))
    document.getElementById("givenAmount").innerText = "₹" + given;
  if (document.getElementById("spentAmount"))
    document.getElementById("spentAmount").innerText = "₹" + spent;
  if (document.getElementById("currentAmount"))
    document.getElementById("currentAmount").innerText = "₹" + balance;

  updateBalances();
  renderItems();
  saveData();
}

// Balance calculation
function updateBalances() {
  if (people.length === 0) return;

  people.forEach(p => {
    let totalShare = 0;

    const eligibleItems = items.filter(item => {
      const itemDate = new Date(item.date);
      const joinDate = new Date(p.date);
      const leaveDate = p.leaveDate ? new Date(p.leaveDate) : null;
      return itemDate >= joinDate && (!leaveDate || itemDate <= leaveDate);
    });

    eligibleItems.forEach(item => {
      const eligibleMembers = people.filter(person => {
        const joinDate = new Date(person.date);
        const leaveDate = person.leaveDate ? new Date(person.leaveDate) : null;
        const itemDate = new Date(item.date);
        return joinDate <= itemDate && (!leaveDate || itemDate <= leaveDate);
      });
      const itemShare = item.amount / eligibleMembers.length;
      totalShare += itemShare;
    });

    p.share = parseFloat(totalShare.toFixed(2));
    p.balance = parseFloat(((p.given || 0) - totalShare).toFixed(2));
  });

  renderPeople();
}

// Render People Table
function renderPeople() {
  const table = document.getElementById("peopleTable");
  if (!table) return;
  table.innerHTML = "";
  people.forEach((p, index) => {
    const actionButtons = currentUser && currentUser.role === 'admin'
      ? `<td class="p-2 hidden sm:table-cell">
           <button onclick="setLeaveDate(${index})" class="text-blue-400 hover:underline">Set Leave</button>
           <button onclick="removePerson(${index})" class="text-red-400 ml-3 hover:underline">Remove</button>
         </td>`
      : '<td class="p-2 hidden sm:table-cell"></td>';

    const row = `<tr class="border border-white/20">
      <td class="p-2">${p.date || "-"}</td>
      <td class="p-2">${p.name}</td>
      <td class="p-2">₹${p.given || 0}</td>
      <td class="p-2">₹${p.share || 0}</td>
      <td class="p-2 ${p.balance < 0 ? "text-red-500" : "text-green-600"} font-semibold">
        ${p.balance >= 0 ? "+" : ""}${p.balance || 0}
      </td>
      ${actionButtons}
    </tr>`;
    table.innerHTML += row;
  });
}

// Render Items Table
function renderItems() {
  const table = document.getElementById("itemsTable");
  if (!table) return;
  table.innerHTML = "";

  [...items].reverse().forEach((i, index) => {
    const realIndex = items.length - 1 - index;
    const actionButton = currentUser && currentUser.role === 'admin'
      ? `<td class="p-2 sm:table-cell">
           <button onclick="removeItem(${realIndex})" class="text-red-400 hover:underline">Remove</button>
         </td>`
      : '<td class="p-2 sm:table-cell"></td>';

    const row = `<tr class="border border-white/20">
      <td class="p-2">${i.date}</td>
      <td class="p-2">${i.name}</td>
      <td class="p-2">₹${i.amount}</td>
      <td class="p-2">${i.buyer}</td>
      ${actionButton}
    </tr>`;
    table.innerHTML += row;
  });
}

// Add Person
function addPerson() {
  const name = document.getElementById("addName").value.trim();
  const amount = Number(document.getElementById("addAmount").value);
  const date = document.getElementById("addDate").value;

  if (!name || isNaN(amount) || !date) return;
  if (people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    alert("This name already exists!");
    return;
  }

  people.push({ name, given: amount, date, share: 0, balance: 0, leaveDate: null });

  document.getElementById("addName").value = "";
  document.getElementById("addAmount").value = "";
  document.getElementById("addDate").value = "";

  updateSummary();
}

// Increase Amount
function increaseAmount() {
  const name = document.getElementById("incName").value.trim();
  const amount = Number(document.getElementById("incAmount").value);
  if (!name || isNaN(amount)) return;

  const person = people.find(p => p.name === name);
  if (person) {
    person.given += amount;
  } else {
    alert("Person not found!");
  }

  document.getElementById("incName").value = "";
  document.getElementById("incAmount").value = "";
  updateSummary();
}

// Decrease Amount
function decreaseAmount() {
  const name = document.getElementById("decName").value.trim();
  const amount = Number(document.getElementById("decAmount").value);
  if (!name || isNaN(amount)) return;

  const person = people.find(p => p.name === name);
  if (person) {
    if (person.given >= amount) {
      person.given -= amount;
    } else {
      alert("Amount is greater than available balance!");
    }
  } else {
    alert("Person not found!");
  }

  document.getElementById("decName").value = "";
  document.getElementById("decAmount").value = "";
  updateSummary();
}

// Add Item
// Enhanced add item with smart compression
async function addItem() {
  const date = document.getElementById('itemDate').value;
  const name = document.getElementById('itemName').value;
  const amount = Number(document.getElementById('itemAmount').value);
  const buyer = document.getElementById('purchasedBy').value;
  const imageFile = document.getElementById('itemImage').files[0];

  if (!date || !name || isNaN(amount) || !buyer) return;

  let imageData = null;
  let compressionResult = null;

  if (imageFile) {
    // Check file size before compression (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      alert('Image size too large. Please select an image smaller than 10MB.');
      return;
    }

    try {
      const btn = document.getElementById('added-btn');
      if (btn) {
        btn.innerText = "Compressing...";
        btn.disabled = true;
      }

      // Use smart compression based on file size
      compressionResult = await smartCompressImage(imageFile);
      imageData = compressionResult.dataUrl;

      // Show compression results to user
      const originalKB = (compressionResult.originalSize / 1024).toFixed(2);
      const compressedKB = compressionResult.sizeKB.toFixed(2);
      const reduction = ((1 - compressionResult.sizeKB / (compressionResult.originalSize / 1024)) * 100).toFixed(1);

      console.log(`✅ Compression successful: ${originalKB}KB → ${compressedKB}KB (${reduction}% reduction)`);

      // Optional: Show compression info to user
      setTimeout(() => {
        alert(`Image compressed successfully!\n${originalKB}KB → ${compressedKB}KB (${reduction}% smaller)`);
      }, 100);

    } catch (error) {
      console.error('❌ Compression error:', error);
      alert('Error processing image. Please try again with a different image.');
      return;
    } finally {
      const btn = document.getElementById('added-btn');
      if (btn) {
        btn.innerText = '\uff0b Add Item';
        btn.disabled = false;
      }
    }
  }

  // Add item to the list
  items.push({
    date,
    name,
    amount,
    buyer,
    image: imageData,
    _compression: compressionResult ? {
      originalKB: (compressionResult.originalSize / 1024).toFixed(2),
      compressedKB: compressionResult.sizeKB.toFixed(2),
      quality: compressionResult.quality
    } : null
  });

  // Clear form
  document.getElementById('itemDate').value = "";
  document.getElementById('itemName').value = "";
  document.getElementById('itemAmount').value = "";
  document.getElementById('purchasedBy').value = "";
  document.getElementById('itemImage').value = "";
  document.getElementById('imagePreview').classList.add('hidden');

  updateSummary();

  // Show success message
  const btn = document.getElementById('added-btn');
  if (btn) {
    btn.innerText = "✓ Added!";
    setTimeout(() => (btn.innerText = '\uff0b Add Item'), 2000);
  }
}

// Monitor storage usage
function checkStorageUsage() {
  const itemsData = JSON.stringify(items);
  const peopleData = JSON.stringify(people);
  const totalSize = (itemsData.length + peopleData.length) / 1024; // Size in KB
  
  console.log(`📊 Storage Usage:`);
  console.log(`- Items: ${(itemsData.length / 1024).toFixed(2)}KB`);
  console.log(`- People: ${(peopleData.length / 1024).toFixed(2)}KB`);
  console.log(`- Total: ${totalSize.toFixed(2)}KB`);
  
  // Check image storage specifically
  const imagesSize = items.reduce((total, item) => {
    return total + (item.image ? item.image.length * 0.75 : 0); // Base64 to binary size
  }, 0) / 1024;
  
  console.log(`- Images: ${imagesSize.toFixed(2)}KB`);
  
  // Warn if storage is getting large
  if (totalSize > 5000) { // 5MB warning
    console.warn('⚠️ Storage usage is getting high. Consider clearing old data.');
  }
  
  return totalSize;
}

// Remove Person
function removePerson(index) {
  if (!confirm("Are you sure you want to remove this person?")) return;
  people.splice(index, 1);
  updateSummary();
}

// Remove Item
function removeItem(index) {
  items.splice(index, 1);
  updateSummary();
}

// Settlement Modal
function openSettlement() {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-[#151515] border border-white/10 rounded-xl p-6 w-11/12 sm:w-2/3 lg:w-1/2 shadow-xl">
      <h2 class="text-lg sm:text-xl font-semibold mb-4 text-center">Settlement Details</h2>
      <div class="overflow-x-auto mb-4">
        <table class="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead class="bg-gray-100 text-gray-700 text-sm sm:text-base">
            <tr>
              <th class="p-3 border border-white/10">From</th>
              <th class="p-3 border border-white/10">To</th>
              <th class="p-3 border border-white/10">Amount</th>
            </tr>
          </thead>
          <tbody id="settlementBody" class="text-center text-sm sm:text-base divide-y"></tbody>
        </table>
      </div>
      <div id="kittySection" class="mt-4 p-4 bg-[#4B0082]/5 rounded-lg border border-indigo-500/30 ">
        <h3 class="font-semibold text-indigo-700 mb-2">Remaining Balance</h3>
        <p id="kittyInfo" class="text-gray-600 mb-2"></p>
        <div id="kittyResult" class="text-gray-600 text-sm sm:text-base"></div>
      </div>
      <div class="mt-6 text-center">
        <button id="closeSettlement" class="bg-[#A93A0B]/5 text-red-600 border border-[#A93A0B]/30 hover:bg-[#A93A0B]/15 px-5 py-2 rounded-lg">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const tbody = modal.querySelector("#settlementBody");
  const kittyInfo = modal.querySelector("#kittyInfo");
  const kittyResult = modal.querySelector("#kittyResult");

  const totalGiven = people.reduce((s, p) => s + (Number(p.given) || 0), 0);
  const totalSpent = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const kittyBalance = parseFloat((totalGiven - totalSpent).toFixed(2));

  const balances = {};
  people.forEach(p => (balances[p.name] = Number(p.balance) || 0));

  const settlements = [];
  let creditors = Object.entries(balances).filter(([_, b]) => b > 0).map(([n, b]) => ({ name: n, balance: b }));
  let debtors = Object.entries(balances).filter(([_, b]) => b < 0).map(([n, b]) => ({ name: n, balance: Math.abs(b) }));

  for (let d of debtors) {
    let debtLeft = d.balance;
    for (let c of creditors) {
      if (debtLeft <= 0) break;
      if (c.balance <= 0) continue;
      let settle = Math.min(debtLeft, c.balance);
      if (settle > 0) {
        settlements.push({ from: d.name, to: c.name, amount: settle });
        c.balance -= settle;
        balances[d.name] += settle;
        balances[c.name] -= settle;
        debtLeft -= settle;
      }
    }
  }

  if (settlements.length) {
    settlements.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="p-3 border border-white/10">${s.from}</td>
                      <td class="p-3 border border-white/10">${s.to}</td>
                      <td class="p-3 border border-white/10">₹${s.amount.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" class="p-3 text-gray-500 text-center">No settlements needed</td>`;
    tbody.appendChild(tr);
  }

  kittyInfo.textContent = `Total Given: ₹${totalGiven.toFixed(2)} • Total Spent: ₹${totalSpent.toFixed(2)} • Remaining: ₹${kittyBalance.toFixed(2)}`;

  kittyResult.innerHTML = "";
  if (kittyBalance > 0) {
    const remainingCreditors = Object.entries(balances).filter(([_, b]) => b > 0);
    const totalPositive = remainingCreditors.reduce((s, [_, b]) => s + b, 0);
    let assigned = 0;
    remainingCreditors.forEach(([name, bal], idx) => {
      const rawShare = (bal / totalPositive) * kittyBalance;
      if (idx < remainingCreditors.length - 1) {
        const share = Math.round(rawShare * 100) / 100;
        kittyResult.innerHTML += `<p>${name} gets back <strong>₹${share.toFixed(2)}</strong></p>`;
        assigned += share;
      } else {
        const last = Math.round((kittyBalance - assigned) * 100) / 100;
        kittyResult.innerHTML += `<p>${name} gets back <strong>₹${last.toFixed(2)}</strong></p>`;
      }
    });
  } else {
    kittyResult.innerHTML = `<p class="text-gray-600">No extra money left.</p>`;
  }

  modal.querySelector("#closeSettlement").addEventListener("click", () => modal.remove());
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication for all pages except login
  if (!window.location.href.includes('authen.html')) {
    protectPage();
  }
  // Initialize image upload handler if on main page
  if (document.getElementById('itemImage')) {
    handleImageUpload();
  }


  // Initialize app if on main page
  if (document.getElementById('peopleTable')) {
    updateSummary();
  }

  // Check storage usage (optional)
  setTimeout(() => {
    checkStorageUsage();
  }, 1000);

  // Initialize previous records if on that page
  if (document.getElementById('recordsList')) {
    renderPreviousRecords();
  }
});

function saveAndClear() {
  const confirmSave = confirm("Do you want to save and clear the current data?");
  if (!confirmSave) {
    return; // user clicked "No"
  }

  // --- compute kitty summary
  const totalGiven = people.reduce((s, p) => s + (Number(p.given) || 0), 0);
  const totalSpent = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const kittyBalance = parseFloat((totalGiven - totalSpent).toFixed(2));

  // --- clone balances for settlement calculation
  const balances = {};
  people.forEach(p => balances[p.name] = Number(p.balance) || 0);

  const settlements = [];
  let creditors = Object.entries(balances)
    .filter(([_, bal]) => bal > 0)
    .map(([name, bal]) => ({ name, balance: bal }));

  let debtors = Object.entries(balances)
    .filter(([_, bal]) => bal < 0)
    .map(([name, bal]) => ({ name, balance: Math.abs(bal) }));

  // --- compute settlement matching
  for (let d of debtors) {
    let debtLeft = d.balance;
    for (let c of creditors) {
      if (debtLeft <= 0) break;
      if (c.balance <= 0) continue;

      let settle = Math.min(debtLeft, c.balance);
      if (settle > 0) {
        settlements.push({ from: d.name, to: c.name, amount: parseFloat(settle.toFixed(2)) });
        c.balance -= settle;
        balances[d.name] += settle;
        balances[c.name] -= settle;
        debtLeft -= settle;
      }
    }
  }

  // --- create record
  const record = {
    dateSaved: new Date().toISOString(),
    people: [...people],
    items: [...items],
    kitty: {
      totalGiven: parseFloat(totalGiven.toFixed(2)),
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      kittyBalance
    },
    settlements
  };

  // --- save in previousRecords
  let previousRecords = JSON.parse(localStorage.getItem("previousRecords")) || [];
  previousRecords.push(record);
  localStorage.setItem("previousRecords", JSON.stringify(previousRecords));

  // --- clear current data
  people = [];
  items = [];
  saveData();
  updateSummary();

  alert("✅ Record saved successfully! Data has been cleared.");
}

// Render Previous Records
function renderPreviousRecords() {
  const container = document.getElementById("recordsList");
  const previousRecords = JSON.parse(localStorage.getItem("previousRecords")) || [];
  container.innerHTML = "";

  if (previousRecords.length === 0) {
    container.innerHTML = "<p class='text-gray-400'>No saved records yet.</p>";
    return;
  }

  previousRecords.forEach((record, index) => {
    // create card container
    const card = document.createElement("div");
    card.className = "bg-[#151515] border border-white/10 rounded-xl p-4 shadow-md";

    // header (clickable to expand)
    card.innerHTML = `
          <div class="flex items-center justify-between cursor-pointer" onclick="toggleDetails(${index})">
           <h2 class="text-lg font-semibold">Record ${index + 1} — ${new Date(record.dateSaved).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</h2>
            <span id="toggleIcon-${index}" class="text-gray-400">\uff0b</span>
          </div>
          <div id="details-${index}" class="hidden mt-4 space-y-4">
            
            <h3 class="text-md text-gray-400 font-semibold">People</h3>
            <table class="w-full text-sm border border-white/20">
              <thead class="bg-white/10">
                <tr>
                  <th class="p-2">Name</th>
                  <th class="p-2">Given</th>
                  <th class="p-2">Share</th>
                  <th class="p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${record.people.map(p => `
                  <tr>
                    <td class="p-2 border border-white/10">${p.name}</td>
                    <td class="p-2 border border-white/10">₹${p.given}</td>
                    <td class="p-2 border border-white/10">₹${p.share}</td>
                    <td class="p-2 border border-white/10">${p.balance}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <h3 class="text-md text-gray-400 font-semibold">Items</h3>
            <table class="w-full text-sm border border-white/20">
              <thead class="bg-white/10">
                <tr>
                  <th class="p-2 border border-white/10">Date</th>
                  <th class="p-2 border border-white/10">Item</th>
                  <th class="p-2 border border-white/10">Amount</th>
                  <th class="p-2 border border-white/10">Buyer</th>
                </tr>
              </thead>
              <tbody>
                ${record.items.map(i => `
                  <tr>
                    <td class="p-2 border border-white/10">${i.date}</td>
                    <td class="p-2 border border-white/10">${i.name}</td>
                    <td class="p-2 border border-white/10">₹${i.amount}</td>
                    <td class="p-2 border border-white/10">${i.buyer}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <h3 class="text-md text-gray-400 font-semibold">Summary</h3>
            <div class="bg-black/30 p-3 rounded-lg border border-white/20">
              <p><strong>Total Given:</strong> ₹${record.kitty.totalGiven}</p>
              <p><strong>Total Spent:</strong> ₹${record.kitty.totalSpent}</p>
              <p><strong>Kitty Balance:</strong> ₹${record.kitty.kittyBalance}</p>
            </div>

            ${record.settlements && record.settlements.length > 0 ? `
              <h3 class="text-md text-gray-400 font-semibold">Settlements</h3>
              <table class="w-full text-sm border border-white/20">
                <thead class="bg-white/10">
                  <tr>
                    <th class="p-2 border border-white/10">From</th>
                    <th class="p-2 border border-white/10">To</th>
                    <th class="p-2 border border-white/10">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${record.settlements.map(s => `
                    <tr>
                      <td class="p-2 border border-white/10">${s.from}</td>
                      <td class="p-2 border border-white/10">${s.to}</td>
                      <td class="p-2 border border-white/10">₹${s.amount}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : `<p class="text-gray-400">No settlements recorded.</p>`}

            ${currentUser && currentUser.role === 'admin' ? `
            <button onclick="deleteRecord(${index})" 
             class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-3"> Delete Record </button>` : ''}`;
    container.appendChild(card);
  });
}

function toggleDetails(index) {
  const details = document.getElementById(`details-${index}`);
  const icon = document.getElementById(`toggleIcon-${index}`);
  if (details.classList.contains("hidden")) {
    details.classList.remove("hidden");
    icon.textContent = "\uFF0D"; // minus sign
  } else {
    details.classList.add("hidden");
    icon.textContent = "\uff0b";// plus sign
  }
}

function deleteRecord(index) {
  const confirmDelete = confirm("Are you sure you want to delete this record?");
  if (!confirmDelete) {
    return;
  }

  let records = JSON.parse(localStorage.getItem("previousRecords")) || [];
  records.splice(index, 1);
  localStorage.setItem("previousRecords", JSON.stringify(records));
  renderPreviousRecords();

  alert("Record deleted successfully!");
}
renderPreviousRecords();

// Image handling functions
function handleImageUpload() {
  const fileInput = document.getElementById('itemImage');
  const preview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');

  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
        preview.classList.remove('hidden');
      }
      reader.readAsDataURL(file);
    } else {
      preview.classList.add('hidden');
    }
  });
}

// Convert image to base64 for storage
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Updated Add Item function
async function addItem() {
  const date = document.getElementById('itemDate').value;
  const name = document.getElementById('itemName').value;
  const amount = Number(document.getElementById('itemAmount').value);
  const buyer = document.getElementById('purchasedBy').value;
  const imageFile = document.getElementById('itemImage').files[0];

  if (!date || !name || isNaN(amount) || !buyer) return;

  let imageData = null;
  if (imageFile) {
    try {
      imageData = await imageToBase64(imageFile);
    } catch (error) {
      console.error('Error converting image:', error);
      alert('Error uploading image. Please try again.');
      return;
    }
  }

  items.push({ date, name, amount, buyer, image: imageData });

  // Clear form
  document.getElementById('itemDate').value = "";
  document.getElementById('itemName').value = "";
  document.getElementById('itemAmount').value = "";
  document.getElementById('purchasedBy').value = "";
  document.getElementById('itemImage').value = "";
  document.getElementById('imagePreview').classList.add('hidden');

  updateSummary();
  const btn = document.getElementById('added-btn');
  if (btn) {
    btn.innerText = "Added!";
    setTimeout(() => (btn.innerText = '\uff0b Add Item'), 2000);
  }
}

// Updated Render Items function
function renderItems() {
  const table = document.getElementById("itemsTable");
  if (!table) return;
  table.innerHTML = "";

  [...items].reverse().forEach((i, index) => {
    const realIndex = items.length - 1 - index;
    const actionButton = currentUser && currentUser.role === 'admin'
      ? `<td class="p-2  sm:table-cell">
           <button onclick="removeItem(${realIndex})" class="text-red-400 admin-only hover:underline">Remove</button>
         </td>`
      : '<td class="p-2 sm:table-cell"></td>';

    const imageCell = i.image
      ? `<td class="p-2">
           <img src="${i.image}" alt="${i.name}" class="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg cursor-pointer" onclick="openImageModal('${i.image}', '${i.name}')">
         </td>`
      : '<td class="p-2"><div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-lg flex items-center justify-center"><span class="text-gray-400 text-xs">No Image</span></div></td>';

    const row = `<tr class="border border-white/20">
      <td class="p-2">${i.date}</td>
      ${imageCell}
      <td class="p-2">${i.name}</td>
      <td class="p-2">₹${i.amount}</td>
      <td class="p-2">${i.buyer}</td>
      ${actionButton}
    </tr>`;
    table.innerHTML += row;
  });
}

// Image Modal function
function openImageModal(imageSrc, itemName) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-white/10">
        <h3 class="text-white font-semibold text-lg">${itemName}</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>
      <div class="p-4 flex justify-center">
        <img src="${imageSrc}" alt="${itemName}" class="max-w-full max-h-[70vh] object-contain rounded-lg">
      </div>
      <div class="p-4 border-t border-white/10 text-center">
        <button onclick="this.closest('.fixed').remove()" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal when clicking outside image
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}



