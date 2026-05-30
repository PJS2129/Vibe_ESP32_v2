export interface Template {
  label: string;
  code: string;
  explanation: string;
}

export const templates: Template[] = [
  {
    label: '💡 내장 LED 깜빡이기',
    code: `# VibeESP32 - 내장 LED 깜빡이기 (GPIO 2)
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
`,
    explanation: `이 코드는 ESP32 보드의 내장 LED(일반적으로 GPIO 2번에 연결됨)를 0.5초 간격으로 켜고 끄는 가장 기본적인 'Blink' 예제입니다.

1. **라이브러리 불러오기**:
   - \`machine\`: ESP32의 하드웨어 핀을 직접 제어하기 위한 MicroPython 모듈입니다.
   - \`time\`: 시간 지연(sleep)을 처리하기 위한 모듈입니다.

2. **하드웨어 핀 제어**:
   - \`machine.Pin(2, machine.Pin.OUT)\`: GPIO 2번 핀을 신호를 내보내는 출력(OUT) 모드로 활성화합니다.

3. **무한 루프 제어**:
   - \`while True:\` 블록을 통해 꺼짐과 켜짐 동작을 무한히 반복합니다.
   - \`led.value(1)\`은 핀에 High(3.3V) 신호를 주어 LED를 켜고, \`led.value(0)\`은 Low(0V) 신호를 주어 LED를 끕니다.
   - 각 상태 변화 사이에 \`time.sleep(0.5)\`를 주어 0.5초(500ms) 동안 대기하게 합니다.`
  },
  {
    label: '📡 WiFi 연결',
    code: `# VibeESP32 - WiFi 연결 및 IP 출력
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
`,
    explanation: `이 코드는 ESP32 보드를 주변의 WiFi 공유기(AP)에 연결하고, 할당받은 IP 주소를 터미널에 출력하는 네트워크 통신 기본 예제입니다.

1. **WiFi 모듈 설정**:
   - \`network.WLAN(network.STA_IF)\`: ESP32를 다른 공유기에 접속하는 무선 단말기(Station) 모드로 설정합니다.
   - \`wlan.active(True)\`: 무선 랜 카드를 활성화합니다.

2. **접속 제어**:
   - \`wlan.connect(ssid, password)\`: 지정한 SSID와 비밀번호를 이용해 WiFi 신호에 연결을 시도합니다.

3. **연결 대기**:
   - \`while\` 루프를 사용해 최대 10초 동안 1초 간격으로 연결 성공 여부(\`wlan.isconnected()\` )를 확인합니다.

4. **네트워크 정보 획득**:
   - 성공 시 \`wlan.ifconfig()\`를 호출하여 ESP32가 할당받은 IP 주소, 서브넷 마스크, 게이트웨이, DNS 주소 등의 네트워크 설정을 확인하여 콘솔에 인쇄합니다.`
  },
  {
    label: '🌡️ 온습도 센서 DHT11',
    code: `# VibeESP32 - DHT11 온습도 센서 측정 (GPIO 27)
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
`,
    explanation: `이 코드는 GPIO 27번 핀에 연결된 DHT11 센서로부터 주기적으로 주변 대기 온도와 상대 습도 데이터를 읽어와서 출력해 주는 모니터링 예제입니다.

1. **센서 연결 및 제어**:
   - \`import dht\`: 온습도 측정용 DHT 라이브러리를 임포트합니다.
   - \`dht.DHT11(machine.Pin(27))\`: GPIO 27번 디지털 핀을 DHT11 센서용 데이터 입력 라인으로 구성합니다.

2. **안정적인 데이터 수집**:
   - \`sensor.measure()\`를 통해 물리적인 측정을 수행한 뒤, \`temperature()\`와 \`humidity()\` 함수로 값을 추출합니다.
   - DHT11 센서는 하드웨어 한계상 너무 자주 읽으면 응답을 멈추기 때문에 루프 끝에 \`time.sleep(2)\`로 2초의 딜레이를 주었습니다.

3. **try-except 예외 처리**:
   - 센서 핀의 연결이 헐겁거나 단선될 때 발생하는 \`OSError\` 예외를 안전하게 잡아내어(\`except OSError\`), 에러 메시지만 출력하고 루프가 뻗지 않고 측정을 계속 시도하게 합니다.`
  },
  {
    label: '🌈 NeoPixel 무지개',
    code: `# VibeESP32 - NeoPixel 무지개 회전 효과 (GPIO 14, 12개 LED)
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
`,
    explanation: `이 코드는 GPIO 14번 디지털 출력 핀에 연결된 12구의 NeoPixel RGB LED 스트립에 대해 부드러운 무지개 색상이 순환하는 효과(Rainbow Cycle)를 제공하는 화려한 비주얼 제어 예제입니다.

1. **라이브러리 불러오기**:
   - \`neopixel\`: WS2812B(NeoPixel) LED 소자를 어드레서블 방식으로 편리하게 제어하기 위한 라이브러리입니다.
   - \`NeoPixel(pin, 12)\`: 14번 핀에 12개의 픽셀이 직렬 연결되어 있음을 지정합니다.

2. **컬러 스펙트럼 변환 (\`wheel\` 함수)**:
   - 0부터 255까지의 단일 입력값(\`pos\`)을 빨강 ➡️ 초록 ➡️ 파랑 ➡️ 빨강으로 점진 변환하는 3차원 RGB 튜플 \`(R, G, B)\`로 매핑하여 무지개 색상을 구현합니다.

3. **부드러운 애니메이션 구현**:
   - 외부 루프(\`j\`)와 내부 루프(\`i\`)를 중첩하여 각 픽셀 간 적절한 위상차(\`i * 256 // 12\`)를 부여해 색을 입힙니다.
   - \`np.write()\`를 호출해야 계산된 색상이 실제 LED 소자에 동시 전송되어 갱신됩니다.
   - \`time.sleep_ms(15)\`를 추가하여 회전이 너무 빠르게 돌아 깨지지 않고 사람 눈에 부드럽게 보이도록 조정했습니다.`
  },
  {
    label: '🌐 웹 서버 구동',
    code: `# VibeESP32 - 간단한 웹 서버 구동
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
`,
    explanation: `이 코드는 ESP32 보드를 공유기(WiFi)에 연동한 후 내부 망의 IP 주소 80번 포트(HTTP 기본 포트)를 열어 간단한 웹페이지 웹 서버 역할을 하도록 만드는 통신 제어 예제입니다.

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
   - 전송을 완료한 후 \`conn.close()\`로 개별 세션 연결 소켓을 종료하여 리소스를 해제합니다.`
  },
  {
    label: '🎮 테트리스 게임',
    code: `import machine
import ssd1306
import time
import random
# I2C 핀 설정
i2c_sda = machine.Pin(21)  # SDA 핀
i2c_scl = machine.Pin(22)  # SCL 핀
i2c = machine.I2C(0, sda=i2c_sda, scl=i2c_scl)  # I2C 객체 생성
# OLED 디스플레이 초기화
oled_width = 128
oled_height = 64
oled = ssd1306.SSD1306_I2C(oled_width, oled_height, i2c)
# 게임 설정
board_width = 10
board_height = 20
board = [[0] * board_width for _ in range(board_height)]  # 보드 초기화
tetromino_shapes = [  # 테트로미노 모양 정의
    [[1, 1, 1], [0, 1, 0]],  # T
    [[1, 1], [1, 1]],        # O
    [[1, 1, 1], [1, 0, 0]],  # L
    [[1, 1, 1], [0, 0, 1]],  # J
    [[1, 1, 0], [0, 1, 1]],  # S
    [[0, 1, 1], [1, 1, 0]],  # Z
    [[1, 1, 1, 1]],          # I
]
# 테트로미노 클래스 정의
class Tetromino:
    def __init__(self):
        self.shape = random.choice(tetromino_shapes)
        self.x = board_width // 2 - len(self.shape[0]) // 2
        self.y = 0
    def rotate(self):
        self.shape = [list(row) for row in zip(*self.shape[::-1])]  # 시계 방향 회전
# 게임 루프
def draw_board():
    oled.fill(0)  # 화면 지우기
    for y in range(board_height):
        for x in range(board_width):
            if board[y][x]:
                oled.pixel(x, y, 1)  # 픽셀 그리기
    oled.show()  # 화면 업데이트
def place_tetromino(tetromino):
    for y, row in enumerate(tetromino.shape):
        for x, cell in enumerate(row):
            if cell:
                board[tetromino.y + y][tetromino.x + x] = 1  # 보드에 테트로미노 추가
def check_collision(tetromino):
    for y, row in enumerate(tetromino.shape):
        for x, cell in enumerate(row):
            if cell:
                if (tetromino.x + x < 0 or tetromino.x + x >= board_width or 
                    tetromino.y + y < 0 or tetromino.y + y >= board_height or 
                    board[tetromino.y + y][tetromino.x + x]):
                    return True
    return False
def clear_lines():
    global board
    new_board = [row for row in board if any(cell == 0 for cell in row)]  # 비어있는 라인만 남기기
    cleared_lines = board_height - len(new_board)
    board = [[0] * board_width for _ in range(cleared_lines)] + new_board  # 새 보드 생성
# 게임 초기화
current_tetromino = Tetromino()
while not check_collision(current_tetromino):
    draw_board()  # 보드 그리기
    current_tetromino.y += 1  # 테트로미노 내려오기
    if check_collision(current_tetromino):
        current_tetromino.y -= 1  # 충돌 시 원래 위치로 돌아오기
        place_tetromino(current_tetromino)  # 보드에 테트로미노 배치
        clear_lines()  # 라인 지우기
        current_tetromino = Tetromino()  # 새로운 테트로미노 생성
oled.fill(0)
oled.text('Game Over', 0, 0)  # 게임 종료 메시지 출력
oled.show()`,
    explanation: `이 코드는 ESP32 보드에 하드웨어 I2C 방식으로 연결된 128x64 해상도의 ssd1306 OLED 디스플레이 상에 테트리스 블록이 떨어지게 구동하는 객체 지향 테트리스 게임 예제입니다.

1. **하드웨어 및 I2C 디스플레이 초기화**:
   - \`Pin(21)\` (SDA)과 \`Pin(22)\` (SCL)을 하드웨어 I2C 포트 0번(\`machine.I2C(0)\`)으로 할당하여 초기화합니다.
   - \`ssd1306.SSD1306_I2C\` 라이브러리에 전달하여 128x64 해상도의 OLED 디스플레이를 선언합니다.

2. **객체지향 설계 (\`Tetromino\` 클래스)**:
   - 각 블록의 형태와 위치 정보(\`x\`, \`y\`)를 속성으로 가지는 클래스 구조를 정의합니다.
   - \`rotate()\` 메소드를 활용해 zip 전개 방식(\`zip(*self.shape[::-1])\`)으로 시계 방향 90도 회전을 구현합니다.

3. **게임 루틴 및 충돌 판정**:
   - 10x20 격자 보드 위에서 매 턴마다 블록의 좌표를 아래로 한 칸씩 하강시킵니다.
   - \`check_collision()\` 검사를 통해 바닥에 닿거나 타 블록과 겹칠 경우 한 단계 뒤로 돌린 뒤 보드 데이터(\`board\`)에 반영하고 라인 삭제(\`clear_lines()\`)를 거쳐 새로운 블록을 소환합니다.
   - 충돌이 천장에 도달하면 루프를 빠져나와 OLED에 'Game Over' 텍스트를 출력합니다.`
  }
];
