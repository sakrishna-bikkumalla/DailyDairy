import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAgents, addAgent, updateAgent, deleteAgent } from '../services/agentService';
import { useAuth } from '../contexts/AuthContext';

export const useAgents = () => {
  const { adminId } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAgents = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const data = await getAgents(adminId);
      setAgents(data);
    } catch (error) {
      toast.error('Failed to load agents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleAddAgent = async (data) => {
    try {
      await addAgent({ ...data, adminId });
      toast.success('Agent added successfully');
      await loadAgents();
      return true;
    } catch (error) {
      toast.error('Failed to add agent');
      console.error(error);
      return false;
    }
  };

  const handleUpdateAgent = async (id, data) => {
    try {
      await updateAgent(id, data);
      toast.success('Agent updated successfully');
      await loadAgents();
      return true;
    } catch (error) {
      toast.error('Failed to update agent');
      console.error(error);
      return false;
    }
  };

  const handleDeleteAgent = async (id) => {
    try {
      await deleteAgent(id);
      toast.success('Agent deleted successfully');
      await loadAgents();
      return true;
    } catch (error) {
      toast.error('Failed to delete agent');
      console.error(error);
      return false;
    }
  };

  return {
    agents,
    loading,
    loadAgents,
    handleAddAgent,
    handleUpdateAgent,
    handleDeleteAgent
  };
};
