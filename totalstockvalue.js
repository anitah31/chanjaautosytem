// totalStockValue.js

/**
 * Calculate the total stock value.
 * @param {Array} stockItems - Array of stock objects {name, quantity, price}.
 * @returns {number} - Total stock value.
 */
function calculateTotalStockValue(stockItems) {
    return stockItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  }
  
  // Example usage:
  const stockItems = [
    { name: 'Oil Filter', quantity: 10, price: 5.99 },
    { name: 'Brake Pads', quantity: 5, price: 29.99 }
  ];
  
  console.log('Total Stock Value: $' + calculateTotalStockValue(stockItems).toFixed(2));
  