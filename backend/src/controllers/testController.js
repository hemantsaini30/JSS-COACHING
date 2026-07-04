const Test = require('../models/Test');
const Question = require('../models/Question');
const TestSubmission = require('../models/TestSubmission');
const TestAnswer = require('../models/TestAnswer');
const Student = require('../models/Student');

const isWithinWindow = (test) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return test.liveDate === todayStr && currentTime >= test.startTime && currentTime <= test.endTime;
};

// ─── TEACHER ────────────────────────────────────────────────

const createTest = async (req, res, next) => {
  try {
    const { title, subject, instructions, assignedBatches, assignedStudents, liveDate, startTime, endTime, duration } = req.body;
    if (!title || !subject || !liveDate || !startTime || !endTime || !duration) {
      return res.status(400).json({ success: false, message: 'title, subject, liveDate, startTime, endTime and duration are required' });
    }
    const test = await Test.create({
      title, subject,
      instructions: instructions || '',
      createdBy: req.user.id,
      assignedBatches: assignedBatches || [],
      assignedStudents: assignedStudents || [],
      liveDate, startTime, endTime,
      duration: Number(duration),
    });
    res.status(201).json({ success: true, message: 'Test created as draft', data: test });
  } catch (error) { next(error); }
};

const getMyTests = async (req, res, next) => {
  try {
    const tests = await Test.find({ createdBy: req.user.id })
      .populate('assignedBatches', 'name')
      .sort({ createdAt: -1 });
    const result = await Promise.all(tests.map(async (test) => {
      const questionCount = await Question.countDocuments({ testId: test._id });
      const submissionCount = await TestSubmission.countDocuments({ testId: test._id, status: { $ne: 'in_progress' } });
      return { ...test.toObject(), questionCount, submissionCount };
    }));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const getTestById = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('assignedBatches', 'name course')
      .populate('createdBy', 'username fullName');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (req.user.role === 'teacher' && test.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const questions = await Question.find({ testId: test._id }).sort({ order: 1 });
    res.json({ success: true, data: { test, questions } });
  } catch (error) { next(error); }
};

const updateTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (test.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft tests can be edited' });
    const allowed = ['title', 'subject', 'instructions', 'assignedBatches', 'assignedStudents', 'liveDate', 'startTime', 'endTime', 'duration'];
    allowed.forEach(field => { if (req.body[field] !== undefined) test[field] = req.body[field]; });
    await test.save();
    res.json({ success: true, message: 'Test updated', data: test });
  } catch (error) { next(error); }
};

const addQuestion = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (test.status === 'closed') return res.status(400).json({ success: false, message: 'Cannot modify a closed test' });
    const { questionText, options, correctOption, explanation, difficulty, marks } = req.body;
    if (!questionText || !options || !correctOption) {
      return res.status(400).json({ success: false, message: 'questionText, options and correctOption are required' });
    }
    const count = await Question.countDocuments({ testId: test._id });
    const question = await Question.create({
      testId: test._id, questionText, options, correctOption,
      explanation: explanation || '', difficulty: difficulty || 'medium',
      marks: marks || 1, order: count + 1,
    });
    test.totalMarks = (test.totalMarks || 0) + (marks || 1);
    await test.save();
    res.status(201).json({ success: true, message: 'Question added', data: question });
  } catch (error) { next(error); }
};

const addBulkQuestions = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (test.status === 'closed') return res.status(400).json({ success: false, message: 'Cannot modify a closed test' });
    const { questions } = req.body;
    if (!questions?.length) return res.status(400).json({ success: false, message: 'questions array is required' });
    const currentCount = await Question.countDocuments({ testId: test._id });
    const docs = questions.map((q, i) => ({
      testId: test._id,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      order: currentCount + i + 1,
    }));
    const created = await Question.insertMany(docs);
    test.totalMarks = (test.totalMarks || 0) + docs.reduce((s, q) => s + q.marks, 0);
    await test.save();
    res.status(201).json({ success: true, message: `${created.length} questions added`, data: created });
  } catch (error) { next(error); }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (test.status === 'closed') return res.status(400).json({ success: false, message: 'Cannot modify a closed test' });
    const question = await Question.findOneAndDelete({ _id: req.params.qId, testId: test._id });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    test.totalMarks = Math.max(0, (test.totalMarks || 0) - question.marks);
    await test.save();
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) { next(error); }
};

const publishTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (test.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft tests can be published' });
    const qCount = await Question.countDocuments({ testId: test._id });
    if (qCount === 0) return res.status(400).json({ success: false, message: 'Add at least one question before publishing' });
    if (!test.assignedBatches.length && !test.assignedStudents.length) {
      return res.status(400).json({ success: false, message: 'Assign to at least one batch before publishing' });
    }
    test.status = 'published';
    await test.save();
    res.json({ success: true, message: 'Test published. Students can now see it.', data: test });
  } catch (error) { next(error); }
};

const closeTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (test.status !== 'published') return res.status(400).json({ success: false, message: 'Only published tests can be closed' });
    test.status = 'closed';
    await test.save();
    res.json({ success: true, message: 'Test closed. Students can now view their results.', data: test });
  } catch (error) { next(error); }
};

const deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (test.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft tests can be deleted' });
    await Question.deleteMany({ testId: test._id });
    await Test.findByIdAndDelete(test._id);
    res.json({ success: true, message: 'Test deleted' });
  } catch (error) { next(error); }
};

// ─── STUDENT ────────────────────────────────────────────────

const getAvailableTests = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const tests = await Test.find({
      status: { $in: ['published', 'closed'] },
      $or: [{ assignedBatches: student.batchId }, { assignedStudents: student._id }],
    }).populate('createdBy', 'username fullName').sort({ liveDate: -1 });

    const result = await Promise.all(tests.map(async (test) => {
      const submission = await TestSubmission.findOne({ testId: test._id, studentId: student._id });
      const questionCount = await Question.countDocuments({ testId: test._id });
      const isLive = isWithinWindow(test);
      const isSubmitted = submission && submission.status !== 'in_progress';
      return {
        _id: test._id,
        title: test.title,
        subject: test.subject,
        instructions: test.instructions,
        liveDate: test.liveDate,
        startTime: test.startTime,
        endTime: test.endTime,
        duration: test.duration,
        totalMarks: test.totalMarks,
        questionCount,
        status: test.status,
        createdBy: test.createdBy,
        isLive,
        canStart: test.status === 'published' && isLive && !submission,
        canResume: test.status === 'published' && isLive && submission?.status === 'in_progress',
        isSubmitted,
        canReview: test.status === 'closed' && isSubmitted,
        submission: submission ? {
          status: submission.status,
          score: submission.score,
          percentage: submission.percentage,
          startedAt: submission.startedAt,
        } : null,
      };
    }));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const startTest = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'published') return res.status(400).json({ success: false, message: 'Test is not available' });

    const isAssigned = test.assignedBatches.map(b => b.toString()).includes(student.batchId.toString()) ||
                       test.assignedStudents.map(s => s.toString()).includes(student._id.toString());
    if (!isAssigned) return res.status(403).json({ success: false, message: 'You are not assigned to this test' });
    if (!isWithinWindow(test)) {
      return res.status(400).json({ success: false, message: `Test is not live. Available on ${test.liveDate} from ${test.startTime} to ${test.endTime}` });
    }

    const testInfo = {
      _id: test._id,
      title: test.title,
      subject: test.subject,
      instructions: test.instructions,
      duration: test.duration,
      totalMarks: test.totalMarks,
    };

    const existing = await TestSubmission.findOne({ testId: test._id, studentId: student._id });
    if (existing) {
      if (existing.status !== 'in_progress') {
        return res.status(400).json({ success: false, message: 'You have already submitted this test' });
      }
      const elapsed = (Date.now() - new Date(existing.startedAt)) / 1000;
      if (elapsed > test.duration * 60 + 60) {
        existing.status = 'auto_submitted';
        existing.submittedAt = new Date();
        existing.timeTaken = test.duration * 60;
        await existing.save();
        return res.status(400).json({ success: false, message: 'Test time expired and was auto-submitted' });
      }
      const questions = await Question.find({ testId: test._id }, '-correctOption -explanation').sort({ order: 1 });
      return res.json({ success: true, data: { test: testInfo, submission: existing, questions } });
    }

    const submission = await TestSubmission.create({
      testId: test._id, studentId: student._id,
      startedAt: new Date(), totalMarks: test.totalMarks,
    });
    const questions = await Question.find({ testId: test._id }, '-correctOption -explanation').sort({ order: 1 });
    res.status(201).json({ success: true, data: { test: testInfo, submission, questions } });
  } catch (error) { next(error); }
};

