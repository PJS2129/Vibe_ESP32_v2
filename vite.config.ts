import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Helper to load Gemini API Key from .env.local
function getGeminiApiKey() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('GEMINI_API_KEY=')) {
          const val = line.substring(line.indexOf('=') + 1).trim();
          return val.replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (e) {
    console.error('Error loading API Key from .env.local:', e);
  }
  return process.env.GEMINI_API_KEY || '';
}

const SYSTEM_PROMPT = `You are an expert MicroPython firmware engineer specializing in ESP32 hardware programming.
Your task is to generate production-quality, immediately executable MicroPython code.

STRICT OUTPUT FORMAT — follow exactly, no exceptions:
1. Begin your response with the VERY FIRST LINE of Python code. No introduction, no greeting, no "Here's the code".
2. Do NOT use markdown. No backticks, no code fences (no \`\`\`python or \`\`\`).
3. After the last line of code, output this exact delimiter on its own line: __EXPLANATION__
4. After the delimiter, write a step-by-step explanation in Korean. No code blocks in the explanation.

EXPLANATION FORMAT (strict structure, no deviation):
The explanation must have exactly two sections in this order:

[2-3줄의 전체 동작 요약. 어떤 하드웨어를 어떻게 제어하는지 간결하게.]

**핵심 문법**
- \`코드\`: 한 줄 설명
- \`코드\`: 한 줄 설명
(중요한 문법/API 3~6개만. 당연한 것은 생략.)

EXAMPLE of correct output format:
import machine
import time
led = machine.Pin(2, machine.Pin.OUT)
while True:
    led.value(1)
    time.sleep(0.5)
__EXPLANATION__
GPIO 2번 내장 LED를 0.5초 간격으로 켜고 끄는 코드입니다. machine 모듈로 핀을 제어하고 while True 루프로 무한 반복합니다.

**핵심 문법**
- \`machine.Pin(2, Pin.OUT)\`: GPIO 2번을 출력 모드로 설정
- \`led.value(1) / led.value(0)\`: 핀에 High(3.3V) / Low(0V) 신호 출력
- \`time.sleep(0.5)\`: 0.5초 대기

ESP32 / MICROPYTHON HARDWARE CONSTRAINTS (follow strictly):
- No threading module — use time.ticks_ms() based non-blocking loops instead of blocking sleep in time-sensitive code
- RAM is ~300KB — avoid large list allocations, heavy string concatenation in loops, or redundant imports
- Always use SoftI2C (from machine import SoftI2C) over hardware I2C for better reliability
- Always declare modified globals with the 'global' keyword inside functions
- Every while True loop must contain time.sleep_ms(10) or equivalent to prevent watchdog timer resets
- Wrap all hardware I/O (sensors, I2C, SPI, network, file) in try-except blocks
- Available built-in libraries: machine, time, network, socket, random, os, sys, ubinascii, neopixel, dht
- Valid ESP32 GPIO pins: 0,2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33,34,35,36,39
- GPIO 34, 35, 36, 39 are INPUT ONLY — never configure them as output
- GPIO 6–11 are reserved for internal flash — never use them
- Built-in LED is GPIO 2 on standard ESP32 dev boards
- Use time.ticks_diff(current, last) for elapsed time — never subtract ticks directly (handles 32-bit rollover correctly)

DEFAULT PIN ASSIGNMENTS (use when user does not specify):
- Built-in LED: GPIO 2
- DHT11 / DHT22 data pin: GPIO 27
- NeoPixel data pin: GPIO 14 (default 12 LEDs)
- I2C SDA: GPIO 21, SCL: GPIO 22
- PWM / Servo signal: GPIO 13

CODE QUALITY RULES:
- Define pin numbers and config values as named constants (ALL_CAPS) at the top
- Initialize all hardware objects before the main loop
- Add Korean comments that explain WHY, not just what each section does
- Print [시스템] prefixed status messages to serial for key events and errors
- For sensor values, validate ranges before using (e.g. temperature between -40 and 80 for DHT11)
- Prefer concise, flat scripts over unnecessary class abstractions for simple tasks

CRITICAL MICROPYTHON-SPECIFIC RULES:
- NEVER reimplement existing libraries (ssd1306, dht, neopixel, machine, etc.) — always import them directly
- The ssd1306 library IS already installed on the board: always use "import ssd1306" and "ssd1306.SSD1306_I2C(...)"
- NEVER use "if __name__ == '__main__':" — it does not work when code is run via exec(). Write flat top-level code only
- NEVER use f-strings (f"...") — use str.format() or string concatenation for MicroPython compatibility
- For geometric calculations (circles, stars, angles), use the math module: import math, math.sin(), math.cos(), math.radians()
- A proper 5-pointed star requires 10 alternating points (outer/inner radius) at 36-degree intervals using trigonometry`;

