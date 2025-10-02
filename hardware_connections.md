# Guía de Conexiones Hardware - NaviStick ESP32

## Lista de Componentes Necesarios

### Microcontrolador Principal:
- **ESP32 DevKit v1** (30 pines)

### Sensores:
- **HC-SR04** - Sensor Ultrasónico
- **VL53L0X** - Sensor ToF (Time of Flight)
- **NEO-6M/NEO-8M** - Módulo GPS (opcional)
- **MPU6050/MPU9250** - Acelerómetro/Giroscopio/IMU (opcional)

### Actuadores:
- **Motor Vibrador** (3V-5V)
- **Transistor NPN 2N2222** (para controlar el motor)
- **Diodo 1N4007** (protección)
- **Resistencia 1KΩ**

### Alimentación:
- **Batería Li-Po 3.7V** (recomendado 2000mAh+)
- **Módulo de carga TP4056**
- **Regulador de voltaje 3.3V** (opcional, ESP32 ya tiene uno interno)

---

## Conexiones ESP32

### ESP32 Pinout:
```
                    ESP32 DevKit v1
                  ┌─────────────────────┐
                  │                     │
              3V3 ├─1               30──┤ GPIO0
              GND ├─2               29──┤ GPIO2
          TRIGGER ├─5               28──┤ GPIO4  ── VIBRATOR
                  ├─6               27──┤ GPIO16 ── GPS_RX
                  ├─7               26──┤ GPIO17 ── GPS_TX
               NC ├─8               25──┤ GPIO5
               NC ├─9               24──┤ GPIO18 ── ECHO
               NC ├─10              23──┤ GPIO19
               NC ├─11              22──┤ GPIO21 ── SDA
               NC ├─12              21──┤ GPIO22 ── SCL
               NC ├─13              20──┤ GPIO23
               NC ├─14              19──┤ GND
              VIN ├─15              18──┤ 3V3
                  └─────────────────────┘
```

---

## Conexiones Detalladas

### 1. **Sensor Ultrasónico HC-SR04**
```
HC-SR04    →    ESP32
VCC        →    3.3V (pin 3V3)
GND        →    GND  (pin GND)
Trig       →    GPIO5  (pin 5)
Echo       →    GPIO18 (pin 18)
```

### 2. **Sensor ToF VL53L0X** (I2C)
```
VL53L0X    →    ESP32
VCC        →    3.3V
GND        →    GND
SDA        →    GPIO21 (pin SDA)
SCL        →    GPIO22 (pin SCL)
```

### 3. **Motor Vibrador** (con transistor)
```
Motor Vibrador Control Circuit:

ESP32 GPIO4 ────┬── 1KΩ ── Base (2N2222)
                │
              GND ── Emitter (2N2222)
                
        +3.3V ──┬── Motor Vibrador (+)
                │
    Collector ──┴── (2N2222)
                │
    Motor (-) ──┴── GND
                │
    Diodo 1N4007 (paralelo al motor, cátodo a +3.3V)
```

### 4. **Módulo GPS NEO-6M** (opcional)
```
GPS        →    ESP32
VCC        →    3.3V
GND        →    GND
TX         →    GPIO16 (RX2)
RX         →    GPIO17 (TX2)
```

### 5. **IMU MPU6050** (opcional) - I2C
```
MPU6050    →    ESP32
VCC        →    3.3V
GND        →    GND
SDA        →    GPIO21 (compartido con VL53L0X)
SCL        →    GPIO22 (compartido con VL53L0X)
```

### 6. **Sistema de Alimentación**
```
Batería Li-Po 3.7V
    │
    ├── TP4056 (carga)
    │     │
    │     └── MicroUSB (para cargar)
    │
    └── ESP32 VIN (pin 15)
```

---

##Diagrama Esquemático

