
'use client';

import {useState, useEffect} from 'react';
import {prioritizeTasks, PrioritizeTasksOutput} from '@/ai/flows/prioritize-tasks';
import {toast} from '@/hooks/use-toast';
import {useToast as useToastContext} from '@/hooks/use-toast';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {CheckCircle, Circle, Plus, RefreshCcw, Trash2} from 'lucide-react';

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

  useEffect(() => {
    if (tasks.length > 0) {
      fetchAiPriority();
    } else {
      setAiPriority(null);
    }
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim() !== '') {
      const newTaskItem: Task = {
        id: Date.now().toString(),
        description: newTask,
        completed: false,
      };
      setTasks([...tasks, newTaskItem]);
      setNewTask('');
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const markComplete = (id: string) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? {...task, completed: !task.completed} : task
      )
    );
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

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 font-sans">
      <h1 className="text-4xl font-bold text-primary mb-4">TaskMaster</h1>
      <AddTask newTask={newTask} setNewTask={setNewTask} addTask={addTask} />
      <AIPrioritization aiPriority={aiPriority} fetchAiPriority={fetchAiPriority} />
      <TaskList tasks={tasks} markComplete={markComplete} deleteTask={deleteTask} />
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