// Static templates for quick dev-server suggestions with descriptions
const LED_CODE = `# VibeESP32 - 내장 LED 깜빡이기 (GPIO 2)
import machine
import time

# GPIO 2번 핀을 출력용으로 설정 (ESP32 내장 LED)
led = machine.Pin(2, machine.Pin.OUT)

print("[시스템] LED 깜빡이기 시작 (Pin: 2)")
while True:
    led.value(1)  # LED 켜기 (High)
    time.sleep(0.5)
    led.value(0)  # LED 끄기 (Low)
    time.sleep(0.5)
__EXPLANATION__
이 코드는 ESP32 보드의 내장 LED(일반적으로 GPIO 2번에 연결됨)를 0.5초 간격으로 켜고 끄는 가장 기본적인 'Blink' 예제입니다.

1. **라이브러리 불러오기**:
   - \`machine\`: ESP32의 하드웨어 핀을 직접 제어하기 위한 MicroPython 모듈입니다.
   - \`time\`: 시간 지연(sleep)을 처리하기 위한 모듈입니다.

2. **하드웨어 핀 제어**:
   - \`machine.Pin(2, machine.Pin.OUT)\`: GPIO 2번 핀을 신호를 내보내는 출력(OUT) 모드로 활성화합니다.

3. **무한 루프 제어**:
   - \`while True:\` 블록을 통해 꺼짐과 켜짐 동작을 무한히 반복합니다.
   - \`led.value(1)\`은 핀에 High(3.3V) 신호를 주어 LED를 켜고, \`led.value(0)\`은 Low(0V) 신호를 주어 LED를 끕니다.
   - 각 상태 변화 사이에 \`time.sleep(0.5)\`를 주어 0.5초(500ms) 동안 대기하게 합니다.
`;

const WIFI_CODE = `# VibeESP32 - WiFi 연결 및 IP 출력
import network
import time

ssid = "Your_WiFi_SSID"
password = "Your_WiFi_Password"

wlan = network.WLAN(network.STA_IF)
wlan.active(True)

print("[시스템] WiFi 연결 시도 중: {}...".format(ssid))
wlan.connect(ssid, password)

# 연결될 때까지 대기 (최대 10초)
max_wait = 10
while max_wait > 0:
    if wlan.isconnected():
        break
    max_wait -= 1
    print("연결 대기 중...")
    time.sleep(1)

if wlan.isconnected():
    print("[시스템] WiFi 연결 성공!")
    print("네트워크 정보:", wlan.ifconfig())
else:
    print("[시스템] WiFi 연결 실패. SSID와 비밀번호를 확인해 주세요.")
__EXPLANATION__
이 코드는 ESP32 보드를 주변의 WiFi 공유기(AP)에 연결하고, 할당받은 IP 주소를 터미널에 출력하는 네트워크 통신 기본 예제입니다.

1. **WiFi 모듈 설정**:
   - \`network.WLAN(network.STA_IF)\`: ESP32를 다른 공유기에 접속하는 무선 단말기(Station) 모드로 설정합니다.
   - \`wlan.active(True)\`: 무선 랜 카드를 활성화합니다.

2. **접속 제어**:
   - \`wlan.connect(ssid, password)\`: 지정한 SSID와 비밀번호를 이용해 WiFi 신호에 연결을 시도합니다.

3. **연결 대기**:
   - \`while\` 루프를 사용해 최대 10초 동안 1초 간격으로 연결 성공 여부(\`wlan.isconnected()\` )를 확인합니다.

4. **네트워크 정보 획득**:
   - 성공 시 \`wlan.ifconfig()\`를 호출하여 ESP32가 할당받은 IP 주소, 서브넷 마스크, 게이트웨이, DNS 주소 등의 네트워크 설정을 확인하여 콘솔에 인쇄합니다.
`;

