import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Target, Download, Upload, Info, Image as ImageIcon, AlertTriangle, FileCode, HelpCircle } from 'lucide-react';
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

const translations = {
  es: {
    title: "Casa de la Calidad (QFD)",
    addReq: "Añadir Requerimiento",
    addChar: "Añadir Característica",
    addComp: "Añadir Competidor",
    exportImg: "Exportar Imagen",
    exportSvg: "Exportar SVG",
    importJson: "Importar JSON",
    exportJson: "Exportar JSON",
    reqHeader: "Requerimientos del Cliente",
    impHeader: "Imp.",
    charHeader: "Características Técnicas",
    compEval: "Evaluación Competitiva",
    compProfile: "Perfil Competitivo",
    que: "QUÉ",
    como: "CÓMO",
    direction: "Dirección de mejora",
    unit: "Unidad",
    target: "Valor Objetivo",
    relWeight: "Importancia Relativa",
    absWeight: "Importancia Absoluta",
    confirmDelete: "Confirmar eliminación",
    deleteMsg: "¿Estás seguro de que deseas eliminar",
    cancel: "Cancelar",
    delete: "Eliminar",
    newReq: "Nuevo Requerimiento",
    newChar: "Nueva Característica",
    newComp: "Nuevo Competidor",
    our: "Nuestro",
    compA: "Comp. A",
    easyToUse: "Fácil de usar",
    durable: "Duradero",
    economical: "Económico",
    weight: "Peso",
    resistance: "Resistencia material",
    cost: "Costo de producción",
    howToUse: "¿Cómo usar esta matriz QFD?",
    editEverything: "¡Todo es editable!: Haz clic o toca directamente sobre cualquier texto o número para modificarlo.",
    queDesc: "QUÉ (Requerimientos del Cliente): Lista lo que el cliente desea. Asigna una importancia del 1 al 5.",
    comoDesc: "CÓMO (Requerimientos Técnicos): Lista cómo vas a satisfacer esos requerimientos mediante especificaciones técnicas.",
    relDesc: "Relaciones: Haz clic en las celdas centrales para establecer la correlación (⏺=9, ○=3, △=1).",
    roofDesc: "Techo: Establece las correlaciones cruzadas entre las características técnicas (++, +, -, --).",
    dirDesc: "Dirección de Mejora: Indica si la característica debe maximizarse (↑), minimizarse (↓) o alcanzar un objetivo (◎).",
    compDesc: "Evaluación Competitiva: Compara tu desempeño con la competencia (1-5) para visualizar el Perfil Competitivo.",
    impDesc: "Importancia Absoluta y Relativa: Se calculan automáticamente basándose en las relaciones y la importancia del cliente.",
    exportPng: "Descargar PNG (Alta Res)",
    exportSvgBtn: "Descargar SVG Nativo",
    strong: "Fuerte",
    moderate: "Moderada",
    weak: "Débil",
    strongPos: "Fuerte Positiva",
    pos: "Positiva",
    neg: "Negativa",
    strongNeg: "Fuerte Negativa",
    maximize: "Maximizar",
    minimize: "Minimizar",
    targetLabel: "Objetivo",
    warning: "Advertencia",
    deleteWarning: "Esta acción eliminará toda la fila/columna y todas las relaciones asociadas. No se puede deshacer.",
    yesDelete: "Sí, eliminar",
    tip: "Tip",
    tipDesc: "Cuando trabajes en tu matriz, puedes descargar la versión .json para seguir editando después. Exporta a PNG o SVG para tu documentación.",
    developedBy: "Desarrollado por el",
    license: "Esta obra está bajo una Licencia Creative Commons Atribución-NoComercial 4.0 Internacional. Es de uso libre mencionando al autor y no se permite su comercialización."
  },
  en: {
    title: "House of Quality (QFD)",
    addReq: "Add Requirement",
    addChar: "Add Technical Metric",
    addComp: "Add Competitor",
    exportImg: "Export Image",
    exportSvg: "Export SVG",
    importJson: "Import JSON",
    exportJson: "Export JSON",
    reqHeader: "Customer Requirements (WHAT)",
    impHeader: "Imp.",
    charHeader: "Technical Characteristics (HOW)",
    compEval: "Competitive Evaluation (1-5)",
    compProfile: "Competitive Profile",
    que: "WHAT",
    como: "HOW",
    direction: "Direction of improvement",
    unit: "Unit",
    target: "Target Value",
    relWeight: "Relative Importance",
    absWeight: "Absolute Importance",
    confirmDelete: "Confirm Deletion",
    deleteMsg: "Are you sure you want to delete",
    cancel: "Cancel",
    delete: "Delete",
    newReq: "New Requirement",
    newChar: "New Technical Metric",
    newComp: "New Competitor",
    our: "Ours",
    compA: "Comp. A",
    easyToUse: "Easy to use",
    durable: "Durable",
    economical: "Economical",
    weight: "Weight",
    resistance: "Material resistance",
    cost: "Production cost",
    howToUse: "How to use this QFD matrix?",
    editEverything: "Everything is editable!: Click or tap directly on any text or number to modify it.",
    queDesc: "WHAT (Customer Requirements): List what the customer wants. Assign an importance from 1 to 5.",
    comoDesc: "HOW (Technical Requirements): List how you will satisfy those requirements through technical specifications.",
    relDesc: "Relationships: Click on the central cells to establish correlation (⏺=9, ○=3, △=1).",
    roofDesc: "Roof: Establish cross-correlations between technical characteristics (++, +, -, --).",
    dirDesc: "Direction of Improvement: Indicate if the characteristic should be maximized (↑), minimized (↓) or reach a target (◎).",
    compDesc: "Competitive Evaluation: Compare your performance with the competition (1-5) to visualize the Competitive Profile.",
    impDesc: "Absolute and Relative Importance: Automatically calculated based on relationships and customer importance.",
    exportPng: "Download PNG (High Res)",
    exportSvgBtn: "Download Native SVG",
    strong: "Strong",
    moderate: "Moderate",
    weak: "Weak",
    strongPos: "Strong Positive",
    pos: "Positive",
    neg: "Negative",
    strongNeg: "Strong Negative",
    maximize: "Maximize",
    minimize: "Minimize",
    targetLabel: "Target",
    warning: "Warning",
    deleteWarning: "This action will delete the entire row/column and all associated relationships. This cannot be undone.",
    yesDelete: "Yes, delete",
    tip: "Tip",
    tipDesc: "When working on your matrix, you can download the .json version to continue editing later. Export to PNG or SVG for your documentation.",
    developedBy: "Developed by",
    license: "This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License. It is free to use mentioning the author and commercialization is not allowed."
  }
};

