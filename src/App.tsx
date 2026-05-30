import { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Play, 
  Square, 
  Terminal as TerminalIcon, 
  Copy, 
  Check, 
  Zap, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Send, 
  Code as CodeIcon,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Web Serial states
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [portInfo, setPortInfo] = useState<string>('');
  const [terminalOutput, setTerminalOutput] = useState<string>(
    '=== VibeESP 시리얼 모니터 ===\n보드를 USB 포트에 연결하고 [ESP32 보드 연결] 버튼을 눌러주세요.\n'
  );
  
  // AI Chat states
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState<string>(
    '# 여기에 생성된 MicroPython 코드가 표시됩니다.\n# 좌측의 자연어 입력을 통해 코드를 생성하거나 직접 코드를 편집할 수 있습니다.\n\nimport machine\nimport time\n\nled = machine.Pin(2, machine.Pin.OUT)\nwhile True:\n    led.value(1)\n    time.sleep(0.5)\n    led.value(0)\n    time.sleep(0.5)\n'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI states
  const [editorTab, setEditorTab] = useState<'preview' | 'edit'>('preview');
  const [copied, setCopied] = useState(false);
  
  // Refs for scroll and connection control
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(true);

  // Sync terminal scroll
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput]);

  // Sync scroll between textarea and line numbers in edit mode
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineRef.current) {
      lineRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Predefined suggestion tags
  const suggestions = [
    { label: '💡 내장 LED 깜빡이기', text: 'ESP32 내장 LED(GPIO 2번)를 0.5초 간격으로 깜빡이는 무한 루프 코드를 작성해줘.' },
    { label: '📡 WiFi 연결', text: 'ESP32를 특정 WiFi SSID와 Password에 연결하고, 연결에 성공하면 IP 주소를 터미널에 출력하는 코드를 작성해줘.' },
    { label: '🌡️ 온습도 센서 DHT11', text: 'GPIO 15번에 연결된 DHT11 센서에서 온도와 습도를 2초 간격으로 읽어와서 터미널에 출력해줘. 센서 오류 예외 처리도 포함해줘.' },
    { label: '🌈 NeoPixel 무지개', text: 'GPIO 13번에 연결된 8구 NeoPixel LED 바에 무지개 회전 효과(Rainbow Cycle)를 내는 코드를 작성해줘.' },
    { label: '🌐 웹 서버 구동', text: 'ESP32가 WiFi에 접속한 후 간단한 웹 서버를 열어서, 접속한 클라이언트에게 "Hello from VibeESP!" 메시지를 담은 HTML 페이지를 반환하는 코드를 작성해줘.' },
  ];

  // Web Serial API - Connect to ESP32
  const connectSerial = async () => {
    try {
      if (!('serial' in navigator)) {
        alert('이 브라우저는 Web Serial API를 지원하지 않습니다. Chrome, Edge 또는 Opera를 사용해 주세요.');
        return;
      }
      
      setErrorMsg(null);
      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      
      setPort(selectedPort);
      setIsConnected(true);
      
      // Attempt to get port info if available
      const info = selectedPort.getInfo();
      const portDesc = `USB (Vendor ID: 0x${(info.usbVendorId || 0).toString(16)}, Product ID: 0x${(info.usbProductId || 0).toString(16)})`;
      setPortInfo(portDesc);
      
      setTerminalOutput(prev => prev + `\n[시스템] ESP32 보드에 성공적으로 연결되었습니다. (${portDesc})\n`);
      
      // Start reading data stream
      keepReadingRef.current = true;
      readFromSerial(selectedPort);
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotFoundError') {
        setErrorMsg(`보드 연결 실패: ${err.message}`);
        setTerminalOutput(prev => prev + `\n[시스템] 보드 연결에 실패했습니다: ${err.message}\n`);
      }
    }
  };

  // Web Serial API - Disconnect
  const disconnectSerial = async () => {
    keepReadingRef.current = false;
    
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.error('Reader cancel error:', e);
      }
    }
    
    if (port) {
      try {
        await port.close();
      } catch (e) {
        console.error('Port close error:', e);
      }
    }
    
    setPort(null);
    setIsConnected(false);
    setPortInfo('');
    setTerminalOutput(prev => prev + '\n[시스템] ESP32 보드 연결이 해제되었습니다.\n');
  };

  // Web Serial API - Read loop
  const readFromSerial = async (activePort: any) => {
    const decoder = new TextDecoder();
    
    while (activePort.readable && keepReadingRef.current) {
      try {
        const reader = activePort.readable.getReader();
        readerRef.current = reader;
        
        try {
          while (keepReadingRef.current) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            if (value) {
              const text = decoder.decode(value);
              setTerminalOutput(prev => prev + text);
            }
          }
        } catch (readErr) {
          console.error('Serial read error within loop:', readErr);
        } finally {
          reader.releaseLock();
          readerRef.current = null;
        }
      } catch (err: any) {
        console.error('Serial reader start error:', err);
        // Wait a bit before retrying if readable is still available
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // Web Serial API - Send helper (writes byte chunks with small delays to prevent buffer overflow)
  const writeToSerialPort = async (data: string | Uint8Array) => {
    if (!port || !port.writable) {
      throw new Error('시리얼 포트가 열려있지 않거나 쓰기 가능한 상태가 아닙니다.');
    }
    
    const writer = port.writable.getWriter();
    try {
      const encoder = new TextEncoder();
      const bytes = typeof data === 'string' ? encoder.encode(data) : data;
      
      const chunkSize = 64;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await writer.write(chunk);
        // Microsecond delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      writer.releaseLock();
    }
  };

  // Web Serial API - Run MicroPython Code (REPL Paste Mode Sequence)
  const runCode = async () => {
    if (!isConnected || !port) {
      alert('먼저 ESP32 보드를 연결해 주세요.');
      return;
    }
    
    try {
      setTerminalOutput(prev => prev + '\n>>> [시스템] MicroPython 소스코드 전송 및 실행을 준비 중입니다...\n');
      
      // 1. Send Ctrl+C (0x03) to interrupt any currently running script
      await writeToSerialPort(new Uint8Array([3]));
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 2. Send Ctrl+E (0x05) to enter Paste Mode
      await writeToSerialPort(new Uint8Array([5]));
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Normalize newlines to \r\n and send code string
      const sanitizedCode = code.replace(/\r?\n/g, '\r\n');
      await writeToSerialPort(sanitizedCode);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 4. Send Ctrl+D (0x04) to finalize Paste Mode and execute code
      await writeToSerialPort(new Uint8Array([4]));
      
      setTerminalOutput(prev => prev + '>>> [시스템] 코드가 성공적으로 전송되어 즉시 실행됩니다.\n');
    } catch (err: any) {
      console.error(err);
      setTerminalOutput(prev => prev + `\n>>> [시스템] 코드 전송 실패: ${err.message}\n`);
    }
  };

  // Web Serial API - Stop Execution
  const stopCode = async () => {
    if (!isConnected || !port) {
      alert('연결된 ESP32 보드가 없습니다.');
      return;
    }
    
    try {
      // Send Ctrl+C (0x03) to break the running loop
      await writeToSerialPort(new Uint8Array([3]));
      setTerminalOutput(prev => prev + '\n>>> [시스템] 강제 종료 신호(Ctrl+C)가 전송되었습니다. 루프가 중단됩니다.\n');
    } catch (err: any) {
      console.error(err);
      setTerminalOutput(prev => prev + `\n>>> [시스템] 강제 종료 신호 전송 실패: ${err.message}\n`);
    }
  };

  // AI Code Generation Streaming Handler
  const generateAICode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setEditorTab('preview'); // Switch to preview tab to watch it stream in real-time
    
    let generatedCodeBuffer = '';
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `서버 에러 (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('스트리밍을 지원하지 않는 브라우저이거나 응답 바디가 비어있습니다.');
      }

      const decoder = new TextDecoder();
      let streamBuffer = '';
      setCode(''); // Clear the editor

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          if (trimmed.startsWith('data: ')) {
            const dataVal = trimmed.slice(6).trim();
            if (dataVal === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(dataVal);
              const content = parsed.choices[0]?.delta?.content || '';
              generatedCodeBuffer += content;
              
              // Clean up markdown code blocks if the AI model outputs them
              let cleaned = generatedCodeBuffer;
              cleaned = cleaned.replace(/^```(python|py)?\s*/i, '');
              cleaned = cleaned.replace(/\s*```$/, '');
              
              setCode(cleaned);
            } catch (jsonErr) {
              // Ignore partial JSON chunks errors
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to colorize Python code inside preview tab
  const colorizePython = (sourceCode: string) => {
    if (!sourceCode.trim()) {
      return <span className="text-slate-500 italic"># 생성된 코드가 여기에 표시됩니다...</span>;
    }
    
    const lines = sourceCode.split('\n');
    const keywords = [
      'import', 'from', 'def', 'return', 'while', 'for', 'in', 'if', 'else', 'elif', 
      'try', 'except', 'True', 'False', 'None', 'as', 'pass', 'break', 'class', 'global'
    ];
    
    return lines.map((line, lineIdx) => {
      const commentIdx = line.indexOf('#');
      let codePart = commentIdx === -1 ? line : line.slice(0, commentIdx);
      const commentPart = commentIdx === -1 ? '' : line.slice(commentIdx);
      
      const tokens: React.ReactNode[] = [];
      let lastIdx = 0;
      
      // Matches strings, float/int digits, and alphanumeric tokens
      const regex = /("[^"]*"|'[^']*'|\b\d+\b|\b\w+\b)/g;
      let match;
      
      while ((match = regex.exec(codePart)) !== null) {
        const matchIdx = match.index;
        if (matchIdx > lastIdx) {
          tokens.push(codePart.slice(lastIdx, matchIdx));
        }
        
        const token = match[0];
        const key = `token-${lineIdx}-${matchIdx}`;
        
        if (keywords.includes(token)) {
          tokens.push(<span key={key} className="text-fuchsia-400 font-semibold">{token}</span>);
        } else if (token.startsWith('"') || token.startsWith("'")) {
          tokens.push(<span key={key} className="text-amber-200">{token}</span>);
        } else if (!isNaN(Number(token))) {
          tokens.push(<span key={key} className="text-cyan-400">{token}</span>);
        } else if (['Pin', 'ADC', 'PWM', 'I2C', 'SPI', 'neopixel', 'time', 'machine', 'sleep', 'sleep_ms', 'print'].includes(token)) {
          tokens.push(<span key={key} className="text-teal-300 font-medium">{token}</span>);
        } else {
          tokens.push(token);
        }
        
        lastIdx = regex.lastIndex;
      }
      
      if (lastIdx < codePart.length) {
        tokens.push(codePart.slice(lastIdx));
      }
      
      return (
        <div key={lineIdx} className="min-h-[1.5rem] flex items-center leading-normal">
          <span className="flex-1 whitespace-pre">{tokens}{commentPart && <span className="text-slate-500 italic font-normal">{commentPart}</span>}</span>
        </div>
      );
    });
  };

  // Copy code to clipboard helper
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-resize line numbers based on code content
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="sticky top-0 bg-[#090a0f]/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
              VibeESP
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              바이브코딩 IoT 제어 플랫폼
            </p>
          </div>
        </div>

        {/* Board Serial Port Connection Panel */}
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-1.5 px-3.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 connected-glow' : 'bg-red-500'}`} />
            <span className="text-xs font-semibold text-slate-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {isConnected ? (
            <button
              onClick={disconnectSerial}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all active:scale-95"
            >
              <WifiOff className="w-3.5 h-3.5" />
              연결 해제
            </button>
          ) : (
            <button
              onClick={connectSerial}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/10 active:scale-95 hover:shadow-indigo-500/20"
            >
              <Wifi className="w-3.5 h-3.5" />
              ESP32 보드 연결
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (AI Prompter & MicroPython Editor) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* AI Prompter Card */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold tracking-wide text-slate-200">
                자연어 명령 입력
              </h2>
            </div>
            
            <form onSubmit={generateAICode} className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="내장 LED를 0.5초 간격으로 깜빡이게 해줘..."
                disabled={isGenerating}
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed enabled:active:scale-95"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                생성
              </button>
            </form>

            {/* Micro-suggestions */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">추천 템플릿</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sug.text)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all text-left"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* MicroPython Code Editor Card */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl flex flex-col flex-1 shadow-xl min-h-[500px]">
            
            {/* Editor Toolbar */}
            <div className="px-5 py-3 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CodeIcon className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold tracking-wide text-slate-200">
                  MicroPython 소스코드
                </h2>
              </div>

              {/* Editor Tabs & Copy Button */}
              <div className="flex items-center gap-2">
                <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <button
                    onClick={() => setEditorTab('preview')}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md transition-all ${
                      editorTab === 'preview'
                        ? 'bg-slate-800 text-cyan-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    프리뷰
                  </button>
                  <button
                    onClick={() => setEditorTab('edit')}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md transition-all ${
                      editorTab === 'edit'
                        ? 'bg-slate-800 text-violet-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CodeIcon className="w-3 h-3" />
                    직접 수정
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-800" />

                <button
                  onClick={copyCode}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all active:scale-90"
                  title="코드 복사"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Code Content View */}
            <div className="flex-1 flex overflow-hidden min-h-[400px] relative font-mono text-sm bg-slate-950/70 p-4">
              
              {editorTab === 'preview' ? (
                // Syntactical Code Preview
                <div className="flex-1 flex overflow-auto max-h-[500px]">
                  {/* Preview Line Numbers */}
                  <div className="text-slate-600 text-right pr-4 select-none border-r border-slate-900 mr-4 font-mono text-xs flex flex-col justify-start">
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div key={i} className="min-h-[1.5rem] leading-normal">{i + 1}</div>
                    ))}
                  </div>
                  {/* Code Block Content */}
                  <div className="flex-1 text-slate-100 overflow-x-auto font-mono text-xs max-h-[500px]">
                    {colorizePython(code)}
                  </div>
                </div>
              ) : (
                // Editable Code Textarea
                <div className="flex-grow flex h-full max-h-[500px] overflow-hidden">
                  {/* Line Numbers column */}
                  <pre
                    ref={lineRef}
                    className="text-slate-600 text-right pr-4 select-none border-r border-slate-900 mr-4 font-mono text-xs overflow-hidden leading-normal flex flex-col pt-0.5"
                  >
                    {lineNumbers}
                  </pre>
                  {/* Editor Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={handleEditorScroll}
                    spellCheck={false}
                    className="flex-grow bg-transparent text-slate-100 outline-none resize-none font-mono text-xs overflow-y-auto leading-normal whitespace-pre pt-0.5 tab-size-4 focus:ring-0"
                    placeholder="# 소스코드를 직접 작성할 수 있습니다."
                  />
                </div>
              )}

              {/* Streaming Overlay Indicator */}
              {isGenerating && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-800 text-[10px] font-bold text-indigo-300">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  스트리밍 중...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column (Controls & Terminal Output) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Action Control Panel */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">
              하드웨어 컨트롤러
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Play Code Button */}
              <button
                onClick={runCode}
                disabled={!isConnected}
                className="flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/10 active:scale-95 disabled:pointer-events-none"
              >
                <Play className="w-4 h-4 fill-current" />
                코드 실행 (Run)
              </button>

              {/* Stop Code Button */}
              <button
                onClick={stopCode}
                disabled={!isConnected}
                className="flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-500/10 active:scale-95 disabled:pointer-events-none"
              >
                <Square className="w-4 h-4 fill-current" />
                실행 중지 (Stop)
              </button>
            </div>

            {/* Connection Information Footer */}
            {isConnected ? (
              <div className="text-[11px] bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-400 flex flex-col gap-1">
                <span className="text-emerald-400 font-bold">● ESP32 연결 활성화됨</span>
                <span>장치 정보: {portInfo}</span>
                <span>보드에 코드를 실행하면 무한 루프 상태라도 중지 버튼(Ctrl+C)으로 멈출 수 있습니다.</span>
              </div>
            ) : (
              <div className="text-[11px] bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-500 font-bold block mb-0.5">ESP32 보드가 연결되지 않았습니다.</span>
                  상단의 보드 연결 단계를 마치고 포트가 열린 상태에서 코드 업로드가 가능합니다.
                </div>
              </div>
            )}
          </div>

          {/* Serial Terminal Monitor Card */}
          <div className="bg-[#030508] border border-slate-800/80 rounded-2xl flex flex-col flex-1 shadow-2xl min-h-[450px]">
            
            {/* Terminal Window Header (mimicking desktop terminal UI) */}
            <div className="px-4 py-3 bg-[#0a0c10] border-b border-slate-800/80 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* Simulated macOS terminal circle buttons */}
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold tracking-wide">시리얼 모니터 출력</span>
                </div>
              </div>

              {/* Clear Terminal Button */}
              <button
                onClick={() => setTerminalOutput('')}
                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all rounded-md"
              >
                <Trash2 className="w-3 h-3" />
                비우기
              </button>
            </div>

            {/* Terminal Logging Window */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[350px] lg:max-h-[none] font-mono text-[11px] text-emerald-400 leading-relaxed bg-[#030508]">
              <pre className="whitespace-pre-wrap select-text">
                {terminalOutput}
                <span className="terminal-cursor ml-0.5" />
              </pre>
              <div ref={terminalEndRef} />
            </div>
          </div>
        </section>

      </main>

      {/* Page Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© 2026 VibeESP - Web Serial API & MicroPython IoT Control Dashboard</p>
      </footer>
    </div>
  );
}
