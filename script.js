// ---------------- AUTH SYSTEM ----------------

// Load users from localStorage or set default admin
let users = JSON.parse(localStorage.getItem("users")) || [
  { username: 'Max', password: 'admin@123', role: 'admin' }
];

let currentUser = null;

// Save users
function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

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
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location.href = './index.html';
  } else {
    document.getElementById('errorMsg').classList.remove('hidden');
  }
}

// Logout
function logout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  window.location.href = './authen.html';
}

// Apply permissions
function applyUserPermissions() {
  if (!currentUser) return;

  if (currentUser.role === 'user') {
    // Hide admin-only elements
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-action').forEach(el => {
      el.disabled = true;
      el.classList.add('opacity-50', 'cursor-not-allowed');
    });
  }

  const purchasedBy = document.getElementById("purchasedBy");
  if (purchasedBy) purchasedBy.value = currentUser.username;

  updateNavbar();
}


// ---------------- USER MANAGEMENT (ADMIN) ----------------

function addUser() {
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password!");
    return;
  }

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    alert("Username already exists!");
    return;
  }

  users.push({ username, password, role: "user" });
  saveUsers();
  renderUsers();

  document.getElementById("newUsername").value = "";
  document.getElementById("newPassword").value = "";
  alert("✅ User added successfully!");
}

function resetPassword(username) {
  const newPass = prompt(`Enter new password for ${username}:`);
  if (!newPass) return;

  const user = users.find(u => u.username === username);
  if (user) {
    user.password = newPass;
    saveUsers();
    alert("✅ Password reset successfully!");
  }
}

function deleteUser(username) {
  if (!confirm(`Are you sure you want to delete ${username}?`)) return;
  users = users.filter(u => u.username !== username);
  saveUsers();
  renderUsers();
  alert("❌ User deleted!");
}

function renderUsers() {
  const table = document.getElementById("userTable");
  if (!table) return;
  table.innerHTML = "";

  users.forEach(u => {
    if (u.role === "admin") return;
    const row = `
      <tr class="border border-white/10">
        <td class="p-2">${u.username}</td>
        <td class="p-2">${u.role}</td>
        <td class="p-2">
          <button onclick="resetPassword('${u.username}')" class="text-blue-400 hover:underline">Reset</button>
          <button onclick="deleteUser('${u.username}')" class="text-red-400 hover:underline ml-2">Delete</button>
        </td>
      </tr>
    `;
    table.innerHTML += row;
  });
}

// ---------------- NOTIFICATIONS ----------------

// Global notifications store
function getAllNotifications() {
  return JSON.parse(localStorage.getItem("notifications")) || [];
}
function saveAllNotifications(notifs) {
  localStorage.setItem("notifications", JSON.stringify(notifs));
}

// Per-user read state
function getReadNotifications(username) {
  return JSON.parse(localStorage.getItem(`notifications_read_${username}`)) || [];
}
function saveReadNotifications(username, readIds) {
  localStorage.setItem(`notifications_read_${username}`, JSON.stringify(readIds));
}

// Add global notification
function addNotification(message) {
  let allNotifs = getAllNotifications();
  const formattedTime = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const newNotif = {
    id: Date.now(),
    message,
    time: formattedTime 
  };

  allNotifs.push(newNotif);
  saveAllNotifications(allNotifs);
  renderNotifications();
}

// Render notifications
function renderNotifications() {
  const notifCount = document.getElementById("notifCount");
  const notifList = document.getElementById("notifList");
  if (!notifCount || !notifList || !currentUser) return;

  const allNotifs = getAllNotifications();
  const readIds = getReadNotifications(currentUser.username);

  notifList.innerHTML = "";

  const unread = allNotifs.filter(n => !readIds.includes(n.id));
  if (unread.length === 0) {
    notifCount.classList.add("hidden");
  } else {
    notifCount.textContent = unread.length;
    notifCount.classList.remove("hidden");
  }

  if (allNotifs.length === 0) {
    notifList.innerHTML = `<p class="px-4 py-2 text-gray-400">No notifications</p>`;
  } else {
    allNotifs.slice().reverse().forEach(n => {
      const isRead = readIds.includes(n.id);
      notifList.innerHTML += `
        <div class="px-4 py-2 hover:bg-white/10 cursor-pointer border-b border-white/5 ${isRead ? 'opacity-50' : ''}">
          <p>${n.message}</p>
          <p class="text-xs text-gray-500">${n.time}</p>
        </div>`;
    });
  }
}

