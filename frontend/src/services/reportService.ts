import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Reagent } from '../types';
import { Equipment } from '../types';
import { Experiment } from '../types/experiment';

// @ts-ignore - Ignorar errores de tipos para file-saver
import { saveAs } from 'file-saver';

export const reportService = {
  // Exportar a Excel
  exportToExcel(data: any[], fileName: string, sheetName: string = 'Datos') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  },

  // Exportar Reactivos a PDF
  exportReagentsToPDF(reagents: Reagent[], fileName: string) {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Reactivos', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 30);

    // Tabla de reactivos
    const tableColumn = ['Nombre', 'Fórmula', 'Cantidad', 'Unidad', 'Ubicación', 'Peligro'];
    const tableRows = reagents.map(r => [
      r.name,
      r.chemicalFormula,
      r.quantity.toString(),
      r.unit,
      r.location,
      `Nivel ${r.hazardLevel}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 125, 50] } // Verde ChemLab
    });

    doc.save(`${fileName}.pdf`);
  },

  // Exportar Equipos a PDF
  exportEquipmentToPDF(equipment: Equipment[], fileName: string) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Equipos', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ['Nombre', 'Modelo', 'Ubicación', 'Estado', 'Próx. Calibración'];
    const tableRows = equipment.map(e => [
      e.name,
      e.model,
      e.location,
      e.status === 0 ? 'Disponible' :
      e.status === 1 ? 'En uso' :
      e.status === 2 ? 'Mantenimiento' :
      e.status === 3 ? 'Calibración pendiente' : 'Fuera de servicio',
      e.nextCalibration ? new Date(e.nextCalibration).toLocaleDateString() : 'No programada'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [2, 136, 209] } // Azul ChemLab
    });

    doc.save(`${fileName}.pdf`);
  },

  // Exportar Dashboard como resumen ejecutivo
  exportSummaryToPDF(reagents: Reagent[], equipment: Equipment[], experiments: Experiment[]) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Reporte Ejecutivo - ChemLab', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);

    // Resumen de inventario
    doc.setFontSize(14);
    doc.text('Resumen de Inventario', 14, 45);
    doc.setFontSize(11);
    doc.text(`Total Reactivos: ${reagents.length}`, 20, 55);
    doc.text(`Total Equipos: ${equipment.length}`, 20, 62);

    const lowStock = reagents.filter(r => r.quantity < 100).length;
    doc.text(`Stock bajo: ${lowStock}`, 20, 69);

    // Experimentos recientes
    doc.setFontSize(14);
    doc.text('Experimentos Recientes', 14, 85);

    const expColumn = ['Nombre', 'Estado', 'Fecha'];
    const expRows = experiments.slice(0, 5).map(e => [
      e.name,
      e.status === 0 ? 'Planificado' :
      e.status === 1 ? 'En progreso' :
      e.status === 2 ? 'Completado' :
      e.status === 3 ? 'Cancelado' : 'Fallido',
      new Date(e.startDate).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [expColumn],
      body: expRows,
      startY: 92,
      styles: { fontSize: 8 }
    });

    doc.save('resumen_chemlab.pdf');
  }
};
