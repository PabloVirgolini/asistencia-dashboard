import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, FileText, User, Check, ChevronsUpDown, Pencil } from 'lucide-react';
import { useAdminNovedades } from '../../hooks/useAdminNovedades';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function AdminNovedades() {
  const { 
    novedades, personalActivo, isLoading, 
    isModalOpen, setIsModalOpen, 
    editingId, setEditingId,
    handleAdd, handleRemove, handleEditClick
  } = useAdminNovedades();

  const [filterText, setFilterText] = useState('');

  const [formData, setFormData] = useState({
    legajo: '',
    tipo: 'Vacaciones',
    fecha_inicio: '',
    fecha_fin: '',
    observaciones: ''
  });
  const [customTipo, setCustomTipo] = useState('');
  const [openCombobox, setOpenCombobox] = useState(false);

  useEffect(() => {
    if (editingId) {
      const novedadToEdit = novedades.find(n => n.id_novedad === editingId);
      if (novedadToEdit) {
        const isCustomTipo = !['Vacaciones', 'Enfermedad', 'Maternidad/Paternidad', 'Licencia Especial'].includes(novedadToEdit.tipo);
        
        setFormData({
          legajo: novedadToEdit.legajo,
          tipo: isCustomTipo ? 'Otro' : novedadToEdit.tipo,
          fecha_inicio: novedadToEdit.fecha_inicio,
          fecha_fin: novedadToEdit.fecha_fin,
          observaciones: novedadToEdit.observaciones || ''
        });
        
        if (isCustomTipo) {
          setCustomTipo(novedadToEdit.tipo);
        }
      }
    } else {
      setFormData({
        legajo: '',
        tipo: 'Vacaciones',
        fecha_inicio: '',
        fecha_fin: '',
        observaciones: ''
      });
      setCustomTipo('');
    }
  }, [editingId, novedades, isModalOpen]);

  const filteredNovedades = novedades.filter(n => 
    n.nombre_empleado?.toLowerCase().includes(filterText.toLowerCase()) ||
    n.tipo.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.legajo) {
      toast.error('Debe seleccionar un empleado');
      return;
    }
    const finalData = {
      ...formData,
      tipo: formData.tipo === 'Otro' ? customTipo : formData.tipo
    };
    handleAdd(finalData);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Novedades y Licencias</h2>
          <p className="text-slate-500">Registra ausencias prolongadas para excluirlas del planificador de turnos.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={18} />
          Nueva Novedad
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-slate-800">Historial de Novedades</CardTitle>
          <input
            type="text"
            placeholder="Buscar por empleado o tipo..."
            className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:ring-indigo-500"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Empleado</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Inicio</th>
                    <th className="px-4 py-3">Fin</th>
                    <th className="px-4 py-3">Observaciones</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNovedades.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No hay novedades registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredNovedades.map((n) => (
                      <tr key={n.id_novedad} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {n.nombre_empleado} <span className="text-slate-400 font-normal text-xs ml-1">({n.legajo})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            n.tipo === 'Vacaciones' ? 'bg-amber-100 text-amber-800' : 
                            n.tipo === 'Enfermedad' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {n.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3">{n.fecha_inicio}</td>
                        <td className="px-4 py-3">{n.fecha_fin}</td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{n.observaciones || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEditClick(n)}
                              className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => handleRemove(n.id_novedad)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Alta/Edición Novedad */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                {editingId ? 'Actualizar Novedad' : 'Registrar Novedad'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User size={14} /> Empleado
                </label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between font-normal text-slate-700 border-slate-200"
                    >
                      {formData.legajo
                        ? (() => {
                            const p = personalActivo.find((p) => p.legajo === formData.legajo);
                            return p ? `${p.nombre} (${p.legajo})` : "Seleccione empleado...";
                          })()
                        : "Seleccione empleado..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o legajo..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                        <CommandGroup>
                          {personalActivo.map((p) => (
                            <CommandItem
                              key={p.legajo}
                              value={`${p.nombre} ${p.legajo}`}
                              onSelect={() => {
                                setFormData({ ...formData, legajo: p.legajo });
                                setOpenCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.legajo === p.legajo ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.nombre} ({p.legajo})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tipo de Novedad</label>
                <select
                  required
                  value={formData.tipo}
                  onChange={e => {
                    setFormData({...formData, tipo: e.target.value});
                    if (e.target.value !== 'Otro') setCustomTipo('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Enfermedad">Enfermedad</option>
                  <option value="Maternidad/Paternidad">Maternidad/Paternidad</option>
                  <option value="Licencia Especial">Licencia Especial</option>
                  <option value="Otro">Otro (Especifique)</option>
                </select>
                
                {formData.tipo === 'Otro' && (
                  <input
                    type="text"
                    required
                    placeholder="Escriba el tipo de novedad..."
                    value={customTipo}
                    onChange={e => setCustomTipo(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none animate-in fade-in slide-in-from-top-1"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Desde</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_inicio}
                    onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hasta (Inclusive)</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_fin}
                    min={formData.fecha_inicio}
                    onChange={e => setFormData({...formData, fecha_fin: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <FileText size={14} /> Observaciones (Opcional)
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={e => setFormData({...formData, observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {editingId ? 'Guardar Cambios' : 'Guardar Novedad'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
