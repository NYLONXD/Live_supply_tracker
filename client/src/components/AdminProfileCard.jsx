import React from 'react';
import adminphoto from '../assets/Adminphoto.jpg'; // ✅ Correct import

const AdminProfileCard = () => {
  return (
    <div className="flex items-center gap-4 bg-white/10 border border-purple-700/30 p-4 rounded-2xl shadow-xl backdrop-blur-lg w-full max-w-sm">
      {/* Profile Image */}
      <div className="w-23 h-20 rounded-full overflow-hidden border-4 border-purple-500 shadow-md">
        <img
          src={adminphoto}
          alt="Admin Profile"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name & Role */}
      <div>
        <h3 className="text-lg font-bold text-white">Himanshu Jha</h3>
        <p className="text-sm text-purple-300">Admin</p>
      </div>
    </div>
  );
};

export default AdminProfileCard;
