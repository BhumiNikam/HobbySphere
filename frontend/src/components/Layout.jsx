  import { Outlet, Link } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';

  export default function Layout({ children }) {
    const { user } = useAuth();

    return (
      <div className="min-h-screen bg-slate-50">
        {user?.isGuest && (
          <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
            ⚠️ Guest Mode Active - Your data will be deleted on logout. 
            <Link to="/register" className="ml-2 underline font-bold">
              Create Account to Save
            </Link>
          </div>
        )}
        <main className="w-full">
          {children || <Outlet />}
        </main>
      </div>
    );
  }