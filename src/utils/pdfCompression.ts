import { PDFDocument } from 'pdf-lib';

export const compressPDF = async (
  file: File,
  settings: {
    imageQuality: number;
    removeMetadata: boolean;
    optimizeImages: boolean;
  },
  onProgress: (progress: number) => void
): Promise<File> => {
  try {
    onProgress(10);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    onProgress(30);
    
    if (settings.removeMetadata) {
      // Remove metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setCreator('');
      pdfDoc.setProducer('');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());
    }
    
    onProgress(60);
    
    // Note: Advanced image compression within PDFs would require more complex processing
    // This is a simplified version that focuses on structure optimization
    
    onProgress(80);
    
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
    
    onProgress(100);
    
    const compressedFile = new File([pdfBytes], 
      file.name.replace(/\.pdf$/i, '_compressed.pdf'),
      { type: 'application/pdf' }
    );
    
    return compressedFile;
  } catch (error) {
    console.error('PDF compression error:', error);
    throw new Error('Failed to compress PDF');
  }
};