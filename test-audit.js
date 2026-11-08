// Audit: Settings persistence
async function auditSettings() {
  const db = await indexedDB.open('compaven-2.0', 13);
  
  // Simulate settings save
  const testSettings = {
    expensesCents: 2400000,
    withdrawalRate: 0.037,
    savingInvCents: 100000,
    savingCashCents: 50000,
    realReturn: 0.035,
    reserveCents: 500000,
    thresholdCents: 0,
    checkedAt: new Date().toISOString()
  };
  
  console.log('Test Settings:', testSettings);
  return testSettings;
}

auditSettings();
