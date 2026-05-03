import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../store/authSlice.js";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const dashboardPath =
    user?.role === "freelancer"
      ? "/freelancer-dashboard"
      : user?.role === "admin"
      ? "/admin-dashboard"
      : "/client-dashboard";

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-lg font-semibold text-slate-800">
          Smart Allocator
        </Link>

        {isAuthenticated && (
          <div className="flex items-center gap-6">
            <Link
              to={dashboardPath}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <span className="text-sm text-slate-400 capitalize">
              {user?.role}
            </span>
            <span className="text-sm font-medium text-slate-700">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;