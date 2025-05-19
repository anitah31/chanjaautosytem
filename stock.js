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
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // DOM Elements
  const stockForm = document.getElementById('stockForm');
  const addItemBtn = document.getElementById('addItemBtn');
  const viewStockBtn = document.getElementById('viewStockBtn');
  const stockTableBody = document.getElementById('stockTableBody');
  
  // Reference to Firestore collection
  const stockRef = db.collection('stockmgt');
  
  // Function to create delete button
  function createDeleteButton(docId) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this item?')) {
        try {
          await stockRef.doc(docId).delete();
          // Remove the row from UI
          document.getElementById(`row-${docId}`)?.remove();
        } catch (error) {
          console.error('Error deleting item:', error);
          alert('Failed to delete item: ' + error.message);
        }
      }
    });
    return deleteBtn;
  }

  // Form submission handler
  stockForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const itemName = document.getElementById('item-name').value.trim();
    const itemPrice = parseFloat(document.getElementById('item-price').value);
    const itemQuantity = parseInt(document.getElementById('item-quantity').value);
    
    // Calculate total value
    const totalValue = itemPrice * itemQuantity;
    
    try {
      // Disable button during processing
      addItemBtn.disabled = true;
      addItemBtn.textContent = 'Adding...';
      
      // Add to Firestore
      await stockRef.add({
        itemName: itemName,
        itemPrice: itemPrice,
        quantity: itemQuantity,
        totalValue: totalValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Clear form
      stockForm.reset();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item: ' + error.message);
    } finally {
      addItemBtn.disabled = false;
      addItemBtn.textContent = 'Add Item';
    }
  });

  // View Stock Button Handler
  viewStockBtn.addEventListener('click', async function() {
    try {
      viewStockBtn.disabled = true;
      viewStockBtn.textContent = 'Loading...';
      
      const querySnapshot = await stockRef.orderBy('createdAt', 'desc').get();
      
      if (querySnapshot.empty) {
        alert("No stock items found in database");
        return;
      }
      
      stockTableBody.innerHTML = ''; // Clear current display
      
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        const row = document.createElement('tr');
        row.id = `row-${doc.id}`; // Add ID for easy deletion
        row.innerHTML = `
          <td>${item.itemName}</td>
          <td>KSH ${item.itemPrice?.toFixed(2) || '0.00'}</td>
          <td>${item.quantity || 0}</td>
          <td>KSH ${item.totalValue?.toFixed(2) || '0.00'}</td>
          <td class="actions"></td>
        `;
        
        // Add delete button
        const actionsCell = row.querySelector('.actions');
        actionsCell.appendChild(createDeleteButton(doc.id));
        
        stockTableBody.appendChild(row);
      });
      
    } catch (error) {
      console.error("Error fetching stock: ", error);
      alert("Failed to load stock: " + error.message);
    } finally {
      viewStockBtn.disabled = false;
      viewStockBtn.textContent = 'View Stock';
    }
  });

  // Real-time listener for stock updates (optional)
  stockRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    // You could implement real-time updates here if needed
  });
});