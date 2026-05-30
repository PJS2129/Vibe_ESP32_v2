export const config = {
  runtime: 'edge',
};

// Static templates for quick suggestions (to avoid API key dependency and guarantee correct pin outs)
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

const TETRIS_CODE = `import machine
import time
import random
from machine import Pin, SoftI2C
import ssd1306
# 1. 하드웨어 설정
i2c = SoftI2C(scl=Pin(22), sda=Pin(21))
oled = ssd1306.SSD1306_I2C(128, 64, i2c)
touch_left  = Pin(33, Pin.IN)
touch_right = Pin(32, Pin.IN)
touch_rot   = Pin(35, Pin.IN)
touch_drop  = Pin(34, Pin.IN)
# 2. 게임 영역 및 그래픽 크기 정의 (화면 절반 크기로 확장)
BOARD_WIDTH = 10
BOARD_HEIGHT = 20
# 가로를 6픽셀로 늘려 10칸 합산 60픽셀(화면 반)을 차게 만듭니다.
BLOCK_SIZE_X = 6  
BLOCK_SIZE_Y = 3  # 세로는 OLED 높이(64)에 맞추어 3픽셀 유지 (20칸 * 3 = 60픽셀)
OFFSET_X = 2
OFFSET_Y = 2
# 3. 테트리스 미노(블록) 모양 정의
SHAPES = [
    [[1, 1, 1, 1]], 
    [[1, 1, 1], [0, 1, 0]], 
    [[1, 1, 1], [1, 0, 0]], 
    [[1, 1, 1], [0, 0, 1]], 
    [[1, 1], [1, 1]], 
    [[1, 1, 0], [0, 1, 1]], 
    [[0, 1, 1], [1, 1, 0]]  
]
board = [[0] * BOARD_WIDTH for _ in range(BOARD_HEIGHT)]
score = 0
game_over = False
current_piece = None
piece_x = 0
piece_y = 0
def get_new_piece():
    global current_piece, piece_x, piece_y
    current_piece = random.choice(SHAPES)
    piece_x = BOARD_WIDTH // 2 - len(current_piece[0]) // 2
    piece_y = 0
def rotate_piece(shape):
    return [list(x) for x in zip(*shape[::-1])]
def check_collision(piece, offset_x, offset_y):
    for r, row in enumerate(piece):
        for c, val in enumerate(row):
            if val:
                new_x = offset_x + c
                new_y = offset_y + r
                if new_x < 0 or new_x >= BOARD_WIDTH or new_y >= BOARD_HEIGHT:
                    return True
                if new_y >= 0 and board[new_y][new_x]:
                    return True
    return False
def lock_piece(piece, offset_x, offset_y):
    global score
    for r, row in enumerate(piece):
        for c, val in enumerate(row):
            if val and offset_y + r >= 0:
                board[offset_y + r][offset_x + c] = 1
                
    new_board = [row for row in board if any(v == 0 for v in row)]
    lines_cleared = BOARD_HEIGHT - len(new_board)
    score += lines_cleared * 100
    
    while len(new_board) < BOARD_HEIGHT:
        new_board.insert(0, [0] * BOARD_WIDTH)
        
    for i in range(BOARD_HEIGHT):
        board[i] = new_board[i]
def draw_game():
    oled.fill(0)
    
    # 변경된 블록 크기에 맞춰 게임 테두리 계산 (가로 10칸 * 6픽셀 = 60픽셀)
    game_w = BOARD_WIDTH * BLOCK_SIZE_X + 2
    game_h = BOARD_HEIGHT * BLOCK_SIZE_Y + 2
    oled.rect(OFFSET_X - 1, OFFSET_Y - 1, game_w, game_h, 1)
    
    # 고정된 블록 그리기
    for r in range(BOARD_HEIGHT):
        for c in range(BOARD_WIDTH):
            if board[r][c]:
                # 채워지는 블록 간의 구분을 위해 테두리 1픽셀씩 여백 분리
                oled.fill_rect(OFFSET_X + c * BLOCK_SIZE_X, OFFSET_Y + r * BLOCK_SIZE_Y, BLOCK_SIZE_X - 1, BLOCK_SIZE_Y - 1, 1)
                
    # 현재 조작 중인 블록 그리기
    if current_piece:
        for r, row in enumerate(current_piece):
            for c, val in enumerate(row):
                if val:
                    py = piece_y + r
                    px = piece_x + c
                    if py >= 0:
                        oled.fill_rect(OFFSET_X + px * BLOCK_SIZE_X, OFFSET_Y + py * BLOCK_SIZE_Y, BLOCK_SIZE_X - 1, BLOCK_SIZE_Y - 1, 1)
                        
    # 우측 UI 텍스트 위치 조정 (왼쪽 절반이 차서 X좌표를 70으로 이동)
    text_x = 70
    oled.text("TETRIS", text_x, 5, 1)
    oled.text("SCORE:", text_x, 25, 1)
    oled.text(str(score), text_x, 38, 1)
    
    if game_over:
        oled.fill_rect(5, 20, 118, 25, 0)
        oled.rect(5, 20, 118, 25, 1)
        oled.text("GAME OVER", 28, 28, 1)
        
    oled.show()
# 4. 초기 구동 설정
get_new_piece()
last_fall_time = time.ticks_ms()
fall_interval = 600  
last_left_state = False
last_right_state = False
last_rot_state = False
last_loop_time = time.ticks_ms()
# 첫 화면 렌더링
draw_game()
# 5. 메인 루프
while not game_over:
    current_time = time.ticks_ms()
    
    # 터치 센서 값 동기화
    pressed_left  = (touch_left.value() == 1)
    pressed_right = (touch_right.value() == 1)
    pressed_rot   = (touch_rot.value() == 1)
    pressed_drop  = (touch_drop.value() == 1)
    # 왼쪽 이동
    if pressed_left and not last_left_state:
        if not check_collision(current_piece, piece_x - 1, piece_y):
            piece_x -= 1
    last_left_state = pressed_left
    # 오른쪽 이동
    if pressed_right and not last_right_state:
        if not check_collision(current_piece, piece_x + 1, piece_y):
            piece_x += 1
    last_right_state = pressed_right
    # 회전
    if pressed_rot and not last_rot_state:
        rotated = rotate_piece(current_piece)
        if not check_collision(rotated, piece_x, piece_y):
            current_piece = rotated
    last_rot_state = pressed_rot
    # 소프트 드롭
    if pressed_drop:
        current_fall_interval = 60
    else:
        current_fall_interval = fall_interval
    # 자동 하강
    if time.ticks_diff(current_time, last_fall_time) > current_fall_interval:
        if not check_collision(current_piece, piece_x, piece_y + 1):
            piece_y += 1
        else:
            lock_piece(current_piece, piece_x, piece_y)
            get_new_piece()
            if check_collision(current_piece, piece_x, piece_y):
                game_over = True
        last_fall_time = current_time
    # 디스플레이 갱신 (약 25 FPS 제한)
    if time.ticks_diff(current_time, last_loop_time) > 40:
        draw_game()
        last_loop_time = current_time
        
    time.sleep_ms(10)
# 게임 오버
draw_game()
__EXPLANATION__
이 코드는 ESP32 보드에 SoftI2C 방식으로 연결된 128x64 해상도의 ssd1306 OLED 디스플레이와 4개의 디지털 입력 핀을 사용하여 작동하는 미니 테트리스 게임 예제입니다.

1. **디바이스 초기화 및 하드웨어 설정**:
   - \`sda=Pin(21)\`, \`scl=Pin(22)\` 핀을 이용해 I2C 버스를 설정하고 ssd1306 OLED 디스플레이 드라이버를 생성합니다.
   - \`Pin(33)\`, \`Pin(32)\`, \`Pin(35)\`, \`Pin(34)\`을 각각 디지털 입력(IN) 모드로 설정하여 좌, 우, 회전, 소프트 드롭의 조작 스위치(터치 패드 또는 버튼) 입력을 판별합니다.

2. **게임 공간 및 렌더링 방식 최적화 (화면 절반 크기 확장)**:
   - 가로 10칸, 세로 20칸의 테트리스 격자 보드 데이터를 2차원 배열(\`board\`)로 관리합니다.
   - OLED 디스플레이의 좌측 절반(60픽셀 너비)을 가득 채우도록 블록당 가로 크기(\`BLOCK_SIZE_X\`)를 6픽셀, 세로 크기(\`BLOCK_SIZE_Y\`)를 3픽셀로 설계해 화면을 크게 그립니다.
   - 우측의 나머지 68픽셀 영역에는 "TETRIS", 현재 스코어(SCORE), 게임오버(GAME OVER) 화면 등의 정보 텍스트를 정렬해 띄웁니다.

3. **조작 제어 및 프레임 제한 루프**:
   - \`random.choice\`를 이용해 무작위로 테트리스 블록을 지속 스폰하고 90도 회전 연산(\`zip(*shape[::-1])\`) 및 벽/블록 충돌 감지 연산을 동반합니다.
   - \`time.ticks_ms()\` 타이머를 활용하여 블록의 자동 하강 주기와 화면 주사율 제한(약 25 FPS)을 제어하고, 소프트 드롭 버튼을 길게 터치 시 하강 주기를 단축시킵니다.
`;

