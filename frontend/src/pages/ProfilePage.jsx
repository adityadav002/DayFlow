import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, uploadAvatar } from '../api/authApi';
import { updateUserLocally } from '../redux/slices/authSlice';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Camera, MapPin, Mail, Phone, Globe, Link, Calendar, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const fileInputRef = useRef(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    location: user?.location || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    linkedin: user?.linkedin || '',
    github: user?.github || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await updateProfile(formData);
      dispatch(updateUserLocally(response.data.data));
      toast.success('Profile updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const data = new FormData();
    data.append('avatar', file);

    setIsUploading(true);
    const toastId = toast.loading('Uploading photo...');
    try {
      const response = await uploadAvatar(data);
      dispatch(updateUserLocally({ avatar: response.data.data.avatar }));
      toast.success('Profile photo updated', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo', { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-full flex-col bg-surface-50 overflow-auto custom-scrollbar">
      {/* Header Area */}
      <div className="w-full bg-surface-900 border-b border-surface-800 shrink-0">
        <div className="mx-auto w-full max-w-5xl px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            
            {/* Avatar block */}
            <div className="relative group shrink-0 self-start md:self-center">
              <div className="rounded-full border-4 border-surface-900 shadow-sm ring-1 ring-surface-700 overflow-hidden bg-surface-800">
                <Avatar user={user} size="2xl" className="h-28 w-28 text-4xl" />
              </div>

              {/* Hover overlay for changing avatar */}
              <div
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white m-1"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Change</span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
              />
            </div>

            {/* Identity Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] md:text-3xl font-medium text-white tracking-tight leading-tight truncate">
                {user.name}
              </h1>
              {(user.jobTitle || user.department || user.location) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-surface-400">
                  {user.jobTitle && (
                    <span className="text-[15px] font-medium text-surface-200">{user.jobTitle}</span>
                  )}
                  {user.department && (
                    <span className="text-[14px] flex items-center">
                      <span className="w-1 h-1 rounded-full bg-surface-600 mr-2" />
                      {user.department}
                    </span>
                  )}
                  {user.location && (
                    <span className="text-[14px] flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-surface-500" />
                      {user.location}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="shrink-0 pt-2 md:pt-0">
              <Button
                className="w-full md:w-auto"
                onClick={() => {
                  setFormData({
                    name: user.name || '',
                    jobTitle: user.jobTitle || '',
                    department: user.department || '',
                    location: user.location || '',
                    bio: user.bio || '',
                    phone: user.phone || '',
                    linkedin: user.linkedin || '',
                    github: user.github || ''
                  });
                  setIsEditModalOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-5xl px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Column - About & Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="card bg-surface-900 border-surface-800">
              <div className="p-5">
                <h2 className="text-[16px] font-bold text-white mb-3">About</h2>
                {user.bio ? (
                  <p className="text-[14px] text-surface-300 leading-relaxed whitespace-pre-wrap">
                    {user.bio}
                  </p>
                ) : (
                  <div className="rounded-[12px] bg-surface-800 p-5 text-center border border-dashed border-surface-700">
                    <p className="text-surface-400 text-[13px]">No professional bio added yet.</p>
                    <Button variant="secondary" size="sm" className="mt-3 text-[13px] h-8 bg-surface-700 text-white hover:bg-surface-600 border-surface-600" onClick={() => setIsEditModalOpen(true)}>
                      Add Bio
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="card bg-surface-900 border-surface-800">
              <div className="p-5">
                <h2 className="text-[16px] font-bold text-white mb-4">Professional Information</h2>
                <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                  <div>
                    <p className="text-surface-500 mb-1 font-medium text-[11px] uppercase tracking-wider">Role</p>
                    <p className="text-white font-medium text-[14px]">{user.jobTitle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-surface-500 mb-1 font-medium text-[11px] uppercase tracking-wider">Department</p>
                    <p className="text-white font-medium text-[14px]">{user.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-surface-500 mb-1 font-medium text-[11px] uppercase tracking-wider">Joined</p>
                    <p className="text-white font-medium text-[14px]">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Details */}
          <div className="space-y-4">
            <div className="card bg-surface-900 border-surface-800">
              <div className="p-5">
                <h2 className="text-[12px] font-bold text-surface-500 uppercase tracking-wider mb-4 border-b border-surface-800 pb-2">Contact Details</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="h-[16px] w-[16px] text-[#B8A58C] mt-0.5 mr-3 shrink-0" strokeWidth={2} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-surface-500 font-medium">Email</p>
                      <p className="text-[13px] font-medium text-white truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-start">
                      <Phone className="h-[16px] w-[16px] text-[#B8A58C] mt-0.5 mr-3 shrink-0" strokeWidth={2} />
                      <div>
                        <p className="text-[11px] text-surface-500 font-medium">Phone</p>
                        <p className="text-[13px] font-medium text-white mt-0.5">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-start">
                      <MapPin className="h-[16px] w-[16px] text-[#B8A58C] mt-0.5 mr-3 shrink-0" strokeWidth={2} />
                      <div>
                        <p className="text-[11px] text-surface-500 font-medium">Location</p>
                        <p className="text-[13px] font-medium text-white mt-0.5">{user.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(user.linkedin || user.github) && (
              <div className="card bg-surface-900 border-surface-800">
                <div className="p-5">
                  <h2 className="text-[12px] font-bold text-surface-500 uppercase tracking-wider mb-4 border-b border-surface-800 pb-2">Professional Links</h2>
                  <div className="space-y-3">
                    {user.linkedin && (
                      <div className="flex items-center">
                        <Link className="h-[16px] w-[16px] text-[#B8A58C] mr-3 shrink-0" />
                        <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-primary-400 hover:text-primary-300 hover:underline truncate">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {user.github && (
                      <div className="flex items-center">
                        <Globe className="h-[16px] w-[16px] text-[#B8A58C] mr-3 shrink-0" />
                        <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-primary-400 hover:text-primary-300 hover:underline truncate">
                          GitHub Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => !isSubmitting && setIsEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">Professional Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white resize-none"
                placeholder="A short summary of your professional background..."
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-900 mb-1.5">GitHub URL</label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
                className="w-full rounded-md border border-surface-200 px-3 py-2 text-[14px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors bg-surface-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-5 border-t border-surface-200 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
