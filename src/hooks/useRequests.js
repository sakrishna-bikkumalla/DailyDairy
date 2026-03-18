import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getRequests } from '../services/requestService';
import { useAuth } from '../contexts/AuthContext';

export const useRequests = (status = null) => {
  const { adminId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const data = await getRequests(status, adminId);
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [status, adminId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    loadRequests
  };
};
