import { useState, useEffect } from 'react';

const convertISOToFormats = (dateStr, timeStr) => {
  if (!dateStr) return { date: '', time: '' };
  
  try {
    const date = new Date(dateStr);
    
    // Use formatToParts to properly extract date/time in Sydney timezone
    const sydneyFormatter = new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Australia/Sydney'
    });
    
    const parts = sydneyFormatter.formatToParts(date);
    const partMap = {};
    parts.forEach(({ type, value }) => {
      partMap[type] = value;
    });
    
    const dateForInput = `${partMap.year}-${partMap.month}-${partMap.day}`;
    const timeForInput = `${partMap.hour}:${partMap.minute}`;
    
    return { date: dateForInput, time: timeForInput };
  } catch (e) {
    console.error('Date conversion error:', e);
    return { date: '', time: '' };
  }
};

export default function EventForm({  onSuccess,initialData, }) {
    const [formData, setFormData] = useState(initialData ||{
        title: '',
        date: '',
        time: '',
        venue: '',
        type: 'academic',
        signupLink: '',
        catering: '',
        collaborators: [],
        description: ''
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState(initialData?.image || null);

    // Update form when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            const { date: formattedDate, time: formattedTime } = convertISOToFormats(initialData.date, initialData.time);
            setFormData({
                ...initialData,
                date: formattedDate,
                time: formattedTime
            });
            setImagePreview(initialData?.image || null);
        } else {
            setFormData({
                title: '',
                date: '',
                time: '',
                venue: '',
                type: 'academic',
                signupLink: '',
                catering: '',
                collaborators: [],
                description: ''
            });
            setImagePreview(null);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
       
        const isEditing = !!initialData && !!initialData.id;
        const url = isEditing ? `/api/event?id=${initialData.id}` : '/api/event';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowSuccess(true);
                setFormData({
                    title: '',
                    date: '',
                    time: '',
                    venue: '',
                    type: 'academic',
                    signupLink: '',
                    catering: '',
                    collaborators: [],
                    description: ''
                }); // Clear form after submission
                setImagePreview(null);
                onSuccess();
                // setTimeout(() => {
                //     setShowSuccess(false);
                //      // Call the success callback

                //   }, 5000);
            } else {
                console.error('Failed to submit event:', response.statusText);
            }
        } catch (error) {
            console.error('Error submitting event:', error);
        }
    };

    return (
        <div >
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6 font-mono text-sm">

            {/* SECTION: TITLE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 space-y-2">
                    <label className="label-neon">Title</label>
                    <input
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., INDUSTRY NETWORKING NIGHT"
                        className="input-field"
                        required
                    />
                </div>
            </div>

            {/* SECTION: DATE, TIME, VENUE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="label-neon">Date</label>
                    <input
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="input-field"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="label-neon">Time</label>
                    <input
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="input-field"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="label-neon">Venue</label>
                    <input
                        name="venue"
                        type="text"
                        value={formData.venue}
                        onChange={handleChange}
                        placeholder="TBA"
                        className="input-field"
                        required
                    />
                </div>
            </div>

            {/* SECTION: TYPE & LINK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="label-neon">Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="input-field appearance-none cursor-pointer"
                    >
                        <option value="academic">Academic</option>
                        <option value="social">Social</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="label-neon">Link</label>
                    <input
                        name="signupLink"
                        type="text"
                        value={formData.signupLink}
                        onChange={handleChange}
                        placeholder="https://forms.google.com/..."
                        className="input-field"
                        required
                    />
                </div>
            </div>

            {/* SECTION: CATERING & COLLABORATORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="label-neon">Catering</label>
                    <input
                        name="catering"
                        type="text"
                        value={formData.catering}
                        onChange={handleChange}
                        placeholder="e.g., Pizza and drinks"
                        className="input-field"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="label-neon" required>Collaborators</label>
                    {formData.collaborators.map((collab, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={collab}
                                onChange={(e) => {
                                    const newCollabs = [...formData.collaborators];
                                    newCollabs[index] = e.target.value;
                                    setFormData({ ...formData, collaborators: newCollabs });
                                }}
                                className="input-field"
                                required
                            />
                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    const newCollabs = formData.collaborators.filter((_, i) => i !== index);
                                    setFormData({ ...formData, collaborators: newCollabs });
                                }}
                                className="px-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                                X
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, collaborators: [...formData.collaborators, ''] })}
                        className="text-[10px] text-sudata-neon border border-sudata-neon/30 px-2 py-1 hover:bg-sudata-neon/10"
                    >
                        + ADD COLLABORATOR
                    </button>
                </div>
            </div>

            {/* SECTION: DESCRIPTION */}
            <div className="space-y-2">
                <label className="label-neon">Description</label>
                <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed event breakdown..."
                    className="input-field resize-none"
                    required
                ></textarea>
            </div>

            {/* SECTION: IMAGE UPLOAD */}
            <div className="space-y-2">
                <label className="label-neon">Event Image <span className="text-white/50">(Optional)</span></label>
                <div className="border-2 border-dashed border-[#00F0FF]/30 rounded-lg p-6 text-center hover:border-[#00F0FF]/60 transition-colors">
                    {imagePreview ? (
                        <div className="space-y-4">
                            <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="max-h-48 mx-auto rounded-lg"
                            />
                            <div className="flex gap-2 justify-center">
                                <label className="px-4 py-2 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#020617] transition-all cursor-pointer text-xs">
                                    CHANGE IMAGE
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="px-4 py-2 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs"
                                >
                                    REMOVE
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="cursor-pointer space-y-3">
                            <div className="text-[#00F0FF] text-3xl">📸</div>
                            <p className="text-[#94a3b8] text-xs">
                                Click to upload an event image
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-6">
                <button type="submit" className="submit-btn group">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 5px #020617)' }}>
                        <path d="M4 12l4 4 8-8" stroke="#020617" strokeWidth="2" />
                        <path d="M2 2h20v20H2V2zm18 18V4H4v16h16z" fill="#020617" />
                    </svg>
                    Upload
                </button>

                {/* SUCCESS MESSAGE */}
                {showSuccess && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-[#00F0FF]/10 border border-[#00F0FF] text-[#00F0FF] px-4 py-2 rounded-md shadow-[0_0_15px_rgba(0,240,255,0.2)] font-mono text-xs flex items-center gap-3">
                            <span className="text-lg font-bold">✓</span>
                            <p className="tracking-widest uppercase">Event added successfully!!</p>
                        </div>
                    </div>
                )}
            </div>
            
        </form>
        
        </div>


    );
}