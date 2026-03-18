import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getCustomers, createCustomerWithAccount, deleteCustomer } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';

export const useCustomers = () => {
  const { adminId } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const data = await getCustomers(adminId);
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleAddCustomer = async (data) => {
    try {
      const result = await createCustomerWithAccount({ ...data, adminId });
      toast.success('Customer added successfully');
      await loadCustomers();
      return result;
    } catch (error) {
      toast.error('Failed to add customer');
      console.error(error);
      throw error;
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted successfully');
      await loadCustomers();
      return true;
    } catch (error) {
      toast.error('Failed to delete customer');
      console.error(error);
      return false;
    }
  };

  return {
    customers,
    loading,
    loadCustomers,
    handleAddCustomer,
    handleDeleteCustomer
  };
};
