import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudyLabs API',
      version: '1.0.0',
      description: 'REST API for the StudyLabs gamified learning platform',
      contact: {
        name: 'StudyLabs Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/google/callback',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            provider: { type: 'string', enum: ['google', 'github'] },
            providerId: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar: { type: 'string', format: 'uri' },
            role: { type: 'string', enum: ['student', 'instructor', null] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            department: { type: 'string' },
            description: { type: 'string' },
            instructor: { $ref: '#/components/schemas/User' },
            color: { type: 'string' },
            level: { type: 'string' },
            isPublished: { type: 'boolean' },
            aiConfig: {
              type: 'object',
              properties: {
                nodeCount: { type: 'number' },
                quizFrequency: { type: 'number' },
              },
            },
            gamification: {
              type: 'object',
              properties: {
                xpMultiplier: { type: 'number' },
                leaderboardEnabled: { type: 'boolean' },
              },
            },
          },
        },
        CourseNode: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            course: { type: 'string' },
            title: { type: 'string' },
            type: { type: 'string', enum: ['lesson', 'quiz', 'project', 'challenge', 'exam'] },
            order: { type: 'number' },
            estimatedMinutes: { type: 'number' },
            xpReward: { type: 'number' },
            lessonContent: { type: 'string', description: 'Markdown content for lesson nodes' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { $ref: '#/components/schemas/User' },
            course: { $ref: '#/components/schemas/Course' },
            status: { type: 'string', enum: ['pending', 'approved', 'denied'] },
            requestedAt: { type: 'string', format: 'date-time' },
            respondedAt: { type: 'string', format: 'date-time' },
          },
        },
        Progress: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { type: 'string' },
            course: { type: 'string' },
            completedNodes: { type: 'array', items: { type: 'string' } },
            currentNode: { type: 'string' },
            totalXP: { type: 'number' },
            streak: { type: 'number' },
            lastActivityDate: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
