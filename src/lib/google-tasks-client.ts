const BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

export type AddTaskArguments = {
  tasklist: string;
  title: string;
  notes?: string;
  due?: Date;
};

export type Task = {
  id: string;
};

type AddTaskRequest = {
  title: string;
  notes?: string;
  due?: string;
};

export class Client {
  async addTask(accessToken: string, { tasklist, title, notes, due }: AddTaskArguments): Promise<Task> {
    const body: AddTaskRequest = {
      title,
    };

    if (notes) {
      body.notes = notes;
    }
    if (due) {
      body.due = due.toISOString();
    }

    const response = await fetch(`${BASE_URL}/lists/${encodeURIComponent(tasklist)}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to add task: ${response.status}`);
    }

    return response.json() as Promise<Task>;
  }
}
