'use client';

import {useState, useEffect} from 'react';
import {initializeApp} from 'firebase/app';
import {getDatabase, ref, push, set, onValue, remove} from 'firebase/database';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {CheckCircle, Circle, Plus, Trash2} from 'lucide-react';

const firebaseConfig = {
  apiKey: 'AIzaSyCLZ-VIRX2t02Y-3qkGPcwxxke8iv_2rJU',
  authDomain: 'taskmaster-94jon.firebaseapp.com',
  projectId: 'taskmaster-94jon',
  storageBucket: 'taskmaster-94jon.firebasestorage.app',
  messagingSenderId: '749056696025',
  appId: '1:749056696025:web:baa62b76b4d1799fb828c8',
  databaseURL: 'https://taskmaster-94jon-default-rtdb.firebaseio.com/',
};

let firebaseApp;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const db = getDatabase(firebaseApp);

type Task = {
  id: string;
  description: string;
  completed: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const tasksRef = ref(db, 'tasks');

    onValue(tasksRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const loadedTasks: Task[] = Object.keys(data).map(key => ({
          id: key,
          description: data[key].description,
          completed: data[key].completed,
        }));
        setTasks(loadedTasks);
      } else {
        setTasks([]);
      }
    });
  }, []);

  const addTask = () => {
    if (newTask.trim() !== '') {
      const tasksRef = ref(db, 'tasks');
      push(tasksRef, {
        description: newTask,
        completed: false,
      }).then(() => {
        setNewTask('');
      });
    }
  };

  const deleteTask = (id: string) => {
    const taskRef = ref(db, `tasks/${id}`);
    remove(taskRef);
  };

  const markComplete = (id: string) => {
    const taskRef = ref(db, `tasks/${id}`);
    const task = tasks.find(task => task.id === id);
    if (task) {
      set(taskRef, {
        description: task.description,
        completed: !task.completed,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 font-sans">
      <h1 className="text-4xl font-bold text-primary mb-4">TaskMaster</h1>
      <div className="flex w-full max-w-md mb-4">
        <Input
          type="text"
          placeholder="Add a task"
          className="rounded-l-md flex-grow"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              addTask();
            }
          }}
        />
        <Button onClick={addTask} className="rounded-r-md bg-accent text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
      <ul className="w-full max-w-md">
        {tasks.map(task => (
          <li
            key={task.id}
            className="flex items-center justify-between py-2 px-4 bg-card rounded-md shadow-sm mb-2 last:mb-0"
          >
            <button onClick={() => markComplete(task.id)} className="mr-4">
              {task.completed ? (
                <CheckCircle className="h-6 w-6 text-primary" aria-label="Mark as incomplete" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" aria-label="Mark as complete" />
              )}
            </button>
            <span
              className={`flex-grow text-base ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {task.description}
            </span>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => deleteTask(task.id)}
              aria-label="Delete task"
              className="ml-4"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
