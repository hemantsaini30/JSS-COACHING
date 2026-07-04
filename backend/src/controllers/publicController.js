const Inquiry = require('../models/Inquiry');

const submitInquiry = async (req, res, next) => {
  try {
    const { name, phone, targetCourse } = req.body;
    if (!name || !phone || !targetCourse) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const inquiry = await Inquiry.create({ name, phone, targetCourse });
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data: inquiry });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitInquiry };