import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const AdminTaskManager = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: '100%' },
        { x: 0, duration: 0.5, ease: 'power3.out' }
      );
      fetchTasks();
    }
  }, [isOpen]);

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

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      // Animate removal
      gsap.to(`#task-${id}`, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        onComplete: () => setTasks(tasks.filter(t => t._id !== id)),
      });
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

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
    <div
      ref={sidebarRef}
      className={`fixed top-0 right-0 h-full w-[340px] bg-[#1e0033] text-white shadow-2xl p-6 transition-transform duration-300 z-50 ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📝 Task Manager</h2>
        <button onClick={onClose} className="text-xl hover:text-red-400">✖</button>
      </div>

      {/* Add Task Input */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 rounded bg-white/10 text-white placeholder-gray-400 focus:outline-none"
          placeholder="New Task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <button onClick={handleAdd} className="bg-purple-700 px-4 rounded hover:bg-purple-800">
          Add
        </button>
      </div>

      {/* Tasks */}
      {loading ? (
        <div className="text-center text-gray-400">Loading tasks...</div>
      ) : (
        <ul className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          {tasks.map(task => (
            <li
              key={task._id}
              id={`task-${task._id}`}
              className="flex justify-between items-center bg-white/5 p-3 rounded-lg hover:bg-white/10 transition"
            >
              <span className={`${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(task._id, task.status)}
                  className="text-green-400 hover:scale-110 transition-transform"
                >
                  {task.status === 'done' ? '↩️' : '✅'}
                </button>
                <button
                  onClick={() => handleDelete(task._id)}
                  className="text-red-400 hover:scale-110 transition-transform"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminTaskManager;
