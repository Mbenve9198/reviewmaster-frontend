// ... existing code ...
import { Review } from '@/services/api';

export const api = {
  analytics: {
    // ... existing methods ...
    
    generateFollowUpQuestions: async ({ analysis, reviews }: { 
      analysis: string;
      reviews: Review[];
    }) => {
      const response = await fetch('/api/analytics/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis, reviews }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      return response.json();
    },
  },
};