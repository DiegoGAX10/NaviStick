#include <WiFi.h>
#include <WebSocketsServer.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <NewPing.h>

// ===== CONFIGURACIÓN WiFi =====
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// ===== CONFIGURACIÓN SERVIDORES =====
WebServer server(80);              // Servidor HTTP en puerto 80
WebSocketsServer webSocket(81);    // WebSocket en puerto 81

// ===== PINES DE SENSORES =====
// Sensor Ultrasónico HC-SR04
#define TRIGGER_PIN  5
#define ECHO_PIN     18
#define MAX_DISTANCE 400
NewPing ultrasonic(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE);

// Sensor ToF (I2C)
// SCL -> Pin 22, SDA -> Pin 21

// Motor Vibrador
#define VIBRATOR_PIN 4

// GPS (Serial2)
// RX -> Pin 16, TX -> Pin 17

// IMU/Acelerómetro (I2C)
// SCL -> Pin 22, SDA -> Pin 21

// ===== VARIABLES GLOBALES =====
float ultrasonicDistance = 0;
float tofDistance = 0;
String currentVibrationPattern = "none";
int vibrationIntensity = 0;
bool vibrationActive = false;

// GPS variables
float latitude = 0;
float longitude = 0;
float gpsAccuracy = 0;

// IMU variables
float accelX = 0, accelY = 0, accelZ = 0;
float gyroX = 0, gyroY = 0, gyroZ = 0;
float orientation = 0;

// Sistema
float batteryLevel = 75.0;
float temperature = 25.0;
unsigned long startTime;

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  startTime = millis();
  
  // Configurar pines
  pinMode(VIBRATOR_PIN, OUTPUT);
  digitalWrite(VIBRATOR_PIN, LOW);
  
  // Conectar WiFi
  connectWiFi();
  
  // Inicializar sensores
  initSensors();
  
  // Configurar servidores
  setupWebServer();
  setupWebSocket();
  
  Serial.println("NaviStick ESP32 iniciado correctamente!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ===== LOOP PRINCIPAL =====
void loop() {
  // Manejar conexiones
  server.handleClient();
  webSocket.loop();
  
  // Leer sensores y enviar datos
  readSensors();
  sendSensorData();
  
  // Actualizar vibración
  updateVibration();
  
  delay(200); // 5 lecturas por segundo
}

// ===== CONEXIÓN WiFi =====
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi conectado!");
}

// ===== INICIALIZAR SENSORES =====
void initSensors() {
  // Inicializar I2C para ToF e IMU
  Wire.begin(21, 22); // SDA, SCL
  
  // Inicializar GPS
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  
  // Aquí inicializarías las librerías específicas de tus sensores
  // Por ejemplo: vl53l0x.init(), mpu6050.begin(), etc.
  
  Serial.println("Sensores inicializados");
}

// ===== LEER SENSORES =====
void readSensors() {
  // Sensor Ultrasónico
  ultrasonicDistance = ultrasonic.ping_cm();
  if (ultrasonicDistance == 0) ultrasonicDistance = 400; // Sin eco = distancia máxima
  
  // Sensor ToF (simular por ahora)
  // tofDistance = vl53l0x.readRangeSingleMillimeters() / 10.0; // mm to cm
  tofDistance = random(20, 150); // Simular datos
  
  // GPS (simular por ahora)
  latitude = 40.7128 + (random(-100, 100) / 10000.0);
  longitude = -74.0060 + (random(-100, 100) / 10000.0);
  gpsAccuracy = random(3, 15);
  
  // IMU (simular por ahora)
  accelX = (random(-100, 100) / 100.0);
  accelY = -9.8 + (random(-50, 50) / 100.0);
  accelZ = (random(-100, 100) / 100.0);
  orientation = random(0, 360);
  
  // Sistema
  batteryLevel = max(0.0, batteryLevel - 0.001); // Simular descarga lenta
  temperature = 25 + (random(-30, 30) / 10.0);
}

// ===== ENVIAR DATOS VIA WEBSOCKET =====
void sendSensorData() {
  String timestamp = String(millis());
  
  // Sensor Ultrasónico
  String ultrasonicJson = createSensorJson("ultrasonic", String(ultrasonicDistance), timestamp);
  webSocket.broadcastTXT(ultrasonicJson);
  
  delay(50);
  
  // Sensor ToF
  String tofJson = createSensorJson("tof", String(tofDistance), timestamp);
  webSocket.broadcastTXT(tofJson);
  
  delay(50);
  
  // GPS
  DynamicJsonDocument gpsDoc(200);
  gpsDoc["sensor"] = "gps";
  gpsDoc["latitude"] = latitude;
  gpsDoc["longitude"] = longitude;
  gpsDoc["accuracy"] = gpsAccuracy;
  gpsDoc["timestamp"] = timestamp;
  
  String gpsJson;
  serializeJson(gpsDoc, gpsJson);
  webSocket.broadcastTXT(gpsJson);
  
  delay(50);
  
  // IMU
  DynamicJsonDocument imuDoc(300);
  imuDoc["sensor"] = "imu";
  imuDoc["acceleration"]["x"] = accelX;
  imuDoc["acceleration"]["y"] = accelY;
  imuDoc["acceleration"]["z"] = accelZ;
  imuDoc["gyroscope"]["x"] = gyroX;
  imuDoc["gyroscope"]["y"] = gyroY;
  imuDoc["gyroscope"]["z"] = gyroZ;
  imuDoc["orientation"] = orientation;
  imuDoc["timestamp"] = timestamp;
  
  String imuJson;
  serializeJson(imuDoc, imuJson);
  webSocket.broadcastTXT(imuJson);
  
  delay(50);
  
  // Vibrador (solo si está activo)
  if (vibrationActive) {
    DynamicJsonDocument vibratorDoc(200);
    vibratorDoc["sensor"] = "vibrator";
    vibratorDoc["pattern"] = currentVibrationPattern;
    vibratorDoc["intensity"] = vibrationIntensity;
    vibratorDoc["active"] = vibrationActive;
    vibratorDoc["timestamp"] = timestamp;
    
    String vibratorJson;
    serializeJson(vibratorDoc, vibratorJson);
    webSocket.broadcastTXT(vibratorJson);
  }
}

