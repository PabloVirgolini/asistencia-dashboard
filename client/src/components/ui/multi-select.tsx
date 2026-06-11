import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectProps {
  options: { label: string; value: string }[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectedValuesChange,
  placeholder = 'Seleccionar...',
  emptyText = 'No hay opciones',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectedValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectedValuesChange([...selectedValues, value]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectedValuesChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white h-10 border-slate-200"
        >
          <div className="flex gap-1 items-center overflow-hidden mr-2">
            {selectedValues.length === 0 && <span className="text-slate-500 font-normal truncate">{placeholder}</span>}
            {selectedValues.length > 0 && selectedValues.length <= 2 && (
              <div className="flex gap-1">
                {selectedValues.map((val) => {
                  const option = options.find((o) => o.value === val);
                  return (
                    <Badge key={val} variant="secondary" className="font-normal px-1.5 h-5 truncate max-w-[120px]">
                      {option?.label || val}
                    </Badge>
                  );
                })}
              </div>
            )}
            {selectedValues.length > 2 && (
              <Badge variant="secondary" className="font-normal px-1.5 h-5">
                {selectedValues.length} seleccionados
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedValues.length > 0 && (
              <X 
                className="h-3.5 w-3.5 opacity-50 hover:opacity-100 cursor-pointer" 
                onClick={clearSelection} 
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-1">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-slate-500 text-center">{emptyText}</div>
          ) : (
            options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-900",
                    isSelected ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                      isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </span>
                  <span className="truncate">{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
