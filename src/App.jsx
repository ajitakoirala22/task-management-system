import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'taskflow-board-v1';
const APP_NAME = 'PulseBoard';

const defaultMembers = [
  { id: 'm1', name: 'Ananya Kapoor', role: 'Design lead', color: '#7c3aed' },
  { id: 'm2', name: 'Arjun Patel', role: 'Frontend', color: '#0f766e' },
  { id: 'm3', name: 'Meera Nair', role: 'Product', color: '#ea580c' },
  { id: 'm4', name: 'Kabir Sharma', role: 'QA', color: '#2563eb' }
];

const initialTasks = [
  {
    id: 't1',
    title: 'Define sprint goals',
    description: 'Align on top priorities for the next release.',
    column: 'backlog',
    priority: 'High',
    assigneeId: 'm3',
    dueDate: '2026-06-26',
    comments: 3
  },
  {
    id: 't2',
    title: 'Build login flow',
    description: 'Polish the authentication screens and validation states.',
    column: 'progress',
    priority: 'High',
    assigneeId: 'm2',
    dueDate: '2026-06-24',
    comments: 5
  },
  {
    id: 't3',
    title: 'Create onboarding checklist',
    description: 'Help new users understand the first steps.',
    column: 'review',
    priority: 'Medium',
    assigneeId: 'm1',
    dueDate: '2026-06-27',
    comments: 2
  },
  {
    id: 't4',
    title: 'QA the drag interactions',
    description: 'Test board movement across devices and screen sizes.',
    column: 'done',
    priority: 'Low',
    assigneeId: 'm4',
    dueDate: '2026-06-21',
    comments: 4
  }
];

const columns = [
  { id: 'backlog', title: 'Backlog', accent: '#f59e0b' },
  { id: 'progress', title: 'In Progress', accent: '#0ea5e9' },
  { id: 'review', title: 'Review', accent: '#8b5cf6' },
  { id: 'done', title: 'Done', accent: '#22c55e' }
];

