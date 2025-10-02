#ifndef CONFIG_H
#define CONFIG_H

// ===== CONFIGURACIÓN WiFi =====
// INSTRUCCIONES:
// 1. Copia el archivo .env.example a .env
// 2. Cambia los valores en .env por los tuyos
// 3. Actualiza los valores aquí manualmente (no se pueden leer automáticamente en Arduino)

const char* ssid = "Laboratorios_ITZ";
const char* password = "itzacatepec";

// ===== CONFIGURACIÓN DE SENSORES =====
// Pines GPIO
#define TRIGGER_PIN  5
#define ECHO_PIN     18
#define VIBRATOR_PIN 4
#define GPS_RX_PIN   16
#define GPS_TX_PIN   17
#define I2C_SDA_PIN  21
#define I2C_SCL_PIN  22

// Configuraciones de sensores
#define MAX_DISTANCE 400
#define ULTRASONIC_THRESHOLD 100  // cm
#define TOF_THRESHOLD 50          // cm

// ===== CONFIGURACIÓN DE SERVIDOR =====
#define HTTP_PORT 80
#define WEBSOCKET_PORT 81
#define DATA_SEND_INTERVAL 200    // ms

// ===== CONFIGURACIÓN DEL SISTEMA =====
#define SERIAL_BAUD 115200
#define BATTERY_MONITOR_PIN A0    // Pin analógico para monitorear batería

#endif