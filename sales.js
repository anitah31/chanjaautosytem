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
  const groupReceiptForm = document.getElementById('groupReceiptForm');
  const partNumberInput = document.getElementById('part-number');
  const itemSoldInput = document.getElementById('item-sold');
  const descriptionInput = document.getElementById('description');
  const saleAmountInput = document.getElementById('sale-amount');

  // Auto-fill item details when part number is entered
  if (partNumberInput) {
    partNumberInput.addEventListener('input', async function() {
      const partNumber = this.value.trim();
      if (!partNumber) {
        itemSoldInput.value = '';
        descriptionInput.value = '';
        saleAmountInput.value = '';
        return;
      }
      try {
        const stockQuery = await db.collection('stockmgt')
          .where('partNumber', '==', partNumber)
          .limit(1)
          .get();
        if (!stockQuery.empty) {
          const stockItem = stockQuery.docs[0].data();
          itemSoldInput.value = stockItem.itemName || '';
          descriptionInput.value = stockItem.description || '';
          saleAmountInput.value = stockItem.itemPrice || '';
          itemSoldInput.readOnly = true;
          descriptionInput.readOnly = true;
        } else {
          itemSoldInput.value = '';
          descriptionInput.value = '';
          saleAmountInput.value = '';
          itemSoldInput.readOnly = false;
          descriptionInput.readOnly = false;
        }
      } catch (error) {
        console.error('Error fetching stock by part number:', error);
      }
    });
  }

  // Utility: format date as YYYY-MM-DD
  function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Print Group Receipt Logic (NO LOGO, WITH ITEM SOLD)
  function generateGroupReceipt(sale) {
    let total = 0;
    let itemRows = [];
    sale.items.forEach(item => {
      const lineTotal = item.quantity * item.price;
      total += lineTotal;
      itemRows.push([
        { text: item.sold, margin: [0, 2, 0, 2] },           // Item Sold
        { text: item.description, margin: [0, 2, 0, 2] },    // Description
        { text: item.partNumber || '-', margin: [0, 2, 0, 2] }, // Part No.
        { text: item.quantity, margin: [0, 2, 0, 2] },       // Qty
        { text: item.price.toFixed(2), margin: [0, 2, 0, 2] }, // Price
        { text: lineTotal.toFixed(2), margin: [0, 2, 0, 2] }   // Total
      ]);
    });
    const cash = sale.cash !== undefined ? sale.cash : total;
    const change = (cash - total) > 0 ? (cash - total) : 0;
    const bankCard = sale.bankCard || "";
    const approvalCode = sale.approvalCode || "";

    const docDefinition = {
      content: [
        { text: "CHANJA AUTOS", style: "header" },
        { text: "Address: Roysambu, Lumumba Drive, Nairobi", style: "address" },
        { text: "Tel: +254 721814009", style: "address", margin: [0, 0, 0, 10] },
        { text: "CASH RECEIPT", style: "subheader", margin: [0, 0, 0, 10] },
        { text: `Client: ${sale.clientName}`, style: "client", margin: [0, 0, 0, 5] },
        { text: `Date: ${sale.date}`, style: "client", margin: [0, 0, 0, 10] },
        {
          table: {
            widths: ['*', '*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Item Sold', bold: true },
                { text: 'Description', bold: true },
                { text: 'Part No.', bold: true },
                { text: 'Qty', bold: true },
                { text: 'Price', bold: true },
                { text: 'Total', bold: true }
              ],
              ...itemRows
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: '-------------------------------------------------------------------------', alignment: 'center', margin: [0, 10, 0, 10] },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Total', bold: true }, { text: total.toFixed(2), alignment: 'right' }],
              [{ text: 'Cash', bold: true }, { text: cash.toFixed(2), alignment: 'right' }],
              [{ text: 'Change', bold: true }, { text: change.toFixed(2), alignment: 'right' }],
              ...(bankCard ? [[{ text: 'Bank card', bold: true }, { text: bankCard, alignment: 'right' }]] : []),
              ...(approvalCode ? [[{ text: 'Approval Code', bold: true }, { text: approvalCode, alignment: 'right' }]] : [])
            ]
          },
          layout: 'noBorders'
        },
        { text: '-------------------------------------------------------------------------', alignment: 'center', margin: [0, 10, 0, 0] },
        { text: 'THANK YOU!', style: 'footer', margin: [0, 10, 0, 0] }
      ],
      styles: {
        header: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 3] },
        address: { fontSize: 12, alignment: 'center' },
        subheader: { fontSize: 12, bold: true, alignment: 'center' },
        client: { fontSize: 10, alignment: 'left' },
        footer: { fontSize: 10, italics: true, alignment: 'center' }
      },
      defaultStyle: {
        fontSize: 10
      },
      pageSize: { width: 240, height: 'auto' },
      pageMargins: [10, 10, 10, 10]
    };

    pdfMake.createPdf(docDefinition).print();
  }

  // Group Receipt Print Handler (builds items with 'sold' field)
  if (groupReceiptForm) {
    groupReceiptForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const clientName = document.getElementById('receipt-client').value.trim();
      const date = document.getElementById('receipt-date').value;
      const salesSnapshot = await db.collection("sales")
        .where("clientName", "==", clientName)
        .where("date", "==", date)
        .get();
      if (salesSnapshot.empty) {
        alert("No sales found for this client on this date.");
        return;
      }
      const items = [];
      salesSnapshot.forEach(doc => {
        const sale = doc.data();
        items.push({
          sold: sale.itemSold,
          description: sale.description || '',
          partNumber: sale.partNumber || '',
          quantity: sale.quantitySold,
          price: sale.price || (sale.amount / sale.quantitySold)
        });
      });
      let total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let cash = parseFloat(prompt("Enter cash received for this group sale:", total)) || total;
      const saleForReceipt = {
        items: items,
        cash: cash,
        date: date,
        clientName: clientName
      };
      generateGroupReceipt(saleForReceipt);
    });
  }

  // SALES TABLE
  function addDeleteButton(row, collection, docId) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this record?')) {
        try {
          // If deleting a sale, increment stock accordingly
          if (collection === 'sales') {
            const itemName = row.cells[2].textContent;
            const partNumber = row.cells[4].textContent;
            const quantitySold = parseInt(row.cells[5].textContent);
            let stockQuery;
            if (partNumber && partNumber !== '') {
              stockQuery = db.collection('stockmgt').where('partNumber', '==', partNumber);
            } else {
              stockQuery = db.collection('stockmgt').where('itemName', '==', itemName);
            }
            const stockSnapshot = await stockQuery.get();
            if (!stockSnapshot.empty) {
              stockSnapshot.forEach(stockDoc => {
                db.collection('stockmgt').doc(stockDoc.id).update({
                  quantity: firebase.firestore.FieldValue.increment(quantitySold)
                });
              });
            }
          }
          await db.collection(collection).doc(docId).delete();
          row.remove();
        } catch (error) {
          alert('Error deleting record: ' + error.message);
        }
      }
    });
    const actionCell = row.insertCell(-1);
    actionCell.appendChild(deleteBtn);
  }

  function loadSales(query = db.collection("sales").orderBy("timestamp", "desc")) {
    salesTableBody.innerHTML = '';
    query.onSnapshot((snapshot) => {
      salesTableBody.innerHTML = '';
      let total = 0;
      snapshot.forEach(doc => {
        const sale = doc.data();
        const totalAmount = (sale.price || 0) * sale.quantitySold;
        total += totalAmount;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${sale.date}</td>
          <td>${sale.clientName}</td>
          <td>${sale.itemSold}</td>
          <td>${sale.description || ''}</td>
          <td>${sale.partNumber || ''}</td>
          <td>${sale.quantitySold}</td>
          <td>KSH ${(sale.price || 0).toFixed(2)}</td>
          <td>KSH ${totalAmount.toFixed(2)}</td>
        `;
        addDeleteButton(row, 'sales', doc.id);
        salesTableBody.appendChild(row);
      });
      if (totalSalesElement) totalSalesElement.textContent = total.toFixed(2);
    });
  }

  // CREDIT SALES TABLE WITH OVERDUE HIGHLIGHT (NO SMS)
  function loadCredits(query = db.collection("credits").orderBy("timestamp", "desc")) {
    creditTableBody.innerHTML = '';
    query.onSnapshot((snapshot) => {
      creditTableBody.innerHTML = '';
      const today = new Date();
      snapshot.forEach(doc => {
        const credit = doc.data();
        const balance = credit.amount - credit.paid;
        const dueDate = new Date(credit.dueDate);
        const daysOverdue = (today - dueDate) / (1000 * 60 * 60 * 24);
        const isOverdue = balance > 0 && daysOverdue > 30;
        const isCleared = balance <= 0 || credit.status === "cleared";

        if (isCleared) {
          db.collection("credits").doc(doc.id).delete();
          return;
        }

        let clientNameCell = `<td${isOverdue ? ' style="background-color: #d4edda;"' : ''}>${credit.client}</td>`;
        if (isOverdue && !credit.notifiedOverdue) {
          alert(`Client ${credit.client} is overdue for more than 30 days!`);
          db.collection('credits').doc(doc.id).update({ notifiedOverdue: true });
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          ${clientNameCell}
          <td>${credit.phoneNumber || 'N/A'}</td>
          <td>KSH ${credit.amount.toFixed(2)}</td>
          <td>KSH ${credit.paid.toFixed(2)}</td>
          <td>KSH ${balance.toFixed(2)}</td>
          <td>${credit.dueDate}</td>
          <td class="status-cell">
            <span class="status-badge ${isCleared ? 'cleared' : 'pending'}" data-id="${doc.id}" style="cursor: pointer;">
              ${isCleared ? 'CLEARED' : 'PENDING'}
            </span>
          </td>
          <td>
            <button class="record-payment" data-id="${doc.id}">Add Payment</button>
          </td>
        `;
        creditTableBody.appendChild(row);
      });
    });
  }

  // SALES FORM SUBMIT
  salesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemSoldName = itemSoldInput.value.trim();
    const quantitySold = parseInt(document.getElementById('quantity-sold').value);
    const partNumber = partNumberInput.value.trim();
    const description = descriptionInput.value.trim();
    const pricePerItem = parseFloat(saleAmountInput.value);
    const totalAmount = pricePerItem * quantitySold;
    const sale = {
      date: document.getElementById('sale-date').value,
      clientName: document.getElementById('client-name').value,
      itemSold: itemSoldName,
      description: description,
      partNumber: partNumber,
      quantitySold: quantitySold,
      price: pricePerItem,
      amount: totalAmount,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
      const stockRef = db.collection('stockmgt');
      let query = partNumber
        ? stockRef.where('partNumber', '==', partNumber)
        : stockRef.where('itemName', '==', itemSoldName);
      const snapshot = await query.get();
      if (snapshot.empty) throw new Error(`Item "${itemSoldName}" not found in stock!`);
      snapshot.forEach(async doc => {
        const currentQuantity = doc.data().quantity || 0;
        if (currentQuantity < quantitySold) {
          throw new Error(`Insufficient stock for "${itemSoldName}". Only ${currentQuantity} available.`);
        }
        await stockRef.doc(doc.id).update({
          quantity: firebase.firestore.FieldValue.increment(-quantitySold)
        });
        await db.collection("sales").add(sale);
        salesForm.reset();
        itemSoldInput.readOnly = false;
        descriptionInput.readOnly = false;
        itemSoldInput.value = '';
        descriptionInput.value = '';
      });
    } catch (error) {
      alert("Error recording sale: " + error.message);
    }
  });

  // CREDIT FORM SUBMIT
  creditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = document.getElementById('credit-client').value.trim();
    const phoneNumber = document.getElementById('credit-phone').value.trim();
    const amount = parseFloat(document.getElementById('credit-amount').value);
    const dueDate = document.getElementById('due-date').value;
    const initialPayment = parseFloat(document.getElementById('initial-payment').value);
    if (!client || !phoneNumber || !amount || !dueDate || isNaN(initialPayment)) {
      alert('Please fill all fields correctly.');
      return;
    }
    if (initialPayment > amount) {
      alert('Initial payment cannot exceed total amount.');
      return;
    }
    try {
      await db.collection('credits').add({
        client,
        phoneNumber,
        amount,
        paid: initialPayment,
        dueDate,
        status: initialPayment >= amount ? 'cleared' : 'pending',
        notifiedOverdue: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      creditForm.reset();
      loadCredits();
    } catch (error) {
      alert('Error adding credit: ' + error.message);
    }
  });

  // CREDIT TABLE EVENTS: ADD PAYMENT & STATUS BADGE
  creditTableBody.addEventListener('click', (e) => {
    // Add Payment
    if (e.target.classList.contains('record-payment')) {
      const creditId = e.target.getAttribute('data-id');
      const payment = parseFloat(prompt("Enter payment amount:"));
      if (!isNaN(payment) && payment > 0) {
        db.collection("credits").doc(creditId).update({
          paid: firebase.firestore.FieldValue.increment(payment)
        }).then(() => {
          db.collection("credits").doc(creditId).get()
            .then(doc => {
              const credit = doc.data();
              const balance = credit.amount - credit.paid;
              if (balance <= 0) {
                db.collection("credits").doc(creditId).update({
                  status: "cleared"
                });
              }
            });
        });
      }
    }
    // Status badge click: mark as cleared, which will auto-remove the row
    if (e.target.classList.contains('status-badge')) {
      const creditId = e.target.getAttribute('data-id');
      db.collection("credits").doc(creditId).update({
        status: "cleared"
      });
    }
  });

  // VIEW/FILTER BUTTONS
  viewSalesBtn && viewSalesBtn.addEventListener('click', () => loadSales());
  viewCreditsBtn && viewCreditsBtn.addEventListener('click', () => loadCredits());
  filterByDateBtn && filterByDateBtn.addEventListener('click', () => {
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

  // INITIAL LOAD
  loadSales();
  loadCredits();
});
