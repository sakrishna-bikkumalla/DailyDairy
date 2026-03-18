import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getDeliveriesByDate, getDeliveryStats, createDailyDeliveries, assignAgent } from '../services/deliveryService';
import { useAuth } from '../contexts/AuthContext';

export const useDeliveries = (date) => {
  const { adminId } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, skipped: 0, totalMlScheduled: 0, totalMlDelivered: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    if (!date || !adminId) return;
    setLoading(true);
    try {
      const [delivs, s] = await Promise.all([
        getDeliveriesByDate(date, adminId),
        getDeliveryStats(date, adminId)
      ]);
      setDeliveries(delivs);
      setStats(s);
    } catch (error) {
      toast.error('Failed to load deliveries');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [date, adminId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateDeliveries = async () => {
    setGenerating(true);
    try {
      const result = await createDailyDeliveries(date, adminId);
      if (result.created > 0) {
        toast.success(`Generated ${result.created} new deliveries`);
        await loadData();
      } else {
        toast.success('All deliveries are already up to date');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignAgent = async (deliveryId, agentId) => {
    try {
      await assignAgent(deliveryId, agentId);
      toast.success('Agent assigned successfully');
      await loadData();
    } catch (error) {
      toast.error('Failed to assign agent');
      console.error(error);
    }
  };

  return {
    deliveries,
    stats,
    loading,
    generating,
    generateDeliveries,
    handleAssignAgent,
    refreshUser: loadData,
  };
};
