import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Order } from '../types/api.types'

type OrderItem = {
  name: string
  qty: number
}

type LocalOrder = {
  id: string
  status: string
  items: OrderItem[]
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<LocalOrder | null>(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    setOrder({ id: id || '', status: "processing", items: [{ name: "Frame A", qty: 1 }] });
  }, [id]);

  if (!order) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Đơn {order.id}</h1>
      <div className="mb-4">Trạng thái: {order.status}</div>
      <div>
        {order.items.map((it, idx) => (
          <div key={idx} className="p-2 border rounded mb-2">
            {it.name} x{it.qty}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetailPage;
