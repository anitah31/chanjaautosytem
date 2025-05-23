document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase
  const firebaseConfig = {
      apiKey: "AIzaSyCApEWbJdlmtbT8TyIMugaX5NXOO_5A-No",
      authDomain: "chanja-autos-d346c.firebaseapp.com",
      projectId: "chanja-autos-d346c",
      storageBucket: "chanja-autos-d346c.appspot.com",
      messagingSenderId: "316212921555",
      appId: "1:316212921555:web:6d57b5fa4a59d4b05a4026",
      measurementId: "G-6204GSZFKC"
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  // DOM Elements
  const salesForm = document.getElementById('salesForm');
  const salesTableBody = document.getElementById('salesTableBody');
  const creditForm = document.getElementById('creditForm');
  const creditTableBody = document.getElementById('creditTableBody');
  const totalSalesElement = document.getElementById('totalSales');
  const viewSalesBtn = document.getElementById('viewSales');
  const viewCreditsBtn = document.getElementById('viewCredits');
  const filterDateInput = document.getElementById('filterDate');
  const filterByDateBtn = document.getElementById('filterByDate');

  // ==================== FIRESTORE OPERATIONS ====================

  // 1. Load Initial Data
  function initializeApp() {
      // Initial load of sales and credits
      loadSales();
      loadCredits();
  }

  // Add delete functionality to existing table rows
  function addDeleteButton(row, collection, docId) {
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this record?')) {
              try {
                  await db.collection(collection).doc(docId).delete();
                  row.remove();

                  // If deleting a sale, attempt to increment stock (best effort, might need adjustments)
                  if (collection === 'sales') {
                      const itemName = row.cells[2].textContent;
                      const itemsSold = parseInt(row.cells[3].textContent);
                      const stockRef = db.collection('stockmgt');
                      const query = stockRef.where('itemName', '==', itemName);
                      const snapshot = await query.get();
                      if (!snapshot.empty) {
                          snapshot.forEach(doc => {
                              stockRef.doc(doc.id).update({
                                  quantity: firebase.firestore.FieldValue.increment(itemsSold)
                              });
                          });
                      }
                  }
              } catch (error) {
                  alert('Error deleting record: ' + error.message);
              }
          }
      });

      const actionCell = row.insertCell(-1);
      actionCell.appendChild(deleteBtn);
  }

  // Enhanced loadSales with delete buttons
  function loadSales(query = db.collection("sales").orderBy("timestamp", "desc")) {
      query.onSnapshot((snapshot) => {
          salesTableBody.innerHTML = '';
          let total = 0;

          snapshot.forEach(doc => {
              const sale = doc.data();
              total += sale.amount;

              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${sale.date}</td>
                  <td>${sale.clientName}</td>
                  <td>${sale.itemSold}</td>
                  <td>${sale.quantitySold}</td>
                  <td>KSH ${sale.amount.toFixed(2)}</td>
              `;

              addDeleteButton(row, 'sales', doc.id);
              salesTableBody.appendChild(row);
          });

          totalSalesElement.textContent = total.toFixed(2);
      });
  }

  // Enhanced loadCredits with delete buttons and status
  function loadCredits(query = db.collection("credits").orderBy("timestamp", "desc")) {
      query.onSnapshot((snapshot) => {
          creditTableBody.innerHTML = '';

          snapshot.forEach(doc => {
              const credit = doc.data();
              const balance = credit.amount - credit.paid;
              const isOverdue = balance > 0 && new Date(credit.dueDate) < new Date();
              const isCleared = balance <= 0 || credit.status === "cleared";

              const row = document.createElement('tr');
              row.className = isOverdue ? 'overdue' : '';
              row.innerHTML = `
                  <td>${credit.client}</td>
                  <td>KSH ${credit.amount.toFixed(2)}</td>
                  <td>KSH ${credit.paid.toFixed(2)}</td>
                  <td>KSH ${balance.toFixed(2)}</td>
                  <td>${credit.dueDate}</td>
                  <td class="status-cell">
                      <span class="status-badge ${isCleared ? 'cleared' : 'pending'}">
                          ${isCleared ? 'CLEARED' : 'PENDING'}
                      </span>
                  </td>
                  <td>
                      <button class="record-payment" data-id="${doc.id}">Add Payment</button>
                  </td>
              `;

              addDeleteButton(row, 'credits', doc.id);
              creditTableBody.appendChild(row);
          });
      });
  }

  // 2. Handle Sales Form
  salesForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const itemSoldName = document.getElementById('item-sold').value.trim();
      const quantitySold = parseInt(document.getElementById('quantity-sold').value);

      const sale = {
          date: document.getElementById('sale-date').value,
          clientName: document.getElementById('client-name').value,
          itemSold: itemSoldName,
          quantitySold: quantitySold,
          amount: parseFloat(document.getElementById('sale-amount').value),
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
          const stockRef = db.collection('stockmgt');
          const query = stockRef.where('itemName', '==', itemSoldName);
          const snapshot = await query.get();

          if (snapshot.empty) {
              throw new Error(`Item "${itemSoldName}" not found in stock!`);
          }

          snapshot.forEach(async doc => {
              const currentQuantity = doc.data().quantity || 0;
              if (currentQuantity < quantitySold) {
                  throw new Error(`Insufficient stock for "${itemSoldName}". Only ${currentQuantity} available.`);
              }

              // Update stock quantity
              await stockRef.doc(doc.id).update({
                  quantity: firebase.firestore.FieldValue.increment(-quantitySold)
              });

              // Add the sale record
              await db.collection("sales").add(sale);
              salesForm.reset();
          });

      } catch (error) {
          alert("Error recording sale: " + error.message);
      }
  });

  // 3. Handle Credit Form
  creditForm.addEventListener('submit', (e) => {
      e.preventDefault();

      db.collection("credits").add({
          client: document.getElementById('credit-client').value,
          amount: parseFloat(document.getElementById('credit-amount').value),
          paid: parseFloat(document.getElementById('initial-payment').value || 0),
          dueDate: document.getElementById('due-date').value,
          status: "pending",
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => creditForm.reset());
  });

  // 4. Handle Status Toggle
  creditTableBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('status-badge')) {
          const row = e.target.closest('tr');
          const creditId = row.querySelector('.record-payment').getAttribute('data-id');
          const newStatus = e.target.classList.contains('cleared') ? 'pending' : 'cleared';

          db.collection("credits").doc(creditId).update({
              status: newStatus
          });
      }
  });

  // 5. Handle Payments
  creditTableBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('record-payment')) {
          const creditId = e.target.getAttribute('data-id');
          const payment = parseFloat(prompt("Enter payment amount:"));

          if (!isNaN(payment) && payment > 0) {
              db.collection("credits").doc(creditId).update({
                  paid: firebase.firestore.FieldValue.increment(payment)
              }).then(() => {
                  // Automatically update status when payment is added
                  db.collection("credits").doc(creditId).get()
                      .then(doc => {
                          const credit = doc.data();
                          const balance = credit.amount - credit.paid;
                          if (balance <= 0) {
                              // Mark as cleared if fully paid
                              db.collection("credits").doc(creditId).update({
                                  status: "cleared"
                              });
                          }
                      });
              });
          }
      }
  });

  // 7. View Options
  viewSalesBtn.addEventListener('click', () => {
      loadSales();
  });

  viewCreditsBtn.addEventListener('click', () => {
      loadCredits();
  });

  filterByDateBtn.addEventListener('click', () => {
      const selectedDate = filterDateInput.value;
      if (selectedDate) {
          const startDate = new Date(selectedDate);
          const endDate = new Date(selectedDate);
          endDate.setDate(endDate.getDate() + 1);

          loadSales(
              db.collection("sales")
                  .where("timestamp", ">=", startDate)
                  .where("timestamp", "<", endDate)
                  .orderBy("timestamp", "desc")
          );

          loadCredits(
              db.collection("credits")
                  .where("timestamp", ">=", startDate)
                  .where("timestamp", "<", endDate)
                  .orderBy("timestamp", "desc")
          );
      }
  });

  // Initialize the app
  initializeApp();
});