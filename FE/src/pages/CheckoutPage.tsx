import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; import { CreditCard, MapPin } from 'lucide-react'
const CheckoutPage: React.FC = () => {
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const submit = () => {
    // placeholder: call checkout API
    navigate("/orders");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <input
        className="border p-2 w-full mb-4"
        placeholder="Địa chỉ giao hàng"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={!address}
      >
        Thanh toán
      </button>
    </div>
  );
};

export default CheckoutPage;
