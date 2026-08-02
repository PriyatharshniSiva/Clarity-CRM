import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  ListTree,
  Plus,
  Save,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'];

export const NestedMenuBuilder = () => {
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingMenu, setEditingMenu] = useState(null);

  useEffect(() => {
    fetchMenus(selectedRole);
  }, [selectedRole]);

  const fetchMenus = async (role) => {
    try {
      setLoading(true);
      const res = await api.get(`/super-admin/platform-builder/menus/${role}`);
      setMenus(res.data);
    } catch (err) {
      console.error('Fetch menus error:', err);
      setMessage({ type: 'error', text: 'Failed to load menu hierarchy.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = () => {
    const newItem = {
      menuKey: `custom_menu_${Date.now()}`,
      label: 'New Navigation Item',
      icon: 'FolderKanban',
      route: '/custom-route',
      badge: '',
      permission: '',
      isVisible: true,
      order: menus.length + 1,
      parentId: null
    };
    setMenus(prev => [...prev, newItem]);
    setEditingMenu(newItem);
  };

  const handleSaveMenuItem = (updatedItem) => {
    setMenus(prev => prev.map(m => m.menuKey === updatedItem.menuKey ? updatedItem : m));
    setEditingMenu(null);
  };

  const handleDeleteMenuItem = (menuKey) => {
    setMenus(prev => prev.filter(m => m.menuKey !== menuKey));
  };

  const handleToggleVisibility = (menuKey) => {
    setMenus(prev => prev.map(m => m.menuKey === menuKey ? { ...m, isVisible: !m.isVisible } : m));
  };

  const handleMoveMenu = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= menus.length) return;

    const newMenus = [...menus];
    const temp = newMenus[index];
    newMenus[index] = newMenus[targetIdx];
    newMenus[targetIdx] = temp;

    newMenus.forEach((m, idx) => { m.order = idx + 1; });
    setMenus(newMenus);
  };

  const handleSaveMenuHierarchy = async () => {
    try {
      setSaving(true);
      const res = await api.post(`/super-admin/platform-builder/menus/${selectedRole}`, {
        menus
      });

      setMenus(res.data);
      setMessage({ type: 'success', text: `Menu configuration for ${selectedRole} updated successfully!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Save menu error:', err);
      setMessage({ type: 'error', text: 'Failed to save menu hierarchy.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <ListTree className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-foreground">Dynamic Nested Menu Builder</h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure, reorder, show/hide, rename sidebar navigation menus per role with route paths and badges.
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Target Role:</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm focus:border-primary focus:outline-none"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
          message.type === 'success' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-danger/10 border-danger/30 text-danger'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <span className="text-xs font-medium text-muted-foreground">
          {menus.length} Navigation Menu Items for Role '{selectedRole}'
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddMenuItem}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Menu Item</span>
          </button>

          <button
            onClick={handleSaveMenuHierarchy}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Menu Config'}</span>
          </button>
        </div>
      </div>

      {/* Menu Tree List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-xs text-muted-foreground">Loading menu items...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((item, index) => (
            <div
              key={item.menuKey}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                item.isVisible ? 'bg-card border-border' : 'bg-muted/20 border-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveMenu(index, 'up')}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={index === menus.length - 1}
                    onClick={() => handleMoveMenu(index, 'down')}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{item.label}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-muted text-muted-foreground">
                      {item.route}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">
                        Badge: {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Icon: <span className="font-mono text-foreground">{item.icon || 'Folder'}</span> • Key: <span className="font-mono">{item.menuKey}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleVisibility(item.menuKey)}
                  className={`p-2 rounded-lg border transition-colors ${
                    item.isVisible ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                  }`}
                  title={item.isVisible ? 'Visible in Navigation' : 'Hidden from Navigation'}
                >
                  {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => setEditingMenu(item)}
                  className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg bg-background hover:bg-muted"
                >
                  <Edit2 className="h-4 w-4 text-primary" />
                </button>

                <button
                  onClick={() => handleDeleteMenuItem(item.menuKey)}
                  className="p-2 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Menu Modal */}
      {editingMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Edit Navigation Menu Properties</h3>
              <button onClick={() => setEditingMenu(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase">Menu Label</label>
                <input
                  type="text"
                  value={editingMenu.label || ''}
                  onChange={e => setEditingMenu({ ...editingMenu, label: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase">Route Path</label>
                <input
                  type="text"
                  value={editingMenu.route || ''}
                  onChange={e => setEditingMenu({ ...editingMenu, route: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase">Lucide Icon Name</label>
                <input
                  type="text"
                  value={editingMenu.icon || ''}
                  onChange={e => setEditingMenu({ ...editingMenu, icon: e.target.value })}
                  placeholder="e.g. FolderKanban, CheckSquare, Clock"
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase">Badge Text (Optional)</label>
                <input
                  type="text"
                  value={editingMenu.badge || ''}
                  onChange={e => setEditingMenu({ ...editingMenu, badge: e.target.value })}
                  placeholder="e.g. New, Beta, 5"
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={() => setEditingMenu(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveMenuItem(editingMenu)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NestedMenuBuilder;
