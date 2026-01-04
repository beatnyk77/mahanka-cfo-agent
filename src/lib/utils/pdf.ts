import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function generateFinancialPDF(data: any) {
    const doc = new jsPDF() as any;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(5, 11, 24); // Mahanka Navy
    doc.text('Mahanka CFO Agent - Financial Report', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    doc.setLineWidth(0.5);
    doc.line(14, 35, 196, 35);

    // Content
    let yPos = 45;
    doc.setFontSize(16);
    doc.text('Summary Analysis', 14, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(0);
    const splitText = doc.splitTextToSize(data.summary || 'No summary provided.', 180);
    doc.text(splitText, 14, yPos);
    yPos += splitText.length * 7;

    // Tables (if provided)
    if (data.metrics) {
        doc.autoTable({
            startY: yPos,
            head: [['Metric', 'Value']],
            body: Object.entries(data.metrics).map(([key, val]) => [key, val]),
            theme: 'striped',
            headStyles: { fillStyle: [10, 17, 40] }
        });
    }

    // Save/Return
    const pdfOutput = doc.output('datauristring');
    return pdfOutput;
}
