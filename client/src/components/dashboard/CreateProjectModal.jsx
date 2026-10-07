import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Check, ExternalLink, Rocket } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';
import { projectService } from '../../services/projectService';
import api from '../../services/api';
import GitHubRepoPicker from '../projects/GitHubRepoPicker';
import VercelProjectPicker from '../projects/VercelProjectPicker';
import { CATEGORIES } from '../../utils/categories';

const CreateProjectModal = ({ open, onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('development');
  const [deploymentTarget, setDeploymentTarget] = useState('vercel');
  const [category, setCategory] = useState('web_app');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedVercelProject, setSelectedVercelProject] = useState(null);
  const [deployAfterSave, setDeployAfterSave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdProject, setCreatedProject] = useState(null);

  const reset = () => {
    setStep(1);
    setName('');
    setDescription('');
    setEnvironment('development');
    setDeploymentTarget('vercel');
    setCategory('web_app');
    setSelectedRepo(null);
    setSelectedVercelProject(null);
    setDeployAfterSave(false);
    setError('');
    setCreatedProject(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        name,
        description,
        environment,
        deploymentTarget,
        category,
      };

      if (selectedRepo) {
        payload.githubRepo = selectedRepo.fullName;
        payload.githubRepoId = selectedRepo.id;
        payload.githubDefaultBranch = selectedRepo.defaultBranch;
        payload.githubLanguage = selectedRepo.language || '';
        payload.githubStars = selectedRepo.stars || 0;
        payload.githubIsPrivate = selectedRepo.isPrivate || false;
      }

      if (selectedVercelProject) {
        payload.vercelProjectId = selectedVercelProject.id;
        payload.vercelProjectName = selectedVercelProject.name;
        payload.vercelUrl = selectedVercelProject.url || '';
        payload.vercelFramework = selectedVercelProject.framework || '';
      }

      const res = await projectService.create(payload);
      const newProject = res.data;
      setCreatedProject(newProject);

      // Notify parent — updates the list
      onCreated(newProject);

      // If user wants to auto-deploy AND has a GitHub repo
      if (deployAfterSave && selectedRepo) {
        // Open Vercel Deploy Button in new tab — no framework param (auto-detect)
        const params = new URLSearchParams({
          'repository-url': `https://github.com/${selectedRepo.fullName}`,
          'project-name': name,
        });
        window.open(`https://vercel.com/new/clone?${params.toString()}`, '_blank', 'noopener');
      }

      toast.success('Project created');
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create project';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">New Project</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Step {step} of 3 ·{' '}
                      {step === 1 ? 'Basic info' : step === 2 ? 'GitHub repo' : 'Vercel + Deploy'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="px-6 pt-4 flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full flex-1 transition-colors ${
                      s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Body */}
              <div className="p-6">
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Project name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="my-startup-api"
                        maxLength={100}
                        autoFocus
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short description"
                        maxLength={500}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.emoji} {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Environment
                        </label>
                        <select
                          value={environment}
                          onChange={(e) => setEnvironment(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="development">Development</option>
                          <option value="staging">Staging</option>
                          <option value="production">Production</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Deploy target
                        </label>
                        <select
                          value={deploymentTarget}
                          onChange={(e) => setDeploymentTarget(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="vercel">Vercel</option>
                          <option value="aws_apprunner">AWS App Runner</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <FaGithub size={16} className="text-indigo-600" />
                      <p className="text-xs text-indigo-900">
                        Select a repository to link. Optional.
                      </p>
                    </div>

                    <GitHubRepoPicker selectedRepo={selectedRepo} onSelect={setSelectedRepo} />

                    {selectedRepo && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-xs text-emerald-900 font-medium">
                          {selectedRepo.fullName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <span className="text-indigo-600 font-bold text-sm">▲</span>
                        <p className="text-xs text-indigo-900">
                          If you already have a Vercel project, link it here. Otherwise skip — you can deploy below.
                        </p>
                      </div>

                      <VercelProjectPicker
                        selectedProject={selectedVercelProject}
                        onSelect={setSelectedVercelProject}
                      />

                      {selectedVercelProject && (
                        <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-xs text-emerald-900 font-medium">
                            {selectedVercelProject.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Deploy option — only if GitHub repo selected */}
                    {selectedRepo && (
                      <label className="flex items-start gap-3 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deployAfterSave}
                          onChange={(e) => setDeployAfterSave(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Rocket size={14} className="text-indigo-600" />
                            <p className="text-sm font-bold text-gray-900">
                              Deploy to Vercel after saving
                            </p>
                          </div>
                          <p className="text-xs text-gray-600">
                            Opens Vercel in a new tab. Connect your account there and Vercel
                            will build this repo. DeploySarthi starts monitoring once it's ready.
                          </p>
                        </div>
                      </label>
                    )}

                    {/* Info if no repo */}
                    {!selectedRepo && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <p className="text-xs text-amber-800">
                          To deploy, go back and select a GitHub repository first.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 p-6 border-t border-gray-100">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {step === 1 && (
                    <button
                      onClick={handleNext}
                      className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg
                        hover:bg-indigo-700 transition-colors"
                    >
                      Next
                    </button>
                  )}

                  {step === 2 && (
                    <>
                      <button
                        onClick={handleNext}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200
                          rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleNext}
                        className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg
                          hover:bg-indigo-700 transition-colors"
                      >
                        Next
                      </button>
                    </>
                  )}

                  {step === 3 && (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg
                        hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Creating...' : (
                        <>
                          {deployAfterSave && <Rocket size={14} />}
                          {deployAfterSave ? 'Create + Deploy' : 'Create Project'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateProjectModal;