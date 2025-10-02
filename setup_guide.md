# 🚀 Guía de Configuración Completa - NaviStick

## 📋 Resumen de la Conexión

```
🦯 Bastón Físico  ←→  🖥️ ESP32  ←→  📡 WiFi  ←→  📱 App NaviStick
```

### **Flujo de Datos:**
1. **Sensores → ESP32**: Datos físicos (distancias, orientación, etc.)
2. **ESP32 → App**: JSON via WebSocket en tiempo real
3. **App → ESP32**: Comandos via HTTP (vibración, calibración)
4. **App**: Visualiza datos y muestra alertas al usuario

---

## 🛠 Paso 1: Preparación del Hardware

### **Componentes Mínimos Necesarios:**
- ✅ ESP32 DevKit v1
- ✅ Sensor Ultrasónico HC-SR04
- ✅ Motor Vibrador + Transistor 2N2222
- ✅ Resistencia 1KΩ y Diodo 1N4007
- ✅ Protoboard y cables
- ✅ Fuente de alimentación (batería o USB)

### **Conexiones Básicas:**
```
HC-SR04:
  VCC → 3.3V, GND → GND
  Trig → GPIO5, Echo → GPIO18

Motor Vibrador:
  Control → GPIO4 (via transistor)
  
ESP32:
  Alimentación → 3.3V o USB
```

---

## 💻 Paso 2: Programación del ESP32

### **1. Instalar Arduino IDE**
- Descargar desde https://arduino.cc/en/software
- Instalar soporte para ESP32

### **2. Configurar ESP32 en Arduino IDE**
```
File → Preferences → Additional Boards Manager URLs:
https://dl.espressif.com/dl/package_esp32_index.json

Tools → Board → Boards Manager → buscar "ESP32" → Install
```

### **3. Instalar Librerías Necesarias**
```
Tools → Manage Libraries → Buscar e instalar:
- ArduinoJson (by Benoit Blanchon)
- arduinoWebSockets (by Markus Sattler)
- NewPing (by Tim Eckel)
```

### **4. Configurar el Código**
```cpp
// En esp32_naviStick.ino, cambiar estas líneas:
const char* ssid = "TU_NOMBRE_WIFI";     // ← Cambiar aquí
const char* password = "TU_PASSWORD";    // ← Cambiar aquí
```

### **5. Subir el Código**
1. Conectar ESP32 vía USB
2. Seleccionar puerto correcto en `Tools → Port`
3. Seleccionar placa: `ESP32 Dev Module`
4. Presionar Upload (→)

---

## 📱 Paso 3: Configuración de la App

### **1. Instalar la App**
```bash
cd frontend
npm install
npm start
```

### **2. Obtener IP del ESP32**
- Abrir Serial Monitor en Arduino IDE (Ctrl+Shift+M)
- Reiniciar ESP32
- Buscar línea: `IP Address: 192.168.1.XXX`
- **Anotar esta IP** ✏️

### **3. Configurar IP en la App**
1. Abrir app NaviStick
2. Ir a Configuración (⚙️)
3. En "Dirección IP del ESP32" introducir la IP obtenida
4. Presionar el botón ✅ para confirmar
5. Usar "Probar Conexión" para verificar

---

## 🔄 Paso 4: Pruebas de Conexión

### **Test 1: Conectividad Básica**
```bash
# Desde terminal/navegador:
curl http://IP_DEL_ESP32/status

# Debe devolver algo como:
{"battery":75.0,"temperature":25.2,"uptime":120,"errors":"[]"}
```

### **Test 2: WebSocket**
1. Usar herramienta como "WebSocket King" o navegador
2. Conectar a: `ws://IP_DEL_ESP32:81`
3. Debe recibir datos JSON cada 200ms:
```json
{"sensor":"ultrasonic","distance":85.3,"timestamp":"12345"}
{"sensor":"tof","distance":45.7,"timestamp":"12346"}
```

### **Test 3: Control de Vibrador**
```bash
# Activar vibración vía HTTP:
curl -X POST http://IP_DEL_ESP32/vibrate \
  -d "pattern=alert&intensity=75"
```

---

## 📊 Paso 5: Verificar Funcionamiento

### **En el ESP32 (Serial Monitor):**
```
NaviStick ESP32 iniciado correctamente!
IP Address: 192.168.1.100
Servidor HTTP iniciado en puerto 80
Servidor WebSocket iniciado en puerto 81
Sensores inicializados
[0] Conectado desde 192.168.1.105  ← App conectada
```