const priorityMeta = {
  High: 'high',
  Medium: 'medium',
  Low: 'low'
};

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function getSeedState() {
  if (typeof window === 'undefined') {
    return null;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function normalizeMembers(savedMembers = []) {
  return defaultMembers.map((member) => {
    const saved = savedMembers.find((item) => item?.id === member.id);
    return {
      ...member,
      ...saved,
      id: member.id,
      name: member.name,
      role: member.role,
      color: member.color
    };
  });
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const bigint = Number.parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

function TaskCard({ task, member, onDragStart, onTaskSelect }) {
  const priorityTone = priorityMeta[task.priority] ?? 'medium';

  return (
    <article
      className="task-card"
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
      onClick={() => onTaskSelect(task)}
    >
      <div className="task-card__top">
        <span className={`priority priority--${priorityTone}`}>{task.priority}</span>
        <button className="icon-button icon-button--ghost" type="button" aria-label="Open task details">
          ⋯
        </button>
      </div>

      <h3>{task.title}</h3>
      <p>{task.description}</p>

      <div className="task-card__footer">
        <div className="assignee">
          <span
            className="assignee__avatar"
            style={
              member
                ? {
                    backgroundColor: hexToRgba(member.color, 0.12),
                    color: member.color,
                    borderColor: hexToRgba(member.color, 0.2)
                  }
                : undefined
            }
          >
            {member?.name ? getInitials(member.name) : '?'}
          </span>
          <div>
            <strong>{member?.name ?? 'Unassigned'}</strong>
            <span>{member?.role ?? 'Team member'}</span>
          </div>
        </div>
        <div className="task-card__meta">
          <span>Due {task.dueDate}</span>
          <span>{task.comments} comments</span>
        </div>
      </div>
    </article>
  );
}

function App() {
  const seed = getSeedState();
  const [tasks, setTasks] = useState(seed?.tasks ?? initialTasks);
  const [members] = useState(() => normalizeMembers(seed?.members));
  const [selectedTaskId, setSelectedTaskId] = useState(seed?.selectedTaskId ?? initialTasks[0].id);
  const [activity, setActivity] = useState(
    seed?.activity ?? [
      'Ananya updated the kickoff brief',
      'Arjun moved login flow into progress',
      'Kabir added QA notes for the board'
    ]
  );
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assigneeId: members[1].id,
    dueDate: '2026-06-30'
  });

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
            JSON.stringify({
              tasks,
              members,
        selectedTaskId: selectedTask?.id ?? null,
        activity
      })
    );
  }, [tasks, members, selectedTask, activity]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.column === 'done').length;
    const active = tasks.filter((task) => task.column !== 'done').length;
    return { total, done, active };
  }, [tasks]);

  const addActivity = (message) => {
    setActivity((current) => [message, ...current].slice(0, 6));
  };

  const handleCreateTask = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    const newTask = {
      id: uid('task'),
      title: form.title.trim(),
      description: form.description.trim() || 'No description added yet.',
      column: 'backlog',
      priority: form.priority,
      assigneeId: form.assigneeId,
      dueDate: form.dueDate,
      comments: 0
    };

    setTasks((current) => [newTask, ...current]);
    setSelectedTaskId(newTask.id);
    addActivity(`Created "${newTask.title}" and assigned it to the team`);
    setForm((current) => ({ ...current, title: '', description: '' }));
  };

  const handleDragStart = (event, taskId) => {
    event.dataTransfer.setData('text/task-id', taskId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (event, columnId) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/task-id');
    if (!taskId) {
      return;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, column: columnId } : task
      )
    );

    const movedTask = tasks.find((task) => task.id === taskId);
    if (movedTask) {
      addActivity(`Moved "${movedTask.title}" to ${columns.find((column) => column.id === columnId)?.title}`);
    }
  };

  const handleTaskSelect = (task) => {
    setSelectedTaskId(task.id);
    addActivity(`Opened "${task.title}" for collaboration`);
  };

  const handleTaskDetailChange = (field, value) => {
    if (!selectedTask) {
      return;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === selectedTask.id ? { ...task, [field]: value } : task
      )
    );

    if (field === 'assigneeId') {
      const member = members.find((teamMember) => teamMember.id === value);
      addActivity(`Reassigned "${selectedTask.title}" to ${member?.name ?? 'the team'}`);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Task management system</p>
          <h1>{APP_NAME}</h1>
          <p className="hero__copy">
            A React-powered Kanban workspace for planning work, moving tasks across stages, and keeping the whole team in sync.
          </p>
        </div>

        <div className="hero__stats">
          <div className="stat-card">
            <span>Total Tasks</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card">
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="stat-card">
            <span>Completed</span>
            <strong>{stats.done}</strong>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="workspace">
          <form className="composer" onSubmit={handleCreateTask}>
            <div className="composer__grid">
              <label>
                Task title
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Draft product launch checklist"
                />
              </label>
              <label>
                Assignee
                <select
                  value={form.assigneeId}
                  onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label>
                Due date
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </label>
            </div>
            <label className="composer__description">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Add notes, links, and anything the team should know."
                rows="3"
              />
            </label>
            <button className="primary-button" type="submit">
              Add task
            </button>
          </form>

          <div className="board" aria-label="Kanban board">
            {columns.map((column) => {
              const columnTasks = tasks.filter((task) => task.column === column.id);
              return (
                <div
                  key={column.id}
                  className="column"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, column.id)}
                >
                  <div className="column__header">
                    <div>
                      <h2>{column.title}</h2>
                      <span>{columnTasks.length} tasks</span>
                    </div>
                    <span className="column__dot" style={{ backgroundColor: column.accent, boxShadow: `0 0 18px ${column.accent}` }} />
                  </div>

                  <div className="column__content">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        member={members.find((member) => member.id === task.assigneeId)}
                        onDragStart={handleDragStart}
                        onTaskSelect={handleTaskSelect}
                      />
                    ))}
                    {columnTasks.length === 0 ? (
                      <div className="empty-state">Drop tasks here to move them into this stage.</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="sidebar">
          <section className="panel">
            <div className="panel__header">
              <h2>Team collaboration</h2>
              <span>Live workspace</span>
            </div>

            <div className="team-list">
              {members.map((member) => (
                <div key={member.id} className="team-member">
                  <span
                    className="team-member__avatar"
                    style={{
                      backgroundColor: hexToRgba(member.color, 0.12),
                      color: member.color,
                      borderColor: hexToRgba(member.color, 0.22)
                    }}
                  >
                    {member.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </span>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                  </div>
                  <span className="presence">Online</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>Task details</h2>
              <span>Shared notes</span>
            </div>

            {selectedTask ? (
              <div className="detail-card">
                <label>
                  Title
                  <input
                    value={selectedTask.title}
                    onChange={(event) => handleTaskDetailChange('title', event.target.value)}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows="4"
                    value={selectedTask.description}
                    onChange={(event) => handleTaskDetailChange('description', event.target.value)}
                  />
                </label>
                <div className="detail-card__row">
                  <label>
                    Stage
                    <select
                      value={selectedTask.column}
                      onChange={(event) => handleTaskDetailChange('column', event.target.value)}
                    >
                      {columns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Assignee
                    <select
                      value={selectedTask.assigneeId}
                      onChange={(event) => handleTaskDetailChange('assigneeId', event.target.value)}
                    >
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : (
              <p className="empty-copy">Select a task to see collaboration details.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>Activity feed</h2>
              <span>{activity.length} updates</span>
            </div>

            <div className="activity-list">
              {activity.map((item, index) => (
                <div key={`${item}-${index}`} className="activity-item">
                  <span className="activity-item__dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
