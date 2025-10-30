/**
 * Script de prueba de conexión ESP32
 * Ejecutar con: node test_esp32_connection.js <IP_DEL_ESP32>
 * Ejemplo: node test_esp32_connection.js 192.168.1.150
 */

const http = require('http');

// Obtener IP desde argumentos o usar default
const esp32IP = process.argv[2] || '192.168.1.100';
const baseUrl = `http://${esp32IP}`;

console.log('==== NaviStick ESP32 - Test de Conexión ====\n');
console.log(`Intentando conectar a: ${baseUrl}\n`);

// Test 1: Endpoint raíz
function testRoot() {
  return new Promise((resolve, reject) => {
    console.log('Test 1: GET / (Página principal)');
    http.get(`${baseUrl}/`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Conexión exitosa!');
          console.log(`Status: ${res.statusCode}`);
          console.log(`Respuesta: ${data.substring(0, 100)}...\n`);
          resolve(true);
        } else {
          console.log(`❌ Error: Status ${res.statusCode}\n`);
          reject(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ Error de conexión: ${err.message}\n`);
      reject(err);
    });
  });
}

// Test 2: Endpoint /status
function testStatus() {
  return new Promise((resolve, reject) => {
    console.log('Test 2: GET /status (Estado del sistema)');
    http.get(`${baseUrl}/status`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ Endpoint /status OK');
            console.log('Datos recibidos:', json);
            console.log('');
            resolve(json);
          } catch (e) {
            console.log('❌ Error parseando JSON:', e.message);
            console.log('Respuesta raw:', data, '\n');
            reject(e);
          }
        } else {
          console.log(`❌ Error: Status ${res.statusCode}\n`);
          reject(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ Error de conexión: ${err.message}\n`);
      reject(err);
    });
  });
}

// Ejecutar tests
async function runTests() {
  try {
    await testRoot();
    await testStatus();
    
    console.log('==== Resumen ====');
    console.log('✅ Todos los tests pasaron!');
    console.log(`\nPara usar en la app, configura la IP como: ${esp32IP}`);
    console.log('\nEn ESP32Service.js, actualiza:');
    console.log(`  this.baseUrl = 'http://${esp32IP}';`);
    
  } catch (error) {
    console.log('\n==== Resumen ====');
    console.log('❌ Algunos tests fallaron');
    console.log('\nVerifica que:');
    console.log('1. El ESP32 esté encendido y conectado a WiFi');
    console.log('2. Tu computadora esté en la misma red WiFi');
    console.log('3. La IP sea correcta (revisa el Serial Monitor)');
    console.log(`4. Puedas hacer ping a la IP: ping ${esp32IP}`);
    process.exit(1);
  }
}

runTests();
