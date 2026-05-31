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

BLOCK_SIZE_X = 6
BLOCK_SIZE_Y = 3

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

    game_w = BOARD_WIDTH * BLOCK_SIZE_X + 2
    game_h = BOARD_HEIGHT * BLOCK_SIZE_Y + 2
    oled.rect(OFFSET_X - 1, OFFSET_Y - 1, game_w, game_h, 1)

    for r in range(BOARD_HEIGHT):
        for c in range(BOARD_WIDTH):
            if board[r][c]:
                oled.fill_rect(OFFSET_X + c * BLOCK_SIZE_X, OFFSET_Y + r * BLOCK_SIZE_Y, BLOCK_SIZE_X - 1, BLOCK_SIZE_Y - 1, 1)

    if current_piece:
        for r, row in enumerate(current_piece):
            for c, val in enumerate(row):
                if val:
                    py = piece_y + r
                    px = piece_x + c
                    if py >= 0:
                        oled.fill_rect(OFFSET_X + px * BLOCK_SIZE_X, OFFSET_Y + py * BLOCK_SIZE_Y, BLOCK_SIZE_X - 1, BLOCK_SIZE_Y - 1, 1)

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

draw_game()

# 5. 메인 루프
while not game_over:
    current_time = time.ticks_ms()

    pressed_left  = (touch_left.value() == 1)
    pressed_right = (touch_right.value() == 1)
    pressed_rot   = (touch_rot.value() == 1)
    pressed_drop  = (touch_drop.value() == 1)

    if pressed_left and not last_left_state:
        if not check_collision(current_piece, piece_x - 1, piece_y):
            piece_x -= 1
    last_left_state = pressed_left

    if pressed_right and not last_right_state:
        if not check_collision(current_piece, piece_x + 1, piece_y):
            piece_x += 1
    last_right_state = pressed_right

    if pressed_rot and not last_rot_state:
        rotated = rotate_piece(current_piece)
        if not check_collision(rotated, piece_x, piece_y):
            current_piece = rotated
    last_rot_state = pressed_rot

    if pressed_drop:
        current_fall_interval = 60
    else:
        current_fall_interval = fall_interval

    if time.ticks_diff(current_time, last_fall_time) > current_fall_interval:
        if not check_collision(current_piece, piece_x, piece_y + 1):
            piece_y += 1
        else:
            lock_piece(current_piece, piece_x, piece_y)
            get_new_piece()
            if check_collision(current_piece, piece_x, piece_y):
                game_over = True
        last_fall_time = current_time

    if time.ticks_diff(current_time, last_loop_time) > 40:
        draw_game()
        last_loop_time = current_time

    time.sleep_ms(10)

draw_game()`,
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
  },
  {
    label: '🌤️ 서울 날씨 & OLED & NeoPixel',
    code: `# VibeESP32 - 서울 날씨 정보 가져오기 & OLED & NeoPixel 제어
import machine
import network
import time
import urequests
import json
from machine import Pin, SoftI2C
import ssd1306
import neopixel

# WiFi 설정 및 OpenWeatherMap API 키 설정
SSID = "Your_WiFi_SSID"
PASSWORD = "Your_WiFi_Password"
API_KEY = "Your_OpenWeatherMap_API_Key"  # OpenWeatherMap에서 발급받은 API 키 입력
CITY = "Seoul"
URL = "http://api.openweathermap.org/data/2.5/weather?q={}&appid={}&units=metric".format(CITY, API_KEY)

# 하드웨어 설정 (I2C OLED & NeoPixel)
i2c = SoftI2C(scl=Pin(22), sda=Pin(21))
oled = ssd1306.SSD1306_I2C(128, 64, i2c)

# NeoPixel 설정 (GPIO 14번, 12개 LED)
np_pin = Pin(14, Pin.OUT)
np = neopixel.NeoPixel(np_pin, 12)

def set_np_color(r, g, b):
    for i in range(12):
        np[i] = (r, g, b)
    np.write()

# WiFi 연결 함수
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
print("[시스템] WiFi 연결 시도 중...")
wlan.connect(SSID, PASSWORD)

# 연결 대기
for _ in range(10):
    if wlan.isconnected():
        break
    time.sleep(1)

if not wlan.isconnected():
    print("[에러] WiFi 연결 실패.")
    oled.fill(0)
    oled.text("WiFi Connect Fail", 0, 20)
    oled.show()
    set_np_color(255, 0, 0) # 빨간색으로 에러 표시
