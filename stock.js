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
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  const stockRef = db.collection('stockmgt');

  const stockForm = document.getElementById('stockForm');
  const addItemBtn = document.getElementById('addItemBtn');
  const viewStockBtn = document.getElementById('viewStockBtn');
  const stockTableBody = document.getElementById('stockTableBody');
  const filterInput = document.getElementById('filterInput');
  const stockDateInput = document.getElementById('stock-date'); // Updated to match HTML input id
  const totalStockValueElement = document.getElementById('totalStockValue');

  let editingStockId = null;
  let allStockItems = []; // Stores all stock items for filtering

  // Helper to format date
  function stockDateFormatted(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  }

  // Load and display stock items
  async function loadStock() {
    try {
      viewStockBtn.disabled = true;
      viewStockBtn.textContent = 'Loading...';

      const snapshot = await stockRef.orderBy('createdAt', 'desc').get();

      allStockItems = [];
      snapshot.forEach(doc => {
        const item = doc.data();
        allStockItems.push({ id: doc.id, ...item });
      });

      displayStock(allStockItems);

    } catch (error) {
      alert('Error loading stock: ' + error.message);
    } finally {
      viewStockBtn.disabled = false;
      viewStockBtn.textContent = 'View Stock';
    }
  }

  // Display stock items in table and update total stock value
  function displayStock(items) {
    stockTableBody.innerHTML = '';
    let sumTotalValue = 0;
    if (items.length === 0) {
      stockTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No stock items found.</td></tr>`;
      if (totalStockValueElement) totalStockValueElement.textContent = "0.00";
      return;
    }

    items.forEach(item => {
      const totalValue = (item.itemPrice * item.quantity) || 0;
      sumTotalValue += totalValue;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${stockDateFormatted(item.stockDate)}</td>
        <td>${item.itemName}</td>
        <td>${item.description || ''}</td>
        <td>${item.partNumber || ''}</td>
        <td>KSH ${item.itemPrice?.toFixed(2) || '0.00'}</td>
        <td>${item.quantity}</td>
        <td>KSH ${totalValue.toFixed(2)}</td>
        <td><button class="edit-btn" data-id="${item.id}">Edit</button></td>
      `;
      stockTableBody.appendChild(row);
    });

    // Update the total stock value display
    if (totalStockValueElement) {
      totalStockValueElement.textContent = sumTotalValue.toFixed(2);
    }
  }

  // New filter functionality
  filterInput.addEventListener('input', function() {
    const filterText = this.value.trim().toLowerCase();
    const filteredItems = allStockItems.filter(item =>
      item.itemName.toLowerCase().includes(filterText)
    );
    displayStock(filteredItems);
  });

  // Handle add/update stock
  stockForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemName = document.getElementById('item-name').value.trim();
    const description = document.getElementById('description').value.trim();
    const partNumber = document.getElementById('part-number').value.trim();
    const itemPrice = parseFloat(document.getElementById('item-price').value);
    const itemQuantity = parseInt(document.getElementById('item-quantity').value);
    const stockDate = stockDateInput.value;

    if (!itemName || isNaN(itemPrice) || isNaN(itemQuantity) || !stockDate) {
      alert('Please fill in all required fields correctly, including the date.');
      return;
    }

    const totalValue = itemPrice * itemQuantity;

    addItemBtn.disabled = true;
    addItemBtn.textContent = editingStockId ? 'Updating...' : 'Adding...';

    try {
      if (editingStockId) {
        await stockRef.doc(editingStockId).update({
          itemName,
          description,
          partNumber,
          itemPrice,
          quantity: itemQuantity,
          totalValue,
          stockDate,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        editingStockId = null;
      } else {
        await stockRef.add({
          itemName,
          description,
          partNumber,
          itemPrice,
          quantity: itemQuantity,
          totalValue,
          stockDate,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      stockForm.reset();
      addItemBtn.textContent = 'Add Item';
      loadStock();

    } catch (error) {
      alert('Failed to save stock item: ' + error.message);
    } finally {
      addItemBtn.disabled = false;
    }
  });

  // Attach edit button listeners after displaying stock
  function attachEditListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.getAttribute('data-id');
        const docSnap = await stockRef.doc(docId).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          editingStockId = docId;

          document.getElementById('item-name').value = data.itemName || '';
          document.getElementById('description').value = data.description || '';
          document.getElementById('part-number').value = data.partNumber || '';
          document.getElementById('item-price').value = data.itemPrice || '';
          document.getElementById('item-quantity').value = data.quantity || '';
          stockDateInput.value = data.stockDate || '';

          addItemBtn.textContent = 'Update Item';
        }
      });
    });
  }

  // Override displayStock to attach edit listeners after rendering
  const originalDisplayStock = displayStock;
  displayStock = function(items) {
    originalDisplayStock(items);
    attachEditListeners();
  };

  // View stock button click
  viewStockBtn.addEventListener('click', loadStock);

  // Initial load
  loadStock();
});
