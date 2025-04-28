declare module 'pdf-parse' {
    function pdf(buffer: Buffer): Promise<{ text: string }>;
    export default pdf;
  }
  