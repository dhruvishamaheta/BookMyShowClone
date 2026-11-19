import { Navigate } from "react-router-dom";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import AdminShell from "./AdminShell";

function AdminRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <AdminShell>{children}</AdminShell>;
}

export default AdminRoute;