```
                    ┌─────────────────┐
                    │     ESP32       │
                    │                 │
    HC-SR04 ────────┤ GPIO5, GPIO18   │
                    │                 │
    VL53L0X ────────┤ GPIO21, GPIO22  │◄── I2C Bus
                    │                 │
    MPU6050 ────────┤ GPIO21, GPIO22  │◄── (compartido)
                    │                 │
    GPS ────────────┤ GPIO16, GPIO17  │
                    │                 │
    Vibrador ───────┤ GPIO4           │
                    │                 │
    Batería ────────┤ VIN, GND        │
                    └─────────────────┘
                            │
                            ▼
                      WiFi Connection
                            │
                            ▼
                    📱 App NaviStick
```

---

## Configuración de Alimentación

### Consumo Estimado:
- **ESP32**: 160mA (WiFi activo)
- **HC-SR04**: 15mA (durante medición)
- **VL53L0X**: 10mA
- **GPS**: 45mA
- **MPU6050**: 3mA
- **Motor Vibrador**: 100mA (cuando activo)

**Total máximo**: ~333mA
**Batería recomendada**: 2000mAh (≈6 horas de uso continuo)

---

## Pasos de Ensamblaje

### 1. **Preparación**
- Soldar headers al ESP32 si es necesario
- Preparar protoboard o PCB personalizada
- Tener cable dupont macho-hembra listo

### 2. **Conexiones Básicas**
1. Conectar alimentación (3.3V y GND) a todas las partes
2. Conectar sensor ultrasónico
3. Conectar sensor ToF en bus I2C
4. Montar circuito del motor vibrador

### 3. **Conexiones Opcionales**
5. Conectar GPS si se va a usar
6. Conectar IMU en el mismo bus I2C

### 4. **Verificación**
- Comprobar continuidad con multímetro
- Verificar que no hay cortocircuitos
- Medir voltajes en puntos clave

---

## Configuración WiFi

### En el código ESP32:
```cpp
const char* ssid = "TU_WIFI_SSID";      // Cambiar por tu red
const char* password = "TU_WIFI_PASSWORD"; // Cambiar por tu contraseña
```

### En la App:
1. Abrir configuración
2. Buscar la IP del ESP32 en tu router
3. Introducir la IP (ej: 192.168.1.100)
4. Probar conexión

---

## Pruebas de Funcionamiento

### 1. **Conectividad**
- Monitor Serie debe mostrar IP asignada
- Navegador web: `http://IP_DEL_ESP32/status`
- Debe devolver JSON con datos del sistema

### 2. **WebSocket**
- Usar herramienta como WebSocket King
- Conectar a `ws://IP_DEL_ESP32:81`
- Debe recibir datos JSON cada 200ms

### 3. **Sensores**
- Poner obstáculo frente al ultrasónico
- Mover el ToF sobre diferentes superficies
- Verificar que vibrador responde a comandos HTTP

---

## Librerías Necesarias (Arduino IDE)

```cpp
// Instalar estas librerías desde el Library Manager:
#include <WiFi.h>              // ESP32 (incluida)
#include <WebSocketsServer.h>  // arduinoWebSockets by Markus Sattler
#include <WebServer.h>         // ESP32 (incluida)  
#include <ArduinoJson.h>       // ArduinoJson by Benoit Blanchon
#include <NewPing.h>           // NewPing by Tim Eckel
#include <Wire.h>              // ESP32 (incluida)

// Para sensores específicos (instalar si se usan):
// #include <VL53L0X.h>        // VL53L0X by Pololu
// #include <SoftwareSerial.h> // Para GPS (si se usa)
// #include <MPU6050.h>        // MPU6050 by Electronic Cats
```

---

## Integración con la App

Una vez que tengas el hardware montado:

1. **Subir código al ESP32**
2. **Configurar WiFi** (cambiar SSID y password)
3. **Obtener IP** del ESP32 (Serial Monitor)
4. **Configurar App** con la IP obtenida
5. **¡Listo para usar!**

La app se conectará automáticamente y empezará a mostrar datos en tiempo real de todos los sensores.

---

## Consideraciones de Seguridad

- ✅ Usar reguladores de voltaje apropiados
- ✅ Incluir protección contra inversión de polaridad
- ✅ Usar fusibles o limitadores de corriente
- ✅ Aislar circuitos de alta corriente (motor)
- ✅ Verificar conexiones antes de alimentar

---
