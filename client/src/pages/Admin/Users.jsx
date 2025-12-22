import { useEffect, useState } from 'react';
import { Search, UserPlus, Ban, Check } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [promotingUser, setPromotingUser] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const { data } = await adminAPI.getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter((u) => u.role !== 'admin');

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handlePromote = async (userId) => {
    if (!vehicleInfo || !vehicleNumber) {
      toast.error('Please enter vehicle details');
      return;
    }

    try {
      await adminAPI.promoteToDriver(userId, { vehicleInfo, vehicleNumber });
      toast.success('User promoted to driver');
      setPromotingUser(null);
      setVehicleInfo('');
      setVehicleNumber('');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to promote user');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Users">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Users Management">
      <Card className="mb-6">
        <Input
          icon={Search}
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="mt-4 text-sm text-slate-400">
          {filteredUsers.length} users found
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-slate-800">
                  {promotingUser === user._id ? (
                    <td colSpan={5} className="py-4 px-4">
                      <div className="flex gap-4 items-end">
                        <Input
                          label="Vehicle Info"
                          placeholder="e.g., Honda City"
                          value={vehicleInfo}
                          onChange={(e) => setVehicleInfo(e.target.value)}
                          containerClassName="flex-1"
                        />
                        <Input
                          label="Vehicle Number"
                          placeholder="e.g., DL-01-AB-1234"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          containerClassName="flex-1"
                        />
                        <Button onClick={() => handlePromote(user._id)}>Promote</Button>
                        <Button variant="ghost" onClick={() => setPromotingUser(null)}>
                          Cancel
                        </Button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-slate-200">{user.displayName}</td>
                      <td className="py-3 px-4 text-slate-400">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.isActive ? (
                          <Check className="text-green-400" size={20} />
                        ) : (
                          <Ban className="text-red-400" size={20} />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {user.role === 'user' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPromotingUser(user._id)}
                            >
                              <UserPlus size={16} className="mr-1" />
                              Promote
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={user.isActive ? 'danger' : 'success'}
                            onClick={() => handleToggleStatus(user._id)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}