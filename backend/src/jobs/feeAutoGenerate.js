const Fee = require('../models/Fee');
const Student = require('../models/Student');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatPeriod = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
};

const updateStudentFeeStatus = async (studentId) => {
  const fees = await Fee.find({ studentId });
  if (fees.length === 0) return;
  const allPaid = fees.every(f => f.status === 'paid');
  const allPending = fees.every(f => f.status === 'pending');
  const status = allPaid ? 'paid' : allPending ? 'pending' : 'partial';
  await Student.findByIdAndUpdate(studentId, { feeStatus: status });
};

const runFeeAutoGenerate = async () => {
  console.log(`[FeeAutoGenerate] Starting run at ${new Date().toISOString()}`);

  try {
    const students = await Student.find({ monthlyFee: { $gt: 0 } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let created = 0;
    let skipped = 0;

    for (const student of students) {
      try {
        // Get the most recent fee record for this student
        const lastFee = await Fee.findOne({ studentId: student._id })
          .sort({ endDate: -1 });

        if (!lastFee) {
          skipped++;
          continue;
        }

        const cycleEnd = new Date(lastFee.endDate);
        cycleEnd.setHours(0, 0, 0, 0);

        // Only proceed if the current cycle has ended
        if (today < cycleEnd) {
          skipped++;
          continue;
        }

        // Check if a fee record already exists starting from this cycleEnd
        // Use a 1-day tolerance window to avoid timezone edge cases
        const windowStart = new Date(cycleEnd.getTime() - 86400000);
        const windowEnd = new Date(cycleEnd.getTime() + 86400000);
        const alreadyExists = await Fee.findOne({
          studentId: student._id,
          startDate: { $gte: windowStart, $lte: windowEnd },
        });

        if (alreadyExists) {
          skipped++;
          continue;
        }

        // Create the next billing cycle
        const newStart = new Date(lastFee.endDate);
        const newEnd = new Date(newStart);
        newEnd.setMonth(newEnd.getMonth() + 1);

        await Fee.create({
          studentId: student._id,
          batchId: student.batchId,
          amount: student.monthlyFee,
          paidAmount: 0,
          startDate: newStart,
          endDate: newEnd,
          status: 'pending',
        });

        // Update student's overall fee status to reflect new pending cycle
        await updateStudentFeeStatus(student._id);

        console.log(
          `[FeeAutoGenerate] ✅ Created: ${student.fullName} → ${formatPeriod(newStart, newEnd)}`
        );
        created++;

      } catch (studentError) {
        console.error(
          `[FeeAutoGenerate] ❌ Error processing student ${student.fullName}:`,
          studentError.message
        );
      }
    }

    console.log(
      `[FeeAutoGenerate] Done — ${created} created, ${skipped} skipped`
    );

  } catch (error) {
    console.error('[FeeAutoGenerate] Fatal error:', error.message);
  }
};

module.exports = runFeeAutoGenerate;