# Graph Report - .  (2026-07-15)

## Corpus Check
- 246 files · ~127,341 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1140 nodes · 2494 edges · 118 communities (69 shown, 49 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- OCR & Document Parsing
- Quests & Admin Controller
- Course/Announcement Controllers
- DB/Auth/Socket Config
- Course & Progress Models
- Badges & Leaderboard UI
- App Routing Shell
- Dashboard Cards & CountUp
- Course Map & Announcements UI
- Instructor Widgets & Skeletons
- Course Wizard Steps
- Admin Layout & Pagination
- UI Primitives (Cards/Toasts)
- XP Chart & Auth Store
- AI Engine Mongo DB Layer
- Gamification Cards & Confetti
- LLM Content Generator
- File Upload & Storage Adapter
- Modal & Quiz Editor UI
- Enrollment Service & Sockets
- Quiz Controller & Config
- Enrollment Pages & Notifications
- Backend Core Dependencies
- Design System Conventions
- Frontend UI Dependencies
- Global Search & Auth Callback
- Instructor Dashboard Widgets
- Quiz Engine & Content Renderer
- AI Engine Config & Vision
- Course Generation Pipeline
- AI Engine API Endpoints
- Backend AI Service Bridge
- Class Roster & Buttons
- Semantic Filter & Pydantic Models
- AI Service Contract Docs
- Badges & Gamification Service
- Auth Controller
- Backend Test Dependencies
- Frontend NPM Scripts
- Instructor Stats Page
- Backend README & Endpoints Docs
- Settings Store & Class Progress Chart
- Managed Courses Page
- Frontend Babel/Jest Config
- AI Engine Python Dependencies
- Semantic Filter Tests
- Course Generation Flow Docs
- Design Sync Bundle Script
- Progress Bar & Node Drawer
- Error Boundary & App Entry
- Prod Deploy Workflows
- Generate-Course Error Tests
- Backend package.json Metadata
- Course Generation Integration Test
- Docker Compose Services
- CI Workflow
- Backend Scripts
- Frontend package.json Metadata
- Lint-staged Config
- ProtectedRoute & Test
- Dependency: autoprefixer
- Dependency: babel-jest
- Dependency: babel-plugin-transform-vite-meta-env
- Dependency: babel-preset-env
- Dependency: babel-preset-react
- Dependency: cookie-parser
- Dependency: express-validator
- Dependency: helmet
- Dependency: http-errors
- Dependency: mongoose
- Dependency: morgan
- Dependency: passport
- Dependency: passport-google-oauth20
- Dependency: swagger-jsdoc
- Dependency: swagger-ui-express
- Dependency: eslint
- Dependency: eslint-config-prettier
- Dependency: @eslint/js
- Dependency: eslint-plugin-jsx-a11y
- Dependency: eslint-plugin-react-hooks
- Dependency: eslint-plugin-react-refresh
- Dependency: react-dropzone
- Dependency: react-hook-form
- Dependency: react-markdown
- Dependency: recharts
- Dependency: remark-math
- Dependency: socket.io-client
- Dependency: zustand
- Dependency: globals
- Dependency: husky
- Dependency: lint-staged
- Dependency: postcss
- Dependency: prettier
- Dependency: tailwindcss
- Dependency: @tailwindcss/typography
- Dependency: @tailwindcss/vite
- Dependency: @testing-library/jest-dom
- Dependency: @testing-library/react
- Dependency: @types/react
- Dependency: @types/react-dom
- Dependency: vite
- Dependency: @vitejs/plugin-react
- Vite Deps Package Metadata
- Favicon Asset
- Vite Logo Asset
- React Logo Asset
- Rocket Icon Asset

## God Nodes (most connected - your core abstractions)
1. `useCourseStore` - 47 edges
2. `Enrollment` - 44 edges
3. `useGamificationStore` - 44 edges
4. `User` - 39 edges
5. `CourseNode` - 32 edges
6. `useAuthStore` - 31 edges
7. `Progress` - 26 edges
8. `api` - 26 edges
9. `useToastStore` - 21 edges
10. `ParseResult` - 20 edges

## Surprising Connections (you probably didn't know these)
- `CI AI Engine Job (Disabled Placeholder)` --references--> `AI Engine Python Dependencies`  [EXTRACTED]
  .github/workflows/ci.yml → ai-engine/requirements.txt
- `Automated Roadmap Generation` --conceptually_related_to--> `Course Generation Flow`  [INFERRED]
  README.md → CLAUDE.md
- `get_quiz()` --calls--> `get_db_handle()`  [INFERRED]
  ai-engine/main.py → ai-engine/engine/db.py
- `get_summary()` --calls--> `get_db_handle()`  [INFERRED]
  ai-engine/main.py → ai-engine/engine/db.py
- `frontend/index.html` --shares_data_with--> `StudyLabs Brand Tokens`  [INFERRED]
  frontend/index.html → .design-sync/conventions.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Main-to-Production Promotion Pipeline** — github_workflows_ci_yml, github_workflows_main_to_prod_pr_yml, github_workflows_deploy_prod_yml, github_workflows_prod_to_main_sync_yml [INFERRED 0.85]
- **AI Course Generation Contract Flow** — docker_compose_yml_shared_uploads_volume, backend_ai_service_contract_generate_course_endpoint, claude_md_generateroadmap_fn, backend_ai_service_contract_course_structure [INFERRED 0.85]
- **Design-Sync Component Exclusion Pattern** — design_sync_notes_contentrenderer_exclusion, design_sync_notes_protectedroute_exclusion, design_sync_notes_gamemap_rename [INFERRED 0.75]

## Communities (118 total, 49 thin omitted)

### Community 0 - "OCR & Document Parsing"
Cohesion: 0.05
Nodes (46): ABC, extract_in_chunks(), extract_text_from_bytes(), extract_with_images(), OCR Service — Backward-compatible wrapper.  This module now delegates to the par, Extracts text from file bytes using the appropriate parser.          This is a b, Extracts both text AND images from file bytes.          Use this when you want a, Extracts text and images from file bytes in chunks (useful for large PDFs). (+38 more)

### Community 1 - "Quests & Admin Controller"
Cohesion: 0.12
Nodes (34): QUEST_BY_ID, QUEST_DEFINITIONS, deleteCourse(), deleteUser(), getAdminStats(), getCourses(), getInstructors(), getShopPrices() (+26 more)

### Community 2 - "Course/Announcement Controllers"
Cohesion: 0.12
Nodes (34): addCourseMaterials(), createAnnouncement(), createCourse(), createReview(), deleteAnnouncement(), deleteCourse(), getAnnouncements(), getCourse() (+26 more)

### Community 3 - "DB/Auth/Socket Config"
Cohesion: 0.10
Nodes (24): connectDB(), configurePassport(), initSocket(), options, swaggerSpec, authenticate(), authorize(), requireAdmin() (+16 more)

### Community 4 - "Course & Progress Models"
Cohesion: 0.19
Nodes (17): Course, courseSchema, fileSchema, courseNodeSchema, quizQuestionSchema, progressSchema, userSchema, app (+9 more)

### Community 5 - "Badges & Leaderboard UI"
Cohesion: 0.14
Nodes (22): RARITY_TABS, Leaderboard(), MOCK_EMOJIS, RANK_STYLES, SidebarContent(), AVATARS, FRAMES, LEVEL_MILESTONES (+14 more)

### Community 6 - "App Routing Shell"
Cohesion: 0.06
Nodes (28): AdminPage, AuthCallback, ClassRoster, CourseMap, CourseWizard, Dashboard, INSTRUCTOR_PAGE_LOADERS, InstructorDashboard (+20 more)

### Community 7 - "Dashboard Cards & CountUp"
Cohesion: 0.08
Nodes (15): loadStudyShop(), CourseSidebarItem(), RoadmapView(), TYPE_CONFIG, MainLayout(), RARITY, SHOP_CATEGORIES, CourseProgressCard() (+7 more)

### Community 8 - "Course Map & Announcements UI"
Cohesion: 0.11
Nodes (16): loadCourseMap(), AnnouncementModal(), AnnouncementsPanel(), XPHeader(), DAYS, STREAK_MILESTONES, StreakCalendar(), GameMap() (+8 more)

### Community 9 - "Instructor Widgets & Skeletons"
Cohesion: 0.13
Nodes (19): loadStudentStatusOverview(), CardSkeleton(), TableSkeleton(), AvatarDisplay(), ClassHealthScore(), ConceptCard(), MetricCard(), MiniRing() (+11 more)

### Community 10 - "Course Wizard Steps"
Cohesion: 0.09
Nodes (20): loadCourseWizard(), loadLoginPage(), PRESETS, StepAIConfig(), DEPARTMENTS, StepCoreDetails(), getEngagementScore(), MOCK_LEADERBOARD (+12 more)

### Community 11 - "Admin Layout & Pagination"
Cohesion: 0.11
Nodes (16): ConfirmDeleteModal(), Pagination(), AdminLayout(), NAV_ITEMS, AdminStatCard(), CoursesTab(), STATUS_COLORS, InstructorsTab() (+8 more)

### Community 12 - "UI Primitives (Cards/Toasts)"
Cohesion: 0.12
Nodes (15): GradientBorderCard(), SIZES, StatPill(), VARIANTS, Toast(), TOAST_STYLES, ToastManager(), RATING_LABELS (+7 more)

### Community 13 - "XP Chart & Auth Store"
Cohesion: 0.12
Nodes (17): DAYS_OPTIONS, XpHistoryChart(), InstructorLayout(), SidebarContent(), SettingsModal(), INSTRUCTOR_AVATARS, clearAuth(), handleAuthError() (+9 more)

### Community 14 - "AI Engine Mongo DB Layer"
Cohesion: 0.14
Nodes (25): check_file_hash(), ensure_ttl_index(), get_db_handle(), get_syllabus_blueprint(), Saves extracted text to the staging collection.     Returns the ObjectId as a st, Checks if a given SHA256 hash already exists for this course.      Dedup is scop, Saves a file hash to the 'files' collection, scoped to a course., Persists the parsed syllabus Pydantic blueprint to the 'syllabus_blueprints' col (+17 more)

### Community 15 - "Gamification Cards & Confetti"
Cohesion: 0.16
Nodes (16): LoadingSkeleton(), StatCard(), BadgeDisplay(), ConfettiEffect(), DailyChallengeCard(), LEAGUES, LeaguesPanel(), LEVEL_TITLES (+8 more)

### Community 16 - "LLM Content Generator"
Cohesion: 0.13
Nodes (18): evaluate_answer(), generate_content_for_topic(), Generates questions and study summaries for the topic in a single LLM call., Checks whether a quiz question is directly answerable from the given summary., Sanitizes a string to be safe for filenames., Evaluates an open-ended answer using LLMs., sanitize_filename(), validate_question_alignment() (+10 more)

### Community 17 - "File Upload & Storage Adapter"
Cohesion: 0.14
Nodes (3): storage, LocalStorageAdapter, StorageInterface

### Community 18 - "Modal & Quiz Editor UI"
Cohesion: 0.13
Nodes (8): BaseModal(), SIZES, QUESTION_STATUSES, QuizEditorModal(), ItemPreviewModal(), PREVIEW_BY_CATEGORY, RARITY_LABELS, useFocusTrap()

### Community 19 - "Enrollment Service & Sockets"
Cohesion: 0.32
Nodes (12): getIO(), addStudentToCourse(), approveEnrollment(), denyEnrollment(), getCourseEnrollments(), getMyEnrollments(), getPendingEnrollments(), requestEnrollment() (+4 more)

### Community 20 - "Quiz Controller & Config"
Cohesion: 0.20
Nodes (12): DEMO_COURSE_TITLES, GENERATION_STATUS, XP_BY_QUESTION_TYPE, deleteQuestion(), getQuizQuestions(), submitQuiz(), updateQuestion(), verifyInstructorOwnership() (+4 more)

### Community 21 - "Enrollment Pages & Notifications"
Cohesion: 0.19
Nodes (9): loadMyEnrollments(), MobileBellButton(), NotificationBell(), EnrollmentTab(), DEPARTMENTS, getDeptGradient(), MyEnrollments(), useEnrollmentStore (+1 more)

### Community 22 - "Backend Core Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, cors, express, express-rate-limit, jsonwebtoken, multer, socket.io, uuid (+7 more)

### Community 23 - "Design System Conventions"
Cohesion: 0.13
Nodes (15): Design System Conventions, StudyLabs Brand Tokens, _ds_bundle.css (Compiled Design System Stylesheet), Icon-as-Component Prop Pattern, Components Render Standalone (No Provider Needed), Two-Layer Styling Idiom (Tailwind + Custom Classes), Design Sync Notes, bg-orange-500 Invisible in Headless Chromium (+7 more)

### Community 24 - "Frontend UI Dependencies"
Cohesion: 0.13
Nodes (15): framer-motion, dependencies, framer-motion, katex, lucide-react, react-dom, react-router-dom, rehype-katex (+7 more)

### Community 25 - "Global Search & Auth Callback"
Cohesion: 0.19
Nodes (9): loadAuthCallback(), loadMyCourses(), DEPT_COLORS, GlobalSearch(), COLORS, SIZES, Spinner(), AuthCallback() (+1 more)

### Community 26 - "Instructor Dashboard Widgets"
Cohesion: 0.19
Nodes (6): loadInstructorDashboard(), AtRiskStudentsWidget(), fmt(), getGreeting(), InstructorDashboard(), STATUS_STYLES

### Community 27 - "Quiz Engine & Content Renderer"
Cohesion: 0.35
Nodes (7): ContentRenderer(), QuizEngine(), useQuizTimer(), calcMCQScore(), calcOpenScore(), getDirection(), isRTL()

### Community 28 - "AI Engine Config & Vision"
Cohesion: 0.20
Nodes (9): Centralised configuration constants for the AI engine.  Override any value via e, analyze_image(), analyze_images(), _media_type(), Image Analyzer — Sends embedded images to a Vision-capable LLM for description., Analyzes multiple images concurrently and returns their descriptions.          A, Sends a single image to a Vision LLM and returns a text description.      Tries, dotenv (+1 more)

### Community 29 - "Course Generation Pipeline"
Cohesion: 0.18
Nodes (12): create_course_pipeline(), _is_rate_limit_error(), parse_syllabus(), Parses raw syllabus text into a structured Course object., Orchestrates the course generation pipeline (Async Version).     Supports initia, Detects 429 / rate-limit errors robustly, by HTTP status code and exception, Retries an async function with exponential backoff + jitter.     Specifically ha, retry_with_backoff() (+4 more)

### Community 30 - "AI Engine API Endpoints"
Cohesion: 0.24
Nodes (10): evaluate_answer_endpoint(), evaluate_course_endpoint(), EvaluateAnswerRequest, EvaluateCourseRequest, GenerateCourseRequest, get_quiz(), get_summary(), lifespan() (+2 more)

### Community 31 - "Backend AI Service Bridge"
Cohesion: 0.36
Nodes (8): getAiConfig(), evaluateOpenAnswer(), generateCourseRoadmap(), evaluateAnswer(), evaluateCourse(), generateRoadmap(), emitGenerationStatus(), generateRoadmapInBackground()

### Community 32 - "Class Roster & Buttons"
Cohesion: 0.24
Nodes (8): loadClassRoster(), Button(), ICON_SIZE, SIZES, VARIANTS, EmptyState(), ClassRoster(), daysSince()

### Community 33 - "Semantic Filter & Pydantic Models"
Cohesion: 0.31
Nodes (10): Course, Lesson, BaseModel, Topic, _embed(), _get_model(), Tags materials to course topics in-place using cosine similarity.     Calculates, tag_materials_with_embeddings() (+2 more)

### Community 34 - "AI Service Contract Docs"
Cohesion: 0.20
Nodes (11): AI Engine README, POST /api/generate-course/ Endpoint, scripts/test_full_flow.py, AI Service API Contract, Standard Error Response Format, Endpoint 2: Evaluate Open-Ended Answer, Endpoint 3: Evaluate Generated Course, Endpoint 1: Generate Course (+3 more)

### Community 35 - "Badges & Gamification Service"
Cohesion: 0.36
Nodes (8): BADGES, levelFromXp(), evaluateNewBadges(), completeCourseNode(), computeMultiplier(), getLevelName(), getUserStats(), grantXp()

### Community 36 - "Auth Controller"
Cohesion: 0.38
Nodes (9): getMe(), googleAuth(), googleCallback(), logout(), mockLogin(), setRole(), updateProfile(), generateToken() (+1 more)

### Community 37 - "Backend Test Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, cross-env, jest, mongodb-memory-server, nodemon, supertest, jest, cross-env (+3 more)

### Community 38 - "Frontend NPM Scripts"
Cohesion: 0.18
Nodes (11): scripts, build, dev, format, format:check, lint, lint:fix, prepare (+3 more)

### Community 39 - "Instructor Stats Page"
Cohesion: 0.20
Nodes (7): loadInstructorStats(), ACCENTS, DEPT_LABELS, formatDuration(), InstructorStats(), STATUS_LABELS, STATUS_STYLES

### Community 40 - "Backend README & Endpoints Docs"
Cohesion: 0.22
Nodes (10): StudyLabs Backend README, AI Stub Endpoints, Auth Endpoints, Courses Endpoints, Enrollments Endpoints, Progress Endpoints, Quizzes Endpoints, CLAUDE.md Project Guidance (+2 more)

### Community 41 - "Settings Store & Class Progress Chart"
Cohesion: 0.29
Nodes (7): react, AuthWrapper(), ThemeWrapper(), ClassProgressChart(), CoinDisplay(), useSettingsStore, react

### Community 42 - "Managed Courses Page"
Cohesion: 0.24
Nodes (8): loadManagedCourses(), COURSE_AVATARS, EditCourseModal(), LEVEL_CONFIG, ManagedCourses(), DEPT_DEFAULT, DEPT_STYLES, getDeptStyle()

### Community 43 - "Frontend Babel/Jest Config"
Cohesion: 0.22
Nodes (9): babel-plugin-transform-import-meta, devDependencies, babel-plugin-transform-import-meta, identity-obj-proxy, jest, jest-environment-jsdom, jest, identity-obj-proxy (+1 more)

### Community 44 - "AI Engine Python Dependencies"
Cohesion: 0.25
Nodes (8): AI Engine Python Dependencies, fastapi 0.115.6, llama-index 0.14.12, pymongo 4.6.1, pymupdf 1.26.7, pytesseract 0.3.13, sentence-transformers 3.4.1, AI Engine and Backend Use Separate MongoDB Databases

### Community 45 - "Semantic Filter Tests"
Cohesion: 0.43
Nodes (7): _fake_embed(), _make_course(), Tests for engine.semantic_filter.tag_materials_with_embeddings.  The SBERT model, Map known strings to orthogonal/near unit vectors., test_matches_are_capped_at_15(), test_no_materials_marks_all_ungrounded(), test_tagging_assigns_relevant_materials()

### Community 46 - "Course Generation Flow Docs"
Cohesion: 0.25
Nodes (8): course_structure Nested Response Object, Node Types (lesson/quiz/project/challenge/exam), Quiz Question Types (mcq/open/summary), Course Generation Flow, StudyLabs Top-Level README, Automated Roadmap Generation, Passive Consumption Problem / Core Business Idea, Gamification of Knowledge

### Community 47 - "Design Sync Bundle Script"
Cohesion: 0.36
Nodes (5): bundleExportEvidence(), bundleToIife(), reactShim, sharedBuildOptions(), tsconfigPathsPlugin()

### Community 48 - "Progress Bar & Node Drawer"
Cohesion: 0.29
Nodes (4): HEIGHTS, ProgressBar(), VARIANTS, NodeDrawer()

### Community 50 - "Prod Deploy Workflows"
Cohesion: 0.29
Nodes (7): Deploy Production Workflow, Production .env Generation Step, Deploy Smoke Test (Health Checks), Auto PR main-to-production Workflow, PR Creation Gated on Successful CI, Sync Production to Main Workflow, Empty-Diff Squash-Merge Artifact Detection

### Community 51 - "Generate-Course Error Tests"
Cohesion: 0.40
Nodes (3): Endpoint-level tests for the error-handling fixes in main.generate_course.  The, test_duplicate_material_returns_400_not_500(), _write()

### Community 52 - "Backend package.json Metadata"
Cohesion: 0.33
Nodes (5): description, main, name, type, version

### Community 53 - "Course Generation Integration Test"
Cohesion: 0.33
Nodes (5): mockEmit, mockEvaluateCourse, mockGenerateRoadmap, mockIO, mockTo

### Community 54 - "Docker Compose Services"
Cohesion: 0.60
Nodes (5): ai-engine Service, backend Service, frontend Service, mongo Service, shared_uploads Docker Volume

### Community 55 - "CI Workflow"
Cohesion: 0.33
Nodes (6): CI Workflow, CI AI Engine Job (Disabled Placeholder), CI Backend Job (test), CI Frontend Job (lint+test+build), mongodb-memory-server Avoids External DB Service, Node 24 Chosen for Native require(ESM) Support

### Community 56 - "Backend Scripts"
Cohesion: 0.40
Nodes (5): scripts, dev, start, test, test:watch

### Community 58 - "Frontend package.json Metadata"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 59 - "Lint-staged Config"
Cohesion: 0.50
Nodes (5): lint-staged, *.{css,json,md}, *.{js,jsx}, eslint --fix, prettier --write

## Knowledge Gaps
- **226 isolated node(s):** `reactShim`, `options`, `GENERATION_STATUS`, `QUEST_DEFINITIONS`, `announcementSchema` (+221 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend UI Dependencies` to `Dependency: socket.io-client`, `Settings Store & Class Progress Chart`, `Dependency: react-dropzone`, `Dependency: react-hook-form`, `Dependency: react-markdown`, `Dependency: recharts`, `Dependency: remark-math`, `Frontend package.json Metadata`, `Dependency: zustand`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `react` connect `Settings Store & Class Progress Chart` to `Frontend UI Dependencies`, `Course Wizard Steps`, `Badges & Leaderboard UI`, `App Routing Shell`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Frontend Babel/Jest Config` to `Frontend package.json Metadata`, `Dependency: autoprefixer`, `Dependency: babel-jest`, `Dependency: babel-plugin-transform-vite-meta-env`, `Dependency: babel-preset-env`, `Dependency: babel-preset-react`, `Dependency: eslint`, `Dependency: eslint-config-prettier`, `Dependency: @eslint/js`, `Dependency: eslint-plugin-jsx-a11y`, `Dependency: eslint-plugin-react-hooks`, `Dependency: eslint-plugin-react-refresh`, `Dependency: globals`, `Dependency: husky`, `Dependency: lint-staged`, `Dependency: postcss`, `Dependency: prettier`, `Dependency: tailwindcss`, `Dependency: @tailwindcss/typography`, `Dependency: @tailwindcss/vite`, `Dependency: @testing-library/jest-dom`, `Dependency: @testing-library/react`, `Dependency: @types/react`, `Dependency: @types/react-dom`, `Dependency: vite`, `Dependency: @vitejs/plugin-react`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `reactShim`, `options`, `GENERATION_STATUS` to the rest of the system?**
  _226 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OCR & Document Parsing` be split into smaller, more focused modules?**
  _Cohesion score 0.051106639839034206 - nodes in this community are weakly interconnected._
- **Should `Quests & Admin Controller` be split into smaller, more focused modules?**
  _Cohesion score 0.1173054587688734 - nodes in this community are weakly interconnected._
- **Should `Course/Announcement Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.11951219512195121 - nodes in this community are weakly interconnected._