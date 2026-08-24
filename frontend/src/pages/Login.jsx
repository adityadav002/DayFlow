import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginSchema } from '../utils/validationSchemas';
import { loginUser, clearError } from '../redux/slices/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, status, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    await dispatch(loginUser(data));
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8">
          <h2 className="text-3xl font-semibold text-surface-900 tracking-tight">Welcome back</h2>
          <p className="mt-2 text-surface-500">
            Sign in to continue to DayFlow.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 transition-colors" />
              <span className="text-surface-600 group-hover:text-surface-900 transition-colors">Remember me</span>
            </label>
            <button type="button" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base mt-2"
            isLoading={status === 'loading'}
          >
            {status === 'loading' ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-surface-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Sign up
          </Link>
        </p>
    </div>
  );
};

export default Login;