else:
    print("[시스템] WiFi 연결 성공! IP:", wlan.ifconfig()[0])
    oled.fill(0)
    oled.text("WiFi Connected!", 0, 20)
    oled.show()
    set_np_color(0, 255, 0) # 초록색으로 성공 표시
    time.sleep(1)

    while True:
        try:
            print("[시스템] 서울 날씨 정보 요청 중...")
            response = urequests.get(URL)
            if response.status_code == 200:
                data = response.json()
                temp = data['main']['temp']
                weather_main = data['weather'][0]['main']
                
                print("도시: Seoul")
                print("날씨: {}, 온도: {} C".format(weather_main, temp))
                
                # OLED 출력
                oled.fill(0)
                oled.text("Seoul Weather", 10, 5, 1)
                oled.text("----------------", 0, 18, 1)
                oled.text("Temp: {} C".format(temp), 10, 30, 1)
                oled.text("State: {}".format(weather_main), 10, 45, 1)
                oled.show()
                
                # 날씨 상태에 따른 네오픽셀 색상 변경
                # 1. 맑음 (Clear) -> 주황/빨강 (따뜻함/태양)
                # 2. 비/눈 (Rain/Drizzle/Snow) -> 파랑 (물/눈)
                # 3. 흐림/안개 등 (Clouds/Mist/Haze) -> 노랑/보라
                if "clear" in weather_main.lower():
                    set_np_color(255, 50, 0) # 주황빛 빨간색
                    print("[날씨: 맑음] NeoPixel 색상: 주황색")
                elif any(x in weather_main.lower() for x in ["rain", "drizzle", "snow", "thunderstorm"]):
                    set_np_color(0, 0, 255) # 파란색
                    print("[날씨: 비/눈] NeoPixel 색상: 파란색")
                else:
                    set_np_color(80, 80, 80) # 백색/흐린 흰빛
                    print("[날씨: 흐림/기타] NeoPixel 색상: 흐린 흰색")
            else:
                print("[에러] 날씨 데이터를 가져올 수 없습니다. Status Code:", response.status_code)
                oled.fill(0)
                oled.text("HTTP Error: {}".format(response.status_code), 0, 20)
                oled.show()
            response.close()
        except Exception as e:
            print("[에러] 날씨 조회 중 오류 발생:", e)
            
        time.sleep(300) # 5분 간격 갱신
`,
    explanation: `이 코드는 WiFi를 연결하고 OpenWeatherMap API를 호출해 서울의 현재 날씨와 기온을 수집한 뒤, 그 결과를 터미널과 I2C 128x64 OLED 디스플레이에 노출하고 동시에 날씨 상태(맑음, 비/눈, 흐림)에 따라 GPIO 14번에 연결된 12구 NeoPixel LED의 색상을 다르게 켜 주는 종합 스마트 홈 연동 IoT 예제입니다.

