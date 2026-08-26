import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Phone, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  ShieldCheck
} from 'lucide-react';
import { EmergencyContact } from '../types';

interface ContactsManagerViewProps {
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
}

export const ContactsManagerView: React.FC<ContactsManagerViewProps> = ({
  contacts,
  onUpdateContacts
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [testSentPhone, setTestSentPhone] = useState<string | null>(null);

  const [formData, setFormData] = useState<EmergencyContact>({
    name: '',
    relationship: 'Spouse',
    phone: '+91',
    priority: 'PRIMARY',
    notifyOnConfirmation: true
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormData({
      name: '',
      relationship: 'Family Member',
      phone: '+91',
      priority: contacts.some(c => c.priority === 'PRIMARY') ? 'SECONDARY' : 'PRIMARY',
      notifyOnConfirmation: true
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (idx: number) => {
    setEditingIndex(idx);
    setFormData(contacts[idx]);
    setShowAddModal(true);
  };

  const handleDelete = (idx: number) => {
    const next = contacts.filter((_, i) => i !== idx);
    onUpdateContacts(next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    let next: EmergencyContact[];
    if (editingIndex !== null) {
      next = [...contacts];
      next[editingIndex] = formData;
    } else {
      next = [...contacts, formData];
    }
    onUpdateContacts(next);
    setShowAddModal(false);
  };

  const handleTestSMS = (phone: string, name: string) => {
    setTestSentPhone(phone);
    setTimeout(() => {
      setTestSentPhone(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Emergency Contacts Directory</h1>
          <p className="text-sm text-slate-500">
            Designated emergency recipients automatically notified via SMS & Voice in the escalation pipeline.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Escalation Sequence Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block font-semibold mb-0.5">Automated Escalation Protocol</strong>
          When an accident is confirmed, the system immediately dispatches SMS coordinates to your <strong>PRIMARY</strong> contact. If unacknowledged within 60 seconds, it escalates to <strong>SECONDARY</strong> and emergency responders.
        </div>
      </div>

      {/* Contacts List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  contact.priority === 'PRIMARY'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {contact.priority} CONTACT
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{contact.name}</h2>
                <p className="text-xs text-slate-500">{contact.relationship}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(idx)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">{contact.phone}</span>
              <span className="text-[11px] text-emerald-700 font-medium">SMS + Call</span>
            </div>

            {testSentPhone === contact.phone ? (
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Test dispatch sent successfully! (Demo Mode)
              </div>
            ) : (
              <button
                onClick={() => handleTestSMS(contact.phone, contact.name)}
                className="w-full py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3 h-3 text-slate-500" />
                Test Notification Alert
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              {editingIndex !== null ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-hidden bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Physician">Personal Doctor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-hidden bg-white"
                  >
                    <option value="PRIMARY">PRIMARY (1st)</option>
                    <option value="SECONDARY">SECONDARY (2nd)</option>
                    <option value="TERTIARY">TERTIARY (3rd)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number (with Country Code)</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-hidden font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
