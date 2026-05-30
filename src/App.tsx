import { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Play, 
  Square, 
  Terminal as TerminalIcon, 
  Copy, 
  Check, 
  Zap, 
  CircuitBoard,
  RefreshCw, 
  Send, 
  Code as CodeIcon,
  Eye,
  Trash2,
  AlertCircle,
  Save,
  MessageSquare
} from 'lucide-react';

export default function App() {
  // Web Serial states
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [portInfo, setPortInfo] = useState<string>('');
  const [terminalOutput, setTerminalOutput] = useState<string>(
    '[시스템] 보드를 USB 포트에 연결하고 [ESP32 보드 연결] 버튼을 눌러주세요.\n'
  );
  
  // AI Chat states
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState<string>(
    '# 여기에 생성된 MicroPython 코드가 표시됩니다.\n# 좌측의 자연어 입력을 통해 코드를 생성하거나 직접 코드를 편집할 수 있습니다.\n\nimport machine\nimport time\n\nled = machine.Pin(2, machine.Pin.OUT)\nwhile True:\n    led.value(1)\n    time.sleep(0.5)\n    led.value(0)\n    time.sleep(0.5)\n'
  );
  const [explanation, setExplanation] = useState<string>(
    '이 코드는 ESP32 보드의 내장 LED(일반적으로 GPIO 2번에 연결됨)를 0.5초 간격으로 켜고 끄는 가장 기본적인 \'Blink\' 예제입니다.\n\n1. **라이브러리 불러오기**:\n   - `machine`: ESP32의 하드웨어 핀을 직접 제어하기 위한 MicroPython 모듈입니다.\n   - `time`: 시간 지연(sleep)을 처리하기 위한 모듈입니다.\n\n2. **하드웨어 핀 제어**:\n   - `machine.Pin(2, machine.Pin.OUT)`: GPIO 2번 핀을 신호를 내보내는 출력(OUT) 모드로 활성화합니다.\n\n3. **무한 루프 제어**:\n   - `while True:` 블록을 통해 꺼짐과 켜짐 동작을 무한히 반복합니다.\n   - `led.value(1)`은 핀에 High(3.3V) 신호를 주어 LED를 켜고, `led.value(0)`은 Low(0V) 신호를 주어 LED를 끕니다.\n   - 각 상태 변화 사이에 `time.sleep(0.5)`를 주어 0.5초(500ms) 동안 대기하게 합니다.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI states
  const [editorTab, setEditorTab] = useState<'preview' | 'edit' | 'explain'>('preview');
  const [copied, setCopied] = useState(false);
  
  // Refs for scroll and connection control
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(true);
  const isUploadingRef = useRef<boolean>(false);

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
    { label: '🌡️ 온습도 센서 DHT11', text: 'GPIO 27번에 연결된 DHT11 센서에서 온도와 습도를 2초 간격으로 읽어와서 터미널에 출력해줘. 센서 오류 예외 처리도 포함해줘.' },
    { label: '🌈 NeoPixel 무지개', text: 'GPIO 14번에 연결된 12구 NeoPixel LED 바에 무지개 회전 효과(Rainbow Cycle)를 내는 코드를 작성해줘.' },
    { label: '🌐 웹 서버 구동', text: 'ESP32가 WiFi에 접속한 후 간단한 웹 서버를 열어서, 접속한 클라이언트에게 "Hello from VibeESP32!" 메시지를 담은 HTML 페이지를 반환하는 코드를 작성해줘.' },
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
      
      const info = selectedPort.getInfo();
      const portDesc = `USB (Vendor ID: 0x${(info.usbVendorId || 0).toString(16)}, Product ID: 0x${(info.usbProductId || 0).toString(16)})`;
      setPortInfo(portDesc);
      
      setTerminalOutput(prev => prev + `[시스템] ESP32 보드에 연결되었습니다.\n`);
      
      // Start reading data stream
      keepReadingRef.current = true;
      readFromSerial(selectedPort);
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotFoundError') {
        setErrorMsg(`보드 연결 실패: ${err.message}`);
        setTerminalOutput(prev => prev + `[시스템] 연결 실패: ${err.message}\n`);
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
    setTerminalOutput(prev => prev + '[시스템] 연결이 해제되었습니다.\n');
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
            if (value && !isUploadingRef.current) {
              const text = decoder.decode(value);
              const lines = text.split('\r\n');
              const filteredLines = lines.filter(line => {
                const trimmed = line.trim();
                return (
                  !trimmed.startsWith('===') && 
                  !trimmed.startsWith('>>>') && 
                  trimmed !== '>' &&
                  trimmed !== 'raw REPL; CTRL-B to exit'
                );
              });

              if (filteredLines.length > 0) {
                setTerminalOutput(prev => prev + filteredLines.join('\n') + '\n');
              }
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
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // Web Serial API - Send helper
  const writeToSerialPort = async (data: string | Uint8Array) => {
    if (!port || !port.writable) {
      throw new Error('시리얼 포트가 연결되어 있지 않습니다.');
    }
    
    const writer = port.writable.getWriter();
    try {
      const encoder = new TextEncoder();
      const bytes = typeof data === 'string' ? encoder.encode(data) : data;
      
      const chunkSize = 64;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await writer.write(chunk);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      writer.releaseLock();
    }
  };

  // Web Serial API - Run MicroPython Code
  const runCode = async () => {
    if (!isConnected || !port) {
      alert('먼저 ESP32 보드를 연결해 주세요.');
      return;
    }
    
    try {
      // Clear terminal output and display start message
      setTerminalOutput('[시스템] 코드를 전송하고 있습니다...\n');
      isUploadingRef.current = true;
      
      // 1. Send Ctrl+C (0x03) to interrupt current script
      await writeToSerialPort(new Uint8Array([3]));
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 2. Send Ctrl+E (0x05) to enter Paste Mode
      await writeToSerialPort(new Uint8Array([5]));
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Send MicroPython code with normalized line breaks
      const sanitizedCode = code.replace(/\r?\n/g, '\r\n');
      await writeToSerialPort(sanitizedCode);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 4. Send Ctrl+D (0x04) to execute
      await writeToSerialPort(new Uint8Array([4]));
      await new Promise(resolve => setTimeout(resolve, 400));
      
      isUploadingRef.current = false;
      setTerminalOutput(prev => prev + '[시스템] 코드 전송이 완료되어 실행되었습니다.\n');
    } catch (err: any) {
      console.error(err);
      isUploadingRef.current = false;
      setTerminalOutput(prev => prev + `[시스템] 코드 전송 실패: ${err.message}\n`);
    }
  };

  // Web Serial API - Stop Execution
  const stopCode = async () => {
    if (!isConnected || !port) {
      alert('연결된 ESP32 보드가 없습니다.');
      return;
    }
    
    try {
      await writeToSerialPort(new Uint8Array([3]));
      // Clear terminal output and display stop message
      setTerminalOutput('[시스템] 실행을 중지했습니다.\n');
    } catch (err: any) {
      console.error(err);
      setTerminalOutput(`[시스템] 중지 오류: ${err.message}\n`);
    }
  };

  // AI Code Generation Streaming Handler
  const generateAICode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setEditorTab('preview'); 
    
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
        throw new Error('스트리밍을 지원하지 않는 브라우저입니다.');
      }

      const decoder = new TextDecoder();
      let streamBuffer = '';
      setCode(''); 
      setExplanation('');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || ''; 

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
              
              // Process code and description split using __EXPLANATION__ delimiter
              const parts = generatedCodeBuffer.split('__EXPLANATION__');
              if (parts.length > 1) {
                let rawCode = parts[0];
                let rawExpl = parts[1];
                
                rawCode = rawCode.replace(/^```(python|py)?\s*/i, '');
                rawCode = rawCode.replace(/\s*```$/, '');
                
                rawExpl = rawExpl.replace(/^```(text|markdown)?\s*/i, '');
                rawExpl = rawExpl.replace(/\s*```$/, '');
                
                setCode(rawCode.trim());
                setExplanation(rawExpl.trim());
              } else {
                let rawCode = parts[0];
                rawCode = rawCode.replace(/^```(python|py)?\s*/i, '');
                rawCode = rawCode.replace(/\s*```$/, '');
                setCode(rawCode.trim());
              }
            } catch (jsonErr) {
              // Ignore incomplete chunks
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

  // Light-themed Python syntax highlighters
  const colorizePythonLight = (sourceCode: string) => {
    if (!sourceCode.trim()) {
      return <span className="text-slate-400 italic"># 생성된 코드가 여기에 표시됩니다...</span>;
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
          tokens.push(<span key={key} className="text-indigo-600 font-bold">{token}</span>);
        } else if (token.startsWith('"') || token.startsWith("'")) {
          tokens.push(<span key={key} className="text-amber-700 font-medium">{token}</span>);
        } else if (!isNaN(Number(token))) {
          tokens.push(<span key={key} className="text-pink-600 font-semibold">{token}</span>);
        } else if (['Pin', 'ADC', 'PWM', 'I2C', 'SPI', 'neopixel', 'time', 'machine', 'sleep', 'sleep_ms', 'print'].includes(token)) {
          tokens.push(<span key={key} className="text-teal-600 font-bold">{token}</span>);
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
          <span className="flex-1 whitespace-pre text-slate-700 font-mono text-[13px]">{tokens}{commentPart && <span className="text-slate-400 italic font-normal font-sans">{commentPart}</span>}</span>
        </div>
      );
    });
  };

  // Copy helper
  const copyCode = () => {
    const textToCopy = editorTab === 'explain' ? explanation : code;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // File Download Helper
  const downloadFile = () => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (editorTab === 'explain') {
      content = explanation;
      filename = 'explanation.txt';
    } else {
      content = code;
      filename = 'main.py';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-md shadow-indigo-500/10">
            <Cpu className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              VibeESP32
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              바이브코딩 IoT 제어 플랫폼
            </p>
          </div>
        </div>

        {/* Board Serial Port Connection Panel */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 px-3.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 connected-glow' : 'bg-rose-400'}`} />
            <span className="text-xs font-bold text-slate-600">
              {isConnected ? '보드 연결됨' : '보드 연결 안 됨'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {isConnected ? (
            <button
              onClick={disconnectSerial}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all active:scale-95"
            >
              <CircuitBoard className="w-3.5 h-3.5 text-slate-500" />
              연결 해제
            </button>
          ) : (
            <button
              onClick={connectSerial}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
            >
              <CircuitBoard className="w-3.5 h-3.5" />
              ESP32 보드 연결
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Layout (Fixed heights and items-start layout alignment) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* AI Prompter Card - Pastel Lavender */}
          <div className="bg-violet-50/80 border border-violet-100/90 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-violet-700">
              <Zap className="w-4 h-4" />
              <h2 className="text-sm font-bold tracking-wide">
                자연어 명령 입력
              </h2>
            </div>
            
            <form onSubmit={generateAICode} className="flex items-end gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="내장 LED를 0.5초 간격으로 깜빡이게 해줘..."
                disabled={isGenerating}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (prompt.trim() && !isGenerating) {
                      generateAICode();
                    }
                  }
                }}
                className="flex-1 bg-white border border-violet-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner resize-y min-h-[60px] max-h-[150px] overflow-y-auto leading-relaxed"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed enabled:active:scale-95 flex-shrink-0 h-[46px] mb-0.5"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                생성
              </button>
            </form>

            {/* Suggestions */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-violet-500/80 font-bold uppercase tracking-wider">추천 템플릿</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sug.text)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-violet-100/50 border border-violet-100 text-violet-700 font-medium transition-all shadow-sm text-left"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* MicroPython Code Editor Card - Pastel Mint */}
          <div className="bg-emerald-50/80 border border-emerald-100/90 rounded-2xl flex flex-col shadow-sm h-[520px] overflow-hidden">
            
            {/* Editor Toolbar */}
            <div className="px-5 py-3 border-b border-emerald-100 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2 text-emerald-700">
                <CodeIcon className="w-4 h-4" />
                <h2 className="text-sm font-bold tracking-wide">
                  MicroPython 소스코드
                </h2>
              </div>

              {/* Editor Tabs, Download & Copy */}
              <div className="flex items-center gap-2">
                <div className="flex p-0.5 bg-white border border-emerald-100 rounded-lg shadow-sm">
                  <button
                    onClick={() => setEditorTab('preview')}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md transition-all ${
                      editorTab === 'preview'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    프리뷰
                  </button>
                  <button
                    onClick={() => setEditorTab('edit')}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md transition-all ${
                      editorTab === 'edit'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <CodeIcon className="w-3 h-3" />
                    직접 수정
                  </button>
                  <button
                    onClick={() => setEditorTab('explain')}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-md transition-all ${
                      editorTab === 'explain'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    코드 설명
                  </button>
                </div>

                <div className="h-4 w-px bg-emerald-200" />

                {/* Save (Download) Button */}
                <button
                  onClick={downloadFile}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 bg-white hover:bg-emerald-100/50 border border-emerald-100 rounded-lg text-emerald-700 transition-all active:scale-95 shadow-sm"
                  title={editorTab === 'explain' ? '설명 다운로드 (.txt)' : '코드 다운로드 (.py)'}
                >
                  <Save className="w-3.5 h-3.5" />
                  저장
                </button>

                {/* Copy Button */}
                <button
                  onClick={copyCode}
                  className="p-1.5 bg-white hover:bg-emerald-100/50 border border-emerald-100 rounded-lg text-emerald-700 transition-all active:scale-90 shadow-sm"
                  title="클립보드 복사"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Code Content View (Pure Light Background, Fixed height to avoid stretching) */}
            <div className="flex-1 flex overflow-hidden bg-white/90 border border-emerald-100/60 rounded-b-2xl p-4">
              
              {editorTab === 'preview' && (
                <div className="flex-1 flex overflow-auto h-full">
                  {/* Line Numbers */}
                  <div className="text-slate-400 text-right pr-4 select-none border-r border-slate-100 mr-4 font-mono text-xs flex flex-col justify-start">
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div key={i} className="min-h-[1.5rem] leading-normal">{i + 1}</div>
                    ))}
                  </div>
                  {/* Code Block Content */}
                  <div className="flex-1 text-slate-800 overflow-x-auto font-mono text-xs h-full">
                    {colorizePythonLight(code)}
                  </div>
                </div>
              )}

              {editorTab === 'edit' && (
                <div className="flex-grow flex h-full overflow-hidden">
                  {/* Line Numbers column */}
                  <pre
                    ref={lineRef}
                    className="text-slate-400 text-right pr-4 select-none border-r border-slate-100 mr-4 font-mono text-xs overflow-hidden leading-normal flex flex-col pt-0.5"
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
                    className="flex-grow bg-transparent text-slate-800 outline-none resize-none font-mono text-xs overflow-y-auto leading-normal whitespace-pre pt-0.5 tab-size-4 focus:ring-0 h-full"
                    placeholder="# 소스코드를 직접 작성할 수 있습니다."
                  />
                </div>
              )}

              {editorTab === 'explain' && (
                <div className="flex-grow overflow-y-auto h-full p-2 text-slate-700 leading-relaxed font-sans text-sm whitespace-pre-wrap">
                  {explanation || '코드 설명이 아직 생성되지 않았습니다. 자연어 명령으로 코드를 생성해 보세요.'}
                </div>
              )}

              {/* Streaming Overlay Indicator */}
              {isGenerating && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  AI 스트리밍 중...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column (Fixed height for terminal card, doesn't stretch) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Action Control Panel - Pastel Coral */}
          <div className="bg-rose-50/80 border border-rose-100/90 rounded-2xl p-5 flex flex-col gap-4 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2 text-rose-700">
              <Play className="w-4 h-4" />
              <h2 className="text-sm font-bold tracking-wide">
                보드 동작 제어
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={runCode}
                disabled={!isConnected}
                className="flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 disabled:pointer-events-none"
              >
                <Play className="w-4 h-4 fill-current" />
                코드 실행 (Run)
              </button>

              <button
                onClick={stopCode}
                disabled={!isConnected}
                className="flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 disabled:pointer-events-none"
              >
                <Square className="w-4 h-4 fill-current" />
                실행 중지 (Stop)
              </button>
            </div>

            {/* Connection Information Footer */}
            {isConnected ? (
              <div className="text-[11px] bg-white border border-rose-100/50 rounded-xl p-3 text-rose-800/80 flex flex-col gap-1">
                <span className="text-emerald-600 font-bold">● ESP32 연결 활성화됨</span>
                <span>장치 정보: {portInfo}</span>
              </div>
            ) : (
              <div className="text-[11px] bg-white border border-rose-100/50 rounded-xl p-3 text-rose-800/80 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-rose-600 font-bold block mb-0.5">ESP32 보드가 연결되지 않았습니다.</span>
                  상단의 보드 연결 단계를 마치고 포트가 열린 상태에서 코드 업로드가 가능합니다.
                </div>
              </div>
            )}
          </div>

          {/* Serial Terminal Monitor Card - Pastel Sky Blue (Strictly fixed height h-[450px]) */}
          <div className="bg-sky-50/80 border border-sky-100/90 rounded-2xl flex flex-col h-[450px] shadow-sm overflow-hidden flex-shrink-0">
            
            {/* Terminal Window Header */}
            <div className="px-4 py-3 border-b border-sky-100 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2 text-sky-700">
                <TerminalIcon className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wide">시리얼 모니터</span>
              </div>

              {/* Clear Terminal Button */}
              <button
                onClick={() => setTerminalOutput('')}
                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-white border border-sky-100 hover:bg-sky-100 text-sky-700 transition-all rounded-md shadow-sm"
              >
                <Trash2 className="w-3 h-3" />
                비우기
              </button>
            </div>

            {/* Terminal Logging Window (Off-White Background, scrolls internally within fixed height) */}
            <div className="flex-grow p-4 m-4 mt-2 bg-white/90 border border-sky-100/60 rounded-xl overflow-y-auto font-mono text-xs text-sky-950 leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap select-text font-mono">
                {terminalOutput}
                <span className="terminal-cursor ml-0.5 text-sky-600" />
              </pre>
              <div ref={terminalEndRef} />
            </div>
          </div>
        </section>

      </main>

      {/* Page Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
        <p>© 2026 VibeESP32 - Web Serial API & MicroPython IoT Control Dashboard</p>
      </footer>
    </div>
  );
}
