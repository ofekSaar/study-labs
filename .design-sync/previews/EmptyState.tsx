import React from 'react';
import { EmptyState } from 'frontend';
import { BookOpen, Search, Trophy } from 'lucide-react';

export const NoCoursesYet = () => (
  <EmptyState
    icon={BookOpen}
    title="No courses yet"
    description="You haven't enrolled in any courses. Browse the catalog to get started on your learning journey."
    action={{ label: 'Browse Courses', onClick: () => {} }}
  />
);

export const NoResultsFound = () => (
  <EmptyState
    icon={Search}
    title="No results found"
    description="Try adjusting your search terms or filters to find what you're looking for."
  />
);

export const NoAchievements = () => (
  <EmptyState
    icon={Trophy}
    title="No achievements yet"
    description="Complete lessons and quizzes to earn your first badge."
    action={{ label: 'Start Learning', onClick: () => {} }}
  />
);
