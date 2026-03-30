export class TransactionManager {
  async getBalanceInfo() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      availablePayout: 360,
      totalEarnedMonth: 2150
    };
  }

  async getTransactionHistory() {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      { id: '1', date: 'Apr 3', title: 'Consultation', amount: 150, isPayout: false },
      { id: '2', date: 'Apr 5', title: 'Consultation', amount: 85, isPayout: false },
      { id: '3', date: 'Apr 8', title: 'Payout sent to bank', amount: -250, isPayout: true },
      { id: '4', date: 'Apr 11', title: 'Consultation', amount: 175, isPayout: false },
      { id: '5', date: 'Apr 15', title: 'Payout sent to bank', amount: -200, isPayout: true },
      { id: '6', date: 'Apr 16', title: 'Consultation', amount: 100, isPayout: false },
      { id: '7', date: 'Apr 18', title: 'Consultation', amount: 125, isPayout: false },
      { id: '8', date: 'Apr 20', title: 'Consultation', amount: 75, isPayout: false },
      { id: '9', date: 'Apr 21', title: 'Payout sent to bank', amount: -300, isPayout: true },
    ];
  }

  async getChartData(period = 'Month') {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (period === 'Week') {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [100, 150, 80, 200, 180, 250, 300],
        maxValue: 400
      };
    }
    
    // Month data (simulating the curve from the mockup)
    // About 15 points roughly corresponding to the 1-31 x-axis
    return {
      labels: ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27', '29', '31'],
      data: [50, 100, 80, 200, 220, 150, 260, 220, 350, 300, 260, 310, 350, 310, 480, 500],
      maxValue: 600
    };
  }

  async requestPayout(amount, methodId) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating network
    return { success: true };
  }
}

export const transactionManager = new TransactionManager();
