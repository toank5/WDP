import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

// Redirect to profile page for better UX
const AccountPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/account/profile" replace />;
};

export default AccountPage;
