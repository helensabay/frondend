import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Tag,
  TrendingDown,
  Ruler,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AddItemModal = ({ open, onOpenChange, onAddItem }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm();

  const nameInputRef = useRef(null);

  const categories = [
    'Grains',
    'Meat',
    'Vegetables',
    'Dairy',
    'Condiments',
    'Baking',
    'Fruits',
  ];

  const units = [
    'kg',
    'g',
    'lbs',
    'oz',
    'liters',
    'ml',
    'pieces',
    'boxes',
    'cans',
    'bottles',
    'bags',
    'cups',
  ];

  // Auto-focus on name input when modal opens
  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const onSubmit = (data) => {
    onAddItem(data);
    reset();
    onOpenChange(false);
    toast.success(`${data.name} has been added to inventory`);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Inventory Item
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new inventory item. Required fields are
            marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>Basic Information</span>
            </div>
            <div className="space-y-4 pl-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Item Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    ref={nameInputRef}
                    {...register('name', { required: 'Item name is required' })}
                    placeholder="e.g., Rice"
                    className={cn(errors.name && 'border-destructive')}
                  />
                  {errors.name && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.name.message}</span>
                    </div>
                  )}
                  {!errors.name && (
                    <p className="text-xs text-muted-foreground">
                      Enter a descriptive name for the item
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps organize your inventory
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stock Management Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              <span>Stock Management</span>
            </div>
            <div className="space-y-4 pl-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="currentStock"
                    className="flex items-center gap-1"
                  >
                    Current Stock <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="currentStock"
                    type="number"
                    step="0.01"
                    {...register('currentStock', {
                      required: 'Current stock is required',
                      min: { value: 0, message: 'Stock cannot be negative' },
                    })}
                    placeholder="0"
                    className={cn(errors.currentStock && 'border-destructive')}
                  />
                  {errors.currentStock && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.currentStock.message}</span>
                    </div>
                  )}
                  {!errors.currentStock && (
                    <p className="text-xs text-muted-foreground">
                      Current quantity in stock
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="minThreshold"
                    className="flex items-center gap-1"
                  >
                    Min Threshold <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="minThreshold"
                    type="number"
                    step="0.01"
                    {...register('minThreshold', {
                      required: 'Minimum threshold is required',
                      min: {
                        value: 0,
                        message: 'Threshold cannot be negative',
                      },
                    })}
                    placeholder="0"
                    className={cn(errors.minThreshold && 'border-destructive')}
                  />
                  {errors.minThreshold && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.minThreshold.message}</span>
                    </div>
                  )}
                  {!errors.minThreshold && (
                    <p className="text-xs text-muted-foreground">
                      Alert when stock falls below this
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Ruler className="h-4 w-4" />
              <span>Additional Details</span>
            </div>
            <div className="space-y-4 pl-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unit of measurement
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="flex items-center gap-2">
                    Supplier
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="supplier"
                      {...register('supplier')}
                      placeholder="e.g., Global Foods"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your supplier's name
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Package className="h-4 w-4" />
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;
