import React, { useState, useEffect } from 'react';

const AdminTaskManager = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  // Load tasks from server
  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/tasks');
      const data = await res.json();
      setTasks(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchTasks();
  }, [isOpen]);

  // Add a new task
  const handleAdd = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask }),
      });
      const saved = await res.json();
      setTasks(prev => [saved, ...prev]);
      setNewTask('');
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  // Delete a task
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Toggle task status
  const handleToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setTasks(tasks.map(t => (t._id === id ? updated : t)));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-[320px] bg-[#1e0033] text-white shadow-2xl p-6 transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📝 Task Manager</h2>
        <button onClick={onClose} className="text-xl hover:text-red-400">✖</button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 rounded bg-white/10 text-white placeholder-gray-400"
          placeholder="New Task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <button onClick={handleAdd} className="bg-purple-700 px-4 rounded hover:bg-purple-800">Add</button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading tasks...</div>
      ) : (
        <ul className="space-y-3 max-h-[75vh] overflow-y-auto">
          {tasks.map(task => (
            <li key={task._id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
              <span className={`${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleToggle(task._id, task.status)} className="text-green-400 hover:scale-110">
                  {task.status === 'done' ? '↩️' : '✅'}
                </button>
                <button onClick={() => handleDelete(task._id)} className="text-red-400 hover:scale-110">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}    
    </div>
  );
};

export default AdminTaskManager;
