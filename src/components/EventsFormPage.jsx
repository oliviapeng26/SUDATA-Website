import { useState, useEffect } from 'react';

const convertISOToFormats = (dateStr, timeStr) => {
  if (!dateStr) return { date: '', time: '' };
  
  try {
    const date = new Date(dateStr);
    
    const dateFormatter = new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Australia/Sydney'
    });
    
    const parts = dateFormatter.formatToParts(date);
    const partMap = {};
    parts.forEach(({ type, value }) => {
      partMap[type] = value;
    });
    
    const dateForInput = `${partMap.year}-${partMap.month}-${partMap.day}`;
    const timeForInput = formatTimeForInput(timeStr);
    
    return { date: dateForInput, time: timeForInput };
  } catch (e) {
    console.error('Date conversion error:', e);
    return { date: '', time: '' };
  }
};

const formatTimeForInput = (timeStr) => {
  if (!timeStr) return '';

  const raw = String(timeStr);
  if (/^\d{1,2}:\d{2}/.test(raw)) {
    const [hour, minute] = raw.split(':');
    return `${hour.padStart(2, '0')}:${minute.slice(0, 2)}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const partMap = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${partMap.hour}:${partMap.minute}`;
};

export default function EventForm({  onSuccess,initialData, }) {
    const [formData, setFormData] = useState(initialData ||{
        title: '',
        date: '',
        time: '',
        endTime: '',
        venue: '',
        type: 'academic',
        signupLink: '',
        catering: '',
        collaborators: [],
        description: ''
    });

    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(initialData?.image || null);

    const addOneHour = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return '';
        const total = (h * 60 + m + 60) % (24 * 60);
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    };

    // Update form when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            const { date: formattedDate, time: formattedTime } = convertISOToFormats(initialData.date, initialData.timeInput || initialData.time);
            setFormData({
                ...initialData,
                date: formattedDate,
                time: formattedTime,
                endTime: formatTimeForInput(initialData.endTimeInput || initialData.endTime)
            });
            setImagePreview(initialData?.image || null);
        } else {
            setFormData({
                title: '',
                date: '',
                time: '',
                endTime: '',
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
        setError('');
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            // Default end time to one hour after start when start is set and end is empty
            if (name === 'time' && value && !prev.endTime) {
                next.endTime = addOneHour(value);
            }
            return next;
        });
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

        if (formData.endTime && formData.time && formData.endTime <= formData.time) {
            setError('End time must be after the start time.');
            return;
        }
        setError('');

        const isEditing = !!initialData && !!initialData.id;
        const url = isEditing ? `/api/event?id=${initialData.id}` : '/api/event';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            collaborators: (formData.collaborators || []).map(c => c.trim()).filter(Boolean),
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setImagePreview(null);
                onSuccess(isEditing ? 'Event updated.' : 'Event created.');
            } else {
                setError('Failed to save event. Please try again.');
            }
        } catch (err) {
            setError('Network error — could not reach the server.');
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

            {/* SECTION: DATE & TIME */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
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
                    <label className="label-neon">Start Time</label>
                    <input
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="input-field"
                        required
                    />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                    <label className="label-neon">
                        End Time <span className="text-white/40 normal-case">(optional)</span>
                    </label>
                    <input
                        name="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={handleChange}
                        min={formData.time || undefined}
                        className="input-field"
                    />
                </div>
            </div>

            {/* SECTION: VENUE & TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="label-neon">
                        Venue <span className="text-white/40 normal-case">(optional)</span>
                    </label>
                    <input
                        name="venue"
                        type="text"
                        value={formData.venue}
                        onChange={handleChange}
                        placeholder="TBA"
                        className="input-field"
                    />
                </div>
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
            </div>

            {/* SECTION: LINK */}
            <div className="space-y-2">
                <label className="label-neon">
                    Link <span className="text-white/40 normal-case">(optional)</span>
                </label>
                <input
                    name="signupLink"
                    type="url"
                    value={formData.signupLink}
                    onChange={handleChange}
                    placeholder="https://forms.google.com/..."
                    className="input-field"
                />
            </div>

            {/* SECTION: CATERING & COLLABORATORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <label className="label-neon whitespace-nowrap">
                        Catering <span className="text-white/40 normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                        name="catering"
                        type="text"
                        value={formData.catering}
                        onChange={handleChange}
                        placeholder="e.g., Pizza and drinks"
                        className="input-field"
                    />
                </div>
                <div>
                    <label className="label-neon whitespace-nowrap">
                        Collaborators <span className="text-white/40 normal-case tracking-normal">(optional)</span>
                    </label>
                    <div className="space-y-2">
                        {formData.collaborators.map((collab, index) => (
                            <div key={index} className="flex items-stretch gap-2">
                                <input
                                    type="text"
                                    value={collab}
                                    onChange={(e) => {
                                        const newCollabs = [...formData.collaborators];
                                        newCollabs[index] = e.target.value;
                                        setFormData({ ...formData, collaborators: newCollabs });
                                    }}
                                    className="input-field"
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
            </div>

            {/* SECTION: DESCRIPTION */}
            <div className="space-y-2">
                <label className="label-neon">
                    Description <span className="text-white/40 normal-case">(optional)</span>
                </label>
                <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed event breakdown..."
                    className="input-field resize-none"
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
                    Save
                </button>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-md font-mono text-xs flex items-center gap-3">
                            <span className="text-lg font-bold">!</span>
                            <p className="tracking-wide">{error}</p>
                        </div>
                    </div>
                )}
            </div>
            
        </form>
        
        </div>


    );
}
