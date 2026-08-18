import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvatarDisplay from '../components/instructor/AvatarDisplay';

describe('AvatarDisplay', () => {
    it('renders the provider photo when photoUrl is present', () => {
        render(<AvatarDisplay photoUrl="https://lh3.googleusercontent.com/a/pic" name="Dana" />);

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://lh3.googleusercontent.com/a/pic');
        expect(img).toHaveAttribute('alt', "Dana's avatar");
    });

    it('prefers the provider photo over a chosen emoji', () => {
        render(
            <AvatarDisplay
                photoUrl="https://lh3.googleusercontent.com/a/pic"
                avatar="🦊"
                name="Dana"
            />
        );

        expect(screen.getByRole('img')).toBeInTheDocument();
        expect(screen.queryByText('🦊')).not.toBeInTheDocument();
    });

    // Google's CDN 403s when a Referer is attached, which is what broke the photos.
    it('loads the photo without a referrer', () => {
        render(<AvatarDisplay photoUrl="https://lh3.googleusercontent.com/a/pic" name="Dana" />);

        expect(screen.getByRole('img')).toHaveAttribute('referrerpolicy', 'no-referrer');
    });

    it('falls back to initials when the photo fails to load', () => {
        render(<AvatarDisplay photoUrl="https://lh3.googleusercontent.com/a/gone" name="Dana" />);

        fireEvent.error(screen.getByRole('img'));

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('falls back to the chosen emoji when the photo fails to load', () => {
        render(
            <AvatarDisplay
                photoUrl="https://lh3.googleusercontent.com/a/gone"
                avatar="🦊"
                name="Dana"
            />
        );

        fireEvent.error(screen.getByRole('img'));

        expect(screen.getByText('🦊')).toBeInTheDocument();
    });

    it('renders an emoji avatar as text, never as an image src', () => {
        render(<AvatarDisplay avatar="🦊" name="Dana" />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('🦊')).toBeInTheDocument();
    });

    // Records created before photoUrl existed kept the Google URL in `avatar`.
    it('still renders a legacy URL stored in avatar as an image', () => {
        render(<AvatarDisplay avatar="https://lh3.googleusercontent.com/a/legacy" name="Dana" />);

        expect(screen.getByRole('img')).toHaveAttribute(
            'src',
            'https://lh3.googleusercontent.com/a/legacy'
        );
    });

    it('falls back to initials when there is no photo or emoji', () => {
        render(<AvatarDisplay name="dana" />);

        expect(screen.getByText('D')).toBeInTheDocument();
    });
});
