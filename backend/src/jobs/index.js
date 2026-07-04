const cron = require('node-cron');
const runFeeAutoGenerate = require('./feeAutoGenerate');
const runDoubtCleanup    = require('./doubtCleanup');

const startJobs = () => {
  cron.schedule('5 0 * * *', async () => {
    await runFeeAutoGenerate();
  });

  cron.schedule('0 1 * * *', async () => {
    await runDoubtCleanup();
  });

  console.log('✅ Scheduled jobs started');
};

module.exports = { startJobs, runFeeAutoGenerate };