'use client';

import {useState, useEffect} from 'react';
import {initializeApp} from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove,
  off,
} from 'firebase/database';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {CheckCircle, Circle, Plus, Trash2, Brain} from 'lucide-react';
import {prioritizeTasks, PrioritizeTasksOutput} from '@/ai/flows/prioritize-tasks';

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
const auth = getAuth(firebaseApp);

type Task = {
  id: string;
  description: string;
  completed: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [aiPrioritizedTasks, setAiPrioritizedTasks] = useState<PrioritizeTasksOutput | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authUser => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let tasksRef: any;
    if (user) {
      tasksRef = ref(db, `tasks/${user.uid}`);
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
    }

    return () => {
      if (user) {
        off(ref(db, `tasks/${user.uid}`)); // Detach listener
      }
    };
  }, [user]);

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Registered!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      alert('Logged out.');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const addTask = () => {
    if (!user) {
      alert('Please log in to add tasks.');
      return;
    }

    if (newTask.trim() !== '') {
      const tasksRef = ref(db, `tasks/${user.uid}`);
      push(tasksRef, {
        description: newTask,
        completed: false,
      }).then(() => {
        setNewTask('');
      });
    }
  };

  const deleteTask = (id: string) => {
    if (!user) {
      alert('Please log in to delete tasks.');
      return;
    }
    const taskRef = ref(db, `tasks/${user.uid}/${id}`);
    remove(taskRef);
  };

  const markComplete = (id: string) => {
    if (!user) {
      alert('Please log in to manage tasks.');
      return;
    }
    const taskRef = ref(db, `tasks/${user.uid}/${id}`);
    const task = tasks.find(task => task.id === id);
    if (task) {
      set(taskRef, {
        description: task.description,
        completed: !task.completed,
      });
    }
  };

  const getAiPriority = async () => {
    if (!user) {
      alert('Please log in to prioritize tasks.');
      return;
    }

    try {
      const input = {
        tasks: tasks.map(task => ({
          id: task.id,
          description: task.description,
        })),
      };
      const result = await prioritizeTasks(input);
      setAiPrioritizedTasks(result);
    } catch (error: any) {
      console.error('AI Prioritization Error:', error);
      alert(`AI Prioritization failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 font-sans">
      <h1 className="text-4xl font-bold text-primary mb-4">TaskMaster</h1>

      {user ? (
        <>
          <p>Welcome, {user.email}!</p>
          <Button onClick={logout} className="mb-4 bg-secondary text-secondary-foreground">
            Logout
          </Button>
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
          <Button onClick={getAiPriority} className="mb-4 bg-accent text-accent-foreground">
            <Brain className="h-4 w-4 mr-2" />
            Get AI Priority
          </Button>
          {aiPrioritizedTasks && (
            <Card className="w-full max-w-md mb-4">
              <CardHeader>
                <h2 className="text-lg font-semibold">AI Prioritized Tasks</h2>
              </CardHeader>
              <CardContent>
                <ul>
                  {aiPrioritizedTasks.prioritizedTasks.map(task => (
                    <li key={task.id} className="py-2">
                      <strong>{task.priority}:</strong> {task.description} - {task.reason}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
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
        </>
      ) : (
        <div className="flex flex-col items-center w-full max-w-md">
          <Input
            type="email"
            placeholder="Email"
            className="mb-2 rounded-md"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            className="mb-2 rounded-md"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button onClick={isRegistering ? register : login} className="mb-2 bg-primary text-primary-foreground rounded-md">
            {isRegistering ? 'Register' : 'Login'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsRegistering(!isRegistering)}
            className="rounded-md"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </Button>
        </div>
      )}
    </div>
  );
}
