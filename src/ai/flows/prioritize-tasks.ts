'use server';
/**
 * @fileOverview A task prioritization AI agent.
 *
 * - prioritizeTasks - A function that handles the task prioritization process.
 * - PrioritizeTasksInput - The input type for the prioritizeTasks function.
 * - PrioritizeTasksOutput - The return type for the PrioritizeTasks function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().describe('The unique identifier of the task.'),
      description: z.string().describe('The description of the task.'),
    })
  ).describe('The list of tasks to prioritize.'),
});
export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizeTasksOutputSchema = z.object({
  prioritizedTasks: z.array(
    z.object({
      id: z.string().describe('The unique identifier of the task.'),
      description: z.string().describe('The description of the task.'),
      priority: z.number().describe('The priority of the task (1 being highest priority).'),
      reason: z.string().describe('The reason for the task priority.')
    })
  ).describe('The list of tasks with their assigned priorities.'),
});
export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function prioritizeTasks(input: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {
    schema: z.object({
      tasks: z.array(
        z.object({
          id: z.string().describe('The unique identifier of the task.'),
          description: z.string().describe('The description of the task.'),
        })
      ).describe('The list of tasks to prioritize.'),
    }),
  },
  output: {
    schema: z.object({
      prioritizedTasks: z.array(
        z.object({
          id: z.string().describe('The unique identifier of the task.'),
          description: z.string().describe('The description of the task.'),
          priority: z.number().describe('The priority of the task (1 being highest priority).'),
          reason: z.string().describe('The reason for the task priority.')
        })
      ).describe('The list of tasks with their assigned priorities.'),
    }),
  },
  prompt: `You are a task prioritization expert. Given the following list of tasks, prioritize them based on their descriptions. Return the tasks with their original IDs, descriptions, a priority (1 being highest priority), and a short reason for the assigned priority.

Tasks:
{{#each tasks}}
- ID: {{this.id}}, Description: {{this.description}}
{{/each}}

Prioritized Tasks:`, // Ensure that the output schema properties are honored
});

const prioritizeTasksFlow = ai.defineFlow<
  typeof PrioritizeTasksInputSchema,
  typeof PrioritizeTasksOutputSchema
>(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
