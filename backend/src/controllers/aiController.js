const Groq = require('groq-sdk');

const generateQuestions = async (req, res, next) => {
  try {
    const { topic, grade, difficulty, context, count = 10 } = req.body;
    if (!topic || !grade || !difficulty) {
      return res.status(400).json({ success: false, message: 'topic, grade and difficulty are required' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const contextSection = context ? `\n\nSource material / context:\n${context}` : '';

    const prompt = `Generate exactly ${count} multiple choice questions about "${topic}" for ${grade} students at ${difficulty} difficulty level.${contextSection}

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation. Start directly with [ and end with ].

Each object must have:
- "question": question text (string)
- "options": object with keys "A", "B", "C", "D"
- "correctOption": one of "A", "B", "C", "D"
- "explanation": 2-3 sentence explanation of why the answer is correct
- "difficulty": "${difficulty}"

Ensure questions are clear, unambiguous, and educationally valuable.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawText = completion.choices[0]?.message?.content || '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Could not parse AI response as JSON');
      questions = JSON.parse(match[0]);
    }

    if (!Array.isArray(questions)) throw new Error('AI did not return an array');

    const validated = questions
      .filter(q => q.question && q.options?.A && q.options?.B && q.options?.C && q.options?.D && ['A', 'B', 'C', 'D'].includes(q.correctOption))
      .map(q => ({
        questionText: q.question,
        options: { A: q.options.A, B: q.options.B, C: q.options.C, D: q.options.D },
        correctOption: q.correctOption,
        explanation: q.explanation || '',
        difficulty: q.difficulty || difficulty,
      }));

    res.json({ success: true, data: validated, count: validated.length });
  } catch (error) {
    if (error.status === 401) {
      return res.status(500).json({ success: false, message: 'Invalid Groq API key. Check your .env file.' });
    }
    next(error);
  }
};

module.exports = { generateQuestions };