import Card from '../common/Card';
import { Link } from 'react-router-dom';

export default function ShipmentCard({ shipment }) {
  return (
    <Card>
      <h3>{shipment.from} → {shipment.to}</h3>
      <p>Status: {shipment.status}</p>
      <Link to={`/user/shipments/${shipment.id}`}>View</Link>
    </Card>
  );
}