const DHT11_CODE = `# VibeESP32 - DHT11 온습도 센서 측정 (GPIO 27)
import machine
import dht
import time

# GPIO 27번 핀에 DHT11 센서 데이터 핀 연결 설정
sensor = dht.DHT11(machine.Pin(27))

print("[시스템] DHT11 온습도 측정 시작 (Pin: 27)")
while True:
    try:
        sensor.measure()
        temp = sensor.temperature()
        hum = sensor.humidity()
        print("온도: {} C, 습도: {} %".format(temp, hum))
    except OSError as e:
        # 온습도 센서 읽기 실패 시 예외 처리
        print("[에러] DHT11 센서 데이터를 읽을 수 없습니다:", e)
    
    time.sleep(2)  # DHT11 센서는 최소 2초 간격 측정 권장
__EXPLANATION__
이 코드는 GPIO 27번 핀에 연결된 DHT11 센서로부터 주기적으로 주변 대기 온도와 상대 습도 데이터를 읽어와서 출력해 주는 모니터링 예제입니다.

1. **센서 연결 및 제어**:
   - \`import dht\`: 온습도 측정용 DHT 라이브러리를 임포트합니다.
   - \`dht.DHT11(machine.Pin(27))\`: GPIO 27번 디지털 핀을 DHT11 센서용 데이터 입력 라인으로 구성합니다.

2. **안정적인 데이터 수집**:
   - \`sensor.measure()\`를 통해 물리적인 측정을 수행한 뒤, \`temperature()\`와 \`humidity()\` 함수로 값을 추출합니다.
   - DHT11 센서는 하드웨어 한계상 너무 자주 읽으면 응답을 멈추기 때문에 루프 끝에 \`time.sleep(2)\`로 2초의 딜레이를 주었습니다.

3. **try-except 예외 처리**:
   - 센서 핀의 연결이 헐겁거나 단선될 때 발생하는 \`OSError\` 예외를 안전하게 잡아내어(\`except OSError\`), 에러 메시지만 출력하고 루프가 뻗지 않고 측정을 계속 시도하게 합니다.
`;

const NEOPIXEL_CODE = `# VibeESP32 - NeoPixel 무지개 회전 효과 (GPIO 14, 12개 LED)
from machine import Pin
from neopixel import NeoPixel
import time

# GPIO 14번 핀에 12개의 LED를 가진 NeoPixel 바 설정
pin = Pin(14, Pin.OUT)
np = NeoPixel(pin, 12) 

def wheel(pos):
    # 0부터 255 사이의 값을 입력받아 R-G-B 색상 튜플을 반환하는 함수
    if pos < 85:
        return (255 - pos * 3, pos * 3, 0)
    if pos < 170:
        pos -= 85
        return (0, 255 - pos * 3, pos * 3)
    else:
        pos -= 170
        return (pos * 3, 0, 255 - pos * 3)

print("[시스템] NeoPixel 무지개 효과 동작 중 (Pin: 14, LEDs: 12)")
while True:
    for j in range(255):
        for i in range(12):
            # 12개의 LED에 고르게 분산된 색상 인덱스 계산
            rc_index = (i * 256 // 12) + j
            np[i] = wheel(rc_index & 255)
        np.write()
        time.sleep_ms(15)  # 부드러운 회전 효과를 위한 지연 시간
__EXPLANATION__
이 코드는 GPIO 14번 디지털 출력 핀에 연결된 12구의 NeoPixel RGB LED 스트립에 대해 부드러운 무지개 색상이 순환하는 효과(Rainbow Cycle)를 제공하는 화려한 비주얼 제어 예제입니다.

1. **라이브러리 불러오기**:
   - \`neopixel\`: WS2812B(NeoPixel) LED 소자를 어드레서블 방식으로 편리하게 제어하기 위한 라이브러리입니다.
   - \`NeoPixel(pin, 12)\`: 14번 핀에 12개의 픽셀이 직렬 연결되어 있음을 지정합니다.

2. **컬러 스펙트럼 변환 (\`wheel\` 함수)**:
   - 0부터 255까지의 단일 입력값(\`pos\`)을 빨강 ➡️ 초록 ➡️ 파랑 ➡️ 빨강으로 점진 변환하는 3차원 RGB 튜플 \`(R, G, B)\`로 매핑하여 무지개 색상을 구현합니다.

3. **부드러운 애니메이션 구현**:
   - 외부 루프(\`j\`)와 내부 루프(\`i\`)를 중첩하여 각 픽셀 간 적절한 위상차(\`i * 256 // 12\`)를 부여해 색을 입힙니다.
   - \`np.write()\`를 호출해야 계산된 색상이 실제 LED 소자에 동시 전송되어 갱신됩니다.
   - \`time.sleep_ms(15)\`를 추가하여 회전이 너무 빠르게 돌아 깨지지 않고 사람 눈에 부드럽게 보이도록 조정했습니다.
`;

