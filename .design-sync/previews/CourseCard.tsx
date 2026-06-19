import React from 'react';
import { CourseCard } from 'frontend';
import { BookOpen, Code, FlaskConical, Map } from 'lucide-react';

export const IntroductionCourse = () => (
  <CourseCard
    title="Introduction to Algorithms"
    professor="Dr. Sarah Cohen"
    icon={<BookOpen size={24} />}
    progress={65}
    color="bg-indigo-500"
  />
);

export const WebDevelopment = () => (
  <CourseCard
    title="Full-Stack Web Development"
    professor="Prof. Avi Levi"
    icon={<Code size={24} />}
    progress={32}
    color="bg-emerald-500"
  />
);

export const DataScience = () => (
  <CourseCard
    title="Data Science & Machine Learning"
    professor="Dr. Maya Ben-David"
    icon={<FlaskConical size={24} />}
    progress={88}
    color="bg-purple-500"
  />
);

export const JustStarted = () => (
  <CourseCard
    title="World History: Ancient Civilizations"
    professor="Dr. Yossi Mizrahi"
    icon={<Map size={24} />}
    progress={5}
    color="bg-amber-500"
  />
);
