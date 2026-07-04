const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');

const formatPeriod = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
};

const updateStudentFeeStatus = async (studentId) => {
  const fees = await Fee.find({ studentId });
  if (fees.length === 0) return;
  const allPaid = fees.every(f => f.status === 'paid');
  const allPending = fees.every(f => f.status === 'pending');
  const status = allPaid ? 'paid' : allPending ? 'pending' : 'partial';
  await Student.findByIdAndUpdate(studentId, { feeStatus: status });
};

const getStudentFeeProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId)
      .populate('userId', 'username')
      .populate('batchId', 'name');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const fees = await Fee.find({ studentId }).sort({ startDate: 1 });
    const totalBilled = fees.reduce((s, f) => s + f.amount, 0);
    const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          fullName: student.fullName,
          username: student.userId?.username,
          batch: student.batchId?.name,
          joiningDate: student.joiningDate,
          monthlyFee: student.monthlyFee,
          feeStatus: student.feeStatus,
        },
        fees: fees.map(f => ({
          _id: f._id,
          period: formatPeriod(f.startDate, f.endDate),
          startDate: f.startDate,
          endDate: f.endDate,
          amount: f.amount,
          paidAmount: f.paidAmount,
          balance: f.amount - f.paidAmount,
          status: f.status,
          note: f.note,
        })),
        summary: {
          totalBilled,
          totalPaid,
          totalBalance: totalBilled - totalPaid,
          totalMonths: fees.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const addNextMonthFee = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const lastFee = await Fee.findOne({ studentId }).sort({ endDate: -1 });
    const startDate = lastFee ? new Date(lastFee.endDate) : new Date(student.joiningDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const existing = await Fee.findOne({
      studentId,
      startDate: { $gte: new Date(startDate.getTime() - 86400000), $lte: new Date(startDate.getTime() + 86400000) },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Fee for this period already exists' });
    }

    const fee = await Fee.create({
      studentId,
      batchId: student.batchId,
      amount: student.monthlyFee,
      paidAmount: 0,
      startDate,
      endDate,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: `Fee added for ${formatPeriod(startDate, endDate)}`,
      data: {
        _id: fee._id,
        period: formatPeriod(fee.startDate, fee.endDate),
        startDate: fee.startDate,
        endDate: fee.endDate,
        amount: fee.amount,
        paidAmount: fee.paidAmount,
        balance: fee.amount,
        status: fee.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateFeePayment = async (req, res, next) => {
  try {
    const { paymentAmount, paymentMethod, note } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }
    const balance = fee.amount - fee.paidAmount;
    if (amount > balance) {
      return res.status(400).json({ success: false, message: `Maximum payable is ₹${balance}` });
    }

    fee.paidAmount += amount;
    if (note) fee.note = note;
    if (fee.paidAmount >= fee.amount) fee.status = 'paid';
    else if (fee.paidAmount > 0) fee.status = 'partial';
    else fee.status = 'pending';
    await fee.save();

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let receiptNumber = `RCP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    let exists = await Payment.findOne({ receiptNumber });
    while (exists) {
      receiptNumber = `RCP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      exists = await Payment.findOne({ receiptNumber });
    }

    await Payment.create({
      studentId: fee.studentId,
      feeId: fee._id,
      amount,
      receiptNumber,
      paymentMethod: paymentMethod || 'cash',
      note: note || '',
      recordedBy: req.user.id,
    });

    await updateStudentFeeStatus(fee.studentId);

    res.json({
      success: true,
      message: 'Payment recorded',
      data: {
        _id: fee._id,
        period: formatPeriod(fee.startDate, fee.endDate),
        amount: fee.amount,
        paidAmount: fee.paidAmount,
        balance: fee.amount - fee.paidAmount,
        status: fee.status,
        receiptNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFeeSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const allFees = await Fee.find();
    const thisMonthFees = allFees.filter(f => {
      const start = new Date(f.startDate);
      return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
    });
    res.json({
      success: true,
      data: {
        totalBilled: allFees.reduce((s, f) => s + f.amount, 0),
        totalCollected: allFees.reduce((s, f) => s + f.paidAmount, 0),
        totalPending: allFees.reduce((s, f) => s + (f.amount - f.paidAmount), 0),
        thisMonthBilled: thisMonthFees.reduce((s, f) => s + f.amount, 0),
        thisMonthCollected: thisMonthFees.reduce((s, f) => s + f.paidAmount, 0),
        thisMonthPending: thisMonthFees.reduce((s, f) => s + (f.amount - f.paidAmount), 0),
        paid: allFees.filter(f => f.status === 'paid').length,
        pending: allFees.filter(f => f.status === 'pending').length,
        partial: allFees.filter(f => f.status === 'partial').length,
        total: allFees.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyFees = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const fees = await Fee.find({ studentId: student._id }).sort({ startDate: 1 });
    res.json({
      success: true,
      data: fees.map(f => ({
        _id: f._id,
        period: formatPeriod(f.startDate, f.endDate),
        amount: f.amount,
        paidAmount: f.paidAmount,
        balance: f.amount - f.paidAmount,
        status: f.status,
        note: f.note,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const deleteFeeRecord = async (req, res, next) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }
    res.json({ success: true, message: 'Fee record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentFeeProfile,
  addNextMonthFee,
  updateFeePayment,
  getFeeSummary,
  getMyFees,
  deleteFeeRecord,
};