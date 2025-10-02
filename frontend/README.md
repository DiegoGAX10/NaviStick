# NaviStick - Aplicación de Monitoreo del Bastón Inteligente

## 📱 Descripción

NaviStick es una aplicación móvil desarrollada en React Native/Expo para monitorear y controlar un bastón inteligente equipado con múltiples sensores conectados a un ESP32. La aplicación permite visualizar en tiempo real el estado de todos los sensores y recibir alertas de seguridad.

## 🛠 Componentes del Sistema

### Sensores del Bastón:
- **Sensor Ultrasónico**: Detecta obstáculos frontales a la altura del pecho
- **Sensor ToF (Time of Flight)**: Detecta escaleras y desniveles mirando hacia abajo  
- **Motor Vibrador**: Proporciona feedback táctil con diferentes patrones de vibración
- **GPS + IMU**: Sistema de navegación y orientación (opcional)

### Conectividad:
- **ESP32**: Microcontrolador principal que se conecta a la app via WiFi
- **WebSocket**: Comunicación en tiempo real para datos de sensores
- **HTTP**: Para comandos y configuración

## 🎯 Funcionalidades

### 📊 Dashboard Principal
- Monitoreo en tiempo real de todos los sensores
- Indicadores visuales de estado de conexión
- Información del sistema (batería, temperatura, tiempo de funcionamiento)
- Botones de control rápido (calibración, alerta de emergencia)

### 🔧 Componentes de Sensores

#### Sensor Ultrasónico
- Visualización de distancia en tiempo real
- Alerta visual cuando detecta obstáculos (<100cm por defecto)
- Animaciones y colores de estado

#### Sensor ToF (Escaleras)
- Detección de desniveles y escaleras
- Indicador de nivel de riesgo
- Clasificación automática del tipo de superficie

#### Motor Vibrador
- Control de patrones de vibración
- Ajuste de intensidad
- Botón de prueba de vibración
- 5 patrones predefinidos: Desactivado, Alerta, Advertencia, Pulso, Continuo

#### Navegación GPS/IMU
- Brújula digital animada
- Coordenadas GPS en tiempo real  
- Detector de movimiento basado en acelerometría
- Indicador de precisión GPS

### 🔔 Sistema de Alertas
- Notificaciones locales para diferentes eventos
- Alertas sonoras y visuales
- Configuración personalizable de tipos de alerta
- Alerta de emergencia con opciones de ayuda

### ⚙️ Configuración
- Configuración de IP del ESP32
- Ajuste de umbrales de sensores
- Configuración de alertas y notificaciones
- Opciones avanzadas (reconexión automática, modo debug)
- Exportación de logs y restauración de configuración

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn
- Expo CLI
- Dispositivo móvil con Expo Go o emulador

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd NaviStick/frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
npm start
```

4. **Ejecutar en dispositivo**
- Escanea el código QR con Expo Go (Android/iOS)
- O usa los comandos `npm run android` / `npm run ios`

## 📡 Configuración del ESP32

### Hardware requerido:
- ESP32 DevKit
- Sensor ultrasónico HC-SR04
- Sensor ToF VL53L0X
- Motor vibrador
- Módulo GPS (opcional)
- IMU/Acelerómetro (opcional)

### Configuración de red:
1. Configura tu ESP32 para conectarse a tu red WiFi
2. El ESP32 debe crear un servidor WebSocket en el puerto 81
3. Configura endpoints HTTP para comandos
4. En la app, ve a Configuración y establece la IP del ESP32

### Formato de datos esperado:

**Datos del sensor via WebSocket:**
```json
{
  "sensor": "ultrasonic",
  "distance": 85,
  "timestamp": "2024-01-01T12:00:00Z"
}

{
  "sensor": "tof", 
  "distance": 120,
  "timestamp": "2024-01-01T12:00:00Z"
}

{
  "sensor": "vibrator",
  "pattern": "alert",
  "intensity": 75,
  "active": true,
  "timestamp": "2024-01-01T12:00:00Z"
}

{
  "sensor": "gps",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 3.5,
  "timestamp": "2024-01-01T12:00:00Z"
}

{
  "sensor": "imu",
  "acceleration": {"x": 0.1, "y": -9.8, "z": 0.2},
  "gyroscope": {"x": 0, "y": 0, "z": 0},
  "orientation": 45,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🎨 Estructura del Código

```
src/
├── components/           # Componentes de sensores
│   ├── UltrasonicSensor.js
│   ├── ToFSensor.js
│   ├── VibratorMotor.js
│   └── NavigationSensor.js
├── screens/             # Pantallas de la app
│   ├── Dashboard.js
│   └── Settings.js
├── services/            # Servicios y lógica de negocio
│   ├── ESP32Service.js
│   └── AlertService.js
└── styles/              # Estilos compartidos
```

## 🎯 Uso de la Aplicación

### Primer uso:
1. Abre la aplicación
2. Ve a Configuración (⚙️)
3. Establece la IP de tu ESP32
4. Prueba la conexión
5. Regresa al Dashboard para ver los datos en tiempo real

### Operación normal:
- La app se conectará automáticamente al ESP32 al iniciar
- Todos los sensores se actualizarán en tiempo real
- Las alertas aparecerán automáticamente cuando se detecten obstáculos o problemas
- Puedes probar manualmente los patrones de vibración desde el dashboard

### Solución de problemas:
- Si no hay conexión, verifica que el ESP32 y el móvil estén en la misma red WiFi
- Usa el botón "Probar Conexión" en Configuración
- Activa el modo Debug para ver información adicional
- Usa "Reconectar" si se pierde la conexión

## 🔧 Personalización

### Umbrales de sensores:
- Ultrasónico: Cambia la distancia mínima para detectar obstáculos
- ToF: Ajusta la sensibilidad para escaleras y desniveles

### Alertas:
- Activa/desactiva diferentes tipos de notificaciones
- Configura patrones de vibración personalizados
- Ajusta el volumen de alertas sonoras

## 📝 Notas de Desarrollo

- La app usa WebSockets para comunicación en tiempo real
- Todas las configuraciones se guardan localmente con AsyncStorage  
- Las animaciones usan React Native Animated API para mejor rendimiento
- El sistema de alertas es modular y extensible

## 🤝 Contribución

Para contribuir al proyecto:
1. Fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ve el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crea un issue en el repositorio
- Contacta al equipo de desarrollo

---

**NaviStick v1.0 - Sistema de Asistencia para Movilidad** 🦯✨