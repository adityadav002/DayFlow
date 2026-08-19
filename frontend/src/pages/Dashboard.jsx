import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBoards } from '../redux/slices/boardSlice';
import { Layout, Plus, Clock, Users } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import CreateBoardModal from '../components/boards/CreateBoardModal';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { items: boards, status } = useSelector((state) => state.boards);
  const { user } = useSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  if (status === 'loading') {
    return <Loader />;
  }

  return (
    <div className="h-full p-6 md:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Board
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-surface-800 flex items-center">
          <Layout className="mr-2 h-5 w-5 text-primary-500" />
          Your Boards
        </h2>

        {boards.length === 0 ? (
          <EmptyState 
            title="No boards yet" 
            description="Create a board to start organizing your tasks and collaborating with others."
            actionLabel="Create your first board"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <Link 
                key={board._id} 
                to={`/b/${board._id}`}
                className="group relative flex h-32 flex-col justify-between rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
              >
                <div 
                  className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl opacity-80" 
                  style={{ backgroundColor: board.color || '#0ea5e9' }}
                />
                <div>
                  <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 line-clamp-1">{board.title}</h3>
                </div>
                <div className="flex items-center justify-between text-xs text-surface-500">
                  <div className="flex items-center">
                    <Users className="mr-1 h-3 w-3" />
                    <span>{board.members?.length || 1} members</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <CreateBoardModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
