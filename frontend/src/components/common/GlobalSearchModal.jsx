import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, Lock, User, Kanban, X } from 'lucide-react';
import * as searchApi from '../../api/searchApi';
import { cn } from '../../utils/helpers';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { currentWorkspace } = useSelector((state) => state.workspaces);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    tasks: { results: [], total: 0 },
    projects: { results: [], total: 0 },
    people: { results: [], total: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten results for keyboard navigation
  const flatResults = [
    ...results.projects.results.map(r => ({ ...r, type: 'project' })),
    ...results.tasks.results.map(r => ({ ...r, type: 'task' })),
    ...results.people.results.map(r => ({ ...r, type: 'person' }))
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({
        tasks: { results: [], total: 0 },
        projects: { results: [], total: 0 },
        people: { results: [], total: 0 }
      });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({
        tasks: { results: [], total: 0 },
        projects: { results: [], total: 0 },
        people: { results: [], total: 0 }
      });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const workspaceId = currentWorkspace?._id;
        const res = await searchApi.searchGlobal(query, workspaceId);
        setResults(res.data.data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, currentWorkspace]);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelectItem(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectItem = (item) => {
    onClose();
    if (item.type === 'project') {
      navigate(`/projects/${item._id}`);
    } else if (item.type === 'task') {
      // Find the board from tasks list or assume it has a boardId.
      // In our model structure, boardId exists on tasks. Let's redirect to Kanban Board.
      // Wait, if it has a boardId or project, let's navigate there.
      // Since it has boardId, let's go:
      const boardId = item.boardId || item.project; // Fallback
      if (boardId) {
        navigate(`/b/${boardId}?taskId=${item._id}`);
      } else {
        // Fallback to project page
        navigate(`/projects/${item.project}?taskId=${item._id}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Search Dialogue card */}
      <div 
        className="relative w-full max-w-xl rounded-xl border border-surface-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[480px] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Input header */}
        <div className="flex items-center border-b border-surface-250 px-4 py-3 bg-slate-50">
          <Search className="h-5 w-5 text-surface-500 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm text-surface-900 focus:outline-none placeholder-surface-400"
            placeholder="Search tasks, projects, or people... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-0.5 rounded-full hover:bg-surface-200">
              <X className="h-4 w-4 text-surface-500" />
            </button>
          )}
        </div>

        {/* Results layout list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {loading && (
            <div className="text-center py-8 text-sm text-surface-500">Searching...</div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="text-center py-8 text-xs text-surface-400">
              Type at least 2 characters to search...
            </div>
          )}

          {!loading && query.trim().length >= 2 && flatResults.length === 0 && (
            <div className="text-center py-8 text-sm text-surface-500">
              No results found for "{query}"
            </div>
          )}

          {!loading && flatResults.length > 0 && (
            <div className="space-y-4">
              {/* Projects Category */}
              {results.projects.results.length > 0 && (
                <div>
                  <h3 className="px-2 mb-1.5 text-[10px] font-bold text-surface-400 uppercase tracking-wider">Projects</h3>
                  <div className="space-y-0.5">
                    {results.projects.results.map((project, idx) => {
                      const overallIndex = flatResults.findIndex(r => r._id === project._id && r.type === 'project');
                      const active = overallIndex === selectedIndex;

                      return (
                        <div
                          key={project._id}
                          onClick={() => handleSelectItem({ ...project, type: 'project' })}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors",
                            active ? "bg-primary-50 text-primary-700 font-semibold" : "text-surface-700 hover:bg-surface-50"
                          )}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Kanban className="h-4 w-4 text-primary-500 shrink-0" />
                            <span className="truncate">{project.name}</span>
                          </div>
                          {project.description && (
                            <span className="text-[10px] text-surface-400 truncate max-w-[150px] font-normal">{project.description}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks Category */}
              {results.tasks.results.length > 0 && (
                <div>
                  <h3 className="px-2 mb-1.5 text-[10px] font-bold text-surface-400 uppercase tracking-wider">Tasks</h3>
                  <div className="space-y-0.5">
                    {results.tasks.results.map((task, idx) => {
                      const overallIndex = flatResults.findIndex(r => r._id === task._id && r.type === 'task');
                      const active = overallIndex === selectedIndex;

                      return (
                        <div
                          key={task._id}
                          onClick={() => handleSelectItem({ ...task, type: 'task' })}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors",
                            active ? "bg-primary-50 text-primary-700 font-semibold" : "text-surface-700 hover:bg-surface-50"
                          )}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            <span className="truncate">{task.title}</span>
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0",
                            task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-600'
                          )}>
                            {task.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* People Category */}
              {results.people.results.length > 0 && (
                <div>
                  <h3 className="px-2 mb-1.5 text-[10px] font-bold text-surface-400 uppercase tracking-wider">People</h3>
                  <div className="space-y-0.5">
                    {results.people.results.map((person, idx) => {
                      const overallIndex = flatResults.findIndex(r => r._id === person._id && r.type === 'person');
                      const active = overallIndex === selectedIndex;

                      return (
                        <div
                          key={person._id}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                            active ? "bg-primary-50 text-primary-700 font-semibold" : "text-surface-700 hover:bg-surface-50"
                          )}
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                            {person.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-800 leading-none">{person.name}</p>
                            <p className="text-[10px] text-surface-400 mt-0.5 leading-none">@{person.username || 'username'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-surface-200 px-4 py-2 bg-slate-50 flex justify-between items-center text-[10px] text-surface-400 font-semibold">
          <div className="flex gap-3">
            <span><kbd className="bg-white border border-surface-300 px-1 py-0.5 rounded shadow-sm text-surface-600 mr-1">↑↓</kbd> Navigate</span>
            <span><kbd className="bg-white border border-surface-300 px-1.5 py-0.5 rounded shadow-sm text-surface-600 mr-1">Enter</kbd> Select</span>
          </div>
          <span>Ctrl+K to toggle anywhere</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
