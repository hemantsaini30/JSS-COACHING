const Payment = require('../models/Payment');
const Fee = require('../models/Fee');
const Student = require('../models/Student');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const generateReceiptNumber = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${dateStr}-${random}`;
};

const updateFeeStatus = async (fee) => {
  if (fee.paidAmount >= fee.amount) fee.status = 'paid';
  else if (fee.paidAmount > 0) fee.status = 'partial';
  else fee.status = 'pending';
  await fee.save();

  const allStudentFees = await Fee.find({ studentId: fee.studentId });
  const hasPartial = allStudentFees.some(f => f.status === 'partial');
  const hasPending = allStudentFees.some(f => f.status === 'pending');
  const allPaid = allStudentFees.every(f => f.status === 'paid');
  let studentStatus = 'paid';
  if (allPaid) studentStatus = 'paid';
  else if (hasPartial || (hasPending && !allStudentFees.every(f => f.status === 'pending'))) studentStatus = 'partial';
  else studentStatus = 'pending';
  await Student.findByIdAndUpdate(fee.studentId, { feeStatus: studentStatus });
};

const recordPayment = async (req, res, next) => {
  try {
    const { feeId, amount, paymentMethod, note } = req.body;
    if (!feeId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'feeId and a valid amount are required' });
    }

    const fee = await Fee.findById(feeId).populate({ path: 'studentId', select: 'fullName' });
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const balance = fee.amount - fee.paidAmount;
    if (amount > balance) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds balance. Maximum payable is ₹${balance}`
      });
    }

    let receiptNumber = generateReceiptNumber();
    // ensure uniqueness
    let exists = await Payment.findOne({ receiptNumber });
    while (exists) {
      receiptNumber = generateReceiptNumber();
      exists = await Payment.findOne({ receiptNumber });
    }

    const payment = await Payment.create({
      studentId: fee.studentId,
      feeId,
      amount,
      paymentMethod: paymentMethod || 'cash',
      note: note || '',
      receiptNumber,
      recordedBy: req.user.id,
    });

    fee.paidAmount += amount;
    await updateFeeStatus(fee);

    const populated = await Payment.findById(payment._id)
      .populate({ path: 'studentId', select: 'fullName', populate: { path: 'userId', select: 'username' } })
      .populate({ path: 'feeId', select: 'month year amount' })
      .populate('recordedBy', 'username');

    res.status(201).json({ success: true, message: 'Payment recorded', data: populated });
  } catch (error) {
    next(error);
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    const { studentId, batchId } = req.query;
    let filter = {};
    if (studentId) filter.studentId = studentId;

    let payments = await Payment.find(filter)
      .populate({ path: 'studentId', select: 'fullName batchId', populate: [{ path: 'userId', select: 'username' }, { path: 'batchId', select: 'name' }] })
      .populate({ path: 'feeId', select: 'month year amount' })
      .populate('recordedBy', 'username')
      .sort({ paymentDate: -1 });

    if (batchId) {
      payments = payments.filter(p => p.studentId?.batchId?._id?.toString() === batchId);
    }

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const payments = await Payment.find({ studentId: student._id })
      .populate({ path: 'feeId', select: 'month year amount' })
      .populate('recordedBy', 'username')
      .sort({ paymentDate: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getPaymentsByFee = async (req, res, next) => {
  try {
    const payments = await Payment.find({ feeId: req.params.feeId })
      .populate('recordedBy', 'username')
      .sort({ paymentDate: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    const fee = await Fee.findById(payment.feeId);
    if (fee) {
      fee.paidAmount = Math.max(0, fee.paidAmount - payment.amount);
      await updateFeeStatus(fee);
    }
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment deleted and fee balance updated' });
  } catch (error) {
    next(error);
  }
};

const getStudentLedger = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate('userId', 'username')
      .populate('batchId', 'name');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const fees = await Fee.find({ studentId }).sort({ year: 1, month: 1 });
    const payments = await Payment.find({ studentId })
      .populate('recordedBy', 'username')
      .sort({ paymentDate: 1 });

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const ledger = fees.map(fee => {
      const feePayments = payments.filter(p => p.feeId.toString() === fee._id.toString());
      return {
        feeId: fee._id,
        period: `${MONTHS[fee.month - 1]} ${fee.year}`,
        month: fee.month,
        year: fee.year,
        amount: fee.amount,
        paidAmount: fee.paidAmount,
        balance: fee.amount - fee.paidAmount,
        status: fee.status,
        generatedDate: fee.generatedDate,
        payments: feePayments.map(p => ({
          _id: p._id,
          receiptNumber: p.receiptNumber,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
          note: p.note,
          recordedBy: p.recordedBy?.username,
        })),
      };
    });

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
          feeStatus: student.feeStatus,
        },
        ledger,
        summary: {
          totalBilled,
          totalPaid,
          totalBalance: totalBilled - totalPaid,
          totalMonths: fees.length,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { recordPayment, getAllPayments, getMyPayments, getPaymentsByFee, deletePayment, getStudentLedger };