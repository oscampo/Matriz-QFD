import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Target, Download, Upload, Info, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

type Requirement = {
  id: string;
  text: string;
  importance: number;
};

type Characteristic = {
  id: string;
  text: string;
  direction: 'max' | 'min' | 'target';
  unit: string;
  targetValue: string;
};

type Relationship = {
  reqId: string;
  charId: string;
  value: number; // 0, 1, 3, 9
};

type CrossRelationship = {
  charId1: string;
  charId2: string;
  value: number; // 9, 3, -3, -9
};

type Competitor = {
  id: string;
  name: string;
};

type CompAssessment = {
  reqId: string;
  compId: string;
  value: number; // 1-5
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [requirements, setRequirements] = useState<Requirement[]>([
    { id: 'r1', text: 'Fácil de usar', importance: 5 },
    { id: 'r2', text: 'Duradero', importance: 4 },
    { id: 'r3', text: 'Económico', importance: 3 },
  ]);

  const [characteristics, setCharacteristics] = useState<Characteristic[]>([
    { id: 'c1', text: 'Peso', direction: 'min', unit: 'kg', targetValue: '< 2.5' },
    { id: 'c2', text: 'Resistencia material', direction: 'max', unit: 'MPa', targetValue: '> 250' },
    { id: 'c3', text: 'Costo de producción', direction: 'min', unit: 'USD', targetValue: '< 15' },
  ]);

  const [relationships, setRelationships] = useState<Relationship[]>([
    { reqId: 'r1', charId: 'c1', value: 3 },
    { reqId: 'r2', charId: 'c2', value: 9 },
    { reqId: 'r3', charId: 'c3', value: 9 },
  ]);

  const [crossRelationships, setCrossRelationships] = useState<CrossRelationship[]>([
    { charId1: 'c1', charId2: 'c2', value: -3 },
    { charId1: 'c2', charId2: 'c3', value: 9 },
  ]);

  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: 'comp1', name: 'Nuestro' },
    { id: 'comp2', name: 'Comp. A' },
  ]);

  const [assessments, setAssessments] = useState<CompAssessment[]>([
    { reqId: 'r1', compId: 'comp1', value: 4 },
    { reqId: 'r1', compId: 'comp2', value: 3 },
  ]);

  const [itemToDelete, setItemToDelete] = useState<{type: 'req' | 'char', id: string, name: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const getHeatmapColor = (value: number | null | undefined) => {
    if (!value) return 'bg-white';
    switch (value) {
      case 1: return 'bg-rose-100 text-rose-900';
      case 2: return 'bg-orange-100 text-orange-900';
      case 3: return 'bg-yellow-100 text-yellow-900';
      case 4: return 'bg-lime-100 text-lime-900';
      case 5: return 'bg-emerald-100 text-emerald-900';
      default: return 'bg-white';
    }
  };

  const addRequirement = () => {
    setRequirements([...requirements, { id: generateId(), text: 'Nuevo Requerimiento', importance: 3 }]);
  };

  const updateRequirement = (id: string, field: keyof Requirement, value: any) => {
    setRequirements(requirements.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const requestDeleteRequirement = (id: string, name: string) => {
    setItemToDelete({ type: 'req', id, name });
  };

  const addCharacteristic = () => {
    setCharacteristics([...characteristics, { id: generateId(), text: 'Nueva Característica', direction: 'max', unit: '-', targetValue: '' }]);
  };

  const updateCharacteristic = (id: string, field: keyof Characteristic, value: any) => {
    setCharacteristics(characteristics.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const requestDeleteCharacteristic = (id: string, name: string) => {
    setItemToDelete({ type: 'char', id, name });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'req') {
      setRequirements(requirements.filter(r => r.id !== itemToDelete.id));
      setRelationships(relationships.filter(r => r.reqId !== itemToDelete.id));
      setAssessments(assessments.filter(a => a.reqId !== itemToDelete.id));
    } else {
      setCharacteristics(characteristics.filter(c => c.id !== itemToDelete.id));
      setRelationships(relationships.filter(r => r.charId !== itemToDelete.id));
      setCrossRelationships(crossRelationships.filter(r => r.charId1 !== itemToDelete.id && r.charId2 !== itemToDelete.id));
    }
    setItemToDelete(null);
  };

  const toggleDirection = (id: string) => {
    setCharacteristics(characteristics.map(c => {
      if (c.id === id) {
        const nextDir = c.direction === 'max' ? 'min' : c.direction === 'min' ? 'target' : 'max';
        return { ...c, direction: nextDir };
      }
      return c;
    }));
  };

  const cycleRelationship = (reqId: string, charId: string) => {
    setRelationships(prev => {
      const existing = prev.find(r => r.reqId === reqId && r.charId === charId);
      const currentValue = existing ? existing.value : 0;
      let newValue = 0;
      if (currentValue === 0) newValue = 1;
      else if (currentValue === 1) newValue = 3;
      else if (currentValue === 3) newValue = 9;
      else newValue = 0;

      if (newValue === 0) {
        return prev.filter(r => !(r.reqId === reqId && r.charId === charId));
      }

      if (existing) {
        return prev.map(r => r.reqId === reqId && r.charId === charId ? { ...r, value: newValue } : r);
      } else {
        return [...prev, { reqId, charId, value: newValue }];
      }
    });
  };

  const cycleCrossRelationship = (charId1: string, charId2: string) => {
    setCrossRelationships(prev => {
      const [id1, id2] = charId1 < charId2 ? [charId1, charId2] : [charId2, charId1];
      const existing = prev.find(r => r.charId1 === id1 && r.charId2 === id2);
      const currentValue = existing ? existing.value : 0;
      let newValue = 0;
      if (currentValue === 0) newValue = 9;
      else if (currentValue === 9) newValue = 3;
      else if (currentValue === 3) newValue = -3;
      else if (currentValue === -3) newValue = -9;
      else newValue = 0;

      if (newValue === 0) {
        return prev.filter(r => !(r.charId1 === id1 && r.charId2 === id2));
      }

      if (existing) {
        return prev.map(r => r.charId1 === id1 && r.charId2 === id2 ? { ...r, value: newValue } : r);
      } else {
        return [...prev, { charId1: id1, charId2: id2, value: newValue }];
      }
    });
  };

  const addCompetitor = () => {
    setCompetitors([...competitors, { id: generateId(), name: 'Nuevo Comp.' }]);
  };

  const updateCompetitor = (id: string, name: string) => {
    setCompetitors(competitors.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
    setAssessments(assessments.filter(a => a.compId !== id));
  };

  const updateAssessment = (reqId: string, compId: string, value: number) => {
    setAssessments(prev => {
      const existing = prev.find(a => a.reqId === reqId && a.compId === compId);
      if (existing) {
        return prev.map(a => a.reqId === reqId && a.compId === compId ? { ...a, value } : a);
      } else {
        return [...prev, { reqId, compId, value }];
      }
    });
  };

  const getCompColor = (index: number) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return colors[index % colors.length];
  };

  const calculatedImportance = useMemo(() => {
    const abs: Record<string, number> = {};
    let totalAbs = 0;

    characteristics.forEach(c => {
      let sum = 0;
      requirements.forEach(r => {
        const rel = relationships.find(rel => rel.reqId === r.id && rel.charId === c.id);
        if (rel) {
          sum += r.importance * rel.value;
        }
      });
      abs[c.id] = sum;
      totalAbs += sum;
    });

    const rel: Record<string, number> = {};
    characteristics.forEach(c => {
      rel[c.id] = totalAbs > 0 ? abs[c.id] / totalAbs : 0;
    });

    return characteristics.reduce((acc, c) => {
      acc[c.id] = { absolute: abs[c.id], relative: rel[c.id] };
      return acc;
    }, {} as Record<string, { absolute: number, relative: number }>);
  }, [requirements, characteristics, relationships]);

  const relativeImportanceStats = useMemo(() => {
    const values = Object.values(calculatedImportance).map((v: any) => v.relative);
    if (values.length === 0) return { min: 0, max: 0, median: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return { min, max, median };
  }, [calculatedImportance]);

  const getRelativeColor = (value: number) => {
    const { min, max, median } = relativeImportanceStats;
    if (min === max) return '#FFEB84';

    const interpolate = (color1: string, color2: string, factor: number) => {
      const r1 = parseInt(color1.substring(1, 3), 16);
      const g1 = parseInt(color1.substring(3, 5), 16);
      const b1 = parseInt(color1.substring(5, 7), 16);

      const r2 = parseInt(color2.substring(1, 3), 16);
      const g2 = parseInt(color2.substring(3, 5), 16);
      const b2 = parseInt(color2.substring(5, 7), 16);

      const r = Math.round(r1 + factor * (r2 - r1));
      const g = Math.round(g1 + factor * (g2 - g1));
      const b = Math.round(b1 + factor * (b2 - b1));

      return `rgb(${r}, ${g}, ${b})`;
    };

    if (value <= median) {
      const range = median - min;
      const factor = range === 0 ? 0 : (value - min) / range;
      return interpolate('#F8696B', '#FFEB84', factor);
    } else {
      const range = max - median;
      const factor = range === 0 ? 0 : (value - median) / range;
      return interpolate('#FFEB84', '#63BE7B', factor);
    }
  };

  const exportData = () => {
    const data = { requirements, characteristics, relationships, crossRelationships, competitors, assessments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-qfd.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportImage = async () => {
    if (!matrixRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(matrixRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'matriz-qfd.png';
      a.click();
    } catch (err) {
      console.error('Error al exportar imagen:', err);
      alert('Hubo un error al exportar la imagen.');
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.requirements) setRequirements(data.requirements);
        if (data.characteristics) setCharacteristics(data.characteristics);
        if (data.relationships) setRelationships(data.relationships);
        if (data.crossRelationships) setCrossRelationships(data.crossRelationships);
        if (data.competitors) setCompetitors(data.competitors);
        if (data.assessments) setAssessments(data.assessments);
      } catch (err) {
        alert('Error al importar el archivo JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Matriz QFD</h1>
            <p className="text-slate-500">Despliegue de la Función de Calidad (Casa de la Calidad)</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 col-span-2 flex flex-wrap gap-6 items-start">
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Relaciones (QUÉ vs CÓMO)</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1"><span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">9</span> Fuerte</div>
                  <div className="flex items-center gap-1"><span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">3</span> Moderada</div>
                  <div className="flex items-center gap-1"><span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">1</span> Débil</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Techo (CÓMO vs CÓMO)</div>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-1"><span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">9</span> Fuerte Positiva</div>
                  <div className="flex items-center gap-1"><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">3</span> Positiva</div>
                  <div className="flex items-center gap-1"><span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">-3</span> Negativa</div>
                  <div className="flex items-center gap-1"><span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">-9</span> Fuerte Negativa</div>
                </div>
              </div>
            </div>
            <div className="w-px h-20 bg-slate-200 hidden md:block"></div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dirección de Mejora</div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1"><ArrowUp size={16} className="text-emerald-600" /> Maximizar</div>
                <div className="flex items-center gap-1"><ArrowDown size={16} className="text-rose-600" /> Minimizar</div>
                <div className="flex items-center gap-1"><Target size={16} className="text-blue-600" /> Objetivo</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center gap-2">
            <button onClick={addRequirement} className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium">
              <Plus size={16} /> Requerimiento (QUÉ)
            </button>
            <button onClick={addCharacteristic} className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-medium">
              <Plus size={16} /> Característica (CÓMO)
            </button>
            <button onClick={addCompetitor} className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors text-sm font-medium">
              <Plus size={16} /> Competidor
            </button>
          </div>
        </div>



        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div ref={matrixRef} className="bg-white inline-block min-w-full p-2">
              <table className="w-max border-collapse text-sm table-fixed">
                <colgroup>
                <col style={{ width: '256px', minWidth: '256px' }} />
                <col style={{ width: '80px', minWidth: '80px' }} />
                {characteristics.map(c => (
                  <col key={`col-${c.id}`} style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }} />
                ))}
                {competitors.map(comp => (
                  <col key={`col-comp-${comp.id}`} style={{ width: '96px', minWidth: '96px' }} />
                ))}
              </colgroup>
              <thead>
                {characteristics.length > 1 && (
                  <tr>
                    <th colSpan={2} className="border-b border-r border-slate-200 bg-slate-50" style={{ width: '336px', minWidth: '336px', maxWidth: '336px' }}></th>
                    <th colSpan={characteristics.length} className="bg-slate-50 relative p-0 border-b border-r border-slate-200 align-bottom" style={{ width: `${characteristics.length * 64}px`, minWidth: `${characteristics.length * 64}px`, maxWidth: `${characteristics.length * 64}px` }}>
                      <div className="w-full overflow-hidden leading-none flex justify-start">
                        <svg width={characteristics.length * 64} height={characteristics.length * 32} className="block" style={{ margin: 0 }}>
                          {Array.from({ length: characteristics.length }).map((_, i) => {
                            return Array.from({ length: characteristics.length }).map((_, j) => {
                              if (i >= j) return null;
                              
                              const char1 = characteristics[i];
                              const char2 = characteristics[j];
                              const id1 = char1.id < char2.id ? char1.id : char2.id;
                              const id2 = char1.id < char2.id ? char2.id : char1.id;
                              
                              const rel = crossRelationships.find(r => r.charId1 === id1 && r.charId2 === id2);
                              const val = rel ? rel.value : 0;
                              
                              let fillColor = "#ffffff";
                              let textColor = "#334155";
                              if (val === 9) { fillColor = "#d1fae5"; textColor = "#065f46"; }
                              if (val === 3) { fillColor = "#ecfdf5"; textColor = "#047857"; }
                              if (val === -3) { fillColor = "#fff1f2"; textColor = "#be123c"; }
                              if (val === -9) { fillColor = "#ffe4e6"; textColor = "#9f1239"; }

                              const cx = 32 + (i + j) * 32;
                              const cy_bottom = (j - i) * 32;
                              const cy = (characteristics.length * 32) - cy_bottom;

                              const points = `${cx},${cy - 32} ${cx + 32},${cy} ${cx},${cy + 32} ${cx - 32},${cy}`;

                              return (
                                <g key={`roof-${id1}-${id2}`} onClick={() => cycleCrossRelationship(id1, id2)} className="cursor-pointer hover:opacity-80 transition-opacity">
                                  <polygon points={points} fill={fillColor} stroke="#cbd5e1" strokeWidth="1" />
                                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={textColor} fontSize="13" fontWeight="bold">
                                    {val !== 0 ? val : ''}
                                  </text>
                                </g>
                              );
                            });
                          })}
                        </svg>
                      </div>
                    </th>
                    <th colSpan={competitors.length + 1} className="border-b border-slate-200 bg-slate-50"></th>
                  </tr>
                )}
                <tr>
                  <th colSpan={2} className="border-b border-r border-slate-200 p-2 bg-slate-50"></th>
                  {characteristics.map(c => (
                    <th key={`dir-${c.id}`} className="border-b border-r border-slate-200 p-1 bg-slate-50 text-center" style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                      <button onClick={() => toggleDirection(c.id)} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors" title="Cambiar dirección de mejora">
                        {c.direction === 'max' && <ArrowUp size={16} className="text-emerald-600 mx-auto" />}
                        {c.direction === 'min' && <ArrowDown size={16} className="text-rose-600 mx-auto" />}
                        {c.direction === 'target' && <Target size={16} className="text-blue-600 mx-auto" />}
                      </button>
                    </th>
                  ))}
                  <th colSpan={competitors.length} className="border-b border-r border-slate-200 p-2 bg-slate-50 text-center font-semibold text-slate-600">
                    Evaluación Competitiva (1-5)
                  </th>
                  <th className="border-b border-slate-200 p-2 bg-slate-50 text-center font-semibold text-slate-600 w-[250px]">
                    Perfil Competitivo
                  </th>
                </tr>
                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 w-64 relative p-0 h-48">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                    </svg>
                    <div className="absolute top-4 right-4 text-right font-semibold text-slate-600">
                      Requerimientos Técnicos<br />(CÓMO)
                    </div>
                    <div className="absolute bottom-4 left-4 text-left font-semibold text-slate-600">
                      Requerimientos del Cliente<br />(QUÉ)
                    </div>
                  </th>
                  <th className="border-b border-r border-slate-200 p-3 bg-slate-50 text-center w-20 font-semibold text-slate-700 align-bottom" title="Importancia (1-5)">Imp.</th>
                  {characteristics.map(c => (
                    <th key={`head-${c.id}`} className="border-b border-r border-slate-200 p-2 bg-white h-48 align-bottom group relative" style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                      <div className="flex flex-col items-center justify-end h-full w-10 mx-auto">
                        <input
                          value={c.text}
                          onChange={e => updateCharacteristic(c.id, 'text', e.target.value)}
                          className="[writing-mode:vertical-rl] rotate-180 bg-transparent text-sm font-medium focus:outline-none text-center w-full text-slate-700"
                        />
                        <button onClick={() => requestDeleteCharacteristic(c.id, c.text)} title="Eliminar CÓMO" className="mt-3 text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                  {competitors.map((comp, idx) => (
                    <th key={`comp-${comp.id}`} className="border-b border-r border-slate-200 p-2 bg-slate-50 text-center w-12 align-bottom group relative">
                      <div className="flex flex-col items-center justify-end h-full w-full mx-auto">
                        <div className="flex items-center gap-1 mb-1">
                          <div className={`w-2 h-2 ${comp.name === 'Nuestro' ? 'clip-triangle' : 'rounded-full'}`} style={{ backgroundColor: getCompColor(idx) }}></div>
                        </div>
                        <input
                          value={comp.name}
                          onChange={e => updateCompetitor(comp.id, e.target.value)}
                          className="[writing-mode:vertical-rl] rotate-180 bg-transparent text-sm font-semibold focus:outline-none text-center w-full text-slate-700"
                        />
                        <button onClick={() => deleteCompetitor(comp.id)} className="mt-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="border-b border-slate-200 bg-slate-50 w-[250px] align-bottom p-0">
                    <div className="flex flex-col h-full">
                      <div className="flex flex-wrap gap-2 p-2 text-[10px] text-slate-500 font-normal justify-center border-b border-slate-200">
                        {competitors.map((comp, idx) => (
                          <div key={comp.id} className="flex items-center gap-1">
                            <div className={`w-2 h-2 ${comp.name === 'Nuestro' ? 'clip-triangle' : 'rounded-full'}`} style={{ backgroundColor: getCompColor(idx) }}></div>
                            <span className="truncate max-w-[60px]">{comp.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex w-full flex-1">
                        {[1, 2, 3, 4, 5].map(num => (
                          <div key={`scale-${num}`} className="flex-1 flex flex-col justify-end items-center pb-2 border-r border-slate-200 last:border-r-0">
                            <span className="text-xs font-bold text-slate-500">{num}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req, index) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group h-12">
                    <td className="border-b border-r border-slate-200 p-2 bg-white">
                      <div className="flex items-center gap-2">
                        <button onClick={() => requestDeleteRequirement(req.id, req.text)} title="Eliminar QUÉ" className="text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                        <input
                          value={req.text}
                          onChange={e => updateRequirement(req.id, 'text', e.target.value)}
                          className="w-full bg-transparent focus:outline-none text-slate-700 truncate"
                          placeholder="Requerimiento..."
                        />
                      </div>
                    </td>
                    <td className="border-b border-r border-slate-200 p-2 bg-white">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={req.importance || ''}
                        onChange={e => updateRequirement(req.id, 'importance', parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent focus:outline-none text-center font-medium text-slate-700"
                      />
                    </td>
                    {characteristics.map(c => {
                      const rel = relationships.find(r => r.reqId === req.id && r.charId === c.id);
                      const val = rel ? rel.value : 0;
                      return (
                        <td
                          key={`rel-${req.id}-${c.id}`}
                          className="border-b border-r border-slate-200 p-0 text-center cursor-pointer hover:bg-blue-50 transition-colors bg-white"
                          style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}
                          onClick={() => cycleRelationship(req.id, c.id)}
                        >
                          <div className="w-full h-10 flex items-center justify-center font-bold select-none text-slate-800">
                            {val > 0 ? val : ''}
                          </div>
                        </td>
                      );
                    })}
                    {competitors.map(comp => {
                      const ass = assessments.find(a => a.reqId === req.id && a.compId === comp.id);
                      return (
                        <td key={`ass-${req.id}-${comp.id}`} className={`border-b border-r border-slate-200 p-1 transition-colors ${getHeatmapColor(ass?.value)}`}>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={ass ? ass.value : ''}
                            onChange={e => updateAssessment(req.id, comp.id, parseInt(e.target.value) || 0)}
                            className="w-full h-8 bg-transparent focus:outline-none text-center font-bold"
                          />
                        </td>
                      );
                    })}
                    {index === 0 && (
                      <td rowSpan={requirements.length} className="border-b border-slate-200 p-0 bg-white relative align-top" style={{ width: '250px', minWidth: '250px' }}>
                        <svg width="250" height={requirements.length * 48} className="absolute top-0 left-0">
                          {/* Vertical Grid Lines */}
                          {[25, 75, 125, 175, 225].map(x => (
                            <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={requirements.length * 48} stroke="#e2e8f0" strokeDasharray="4 4" />
                          ))}
                          {/* Horizontal Grid Lines */}
                          {requirements.map((_, i) => (
                            <line key={`h-${i}`} x1={0} y1={(i + 1) * 48} x2={250} y2={(i + 1) * 48} stroke="#e2e8f0" />
                          ))}

                          {/* Lines for each competitor */}
                          {competitors.map((comp, cIdx) => {
                            const points = requirements.map((r, rIdx) => {
                              const ass = assessments.find(a => a.reqId === r.id && a.compId === comp.id);
                              if (!ass || !ass.value) return null;
                              const x = 25 + (ass.value - 1) * 50;
                              const y = rIdx * 48 + 24;
                              return `${x},${y}`;
                            }).filter(Boolean).join(' L ');

                            if (!points) return null;

                            return (
                              <g key={`line-${comp.id}`}>
                                <path d={`M ${points}`} fill="none" stroke={getCompColor(cIdx)} strokeWidth="2" />
                                {requirements.map((r, rIdx) => {
                                  const ass = assessments.find(a => a.reqId === r.id && a.compId === comp.id);
                                  if (!ass || !ass.value) return null;
                                  const x = 25 + (ass.value - 1) * 50;
                                  const y = rIdx * 48 + 24;
                                  
                                  if (comp.name === 'Nuestro') {
                                    return <polygon key={`dot-${comp.id}-${r.id}`} points={`${x},${y-6} ${x+6},${y+5} ${x-6},${y+5}`} fill={getCompColor(cIdx)} />
                                  }
                                  return <circle key={`dot-${comp.id}-${r.id}`} cx={x} cy={y} r="5" fill={getCompColor(cIdx)} />
                                })}
                              </g>
                            );
                          })}
                        </svg>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="border-b border-r border-slate-200 p-3 bg-slate-50 text-right font-semibold text-slate-600">Valores Objetivo</td>
                  {characteristics.map(c => (
                    <td key={`target-${c.id}`} className="border-b border-r border-slate-200 p-2 bg-white text-center" style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                      <input
                        value={c.targetValue || ''}
                        onChange={e => updateCharacteristic(c.id, 'targetValue', e.target.value)}
                        className="w-full bg-transparent focus:outline-none text-center text-sm font-medium text-slate-700"
                        placeholder="Ej: > 10"
                      />
                    </td>
                  ))}
                  <td colSpan={competitors.length + 1} className="border-b border-slate-200 bg-slate-50"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="border-b border-r border-slate-200 p-3 bg-slate-50 text-right font-semibold text-slate-600">Unidades de Medida</td>
                  {characteristics.map(c => (
                    <td key={`unit-${c.id}`} className="border-b border-r border-slate-200 p-2 bg-white text-center" style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                      <input
                        value={c.unit}
                        onChange={e => updateCharacteristic(c.id, 'unit', e.target.value)}
                        className="w-full bg-transparent focus:outline-none text-center text-xs text-slate-500"
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td colSpan={competitors.length + 1} className="border-b border-slate-200 bg-slate-50"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="border-b border-r border-slate-200 p-3 bg-slate-100 text-right font-bold text-slate-700">Importancia Absoluta</td>
                  {characteristics.map(c => (
                    <td key={`abs-${c.id}`} className="border-b border-r border-slate-200 p-3 text-center font-bold text-slate-800 bg-slate-50" style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                      {calculatedImportance[c.id]?.absolute || 0}
                    </td>
                  ))}
                  <td colSpan={competitors.length + 1} className="border-b border-slate-200 bg-slate-100"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="border-r border-slate-200 p-3 bg-slate-100 text-right font-bold text-slate-700">Importancia Relativa (%)</td>
                  {characteristics.map(c => {
                    const relValue = calculatedImportance[c.id]?.relative || 0;
                    return (
                      <td 
                        key={`rel-${c.id}`} 
                        className="border-r border-slate-200 p-3 text-center text-black" 
                        style={{ 
                          width: '64px', 
                          minWidth: '64px', 
                          maxWidth: '64px',
                          backgroundColor: getRelativeColor(relValue)
                        }}
                      >
                        {(relValue * 100).toFixed(1)}%
                      </td>
                    );
                  })}
                  <td colSpan={competitors.length + 1} className="bg-slate-100"></td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={importData} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
            <Upload size={18} /> Cargar JSON
          </button>
          <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 shadow-sm transition-colors">
            <Download size={18} /> Descargar JSON
          </button>
          <button onClick={exportImage} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
            <ImageIcon size={18} /> Descargar Imagen
          </button>
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100 flex gap-4 items-start">
          <Info className="text-blue-500 shrink-0 mt-1" />
          <div className="text-sm text-blue-900 w-full">
            <h3 className="font-bold text-base mb-3">¿Cómo usar esta matriz QFD?</h3>
            
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li><strong>¡Todo es editable!:</strong> Haz clic o toca directamente sobre cualquier texto (requerimientos, características, competidores) o número para modificarlo. Los datos actuales son solo un ejemplo.</li>
              <li><strong>QUÉ (Requerimientos del Cliente):</strong> Lista lo que el cliente desea. Asigna una importancia del 1 al 5.</li>
              <li><strong>CÓMO (Requerimientos Técnicos):</strong> Lista cómo vas a satisfacer esos requerimientos mediante especificaciones técnicas.</li>
              <li><strong>Relaciones:</strong> Haz clic en las celdas centrales para establecer la correlación. Los valores rotan entre Fuerte (9), Moderada (3), Débil (1) y Vacío.</li>
              <li><strong>Techo:</strong> Establece las correlaciones cruzadas entre las propias características técnicas (CÓMO vs CÓMO).</li>
              <li><strong>Dirección de Mejora:</strong> Haz clic en los íconos superiores para indicar si la característica técnica debe maximizarse (↑), minimizarse (↓) o alcanzar un objetivo específico (◎).</li>
              <li><strong>Evaluación Competitiva:</strong> Califica del 1 al 5 cómo se percibe tu producto frente a la competencia para cada requerimiento.</li>
            </ul>

            <div className="bg-white/60 p-4 rounded-lg border border-blue-200 shadow-sm flex gap-3 items-start">
              <span className="text-xl leading-none">💡</span>
              <p className="leading-relaxed">
                <strong>Tip:</strong> Cuando trabajes en tu matriz, puedes descargar la versión <strong>.json</strong>. Cuando quieras volver a trabajar sobre ella o compartirla con un colega, ¡simplemente debes cargarla y seguir editando! Descarga la <strong>imagen</strong> para usarla en la documentación de tu proyecto.
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-12 mb-8 flex flex-col items-center justify-center text-slate-500 text-sm space-y-3">
          <p>Desarrollado por el <strong>Prof. Oscar Campo, PhD</strong> (<a href="mailto:oicampo@uao.edu.co" className="hover:text-slate-700 underline">oicampo@uao.edu.co</a>).</p>
          <a href="http://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="license noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img alt="Licencia Creative Commons" style={{ borderWidth: 0 }} src="https://licensebuttons.net/l/by-nc/4.0/88x31.png" referrerPolicy="no-referrer" />
          </a>
          <p className="text-xs text-center max-w-lg">
            Esta obra está bajo una <a href="http://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="license noopener noreferrer" className="underline hover:text-slate-700">Licencia Creative Commons Atribución-NoComercial 4.0 Internacional</a>.<br/>
            Es de uso libre mencionando al autor y no se permite su comercialización.
          </p>
        </footer>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-slate-900">Confirmar eliminación</h3>
            </div>
            <p className="text-slate-600 mb-4">
              ¿Estás seguro de que deseas eliminar el {itemToDelete.type === 'req' ? 'requerimiento' : 'CÓMO'} <strong>"{itemToDelete.name}"</strong>?
            </p>
            <div className="bg-rose-50 text-rose-800 text-sm p-4 rounded-lg mb-6 border border-rose-100">
              <strong>Advertencia:</strong> Esta acción eliminará toda la {itemToDelete.type === 'req' ? 'fila' : 'columna'} y <strong>todas las relaciones</strong> asociadas a este elemento{itemToDelete.type === 'char' ? ', incluyendo las relaciones cruzadas en el techo' : ''}. Esta acción no se puede deshacer.
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
