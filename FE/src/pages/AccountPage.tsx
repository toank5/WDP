import React from "react";
import { Link } from "react-router-dom";

const AccountPage: React.FC = () => {
  const user = { name: "Người dùng", email: "user@example.com" };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Tài khoản</h1>
      <div className="mb-2">Tên: {user.name}</div>
      <div className="mb-4">Email: {user.email}</div>
      <div className="flex gap-4">
        <Link to="/orders" className="text-blue-600">
          Lịch sử đơn hàng
        </Link>
        <Link to="/prescription/upload" className="text-blue-600">
          Đơn kính
        </Link>
        <Link to="/account/profile" className="text-blue-600">
          Chỉnh sửa
        </Link>
      </div>
    </div>
  );
};

export default AccountPage;
