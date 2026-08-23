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
    <div className="flex h-full flex-col bg-[#F6F7F5] overflow-auto custom-scrollbar">
      {/* Header Area */}
      <div className="h-48 w-full bg-[#18243A]">
        <div className="mx-auto h-full max-w-5xl px-6 lg:px-8 relative">
          <div className="absolute -bottom-16 left-6 lg:left-8 flex items-end space-x-6">
            <div className="relative group">
              <div className="rounded-full border-4 border-[#F6F7F5] bg-white shadow-md">
                <Avatar user={user} size="2xl" className="h-32 w-32 text-4xl" />
              </div>

              {/* Hover overlay for changing avatar */}
              <div
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white m-1"
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

            <div className="mb-2 pb-1 text-[#18243A]">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              {user.jobTitle && (
                <p className="text-[#68737A] font-medium mt-1">{user.jobTitle}</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 right-6 lg:right-8">
            <Button
              className="bg-[#397D68] hover:bg-[#2d6352] text-white border-transparent"
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

      {/* Main Content */}
      <div className="mx-auto w-full max-w-5xl px-6 lg:px-8 mt-24 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left Column - About & Bio */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-[#E2E6E3] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#18243A] mb-4">About</h2>
              {user.bio ? (
                <p className="text-[#18243A] leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              ) : (
                <div className="rounded-lg bg-[#F6F7F5] p-6 text-center border border-dashed border-[#E2E6E3]">
                  <p className="text-[#68737A] text-sm">No professional bio added yet.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsEditModalOpen(true)}>
                    Add Bio
                  </Button>
                </div>
              )}
            </div>

            {/* Recent Activity or Teams (Placeholder for future) */}
            <div className="rounded-xl border border-[#E2E6E3] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#18243A] mb-4">Professional Information</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-[#68737A] mb-1 font-medium text-xs uppercase tracking-wider">Role</p>
                  <p className="text-[#18243A] font-medium">{user.jobTitle || '-'}</p>
                </div>
                <div>
                  <p className="text-[#68737A] mb-1 font-medium text-xs uppercase tracking-wider">Department</p>
                  <p className="text-[#18243A] font-medium">{user.department || '-'}</p>
                </div>
                <div>
                  <p className="text-[#68737A] mb-1 font-medium text-xs uppercase tracking-wider">Joined</p>
                  <p className="text-[#18243A] font-medium">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Details */}
          <div className="space-y-6">
            <div className="rounded-xl border border-[#E2E6E3] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#18243A] uppercase tracking-wider mb-4 border-b border-[#E2E6E3] pb-2">Contact Details</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-4 w-4 text-[#B8A58C] mt-0.5 mr-3 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#68737A] font-medium">Email</p>
                    <p className="text-sm text-[#18243A] truncate">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 text-[#B8A58C] mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-[#68737A] font-medium">Phone</p>
                      <p className="text-sm text-[#18243A]">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.location && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-[#B8A58C] mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-[#68737A] font-medium">Location</p>
                      <p className="text-sm text-[#18243A]">{user.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(user.linkedin || user.github) && (
              <div className="rounded-xl border border-[#E2E6E3] bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-[#18243A] uppercase tracking-wider mb-4 border-b border-[#E2E6E3] pb-2">Links</h2>
                <div className="space-y-4">
                  {user.linkedin && (
                    <div className="flex items-center">
                      <Link className="h-4 w-4 text-[#B8A58C] mr-3 shrink-0" />
                      <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-[#397D68] hover:underline truncate">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {user.github && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-[#B8A58C] mr-3 shrink-0" />
                      <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-sm text-[#397D68] hover:underline truncate">
                        GitHub Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => !isSubmitting && setIsEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#18243A] mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18243A] mb-1">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18243A] mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18243A] mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18243A] mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#18243A] mb-1">Professional Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] resize-none"
                placeholder="A short summary of your professional background..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18243A] mb-1">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18243A] mb-1">GitHub URL</label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
                className="w-full rounded-md border border-[#E2E6E3] px-3 py-2 text-sm focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E6E3] mt-6">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()} className="bg-[#397D68] hover:bg-[#2d6352] text-white border-transparent">
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
