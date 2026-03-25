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

  // Exportar Reactivos a PDF (mejorado)
  exportReagentsToPDF(reagents: Reagent[], fileName: string) {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.setTextColor(46, 125, 50);
    doc.text('ChemLab - Reporte de Reactivos', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);

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

  // Exportar Equipos a PDF (mejorado)
  exportEquipmentToPDF(equipment: Equipment[], fileName: string) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(2, 136, 209);
    doc.text('ChemLab - Reporte de Equipos', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);

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

  // Exportar Experimentos a PDF (NUEVO)
  exportExperimentsToPDF(experiments: Experiment[], fileName: string) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(156, 39, 176);
    doc.text('ChemLab - Reporte de Experimentos', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);

    const tableColumn = ['Nombre', 'Estado', 'Fecha Inicio', 'Reactivos', 'Equipos'];
    const tableRows = experiments.map(e => [
      e.name.substring(0, 40),
      e.status === 0 ? 'Planificado' :
      e.status === 1 ? 'En progreso' :
      e.status === 2 ? 'Completado' :
      e.status === 3 ? 'Cancelado' : 'Fallido',
      new Date(e.startDate).toLocaleDateString(),
      (e.reagents?.length || 0).toString(),
      (e.equipment?.length || 0).toString()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [156, 39, 176] } // Morado para experimentos
    });

    doc.save(`${fileName}.pdf`);
  },

  // Exportar Dashboard como resumen ejecutivo (mejorado)
  exportSummaryToPDF(reagents: Reagent[], equipment: Equipment[], experiments: Experiment[]) {
    const doc = new jsPDF();

    // Título principal
    doc.setFontSize(24);
    doc.setTextColor(46, 125, 50);
    doc.text('ChemLab', 14, 22);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Reporte Ejecutivo', 14, 32);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 14, 40);

    // Resumen de inventario
    doc.setFontSize(14);
    doc.setTextColor(46, 125, 50);
    doc.text('Resumen de Inventario', 14, 55);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Reactivos: ${reagents.length}`, 20, 65);
    doc.text(`Total Equipos: ${equipment.length}`, 20, 72);

    const lowStock = reagents.filter(r => r.quantity < 100).length;
    const expiringSoon = reagents.filter(r => r.expiryDate && new Date(r.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;
    const calibrationDue = equipment.filter(e => e.nextCalibration && new Date(e.nextCalibration) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;

    doc.text(`Stock bajo: ${lowStock}`, 20, 79);
    doc.text(`Reactivos próximos a vencer: ${expiringSoon}`, 20, 86);
    doc.text(`Calibraciones próximas: ${calibrationDue}`, 20, 93);

    // Experimentos recientes
    let yPosition = 110;
    if (experiments.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(156, 39, 176);
      doc.text('Experimentos Recientes', 14, yPosition);
      yPosition += 10;

      const expColumn = ['Nombre', 'Estado', 'Fecha'];
      const expRows = experiments.slice(0, 8).map(e => [
        e.name.substring(0, 35),
        e.status === 0 ? 'Planificado' :
        e.status === 1 ? 'En progreso' :
        e.status === 2 ? 'Completado' :
        e.status === 3 ? 'Cancelado' : 'Fallido',
        new Date(e.startDate).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [expColumn],
        body: expRows,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [156, 39, 176] }
      });
    }

    doc.save('resumen_chemlab.pdf');
  }
};
