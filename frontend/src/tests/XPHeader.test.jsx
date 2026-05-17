import React from 'react';
import { render, screen } from '@testing-library/react';
import XPHeader from '../components/dashboard/XPHeader';
import useCourseStore from '../store/courseStore';

// Mock the Zustand store
jest.mock('../store/courseStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('XPHeader Component', () => {
    beforeEach(() => {
        // Reset the mock implementation before each test
        useCourseStore.mockImplementation(() => ({
            user: {
                totalXP: 450,
                streak: 5
            }
        }));
    });

    test('renders XP, Streak and level correctly', () => {
        render(<XPHeader />);
        
        // Assert XP value is displayed (450)
        expect(screen.getByText('450')).toBeInTheDocument();
        expect(screen.getByText('Total XP')).toBeInTheDocument();
        
        // Assert Streak is displayed (5)
        expect(screen.getAllByText('5').length).toBeGreaterThan(0);
        expect(screen.getByText('Streak')).toBeInTheDocument();
        
        // Assert Level is displayed (450 / 100 + 1 = 5)
        expect(screen.getByText('Level')).toBeInTheDocument();
    });

    test('handles null user gracefully', () => {
        useCourseStore.mockImplementation(() => ({
            user: null
        }));
        
        render(<XPHeader />);
        
        // Should show 0 for XP and Streak, and Level 1
        const zeroes = screen.getAllByText('0');
        expect(zeroes.length).toBeGreaterThan(0);
        
        const ones = screen.getAllByText('1');
        expect(ones.length).toBeGreaterThan(0);
    });
});
