import { useState, useEffect } from 'react';

export interface CalendarLabel {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

const DEFAULT_LABELS: CalendarLabel[] = [
  { id: 'default-1', name: '일반', color: '#4285f4', active: true },
  { id: 'default-2', name: '상담', color: '#fbbc04', active: true },
  { id: 'default-3', name: '재판', color: '#ea4335', active: true },
];

const STORAGE_KEY = 'claimworks_calendar_labels';

export function useCalendarLabels() {
  const [labels, setLabels] = useState<CalendarLabel[]>([]);

  const loadLabels = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLabels(JSON.parse(stored));
      } else {
        setLabels(DEFAULT_LABELS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LABELS));
      }
    } catch (e) {
      console.error('Failed to load calendar labels', e);
      setLabels(DEFAULT_LABELS);
    }
  };

  useEffect(() => {
    loadLabels();
    
    const handleSync = () => loadLabels();
    window.addEventListener('calendar-labels-changed', handleSync);
    
    return () => {
      window.removeEventListener('calendar-labels-changed', handleSync);
    };
  }, []);

  const saveLabels = (newLabels: CalendarLabel[]) => {
    setLabels(newLabels);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLabels));
    window.dispatchEvent(new CustomEvent('calendar-labels-changed'));
  };

  const addLabel = (name: string, color: string) => {
    const newLabel: CalendarLabel = {
      id: `label-${Date.now()}`,
      name,
      color,
      active: true,
    };
    saveLabels([...labels, newLabel]);
  };

  const toggleLabelActive = (id: string) => {
    const newLabels = labels.map(label => 
      label.id === id ? { ...label, active: !label.active } : label
    );
    saveLabels(newLabels);
  };

  const deleteLabel = (id: string) => {
    const newLabels = labels.filter(label => label.id !== id);
    saveLabels(newLabels);
  };

  const updateLabel = (id: string, name: string, color: string) => {
    const newLabels = labels.map(label => 
      label.id === id ? { ...label, name, color } : label
    );
    saveLabels(newLabels);
  };

  return {
    labels,
    addLabel,
    toggleLabelActive,
    deleteLabel,
    updateLabel
  };
}
