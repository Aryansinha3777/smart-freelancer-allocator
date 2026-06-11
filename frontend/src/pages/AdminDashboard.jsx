import { useState, useEffect } from "react";
import { getAllProjectsAdmin, getAllFreelancersAdmin, reassignProjectAdmin } from "../api/adminApi.js";
import { getAllAssignments,cleanupExpiredAssignments } from "../api/allocationApi.js";
import ProjectCard from "../components/ProjectCard.jsx";

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [reassignResult, setReassignResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      
      // Clean up expired assignments before fetching fresh data
      await cleanupExpiredAssignments();

      const [pRes, fRes, aRes] = await Promise.all([
        getAllProjectsAdmin(),
        getAllFreelancersAdmin(),
        getAllAssignments(),
      ]);
      setProjects(pRes.data);
      setFreelancers(fRes.data);
      setAssignments(aRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (assignmentId) => {
    setReassignResult(null);
    try {
      const { data } = await reassignProjectAdmin(assignmentId);
      if (data.success) {
        setReassignResult({ type: "success", message: "Project successfully reassigned." });
        fetchAll();
      } else {
        setReassignResult({
          type: "failure",
          message: data.message,
          suggestions: data.suggestions,
        });
      }
    } catch (err) {
      setReassignResult({ type: "failure", message: "Reassignment failed." });
    }
  };

  // Build assignment lookup map for ProjectCard
  const assignmentMap = {};
  assignments.forEach((a) => {
    if (a.projectId?._id) assignmentMap[a.projectId._id] = a;
  });

  const tabs = ["overview", "projects", "freelancers", "assignments"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Full system overview — projects, freelancers, assignments
        </p>
      </div>

      {/* Reassign Result */}
      {reassignResult && (
        <div className={`rounded-xl p-4 mb-6 border text-sm ${
          reassignResult.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          <p className="font-medium mb-1">
            {reassignResult.type === "success" ? "✓" : "⚠"} {reassignResult.message}
          </p>
          {reassignResult.suggestions?.map((s, i) => (
            <p key={i} className="text-xs">→ {s}</p>
          ))}
          <button
            onClick={() => setReassignResult(null)}
            className="mt-2 text-xs text-slate-400 hover:text-slate-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Projects", value: projects.length, color: "text-slate-800" },
          { label: "Total Freelancers", value: freelancers.length, color: "text-blue-600" },
          { label: "Active Assignments", value: assignments.filter((a) => a.status === "active").length, color: "text-green-600" },
          { label: "Pending Projects", value: projects.filter((p) => p.status === "pending").length, color: "text-yellow-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Recent Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  assignment={assignmentMap[project._id]}
                  isAdmin
                  onReassign={handleReassign}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              assignment={assignmentMap[project._id]}
              isAdmin
              onReassign={handleReassign}
            />
          ))}
        </div>
      )}

      {/* Freelancers Tab */}
      {activeTab === "freelancers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freelancers.map((f) => {
            const workloadPercent = Math.round(
              (f.currentLoad / f.dailyCapacity) * 100
            );
            return (
              <div
                key={f._id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {f.userId?.name}
                    </p>
                    <p className="text-xs text-slate-400">{f.userId?.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    f.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {f.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Capacity</p>
                    <p className="text-sm font-semibold text-slate-700">{f.dailyCapacity}h</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Load</p>
                    <p className="text-sm font-semibold text-orange-500">{f.currentLoad}h</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Free</p>
                    <p className="text-sm font-semibold text-green-600">{f.remainingHours}h</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div
                    className={`h-1.5 rounded-full ${
                      workloadPercent >= 90 ? "bg-red-500" :
                      workloadPercent >= 60 ? "bg-orange-400" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(workloadPercent, 100)}%` }}
                  />
                </div>
                
                {f.rating > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-medium text-slate-700">{f.rating}</span>
                  <span className="text-xs text-slate-400">({f.totalRatings} {f.totalRatings === 1 ? "rating" : "ratings"})</span>
                </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {f.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No assignments yet</p>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium text-slate-800">
                      {assignment.projectId?.title}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      assignment.status === "active"
                        ? "bg-green-100 text-green-700"
                        : assignment.status === "reassigned"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    <span className="text-slate-400">Freelancer: </span>
                    {assignment.freelancerId?.userId?.name}
                    <span className="text-slate-300 mx-2">·</span>
                    <span className="text-slate-400">Hours: </span>
                    {assignment.assignedHours}h
                    {assignment.estimatedCompletionDate && (
                      <>
                        <span className="text-slate-300 mx-2">·</span>
                        <span className="text-slate-400">Est. completion: </span>
                        {new Date(assignment.estimatedCompletionDate).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
                {assignment.status === "active" && (
                  <button
                    onClick={() => handleReassign(assignment._id)}
                    className="ml-4 border border-slate-300 text-slate-600 text-sm px-4 py-1.5 rounded-lg hover:bg-slate-50 flex-shrink-0"
                  >
                    Reassign
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;