const submitTest = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const submission = await TestSubmission.findOne({
      testId: req.params.id, studentId: student._id, status: 'in_progress',
    });
    if (!submission) return res.status(404).json({ success: false, message: 'No active submission found' });
    const test = await Test.findById(req.params.id);
    const { answers = [], autoSubmit } = req.body;

    const elapsed = (Date.now() - new Date(submission.startedAt)) / 1000;
    const isTimedOut = elapsed > test.duration * 60 + 60;
    const status = autoSubmit || isTimedOut ? 'auto_submitted' : 'submitted';

    const questions = await Question.find({ testId: test._id });
    let score = 0;
    const answerDocs = questions.map(q => {
      const studentAnswer = answers.find(a => a.questionId === q._id.toString());
      const selectedOption = studentAnswer?.selectedOption || null;
      const isCorrect = selectedOption !== null && selectedOption === q.correctOption;
      if (isCorrect) score += q.marks;
      return { submissionId: submission._id, testId: test._id, studentId: student._id, questionId: q._id, selectedOption, isCorrect };
    });

    await TestAnswer.insertMany(answerDocs);
    const timeTaken = Math.min(Math.round(elapsed), test.duration * 60);
    const percentage = test.totalMarks > 0 ? Math.round((score / test.totalMarks) * 100) : 0;
    submission.status = status;
    submission.submittedAt = new Date();
    submission.score = score;
    submission.totalMarks = test.totalMarks;
    submission.percentage = percentage;
    submission.timeTaken = timeTaken;
    await submission.save();
    res.json({ success: true, message: status === 'auto_submitted' ? 'Auto-submitted' : 'Submitted successfully', data: { score, totalMarks: test.totalMarks, percentage, timeTaken, status } });
  } catch (error) { next(error); }
};

const getTestResult = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const test = await Test.findById(req.params.id).populate('createdBy', 'username fullName');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Results not available yet. Teacher has not closed the test.' });
    }
    const submission = await TestSubmission.findOne({ testId: test._id, studentId: student._id });
    if (!submission || submission.status === 'in_progress') {
      return res.status(404).json({ success: false, message: 'No submission found for this test' });
    }
    const answers = await TestAnswer.find({ submissionId: submission._id }).populate('questionId');
    const review = answers.map(a => ({
      questionId: a.questionId._id,
      questionText: a.questionId.questionText,
      options: a.questionId.options,
      selectedOption: a.selectedOption,
      correctOption: a.questionId.correctOption,
      explanation: a.questionId.explanation,
      isCorrect: a.isCorrect,
      marks: a.questionId.marks,
    }));
    res.json({
      success: true,
      data: {
        test: { title: test.title, subject: test.subject },
        submission: { score: submission.score, totalMarks: submission.totalMarks, percentage: submission.percentage, timeTaken: submission.timeTaken, status: submission.status, submittedAt: submission.submittedAt },
        review,
      }
    });
  } catch (error) { next(error); }
};

// ─── ANALYTICS ──────────────────────────────────────────────

const getTestAnalytics = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id).populate('assignedBatches', 'name');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (req.user.role === 'teacher' && test.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const questions = await Question.find({ testId: test._id });
    const submissions = await TestSubmission.find({ testId: test._id, status: { $ne: 'in_progress' } })
      .populate({ path: 'studentId', select: 'fullName', populate: { path: 'userId', select: 'username' } });

    const totalAssigned = await Student.countDocuments({
      $or: [{ batchId: { $in: test.assignedBatches } }, { _id: { $in: test.assignedStudents } }],
    });
    const submitted = submissions.length;
    const avgPercentage = submitted === 0 ? 0 : Math.round(submissions.reduce((s, sub) => s + sub.percentage, 0) / submitted);

    const scoreDistribution = ['0-20', '21-40', '41-60', '61-80', '81-100'].map(range => {
      const [min, max] = range.split('-').map(Number);
      return { range: range + '%', count: submissions.filter(s => s.percentage >= min && s.percentage <= max).length };
    });

    const questionAnalysis = await Promise.all(questions.map(async (q) => {
      const answers = await TestAnswer.find({ questionId: q._id });
      const correct = answers.filter(a => a.isCorrect).length;
      const skipped = answers.filter(a => a.selectedOption === null).length;
      return {
        questionId: q._id,
        questionText: q.questionText.substring(0, 80) + (q.questionText.length > 80 ? '...' : ''),
        difficulty: q.difficulty,
        correctCount: correct,
        incorrectCount: answers.length - correct - skipped,
        skippedCount: skipped,
        correctRate: answers.length === 0 ? 0 : Math.round((correct / answers.length) * 100),
      };
    }));

    const studentResults = submissions.map(sub => ({
      fullName: sub.studentId?.fullName,
      username: sub.studentId?.userId?.username,
      score: sub.score,
      totalMarks: sub.totalMarks,
      percentage: sub.percentage,
      timeTaken: sub.timeTaken,
      status: sub.status,
    })).sort((a, b) => b.percentage - a.percentage);

    res.json({
      success: true,
      data: {
        test: { title: test.title, subject: test.subject, totalMarks: test.totalMarks, duration: test.duration, status: test.status, questionCount: questions.length },
        overview: { totalAssigned, submitted, notSubmitted: totalAssigned - submitted, averagePercentage: avgPercentage },
        scoreDistribution,
        questionAnalysis: questionAnalysis.sort((a, b) => a.correctRate - b.correctRate),
        studentResults,
      },
    });
  } catch (error) { next(error); }
};

