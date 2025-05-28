document.addEventListener('DOMContentLoaded', function() {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: "AIzaSyCApEWbJdlmtbT8TyIMugaX5NXOO_5A-No",
      authDomain: "chanja-autos-d346c.firebaseapp.com",
      projectId: "chanja-autos-d346c",
      storageBucket: "chanja-autos-d346c.appspot.com",
      messagingSenderId: "316212921555",
      appId: "1:316212921555:web:6d57b5fa4a59d4b05a4026",
      measurementId: "G-6204GSZFKC"
    });
  }
  const db = firebase.firestore();
  const stockRef = db.collection('stockmgt');

  const stockForm = document.getElementById('stockForm');
  const addItemBtn = document.getElementById('addItemBtn');
  const viewStockBtn = document.getElementById('viewStockBtn');
  const stockTableBody = document.getElementById('stockTableBody');
  const filterInput = document.getElementById('filterInput');

  let editingStockId = null;
  let allStockItems = []; // Stores all stock items for filtering

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

  // Display stock items in table
  function displayStock(items) {
    stockTableBody.innerHTML = '';
    if (items.length === 0) {
      stockTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No stock items found.</td></tr>`;
      return;
    }

    items.forEach(item => {
      const totalValue = (item.itemPrice * item.quantity) || 0;
      const row = document.createElement('tr');
      row.innerHTML = `
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

    // Attach edit button listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.getAttribute('data-id');
        const docSnap = await stockRef.doc(docId).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          editingStockId = docId;

          stockForm['item-name'].value = data.itemName || '';
          stockForm['description'].value = data.description || '';
          stockForm['part-number'].value = data.partNumber || '';
          stockForm['item-price'].value = data.itemPrice || '';
          stockForm['item-quantity'].value = data.quantity || '';

          addItemBtn.textContent = 'Update Item';
        }
      });
    });
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

    const itemName = stockForm['item-name'].value.trim();
    const description = stockForm['description'].value.trim();
    const partNumber = stockForm['part-number'].value.trim();
    const itemPrice = parseFloat(stockForm['item-price'].value);
    const itemQuantity = parseInt(stockForm['item-quantity'].value);

    if (!itemName || isNaN(itemPrice) || isNaN(itemQuantity)) {
      alert('Please fill in all required fields correctly.');
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
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        editingStockId = null;
        addItemBtn.textContent = 'Add Item';
      } else {
        await stockRef.add({
          itemName,
          description,
          partNumber,
          itemPrice,
          quantity: itemQuantity,
          totalValue,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      stockForm.reset();
      loadStock(); // Reload stock to include new/updated items

    } catch (error) {
      alert('Failed to save stock item: ' + error.message);
    } finally {
      addItemBtn.disabled = false;
      if (!editingStockId) addItemBtn.textContent = 'Add Item';
    }
  });

  // Initial load
  viewStockBtn.addEventListener('click', loadStock);
  loadStock();
});
