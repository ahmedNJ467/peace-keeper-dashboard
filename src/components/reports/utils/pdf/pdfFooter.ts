
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig } from "./pdfStyles";

// Draw the footer section of the PDF
export function drawPdfFooter(doc: jsPDF): void {
  const { pageMargin } = pdfConfig;
  const pageSize = doc.internal.pageSize;
  const pageHeight = pageSize.height;
  
  // Add footer with subtle background
  doc.setFillColor(...pdfColors.light);
  doc.rect(0, pageHeight - 0.6, pageSize.width, 0.6, 'F');
  
  // Add page number in footer
  doc.setFontSize(9);
  doc.setTextColor(...pdfColors.dark);
  
  const pageNumber = doc.getNumberOfPages();
  doc.text(
    `Page ${pageNumber}`, 
    pageSize.width / 2, 
    pageHeight - 0.3, 
    { align: 'center' }
  );
  
  // Add timestamp
  doc.text(
    `Generated: ${format(new Date(), 'MM/dd/yyyy HH:mm:ss')}`,
    pageSize.width - pageMargin,
    pageHeight - 0.3,
    { align: 'right' }
  );
  
  // Add company info
  doc.setTextColor(...pdfColors.primary);
  doc.text(
    pdfConfig.companyName,
    pageMargin,
    pageHeight - 0.3,
    { align: 'left' }
  );
}
