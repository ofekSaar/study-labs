import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import {
  completeCourseNode,
  computeMultiplier,
  COIN_RATE,
} from '../services/gamificationService.js';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import XpEvent from '../models/XpEvent.js';
import User from '../models/User.js';

const makeCourse = async (instructorId) =>
  Course.create({
    title: 'Test Course',
    department: 'cs',
    description: 'A course used for XP tests.',
    instructor: instructorId,
    syllabus: {
      filename: 'syllabus.pdf',
      originalName: 'syllabus.pdf',
      mimetype: 'application/pdf',
      storagePath: '/tmp/syllabus.pdf',
      size: 1234,
    },
  });

describe('computeMultiplier', () => {
  it('applies streak tiers', () => {
    expect(computeMultiplier({ streak: 0, hour: 12 }).multiplier).toBe(1.0);
    expect(computeMultiplier({ streak: 3, hour: 12 }).multiplier).toBe(1.2);
    expect(computeMultiplier({ streak: 5, hour: 12 }).multiplier).toBe(1.5);
  });

  it('stacks the boost token multiplicatively', () => {
    const { multiplier } = computeMultiplier({ streak: 5, hour: 12, hasBoost: true });
    expect(multiplier).toBe(3.0); // 1.5 * 2.0
  });

  it('applies the night-owl hour bonus', () => {
    expect(computeMultiplier({ streak: 0, hour: 2 }).multiplier).toBe(1.5);
  });
});

describe('completeCourseNode (server-authoritative)', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_secret';
    await connectTestDB();
  });
  afterAll(async () => {
    await closeTestDB();
  });
  beforeEach(async () => {
    await clearTestDB();
  });

  it('awards score × multiplier, mints coins, writes an XpEvent, and consumes a boost token', async () => {
    const { user: instructor } = await generateTestUser('instructor');
    const { user: student } = await generateTestUser('student');

    const course = await makeCourse(instructor._id);
    const node = await CourseNode.create({
      course: course._id,
      title: 'Lesson 1',
      type: 'quiz',
      order: 1,
      xpReward: 150,
      quizData: [{ type: 'mcq', question: 'q', options: ['a', 'b'], correctAnswerIndex: 0 }],
    });
    await Enrollment.create({ student: student._id, course: course._id, status: 'approved' });
    await QuizAttempt.create({
      student: student._id,
      courseNode: node._id,
      answers: [{ questionIndex: 0, selectedOption: 0, isCorrect: true }],
      score: 100,
      xpEarned: 100,
    });
    // Give the student a boost token to consume
    await User.findByIdAndUpdate(student._id, { xpBoosts: 1 });

    const result = await completeCourseNode(
      { _id: student._id, role: 'student' },
      course._id.toString(),
      node._id.toString()
    );

    // baseXp comes from the graded attempt (100), not node.xpReward (150)
    expect(result.baseXp).toBe(100);
    expect(result.xpAwarded).toBe(Math.round(100 * result.multiplier));
    expect(result.boostConsumed).toBe(true);
    expect(result.coinsMinted).toBe(Math.round(result.xpAwarded * COIN_RATE));

    // Boost token consumed, coins minted, XP credited
    const dbUser = await User.findById(student._id);
    expect(dbUser.xpBoosts).toBe(0);
    expect(dbUser.coins).toBe(100 + result.coinsMinted);
    expect(dbUser.stats.total_xp).toBe(result.xpAwarded);

    // Exactly one immutable audit record was written
    const events = await XpEvent.find({ student: student._id });
    expect(events).toHaveLength(1);
    expect(events[0].xpAwarded).toBe(result.xpAwarded);
    expect(events[0].source).toBe('quiz');
  });

  it('rejects a double completion without a second payout', async () => {
    const { user: instructor } = await generateTestUser('instructor');
    const { user: student } = await generateTestUser('student');
    const course = await makeCourse(instructor._id);
    const node = await CourseNode.create({
      course: course._id,
      title: 'Lesson 1',
      type: 'lesson',
      order: 1,
      xpReward: 150,
    });
    await Enrollment.create({ student: student._id, course: course._id, status: 'approved' });

    const u = { _id: student._id, role: 'student' };
    await completeCourseNode(u, course._id.toString(), node._id.toString());
    await expect(
      completeCourseNode(u, course._id.toString(), node._id.toString())
    ).rejects.toThrow(/already completed/i);

    const events = await XpEvent.find({ student: student._id });
    expect(events).toHaveLength(1);
  });
});
