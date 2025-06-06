
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig } from "./pdfStyles";

// Draw the footer section of the PDF
export function drawPdfFooter(doc: jsPDF): void {
  const { pageMargin } = pdfConfig;
  const pageSize = doc.internal.pageSize;
  const pageHeight = pageSize.height;
  
  // Add footer with subtle background
  doc.setFillColor(pdfColors.light[0], pdfColors.light[1], pdfColors.light[2]);
  doc.rect(0, pageHeight - 0.5, pageSize.width, 0.5, 'F');
  
  // Add page number in footer
  doc.setFontSize(8);
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  
  const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.text(
    `Page ${pageNumber}`, 
    pageSize.width / 2, 
    pageHeight - 0.25, 
    { align: 'center' }
  );
  
  // Add timestamp
  doc.text(
    `Generated: ${format(new Date(), 'MM/dd/yyyy HH:mm:ss')}`,
    pageSize.width - pageMargin,
    pageHeight - 0.25,
    { align: 'right' }
  );
  
  // Add company info
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text(
    pdfConfig.companyName,
    pageMargin,
    pageHeight - 0.25,
    { align: 'left' }
  );
}
