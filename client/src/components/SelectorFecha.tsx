import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface SelectorFechaProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function SelectorFecha({
  selectedDate,
  onDateChange,
}: SelectorFechaProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Seleccionar fecha";
    const [year, month, day] = dateStr.split("-");
    return new Date(`${year}-${month}-${day}`).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onDateChange(`${year}-${month}-${day}`);
      setIsOpen(false);
    }
  };

  const handlePreviousDay = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onDateChange(`${year}-${month}-${day}`);
    }
  };

  const handleNextDay = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onDateChange(`${year}-${month}-${day}`);
    }
  };

  const selectedDateObj = selectedDate
    ? new Date(selectedDate + "T00:00:00")
    : undefined;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousDay}
        title="Día anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-48 justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateDisplay(selectedDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDateObj}
            onSelect={handleDateSelect}
            disabled={(date) => {
              // Deshabilitar fechas futuras
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date > today;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextDay}
        title="Día siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
