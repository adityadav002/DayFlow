import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, uploadAvatar } from '../api/authApi';
import { updateUserLocally, logoutUser } from '../redux/slices/authSlice';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Camera, MapPin, Mail, Phone, Globe, Link as LinkIcon, Edit2, Briefcase, User as UserIcon, CalendarDays, ExternalLink, CheckCircle2, Building, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const fileInputRef = useRef(null);
  
  const handleLogout = async () => {
    await dispatch(logoutUser());
    window.location.href = '/login';
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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

  const calculateProfileCompletion = () => {
    if (!user) return 0;
    const fields = ['name', 'email', 'jobTitle', 'department', 'location', 'bio', 'phone', 'avatar'];
    let filled = 0;
    fields.forEach(field => {
      if (user[field]) filled++;
    });
    // Add links as 1 combined field if any exists
    if (user.linkedin || user.github) filled++;
    
    const totalFields = fields.length + 1; // 9 fields
    return Math.round((filled / totalFields) * 100);
  };

  if (!user) return null;

  const completionPercentage = calculateProfileCompletion();

  return (
    <div className="flex h-full flex-col bg-[#F7F8F6] overflow-auto custom-scrollbar">
      {/* Max Width Container */}
      <div className="w-full max-w-[1280px] mx-auto pb-12">
        
        {/* Profile Hero */}
        <div className="relative mt-0 md:mt-8 mx-0 md:mx-8 rounded-none md:rounded-2xl overflow-hidden bg-[#18243A] shadow-lg">
          {/* Subtle Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[100px] -right-[50px] w-[300px] h-[300px] bg-[#397D68] opacity-10 rounded-full blur-[80px]"></div>
            <div className="absolute top-[50px] -left-[100px] w-[200px] h-[200px] bg-[#397D68] opacity-10 rounded-full blur-[60px]"></div>
            {/* Subtle Abstract Lines */}
            <svg className="absolute w-full h-full opacity-5" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <path d="M0,50 Q250,150 500,50 T1000,50" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <path d="M0,150 Q250,50 500,150 T1000,150" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="relative z-10 px-6 lg:px-10 py-10 md:py-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 min-h-[220px]">
            
            {/* Identity Group */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left w-full md:w-auto mt-6 md:mt-0">
              
              {/* Avatar Box (Overlapping slightly) */}
              <div className="relative group shrink-0 md:translate-y-[20px]">
                <div className="rounded-full border-4 border-[#F7F8F6] shadow-md bg-white overflow-hidden w-28 h-28 md:w-32 md:h-32 transition-transform duration-300 group-hover:scale-[1.02]">
                  <Avatar user={user} size="2xl" className="w-full h-full text-4xl" />
                </div>

                {/* Hover overlay for changing avatar */}
                <div
                  className="absolute inset-0 rounded-full border-4 border-transparent bg-[#18243A]/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white backdrop-blur-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 mb-1" />
                      <span className="text-[11px] font-medium tracking-wide">Change</span>
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
              <div className="flex-1 pb-2">
                <h1 className="text-[32px] md:text-[38px] font-bold text-white tracking-tight leading-tight">
                  {user.name}
                </h1>
                {(user.jobTitle || user.department || user.location) && (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-2 mt-2">
                    {user.jobTitle && (
                      <span className="text-[16px] md:text-[18px] font-medium text-white/90">{user.jobTitle}</span>
                    )}
                    {(user.jobTitle && (user.department || user.location)) && (
                      <span className="text-white/30 hidden md:inline">•</span>
                    )}
                    {user.department && (
                      <span className="text-[14px] md:text-[15px] text-[#B8A58C] font-medium bg-[#B8A58C]/10 px-2.5 py-0.5 rounded-full border border-[#B8A58C]/20">
                        {user.department}
                      </span>
                    )}
                    {user.location && (
                      <span className="text-[14px] md:text-[15px] text-white/70 flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-[#397D68]" />
                        {user.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 w-full md:w-auto md:pb-2 flex flex-col md:flex-row gap-3">
              <Button
                className="w-full md:w-auto bg-[#397D68] hover:bg-[#2d6352] text-white border-none shadow-md hover:shadow-lg transition-all duration-200"
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
              <Button
                variant="secondary"
                className="w-full md:w-auto bg-white/10 hover:bg-red-500/20 text-white border border-white/20 hover:border-red-500/30 hover:text-red-400 transition-all duration-200 backdrop-blur-sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="px-6 lg:px-10 py-10 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              
              {/* About Section */}
              <div className="bg-white rounded-2xl border border-[#E1E6E2] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-5">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F2EE] flex items-center justify-center mr-3">
                      <UserIcon className="h-4 w-4 text-[#397D68]" />
                    </div>
                    <h2 className="text-[20px] font-semibold text-[#18243A]">About</h2>
                  </div>
                  <div className="w-12 h-0.5 bg-[#E1E6E2] mb-5"></div>
                  
                  {user.bio ? (
                    <p className="text-[15px] text-[#667085] leading-relaxed whitespace-pre-wrap">
                      {user.bio}
                    </p>
                  ) : (
                    <div className="rounded-xl bg-[#F7F8F6] p-6 text-center border border-dashed border-[#E1E6E2]">
                      <p className="text-[#8A929A] text-[14px] mb-3">No introduction added yet.</p>
                      <Button variant="secondary" size="sm" className="bg-white text-[#397D68] border-[#E1E6E2] hover:border-[#397D68] hover:bg-[#E8F2EE] transition-colors" onClick={() => setIsEditModalOpen(true)}>
                        Add Introduction
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white rounded-2xl border border-[#E1E6E2] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-5">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F2EE] flex items-center justify-center mr-3">
                      <Briefcase className="h-4 w-4 text-[#397D68]" />
                    </div>
                    <h2 className="text-[20px] font-semibold text-[#18243A]">Professional Information</h2>
                  </div>
                  <div className="w-12 h-0.5 bg-[#E1E6E2] mb-6"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8">
                    <div>
                      <p className="text-[#8A929A] mb-1.5 font-medium text-[12px] uppercase tracking-wider flex items-center">
                        <Briefcase className="h-3.5 w-3.5 mr-1.5 text-[#B8A58C]" /> Role
                      </p>
                      <p className="text-[#18243A] font-medium text-[15px]">{user.jobTitle || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#8A929A] mb-1.5 font-medium text-[12px] uppercase tracking-wider flex items-center">
                        <Building className="h-3.5 w-3.5 mr-1.5 text-[#B8A58C]" /> Department
                      </p>
                      <p className="text-[#18243A] font-medium text-[15px]">{user.department || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#8A929A] mb-1.5 font-medium text-[12px] uppercase tracking-wider flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-[#B8A58C]" /> Joined
                      </p>
                      <p className="text-[#18243A] font-medium text-[15px]">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#8A929A] mb-1.5 font-medium text-[12px] uppercase tracking-wider flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-[#B8A58C]" /> Location
                      </p>
                      <p className="text-[#18243A] font-medium text-[15px]">{user.location || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6 lg:space-y-8">
              
              {/* Contact Details */}
              <div className="bg-white rounded-2xl border border-[#E1E6E2] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-6">
                  <h2 className="text-[14px] font-bold text-[#18243A] mb-5 border-b border-[#E1E6E2] pb-3 flex items-center">
                    Contact Details
                  </h2>
                  <div className="space-y-5">
                    <div className="flex items-start group">
                      <div className="w-8 h-8 rounded-full bg-[#F3EEE7] flex items-center justify-center mr-4 shrink-0 transition-colors group-hover:bg-[#B8A58C]">
                        <Mail className="h-4 w-4 text-[#B8A58C] transition-colors group-hover:text-white" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[12px] text-[#8A929A] font-medium uppercase tracking-wide">Email</p>
                        <a href={`mailto:${user.email}`} className="text-[14px] font-medium text-[#18243A] truncate mt-0.5 hover:text-[#397D68] transition-colors block">
                          {user.email}
                        </a>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-start group">
                        <div className="w-8 h-8 rounded-full bg-[#F3EEE7] flex items-center justify-center mr-4 shrink-0 transition-colors group-hover:bg-[#B8A58C]">
                          <Phone className="h-4 w-4 text-[#B8A58C] transition-colors group-hover:text-white" strokeWidth={2} />
                        </div>
                        <div className="pt-0.5">
                          <p className="text-[12px] text-[#8A929A] font-medium uppercase tracking-wide">Phone</p>
                          <a href={`tel:${user.phone}`} className="text-[14px] font-medium text-[#18243A] mt-0.5 hover:text-[#397D68] transition-colors block">
                            {user.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-white rounded-2xl border border-[#E1E6E2] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[14px] font-bold text-[#18243A] flex items-center">
                      Profile Completion
                    </h2>
                    <span className={`text-[14px] font-bold ${completionPercentage === 100 ? 'text-[#397D68]' : 'text-[#18243A]'}`}>
                      {completionPercentage}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-[#F7F8F6] rounded-full h-2.5 mb-4 overflow-hidden">
                    <div 
                      className="bg-[#397D68] h-2.5 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>

                  {completionPercentage < 100 ? (
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-[13px] font-medium text-[#397D68] hover:text-[#2d6352] flex items-center transition-colors"
                    >
                      Complete your profile <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </button>
                  ) : (
                    <p className="text-[13px] font-medium text-[#8A929A] flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-[#397D68] mr-1.5" /> All set!
                    </p>
                  )}
                </div>
              </div>

              {/* Professional Links */}
              {(user.linkedin || user.github) && (
                <div className="bg-white rounded-2xl border border-[#E1E6E2] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-[14px] font-bold text-[#18243A] mb-5 border-b border-[#E1E6E2] pb-3 flex items-center">
                      Professional Links
                    </h2>
                    <div className="space-y-4">
                      {user.linkedin && (
                        <div className="flex items-center group">
                          <div className="w-8 h-8 rounded-full bg-[#E8F2EE] flex items-center justify-center mr-3 shrink-0 transition-colors group-hover:bg-[#397D68]">
                            <LinkIcon className="h-4 w-4 text-[#397D68] transition-colors group-hover:text-white" />
                          </div>
                          <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[#18243A] hover:text-[#397D68] truncate transition-colors">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      {user.github && (
                        <div className="flex items-center group">
                          <div className="w-8 h-8 rounded-full bg-[#E8F2EE] flex items-center justify-center mr-3 shrink-0 transition-colors group-hover:bg-[#397D68]">
                            <Globe className="h-4 w-4 text-[#397D68] transition-colors group-hover:text-white" />
                          </div>
                          <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[#18243A] hover:text-[#397D68] truncate transition-colors">
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
      </div>

      {/* Edit Profile Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => !isSubmitting && setIsEditModalOpen(false)} 
        title="Edit Professional Profile"
      >
        <div className="px-1 text-[#667085] text-[14px] mb-5">
          Update your professional information and contact details.
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-5 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-2.5 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-2.5 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-2.5 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-2.5 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-2.5 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">Professional Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-3 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white resize-none outline-none"
                placeholder="A short summary of your professional background..."
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-2.5 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#18243A] mb-1.5 uppercase tracking-wide">GitHub URL</label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-[#E1E6E2] px-4 py-2.5 text-[14px] text-[#18243A] focus:border-[#397D68] focus:ring-1 focus:ring-[#397D68] transition-colors bg-[#F7F8F6] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-[#E1E6E2] mt-6">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsEditModalOpen(false)} 
              disabled={isSubmitting}
              className="bg-white text-[#667085] border-[#E1E6E2] hover:bg-[#F7F8F6] hover:text-[#18243A]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-[#397D68] hover:bg-[#2d6352] text-white border-none shadow-sm hover:shadow"
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
