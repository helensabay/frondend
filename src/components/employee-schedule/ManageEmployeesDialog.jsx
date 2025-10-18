import React, { useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users } from 'lucide-react';

const ManageEmployeesDialog = ({
  open,
  onOpenChange,
  employeeList = [],
  managedEmployee,
  setManagedEmployee = () => {},
  onUpdateEmployee,
  showTrigger = true,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const normalizedEmployee = managedEmployee || {
    id: '',
    name: '',
    position: '',
    hourlyRate: 0,
    contact: '',
    status: 'active',
  };

  useEffect(() => {
    if (!open) {
      setSelectedEmployeeId('');
      return;
    }

    if (selectedEmployeeId) return;

    if (normalizedEmployee.id) {
      setSelectedEmployeeId(String(normalizedEmployee.id));
      return;
    }

    const firstEmployee = employeeList[0];
    if (firstEmployee) {
      setSelectedEmployeeId(String(firstEmployee.id));
      setManagedEmployee({
        id: firstEmployee.id,
        name: firstEmployee.name || '',
        position: firstEmployee.position || '',
        hourlyRate:
          typeof firstEmployee.hourlyRate === 'number'
            ? firstEmployee.hourlyRate
            : Number(firstEmployee.hourlyRate || 0),
        contact: firstEmployee.contact || '',
        status: firstEmployee.status || 'active',
      });
    } else {
      setManagedEmployee({
        id: '',
        name: '',
        position: '',
        hourlyRate: 0,
        contact: '',
        status: 'active',
      });
    }
  }, [
    open,
    employeeList,
    normalizedEmployee.id,
    selectedEmployeeId,
    setManagedEmployee,
  ]);

  const handleSelectEmployee = (value) => {
    setSelectedEmployeeId(value);
    const employee = employeeList.find(
      (item) => String(item.id) === String(value)
    );
    if (employee) {
      setManagedEmployee({
        id: employee.id,
        name: employee.name || '',
        position: employee.position || '',
        hourlyRate:
          typeof employee.hourlyRate === 'number'
            ? employee.hourlyRate
            : Number(employee.hourlyRate || 0),
        contact: employee.contact || '',
        status: employee.status || 'active',
      });
    } else {
      setManagedEmployee({
        id: '',
        name: '',
        position: '',
        hourlyRate: 0,
        contact: '',
        status: 'active',
      });
    }
  };

  const handleFieldChange = (field, value) => {
    setManagedEmployee((prev) => ({
      ...(typeof prev === 'object' && prev !== null
        ? prev
        : {
            id: '',
            name: '',
            position: '',
            hourlyRate: 0,
            contact: '',
            status: 'active',
          }),
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!normalizedEmployee.id || typeof onUpdateEmployee !== 'function') {
      return;
    }
    onUpdateEmployee(normalizedEmployee);
  };

  const hasEmployees = employeeList.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Users size={16} /> Manage Employees
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information that powers schedules and attendance.
          </DialogDescription>
        </DialogHeader>
        {hasEmployees ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employee
              </Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={handleSelectEmployee}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeeList.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name} ({employee.position || 'No position'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={normalizedEmployee.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <Input
                id="position"
                value={normalizedEmployee.position}
                onChange={(e) => handleFieldChange('position', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourlyRate" className="text-right">
                Hourly Rate
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                value={
                  normalizedEmployee.hourlyRate === null ||
                  normalizedEmployee.hourlyRate === undefined
                    ? ''
                    : String(normalizedEmployee.hourlyRate)
                }
                onChange={(e) =>
                  handleFieldChange('hourlyRate', e.target.value)
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact
              </Label>
              <Input
                id="contact"
                value={normalizedEmployee.contact || ''}
                onChange={(e) => handleFieldChange('contact', e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
        ) : (
          <div className="py-6 text-sm text-muted-foreground">
            No employees available to edit. Add employee records from the admin
            panel first.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasEmployees || !normalizedEmployee.id}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageEmployeesDialog;
