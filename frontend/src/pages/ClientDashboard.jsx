import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProjects, addProject } from "../store/projectSlice.js";
import { createProject, getMyProjects } from "../api/projectApi.js";
import { assignProject, getAssignmentByProject } from "../api/allocationApi.js";
import ProjectCard from "../components/ProjectCard.jsx";
import ScheduleTimeline from "../components/ScheduleTimeline.jsx";
import { CardSkeleton, StatSkeleton } from "../components/Skeleton.jsx";

const SKILLS = ["Frontend", "Backend", "Design", "Mobile", "DevOps", "Data Science", "QA"];

const ClientDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.project);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkill: "Frontend",
    deadline: "",
    estimatedHours: "",
    priority: "normal",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [allocationResult, setAllocationResult] = useState(null);
  const [allocating, setAllocating] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await getMyProjects();
      dispatch(setProjects(data));
      data.forEach((p) => {
        if (p.status !== "pending") fetchAssignment(p._id);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchAssignment = async (projectId) => {
    try {
      const { data } = await getAssignmentByProject(projectId);
      setAssignments((prev) => ({ ...prev, [projectId]: data }));
    } catch (_) {}
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const { data } = await createProject({
        ...formData,
        estimatedHours: Number(formData.estimatedHours),
      });
      dispatch(addProject(data));
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        requiredSkill: "Frontend",
        deadline: "",
        estimatedHours: "",
        priority: "normal",
      });
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create project");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssign = async (projectId) => {
    setAllocating(projectId);
    setAllocationResult(null);
    try {
      const { data } = await assignProject(projectId);
      if (data.success) {
        setAssignments((prev) => ({ ...prev, [projectId]: data.assignment }));
        setAllocationResult({ type: "success", assignment: data.assignment });
        fetchProjects();
      } else {
        setAllocationResult({
          type: "failure",
          message: data.message,
          suggestions: data.suggestions,
        });
      }
    } catch (err) {
      setAllocationResult({
        type: "failure",
        message: "Allocation failed. Please try again.",
        suggestions: [],
      });
    } finally {
      setAllocating(null);
    }
  };

  const pendingCount = projects.filter((p) => p.status === "pending").length;
  const assignedCount = projects.filter((p) => p.status !== "pending").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your projects and track allocations
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {pageLoading
          ? [1, 2, 3].map((i) => <StatSkeleton key={i} />)
          : [
              { label: "Total Projects", value: projects.length, color: "text-slate-800" },
              { label: "Pending", value: pendingCount, color: "text-yellow-600" },
              { label: "Assigned", value: assignedCount, color: "text-blue-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                <p className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
      </div>

      {/* Create Project Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Create New Project
          </h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {formError}
            </div>
          )}
          <form onSubmit={handleCreateProject} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Build Landing Page"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief project description..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Required Skill</label>
              <select
                name="requiredSkill"
                value={formData.requiredSkill}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                {SKILLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                required
                min={1}
                placeholder="e.g. 10"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {formLoading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Allocation Result Banner */}
      {allocationResult && (
        <div className={`rounded-xl p-5 mb-6 border ${
          allocationResult.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          {allocationResult.type === "success" ? (
            <div>
              <p className="font-medium text-green-800 mb-1">✓ Project successfully allocated</p>
              <p className="text-sm text-green-700">
                Assigned to{" "}
                <strong>{allocationResult.assignment.freelancerId?.userId?.name}</strong>
              </p>
              <ScheduleTimeline
                schedule={allocationResult.assignment.schedule}
                estimatedCompletionDate={allocationResult.assignment.estimatedCompletionDate}
              />
            </div>
          ) : (
            <div>
              <p className="font-medium text-amber-800 mb-2">⚠ Could not allocate project</p>
              <p className="text-sm text-amber-700 mb-3">{allocationResult.message}</p>
              {allocationResult.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">Suggestions:</p>
                  <ul className="space-y-1">
                    {allocationResult.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-amber-700">→ {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setAllocationResult(null)}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Projects Grid */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Your Projects</h2>
        {pageLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg mb-1">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                assignment={assignments[project._id]}
                onAssign={handleAssign}
                isAllocating={allocating === project._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;