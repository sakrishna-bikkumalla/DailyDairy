import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getCustomerSubscriptionDetails,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  stopSubscription,
  resumeSubscription,
  syncPendingDeliveries
} from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

export const useSubscriptions = (customerId = null) => {
  const { adminId } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDetails = useCallback(async (id = customerId) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCustomerSubscriptionDetails(id);
      setDetails(data);
    } catch (error) {
      toast.error('Failed to load subscription details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const handleAddSubscription = async (data) => {
    try {
      const docRef = await addSubscription({ ...data, adminId });
      await syncPendingDeliveries(docRef.id);
      toast.success('Subscription created successfully');
      if (customerId) await loadDetails();
      return true;
    } catch (error) {
      toast.error('Failed to create subscription');
      console.error(error);
      return false;
    }
  };

  const handleUpdateSubscription = async (subId, data) => {
    try {
      await updateSubscription(subId, data);
      await syncPendingDeliveries(subId);
      toast.success('Subscription updated successfully');
      if (customerId) await loadDetails();
      return true;
    } catch (error) {
      toast.error('Failed to update subscription');
      console.error(error);
      return false;
    }
  };

  const handleStatusChange = async (subId, action) => {
    try {
      if (action === 'stop') await stopSubscription(subId);
      else if (action === 'resume') await resumeSubscription(subId);
      else if (action === 'delete') await deleteSubscription(subId);

      toast.success(`Subscription ${action}ed successfully`);
      if (customerId) await loadDetails();
    } catch (error) {
      toast.error(`Failed to ${action} subscription`);
      console.error(error);
    }
  };

  return {
    details,
    loading,
    loadDetails,
    handleAddSubscription,
    handleUpdateSubscription,
    handleStatusChange
  };
};
