import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function AuthScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const showToast = useUIStore((s) => s.showToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const errorMsg = await signIn(data.email, data.password);
    if (errorMsg) showToast('error', errorMsg);
  }

  return (
    <div className="lock-screen">
      <div className="lock-content">
        <h1>Product Tracker</h1>
        <p className="text-muted">Sign in to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="lock-form">
          <input
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="Email"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="text-error">{errors.email.message}</p>}

          <input
            type="password"
            className={`input ${errors.password ? 'input-error' : ''}`}
            placeholder="Password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <p className="text-error">{errors.password.message}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
