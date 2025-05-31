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

  // DOM Elements
  const stockForm = document.getElementById('stockForm');
  const addItemBtn = document.getElementById('addItemBtn');
  const viewStockBtn = document.getElementById('viewStockBtn');
  const stockTableBody = document.getElementById('stockTableBody');
  const filterInput = document.getElementById('filterInput');
  const filterPartNumber = document.getElementById('filterPartNumber');
  const stockDateInput = document.getElementById('stock-date');
  const totalStockValueElement = document.getElementById('totalStockValue');

  let editingStockId = null;
  let allStockItems = [];

  // Helper functions
  function stockDateFormatted(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  }

  // Load and display stock
  async function loadStock() {
    try {
      viewStockBtn.disabled = true;
      viewStockBtn.textContent = 'Loading...';

      const snapshot = await stockRef.orderBy('createdAt', 'desc').get();
      allStockItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      displayStock(allStockItems);
    } catch (error) {
      alert('Error loading stock: ' + error.message);
    } finally {
      viewStockBtn.disabled = false;
      viewStockBtn.textContent = 'View Stock';
    }
  }

  // Display stock with filtering
  function displayStock(items) {
    stockTableBody.innerHTML = '';
    let sumTotalValue = 0;

    if (items.length === 0) {
      stockTableBody.innerHTML = `<tr><td colspan="8" class="text-center">No stock items found</td></tr>`;
      totalStockValueElement.textContent = "0.00";
      return;
    }

    items.forEach(item => {
      const totalValue = (item.itemPrice || 0) * (item.quantity || 0);
      sumTotalValue += totalValue;

      const row = `
        <tr>
          <td>${stockDateFormatted(item.stockDate)}</td>
          <td>${item.itemName}</td>
          <td>${item.description || ''}</td>
          <td>${item.partNumber || ''}</td>
          <td>KSH ${(item.itemPrice || 0).toFixed(2)}</td>
          <td>${item.quantity}</td>
          <td>KSH ${totalValue.toFixed(2)}</td>
          <td><button class="edit-btn" data-id="${item.id}">Edit</button></td>
        </tr>
      `;
      stockTableBody.insertAdjacentHTML('beforeend', row);
    });

    totalStockValueElement.textContent = sumTotalValue.toFixed(2);
    attachEditListeners();
  }

  // Filter functionality
  function applyFilters() {
    const nameFilter = filterInput.value.trim().toLowerCase();
    const partFilter = filterPartNumber.value.trim().toLowerCase();
    
    const filtered = allStockItems.filter(item => {
      const matchesName = item.itemName.toLowerCase().includes(nameFilter);
      const matchesPart = item.partNumber?.toLowerCase().includes(partFilter);
      return matchesName && (partFilter ? matchesPart : true);
    });
    
    displayStock(filtered);
  }

  // Form submission handler
  stockForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      itemName: stockForm['item-name'].value.trim(),
      description: stockForm['description'].value.trim(),
      partNumber: stockForm['part-number'].value.trim(),
      itemPrice: parseFloat(stockForm['item-price'].value),
      quantity: parseInt(stockForm['item-quantity'].value),
      stockDate: stockDateInput.value
    };

    // Validation
    if (!formData.itemName || isNaN(formData.itemPrice) || 
        isNaN(formData.quantity) || !formData.stockDate) {
      alert('Please fill all required fields correctly');
      return;
    }

    // Check for duplicate part number (only on new entries)
    if (!editingStockId && formData.partNumber) {
      const snapshot = await stockRef.where('partNumber', '==', formData.partNumber).get();
      if (!snapshot.empty) {
        alert('Error: This part number already exists in stock records!');
        return;
      }
    }

    try {
      addItemBtn.disabled = true;
      addItemBtn.textContent = editingStockId ? 'Updating...' : 'Adding...';

      const stockData = {
        ...formData,
        totalValue: formData.itemPrice * formData.quantity,
        [editingStockId ? 'updatedAt' : 'createdAt']: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingStockId) {
        await stockRef.doc(editingStockId).update(stockData);
        editingStockId = null;
      } else {
        await stockRef.add(stockData);
      }

      stockForm.reset();
      loadStock();
    } catch (error) {
      alert('Operation failed: ' + error.message);
    } finally {
      addItemBtn.disabled = false;
      addItemBtn.textContent = 'Add Item';
    }
  });

  // Edit functionality
  function attachEditListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.dataset.id;
        const doc = await stockRef.doc(docId).get();
        
        if (doc.exists) {
          editingStockId = docId;
          const data = doc.data();
          
          stockForm['item-name'].value = data.itemName;
          stockForm['description'].value = data.description || '';
          stockForm['part-number'].value = data.partNumber || '';
          stockForm['item-price'].value = data.itemPrice;
          stockForm['item-quantity'].value = data.quantity;
          stockDateInput.value = data.stockDate || '';
          
          addItemBtn.textContent = 'Update Item';
        }
      });
    });
  }

  // Event listeners
  filterInput.addEventListener('input', applyFilters);
  filterPartNumber.addEventListener('input', applyFilters);
  viewStockBtn.addEventListener('click', loadStock);

  // Initial load
  loadStock();
});