### **En la App:**
- ✅ Estado de conexión: "Conectado"
- ✅ Datos de sensores actualizándose en tiempo real
- ✅ Animaciones funcionando
- ✅ Alertas apareciendo cuando sensores detectan cambios

---

## 🔧 Solución de Problemas Comunes

### **❌ "No se puede conectar al ESP32"**
**Posibles causas:**
- ESP32 y móvil no están en la misma red WiFi
- IP incorrecta en la configuración
- Firewall bloqueando conexiones
- ESP32 sin alimentación o código no subido

**Soluciones:**
1. Verificar que ambos dispositivos están en la misma red
2. Hacer ping al ESP32: `ping IP_DEL_ESP32`
3. Revisar Serial Monitor para errores
4. Reiniciar ESP32 y anotar nueva IP

### **❌ "Conexión establecida pero sin datos"**
**Posibles causas:**
- WebSocket no funcionando correctamente
- Sensores mal conectados
- Error en código de sensores

**Soluciones:**
1. Verificar conexiones físicas de sensores
2. Revisar Serial Monitor para errores de sensores
3. Probar WebSocket manualmente
4. Verificar que librerías están instaladas

### **❌ "Vibrador no funciona"**
**Posibles causas:**
- Transistor mal conectado
- Pin GPIO incorrecto
- Voltaje insuficiente

**Soluciones:**
1. Verificar circuito del transistor
2. Probar LED en lugar del motor para debug
3. Medir voltaje en pins de control

---

## 📡 Comunicación Detallada

### **WebSocket - Datos en Tiempo Real**
```javascript
// En ESP32 se envía:
{
  "sensor": "ultrasonic", 
  "distance": 85.3,
  "timestamp": "1640995200000"
}

// App recibe y procesa:
ESP32Service.addListener('ultrasonic', (data) => {
  console.log(`Obstáculo a ${data.distance}cm`);
  if(data.distance < 100) {
    AlertService.alertObstacle(data.distance);
  }
});
```

### **HTTP - Comandos**
```javascript
// Desde la App:
await ESP32Service.activateVibration('alert', 80);

// Se convierte en:
POST http://192.168.1.100/vibrate
Body: pattern=alert&intensity=80

// ESP32 responde:
{"status":"success"}
```

---

## 🎯 Configuración Avanzada

### **Cambiar Frecuencia de Datos**
```cpp
// En ESP32, línea 93:
delay(200); // 200ms = 5 datos/segundo

// Para más frecuencia:
delay(100); // 100ms = 10 datos/segundo
```

### **Agregar Nuevos Sensores**
1. Definir pines en sección de configuración
2. Agregar lectura en `readSensors()`
3. Crear JSON en `sendSensorData()`
4. Actualizar app para procesar nuevos datos

### **Personalizar Patrones de Vibración**
```cpp
// En activateVibration(), agregar nuevo patrón:
else if (currentVibrationPattern == "custom") {
  // Tu patrón personalizado aquí
  analogWrite(VIBRATOR_PIN, map(vibrationIntensity, 0, 100, 0, 255));
  delay(100);
  analogWrite(VIBRATOR_PIN, 0);
  delay(50);
  // ... repetir patrón
}
```

---

## 🔋 Optimización de Batería

### **En ESP32:**
```cpp
// Reducir frecuencia WiFi
WiFi.setSleep(true);

// Deep sleep cuando no se usa (avanzado)
esp_sleep_enable_timer_wakeup(10 * 1000000); // 10 segundos
esp_deep_sleep_start();
```

### **En App:**
- Configurar reconexión automática inteligente
- Reducir frecuencia de polling cuando no hay actividad
- Implementar modo de bajo consumo

---

## ✅ Checklist Final

Antes de usar el sistema completamente:

- [ ] Hardware correctamente conectado y alimentado
- [ ] ESP32 programado y conectado a WiFi
- [ ] App instalada y configurada con IP correcta
- [ ] Conexión WebSocket funcionando (datos en tiempo real)
- [ ] Conexión HTTP funcionando (comandos)
- [ ] Todos los sensores enviando datos válidos
- [ ] Sistema de vibración respondiendo
- [ ] Alertas de la app funcionando
- [ ] Configuración guardada correctamente

---

## 📞 Próximos Pasos

Una vez que tengas todo funcionando:

1. **Montaje en el Bastón**: Integrar electrónica en una carcasa resistente
2. **Calibración Fina**: Ajustar umbrales según el usuario específico  
3. **Pruebas de Campo**: Usar en entornos reales para ajustar sensibilidad
4. **Optimización**: Mejorar algoritmos basados en el uso real

---

¿Tienes alguna duda específica sobre la conexión o configuración? 🤔💡