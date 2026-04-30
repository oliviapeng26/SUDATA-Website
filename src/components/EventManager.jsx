import { useState, useEffect } from 'react';
import EventList from './EventList';
import EventForm from './EventsFormPage';

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/event');
      const data = await res.json();
      console.log("Fetched Events:", data);
      setEvents(data);
    } catch (e) { console.error("Sync Error", e); }
  };

  const handleDelete = async (id) => {
    if (!confirm("[ WARNING ] PURGE EVENT?")) return;

    try {
      const response = await fetch(`/api/event?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(prev => prev.filter(event => event.id !== id));
      } else {
        console.error("Delete failed on server");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  const handleEditTrigger = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
    setEditFormData(true);
  };

  return (
    <div className="relative">
      {/* Header with Add Button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={() => {
            setEditingEvent(null);
            setEditFormData(false);
            setIsModalOpen(true);
          }}
          className="px-6 py-2 border border-[#00F0FF] text-[#00F0FF] font-mono text-xs hover:bg-[#00F0FF] hover:text-[#020617] transition-all"
        >
          + NEW EVENT
        </button>
      </div>

      <EventList events={events} onDelete={handleDelete} onEdit={handleEditTrigger} />

      {/* FIXED MODAL: Now outside any overflow-hidden containers */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl"
            onClick={() => {
              setIsModalOpen(false);
              setEditingEvent(null);
              setEditFormData(false);
            }}
          />

          {/* Form Content */}
          <div className="relative z-10 w-full max-w-2xl bg-[#020617] border border-[#00F0FF]/40 p-8 md:p-12 shadow-[0_0_50px_rgba(0,240,255,0.15)] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingEvent(null);
                setEditFormData(false);
              }}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#00F0FF] font-mono text-xs"
            >
              [CLOSE_X]
            </button>

            <h2 className="text-[#00F0FF] text-xl font-bold mb-8 tracking-widest uppercase">
             {editFormData === true ? 'Edit Event' : 'Add New Event'}
            </h2>

            <EventForm
              onSuccess={() => {
                setIsModalOpen(false);
                setEditingEvent(null);
                setEditFormData(false);
                fetchEvents();
              }}
              initialData={editingEvent}
            />
          </div>
        </div>
      )}
    </div>
  );
}