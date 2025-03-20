// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store'; // Ajusta la ruta según tu estructura

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string; // 'completada' o 'pendiente'
  user: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  subtasks: Subtask[];
}

interface Subtask {
  _id: string;
  title: string;
  status: string; // 'completada' o 'pendiente'
  task: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  // Estado para almacenar el título de la nueva subtarea por cada tarea
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});

  // Obtener el token desde Redux
  const token = useSelector((state: RootState) => state.auth.token);

  // Función para obtener las tareas del usuario
  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/tasks/user/67da4394ba06dfb725aa3e49',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Retorna las tareas
    } catch (error) {
      setError('Error al cargar las tareas');
      console.error(error);
      return []; // Retorna un array vacío en caso de error
    }
  };

  // Función para obtener las subtareas de una tarea
  const fetchSubtasks = async (taskId: string) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/subtasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Retorna las subtareas
    } catch (error) {
      console.error('Error al cargar las subtareas:', error);
      return []; // Retorna un array vacío en caso de error
    }
  };

  // Cargar tareas y subtareas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener las tareas
        const tasksData = await fetchTasks();
        // Obtener las subtareas para cada tarea
        const tasksWithSubtasks = await Promise.all(
          tasksData.map(async (task: Task) => {
            const subtasks = await fetchSubtasks(task._id);
            return { ...task, subtasks }; // Combina la tarea con sus subtareas
          })
        );
        // Actualizar el estado con las tareas y subtareas
        setTasks(tasksWithSubtasks);
      } catch (error) {
        setError('Error al cargar los datos');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    } else {
      setError('No estás autenticado');
      setLoading(false);
    }
  }, [token]);

  // Función para marcar una subtarea como completada
  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    try {

        // Encontrar la tarea y la subtarea en el estado local
      const task = tasks.find((task) => task._id === taskId);
      const subtask = task?.subtasks.find((subtask) => subtask._id === subtaskId);

      if (!task || !subtask) {
        throw new Error('Tarea o subtarea no encontrada');
      }

      // Actualizar el estado local de la subtarea
      const updatedSubtasks = task.subtasks.map((st) =>
        st._id === subtaskId
          ? { ...st, status: st.status === 'completada' ? 'pendiente' : 'completada' }
          : st
      );

      const updatedTask = { ...task, subtasks: updatedSubtasks };
      const updatedTasks = tasks.map((t) => (t._id === taskId ? updatedTask : t));
      setTasks(updatedTasks);

      // Enviar actualización a la API para la subtarea
      const response = await axios.put(
        `http://localhost:5000/api/subtasks/${subtaskId}`,
        { status: subtask.status === 'completada' ? 'pendiente' : 'completada' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Actualizar el estado local con la respuesta del backend
      const updatedSubtaskFromBackend = response.data;
      const updatedSubtasksWithBackendResponse = updatedTask.subtasks.map((st) =>
        st._id === subtaskId ? updatedSubtaskFromBackend : st
      );

      const updatedTaskWithBackendResponse = { ...updatedTask, subtasks: updatedSubtasksWithBackendResponse };
      const updatedTasksWithBackendResponse = tasks.map((t) =>
        t._id === taskId ? updatedTaskWithBackendResponse : t
      );
      setTasks(updatedTasksWithBackendResponse);

      // Recargar la tarea principal desde el backend
      const updatedTaskResponse = await axios.get(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const refreshedTask = updatedTaskResponse.data;

      // Actualizar el estado de la tarea en el frontend
      const updatedTasksWithRefreshedTask = updatedTasksWithBackendResponse.map((t) =>
        t._id === taskId ? { ...t, status: refreshedTask.status } : t
      );
      setTasks(updatedTasksWithRefreshedTask);
    } catch (error) {
      console.error('Error al actualizar la subtarea o recargar la tarea:', error);
    }
  };

  // Función para eliminar una subtarea
  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      // Enviar solicitud DELETE al backend para eliminar la subtarea
      await axios.delete(`http://localhost:5000/api/subtasks/${subtaskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Actualizar el estado local eliminando la subtarea
      const updatedTasks = tasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((subtask) => subtask._id !== subtaskId),
            }
          : task
      );
      setTasks(updatedTasks);

      // Recargar la tarea principal desde el backend
      const updatedTaskResponse = await axios.get(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const refreshedTask = updatedTaskResponse.data;

      // Actualizar el estado de la tarea en el frontend
      const updatedTasksWithRefreshedTask = updatedTasks.map((t) =>
        t._id === taskId ? { ...t, status: refreshedTask.status } : t
      );
      setTasks(updatedTasksWithRefreshedTask);
    } catch (error) {
      console.error('Error al eliminar la subtarea:', error);
    }
  };

  // Función para marcar una tarea como completada o pendiente
  const toggleTaskStatus = async (taskId: string) => {
    try {
      // Encontrar la tarea en el estado local
      const task = tasks.find((task) => task._id === taskId);
      if (!task) {
        throw new Error('Tarea no encontrada');
      }
      // Determinar el nuevo estado de la tarea
      const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
      // Enviar actualización a la API para la tarea principal
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Si la solicitud fue exitosa, actualizar el estado local con la respuesta del backend
      const updatedTask = response.data;
      const updatedTasks = tasks.map((t) =>
        t._id === taskId ? { ...t, status: updatedTask.status } : t
      );
      setTasks(updatedTasks);
    } catch (error: any) {
      if (error.response && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Error al cambiar el estado de la tarea');
      }
      console.error('Error al cambiar el estado de la tarea:', error);
    }
  };

  // Función para agregar una nueva tarea y volver a consultar la API
  const handleAddTask = async () => {
    try {
      if (!newTaskTitle.trim()) {
        alert('El título de la tarea no puede estar vacío.');
        return;
      }

      await axios.post(
        'http://localhost:5000/api/tasks/',
        {
          title: newTaskTitle,
          description: newTaskDescription,
          status: 'pendiente',
          user: '67da4394ba06dfb725aa3e49',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Recargar las tareas después de agregar una nueva
      const updatedTasksData = await fetchTasks();
      const tasksWithSubtasks = await Promise.all(
        updatedTasksData.map(async (task: Task) => {
          const subtasks = await fetchSubtasks(task._id);
          return { ...task, subtasks };
        })
      );
      setTasks(tasksWithSubtasks);
      setNewTaskTitle('');
      setNewTaskDescription('');
    } catch (error: any) {
      if (error.response && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Error al agregar la tarea');
      }
      console.error('Error al agregar la tarea:', error);
    }
  };

  // Función para agregar una nueva subtarea a una tarea
  const handleAddSubtask = async (taskId: string) => {
    try {
      const newTitle = newSubtaskTitles[taskId];
      if (!newTitle || !newTitle.trim()) {
        alert('El título de la subtarea no puede estar vacío.');
        return;
      }
  
      await axios.post(
        'http://localhost:5000/api/subtasks',
        {
          title: newTitle,
          status: 'pendiente',
          task: taskId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Limpiar el input de la subtarea para esa tarea
      setNewSubtaskTitles(prev => ({ ...prev, [taskId]: '' }));
  
      // Actualizar la lista de subtareas de la tarea
      const updatedSubtasksResponse = await axios.get(
        `http://localhost:5000/api/subtasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedSubtasks = updatedSubtasksResponse.data;
  
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId ? { ...task, subtasks: updatedSubtasks } : task
        )
      );
  
      // Recargar la tarea principal desde el backend
      const updatedTaskResponse = await axios.get(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const refreshedTask = updatedTaskResponse.data;
  
      // Actualizar el estado de la tarea en el frontend
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId ? { ...task, status: refreshedTask.status } : task
        )
      );
    } catch (error) {
      console.error('Error al agregar subtarea:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center">Cargando...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex justify-center items-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Tareas</h1>
      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          placeholder="Título de la tarea"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="border rounded p-2 flex-grow text-gray-800 placeholder-gray-400 focus:ring focus:ring-blue-300"
        />
        <input
          type="text"
          placeholder="Descripción de la tarea"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          className="border rounded p-2 flex-grow text-gray-800 placeholder-gray-400 focus:ring focus:ring-blue-300"
        />
        <button
          onClick={handleAddTask}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Agregar Tarea
        </button>
      </div>
      <div className="space-y-6">
        {tasks.map((task) => (
          <div key={task._id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">{task.title}</h2>
              <button
                onClick={() => toggleTaskStatus(task._id)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  task.status === 'completada'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {task.status === 'completada' ? 'Completada' : 'Pendiente'}
              </button>
            </div>
            <p className="text-gray-600 mb-4">{task.description}</p>
            <div className="space-y-2 mb-4">
              <h3 className="text-lg font-medium text-gray-700">Subtareas:</h3>
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className={`text-gray-700 ${subtask.status === 'completada' ? 'line-through text-gray-400' : ''}`}>
                    {subtask.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSubtask(task._id, subtask._id)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        subtask.status === 'completada'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {subtask.status === 'completada' ? 'Completada' : 'Completar'}
                    </button>
                    <button
                      onClick={() => deleteSubtask(task._id, subtask._id)}
                      className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {/* Formulario para agregar una nueva subtarea */}
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  placeholder="Título de la subtarea"
                  value={newSubtaskTitles[task._id] || ''}
                  onChange={(e) =>
                    setNewSubtaskTitles(prev => ({
                      ...prev,
                      [task._id]: e.target.value,
                    }))
                  }
                  className="border rounded p-2 flex-grow text-gray-800 placeholder-gray-400 focus:ring focus:ring-blue-300"
                />
                <button
                  onClick={() => handleAddSubtask(task._id)}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  Agregar Subtarea
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
