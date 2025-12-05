import { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // Assuming you have this set up, or use axios directly

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real scenario, use: const response = await api.get(url);
      // For now, we simulate a delay if no backend is running
      console.log(`[useFetch] Fetching: ${url}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock Data switching based on URL (Replace this block with real API call later)
      let mockData = null;
      if (url.includes('/links')) {
        mockData = [
            { _id: '1', title: 'Mission Brief', slug: 'mission-alpha', targetUrl: 'https://topsecret.com', clicks: 142, status: 'active', createdAt: '2023-10-01' },
            { _id: '2', title: 'Asset List', slug: 'assets-2024', targetUrl: 'https://drive.google.com/x', clicks: 89, status: 'active', createdAt: '2023-10-05' },
            { _id: '3', title: 'Burn Notice', slug: 'do-not-open', targetUrl: 'https://danger.com', clicks: 12, status: 'expired', createdAt: '2023-09-15' },
        ];
      } else if (url.includes('/analytics')) {
         mockData = { total: 1245, mobile: 64 };
      }

      setData(mockData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};