import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBoards } from '../redux/slices/boardSlice';
import { Layout, Plus, Clock, Users, FolderOpen, Activity, CheckCircle } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import CreateBoardModal from '../components/boards/CreateBoardModal';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '../components/common/Card';
import Avatar from '../components/common/Avatar';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { items: boards, status } = useSelector((state) => state.boards);
  const { items: projects } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  if (status === 'loading') {
    return <Loader />;
  }

  return (
    <div className="h-full p-6 md:p-8 bg-surface-50 overflow-auto custom-scrollbar relative">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-[28px] font-medium text-surface-900 tracking-tight">Dashboard</h1>
          <p className="text-[15px] text-surface-500 mt-1">Welcome back, <span className="font-medium text-surface-900">{user?.name}</span> 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-white rounded-md border border-surface-200 p-1">
            <button className="px-3 py-1 rounded bg-surface-100 text-surface-900 text-xs font-medium">Grid</button>
            <button className="px-3 py-1 rounded text-surface-500 hover:text-surface-900 text-xs font-medium">List</button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Board
          </Button>
        </div>
      </div>

      {/* Stats Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 relative z-10">
        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
              <Layout className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-surface-900 leading-none mb-1">{boards.length}</h4>
              <p className="text-[13px] text-surface-500">Total Boards</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
              <Users className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-surface-900 leading-none mb-1">
                {boards.reduce((acc, board) => acc + (board.members?.length || 1), 0)}
              </h4>
              <p className="text-[13px] text-surface-500">Members</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
              <CheckCircle className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-surface-900 leading-none mb-1">12</h4>
              <p className="text-[13px] text-surface-500">Tasks Done</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 shrink-0">
              <Clock className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-surface-900 leading-none mb-1">2m</h4>
              <p className="text-[13px] text-surface-500">Last Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-medium text-surface-900">Your Boards</h2>
        </div>

        {boards.length === 0 ? (
          <EmptyState 
            title="Organize. Collaborate. Achieve." 
            description="Create boards to bring your team and tasks together."
            actionLabel="+ Create Your First Board"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {boards.map((board) => (
              <Link 
                key={board._id} 
                to={`/b/${board._id}`}
                className="group block"
              >
                <Card hoverable className="flex flex-col justify-between overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 right-0 h-[3px]" 
                    style={{ background: `linear-gradient(90deg, ${board.color || '#397D68'}, ${board.color || '#397D68'}aa)` }}
                  />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center" style={{ color: board.color || '#397D68' }}>
                          <Layout className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[16px] text-surface-900 group-hover:text-primary-600 transition-colors">{board.title}</h3>
                          <p className="text-[13px] text-surface-500 line-clamp-1">Board for {board.title} tasks and planning.</p>
                        </div>
                      </div>
                      <button className="text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-100 p-1 rounded">
                        •••
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-100">
                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          {(board.members || [user]).slice(0, 3).map((member, i) => (
                            <div key={i} className="ring-2 ring-white rounded-full">
                              <Avatar user={member} size="xs" />
                            </div>
                          ))}
                          {(board.members?.length > 3) && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-[10px] font-medium text-surface-600 ring-2 ring-white z-10 relative">
                              +{board.members.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="ml-3 text-[12px] text-surface-500 font-medium">
                          {board.members?.length || 1} member{board.members?.length !== 1 && 's'}
                        </span>
                      </div>
                      <div className="flex items-center text-[12px] text-surface-400">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        <span>{formatDistanceToNow(new Date(board.updatedAt))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
