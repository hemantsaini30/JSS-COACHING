const Inquiry = require('../models/Inquiry');

const getAllInquiries = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (error) {
    next(error);
  }
};

const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'contacted', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Status updated', data: inquiry });
  } catch (error) {
    next(error);
  }
};

const deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Inquiry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllInquiries, updateInquiryStatus, deleteInquiry };