// src/pages/MenuManagement.jsx
import React, { useMemo, useState } from 'react';
import useMenuManagement, {
  useMenuCategories,
} from '@/hooks/useMenuManagement';
import AddItemDialog from '@/components/menu/AddItemDialog';
import AddCategoryDialog from '@/components/menu/AddCategoryDialog';
import AddComboMealDialog from '@/components/menu/AddComboMealDialog';
import EditItemDialog from '@/components/menu/EditItemDialog';
import CategoryTabs from '@/components/menu/CategoryTabs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlusCircle, Menu as MenuIcon } from 'lucide-react';
import FeaturePanelCard from '@/components/shared/FeaturePanelCard';

const MenuManagement = () => {
  const {
    items,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem: archiveMenuItem,
    uploadItemImage,
    refetch: refetchActive,
  } = useMenuManagement({});
  const {
    items: archivedItems,
    loading: archivedLoading,
    restoreMenuItem: restoreArchivedItem,
    refetch: refetchArchived,
  } = useMenuManagement({ archived: true });
  const { categories: categoryRows, refetch: refetchCategories } =
    useMenuCategories();
  const categories = useMemo(
    () => (categoryRows || []).map((c) => c.name),
    [categoryRows]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    imageUrl: '',
    imageFile: null,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);

  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.category) {
        toast.error('Please fill in all required fields');
        return;
      }
      const payload = {
        name: newItem.name,
        description: newItem.description,
        price: Number(newItem.price) || 0,
        category: newItem.category,
        available: Boolean(newItem.available),
        ingredients: [],
        preparationTime: 0,
      };
      const created = await createMenuItem(payload);
      if (newItem.imageFile && created?.id) {
        await uploadItemImage(created.id, newItem.imageFile);
      }
      setNewItem({
        name: '',
        description: '',
        price: 0,
        category: '',
        available: true,
        imageUrl: '',
        imageFile: null,
      });
      setDialogOpen(false);
    } catch (e) {
      toast.error(e?.message || 'Failed to add menu item');
    }
  };

  const handleEditItem = async () => {
    try {
      if (!editingItem) return;
      const updates = {
        name: editingItem.name,
        description: editingItem.description,
        price: Number(editingItem.price) || 0,
        category: editingItem.category,
        available: Boolean(editingItem.available),
      };
      await updateMenuItem(editingItem.id, updates);
      if (editingItem.imageFile) {
        await uploadItemImage(editingItem.id, editingItem.imageFile);
      }
      setEditingItem(null);
    } catch (e) {
      toast.error(e?.message || 'Failed to update menu item');
    }
  };

  const handleArchiveItem = async (id) => {
    try {
      await archiveMenuItem(id);
      refetchArchived();
      refetchActive();
    } catch (e) {
      toast.error(e?.message || 'Failed to archive menu item');
    }
  };

  const handleRestoreItem = async (item) => {
    try {
      await restoreArchivedItem(item.id);
      refetchArchived();
      refetchActive();
      toast.success(`${item.name} has been restored to the active menu.`);
    } catch (e) {
      toast.error(e?.message || 'Failed to restore menu item');
    }
  };

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setComboDialogOpen(true)}
      >
        <PlusCircle className="h-4 w-4" />
        Add Combo Meal
      </Button>
      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        newItem={newItem}
        setNewItem={setNewItem}
        onAdd={handleAddItem}
        categories={categories}
        onAddCategory={() => setCategoryDialogOpen(true)}
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <FeaturePanelCard
        title="Menu Management"
        titleStyle="accent"
        titleIcon={MenuIcon}
        headerActions={actionButtons}
        contentClassName="space-y-6"
      >
        <CategoryTabs
          items={(items || []).map((it) => ({
            ...it,
            imageUrl: it.image || it.imageUrl || '',
          }))}
          categories={categories}
          onEdit={(it) =>
            setEditingItem({
              ...it,
              imageUrl: it.image || it.imageUrl || '',
            })
          }
          onArchive={handleArchiveItem}
          archivedItems={(archivedItems || []).map((it) => ({
            ...it,
            imageUrl: it.image || it.imageUrl || '',
          }))}
          archivedLoading={archivedLoading}
          onRestore={handleRestoreItem}
        />
      </FeaturePanelCard>

      <EditItemDialog
        item={editingItem}
        setItem={setEditingItem}
        onSave={handleEditItem}
        onClose={() => setEditingItem(null)}
      />

      <AddCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onConfirm={(catName) => {
          setNewItem((prev) => ({ ...prev, category: catName }));
          setCategoryDialogOpen(false);
          // Refresh categories list to include the newly added category
          refetchCategories();
          // Keep AddItemDialog open if it was already open
          if (!dialogOpen) {
            setDialogOpen(true);
          }
        }}
      />

      <AddComboMealDialog
        open={comboDialogOpen}
        onOpenChange={setComboDialogOpen}
        items={items}
        onCreate={async (payload) => {
          try {
            await createMenuItem(payload);
          } catch (e) {
            toast.error(e?.message || 'Failed to create combo meal');
          }
        }}
      />
    </div>
  );
};

export default MenuManagement;
