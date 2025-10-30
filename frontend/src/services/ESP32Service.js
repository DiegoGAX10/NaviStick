class ESP32Service {
  constructor() {
    this.baseUrl = 'http://192.168.1.100'; // IP por defecto del ESP32 - CAMBIAR POR LA IP REAL
    this.wsUrl = 'ws://192.168.1.100:81'; // WebSocket no funciona con este código básico
    this.websocket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Configurar IP del ESP32
  setESP32IP(ip) {
    this.baseUrl = `http://${ip}`;
    this.wsUrl = `ws://${ip}:81`;
  }

  // Conectar via WebSocket para datos en tiempo real
  connectWebSocket() {
    try {
      this.websocket = new WebSocket(this.wsUrl);
      
      this.websocket.onopen = () => {
        console.log('Conectado al ESP32 via WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.clearReconnectInterval();
        this.notifyListeners('connection', { status: 'connected' });
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleSensorData(data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Conexión WebSocket cerrada');
        this.isConnected = false;
        this.notifyListeners('connection', { status: 'disconnected' });
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        this.notifyListeners('connection', { status: 'error', error });
      };

    } catch (error) {
      console.error('Error conectando WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // Manejar datos de sensores recibidos
  handleSensorData(data) {
    const timestamp = new Date().toISOString();
    
    // Procesar datos según el tipo de sensor
    switch (data.sensor) {
      case 'ultrasonic':
        this.notifyListeners('ultrasonic', {
          distance: data.distance,
          obstacle: data.distance < 100, // Obstáculo si está a menos de 100cm
          timestamp
        });
        break;
      
      case 'tof':
        this.notifyListeners('tof', {
          distance: data.distance,
          stair: data.distance > 50, // Escalera si distancia es mayor a 50cm
          timestamp
        });
        break;
      
      case 'vibrator':
        this.notifyListeners('vibrator', {
          pattern: data.pattern,
          intensity: data.intensity,
          active: data.active,
          timestamp
        });
        break;
      
      case 'gps':
        this.notifyListeners('gps', {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp
        });
        break;
      
      case 'imu':
        this.notifyListeners('imu', {
          acceleration: data.acceleration,
          gyroscope: data.gyroscope,
          orientation: data.orientation,
          timestamp
        });
        break;
      
      default:
        console.log('Datos de sensor desconocido:', data);
    }
  }

  // Intentar reconectar
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intentando reconectar... Intento ${this.reconnectAttempts}`);
      
      this.reconnectInterval = setTimeout(() => {
        this.connectWebSocket();
      }, 3000 * this.reconnectAttempts); // Aumentar tiempo entre intentos
    } else {
      console.log('Máximo número de intentos de reconexión alcanzado');
      this.notifyListeners('connection', { status: 'failed' });
    }
  }

  clearReconnectInterval() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Enviar comandos al ESP32 via HTTP
  async sendCommand(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error enviando comando:', error);
      throw error;
    }
  }

  // Comandos específicos para el bastón
  async activateVibration(pattern = 'alert', intensity = 50) {
    return this.sendCommand('/vibrate', { pattern, intensity });
  }

  async setVibratorPattern(pattern) {
    return this.sendCommand('/vibrator/pattern', { pattern });
  }

  async calibrateSensors() {
    return this.sendCommand('/calibrate');
  }

  async getSystemStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estado del sistema:', error);
      throw error;
    }
  }

  // Sistema de listeners para eventos
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error en listener:', error);
        }
      });
    }
  }

  // Desconectar y limpiar recursos
  disconnect() {
    this.clearReconnectInterval();
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      baseUrl: this.baseUrl
    };
  }
}

export default new ESP32Service();