const getAllTestsAdmin = async (req, res, next) => {
  try {
    const tests = await Test.find()
      .populate('createdBy', 'username fullName')
      .populate('assignedBatches', 'name')
      .sort({ createdAt: -1 });
    const result = await Promise.all(tests.map(async (test) => {
      const questionCount = await Question.countDocuments({ testId: test._id });
      const submissionCount = await TestSubmission.countDocuments({ testId: test._id, status: { $ne: 'in_progress' } });
      return { ...test.toObject(), questionCount, submissionCount };
    }));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const getAnalyticsOverview = async (req, res, next) => {
  try {
    const allTests = await Test.find();
    const allSubmissions = await TestSubmission.find({ status: { $ne: 'in_progress' } })
      .populate({ path: 'studentId', populate: { path: 'batchId', select: 'name' } });

    const batchMap = {};
    allSubmissions.forEach(sub => {
      const batchName = sub.studentId?.batchId?.name || 'Unknown';
      if (!batchMap[batchName]) batchMap[batchName] = { scores: [] };
      batchMap[batchName].scores.push(sub.percentage);
    });
    const batchPerformance = Object.entries(batchMap).map(([name, data]) => ({
      batchName: name,
      averagePercentage: Math.round(data.scores.reduce((s, p) => s + p, 0) / data.scores.length),
      submissionsCount: data.scores.length,
    })).sort((a, b) => b.averagePercentage - a.averagePercentage);

    const studentScores = {};
    allSubmissions.forEach(sub => {
      const id = sub.studentId?._id?.toString();
      if (!id) return;
      if (!studentScores[id]) studentScores[id] = { name: sub.studentId?.fullName, scores: [] };
      studentScores[id].scores.push(sub.percentage);
    });
    const topPerformers = Object.values(studentScores)
      .map(s => ({ name: s.name, averagePercentage: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) }))
      .sort((a, b) => b.averagePercentage - a.averagePercentage)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalTests: allTests.length,
        publishedTests: allTests.filter(t => t.status === 'published').length,
        closedTests: allTests.filter(t => t.status === 'closed').length,
        totalSubmissions: allSubmissions.length,
        batchPerformance,
        topPerformers,
        recentTests: allTests.slice(-5).reverse().map(t => ({ _id: t._id, title: t.title, subject: t.subject, status: t.status, liveDate: t.liveDate })),
      },
    });
  } catch (error) { next(error); }
};

const getTestLeaderboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Leaderboard is available once the teacher closes the test' });
    }

    const mySubmission = await TestSubmission.findOne({ testId: test._id, studentId: student._id });
    if (!mySubmission || mySubmission.status === 'in_progress') {
      return res.status(403).json({ success: false, message: 'You must complete this test to view the leaderboard' });
    }

    const submissions = await TestSubmission.find({ testId: test._id, status: { $ne: 'in_progress' } })
      .populate('studentId', 'fullName')
      .sort({ score: -1, timeTaken: 1 });

    const maskName = (fullName) => {
      const parts = fullName.trim().split(' ');
      const first = parts[0];
      const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : '';
      return lastInitial ? `${first} ${lastInitial}` : first;
    };

    const leaderboard = submissions.map((sub, i) => ({
      rank: i + 1,
      displayName: maskName(sub.studentId.fullName),
      score: sub.score,
      totalMarks: sub.totalMarks,
      percentage: sub.percentage,
      timeTaken: sub.timeTaken,
      isYou: sub.studentId._id.toString() === student._id.toString(),
    }));

    const avgPercentage = submissions.length === 0 ? 0 :
      Math.round(submissions.reduce((s, sub) => s + sub.percentage, 0) / submissions.length);

    res.json({
      success: true,
      data: {
        test: { title: test.title, subject: test.subject, totalMarks: test.totalMarks },
        leaderboard,
        stats: {
          totalParticipants: submissions.length,
          averagePercentage: avgPercentage,
          topScore: submissions[0]?.score || 0,
          yourRank: leaderboard.find(l => l.isYou)?.rank || null,
        },
      },
    });
  } catch (error) { next(error); }
};

module.exports = {
  createTest, getMyTests, getTestById, updateTest,
  addQuestion, addBulkQuestions, deleteQuestion,
  publishTest, closeTest, deleteTest, getTestLeaderboard,
  getAvailableTests, startTest, submitTest, getTestResult,
  getTestAnalytics, getAllTestsAdmin, getAnalyticsOverview,
};