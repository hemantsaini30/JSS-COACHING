const DoubtSession     = require('../models/DoubtSession');
const DoubtMessage     = require('../models/DoubtMessage');
const { cloudinary }   = require('../config/cloudinary');

const runDoubtCleanup = async () => {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const stale = await DoubtSession.find({
      isSavedByStudent: false,
      isSavedByTeacher: false,
      lastMessageAt: { $lt: cutoff },
    }).select('_id');

    if (!stale.length) return;

    const ids = stale.map(s => s._id);

    // Delete Cloudinary files for all messages in stale sessions
    const messages = await DoubtMessage.find({ sessionId: { $in: ids }, filePublicId: { $ne: '' } })
      .select('filePublicId fileMimeType');

    for (const m of messages) {
      const isVoice = m.fileMimeType?.startsWith('audio/');
      await cloudinary.uploader.destroy(m.filePublicId, {
        resource_type: isVoice ? 'video' : 'image',
      }).catch(() => {});  // non-fatal if Cloudinary file already gone
    }

    await DoubtMessage.deleteMany({ sessionId: { $in: ids } });
    await DoubtSession.deleteMany({ _id: { $in: ids } });

    console.log(`🧹 Doubt cleanup: removed ${stale.length} expired session(s)`);
  } catch (err) {
    console.error('Doubt cleanup failed:', err.message);
  }
};

module.exports = runDoubtCleanup;