import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentUser, logoutLocally } from '../redux/slices/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isInitialized, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized && status === 'idle') {
      dispatch(fetchCurrentUser());
    }

    const handleLogoutEvent = () => {
      dispatch(logoutLocally());
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [dispatch, isInitialized, status]);

  return { user, isAuthenticated, isInitialized, isLoading: status === 'loading' };
};

export default useAuth;
