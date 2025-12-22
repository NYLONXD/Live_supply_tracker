import { useEffect, useState } from 'react';
import { MapPin, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { driverAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function MyDeliveries() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data } = await driverAPI.getMyShipments();
      setShipments(data);
    } catch (error) {
      toast.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await driverAPI.updateStatus(shipmentId, newStatus);
      toast.success('Status updated');
      fetchShipments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'delivered',
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <DashboardLayout title="My Deliveries">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Deliveries">
      <div className="grid grid-cols-1 gap-4">
        {shipments.map((shipment) => (
          <Card key={shipment._id}>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-purple-400">{shipment.trackingNumber}</span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs">
                    {shipment.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <MapPin size={16} className="text-green-400" />
                  From: {shipment.from}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin size={16} className="text-red-400" />
                  To: {shipment.to}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getNextStatus(shipment.status) && (
                  <Button
                    onClick={() =>
                      handleStatusUpdate(shipment._id, getNextStatus(shipment.status))
                    }
                  >
                    Mark as {getNextStatus(shipment.status).replace('_', ' ')}
                  </Button>
                )}
                {shipment.status === 'delivered' && (
                  <div className="text-green-400 flex items-center gap-2">
                    <CheckCircle size={20} />
                    Completed
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default MyDeliveries;

