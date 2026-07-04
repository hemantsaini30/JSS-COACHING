const Razorpay = require('razorpay');
const crypto = require('crypto');
const RazorpayOrder = require('../models/RazorpayOrder');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured in environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const updateStudentFeeStatus = async (studentId) => {
  const fees = await Fee.find({ studentId });
  if (!fees.length) return;
  const allPaid = fees.every(f => f.status === 'paid');
  const allPending = fees.every(f => f.status === 'pending');
  const status = allPaid ? 'paid' : allPending ? 'pending' : 'partial';
  await Student.findByIdAndUpdate(studentId, { feeStatus: status });
};

const generateReceiptNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let receiptNumber = `RCP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
  let exists = await Payment.findOne({ receiptNumber });
  while (exists) {
    receiptNumber = `RCP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await Payment.findOne({ receiptNumber });
  }
  return receiptNumber;
};

// Student creates a Razorpay order for a pending fee
const createOrder = async (req, res, next) => {
  try {
    const { feeId } = req.body;
    if (!feeId) {
      return res.status(400).json({ success: false, message: 'feeId is required' });
    }

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    // Security: ensure this fee belongs to this student
    if (fee.studentId.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This fee is already fully paid' });
    }

    const balance = fee.amount - fee.paidAmount;
    if (balance <= 0) {
      return res.status(400).json({ success: false, message: 'No outstanding balance for this fee' });
    }

    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: balance * 100,
      currency: 'INR',
      receipt: `fee_${fee._id.toString().slice(-8)}_${Date.now()}`.slice(0, 40),
      notes: {
        studentName: student.fullName,
        feeId: fee._id.toString(),
      },
    });

    await RazorpayOrder.create({
      orderId: order.id,
      feeId: fee._id,
      studentId: student._id,
      amountInPaise: order.amount,
      amountInRupees: balance,
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        studentName: student.fullName,
        feeBalance: balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Student verifies payment after Razorpay checkout completes
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Step 1 — Verify Razorpay signature (HMAC SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    // Step 2 — Find our order record
    const razorpayOrder = await RazorpayOrder.findOne({ orderId: razorpay_order_id });
    if (!razorpayOrder) {
      return res.status(404).json({ success: false, message: 'Order not found in system' });
    }

    // Security: ensure this order belongs to this student
    if (razorpayOrder.studentId.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Step 3 — Idempotency: if already processed, return success without double-recording
    if (razorpayOrder.status === 'paid') {
      return res.json({ success: true, message: 'Payment already recorded', alreadyProcessed: true });
    }

    // Step 4 — Get the fee record
    const fee = await Fee.findById(razorpayOrder.feeId);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const amountPaid = razorpayOrder.amountInRupees;

    // Step 5 — Create permanent payment record
    const receiptNumber = await generateReceiptNumber();

    await Payment.create({
      studentId: student._id,
      feeId: fee._id,
      amount: amountPaid,
      receiptNumber,
      paymentMethod: 'online',
      note: `Online payment via Razorpay | Ref: ${razorpay_payment_id}`,
      recordedBy: student.userId,
    });

    // Step 6 — Update fee balance and status
    fee.paidAmount += amountPaid;
    if (fee.paidAmount >= fee.amount) fee.status = 'paid';
    else if (fee.paidAmount > 0) fee.status = 'partial';
    await fee.save();

    // Step 7 — Mark Razorpay order as paid
    razorpayOrder.status = 'paid';
    razorpayOrder.razorpayPaymentId = razorpay_payment_id;
    razorpayOrder.razorpaySignature = razorpay_signature;
    await razorpayOrder.save();

    // Step 8 — Update student overall fee status
    await updateStudentFeeStatus(student._id);

    res.json({
      success: true,
      message: 'Payment verified and recorded successfully',
      data: {
        receiptNumber,
        amountPaid,
        feeStatus: fee.status,
        razorpayPaymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin — see all online payments
const getOnlinePayments = async (req, res, next) => {
  try {
    const orders = await RazorpayOrder.find({ status: 'paid' })
      .populate({
        path: 'studentId',
        select: 'fullName batchId',
        populate: [
          { path: 'userId', select: 'username' },
          { path: 'batchId', select: 'name' },
        ],
      })
      .populate('feeId', 'amount startDate endDate')
      .sort({ updatedAt: -1 });

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatPeriod = (start, end) => {
      const s = new Date(start);
      const e = new Date(end);
      return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
    };

    const data = orders.map(o => ({
      _id: o._id,
      orderId: o.orderId,
      razorpayPaymentId: o.razorpayPaymentId,
      studentName: o.studentId?.fullName,
      username: o.studentId?.userId?.username,
      batchName: o.studentId?.batchId?.name,
      amountInRupees: o.amountInRupees,
      period: o.feeId ? formatPeriod(o.feeId.startDate, o.feeId.endDate) : '—',
      paidAt: o.updatedAt,
    }));

    const totalOnlineCollection = orders.reduce((s, o) => s + o.amountInRupees, 0);

    res.json({ success: true, data, totalOnlineCollection });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getOnlinePayments };