// ===== CREAR JSON DE SENSOR =====
String createSensorJson(String sensor, String distance, String timestamp) {
  DynamicJsonDocument doc(150);
  doc["sensor"] = sensor;
  doc["distance"] = distance.toFloat();
  doc["timestamp"] = timestamp;
  
  String json;
  serializeJson(doc, json);
  return json;
}

// ===== CONFIGURAR SERVIDOR WEB =====
void setupWebServer() {
  // Endpoint para estado del sistema
  server.on("/status", HTTP_GET, []() {
    DynamicJsonDocument doc(300);
    doc["battery"] = batteryLevel;
    doc["temperature"] = temperature;
    doc["uptime"] = (millis() - startTime) / 1000;
    doc["errors"] = "[]"; // Array vacío por ahora
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Endpoint para activar vibración
  server.on("/vibrate", HTTP_POST, []() {
    if (server.hasArg("pattern") && server.hasArg("intensity")) {
      currentVibrationPattern = server.arg("pattern");
      vibrationIntensity = server.arg("intensity").toInt();
      activateVibration();
      
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", "{\"status\":\"success\"}");
    } else {
      server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Missing parameters\"}");
    }
  });
  
  // Endpoint para cambiar patrón de vibrador
  server.on("/vibrator/pattern", HTTP_POST, []() {
    if (server.hasArg("pattern")) {
      currentVibrationPattern = server.arg("pattern");
      
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", "{\"status\":\"success\"}");
    } else {
      server.send(400, "application/json", "{\"status\":\"error\"}");
    }
  });
  
  // Endpoint para calibrar sensores
  server.on("/calibrate", HTTP_POST, []() {
    calibrateSensors();
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"calibrated\"}");
  });
  
  // Manejar CORS
  server.on("/", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(200);
  });
  
  server.begin();
  Serial.println("Servidor HTTP iniciado en puerto 80");
}

// ===== CONFIGURAR WEBSOCKET =====
void setupWebSocket() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("Servidor WebSocket iniciado en puerto 81");
}

// ===== EVENTOS WEBSOCKET =====
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Desconectado!\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Conectado desde %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      
      // Enviar mensaje de bienvenida
      webSocket.sendTXT(num, "{\"status\":\"connected\",\"message\":\"NaviStick ESP32\"}");
      break;
    }
    
    case WStype_TEXT:
      Serial.printf("[%u] Mensaje recibido: %s\n", num, payload);
      // Aquí puedes procesar comandos recibidos desde la app
      break;
      
    default:
      break;
  }
}

// ===== CONTROLAR VIBRACIÓN =====
void activateVibration() {
  vibrationActive = true;
  
  if (currentVibrationPattern == "alert") {
    // Patrón de alerta: 3 pulsos rápidos
    for (int i = 0; i < 3; i++) {
      analogWrite(VIBRATOR_PIN, map(vibrationIntensity, 0, 100, 0, 255));
      delay(200);
      analogWrite(VIBRATOR_PIN, 0);
      delay(100);
    }
  } 
  else if (currentVibrationPattern == "warning") {
    // Patrón de advertencia: pulso largo
    analogWrite(VIBRATOR_PIN, map(vibrationIntensity, 0, 100, 0, 255));
    delay(1000);
    analogWrite(VIBRATOR_PIN, 0);
  }
  else if (currentVibrationPattern == "pulse") {
    // Patrón de pulso: on/off cada segundo
    analogWrite(VIBRATOR_PIN, map(vibrationIntensity, 0, 100, 0, 255));
    delay(500);
    analogWrite(VIBRATOR_PIN, 0);
    delay(500);
  }
  else if (currentVibrationPattern == "continuous") {
    // Patrón continuo: vibración constante por 2 segundos
    analogWrite(VIBRATOR_PIN, map(vibrationIntensity, 0, 100, 0, 255));
    delay(2000);
    analogWrite(VIBRATOR_PIN, 0);
  }
  
  vibrationActive = false;
}

void updateVibration() {
  // Lógica automática de vibración basada en sensores
  if (ultrasonicDistance < 50 && ultrasonicDistance > 0) {
    // Obstáculo muy cerca - vibración de alerta
    if (!vibrationActive && currentVibrationPattern != "none") {
      currentVibrationPattern = "alert";
      vibrationIntensity = 80;
      activateVibration();
    }
  }
  
  if (tofDistance > 100) {
    // Posible escalera - vibración de advertencia
    if (!vibrationActive && currentVibrationPattern != "none") {
      currentVibrationPattern = "warning";
      vibrationIntensity = 60;
      activateVibration();
    }
  }
}

// ===== CALIBRAR SENSORES =====
void calibrateSensors() {
  Serial.println("Calibrando sensores...");
  
  // Aquí implementarías la calibración específica de cada sensor
  // Por ejemplo: establecer offsets, promediar lecturas iniciales, etc.
  
  delay(2000); // Simular proceso de calibración
  Serial.println("Sensores calibrados");
}