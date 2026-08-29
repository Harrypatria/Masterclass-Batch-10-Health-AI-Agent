import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  User, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  FileText,
  Filter,
  Kanban,
  List
} from 'lucide-react';
import { ClinicalTask, TaskStatus, TaskPriority } from '../types';

interface TasksViewProps {
  tasks: ClinicalTask[];
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onAddTask: (task: Omit<ClinicalTask, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onUpdateTaskStatus,
  onAddTask,
  onDeleteTask
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // New task form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newPatientRef, setNewPatientRef] = useState<string>('PT-8842');
  const [newPatientName, setNewPatientName] = useState<string>('Eleanor Vance');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIntervention, setNewIntervention] = useState<string>('Laboratory Diagnostic Requisition');
  const [newPriority, setNewPriority] = useState<TaskPriority>('HIGH');
  const [newDueDate, setNewDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [newAssignee, setNewAssignee] = useState<string>('Care Coordinator');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      patient_ref: newPatientRef,
      patient_name: newPatientName,
      disease_type: 'diabetes',
      title: newTitle,
      description: newDescription,
      intervention: newIntervention,
      status: 'TODO',
      priority: newPriority,
      due_date: newDueDate,
      assigned_to: newAssignee
    });

    setNewTitle('');
    setNewDescription('');
    setIsCreatingTask(false);
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 tracking-wider">
                ITDO Stage 4: Operations Layer
              </span>
              <span className="text-xs text-slate-500 font-medium">Clinical Workflow & Care Coordination</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 uppercase tracking-tight">Care Operations & Intervention Task Board</h2>
            <p className="text-xs text-slate-500">
              Executable clinical pathways, confirmatory laboratory orders, and specialist follow-up routing.
            </p>
          </div>

          {/* View Mode & New Task Controls */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'kanban' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Kanban Board"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'list' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingTask(!isCreatingTask)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>New Care Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Task Creator Modal / Inline Form */}
      {isCreatingTask && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white border border-teal-500 rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Create New Clinical Care Task</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingTask(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Task Title / Action Item</label>
              <input
                type="text"
                required
                placeholder="e.g., Order HbA1c Lab Panel & Schedule Nutrition Consultation"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Intervention Category</label>
              <select
                value={newIntervention}
                onChange={(e) => setNewIntervention(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="Laboratory Diagnostic Requisition">Laboratory Diagnostic Requisition</option>
                <option value="Specialist Referral & DSMES">Specialist Referral & DSMES</option>
                <option value="Medical Nutrition Therapy">Medical Nutrition Therapy</option>
                <option value="Medication Review">Medication Review</option>
                <option value="Preventative Care Tracking">Preventative Care Tracking</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Patient Ref ID</label>
              <input
                type="text"
                value={newPatientRef}
                onChange={(e) => setNewPatientRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Patient Full Name</label>
              <input
                type="text"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold"
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Assigned Caregiver</label>
              <input
                type="text"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-1">Clinical Protocol Notes</label>
              <textarea
                rows={2}
                placeholder="Include specific dosage adjustments, laboratory test codes, or physician instructions..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingTask(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm uppercase tracking-wider"
            >
              Save Care Task
            </button>
          </div>
        </form>
      )}

      {/* Kanban Mode */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: TODO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2.5 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">To Do / Pending</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={onUpdateTaskStatus}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2.5 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">In Progress / Lab Sent</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={onUpdateTaskStatus}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2.5 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Completed / Follow-up Done</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={onUpdateTaskStatus}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Status</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Patient</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Task Title</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Intervention</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Priority</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Due Date</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Assignee</th>
                  <th className="p-3.5 text-right font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className={`text-[11px] font-bold font-mono px-2 py-1 rounded bg-slate-50 border ${
                          task.status === 'DONE'
                            ? 'text-emerald-700 border-emerald-300'
                            : task.status === 'IN_PROGRESS'
                            ? 'text-amber-700 border-amber-300'
                            : 'text-red-700 border-red-300'
                        }`}
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="DONE">DONE</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 font-mono">
                      {task.patient_name || task.patient_ref}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 max-w-xs truncate">{task.title}</td>
                    <td className="p-3.5 text-teal-700 font-medium">{task.intervention}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        task.priority === 'URGENT'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 font-medium">{task.due_date}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{task.assigned_to}</td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: ClinicalTask;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateStatus, onDelete }) => {
  const priorityColor =
    task.priority === 'URGENT'
      ? 'bg-red-100 text-red-700 border-red-200'
      : task.priority === 'HIGH'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-300 transition-all space-y-3">
      <div className="flex items-start justify-between">
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${priorityColor}`}>
          {task.priority}
        </span>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="text-slate-400 hover:text-red-600 transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
        {task.description && (
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
            {task.description}
          </p>
        )}
      </div>

      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
        <div className="flex justify-between text-slate-600">
          <span className="text-slate-400 font-medium">Patient:</span>
          <span className="font-bold text-slate-900">{task.patient_name || task.patient_ref}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span className="text-slate-400 font-medium">Category:</span>
          <span className="text-teal-700 font-semibold">{task.intervention}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span className="text-slate-400 font-medium">Due:</span>
          <span className="font-mono font-medium">{task.due_date}</span>
        </div>
      </div>

      {/* Quick Move Status Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
        <span className="text-slate-400 font-medium">Assignee: {task.assigned_to}</span>
        <div className="flex gap-1">
          {task.status !== 'TODO' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(task.id, 'TODO')}
              className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 uppercase tracking-wider"
            >
              To Do
            </button>
          )}
          {task.status !== 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
              className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 uppercase tracking-wider"
            >
              In Prog
            </button>
          )}
          {task.status !== 'DONE' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(task.id, 'DONE')}
              className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 uppercase tracking-wider"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
