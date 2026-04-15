export const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Órdenes Pendientes</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Guías por Generar</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Stock Bajo</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Rositas Activas</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
      </div>
    </div>
  );
};