const WEBSERVER_CODE = `# VibeESP32 - 간단한 웹 서버 구동
import machine
import network
import socket
import time

# WiFi 접속 설정
ssid = "Your_WiFi_SSID"
password = "Your_WiFi_Password"

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, password)

print("[시스템] WiFi 연결 대기 중...")
for _ in range(10):
    if wlan.isconnected():
        break
    time.sleep(1)

if not wlan.isconnected():
    print("[시스템] WiFi 연결 실패. 웹 서버 실행을 위해 WiFi 설정이 필요합니다.")
else:
    ip = wlan.ifconfig()[0]
    print("[시스템] WiFi 연결 성공! IP 주소:", ip)
    
    # 80번 포트로 TCP 소켓 개방
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 80))
    s.listen(5)
    print("[시스템] 웹 서버가 80 포트에서 실행 중입니다. 브라우저로 접속해 보세요.")
    
    while True:
        try:
            conn, addr = s.accept()
            print("[시스템] 클라이언트 접속 감지:", addr)
            request = conn.recv(1024)
            
            # HTML 반응 메시지 전송
            response = """HTTP/1.1 200 OK\\r\\nContent-Type: text/html\\r\\nConnection: close\\r\\n\\r\\n
            <html>
            <head>
                <meta charset="utf-8">
                <title>VibeESP32 Web Server</title>
                <style>
                    body { font-family: sans-serif; text-align: center; margin-top: 50px; background: #f0f2f5; }
                    .card { background: white; padding: 30px; border-radius: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    h1 { color: #4f46e5; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Hello from VibeESP32!</h1>
                    <p>MicroPython 웹 서버가 성공적으로 동작하고 있습니다.</p>
                </div>
            </body>
            </html>
            """
            conn.send(response)
            conn.close()
        except Exception as e:
            print("[에러] 소켓 통신 오류:", e)
__EXPLANATION__
이 코드는 ESP32 보드를 공유기(WiFi)에 연동한 후 내부 망의 IP 주소 80번 포트(HTTP 기본 포트)를 열어 간단한 웹페이지 웹 서버 역할을 하도록 만드는 통신 제어 예제입니다.

1. **WiFi 모드 준비**:
   - 무선 인터넷 공유기에 접속하여 ESP32의 고유 내부 IP 주소를 발급받습니다.

2. **소켓 프로그래밍**:
   - \`socket.socket(socket.AF_INET, socket.SOCK_STREAM)\`: TCP/IP 프로토콜 기반 소켓을 정의합니다.
   - \`s.bind(('', 80))\`: 80번 웹 포트를 열어줍니다.
   - \`s.listen(5)\`: 클라이언트의 연결을 받을 수 있도록 최대 5개의 연결 대기 큐를 구성합니다.

3. **HTTP 응답 처리**:
   - \`conn, addr = s.accept()\`: 웹 브라우저가 보드의 IP 주소로 접속하면 연결을 승인합니다.
   - \`conn.recv(1024)\`: 웹 브라우저 접속 요청 헤더를 확인합니다.
   - \`conn.send(response)\`: 브라우저에게 "Hello from VibeESP32!"와 한글 소개가 적용된 깔끔한 카드 스타일 HTML 레이아웃 페이지를 반환합니다.
   - 전송을 완료한 후 \`conn.close()\`로 개별 세션 연결 소켓을 종료하여 리소스를 해제합니다.
`;

