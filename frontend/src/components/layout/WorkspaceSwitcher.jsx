import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspaces, setCurrentWorkspace } from '../../redux/slices/workspaceSlice';
import { ChevronDown, Plus, Check } from 'lucide-react';
import CreateWorkspaceModal from '../projects/CreateWorkspaceModal';

const WorkspaceSwitcher = () => {
  const dispatch = useDispatch();
  const { items: workspaces, currentWorkspace } = useSelector((state) => state.workspaces);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWorkspace = (workspace) => {
    dispatch(setCurrentWorkspace(workspace));
    setIsOpen(false);
  };

  if (!currentWorkspace) return null;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-surface-200 bg-surface-50/50 p-2.5 hover:bg-surface-50 transition-all hover:border-surface-300"
      >
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-xs font-bold text-white uppercase">
            {currentWorkspace.name?.charAt(0) || 'W'}
          </div>
          <span className="truncate text-sm font-semibold text-surface-800 text-left">
            {currentWorkspace.name}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-surface-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full rounded-lg border border-surface-200 bg-white p-1.5 shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-surface-400">
            Workspaces
          </div>
          <div className="space-y-0.5">
            {workspaces.map((workspace) => {
              const isSelected = workspace._id === currentWorkspace._id;
              return (
                <button
                  key={workspace._id}
                  onClick={() => handleSelectWorkspace(workspace)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary-50 font-medium text-primary-700'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white uppercase ${
                      isSelected ? 'bg-primary-600' : 'bg-surface-400'
                    }`}>
                      {workspace.name?.charAt(0)}
                    </div>
                    <span className="truncate">{workspace.name}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t border-surface-200" />

          <button
            onClick={() => {
              setIsOpen(false);
              setIsModalOpen(true);
            }}
            className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            Create Workspace
          </button>
        </div>
      )}

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default WorkspaceSwitcher;