// Helper to stream static code block chunk by chunk simulating OpenAI SSE
function streamStaticCode(code: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = code.match(/[\s\S]{1,16}/g) || [code];
      for (const chunk of chunks) {
        const payload = {
          choices: [{
            delta: { content: chunk }
          }]
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanPrompt = prompt.toLowerCase().replace(/\s+/g, '');
    
    if (cleanPrompt.includes('테트리스') || cleanPrompt.includes('tetris') || cleanPrompt.includes('게임')) {
      return streamStaticCode(TETRIS_CODE);
    }
    
    // Check specific/complex modules first to prevent general keywords (like wifi) from intercepting them
    if (cleanPrompt.includes('dht11') || cleanPrompt.includes('온습도') || cleanPrompt.includes('dht') || cleanPrompt.includes('27번')) {
      return streamStaticCode(DHT11_CODE);
    }
    if (cleanPrompt.includes('neopixel') || cleanPrompt.includes('네오픽셀') || cleanPrompt.includes('무지개') || cleanPrompt.includes('14번')) {
      return streamStaticCode(NEOPIXEL_CODE);
    }
    if (cleanPrompt.includes('웹서버') || cleanPrompt.includes('webserver') || cleanPrompt.includes('웹페이지') || cleanPrompt.includes('소켓') || cleanPrompt.includes('서버')) {
      return streamStaticCode(WEBSERVER_CODE);
    }
    if (cleanPrompt.includes('led') && (cleanPrompt.includes('깜빡') || cleanPrompt.includes('반복') || cleanPrompt.includes('1초'))) {
      return streamStaticCode(LED_CODE);
    }
    if (cleanPrompt.includes('wifi') || cleanPrompt.includes('와이파이') || cleanPrompt.includes('인터넷')) {
      return streamStaticCode(WIFI_CODE);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return new Response(
        JSON.stringify({ error: 'OpenAI API Key가 설정되지 않았습니다. .env.local 파일에 키를 작성해 주세요.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert MicroPython developer for ESP32.
Generate only executable, syntactically correct MicroPython code based on the user's natural language request.
IMPORTANT RULES:
1. Do NOT wrap the code in markdown blocks (do NOT use \`\`\`python ... \`\`\`). Output ONLY raw python code text.
2. Provide clean comments in Korean within the code to explain what it does.
3. Make sure to use correct ESP32 pin configurations. If not specified, use typical ESP32 pins (e.g. GPIO 2 for built-in LED) and comment about it.
4. If NeoPixel is requested, note that GPIO 14 with 12 pixels is preferred.
5. If DHT11 is requested, GPIO 27 is preferred, and always wrap readings in a try-except OSError block.
6. Use standard MicroPython libraries (e.g. machine, time, neopixel, network) and write professional, optimized code.
7. After the complete MicroPython code block, output exactly the delimiter line '__EXPLANATION__' and then write a comprehensive, clear, step-by-step description/explanation of the generated code in Korean. Do not wrap this explanation in any code blocks.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(JSON.stringify({ error: `OpenAI API returned error: ${errorData}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
