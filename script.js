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
    const row = `<tr class="border border-white/20">
      <td class="p-2">${p.date || "-"}</td>
      <td class="p-2">${p.name}</td>
      <td class="p-2">₹${p.given || 0}</td>
      <td class="p-2">₹${p.share || 0}</td>
      <td class="p-2 ${p.balance < 0 ? "text-red-500" : "text-green-600"} font-semibold">
        ${p.balance >= 0 ? "+" : ""}${p.balance || 0}
      </td>
      <td class="p-2 hidden sm:table-cell">
        <button onclick="setLeaveDate(${index})" class="text-blue-400 hover:underline">Set Leave</button>
        <button onclick="removePerson(${index})" class="text-red-400 ml-3 hover:underline">Remove</button>
      </td>
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
    const row = `<tr class="border border-white/20">
      <td class="p-2">${i.date}</td>
      <td class="p-2">${i.name}</td>
      <td class="p-2">₹${i.amount}</td>
      <td class="p-2">${i.buyer}</td>
      <td class="p-2 hidden sm:table-cell">
        <button onclick="removeItem(${realIndex})" class="text-red-400 hover:underline">Remove</button>
      </td>
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
function addItem() {
  const date = document.getElementById("itemDate").value;
  const name = document.getElementById("itemName").value;
  const amount = Number(document.getElementById("itemAmount").value);
  const buyer = document.getElementById("purchasedBy").value;
  if (!date || !name || isNaN(amount) || !buyer) return;

  items.push({ date, name, amount, buyer });

  document.getElementById("itemDate").value = "";
  document.getElementById("itemName").value = "";
  document.getElementById("itemAmount").value = "";
  document.getElementById("purchasedBy").value = "";

  updateSummary();
  const btn = document.getElementById("added-btn");
  if (btn) {
    btn.innerText = "Added!";
    setTimeout(() => (btn.innerText = '\uff0b Add Item'), 2000);
  }
}

// Set Leave Date
function setLeaveDate(index) {
  const leaveDate = prompt("Enter leave date (YYYY-MM-DD):");
  if (leaveDate) {
    people[index].leaveDate = leaveDate;
    updateSummary();
  }
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

// Open Settlement Modal (unchanged logic, minor cleanup)
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

// Init
updateSummary();