async function writeStaticCodeStream(res: any, code: string) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  
  const chunks = code.match(/[\s\S]{1,16}/g) || [code];
  for (const chunk of chunks) {
    const payload = {
      choices: [{
        delta: { content: chunk }
      }]
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    await new Promise(resolve => setTimeout(resolve, 8));
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'api-chat-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/chat' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const { prompt } = JSON.parse(body);
                if (!prompt) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Prompt is required' }));
                  return;
                }

                const cleanPrompt = prompt.toLowerCase().replace(/\s+/g, '');
                
                // Intercept suggestions locally - check specific modules (like webserver) before generic ones (like wifi)
                if (cleanPrompt.includes('dht11') || cleanPrompt.includes('온습도') || cleanPrompt.includes('dht') || cleanPrompt.includes('27번')) {
                  await writeStaticCodeStream(res, DHT11_CODE);
                  return;
                }
                if (cleanPrompt.includes('neopixel') || cleanPrompt.includes('네오픽셀') || cleanPrompt.includes('무지개') || cleanPrompt.includes('14번')) {
                  await writeStaticCodeStream(res, NEOPIXEL_CODE);
                  return;
                }
                if (cleanPrompt.includes('웹서버') || cleanPrompt.includes('webserver') || cleanPrompt.includes('웹페이지') || cleanPrompt.includes('소켓') || cleanPrompt.includes('서버')) {
                  await writeStaticCodeStream(res, WEBSERVER_CODE);
                  return;
                }
                if (cleanPrompt.includes('led') && (cleanPrompt.includes('깜빡') || cleanPrompt.includes('반복') || cleanPrompt.includes('1초'))) {
                  await writeStaticCodeStream(res, LED_CODE);
                  return;
                }
                if (cleanPrompt.includes('wifi') || cleanPrompt.includes('와이파이') || cleanPrompt.includes('인터넷')) {
                  await writeStaticCodeStream(res, WIFI_CODE);
                  return;
                }

                // Gemini API 호출
                const apiKey = getGeminiApiKey();
                if (!apiKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gemini API Key가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해 주세요.' }));
                  return;
                }

                // Few-shot 예시: 모델에게 올바른 출력 패턴을 직접 보여줌
                const fewShotExamples = [
                  {
                    role: 'user',
                    parts: [{ text: '내장 LED를 1초마다 깜빡이게 해줘' }]
                  },
                  {
                    role: 'model',
                    parts: [{ text: [
                      'import machine',
                      'import time',
                      '',
                      'LED_PIN = 2',
                      'BLINK_INTERVAL = 1.0',
                      '',
                      'led = machine.Pin(LED_PIN, machine.Pin.OUT)',
                      "print('[시스템] LED 깜빡이기 시작 (GPIO {})'.format(LED_PIN))",
                      'while True:',
                      '    led.value(1)',
                      '    time.sleep(BLINK_INTERVAL)',
                      '    led.value(0)',
                      '    time.sleep(BLINK_INTERVAL)',
                      '__EXPLANATION__',
                      'GPIO 2번 내장 LED를 1초 간격으로 켜고 끄는 코드입니다. machine 모듈로 핀을 출력 모드로 설정하고 while True 루프에서 켜고/끄기를 반복합니다.',
                      '',
                      '**핵심 문법**',
                      '- `machine.Pin(LED_PIN, machine.Pin.OUT)`: GPIO 핀을 출력 모드로 초기화',
                      '- `led.value(1) / led.value(0)`: 핀에 High/Low 신호 출력으로 LED 제어',
                      '- `time.sleep(BLINK_INTERVAL)`: 지정한 초 동안 실행 일시 정지',
                    ].join('\n') }]
                  },
                  {
                    role: 'user',
                    parts: [{ text: 'ssd1306 OLED 화면 중앙에 별을 그려줘' }]
                  },
                  {
                    role: 'model',
                    parts: [{ text: [
                      'import machine',
                      'import math',
                      'import ssd1306',
                      'from machine import SoftI2C, Pin',
                      '',
                      'I2C_SDA = 21',
                      'I2C_SCL = 22',
                      'OLED_W = 128',
                      'OLED_H = 64',
                      'STAR_OUTER_R = 25',
                      'STAR_INNER_R = 10',
                      '',
                      'i2c = SoftI2C(sda=Pin(I2C_SDA), scl=Pin(I2C_SCL))',
                      'oled = ssd1306.SSD1306_I2C(OLED_W, OLED_H, i2c)',
                      '',
                      'def draw_star(cx, cy, outer_r, inner_r, color):',
                      '    # 외곽/내부 반지름 교대, 36도 간격, 꼭대기(-90도)부터 시작',
                      '    points = []',
                      '    for i in range(10):',
                      '        angle = math.radians(-90 + i * 36)',
                      '        r = outer_r if i % 2 == 0 else inner_r',
                      '        points.append((int(cx + r * math.cos(angle)), int(cy + r * math.sin(angle))))',
                      '    for i in range(10):',
                      '        x1, y1 = points[i]',
                      '        x2, y2 = points[(i + 1) % 10]',
                      '        oled.line(x1, y1, x2, y2, color)',
                      '',
                      "print('[시스템] 별 그리기 시작')",
                      'oled.fill(0)',
                      'draw_star(OLED_W // 2, OLED_H // 2, STAR_OUTER_R, STAR_INNER_R, 1)',
                      'oled.show()',
                      "print('[시스템] 완료')",
                      '__EXPLANATION__',
                      'ssd1306 라이브러리로 OLED를 초기화한 뒤 삼각함수로 5각별 10개 꼭지점을 계산해 선으로 연결합니다. 외곽/내부 반지름이 36도마다 교대하여 별 모양이 만들어집니다.',
                      '',
                      '**핵심 문법**',
                      '- `SoftI2C(sda=Pin(21), scl=Pin(22))`: 소프트웨어 I2C 버스 초기화',
                      '- `ssd1306.SSD1306_I2C(W, H, i2c)`: 설치된 라이브러리로 OLED 객체 생성 (직접 구현 금지)',
                      '- `math.radians(-90 + i*36)`: 각도를 라디안으로 변환, 꼭대기(-90도)부터 36도 간격',
                      '- `i % 2 == 0`: 짝수 인덱스=외곽, 홀수=내부로 교대하여 별 윤곽 생성',
                      '- `oled.line(x1,y1,x2,y2,1)`: 두 꼭지점 사이를 흰색 선으로 연결',
                    ].join('\n') }]
                  },
                  {
                    role: 'user',
                    parts: [{ text: prompt }]
                  }
                ];

                const geminiResponse = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: fewShotExamples,
                      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                      generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 8192,
                        thinkingConfig: { thinkingBudget: 0 },
                      },
                    }),
                  }
                );

                if (!geminiResponse.ok) {
                  const errorText = await geminiResponse.text();
                  res.writeHead(geminiResponse.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: `Gemini API 오류: ${errorText}` }));
                  return;
                }

                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                });

                // Gemini SSE → OpenAI SSE 포맷 변환
                const reader = geminiResponse.body?.getReader();
                const decoder = new TextDecoder();
                if (reader) {
                  let buffer = '';
                  while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (!trimmed.startsWith('data: ')) continue;
                      const dataVal = trimmed.slice(6).trim();
                      if (!dataVal || dataVal === '[DONE]') continue;
                      try {
                        const parsed = JSON.parse(dataVal);
                        const parts = parsed.candidates?.[0]?.content?.parts || [];
                        // thinking 토큰 제외하고 실제 텍스트만 합산
                        const text = parts
                          .filter((p: any) => !p.thought)
                          .map((p: any) => p.text || '')
                          .join('');
                        if (text) {
                          const openaiFormat = { choices: [{ delta: { content: text } }] };
                          res.write(`data: ${JSON.stringify(openaiFormat)}\n\n`);
                        }
                      } catch {}
                    }
                  }
                }
                res.write('data: [DONE]\n\n');
                res.end();
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
})
