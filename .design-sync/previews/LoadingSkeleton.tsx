import React from 'react';
import { LoadingSkeleton } from 'frontend';

export const Default3Rows = () => (
  <div style={{ padding: '16px', maxWidth: '400px' }}>
    <LoadingSkeleton rows={3} />
  </div>
);

export const CardSkeleton = () => (
  <div style={{ padding: '16px', maxWidth: '400px' }}>
    <LoadingSkeleton rows={5} heights={['h-8', 'h-4', 'h-4', 'h-4', 'h-6']} />
  </div>
);

export const SingleLineSkeleton = () => (
  <div style={{ padding: '16px', maxWidth: '300px' }}>
    <LoadingSkeleton rows={1} heights={['h-6']} />
  </div>
);