export default function App() {
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [showHelp, setShowHelp] = useState(false);
  const t = translations[language];
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelp(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [requirements, setRequirements] = useState<Requirement[]>([
    { id: 'r1', text: t.easyToUse, importance: 5 },
    { id: 'r2', text: t.durable, importance: 4 },
    { id: 'r3', text: t.economical, importance: 3 },
  ]);

  const [characteristics, setCharacteristics] = useState<Characteristic[]>([
    { id: 'c1', text: t.weight, direction: 'min', unit: 'kg', targetValue: '< 2.5' },
    { id: 'c2', text: t.resistance, direction: 'max', unit: 'MPa', targetValue: '> 250' },
    { id: 'c3', text: t.cost, direction: 'min', unit: 'USD', targetValue: '< 15' },
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
    { id: 'comp1', name: t.our },
    { id: 'comp2', name: t.compA },
  ]);

  useEffect(() => {
    // Translate example data if it hasn't been modified significantly
    const prevLang = language === 'es' ? 'en' : 'es';
    const pt = translations[prevLang];
    
    setRequirements(prev => prev.map(r => {
      if (r.text === pt.easyToUse) return { ...r, text: t.easyToUse };
      if (r.text === pt.durable) return { ...r, text: t.durable };
      if (r.text === pt.economical) return { ...r, text: t.economical };
      return r;
    }));

    setCharacteristics(prev => prev.map(c => {
      if (c.text === pt.weight) return { ...c, text: t.weight };
      if (c.text === pt.resistance) return { ...c, text: t.resistance };
      if (c.text === pt.cost) return { ...c, text: t.cost };
      return c;
    }));

    setCompetitors(prev => prev.map(c => {
      if (c.name === pt.our) return { ...c, name: t.our };
      if (c.name === pt.compA) return { ...c, name: t.compA };
      return c;
    }));
  }, [language, t]);

  const [assessments, setAssessments] = useState<CompAssessment[]>([
    { reqId: 'r1', compId: 'comp1', value: 4 },
    { reqId: 'r1', compId: 'comp2', value: 3 },
    { reqId: 'r2', compId: 'comp1', value: 5 },
    { reqId: 'r2', compId: 'comp2', value: 4 },
    { reqId: 'r3', compId: 'comp1', value: 3 },
    { reqId: 'r3', compId: 'comp2', value: 5 },
  ]);

  const [hoveredCrossRel, setHoveredCrossRel] = useState<{charId1: string, charId2: string} | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{type: 'req' | 'char', id: string, name: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const getRelSymbol = (value: number, forSvg: boolean = false) => {
    switch (value) {
      case 9: return '⏺';
      case 3: return forSvg ? '◯' : '○';
      case 1: return '△';
      default: return '';
    }
  };

  const getCrossRelSymbol = (value: number) => {
    switch (value) {
      case 9: return '++';
      case 3: return '+';
      case -3: return '-';
      case -9: return '--';
      default: return '';
    }
  };

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
    setRequirements([...requirements, { id: generateId(), text: t.newReq, importance: 3 }]);
  };

  const updateRequirement = (id: string, field: keyof Requirement, value: any) => {
    setRequirements(requirements.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const requestDeleteRequirement = (id: string, name: string) => {
    setItemToDelete({ type: 'req', id, name });
  };

  const addCharacteristic = () => {
    setCharacteristics([...characteristics, { id: generateId(), text: t.newChar, direction: 'max', unit: '-', targetValue: '' }]);
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
      // Usamos un pixelRatio alto (3 o 4) para que el PNG tenga calidad "Retina" 
      // y no se pixele al hacer zoom en GitHub.
      const dataUrl = await htmlToImage.toPng(matrixRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 4, 
      });
      
      // Convertimos el dataUrl a Blob para evitar problemas de límite de longitud de URL en el navegador
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'matriz-qfd-alta-res.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar imagen:', err);
      alert('Hubo un error al exportar la imagen.');
    }
  };

  const escapeXml = (unsafe: string) => {
    if (!unsafe) return "";
    return unsafe.toString().replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const exportNativeSvg = () => {
    const charW = 64;
    const rowH = 48;
    const reqW = 256;
    const impW = 80;
    const compW = 96;
    const profileW = 250;

    const numReqs = requirements.length;
    const numChars = characteristics.length;
    const numComps = competitors.length;

    const roofH = numChars * 32;
    const dirH = 48;
    const mainHeaderH = 192;
    const headerH = dirH + mainHeaderH;
    
    const startX = reqW + impW;
    const startY = roofH + headerH;
    const matrixH = numReqs * rowH;
    const footerH = 4 * rowH;

    const totalW = Math.ceil(startX + (numChars * charW) + (numComps * compW) + profileW);
    const totalH = Math.ceil(startY + matrixH + footerH);

    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" text-rendering="geometricPrecision">`;

    svg += `<rect x="0" y="0" width="${totalW}" height="${totalH}" fill="white" />`;
    svg += `<style>
      svg { font-family: Arial, sans-serif; }
      .line { stroke: #cbd5e1; stroke-width: 1; }
      .line-dash { stroke: #e2e8f0; stroke-width: 1; stroke-dasharray: 4 4; }
      .text-sm { font-size: 12px; fill: #334155; }
      .text-xs { font-size: 10px; fill: #64748b; }
      .text-md { font-size: 14px; fill: #1e293b; font-weight: bold; }
      .text-req { font-size: 13px; fill: #334155; }
      .bg-header { fill: #f8fafc; }
      .bg-footer { fill: #f1f5f9; }
      .bg-cell { fill: #ffffff; }
    </style>`;

    // 1. Roof
    svg += `<g id="roof">`;
    for (let i = 0; i <= numChars; i++) {
      const x1_up = startX + i * charW;
      const y1_up = roofH;
      const x2_up = startX + i * charW + (numChars - i) * 32;
      const y2_up = roofH - (numChars - i) * 32;
      svg += `<line x1="${x1_up}" y1="${y1_up}" x2="${x2_up}" y2="${y2_up}" class="line" />`;

      const x1_dn = startX + i * charW;
      const y1_dn = roofH;
      const x2_dn = startX + i * charW - i * 32;
      const y2_dn = roofH - i * 32;
      svg += `<line x1="${x1_dn}" y1="${y1_dn}" x2="${x2_dn}" y2="${y2_dn}" class="line" />`;
    }
    
    crossRelationships.forEach(rel => {
      const idx1 = characteristics.findIndex(c => c.id === rel.charId1);
      const idx2 = characteristics.findIndex(c => c.id === rel.charId2);
      if (idx1 !== -1 && idx2 !== -1) {
        const i = Math.min(idx1, idx2);
        const j = Math.max(idx1, idx2);
        const cx = startX + (i + j + 1) * 32;
        const cy = roofH - (j - i) * 32;
        
        let fillColor = "#ffffff";
        let textColor = "#334155";
        if (rel.value === 9) { fillColor = "#d1fae5"; textColor = "#065f46"; }
        if (rel.value === 3) { fillColor = "#ecfdf5"; textColor = "#047857"; }
        if (rel.value === -3) { fillColor = "#fff1f2"; textColor = "#be123c"; }
        if (rel.value === -9) { fillColor = "#ffe4e6"; textColor = "#9f1239"; }

        const points = `${cx},${cy - 32} ${cx + 32},${cy} ${cx},${cy + 32} ${cx - 32},${cy}`;
        svg += `<polygon points="${points}" fill="${fillColor}" class="line" />`;
        svg += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" class="text-sm" font-weight="bold" fill="${textColor}">${escapeXml(getCrossRelSymbol(rel.value))}</text>`;
      }
    });
    svg += `</g>`;

    // 2. Top-Left Header Cells
    svg += `<g id="top-left-header">`;
    // Empty cell above diagonal
    svg += `<rect x="0" y="${roofH}" width="${startX}" height="${dirH}" class="bg-header line" />`;
    // Diagonal cell
    svg += `<rect x="0" y="${roofH + dirH}" width="${reqW}" height="${mainHeaderH}" class="bg-header line" />`;
    svg += `<line x1="0" y1="${roofH + dirH}" x2="${reqW}" y2="${roofH + dirH + mainHeaderH}" class="line" />`;
    svg += `<text x="${reqW - 15}" y="${roofH + dirH + 30}" text-anchor="end" class="text-md">${t.como}</text>`;
    svg += `<text x="15" y="${roofH + dirH + mainHeaderH - 20}" class="text-md">${t.que}</text>`;
    // Importance header
    svg += `<rect x="${reqW}" y="${roofH + dirH}" width="${impW}" height="${mainHeaderH}" class="bg-header line" />`;
    svg += `<text x="${reqW + impW/2}" y="${roofH + dirH + mainHeaderH - 10}" text-anchor="middle" class="text-sm" font-weight="bold">${t.impHeader}</text>`;
    svg += `</g>`;

    // 3. Headers (CÓMO)
    svg += `<g id="headers">`;
    characteristics.forEach((char, i) => {
      const x = startX + i * charW;
      // Direction row
      svg += `<rect x="${x}" y="${roofH}" width="${charW}" height="${dirH}" class="bg-header line" />`;
      const dirSymbol = char.direction === 'max' ? '↑' : char.direction === 'min' ? '↓' : '◎';
      const dirColor = char.direction === 'max' ? '#059669' : char.direction === 'min' ? '#e11d48' : '#2563eb';
      svg += `<text x="${x + charW/2}" y="${roofH + dirH/2 + 5}" text-anchor="middle" class="text-md" fill="${dirColor}">${dirSymbol}</text>`;
      
      // Text row
      svg += `<rect x="${x}" y="${roofH + dirH}" width="${charW}" height="${mainHeaderH}" class="bg-header line" />`;
      svg += `<text x="${x + charW/2 + 4}" y="${roofH + dirH + mainHeaderH - 10}" transform="rotate(-90 ${x + charW/2 + 4} ${roofH + dirH + mainHeaderH - 10})" class="text-sm">${escapeXml(char.text)}</text>`;
    });
    svg += `</g>`;

    // 4. Competitor Headers
    const compStartX = startX + numChars * charW;
    svg += `<g id="comp-headers">`;
    // Row 1: Main Labels
    svg += `<rect x="${compStartX}" y="${roofH}" width="${numComps * compW}" height="${dirH}" class="bg-header line" />`;
    svg += `<text x="${compStartX + (numComps * compW)/2}" y="${roofH + dirH/2 + 5}" text-anchor="middle" class="text-sm" font-weight="bold">${t.compEval}</text>`;
    
    svg += `<rect x="${compStartX + numComps * compW}" y="${roofH}" width="${profileW}" height="${dirH}" class="bg-header line" />`;
    svg += `<text x="${compStartX + numComps * compW + profileW/2}" y="${roofH + dirH/2 + 5}" text-anchor="middle" class="text-sm" font-weight="bold">${t.compProfile}</text>`;

    // Row 2: Competitor Names
    competitors.forEach((comp, i) => {
      const x = compStartX + i * compW;
      svg += `<rect x="${x}" y="${roofH + dirH}" width="${compW}" height="${mainHeaderH}" class="bg-header line" />`;
      svg += `<text x="${x + compW/2 + 4}" y="${roofH + dirH + mainHeaderH - 10}" transform="rotate(-90 ${x + compW/2 + 4} ${roofH + dirH + mainHeaderH - 10})" class="text-sm">${escapeXml(comp.name)}</text>`;
    });

    // Row 2: Profile Scale
    const profileStartX = compStartX + numComps * compW;
    svg += `<rect x="${profileStartX}" y="${roofH + dirH}" width="${profileW}" height="${mainHeaderH}" class="bg-header line" />`;
    // Scale 1-5
    for (let i = 1; i <= 5; i++) {
      const x = profileStartX + (i - 1) * 50 + 25;
      svg += `<text x="${x}" y="${roofH + dirH + mainHeaderH - 10}" text-anchor="middle" class="text-xs font-bold">${i}</text>`;
    }
    svg += `</g>`;

    // 5. Requirements & Matrix
    svg += `<g id="matrix-body">`;
    requirements.forEach((req, r) => {
      const y = startY + r * rowH;
      
      // Req Text
      svg += `<rect x="0" y="${y}" width="${reqW}" height="${rowH}" class="bg-cell line" />`;
      svg += `<text x="10" y="${y + rowH/2 + 4}" class="text-req">${escapeXml(req.text)}</text>`;
      
      // Importance
      svg += `<rect x="${reqW}" y="${y}" width="${impW}" height="${rowH}" class="bg-cell line" />`;
      svg += `<text x="${reqW + impW/2}" y="${y + rowH/2 + 4}" text-anchor="middle" class="text-md">${escapeXml(req.importance.toString())}</text>`;

      // Relationships
      characteristics.forEach((char, c) => {
        const x = startX + c * charW;
        svg += `<rect x="${x}" y="${y}" width="${charW}" height="${rowH}" class="bg-cell line" />`;
        const rel = relationships.find(rel => rel.reqId === req.id && rel.charId === char.id);
        if (rel && rel.value > 0) {
          svg += `<text x="${x + charW/2}" y="${y + rowH/2 + 5}" text-anchor="middle" class="text-md" font-size="18">${escapeXml(getRelSymbol(rel.value, true))}</text>`;
        }
      });

      // Competitor Assessments
      competitors.forEach((comp, c) => {
        const x = compStartX + c * compW;
        const ass = assessments.find(a => a.reqId === req.id && a.compId === comp.id);
        let bgColor = '#ffffff';
        if (ass && ass.value) {
          if (ass.value === 1) bgColor = '#fee2e2';
          else if (ass.value === 2) bgColor = '#ffedd5';
          else if (ass.value === 3) bgColor = '#fef9c3';
          else if (ass.value === 4) bgColor = '#ecfccb';
          else if (ass.value === 5) bgColor = '#dcfce7';
        }
        svg += `<rect x="${x}" y="${y}" width="${compW}" height="${rowH}" fill="${bgColor}" class="line" />`;
        if (ass && ass.value) {
          svg += `<text x="${x + compW/2}" y="${y + rowH/2 + 5}" text-anchor="middle" class="text-md">${escapeXml(ass.value.toString())}</text>`;
        }
      });

      // Profile Column Background
      svg += `<rect x="${profileStartX}" y="${y}" width="${profileW}" height="${rowH}" class="bg-cell line" />`;
      for (let i = 1; i <= 5; i++) {
        const x = profileStartX + (i - 1) * 50 + 25;
        svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + rowH}" class="line-dash" />`;
      }
    });
    svg += `</g>`;

    // 6. Competitive Profile Lines
    svg += `<g id="profile-lines">`;
    competitors.forEach((comp, cIdx) => {
      const points: string[] = [];
      requirements.forEach((req, rIdx) => {
        const ass = assessments.find(a => a.reqId === req.id && a.compId === comp.id);
        if (ass && ass.value) {
          const x = profileStartX + (ass.value - 1) * 50 + 25;
          const y = startY + rIdx * rowH + rowH/2;
          points.push(`${x},${y}`);
        }
      });

      if (points.length > 1) {
        svg += `<path d="M ${points.join(' L ')}" fill="none" stroke="${getCompColor(cIdx)}" stroke-width="2" />`;
      }

      points.forEach((p, pIdx) => {
        const [xStr, yStr] = p.split(',');
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        if (comp.name === 'Nuestro') {
          svg += `<polygon points="${x},${y-6} ${x+6},${y+5} ${x-6},${y+5}" fill="${getCompColor(cIdx)}" />`;
        } else {
          svg += `<circle cx="${x}" cy="${y}" r="5" fill="${getCompColor(cIdx)}" />`;
        }
      });
    });
    svg += `</g>`;

    // 7. Footer Rows
    const footerStartY = startY + matrixH;
    const labels = [t.target, t.unit, t.absWeight, `${t.relWeight} (%)`];
    
    labels.forEach((label, i) => {
      const y = footerStartY + i * rowH;
      svg += `<rect x="0" y="${y}" width="${startX}" height="${rowH}" class="bg-footer line" />`;
      svg += `<text x="${startX - 10}" y="${y + rowH/2 + 5}" text-anchor="end" class="text-md">${label}</text>`;
      
      characteristics.forEach((char, cIdx) => {
        const x = startX + cIdx * charW;
        let content = "";
        let bgColor = "#ffffff";

        if (i === 0) content = escapeXml(char.targetValue || "-");
        else if (i === 1) content = escapeXml(char.unit || "-");
        else if (i === 2) content = (calculatedImportance[char.id]?.absolute || 0).toString();
        else if (i === 3) {
          const rel = calculatedImportance[char.id]?.relative || 0;
          content = (rel * 100).toFixed(1) + "%";
          bgColor = getRelativeColor(rel);
        }

        svg += `<rect x="${x}" y="${y}" width="${charW}" height="${rowH}" fill="${bgColor}" class="line" />`;
        svg += `<text x="${x + charW/2}" y="${y + rowH/2 + 5}" text-anchor="middle" class="text-sm">${content}</text>`;
      });

      // Fill remaining space in footer
      svg += `<rect x="${compStartX}" y="${y}" width="${numComps * compW + profileW}" height="${rowH}" class="bg-footer line" />`;
    });

    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-qfd-completa.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">{t.title}</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Quality Function Deployment</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
            {/* Language Selector */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  language === 'es' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  language === 'en' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                EN
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Export/Import Group */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button onClick={() => fileInputRef.current?.click()} title={t.importJson} className="p-2 text-slate-600 hover:bg-white hover:text-indigo-600 rounded-md transition-all hover:shadow-sm" aria-label={t.importJson}>
                <Upload size={18} />
              </button>
              <button onClick={exportData} title={t.exportJson} className="p-2 text-slate-600 hover:bg-white hover:text-indigo-600 rounded-md transition-all hover:shadow-sm" aria-label={t.exportJson}>
                <Download size={18} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button onClick={exportImage} title={t.exportPng} className="p-2 text-slate-600 hover:bg-white hover:text-blue-600 rounded-md transition-all hover:shadow-sm" aria-label={t.exportPng}>
                <ImageIcon size={18} />
              </button>
              <button onClick={exportNativeSvg} title={t.exportSvgBtn} className="p-2 text-slate-600 hover:bg-white hover:text-emerald-600 rounded-md transition-all hover:shadow-sm" aria-label={t.exportSvgBtn}>
                <FileCode size={18} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Help Icon & Dropdown */}
            <div className="relative" ref={helpRef}>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`p-2 rounded-full transition-all shadow-sm border ${
                  showHelp 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                }`}
                title={t.howToUse}
              >
                <HelpCircle size={20} />
              </button>
              
              {showHelp && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600 border-b border-slate-100 pb-3">
                    <Info size={20} />
                    <h3 className="font-bold text-lg">{t.howToUse}</h3>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600 mb-5">
                      <li><strong className="text-slate-800">{t.editEverything}</strong></li>
                      <li>{t.queDesc}</li>
                      <li>{t.comoDesc}</li>
                      <li>{t.relDesc}</li>
                      <li>{t.roofDesc}</li>
                      <li>{t.dirDesc}</li>
                      <li>{t.compDesc}</li>
                      <li>{t.impDesc}</li>
                    </ul>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-blue-800 leading-relaxed">
                      <div className="flex gap-2 items-start">
                        <span className="text-base leading-none">💡</span>
                        <p><strong>{t.tip}:</strong> {t.tipDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-8 items-center justify-between">
            <div className="flex flex-wrap gap-8 items-center">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.relWeight} (QUÉ vs CÓMO)</div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><span className="font-bold text-slate-800 bg-slate-100 w-6 h-6 flex items-center justify-center rounded">⏺</span> <span className="text-slate-600">{t.strong} (9)</span></div>
                  <div className="flex items-center gap-1.5"><span className="font-bold text-slate-800 bg-slate-100 w-6 h-6 flex items-center justify-center rounded">○</span> <span className="text-slate-600">{t.moderate} (3)</span></div>
                  <div className="flex items-center gap-1.5"><span className="font-bold text-slate-800 bg-slate-100 w-6 h-6 flex items-center justify-center rounded">△</span> <span className="text-slate-600">{t.weak} (1)</span></div>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{language === 'es' ? 'Techo' : 'Roof'} (CÓMO vs CÓMO)</div>
                <div className="flex gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5"><span className="font-bold text-emerald-700 bg-emerald-50 w-7 h-6 flex items-center justify-center rounded">++</span> <span className="text-slate-600">{t.strongPos}</span></div>
                  <div className="flex items-center gap-1.5"><span className="font-bold text-emerald-600 bg-emerald-50 w-6 h-6 flex items-center justify-center rounded">+</span> <span className="text-slate-600">{t.pos}</span></div>
                  <div className="flex items-center gap-1.5"><span className="font-bold text-rose-600 bg-rose-50 w-6 h-6 flex items-center justify-center rounded">-</span> <span className="text-slate-600">{t.neg}</span></div>
                  <div className="flex items-center gap-1.5"><span className="font-bold text-rose-700 bg-rose-50 w-7 h-6 flex items-center justify-center rounded">--</span> <span className="text-slate-600">{t.strongNeg}</span></div>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.direction}</div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><ArrowUp size={14} className="text-emerald-600" /> <span className="text-slate-600">{t.maximize}</span></div>
                  <div className="flex items-center gap-1.5"><ArrowDown size={14} className="text-rose-600" /> <span className="text-slate-600">{t.minimize}</span></div>
                  <div className="flex items-center gap-1.5"><Target size={14} className="text-blue-600" /> <span className="text-slate-600">{t.targetLabel}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Construction Toolbar */}
        <div className="flex items-center gap-2 mb-2 bg-slate-800 p-1.5 rounded-lg shadow-md border border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 border-r border-slate-600 mr-1">
            {language === 'es' ? 'Construcción' : 'Construction'}
          </div>
          <button onClick={addRequirement} className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white hover:bg-blue-500 rounded-md transition-all text-xs font-bold shadow-sm">
            <Plus size={14} /> {t.que}
          </button>
          <button onClick={addCharacteristic} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-500 rounded-md transition-all text-xs font-bold shadow-sm">
            <Plus size={14} /> {t.como}
          </button>
          <button onClick={addCompetitor} className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white hover:bg-purple-500 rounded-md transition-all text-xs font-bold shadow-sm">
            <Plus size={14} /> {"Añadir" t.addComp}
          </button>
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
                                <g 
                                  key={`roof-${id1}-${id2}`} 
                                  onClick={() => cycleCrossRelationship(id1, id2)} 
                                  onMouseEnter={() => setHoveredCrossRel({charId1: id1, charId2: id2})}
                                  onMouseLeave={() => setHoveredCrossRel(null)}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                  <polygon points={points} fill={fillColor} stroke="#cbd5e1" strokeWidth="1" />
                                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={textColor} fontSize="14" fontWeight="bold">
                                    {getCrossRelSymbol(val)}
                                  </text>
                                </g>
                              );
                            });
                          })}
                          {/* Sombreado del camino (hover) */}
                          {hoveredCrossRel && (() => {
                            const char1Idx = characteristics.findIndex(c => c.id === hoveredCrossRel.charId1);
                            const char2Idx = characteristics.findIndex(c => c.id === hoveredCrossRel.charId2);
                            if (char1Idx === -1 || char2Idx === -1) return null;
                            const i = Math.min(char1Idx, char2Idx);
                            const j = Math.max(char1Idx, char2Idx);
                            const H = characteristics.length * 32;
                            const cx = 32 + (i + j) * 32;
                            const cy_bottom = (j - i) * 32;
                            const cy = H - cy_bottom;

                            const leftBand = `${cx},${cy - 32} ${cx + 32},${cy} ${(i + 1) * 64},${H} ${i * 64},${H}`;
                            const rightBand = `${cx},${cy - 32} ${cx - 32},${cy} ${j * 64},${H} ${(j + 1) * 64},${H}`;

                            return (
                              <g pointerEvents="none">
                                <polygon points={leftBand} fill="#3b82f6" opacity="0.15" />
                                <polygon points={rightBand} fill="#3b82f6" opacity="0.15" />
                                <polygon points={`${cx},${cy - 32} ${cx + 32},${cy} ${cx},${cy + 32} ${cx - 32},${cy}`} fill="#3b82f6" opacity="0.3" stroke="#2563eb" strokeWidth="2" />
                              </g>
                            );
                          })()}
                          {/* Diagonales exteriores del techo */}
                          <line x1={0} y1={characteristics.length * 32} x2={characteristics.length * 32} y2={0} stroke="#cbd5e1" strokeWidth="1" />
                          <line x1={characteristics.length * 64} y1={characteristics.length * 32} x2={characteristics.length * 32} y2={0} stroke="#cbd5e1" strokeWidth="1" />
                        </svg>
                      </div>
                    </th>
                    <th colSpan={competitors.length + 1} className="border-b border-slate-200 bg-slate-50"></th>
                  </tr>
                )}
                <tr>
                  <th colSpan={2} className="border-b border-r border-slate-200 p-2 bg-slate-50"></th>
                  {characteristics.map(c => {
                    const isHovered = hoveredCrossRel && (hoveredCrossRel.charId1 === c.id || hoveredCrossRel.charId2 === c.id);
                    return (
                    <th key={`dir-${c.id}`} className={`border-b border-r border-slate-200 p-1 text-center transition-colors ${isHovered ? 'bg-blue-100' : 'bg-slate-50'}`} style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                      <button onClick={() => toggleDirection(c.id)} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors" title="Cambiar dirección de mejora">
                        {c.direction === 'max' && <ArrowUp size={16} className="text-emerald-600 mx-auto" />}
                        {c.direction === 'min' && <ArrowDown size={16} className="text-rose-600 mx-auto" />}
                        {c.direction === 'target' && <Target size={16} className="text-blue-600 mx-auto" />}
                      </button>
                    </th>
                  )})}
                  <th colSpan={competitors.length} className="border-b border-r border-slate-200 p-2 bg-slate-50 text-center font-semibold text-slate-600">
                    {t.compEval}
                  </th>
                  <th className="border-b border-slate-200 p-2 bg-slate-50 text-center font-semibold text-slate-600 w-[250px]">
                    {t.compProfile}
                  </th>
                </tr>
                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 w-64 relative p-0 h-48">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                    </svg>
                    <div className="absolute top-4 right-4 text-right font-semibold text-slate-600">
                      {t.charHeader}<br />({t.como})
                    </div>
                    <div className="absolute bottom-4 left-4 text-left font-semibold text-slate-600">
                      {t.reqHeader}<br />({t.que})
                    </div>
                  </th>
                  <th className="border-b border-r border-slate-200 p-3 bg-slate-50 text-center w-20 font-semibold text-slate-700 align-bottom" title="Importancia (1-5)">Imp.</th>
                  {characteristics.map(c => {
                    const isHovered = hoveredCrossRel && (hoveredCrossRel.charId1 === c.id || hoveredCrossRel.charId2 === c.id);
                    return (
                    <th key={`head-${c.id}`} className={`border-b border-r border-slate-200 p-2 h-48 align-bottom group relative transition-colors ${isHovered ? 'bg-blue-50' : 'bg-white'}`} style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
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
                  )})}
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
                          <div className="w-full h-10 flex items-center justify-center font-bold select-none text-slate-800 text-lg">
                            {getRelSymbol(val)}
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
                  <td colSpan={2} className="border-b border-r border-slate-200 p-3 bg-slate-50 text-right font-semibold text-slate-600">{t.target}</td>
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
                  <td colSpan={2} className="border-b border-r border-slate-200 p-3 bg-slate-50 text-right font-semibold text-slate-600">{t.unit}</td>
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
                  <td colSpan={2} className="border-b border-r border-slate-200 p-3 bg-slate-100 text-right font-bold text-slate-700">{t.absWeight}</td>
                  {characteristics.map(c => (
                    <td key={`abs-${c.id}`} className="border-b border-r border-slate-200 p-3 text-center font-bold text-slate-800 bg-slate-50" style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                      {calculatedImportance[c.id]?.absolute || 0}
                    </td>
                  ))}
                  <td colSpan={competitors.length + 1} className="border-b border-slate-200 bg-slate-100"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="border-r border-slate-200 p-3 bg-slate-100 text-right font-bold text-slate-700">{t.relWeight} (%)</td>
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
        
        <div className="hidden">
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={importData} />
        </div>

        <footer className="mt-12 mb-8 flex flex-col items-center justify-center text-slate-500 text-sm space-y-3">
          <p>{t.developedBy} <strong>Prof. Oscar Campo, PhD</strong> (<a href="mailto:oicampo@uao.edu.co" className="hover:text-slate-700 underline">oicampo@uao.edu.co</a>).</p>
          <a href="http://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="license noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img alt="Licencia Creative Commons" style={{ borderWidth: 0 }} src="https://licensebuttons.net/l/by-nc/4.0/88x31.png" referrerPolicy="no-referrer" />
          </a>
          <p className="text-xs text-center max-w-lg">
            {t.license}
          </p>
        </footer>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-slate-900">{t.confirmDelete}</h3>
            </div>
            <p className="text-slate-600 mb-4">
              {t.deleteMsg} {itemToDelete.type === 'req' ? (language === 'es' ? 'el requerimiento' : 'the requirement') : (language === 'es' ? 'el CÓMO' : 'the HOW')} <strong>"{itemToDelete.name}"</strong>?
            </p>
            <div className="bg-rose-50 text-rose-800 text-sm p-4 rounded-lg mb-6 border border-rose-100">
              <strong>{t.warning}:</strong> {t.deleteWarning}
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                {t.yesDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
