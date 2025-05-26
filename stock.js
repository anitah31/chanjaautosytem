document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCApEWbJdlmtbT8TyIMugaX5NXOO_5A-No",
    authDomain: "chanja-autos-d346c.firebaseapp.com",
    projectId: "chanja-autos-d346c",
    storageBucket: "chanja-autos-d346c.appspot.com",
    messagingSenderId: "316212921555",
    appId: "1:316212921555:web:6d57b5fa4b59d4b05a4026",
    measurementId: "G-6204GSZFKC"
  };

  // Initialize Firebase app and Firestore
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  // DOM Elements
  const stockForm = document.getElementById('stockForm');
  const addItemBtn = document.getElementById('addItemBtn');
  const viewStockBtn = document.getElementById('viewStockBtn');
  const stockTableBody = document.getElementById('stockTableBody');

  // Firestore collection reference
  const stockRef = db.collection('stockmgt');

  // Track current editing document ID (null if adding new)
  let editingStockId = null;

  // Load stock items and display in table
  async function loadStock() {
    try {
      viewStockBtn.disabled = true;
      viewStockBtn.textContent = 'Loading...';

      const querySnapshot = await stockRef.orderBy('createdAt', 'desc').get();

      stockTableBody.innerHTML = ''; // Clear table

      if (querySnapshot.empty) {
        stockTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No stock items found.</td></tr>`;
        return;
      }

      querySnapshot.forEach(doc => {
        const item = doc.data();
        const row = document.createElement('tr');
        row.id = `row-${doc.id}`;
        row.innerHTML = `
          <td>${item.itemName}</td>
          <td>${item.description || ''}</td>
          <td>${item.partNumber || ''}</td>
          <td>KSH ${item.itemPrice?.toFixed(2) || '0.00'}</td>
          <td>${item.quantity || 0}</td>
          <td>KSH ${(item.itemPrice * item.quantity)?.toFixed(2) || '0.00'}</td>
          <td><button class="edit-btn" data-id="${doc.id}">Edit</button></td>
        `;
        stockTableBody.appendChild(row);
      });

      // Add event listeners for edit buttons
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const docId = btn.getAttribute('data-id');
          const docSnap = await stockRef.doc(docId).get();
          if (docSnap.exists) {
            const data = docSnap.data();
            editingStockId = docId;

            // Populate form fields
            stockForm['item-name'].value = data.itemName || '';
            stockForm['description'].value = data.description || '';
            stockForm['part-number'].value = data.partNumber || '';
            stockForm['item-price'].value = data.itemPrice || '';
            stockForm['item-quantity'].value = data.quantity || '';

            addItemBtn.textContent = 'Update Item';
          }
        });
      });

    } catch (error) {
      console.error('Error loading stock:', error);
      alert('Failed to load stock items: ' + error.message);
    } finally {
      viewStockBtn.disabled = false;
      viewStockBtn.textContent = 'View Stock';
    }
  }

  // Handle form submit for add or update
  stockForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get form values
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
        // Update existing stock item
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
        // Add new stock item
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
      loadStock(); // Refresh stock list

    } catch (error) {
      console.error('Error saving stock item:', error);
      alert('Failed to save stock item: ' + error.message);
    } finally {
      addItemBtn.disabled = false;
      if (!editingStockId) addItemBtn.textContent = 'Add Item';
    }
  });

  // View stock button click handler
  viewStockBtn.addEventListener('click', loadStock);

  // Initial load
  loadStock();
});
