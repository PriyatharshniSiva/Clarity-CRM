import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Wrench,
  Plus,
  Save,
  Rocket,
  History,
  Eye,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Sliders,
  Lock,
  GitBranch,
  X,
  FileCode
} from 'lucide-react';
import UniversalDynamicRenderer from '../../../components/common/UniversalDynamicRenderer';

const ENTITY_OPTIONS = [
  { value: 'INTERN_PROFILE', label: 'Intern Profile Form' },
  { value: 'EMPLOYEE_PROFILE', label: 'Employee Profile Form' },
  { value: 'TEAM_LEADER_PROFILE', label: 'Team Leader Profile Form' },
  { value: 'ADMIN_PROFILE', label: 'Admin Profile Form' },
  { value: 'PROJECT', label: 'Project Entity Form' },
  { value: 'TASK', label: 'Task Entity Form' },
  { value: 'ATTENDANCE', label: 'Attendance Log Form' },
  { value: 'LEAVE', label: 'Leave Request Form' },
  { value: 'HELPDESK', label: 'Helpdesk Ticket Form' },
  { value: 'ASSET', label: 'Asset Management Form' }
];

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Single Line Text' },
  { value: 'TEXTAREA', label: 'Multi-Line Text Area' },
  { value: 'EMAIL', label: 'Email Address' },
  { value: 'PHONE', label: 'Phone Number' },
  { value: 'NUMBER', label: 'Numeric Input' },
  { value: 'DATE', label: 'Date Picker' },
  { value: 'TIME', label: 'Time Picker' },
  { value: 'DATETIME', label: 'Date & Time Picker' },
  { value: 'DROPDOWN', label: 'Single Select Dropdown' },
  { value: 'MULTISELECT', label: 'Multi Select List' },
  { value: 'CHECKBOX', label: 'Checkbox Toggle' },
  { value: 'RADIO', label: 'Radio Option Buttons' },
  { value: 'FILE', label: 'File Upload' },
  { value: 'IMAGE', label: 'Image Attachment' },
  { value: 'URL', label: 'Website / Profile URL' },
  { value: 'PASSWORD', label: 'Encrypted Password' },
  { value: 'COLOR', label: 'Color Picker' },
  { value: 'RATING', label: 'Star Rating' },
  { value: 'SWITCH', label: 'Toggle Switch' }
];

