import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; import { Package, Box } from 'lucide-react'
const OperationsDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    setTasks([{ id: "t1", type: "packing", orderId: "o1" }]);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Operations Dashboard</h1>
      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="p-3 border rounded-md">
            {t.type} — Đơn{" "}
            <Link to={`/admin/orders/${t.orderId}`} className="text-blue-600">
              {t.orderId}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationsDashboard;
