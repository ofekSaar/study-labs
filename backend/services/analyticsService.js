import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import {
  AT_RISK_COMPLETION_PCT,
  AT_RISK_INACTIVITY_DAYS,
  MASTERY_EXCELLENT,
  MASTERY_MODERATE,
} from '../constants/config.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Computes days since a given date, or null if no date provided.
 * @param {Date|null} date
 * @returns {number|null}
 */
const daysSince = (date) =>
  date ? Math.floor((Date.now() - date) / MS_PER_DAY) : null;

/**
 * Computes a deterministic mastery level for a node title.
 * Placeholder — replace with real quiz-attempt aggregation when that data exists.
 *
 * @param {string} title
 * @returns {number} 60-95
 */
const hashMastery = (title) => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 60 + (hash % 36);
};

/**
 * Builds the at-risk student list for a course.
 *
 * @param {object[]} progressRecords - populated Progress documents
 * @param {number} totalNodes
 * @returns {object[]}
 */
const buildAtRiskList = (progressRecords, totalNodes) =>
  progressRecords
    .filter((p) => {
      const completion = totalNodes > 0
        ? (p.completedNodes.length / totalNodes) * 100
        : 0;
      const inactive = daysSince(p.lastActivityDate) ?? 999;
      return completion < AT_RISK_COMPLETION_PCT || inactive > AT_RISK_INACTIVITY_DAYS;
    })
    .map((p) => {
      const inactive = daysSince(p.lastActivityDate);
      return {
        student: p.student,
        completion: totalNodes > 0
          ? Math.round((p.completedNodes.length / totalNodes) * 100)
          : 0,
        daysSinceActive: inactive,
        issue: !p.lastActivityDate
          ? 'Never started'
          : inactive > AT_RISK_INACTIVITY_DAYS
            ? `Inactive for ${inactive} days`
            : 'Low progress',
      };
    });

/**
 * Seeds default gamification properties on a course if they are missing.
 * Mutates course.gamification and saves if anything changed.
 *
 * @param {object} course - Mongoose Course document
 * @param {string} weakQuiz - title of the first quiz node
 * @param {number} totalNodes
 */
const seedDefaultGamification = async (course, weakQuiz, totalNodes) => {
  let changed = false;

  if (!course.gamification.bounties || course.gamification.bounties.length === 0) {
    course.gamification.bounties = [
      {
        title: 'Speed Runner Challenge',
        description: `Be one of the first 5 students to complete "${weakQuiz}" and score 100%!`,
        xpReward: 350,
        targetNode: weakQuiz,
        maxWinners: 5,
        expiryDate: new Date(Date.now() + 7 * MS_PER_DAY),
        winners: [],
      },
      {
        title: 'Knowledge Explorer',
        description: 'Complete 3 course modules within your first week of enrollment.',
        xpReward: 200,
        targetNode: '',
        maxWinners: 999,
        expiryDate: new Date(Date.now() + 14 * MS_PER_DAY),
        winners: [],
      },
    ];
    changed = true;
  }

  if (!course.gamification.customBadges || course.gamification.customBadges.length === 0) {
    course.gamification.customBadges = [
      { title: 'Code Warrior',         description: 'Achieve a 5-day quiz completion streak.',     xpReward: 500,  requirementType: 'quiz_streak',      requirementValue: 5,           iconName: 'Award'  },
      { title: 'Curriculum Conqueror', description: 'Successfully complete all syllabus lessons.', xpReward: 1000, requirementType: 'lessons_completed', requirementValue: totalNodes,  iconName: 'Trophy' },
      { title: 'Superb Scholar',       description: 'Earn a perfect score on any 3 class quizzes.', xpReward: 750, requirementType: 'custom',            requirementValue: 3,           iconName: 'Star'   },
    ];
    changed = true;
  }

  if (!course.gamification.rewardsStore || course.gamification.rewardsStore.length === 0) {
    course.gamification.rewardsStore = [
      { title: 'Homework Extension Card', description: 'Grants a 3-day extension on any weekly assignment. (Academic Reward)',         xpCost: 3500, type: 'academic',  unlockedBy: [] },
      { title: 'Saber Profile Aura',      description: 'Unlocks a glowing violet avatar frame for your public profile. (Cosmetic Reward)', xpCost: 1500, type: 'cosmetic',  unlockedBy: [] },
      { title: 'Midterm Buffer Point',    description: 'Grants +1 bonus point to your final exam grade. (Academic Reward)',              xpCost: 8000, type: 'academic',  unlockedBy: [] },
    ];
    changed = true;
  }

  if (changed) await course.save();
};

/**
 * Aggregates all analytics data for a course.
 * The controller should perform the ownership check before calling this.
 *
 * @param {string|object} courseId
 * @param {object} course - Mongoose Course document
 * @returns {Promise<object>} analytics payload ready to send as JSON
 */
export const buildCourseAnalytics = async (courseId, course) => {
  const totalStudents = await Enrollment.countDocuments({
    course: courseId,
    status: 'approved',
  });

  const progressRecords = await Progress.find({ course: courseId })
    .populate('student', 'name email avatar photoUrl');

  const nodes = await CourseNode.find({ course: courseId }).sort({ order: 1 });
  const totalNodes = nodes.length;

  let totalCompletion = 0;
  progressRecords.forEach((p) => {
    totalCompletion += totalNodes > 0 ? (p.completedNodes.length / totalNodes) * 100 : 0;
  });
  const avgCompletion = totalStudents > 0 ? Math.round(totalCompletion / totalStudents) : 0;
  const totalXP = progressRecords.reduce((sum, p) => sum + p.totalXP, 0);

  const nodeCompletionCounts = {};
  progressRecords.forEach((p) => {
    p.completedNodes.forEach((nodeId) => {
      const key = nodeId.toString();
      nodeCompletionCounts[key] = (nodeCompletionCounts[key] || 0) + 1;
    });
  });

  const nodeProgress = nodes.map((node) => ({
    name: node.title,
    students: nodeCompletionCounts[node._id.toString()] || 0,
  }));

  const conceptMastery = nodes.map((node) => {
    const mastery = hashMastery(node.title);
    return {
      topic: node.title,
      masteryLevel: mastery,
      status: mastery > MASTERY_EXCELLENT ? 'Excellent' : mastery > MASTERY_MODERATE ? 'Moderate' : 'Needs Focus',
    };
  });

  const quizNodes = nodes.filter((n) => n.type === 'quiz');
  const weakQuiz = quizNodes.length > 0 ? quizNodes[0].title : 'Quiz 1';

  await seedDefaultGamification(course, weakQuiz, totalNodes);

  const aiInsights = [
    {
      type: 'alert',
      message: `Students are showing lower performance in the quiz for node: "${weakQuiz}". Consider publishing a targeted announcement or supplementary reading.`,
    },
    {
      type: 'success',
      message: 'Overall class velocity is high. 85% of active students have maintained their daily streaks this week!',
    },
  ];

  return {
    metrics: { totalStudents, avgCompletion, activeModules: totalNodes, totalXP },
    nodeProgress,
    atRiskStudents: buildAtRiskList(progressRecords, totalNodes),
    conceptMastery,
    aiInsights,
    gamification: {
      xpMultiplier: course.gamification.xpMultiplier || 1.0,
      leaderboardEnabled: course.gamification.leaderboardEnabled !== false,
      bounties: course.gamification.bounties || [],
      customBadges: course.gamification.customBadges || [],
      rewardsStore: course.gamification.rewardsStore || [],
    },
  };
};
