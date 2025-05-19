// totalSales.js

/**
 * Calculate the total sales.
 * @param {Array} salesRecords - Array of sale objects {date, client, saleAmount}.
 * @returns {number} - Total sales amount.
 */
function calculateTotalSales(salesRecords) {
    return salesRecords.reduce((total, sale) => total + sale.saleAmount, 0);
  }
  
  // Example usage:
  const salesRecords = [
    { date: '2025-02-18', client: 'John Doe', saleAmount: 100.00 },
    { date: '2025-02-19', client: 'Jane Doe', saleAmount: 200.00 }
  ];
  
  console.log('Total Sales: $' + calculateTotalSales(salesRecords).toFixed(2));
  