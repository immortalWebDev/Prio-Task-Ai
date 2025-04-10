'use client';

import {useState, useEffect, useCallback} from 'react';
import {prioritizeTasks, PrioritizeTasksOutput} from '@/ai/flows/prioritize-tasks';
import {toast} from '@/hooks/use-toast';
import {useToast as useToastContext} from '@/hooks/use-toast';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {CheckCircle, Circle, Plus, RefreshCcw, Trash2, User} from 'lucide-react';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {getDatabase, ref, set, onValue, remove} from 'firebase/database';
import {initializeApp, FirebaseApp} from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  console.error('Firebase initialization error:', error);
  // Handle initialization error, e.g., show a toast or set an error state
  // For now, let's log the error and set a fallback
  app = {} as FirebaseApp; // Provide a fallback value to avoid further errors
}

const auth = getAuth(app);
const db = getDatabase(app);

type Task = {
  id: string;
  description: string;
  completed: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [aiPriority, setAiPriority] = useState<PrioritizeTasksOutput | null>(null);
  const {toast} = useToastContext();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Initialize Firebase only once
        if (!app || Object.keys(app).length === 0) {
          if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            throw new Error('Firebase API key is not defined in environment variables.');
          }
          initializeApp(firebaseConfig);
        }

        const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
          if (firebaseUser) {
            setUser(firebaseUser);
            loadTasks(firebaseUser.uid);
          } else {
            setUser(null);
            setTasks([]);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error: any) {
        console.error('Firebase initialization or auth state error:', error);
        setFirebaseError(error.message || 'Failed to initialize Firebase.');
        setLoading(false);
        toast({
          title: 'Firebase Error',
          description: error.message || 'Failed to initialize Firebase. Check console for details.',
          variant: 'destructive',
        });
      }
    };

    initializeFirebase();
  }, [auth, db, toast]);

  useEffect(() => {
    if (tasks.length > 0) {
      fetchAiPriority();
    } else {
      setAiPriority(null);
    }
  }, [tasks]);

  const loadTasks = useCallback(
    async (userId: string) => {
      const tasksRef = ref(db, `users/${userId}/tasks`);
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
    },
    [db]
  );

  const saveTask = async (userId: string, task: Task) => {
    const taskRef = ref(db, `users/${userId}/tasks/${task.id}`);
    await set(taskRef, {
      description: task.description,
      completed: task.completed,
    });
  };

  const addTask = async () => {
    if (newTask.trim() !== '' && user) {
      const newTaskItem: Task = {
        id: Date.now().toString(),
        description: newTask,
        completed: false,
      };
      setTasks([...tasks, newTaskItem]);
      await saveTask(user.uid, newTaskItem);
      setNewTask('');
    }
  };

  const deleteTask = async (id: string) => {
    if (user) {
      const taskRef = ref(db, `users/${user.uid}/tasks/${id}`);
      await remove(taskRef);
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const markComplete = async (id: string) => {
    if (user) {
      const updatedTasks = tasks.map(task =>
        task.id === id ? {...task, completed: !task.completed} : task
      );
      const taskToUpdate = updatedTasks.find(task => task.id === id);
      if (taskToUpdate) {
        await saveTask(user.uid, taskToUpdate);
        setTasks(updatedTasks);
      }
    }
  };

  const fetchAiPriority = async () => {
    try {
      const result = await prioritizeTasks({
        tasks: tasks.map(task => ({id: task.id, description: task.description})),
      });
      setAiPriority(result);
    } catch (error: any) {
      console.error('Failed to fetch AI priority:', error);
      toast({
        title: 'Error fetching AI priority',
        description: error.message || 'Failed to get task prioritization. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const signIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error('Failed to sign in anonymously:', error);
      toast({
        title: 'Error signing in',
        description: error.message || 'Failed to sign in. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Failed to sign out:', error);
      toast({
        title: 'Error signing out',
        description: error.message || 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 font-sans">
        <p>Loading...</p>
      </div>
    );
  }

  if (firebaseError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 font-sans">
        <p className="text-red-500">Firebase Error: {firebaseError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 font-sans">
      <h1 className="text-4xl font-bold text-primary mb-4">TaskMaster</h1>
      {user ? (
        <>
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 mr-2" />
            <span>User ID: {user.uid}</span>
            <Button
              variant="outline"
              className="ml-4"
              onClick={signOutUser}
              aria-label="Sign out"
            >
              Sign Out
            </Button>
          </div>
          <AddTask newTask={newTask} setNewTask={setNewTask} addTask={addTask} />
          <AIPrioritization aiPriority={aiPriority} fetchAiPriority={fetchAiPriority} />
          <TaskList tasks={tasks} markComplete={markComplete} deleteTask={deleteTask} />
        </>
      ) : (
        <div className="mb-4">
          <p className="text-lg mb-2">Sign in to start managing your tasks:</p>
          <Button onClick={signIn} aria-label="Sign in">
            Sign In Anonymously
          </Button>
        </div>
      )}
    </div>
  );
}

function AddTask({newTask, setNewTask, addTask}: {
  newTask: string;
  setNewTask: (task: string) => void;
  addTask: () => void;
}) {
  return (
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
  );
}

function TaskList({tasks, markComplete, deleteTask}: {
  tasks: Task[];
  markComplete: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  return (
    <ul className="w-full max-w-md">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          markComplete={markComplete}
          deleteTask={deleteTask}
        />
      ))}
    </ul>
  );
}

function TaskItem({task, markComplete, deleteTask}: {
  task: Task;
  markComplete: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  return (
    <li className="flex items-center justify-between py-2 px-4 bg-card rounded-md shadow-sm mb-2 last:mb-0">
      <button onClick={() => markComplete(task.id)} className="mr-4">
        {task.completed ? (
          <CheckCircle className="h-6 w-6 text-primary" aria-label="Mark as incomplete" />
        ) : (
          <Circle className="h-6 w-6 text-muted-foreground" aria-label="Mark as complete" />
        )}
      </button>
      <span className={`flex-grow text-base ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
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
  );
}

function AIPrioritization({aiPriority, fetchAiPriority}: {
  aiPriority: PrioritizeTasksOutput | null;
  fetchAiPriority: () => Promise<void>;
}) {
  return (
    <Card className="w-full max-w-md mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <h3 className="text-lg font-semibold tracking-tight">AI Prioritization</h3>
        <Button variant="outline" size="icon" onClick={fetchAiPriority} aria-label="Refresh AI priority">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {aiPriority ? (
          <ul>
            {aiPriority.prioritizedTasks.map((task, index) => (
              <li key={task.id} className="py-1">
                <span className="font-semibold">#{index + 1}</span>: {task.description} ({task.reason})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Add tasks to see AI-powered prioritization.</p>
        )}
      </CardContent>
    </Card>
  );
}
