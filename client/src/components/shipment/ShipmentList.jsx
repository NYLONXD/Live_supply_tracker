import ShipmentCard from './ShipmentCard';

export default function ShipmentList({ shipments }) {
  return (
    <div className="grid gap-4">
      {shipments.map(s => (
        <ShipmentCard key={s.id} shipment={s} />
      ))}
    </div>
  );
}
