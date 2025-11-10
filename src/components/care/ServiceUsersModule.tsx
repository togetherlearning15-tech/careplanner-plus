function ServiceUsersModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Service Users</h2>
        <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200">
          Add Service User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Service Users Management
          </h3>
          <p className="text-gray-500">
            This module will allow you to manage service user records, care plans, and profiles.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ServiceUsersModule;
