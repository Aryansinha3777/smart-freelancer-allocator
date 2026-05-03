import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  createFreelancerProfile,
  getMyFreelancerProfile,
  updateFreelancerProfile,
} from "../api/freelancerApi.js";
import { getMyAssignments } from "../api/allocationApi.js";
import ScheduleTimeline from "../components/ScheduleTimeline.jsx";

const SKILLS = ["Frontend", "Backend", "Design", "Mobile", "DevOps", "Data Science", "QA"];

const FreelancerDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const [formData, setFormData] = useState({
    skills: [],
    dailyCapacity: 6,
    isAvailable: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchAssignments();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await getMyFreelancerProfile();
      setProfile(data);
      setFormData({
        skills: data.skills,
        dailyCapacity: data.dailyCapacity,
        isAvailable: data.isAvailable,
      });
    } catch (_) {
      // No profile yet
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data } = await getMyAssignments();
      setAssignments(data);
    } catch (_) {}
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (formData.skills.length === 0) {
      setFormError("Select at least one skill");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      if (profile) {
        const { data } = await updateFreelancerProfile(formData);
        setProfile(data);
      } else {
        const { data } = await createFreelancerProfile(formData);
        setProfile(data);
      }
      setShowProfileForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setFormLoading(false);
    }
  };

  const workloadPercent = profile
    ? Math.round((profile.currentLoad / profile.dailyCapacity) * 100)
    : 0;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your workload and active assignments
          </p>
        </div>
        <button
          onClick={() => { setShowProfileForm(!showProfileForm); setFormError(""); }}
          className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          {showProfileForm ? "Cancel" : profile ? "Edit Profile" : "Setup Profile"}
        </button>
      </div>

      {/* No profile yet */}
      {!profile && !showProfileForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-center">
          <p className="font-medium text-amber-800 mb-1">Profile not set up</p>
          <p className="text-sm text-amber-700 mb-3">
            You need a freelancer profile before projects can be assigned to you.
          </p>
          <button
            onClick={() => setShowProfileForm(true)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
          >
            Setup Profile
          </button>
        </div>
      )}

      {/* Profile Form */}
      {showProfileForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            {profile ? "Update Profile" : "Create Profile"}
          </h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {formError}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      formData.skills.includes(skill)
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-600 border-gray-200 hover:border-slate-400"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Daily Capacity (hours/day)
              </label>
              <input
                type="number"
                value={formData.dailyCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, dailyCapacity: Number(e.target.value) })
                }
                min={1}
                max={12}
                className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) =>
                  setFormData({ ...formData, isAvailable: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isAvailable" className="text-sm text-slate-700">
                Available for new projects
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {formLoading ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                onClick={() => setShowProfileForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Stats */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-1">Daily Capacity</p>
            <p className="text-3xl font-semibold text-slate-800">{profile.dailyCapacity}h</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-1">Current Load</p>
            <p className="text-3xl font-semibold text-orange-500">{profile.currentLoad}h</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-1">Remaining</p>
            <p className="text-3xl font-semibold text-green-600">{profile.remainingHours}h</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-1">Active Projects</p>
            <p className="text-3xl font-semibold text-blue-600">{assignments.length}</p>
          </div>
        </div>
      )}

      {/* Workload Bar */}
      {profile && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-slate-700">Workload</p>
            <p className="text-sm text-slate-500">{workloadPercent}% utilized</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                workloadPercent >= 90
                  ? "bg-red-500"
                  : workloadPercent >= 60
                  ? "bg-orange-400"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(workloadPercent, 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.skills.map((skill) => (
              <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Assignments */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Active Assignments</h2>
        {assignments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg mb-1">No active assignments</p>
            <p className="text-sm">Projects assigned to you will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-slate-800">
                      {assignment.projectId?.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {assignment.projectId?.requiredSkill}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    assignment.projectId?.priority === "urgent"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {assignment.projectId?.priority}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Assigned Hours</p>
                    <p className="text-sm font-medium text-slate-700">
                      {assignment.assignedHours}h
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Deadline</p>
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(assignment.projectId?.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <ScheduleTimeline
                  schedule={assignment.schedule}
                  estimatedCompletionDate={assignment.estimatedCompletionDate}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerDashboard;