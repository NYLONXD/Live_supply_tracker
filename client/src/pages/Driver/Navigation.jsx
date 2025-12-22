// ===== src/pages/Driver/Navigation.jsx =====
export function Navigation() {
  return (
    <DashboardLayout title="Navigation">
      <Card>
        <div className="text-center py-12">
          <MapPin className="mx-auto mb-4 text-slate-600" size={48} />
          <h3 className="text-lg font-semibold text-slate-400">GPS Navigation</h3>
          <p className="text-slate-500">Coming soon with live tracking</p>
        </div>
      </Card>
    </DashboardLayout>
  );
}

export default Navigation;