const ROLE_OPTIONS = ['ALL', 'INTERN', 'EMPLOYEE', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'];

export const UniversalFormBuilder = () => {
  const [selectedEntity, setSelectedEntity] = useState('INTERN_PROFILE');
  const [schemaData, setSchemaData] = useState({ version: 1, status: 'DRAFT', fields: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Modals & Panels State
  const [editingField, setEditingField] = useState(null); // Field inspector modal
  const [inspectorTab, setInspectorTab] = useState('general'); // general | roles | validation | logic
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFormData, setPreviewFormData] = useState({});
  const [previewRole, setPreviewRole] = useState('INTERN');
  const [impactData, setImpactData] = useState(null); // Impact Analysis modal
  const [historyData, setHistoryData] = useState(null); // Version history modal

  useEffect(() => {
    fetchFormSchema(selectedEntity);
  }, [selectedEntity]);

  const fetchFormSchema = async (entityType) => {
    try {
      setLoading(true);
      const res = await api.get(`/super-admin/platform-builder/forms/schema/${entityType}?status=DRAFT`);
      setSchemaData(res.data);
    } catch (err) {
      console.error('Fetch schema error:', err);
      setMessage({ type: 'error', text: 'Failed to load form schema.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    const newKey = `custom_field_${Date.now()}`;
    const newField = {
      fieldKey: newKey,
      label: 'New Custom Field',
      placeholder: 'Enter text...',
      fieldType: 'TEXT',
      options: ['Option 1', 'Option 2'],
      visibleTo: ['ALL'],
      editableBy: ['ALL'],
      requiredFor: [],
      isSystemDefault: false,
      order: schemaData.fields.length + 1
    };
    setSchemaData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setEditingField(newField);
    setInspectorTab('general');
  };

  const handleSaveFieldProperties = (updatedField) => {
    setSchemaData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.fieldKey === updatedField.fieldKey ? updatedField : f)
    }));
    setEditingField(null);
  };

  const handleDeleteField = (fieldKey) => {
    setSchemaData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.fieldKey !== fieldKey)
    }));
  };

  const handleMoveField = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= schemaData.fields.length) return;

    const newFields = [...schemaData.fields];
    const temp = newFields[index];
    newFields[index] = newFields[targetIdx];
    newFields[targetIdx] = temp;

    // Update order values
    newFields.forEach((f, idx) => { f.order = idx + 1; });

    setSchemaData(prev => ({ ...prev, fields: newFields }));
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const res = await api.post(`/super-admin/platform-builder/forms/schema/${selectedEntity}/draft`, {
        fields: schemaData.fields
      });

      setSchemaData(res.data);
      setMessage({ type: 'success', text: 'Working DRAFT form schema saved successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Save draft error:', err);
      setMessage({ type: 'error', text: 'Failed to save DRAFT schema.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFetchImpact = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/super-admin/platform-builder/forms/schema/${selectedEntity}/impact`);
      setImpactData(res.data);
    } catch (err) {
      console.error('Impact analysis error:', err);
      setMessage({ type: 'error', text: 'Failed to generate impact analysis.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSchema = async () => {
    try {
      setSaving(true);
      const res = await api.post(`/super-admin/platform-builder/forms/schema/${selectedEntity}/publish`, {});
      setImpactData(null);
      setMessage({ type: 'success', text: `Successfully Published Version ${res.data.version} for ${selectedEntity}!` });
      fetchFormSchema(selectedEntity);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Publish schema error:', err);
      setMessage({ type: 'error', text: 'Failed to publish schema.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/super-admin/platform-builder/forms/schema/${selectedEntity}/history`);
      setHistoryData(res.data);
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionId) => {
    try {
      setSaving(true);
      const res = await api.post(`/super-admin/platform-builder/forms/schema/${selectedEntity}/rollback/${versionId}`, {});
      setHistoryData(null);
      setMessage({ type: 'success', text: `Rolled back to snapshot version. Active Version is now ${res.data.version}!` });
      fetchFormSchema(selectedEntity);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Rollback error:', err);
      setMessage({ type: 'error', text: 'Failed to rollback schema.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Entity Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-foreground">Universal Dynamic Form Builder</h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure custom fields, dynamic validation rules, role permissions, and conditional visibility without code changes.
          </p>
        </div>

        {/* Entity Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Target Entity:</label>
          <select
            value={selectedEntity}
            onChange={e => setSelectedEntity(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {ENTITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Notifications */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
          message.type === 'success' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-danger/10 border-danger/30 text-danger'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Form Status Bar & Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Working Draft V{schemaData.version}
          </span>
          <span className="text-xs text-muted-foreground">
            {schemaData.fields.length} Fields Configured
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddField}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Field</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 text-primary" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            <Eye className="h-4 w-4 text-blue-500" />
            <span>Live Preview</span>
          </button>

          <button
            onClick={handleFetchImpact}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Rocket className="h-4 w-4" />
            <span>Publish Schema</span>
          </button>

          <button
            onClick={handleFetchHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            <History className="h-4 w-4 text-purple-500" />
            <span>Version History</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields Canvas */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-xs text-muted-foreground">Loading form schema canvas...</p>
        </div>
      ) : schemaData.fields.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card">
          <FileCode className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No Form Fields Configured</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Click "Add Field" above to start building custom form fields for {selectedEntity}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schemaData.fields.map((field, index) => (
            <div
              key={field.fieldKey}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-center gap-4">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveField(index, 'up')}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={index === schemaData.fields.length - 1}
                    onClick={() => handleMoveField(index, 'down')}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{field.label}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-muted text-muted-foreground">
                      {field.fieldKey}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                      {field.fieldType}
                    </span>
                    {field.isSystemDefault && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        System Default
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {field.placeholder && <span>Placeholder: "{field.placeholder}"</span>}
                    {field.requiredFor && field.requiredFor.length > 0 && (
                      <span className="text-danger font-medium">Required for: {field.requiredFor.join(', ')}</span>
                    )}
                    {field.dependsOnField && (
                      <span className="text-blue-500 font-medium">
                        Logic: {field.dependsOnField} {field.dependsOnOperator} "{field.dependsOnValue}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingField(field);
                    setInspectorTab('general');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5 text-primary" />
                  <span>Configure</span>
                </button>
                {!field.isSystemDefault && (
                  <button
                    onClick={() => handleDeleteField(field.fieldKey)}
                    className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Field Inspector Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                <span>Field Properties Inspector</span>
              </h2>
              <button onClick={() => setEditingField(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-border text-xs font-medium">
              <button
                onClick={() => setInspectorTab('general')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  inspectorTab === 'general' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground'
                }`}
              >
                General Settings
              </button>
              <button
                onClick={() => setInspectorTab('roles')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  inspectorTab === 'roles' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground'
                }`}
              >
                Role Permissions
              </button>
              <button
                onClick={() => setInspectorTab('validation')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  inspectorTab === 'validation' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground'
                }`}
              >
                Dynamic Validation
              </button>
              <button
                onClick={() => setInspectorTab('logic')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  inspectorTab === 'logic' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground'
                }`}
              >
                Conditional Visibility
              </button>
            </div>

            {/* Tab 1: General Settings */}
            {inspectorTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase">Field Label</label>
                  <input
                    type="text"
                    value={editingField.label || ''}
                    onChange={e => setEditingField({ ...editingField, label: e.target.value })}
                    className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase">Field Unique Key</label>
                    <input
                      type="text"
                      disabled={editingField.isSystemDefault}
                      value={editingField.fieldKey || ''}
                      onChange={e => setEditingField({ ...editingField, fieldKey: e.target.value })}
                      className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase">Field Type (19 Enum Options)</label>
                    <select
                      value={editingField.fieldType || 'TEXT'}
                      onChange={e => setEditingField({ ...editingField, fieldType: e.target.value })}
                      className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      {FIELD_TYPES.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase">Placeholder Text</label>
                  <input
                    type="text"
                    value={editingField.placeholder || ''}
                    onChange={e => setEditingField({ ...editingField, placeholder: e.target.value })}
                    className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {['DROPDOWN', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(editingField.fieldType) && (
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase">Dropdown / Choice Options (Comma Separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingField.options) ? editingField.options.join(', ') : (editingField.options || '')}
                      onChange={e => setEditingField({ ...editingField, options: e.target.value.split(',').map(s => s.trim()) })}
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Role Permissions */}
            {inspectorTab === 'roles' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase">Visible To Roles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ROLE_OPTIONS.map(r => {
                      const active = (editingField.visibleTo || ['ALL']).includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const cur = editingField.visibleTo || ['ALL'];
                            const next = active ? cur.filter(x => x !== r) : [...cur, r];
                            setEditingField({ ...editingField, visibleTo: next.length ? next : ['ALL'] });
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            active ? 'bg-primary text-white border-primary' : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase">Editable By Roles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ROLE_OPTIONS.map(r => {
                      const active = (editingField.editableBy || ['ALL']).includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const cur = editingField.editableBy || ['ALL'];
                            const next = active ? cur.filter(x => x !== r) : [...cur, r];
                            setEditingField({ ...editingField, editableBy: next.length ? next : ['ALL'] });
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            active ? 'bg-secondary text-white border-secondary' : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase">Required For Roles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ROLE_OPTIONS.map(r => {
                      const active = (editingField.requiredFor || []).includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const cur = editingField.requiredFor || [];
                            const next = active ? cur.filter(x => x !== r) : [...cur, r];
                            setEditingField({ ...editingField, requiredFor: next });
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            active ? 'bg-danger text-white border-danger' : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Dynamic Validation Rules */}
            {inspectorTab === 'validation' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase">Min Character Length</label>
                    <input
                      type="number"
                      value={editingField.minLength || ''}
                      onChange={e => setEditingField({ ...editingField, minLength: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase">Max Character Length</label>
                    <input
                      type="number"
                      value={editingField.maxLength || ''}
                      onChange={e => setEditingField({ ...editingField, maxLength: e.target.value })}
                      placeholder="e.g. 200"
                      className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase">Regex Validation Pattern</label>
                  <input
                    type="text"
                    value={editingField.regexPattern || ''}
                    onChange={e => setEditingField({ ...editingField, regexPattern: e.target.value })}
                    placeholder="e.g. https://github.com/.*"
                    className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingField.isUnique}
                      onChange={e => setEditingField({ ...editingField, isUnique: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Must be Unique</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingField.isReadOnly}
                      onChange={e => setEditingField({ ...editingField, isReadOnly: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Read Only</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingField.isDisabled}
                      onChange={e => setEditingField({ ...editingField, isDisabled: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Disabled</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab 4: Conditional Visibility */}
            {inspectorTab === 'logic' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Display this field dynamically based on another field's user input value.
                </p>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase">Depends On Field</label>
                  <select
                    value={editingField.dependsOnField || ''}
                    onChange={e => setEditingField({ ...editingField, dependsOnField: e.target.value })}
                    className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">-- No Dependency --</option>
                    {schemaData.fields.filter(f => f.fieldKey !== editingField.fieldKey).map(f => (
                      <option key={f.fieldKey} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                    ))}
                  </select>
                </div>

                {editingField.dependsOnField && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase">Condition Operator</label>
                      <select
                        value={editingField.dependsOnOperator || 'EQUALS'}
                        onChange={e => setEditingField({ ...editingField, dependsOnOperator: e.target.value })}
                        className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="EQUALS">Equals (==)</option>
                        <option value="NOT_EQUALS">Not Equals (!=)</option>
                        <option value="CONTAINS">Contains</option>
                        <option value="IS_NOT_EMPTY">Is Not Empty</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase">Target Value</label>
                      <input
                        type="text"
                        value={editingField.dependsOnValue || ''}
                        onChange={e => setEditingField({ ...editingField, dependsOnValue: e.target.value })}
                        placeholder="e.g. Intern"
                        className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveFieldProperties(editingField)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-bold text-foreground">Interactive Live Form Preview</h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={previewRole}
                  onChange={e => setPreviewRole(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-background text-foreground"
                >
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>Simulate Role: {r}</option>)}
                </select>
                <button onClick={() => setIsPreviewOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <UniversalDynamicRenderer
              fields={schemaData.fields}
              formData={previewFormData}
              onChange={(key, val) => setPreviewFormData(prev => ({ ...prev, [key]: val }))}
              userRole={previewRole}
            />

            <div className="border-t border-border pt-3 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Publish Impact Analysis Modal */}
      {impactData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
              <ShieldAlert className="h-6 w-6" />
              <h2 className="text-lg font-bold text-foreground">Pre-Publish Impact Analysis</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="text-muted-foreground">Entity Target:</span>
                  <p className="font-bold text-foreground">{impactData.entityType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Target Version:</span>
                  <p className="font-bold text-foreground">Version {impactData.draftVersion}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fields Added:</span>
                  <p className="font-bold text-primary">+{impactData.addedFields.length} New</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fields Removed:</span>
                  <p className="font-bold text-danger">-{impactData.removedFields.length} Removed</p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-foreground uppercase tracking-wider">Affected Platform Modules:</span>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {impactData.affectedModules.map((mod, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
                <span className="font-semibold">Estimated Affected Active Users:</span> {impactData.estimatedUsersCount} Users
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                onClick={() => setImpactData(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishSchema}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                <Rocket className="h-4 w-4" />
                <span>{saving ? 'Publishing...' : 'Confirm & Publish Schema'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History & Rollback Modal */}
      {historyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                <h3 className="text-base font-bold text-foreground">Version Snapshots & Rollback</h3>
              </div>
              <button onClick={() => setHistoryData(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {historyData.versions.map(ver => (
                <div key={ver.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">Version {ver.version}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        ver.status === 'PUBLISHED' ? 'bg-primary/10 text-primary border-primary/20' :
                        ver.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {ver.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ver.fields.length} Fields Configured • Created by {ver.createdBy?.name || 'Super Admin'}
                    </p>
                  </div>

                  {ver.status === 'ARCHIVED' && (
                    <button
                      onClick={() => handleRollback(ver.id)}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-white hover:bg-secondary/90"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Rollback Here</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <button
                onClick={() => setHistoryData(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalFormBuilder;
