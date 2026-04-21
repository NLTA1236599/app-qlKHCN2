import { useState, useEffect } from 'react';
import { ResearchProject } from '../types';
import { dbService } from '../services/db';

export const useProjects = (user: any) => {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const fetchedProjects = await dbService.getProjects();
      if (fetchedProjects) setProjects(fetchedProjects);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      throw error;
    } finally {
      setIsProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setIsProjectsLoading(false);
      setProjects([]);
    }
  }, [user]);

  return { projects, setProjects, isProjectsLoading, fetchProjects };
};
