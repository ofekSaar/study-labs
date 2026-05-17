import mongoose from 'mongoose';
import User from './models/User.js';
import Course from './models/Course.js';
import CourseNode from './models/CourseNode.js';
import Enrollment from './models/Enrollment.js';
import Progress from './models/Progress.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studylabs';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!');

    // 1. Find or create Dev User
    const DEV_EMAIL = 'dev@studylabs.local';
    let devUser = await User.findOne({ email: DEV_EMAIL });
    
    if (!devUser) {
      console.log('Creating dev user...');
      devUser = await User.create({
        provider: 'local',
        providerId: 'mock-dev-user',
        name: 'Dev User',
        email: DEV_EMAIL,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
        roles: ['student', 'instructor'],
        role: 'instructor'
      });
      console.log('Dev user created successfully!');
    } else {
      console.log('Dev user found.');
      devUser.roles = ['student', 'instructor'];
      devUser.role = 'instructor';
      await devUser.save();
    }

    // 2. Clean up any existing seeded courses for dev
    console.log('Cleaning existing sample courses...');
    const existingCourses = await Course.find({
      instructor: devUser._id,
      title: { $in: ['מבוא לשפת פייתון ומשתנים', 'מבוא למדעי המחשב - פייתון', 'מבוא לחדו״א - חשבון אינפיניטסימלי'] }
    });
    
    for (const c of existingCourses) {
      await CourseNode.deleteMany({ course: c._id });
      await Enrollment.deleteMany({ course: c._id });
      await Progress.deleteMany({ course: c._id });
      await Course.deleteOne({ _id: c._id });
    }
    console.log('Cleanup complete.');

    // 3. Seed Course 1: Python
    console.log('Seeding Course 1: Python...');
    const pythonCourse = await Course.create({
      title: 'מבוא למדעי המחשב - פייתון',
      department: 'cs',
      description: 'קורס יסודות מקיף המלמד את עקרונות התכנות בעזרת שפת Python, כולל משתנים, לולאות, פונקציות, ומבני נתונים.',
      instructor: devUser._id,
      color: 'bg-indigo-600',
      level: 'Beginner',
      generationStatus: 'ready',
      isPublished: true,
      syllabus: {
        filename: 'syllabus_python.pdf',
        originalName: 'Python_Syllabus.pdf',
        mimetype: 'application/pdf',
        storagePath: '/dummy/syllabus_python.pdf',
        size: 2048
      },
      gamification: {
        xpMultiplier: 1.2,
        leaderboardEnabled: true
      }
    });

    const pythonNodes = [
      {
        course: pythonCourse._id,
        title: 'מבוא לשפת פייתון ומשתנים',
        type: 'lesson',
        order: 1,
        estimatedMinutes: 20,
        xpReward: 150,
        lessonContent: `# יסודות פייתון ומשתנים\n\nברוכים הבאים לעולם הפיתוח בפייתון! פייתון היא שפה קריאה, אלגנטית וחזקה במיוחד.\n\n## מהו משתנה?\nמשתנה הוא מעין "קופסה" בזיכרון המחשב המאפשרת לנו לשמור ערך ולעשות בו שימוש חוזר.\n\n### הגדרת משתנה:\n\`\`\`python\nx = 5\nname = "StudyLabs"\nprint(x)\nprint(name)\n\`\`\`\n\n## טיפוסי נתונים נפוצים:\n1. **Integer (int)** - מספרים שלמים (לדוגמה \`5\`)\n2. **Float** - מספרים עשרוניים (לדוגמה \`5.5\`)\n3. **String (str)** - מחרוזות טקסט (לדוגמה \`"Hello"\`)\n4. **Boolean (bool)** - ערכי אמת או שקר (\`True\` או \`False\`)`
      },
      {
        course: pythonCourse._id,
        title: 'לולאות ותנאים לוגיים',
        type: 'lesson',
        order: 2,
        estimatedMinutes: 25,
        xpReward: 150,
        lessonContent: `# תנאים לוגיים ולולאות בפייתון\n\nכדי שהקוד שלנו יידע לקבל החלטות ולבצע פעולות חוזרות, נשתמש בתנאים ובניהול זרימה.\n\n## תנאים לוגיים (If/Else):\n\`\`\`python\nage = 20\nif age >= 18:\n    print("הנך רשאי להצביע!")\nelse:\n    print("צעיר מדי להצביע.")\n\`\`\`\n\n## לולאות (Loops):\nלולאות מאפשרות לנו להריץ בלוק קוד שוב ושוב.\n\n### לולאת \`for\`:\n\`\`\`python\nfor i in range(5):\n    print(f"סיבוב מספר {i}")\n\`\`\`\n\n### לולאת \`while\`:\n\`\`\`python\ncount = 0\nwhile count < 3:\n    print(count)\n    count += 1\n\`\`\``
      },
      {
        course: pythonCourse._id,
        title: 'פונקציות ומודולריות',
        type: 'lesson',
        order: 3,
        estimatedMinutes: 30,
        xpReward: 150,
        lessonContent: `# פונקציות ומודולריות בקוד\n\nפונקציה היא בלוק קוד בעל שם המבצע משימה ספציפית. שימוש בפונקציות הופך את הקוד לקריא, נקי ומודולרי.\n\n## הגדרת פונקציה בפייתון:\nנשתמש במילת המפתח \`def\`:\n\`\`\`python\ndef greet_student(name):\n    return f"שלום {name}, ברוך הבא ל-StudyLabs!"\n\n# קריאה לפונקציה\nmessage = greet_student("שלומי")\nprint(message)\n\`\`\`\n\n## ערכי החזרה ופרמטרים:\nפונקציות יכולות לקבל קלטים (פרמטרים) ולהחזיר פלטים בעזרת \`return\`.\n\`\`\`python\ndef add(a, b):\n    return a + b\n\nresult = add(10, 20)\nprint(result) # יודפס 30\n\`\`\``
      },
      {
        course: pythonCourse._id,
        title: 'בוחן מסכם - יסודות התכנות',
        type: 'quiz',
        order: 4,
        estimatedMinutes: 15,
        xpReward: 250,
        quizData: [
          {
            type: 'mcq',
            question: 'כיצד מגדירים פונקציה חדשה בשפת פייתון?',
            options: ['function my_func():', 'def my_func():', 'create my_func():', 'void my_func():'],
            correctAnswerIndex: 1,
            explanation: 'בשפת פייתון משתמשים במילת המפתח def להגדרת פונקציה חדשה.'
          },
          {
            type: 'mcq',
            question: 'מה יהיה פלט הקוד הבא: print(type(5.5))?',
            options: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'bool'>"],
            correctAnswerIndex: 2,
            explanation: 'הערך 5.5 הוא מספר עשרוני השייך לטיפוס הנתונים float.'
          },
          {
            type: 'mcq',
            question: 'כיצד מריצים לולאה בדיוק 5 פעמים בפייתון?',
            options: ['for i in range(5):', 'while i < 5:', 'loop 5 times:', 'repeat 5:'],
            correctAnswerIndex: 0,
            explanation: 'הפונקציה range(5) מייצרת רצף של 5 מספרים (מ-0 עד 4) ולכן הלולאה תרוץ בדיוק 5 פעמים.'
          }
        ]
      }
    ];

    await CourseNode.insertMany(pythonNodes);
    console.log('Python course nodes created!');

    // 4. Seed Course 2: Calculus
    console.log('Seeding Course 2: Calculus...');
    const mathCourse = await Course.create({
      title: 'מבוא לחדו״א - חשבון אינפיניטסימלי',
      department: 'math',
      description: 'קורס מתמטיקה אקדמי המכסה את יסודות החשבון הדיפרנציאלי והאינטגרלי, כולל גבולות, רציפות, נגזרות ושימושיהן.',
      instructor: devUser._id,
      color: 'bg-purple-600',
      level: 'Beginner',
      generationStatus: 'ready',
      isPublished: true,
      syllabus: {
        filename: 'syllabus_math.pdf',
        originalName: 'Math_Syllabus.pdf',
        mimetype: 'application/pdf',
        storagePath: '/dummy/syllabus_math.pdf',
        size: 2048
      },
      gamification: {
        xpMultiplier: 1.0,
        leaderboardEnabled: true
      }
    });

    const mathNodes = [
      {
        course: mathCourse._id,
        title: 'מושג הגבול ורציפות פונקציות',
        type: 'lesson',
        order: 1,
        estimatedMinutes: 25,
        xpReward: 150,
        lessonContent: `# מושג הגבול ורציפות פונקציות\n\nחשבון אינפיניטסימלי עוסק בחקירת שינוי של פונקציות. הבסיס לכל החשבון הדיפרנציאלי הוא מושג **הגבול**.\n\n## מהו גבול?\nגבול של פונקציה $f(x)$ בנקודה $x_0$ מתאר את הערך אליו הפונקציה שואפת כאשר המשתנה $x$ מתקרב ל-$x_0$ מכל אחד מהצדדים.\n\n$$\\lim_{x \\to x_0} f(x) = L$$\n\n## רציפות פונקציות:\nפונקציה $f(x)$ נקראת רציפה בנקודה $x_0$ אם ורק אם מתקיימים שלושת התנאים הבאים:\n1. הפונקציה מוגדרת בנקודה $x_0$ (כלומר $f(x_0)$ קיים).\n2. הגבול $\\lim_{x \\to x_0} f(x)$ קיים.\n3. ערך הגבול שווה לערך הפונקציה בנקודה: $\\lim_{x \\to x_0} f(x) = f(x_0)$.`
      },
      {
        course: mathCourse._id,
        title: 'נגזרות וכללי גזירה',
        type: 'lesson',
        order: 2,
        estimatedMinutes: 30,
        xpReward: 150,
        lessonContent: `# נגזרות וכללי גזירה\n\nהנגזרת מייצגת את קצב השינוי הרגעי של פונקציה. מבחינה גיאומטרית, הנגזרת של פונקציה בנקודה מסוימת היא שיפוע המשיק לגרף הפונקציה באותה נקודה.\n\n## הגדרת הנגזרת בעזרת גבול:\n$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n## כללי גזירה בסיסיים:\n1. **נגזרת של קבוע:** $(c)' = 0$\n2. **כלל החזקה:** $(x^n)' = n \\cdot x^{n-1}$\n3. **גזירת פונקציית טריגונומטריה:** $(\\sin x)' = \\cos x$\n4. **נגזרת מכפלה:** $(u \\cdot v)' = u' \\cdot v + u \\cdot v'$`
      },
      {
        course: mathCourse._id,
        title: 'חקירת פונקציות ונקודות קיצון',
        type: 'lesson',
        order: 3,
        estimatedMinutes: 25,
        xpReward: 150,
        lessonContent: `# חקירת פונקציות ונקודות קיצון\n\nשימוש עיקרי בנגזרות הוא מציאת נקודות הקיצון (מינימום ומקסימום) של פונקציה, המאפשרות לנו לתאר את התנהגותה באופן מלא.\n\n## נקודות חשודות לקיצון (נקודות קריטיות):\nנקודה $x_0$ נקראת נקודה קריטית אם הנגזרת בה מתאפסת או אינה מוגדרת:\n$$f'(x_0) = 0$$\n\n## קביעת סוג הקיצון:\nנשתמש בנגזרת השנייה $f''(x)$:\n* אם $f''(x_0) > 0$ - הנקודה היא נקודת **מינימום מקומי**.\n* אם $f''(x_0) < 0$ - הנקודה היא נקודת **מקסימום מקומי**.\n* אם $f''(x_0) = 0$ - יש להשתמש בטבלת ערכים או נגזרות מסדר גבוה יותר.`
      },
      {
        course: mathCourse._id,
        title: 'בוחן מסכם - חשבון דיפרנציאלי',
        type: 'quiz',
        order: 4,
        estimatedMinutes: 15,
        xpReward: 250,
        quizData: [
          {
            type: 'mcq',
            question: 'מהי הנגזרת של הפונקציה f(x) = x^3?',
            options: ['3x', 'x^2', '3x^2', '3x^3'],
            correctAnswerIndex: 2,
            explanation: 'לפי כלל החזקה, מורידים את המעריך 3 ומקטינים את החזקה ב-1 לקבלת 3x^2.'
          },
          {
            type: 'mcq',
            question: 'מהו שיפוע המשיק של הפונקציה f(x) = sin(x) בנקודה x = 0?',
            options: ['0', '1', '-1', 'אינסוף'],
            correctAnswerIndex: 1,
            explanation: 'הנגזרת של sin(x) היא cos(x). בנקודה x=0 נקבל cos(0) = 1, שזהו בדיוק שיפוע המשיק.'
          },
          {
            type: 'mcq',
            question: 'מה מייצג הגבול של פונקציה בנקודה x0?',
            options: ['ערך הפונקציה בנקודה עצמה', 'השינוי של הפונקציה לאורך כל הישר', 'הערך אליו שואפת הפונקציה כשמתקרבים לנקודה', 'השטח מתחת לגרף הפונקציה'],
            correctAnswerIndex: 2,
            explanation: 'הגבול מתאר את התנהגות ושאיפת הפונקציה ככל שמתקרבים לנקודה מכל כיוון, ללא קשר לערכה המדויק בנקודה עצמה.'
          }
        ]
      }
    ];

    await CourseNode.insertMany(mathNodes);
    console.log('Calculus course nodes created!');

    // Enroll ALL users in the database in both courses!
    const allUsers = await User.find({});
    console.log(`Enrolling all ${allUsers.length} database users in the demo courses...`);
    
    const firstPythonNode = await CourseNode.findOne({ course: pythonCourse._id }).sort({ order: 1 });
    const firstMathNode = await CourseNode.findOne({ course: mathCourse._id }).sort({ order: 1 });

    for (const u of allUsers) {
      // 1. Python Enrollment
      const pyEnrollment = await Enrollment.findOne({ student: u._id, course: pythonCourse._id });
      if (!pyEnrollment) {
        await Enrollment.create({
          student: u._id,
          course: pythonCourse._id,
          status: 'approved',
          requestedAt: new Date(),
          respondedAt: new Date()
        });
      } else {
        pyEnrollment.status = 'approved';
        await pyEnrollment.save();
      }

      const pyProgress = await Progress.findOne({ student: u._id, course: pythonCourse._id });
      if (!pyProgress) {
        await Progress.create({
          student: u._id,
          course: pythonCourse._id,
          currentNode: firstPythonNode ? firstPythonNode._id : null,
          completedNodes: [],
          totalXP: 0,
          streak: 0
        });
      }

      // 2. Calculus Enrollment
      const mathEnrollment = await Enrollment.findOne({ student: u._id, course: mathCourse._id });
      if (!mathEnrollment) {
        await Enrollment.create({
          student: u._id,
          course: mathCourse._id,
          status: 'approved',
          requestedAt: new Date(),
          respondedAt: new Date()
        });
      } else {
        mathEnrollment.status = 'approved';
        await mathEnrollment.save();
      }

      const mathProgress = await Progress.findOne({ student: u._id, course: mathCourse._id });
      if (!mathProgress) {
        await Progress.create({
          student: u._id,
          course: mathCourse._id,
          currentNode: firstMathNode ? firstMathNode._id : null,
          completedNodes: [],
          totalXP: 0,
          streak: 0
        });
      }
    }

    console.log('Seeding complete! 🚀');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
