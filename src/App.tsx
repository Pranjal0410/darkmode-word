import React, { useState, useRef, useEffect } from 'react';
import mammoth from 'mammoth';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Save,
  FileText,
  Settings,
  Moon,
  Sun,
  Share2,
  FolderOpen,
  PenTool,
  Highlighter,
  Eraser
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import PDFEditor from './components/PDFEditor';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface PDFFile {
  name: string;
  url: string;
}

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [activeColor, setActiveColor] = useState('#FF69B4');
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
  
  // Type-safe tool state
  type ToolType = 'text' | 'pen' | 'highlighter' | 'eraser';
  const [activeTool, setActiveTool] = useState<ToolType>('text');

  const colors = {
    pink: '#FF69B4',
    purple: '#9370DB',
    blue: '#4169E1',
    cyan: '#00CED1',
    white: '#FFFFFF'
  };

  // Add these font options at the top of the App component
  const fontOptions = {
    'Inter': 'Inter, sans-serif',
    'Poppins': 'Poppins, sans-serif',
    'Georgia': 'Georgia, serif',
    'Arial': 'Arial, sans-serif',
    'Times New Roman': 'Times New Roman, serif',
    'Courier New': 'Courier New, monospace'
  };

  const [selectedFont, setSelectedFont] = useState('Inter');

  // Add this type for font options
  type FontOptionKey = keyof typeof fontOptions;

  // Add these state variables at the top of the App component
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }
  }, []);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    
    // Simulate auto-save
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  const convertWordToHtml = async (arrayBuffer: ArrayBuffer) => {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value
        .replace(/<p>/g, '<p class="mb-4">')
        .replace(/<h1>/g, '<h1 class="text-3xl font-bold mb-6">')
        .replace(/<h2>/g, '<h2 class="text-2xl font-semibold mb-4">')
        .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
        .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-4">')
        .replace(/<table>/g, '<table class="w-full border-collapse mb-4">')
        .replace(/<td>/g, '<td class="border border-gray-600 p-2">');
      
      return html;
    } catch (error) {
      console.error('Error converting Word document:', error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        console.log("PDF URL:", url);
        setPdfFile({
          name: file.name,
          url: url
        });
        setIsPdfMode(true);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const html = await convertWordToHtml(arrayBuffer);
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
          const text = editorRef.current.textContent || '';
          setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    }
  };

  // Ensure proper PDF loading
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF Loaded with pages:", numPages);
    setNumPages(numPages);
  };

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
  };

  // PDF Navigation functions
  const nextPage = () => {
    setPageNumber(prev => (numPages && prev < numPages) ? prev + 1 : prev);
  };

  const prevPage = () => {
    setPageNumber(prev => prev > 1 ? prev - 1 : prev);
  };

  // Zoom controls
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  // Add this function to handle font size changes
  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${size}px`;
    }
    // For PDF mode
    const pdfContainer = document.querySelector('.react-pdf__Document');
    if (pdfContainer) {
      pdfContainer.setAttribute('style', `font-size: ${size}px`);
    }
  };

  // Add this function to handle font changes for the entire document
  const handleFontChange = (font: FontOptionKey) => {
    setSelectedFont(font);
    if (editorRef.current) {
      // Apply to the main container
      editorRef.current.style.fontFamily = fontOptions[font];
      
      // Apply to all text elements inside
      const elements = editorRef.current.querySelectorAll('p, h1, h2, h3, li, td, th');
      elements.forEach(element => {
        (element as HTMLElement).style.fontFamily = fontOptions[font];
      });
    }
    // For PDF mode
    const pdfContainer = document.querySelector('.react-pdf__Document');
    if (pdfContainer) {
      pdfContainer.setAttribute('style', `font-family: ${fontOptions[font]}`);
    }
  };

  const FontSelector = ({ onFontChange }: { onFontChange: (font: FontOptionKey) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const fontCategories = {
      'Sans-Serif': ['Inter', 'Roboto', 'Nunito Sans', 'Poppins', 'Lato', 'Source Sans Pro'],
      'Serif': ['Merriweather', 'Playfair Display', 'Georgia', 'EB Garamond'],
      'Monospace': ['JetBrains Mono', 'Fira Code', 'Consolas']
    };
    
    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded transition-all ${
            darkMode 
              ? 'bg-opacity-50 hover:bg-opacity-70 bg-purple-600' 
              : 'bg-[#F1F1F1] hover:bg-[#E1E1E1] text-[#333333]'
          } text-sm`}
        >
          Font
        </button>
        
        {isOpen && (
          <div className={`absolute top-full left-0 mt-2 w-64 rounded-lg shadow-xl p-2 z-50 ${
            darkMode ? 'bg-[#1A1A3F]' : 'bg-white border border-gray-200'
          }`}>
            {Object.entries(fontCategories).map(([category, fonts]) => (
              <div key={category} className="mb-4">
                <div className={`text-xs uppercase tracking-wider mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {category}
                </div>
                {fonts.map(font => (
                  <button
                    key={font}
                    onClick={() => {
                      onFontChange(font as FontOptionKey);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded ${
                      darkMode 
                        ? 'hover:bg-purple-600 hover:bg-opacity-50' 
                        : 'hover:bg-gray-100'
                    }`}
                    style={{ fontFamily: fontOptions[font as FontOptionKey] }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  // Add these handlers
  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleAlignLeft = () => execCommand('justifyLeft');
  const handleAlignCenter = () => execCommand('justifyCenter');
  const handleAlignRight = () => execCommand('justifyRight');
  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberList = () => execCommand('insertOrderedList');

  const exportToPDF = () => {
    const element = editorRef.current;
    if (element) {
      const pdf = new jsPDF();

      // Get the content of the editor
      const content = element.innerHTML;

      // Add the content to the PDF
      pdf.html(content, {
        callback: (doc) => {
          doc.save('document.pdf');
        },
        x: 10,
        y: 10,
        width: 190, // Adjust width as needed
        windowWidth: 650 // Adjust window width as needed
      });
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    document.body.classList.toggle('light-mode', !darkMode);
  };

  // Add this function to handle color selection
  const handleColorSelect = (color: string) => {
    setActiveColor(color);
    // Apply the selected color to the text editor or drawing tool
    if (editorRef.current) {
      editorRef.current.style.color = color; // For text color
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A1F] text-gray-100' : 'light-mode'}`}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".doc,.docx,.pdf"
        onChange={handleFileChange}
      />

      {/* Enhanced Top Navigation */}
      <div className="bg-gradient-to-r from-[#1A1A3F] to-[#2A1A4A] p-3 border-b border-purple-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-[#00AEEF]" />
            <span className="font-semibold">Dark Editor</span>
            {fileName && (
              <span className="ml-4 text-sm opacity-75 fade-in-up">- {fileName}</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="btn-primary p-1.5 rounded flex items-center space-x-2"
              onClick={handleFileOpen}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="text-sm">Open</span>
            </button>
            <button className="p-1.5 rounded hover:bg-[#2A2A2A]">
              <Save className="w-5 h-5" />
            </button>
            <button className="p-1.5 rounded hover:bg-[#2A2A2A]">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              className="p-1.5 rounded hover:bg-[#2A2A2A]"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-1.5 rounded hover:bg-[#2A2A2A]">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-1">
          <button className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <FontSelector onFontChange={handleFontChange} />
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <button onClick={handleBold} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={handleItalic} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={handleUnderline} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <Underline className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <button onClick={handleAlignLeft} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={handleAlignCenter} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={handleAlignRight} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <AlignRight className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <button onClick={handleBulletList} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <List className="w-4 h-4" />
          </button>
          <button onClick={handleNumberList} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <button onClick={() => handleToolChange('pen')} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <PenTool className="w-4 h-4" />
          </button>
          <button onClick={() => handleToolChange('highlighter')} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <Highlighter className="w-4 h-4" />
          </button>
          <button onClick={() => handleToolChange('eraser')} className="p-1.5 rounded hover:bg-[#2A2A2A]">
            <Eraser className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleFontSizeChange(Math.max(8, fontSize - 2))}
              className="p-1.5 rounded hover:bg-[#2A2A2A]"
            >
              A-
            </button>
            <span className="text-sm">{fontSize}px</span>
            <button 
              onClick={() => handleFontSizeChange(Math.min(72, fontSize + 2))}
              className="p-1.5 rounded hover:bg-[#2A2A2A]"
            >
              A+
            </button>
          </div>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <button 
            className="p-1.5 rounded hover:bg-[#2A2A2A]"
            onClick={exportToPDF}
          >
            Export to PDF
          </button>
        </div>
        <div className="flex space-x-4 mt-2">
          <button 
            className={`px-4 py-2 rounded-lg ${
              !isPdfMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-opacity-50'
            } transition-all`}
            onClick={() => setIsPdfMode(false)}
          >
            Text Editor
          </button>
          <button 
            className={`px-4 py-2 rounded-lg ${
              isPdfMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-opacity-50'
            } transition-all`}
            onClick={() => setIsPdfMode(true)}
          >
            PDF Editor
          </button>
        </div>
      </div>

      {/* Add this after the top navigation and before main content */}
      {!pdfFile && !fileName && (
        <div className={`p-8 flex flex-col items-center justify-center ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          <div className="max-w-2xl w-full">
            <h2 className="text-2xl font-semibold mb-6">Choose Your Font</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(fontOptions).map(([name, family]) => (
                <button
                  key={name}
                  onClick={() => handleFontChange(name as FontOptionKey)}
                  className={`p-4 rounded-lg transition-all ${
                    darkMode 
                      ? 'hover:bg-[#2A1A4A] border border-purple-800' 
                      : 'hover:bg-blue-50 border border-blue-200'
                  } ${selectedFont === name ? (
                    darkMode 
                      ? 'bg-[#2A1A4A] ring-2 ring-purple-500' 
                      : 'bg-blue-50 ring-2 ring-blue-500'
                  ) : ''}`}
                  style={{ fontFamily: family }}
                >
                  <p className="text-lg mb-2">{name}</p>
                  <p className="opacity-75 text-sm">The quick brown fox jumps over the lazy dog</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tool Panel */}
      <div className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-[#1A1A3F] p-3 rounded-r-lg shadow-xl">
        <div className="flex flex-col space-y-4">
          {Object.entries(colors).map(([name, color]) => (
            <button
              key={name}
              className={`w-6 h-6 md:w-8 md:h-8 rounded-full transition-transform ${
                activeColor === color ? 'scale-110 ring-2 ring-white' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex justify-center h-[calc(100vh-120px)] bg-[#0A0A1F] overflow-y-auto">
        <div className="w-[850px] h-full py-8">
          {isPdfMode ? (
            <div className="bg-white rounded-lg shadow-xl p-4">
              {pdfFile && (
                <>
                  <Document
                    file={pdfFile.url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error("PDF Load Error:", error)}
                    className="flex justify-center"
                    error={<div>An error occurred while loading the PDF.</div>}
                    noData={<div>No PDF file selected.</div>}
                    loading={<div>Loading PDF...</div>}
                  >
                    <Page 
                      pageNumber={pageNumber}
                      scale={scale}
                      className="shadow-lg"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      error={<div>An error occurred while loading the page.</div>}
                    />
                  </Document>
                  
                  {/* PDF Controls */}
                  <div className="fixed bottom-4 right-4 bg-[#1A1A3F] p-2 rounded-lg shadow-xl">
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button className="tool-button" onClick={prevPage}>Previous</button>
                        <button className="tool-button" onClick={nextPage}>Next</button>
                      </div>
                      <div className="flex space-x-2">
                        <button className="tool-button" onClick={zoomOut}>-</button>
                        <span className="px-2">{Math.round(scale * 100)}%</span>
                        <button className="tool-button" onClick={zoomIn}>+</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={`bg-gradient-to-br ${
              darkMode 
                ? 'from-[#1A1A3F] to-[#2A1A4A]' 
                : 'from-white to-blue-50'
            } rounded-lg shadow-xl overflow-hidden`}>
              <div className="min-h-[1056px] w-full bg-opacity-50 px-16 py-12">
                <div
                  ref={editorRef}
                  className="prose prose-invert max-w-none focus:outline-none"
                  contentEditable
                  onInput={handleContentChange}
                  data-placeholder="Start crafting your document..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Status Bar */}
      <div className="h-10 bg-gradient-to-r from-[#1A1A3F] to-[#2A1A4A] border-t border-purple-800 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span>Words: {wordCount}</span>
          {isPdfMode && numPages && <span>Page {pageNumber} of {numPages}</span>}
        </div>
        <div className={`flex items-center ${isSaving ? 'text-pink-400' : 'text-green-400'}`}>
          {isSaving ? 'Saving...' : 'All changes saved'}
        </div>
      </div>

      <PDFEditor />
    </div>
  );
}

export default App;