// Clear notifications
function clearNotifications() {
  if (!currentUser) return;
  const allNotifs = getAllNotifications();
  const allIds = allNotifs.map(n => n.id);
  saveReadNotifications(currentUser.username, allIds);
  renderNotifications();
}
// Reset all notifications (admin)
function resetNotifications() {
  localStorage.removeItem("notifications");
  if (currentUser) {
    localStorage.removeItem(`notifications_read_${currentUser.username}`);
  }
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('notifications_read_')) {
      localStorage.removeItem(key);
    }
  });

  renderNotifications();
}


// ---------------- NAVBAR ----------------
function updateNavbar() {
  const navbar = document.querySelector('nav .max-w-6xl');
  if (!navbar) return;
  if (document.getElementById('userDropdown')) return;

  const userDropdown = document.createElement('div');
  userDropdown.className = 'relative flex  items-center space-x-8';
  userDropdown.id = 'userDropdown';
  userDropdown.innerHTML = `
  <div id="notificationsDropdown" class="relative">
    <button id="notifBtn" class="relative text-xl">
      <img src="./images/bell.png" class="h-6 inline w-6" alt="Notifications">
      <span id="notifCount" class="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full hidden"></span>
    </button>
    <div id="notifMenu" 
     class="fixed top-20 left-1/2 -translate-x-1/2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl py-2 hidden z-50
            md:absolute md:top-auto md:left-auto md:translate-x-0 md:right-0 md:mt-2">
  <div class="flex justify-between items-center px-4 py-2 border-b border-white/10">
    <span class="text-gray-300 text-sm">Notifications</span>
    <button onclick="clearNotifications()" class="text-xs text-blue-400 hover:underline">
      Mark as view
    </button>
  </div>
  <div id="notifList" class="max-h-[80vh]  overflow-y-auto text-sm text-gray-300"></div>
  </div>
  </div>

  <div class="relative">
    <button id="userMenuBtn" class="flex items-center space-x-2 text-gray-300 hover:text-white transition">
      <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
        ${currentUser.username.charAt(0).toUpperCase()}
      </div>
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"/>
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
  </div>
`;

  navbar.appendChild(userDropdown);

  let blurOverlay = document.getElementById('blurOverlay');
  if (!blurOverlay) {
    blurOverlay = document.createElement('div');
    blurOverlay.id = 'blurOverlay';
    blurOverlay.className = 'fixed inset-0 backdrop-blur-sm bg-black/50 hidden z-40'; 
    document.body.appendChild(blurOverlay);
  }

  const toggleOverlay = (show) => {
    if (show) {
      blurOverlay.classList.remove('hidden');
    } else {
      blurOverlay.classList.add('hidden');
    }
  };

  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdownMenu = document.getElementById('userDropdownMenu');

  userMenuBtn.addEventListener('click', e => {
    e.stopPropagation();
    userDropdownMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => userDropdownMenu.classList.add('hidden'));

  const notifBtn = document.getElementById("notifBtn");
  const notifMenu = document.getElementById("notifMenu");
  
  if (notifBtn) {
    notifBtn.addEventListener("click", e => {
      e.stopPropagation();
      notifMenu.classList.toggle("hidden");
      toggleOverlay(!notifMenu.classList.contains("hidden")); 
    });
  }

  document.addEventListener("click", () => {
    if (notifMenu) {
        notifMenu.classList.add("hidden");
        toggleOverlay(false); 
    }
  });

  blurOverlay.addEventListener('click', () => {
    notifMenu.classList.add("hidden");
    toggleOverlay(false);
  });
  
  renderNotifications();
}

  // ---------------- PROTECT PAGES ----------------
  function protectPage() {
    if (!checkAuth()) {
      window.location.href = './authen.html';
    }
  }

  // ---------------- TOGGLE MOBILE MENU ----------------
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // ---------------- DATA ----------------
  let people = JSON.parse(localStorage.getItem("people")) || [];
  let items = JSON.parse(localStorage.getItem("items")) || [];

  // Save data
  function saveData() {
    localStorage.setItem("people", JSON.stringify(people));
    localStorage.setItem("items", JSON.stringify(items));
  }

  // ---------------- SUMMARY & BALANCES ----------------
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
        totalShare += item.amount / eligibleMembers.length;
      });

      p.share = parseFloat(totalShare.toFixed(2));
      p.balance = parseFloat(((p.given || 0) - totalShare).toFixed(2));
    });

    renderPeople();
  }

  // ---------------- RENDER PEOPLE ----------------
  function renderPeople() {
    const table = document.getElementById("peopleTable");
    if (!table) return;
    table.innerHTML = "";

    people.forEach((p, index) => {
      const actionButtons = currentUser && currentUser.role === 'admin'
        ? `<td class="p-2 admin-only sm:table-cell">
           <button onclick="setLeaveDate(${index})" class="text-blue-400 hover:underline">Set Leave</button>
           <button onclick="removePerson(${index})" class="text-red-400 ml-3 hover:underline">Remove</button>
         </td>`
        : '<td class="p-2 admin-only sm:table-cell"></td>';

      // ✅ If leaveDate exists, add blue indicator
      const leaveIndicator = p.leaveDate
        ? `<span onclick="showLeaveDate('${p.name}', '${p.leaveDate}')" 
                class=" text-green-400 text-lg cursor-pointer" 
                title="Click to see leave date"><img class = "h-2 inline" src="./images/dot.png"></span>`
        : "";

      const row = `<tr class="border border-white/20">
      <td class="p-2">${p.date || "-"}</td>
      <td class="p-2">${p.name} ${leaveIndicator}</td>
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
  // Show leave date alert
  function showLeaveDate(name, leaveDate) {
    alert(`${name}'s Leave Date: ${new Date(leaveDate).toLocaleDateString()}`);
  }



  // ---------------- RENDER ITEMS ----------------
  function renderItems() {
    const table = document.getElementById("itemsTable");
    if (!table) return;
    table.innerHTML = "";

    [...items].reverse().forEach((i, index) => {
      const realIndex = items.length - 1 - index;
      const actionButton = currentUser && currentUser.role === 'admin'
        ? `<td class="p-2 admin-only sm:table-cell">
           <button onclick="removeItem(${realIndex})" class="text-red-400 hover:underline">Remove</button>
         </td>`
        : '<td class="p-2 admin-only sm:table-cell"></td>';

      const row = `<tr class="border border-white/20">
      <td class="p-2 text-gray-400">${i.date}</td>
      <td class="p-2">${i.name}</td>
      <td class="p-2 text-red-600">₹${i.amount}</td>
      <td class="p-2 text-blue-400">${i.buyer}</td>
      ${actionButton}
    </tr>`;
      table.innerHTML += row;
    });
  }

  // ---------------- ADD/REMOVE PEOPLE ----------------
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
    addNotification(`<strong>${currentUser.username}</strong> added new person <strong>${name}</strong> with ₹${amount}`);
  }


  function increaseAmount() {
    const name = document.getElementById("incName").value.trim();
    const amount = Number(document.getElementById("incAmount").value);
    if (!name || isNaN(amount)) return;

    const person = people.find(p => p.name === name);
    if (person) {
      person.given += amount;
      addNotification(`<strong>${currentUser.username}</strong> increased <strong>${name}'s</strong> amount by ₹${amount}`);
    } else {
      alert("Person not found!");
    }

    document.getElementById("incName").value = "";
    document.getElementById("incAmount").value = "";
    updateSummary();
  }

  function decreaseAmount() {
    const name = document.getElementById("decName").value.trim();
    const amount = Number(document.getElementById("decAmount").value);
    if (!name || isNaN(amount)) return;

    const person = people.find(p => p.name === name);
    if (person) {
      if (person.given >= amount) {
        person.given -= amount;
        addNotification(`<strong>${currentUser.username}</strong> decreased <strong>${name}'s</strong> amount by ₹${amount}`);
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


  // ---------------- ADD ITEM ----------------
  function addItem() {
    const date = document.getElementById("itemDate").value;
    const name = document.getElementById("itemName").value;
    const amount = Number(document.getElementById("itemAmount").value);
    const buyer = document.getElementById("purchasedBy").value;

    // Simple validation without complex regex
    const itemNameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9 ,]+$/;

    if (!date || !name || isNaN(amount) || !buyer) {
      alert("Please fill in all required fields.");
      return;
    }

    if (amount <= 0) {
      alert("Item Amount cannot be zero or a negative value.");
      document.getElementById("itemAmount").focus();
      return;
    }

    if (!itemNameRegex.test(name)) {
      alert("Item Name must contain only letters, numbers, spaces, and commas. It must include at least one letter.");
      document.getElementById("itemName").focus();
      return;
    }

    // Check joining date restriction
    if (people.length > 0) {
      const earliestJoin = new Date(Math.min(...people.map(p => new Date(p.date).getTime())));
      if (new Date(date) < earliestJoin) {
        alert("❌ Cannot add item before the first person's joining date.");
        return;
      }
    }

    items.push({ date, name, amount, buyer });

    document.getElementById("itemDate").value = "";
    document.getElementById("itemName").value = "";
    document.getElementById("itemAmount").value = "";
    document.getElementById("purchasedBy").value = "";

    if (currentUser) {
      document.getElementById("purchasedBy").value = currentUser.username;
    }

    document.getElementById("popup-message").classList.remove("opacity-0");
    setTimeout(() => {
      document.getElementById("popup-message").classList.add("opacity-0");
    }, 2000);

    updateSummary();
    addNotification(`<strong>${currentUser.username}</strong> purchased item <strong>${name}</strong> of ₹${amount}`);
  }


  // ---------------- ADMIN ACTIONS ----------------
  function setLeaveDate(index) {
    const date = prompt("Enter leave date (YYYY-MM-DD):");
    if (!date) return;
    people[index].leaveDate = date;
    updateSummary();
    addNotification(`<strong>${currentUser.username}</strong> set leave date for <strong>${people[index].name}</strong> to ${date}`);
  }

  function removePerson(index) {
    if (!confirm("Are you sure you want to remove this person?")) return;
    const removed = people[index];
    people.splice(index, 1);
    updateSummary();
    addNotification(`<strong>${currentUser.username}</strong> removed person <strong>${removed.name}</strong>`);
  }

  function removeItem(index) {
    if (!confirm("Are you sure you want to remove this item?")) return;
    if (index < 0 || index >= items.length) return;

    const removed = items[index];
    items.splice(index, 1);
    updateSummary();

    const actor = (currentUser && currentUser.username) ? currentUser.username : 'Unknown';
    addNotification(`<strong>${actor}</strong> removed item <strong>${removed.name}</strong> of ₹${removed.amount}`);
  }
  // ---------------- SETTLEMENT ----------------
  function openSettlement() {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50";
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

    // Initialize app if on main page
    if (document.getElementById('peopleTable')) {
      updateSummary();
    }

    // Initialize previous records if on that page
    if (document.getElementById('recordsList')) {
      renderPreviousRecords();
    }
  });
  // ---------------- SAVE & CLEAR ----------------
  function saveAndClear() {
    const confirmSave = confirm("Do you want to save and clear the current data?");
    if (!confirmSave) return;

    // nothing to save?
    if ((!people || people.length === 0) && (!items || items.length === 0)) {
      alert("Nothing to save. Add people or items first.");
      return;
    }

    // --- compute kitty summary
    const totalGiven = people.reduce((s, p) => s + (Number(p.given) || 0), 0);
    const totalSpent = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const kittyBalance = parseFloat((totalGiven - totalSpent).toFixed(2));

    // --- clone balances for settlement calculation (don't mutate original people objects)
    const balances = {};
    people.forEach(p => balances[p.name] = Number(p.balance) || 0);

    const settlements = [];
    const creditors = Object.entries(balances)
      .filter(([_, bal]) => bal > 0)
      .map(([name, bal]) => ({ name, balance: bal }));

    const debtors = Object.entries(balances)
      .filter(([_, bal]) => bal < 0)
      .map(([name, bal]) => ({ name, balance: Math.abs(bal) }));

    // --- compute settlement matching (uses local creditor/debtor copies)
    for (let d of debtors) {
      let debtLeft = d.balance;
      for (let c of creditors) {
        if (debtLeft <= 0) break;
        if (c.balance <= 0) continue;

        let settle = Math.min(debtLeft, c.balance);
        if (settle > 0) {
          settlements.push({
            from: d.name,
            to: c.name,
            amount: parseFloat(settle.toFixed(2))
          });
          c.balance -= settle;
          debtLeft -= settle;
        }
      }
    }

    // --- create record (deep clone people/items to freeze state)
    const record = {
      dateSaved: new Date().toISOString(),
      people: JSON.parse(JSON.stringify(people)),
      items: JSON.parse(JSON.stringify(items)),
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

    // --- clear current data and persist
    people = [];
    items = [];
    saveData();
    updateSummary();
    resetNotifications();// reset all users' read state to force seeing new notification

    if (document.getElementById("recordsList")) {
      renderPreviousRecords();
    }

    // --- add a global notification
    try {
      addNotification(`<strong>${currentUser && currentUser.username ? currentUser.username : "Someone"}</strong> saved a record and cleared current data and notifications(saved on ${new Date(record.dateSaved).toLocaleString()})`);
    } catch (e) {
      console.warn("addNotification failed:", e);
    }
    alert("✅ Record saved successfully! Data has been cleared.");
  }


  // ---------------- RENDER PREVIOUS RECORDS ----------------
  function renderPreviousRecords() {
    const container = document.getElementById("recordsList");
    if (!container) return;
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

      card.innerHTML = `
      <div class="flex items-center justify-between cursor-pointer" onclick="toggleDetails(${index})">
        <h2 class="text-lg font-semibold">Record ${index + 1} — ${new Date(record.dateSaved).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</h2>
        <span id="toggleIcon-${index}" class="text-gray-400">\uff0b</span>
      </div>
      <div id="details-${index}" class="hidden mt-4 space-y-4">
        <h3 class="text-md text-gray-400 font-semibold">Persons</h3>
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
          <p><strong>Remaining Balance:</strong> ₹${record.kitty.kittyBalance}</p>
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
          <button onclick="deleteRecord(${index})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-3"> Delete Record </button>
        ` : ''}
      </div>
    `;
      container.appendChild(card);
    });
  }


  // toggle expand/collapse
  function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const icon = document.getElementById(`toggleIcon-${index}`);
    if (!details || !icon) return;
    if (details.classList.contains("hidden")) {
      details.classList.remove("hidden");
      icon.textContent = "\uFF0D";
    } else {
      details.classList.add("hidden");
      icon.textContent = "\uff0b";
    }
  }

  // delete a saved record (admin only)
  function deleteRecord(index) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    let records = JSON.parse(localStorage.getItem("previousRecords")) || [];
    if (index < 0 || index >= records.length) return;

    // Get the record before deleting it to access its dateSaved field
    const deletedRecord = records[index];

    records.splice(index, 1);
    localStorage.setItem("previousRecords", JSON.stringify(records));
    renderPreviousRecords();

    // Format the date from the record's dateSaved field
    const recordDate = new Date(deletedRecord.dateSaved);
    const formattedDate = recordDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    addNotification(`<strong>${currentUser && currentUser.username ? currentUser.username : 'Someone'}</strong> deleted saved record from ${formattedDate}`);
    alert("Record deleted successfully!");
  }
  // ---------------- INIT ----------------
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.location.href.includes('authen.html')) {
      protectPage();
    }
    if (document.getElementById('peopleTable')) {
      updateSummary();
    }
    if (document.getElementById('recordsList')) {
      renderPreviousRecords();
    }
  });