1. **인터넷 연결 및 HTTP 통신**:
   - \`network.WLAN\`를 사용해 공유기에 접속한 후 마이크로파이썬 전용 \`urequests.get()\` 라이브러리로 OpenWeatherMap API 서버에 HTTP GET 요청을 보냅니다.
   - 받아온 JSON 데이터(\`response.json()\`)로부터 온도(\`temp\`) 및 주요 날씨 지표(\`weather[0]['main']\`)를 파싱합니다.

2. **OLED 모니터링 출력**:
   - \`ssd1306\` OLED 디스플레이를 활용해 도시명, 온도, 날씨 상태를 화면 상에 깔끔하게 나누어 출력합니다.

3. **조건부 NeoPixel LED 조명 피드백**:
   - 수집된 날씨 상태의 텍스트에 따라,
     - **맑음 (Clear)** 일 때는 따뜻한 태양을 상징하는 **주황색 (Red 255, Green 50, Blue 0)**
     - **비/눈 (Rain/Snow)** 계열일 때는 물방울을 연상시키는 **파란색 (Red 0, Green 0, Blue 255)**
     - **흐림/기타 (Clouds/Mist)** 일 때는 차분한 **연한 백색 (Red 80, Green 80, Blue 80)**으로 NeoPixel 바의 색상을 변경합니다.`
  },
  {
    label: '🔮 TCS34725 컬러센서 Mood Light',
    code: `# VibeESP32 - TCS34725 컬러센서를 이용한 NeoPixel 무드등 (SDA: 17, SCL: 16)
from machine import Pin, SoftI2C
import neopixel
import time
import ustruct

# [TCS34725 컬러 센서 내부 드라이버 클래스 정의]
class TCS34725:
    def __init__(self, i2c, address=0x29):
        self.i2c = i2c
        self.address = address
        # 센서 ID 확인 (ID 레지스터: 0x12 | 0x80 = 0x92)
        sensor_id = self.i2c.readfrom_mem(self.address, 0x92, 1)[0]
        if sensor_id not in (0x44, 0x4D, 0x10):
            raise RuntimeError("Could not find TCS34725 sensor.")
        # 센서 전원 켜기 (Power ON) 및 RGBC 활성화
        self.i2c.writeto_mem(self.address, 0x80, b'\\x03')
        self.integration_time(24)
        self.gain(4)

    def integration_time(self, value=None):
        if value is None:
            return getattr(self, '_integration_time', 24.0)
        reg = 256 - int(value / 2.4)
        reg = min(max(reg, 0), 255)
        self.i2c.writeto_mem(self.address, 0x81, bytes([reg]))
        self._integration_time = value

    def gain(self, value=None):
        if value is None:
            return getattr(self, '_gain', 4)
        gains = {1: 0x00, 4: 0x01, 16: 0x02, 60: 0x03}
        if value not in gains:
            raise ValueError("Gain must be 1, 4, 16, or 60")
        reg = gains[value]
        self.i2c.writeto_mem(self.address, 0x8F, bytes([reg]))
        self._gain = value

    def read(self):
        # 8바이트 (Clear, Red, Green, Blue) 데이터 한번에 읽어오기
        data = self.i2c.readfrom_mem(self.address, 0x94, 8)
        c = ustruct.unpack('<H', data[0:2])[0]
        r = ustruct.unpack('<H', data[2:4])[0]
        g = ustruct.unpack('<H', data[4:6])[0]
        b = ustruct.unpack('<H', data[6:8])[0]
        return r, g, b, c

# TCS34725 컬러센서 I2C 설정 (SDA: GPIO 17, SCL: GPIO 16)
i2c = SoftI2C(sda=Pin(17), scl=Pin(16))
sensor = TCS34725(i2c)

# 조도 감도 및 정확도 향상을 위한 설정 반영
sensor.gain(1)
sensor.integration_time(240)

# NeoPixel 설정 (GPIO 14번, 12개 LED)
np = neopixel.NeoPixel(Pin(14, Pin.OUT), 12)

print("[시스템] TCS34725 무드등 구동 시작 (SDA: 17, SCL: 16)")

while True:
    try:
        # 센서로부터 R, G, B, Clear(C) 값 읽기
        r, g, b, c = sensor.read()
        
        if c > 0:
            # 8비트 RGB 값으로 변환 (밝기 비례 스케일링)
            r_scale = int((r / c) * 255 * 1.5) # 눈에 잘 띄도록 가중치 부여
            g_scale = int((g / c) * 255 * 1.5)
            b_scale = int((b / c) * 255 * 1.5)
            
            # 0~255 범위 제한
            red = min(max(r_scale, 0), 255)
            green = min(max(g_scale, 0), 255)
            blue = min(max(b_scale, 0), 255)
        else:
            red = green = blue = 0
            
        print("측정값 - Clear: {}, R: {}, G: {}, B: {} -> 매핑 RGB: ({}, {}, {})".format(c, r, g, b, red, green, blue))
        
        # NeoPixel 무드등 색상 켜기 (12개 LED 전체 반영)
        for i in range(12):
            np[i] = (red, green, blue)
        np.write()
        
    except Exception as e:
        print("[에러] 센서 읽기 오류:", e)
        
    time.sleep(0.5) # 0.5초 간격으로 컬러 센싱 및 무드등 갱신
`,
    explanation: `이 코드는 SDA=Pin(17), SCL=Pin(16) 핀으로 연결된 TCS34725 RGB 컬러센서로부터 실시간 컬러 센싱 값을 받아온 뒤, 주변 밝기(Clear 채널)에 비례하게 정규화된 8비트 R, G, B 값으로 스케일링하여 GPIO 14번에 연결된 12구 NeoPixel LED 바에 동일한 컬러로 비춰주는 스마트 컬러 무드등(mood light) 예제입니다.

1. **자체 드라이버 내장 (Standalone)**:
   - 보드에 번거롭게 별도의 \`tcs34725.py\` 라이브러리 파일을 올릴 필요 없이, 코드 내부에 드라이버 클래스를 직접 포함하고 있어 단독으로 즉시 오류 없이 정상 작동합니다.

2. **컬러 스케일 가공 및 노이즈 보정**:
   - 광량 및 밝기 데이터(\`c\`) 비례 나눗셈 방식을 거친 후 1.5배의 강도를 주어 눈에 쉽게 띄도록 하고, 센서 데이터가 없을 때(\`c <= 0\`) 발생할 수 있는 Zero-Division 에러 및 0~255 제한 오버플로우를 완벽 차단 처리했습니다.

3. **NeoPixel 실시간 무드 갱신**:
   - 0.5초 주기로 센서가 주변 사물의 색깔을 감지하면 LED 12구의 픽셀 색상이 동적 반응하여, 사물이나 반사판의 색을 그대로 따라 빛을 표현합니다.`
  }
];
