import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '@/stores/auth';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');

    if (!token) {
      navigate('/login?error=Google+login+failed');
      return;
    }

    // Store token then fetch user profile
    useAuthStore.setState({ accessToken: token, isAuthenticated: true });
    fetchMe()
      .then(() => navigate('/dashboard'))
      .catch(() => navigate('/login?error=Failed+to+load+profile'));
  }, [searchParams, navigate, fetchMe]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in with Google...</p>
    </div>
  );
}
