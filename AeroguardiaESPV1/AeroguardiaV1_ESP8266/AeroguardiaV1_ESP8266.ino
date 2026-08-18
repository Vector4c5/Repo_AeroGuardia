// Firmware ESP8266 (NodeMCU) — lector RC522 + servo de acceso + envío de
// eventos a la web. Cableado RC522: ver RFID_Test_ESP8266.ino
// (SDA/SS -> D4, RST -> D3, SCK D5, MOSI D7, MISO D6). Servo: señal en D1.
//
// El lector solo manda el UID crudo; el servidor decide AUTORIZADO/DENEGADO
// y resuelve el nombre real contra las tarjetas vinculadas a este hangar.
// El servo solo abre si la respuesta del servidor trae estado AUTORIZADO.
// Si no hay conexion (evento encolado), no se puede saber el veredicto,
// asi que el servo no se mueve en ese caso.
//
// Resiliencia de red: el lector sigue funcionando sin WiFi/API. Los eventos
// que no se puedan enviar se guardan en una cola FIFO en memoria y se
// reintentan automáticamente en cuanto vuelve la conexión.

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>
#include "secrets.h"

// -------- WIFI --------
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// -------- RFID --------
#define SS_PIN D4
#define RST_PIN D3
MFRC522 rfid(SS_PIN, RST_PIN);

// -------- SERVO DE ACCESO --------
#define SERVO_PIN D1
const int ANGULO_ABIERTO = 180;  // maximo logico 0-180; el recorrido real extra sale del rango de pulso en attach()
const int ANGULO_CERRADO = 0;
const unsigned long DURACION_ABIERTO_MS = 2000; // 2s antes de regresar

Servo servoAcceso;
bool servoActivo = false;
unsigned long servoInicio = 0;

void abrirAcceso() {
  servoAcceso.write(ANGULO_ABIERTO);
  servoActivo = true;
  servoInicio = millis();
}

void actualizarServo() {
  if (servoActivo && millis() - servoInicio >= DURACION_ABIERTO_MS) {
    servoAcceso.write(ANGULO_CERRADO);
    servoActivo = false;
  }
}

// -------- API --------
String apiURL = "http://192.168.1.243:3000/api/acceso";

// ID de Mongo del hangar al que pertenece este lector (se ve en la URL
// /hangar/<id> dentro de la web). El servidor lo usa para saber contra
// qué roster de tarjetas validar el UID.
String hangarId = "6a682b431175610649250f73";

unsigned long lastScan = 0;

// -------- COLA DE EVENTOS PENDIENTES --------
// Buffer circular en RAM: si no hay WiFi o el POST falla, el UID se
// encola aquí en vez de perderse, y se reintenta en cada loop() mientras
// haya conexión. Tamaño fijo para no comprometer la RAM del ESP8266.
#define MAX_PENDIENTES 30
char colaUids[MAX_PENDIENTES][9];
int colaInicio = 0;
int colaFin = 0;
int colaCount = 0;

void encolar(const String& uid) {
  if (colaCount >= MAX_PENDIENTES) {
    Serial.println("Cola llena (" + String(MAX_PENDIENTES) + "), se descarta el evento mas viejo");
    colaInicio = (colaInicio + 1) % MAX_PENDIENTES;
    colaCount--;
  }
  uid.toCharArray(colaUids[colaFin], 9);
  colaFin = (colaFin + 1) % MAX_PENDIENTES;
  colaCount++;
  Serial.println("Evento encolado (" + String(colaCount) + " pendientes): " + uid);
}

bool enviarEvento(const String& uid, bool* autorizado = nullptr) {
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClient client;
  HTTPClient http;
  http.begin(client, apiURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_API_KEY);

  String body = "{\"uid\":\"" + uid + "\", \"hangarId\":\"" + hangarId + "\"}";
  int codigo = http.POST(body);

  bool ok = (codigo == 200);
  if (ok && autorizado != nullptr) {
    // Sin libreria JSON: el body de exito trae {"evento":{"estado":"AUTORIZADO"|"DENEGADO",...}}
    String respuesta = http.getString();
    *autorizado = respuesta.indexOf("\"estado\":\"AUTORIZADO\"") >= 0;
  }

  http.end();
  return ok;
}

void vaciarCola() {
  while (colaCount > 0 && WiFi.status() == WL_CONNECTED) {
    String uid = String(colaUids[colaInicio]);
    if (!enviarEvento(uid)) {
      Serial.println("Fallo al reenviar " + uid + ", se reintenta despues");
      break;
    }
    Serial.println("Reenviado desde cola: " + uid + " (" + String(colaCount - 1) + " pendientes)");
    colaInicio = (colaInicio + 1) % MAX_PENDIENTES;
    colaCount--;
  }
}

// -------- RECONEXION WIFI NO BLOQUEANTE --------
unsigned long lastWifiAttempt = 0;

void asegurarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWifiAttempt < 5000) return;
  lastWifiAttempt = millis();
  Serial.println("Sin WiFi, reintentando conexion...");
  WiFi.reconnect();
}

void setup() {
  Serial.begin(115200);

  SPI.begin();
  rfid.PCD_Init();

  servoAcceso.attach(SERVO_PIN, 500, 2500); // rango de pulso ampliado: mas recorrido real que el default
  servoAcceso.write(ANGULO_CERRADO);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Conectando WiFi");
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado, IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nSin WiFi por ahora. El lector sigue funcionando y va a guardar los eventos hasta reconectar.");
  }

  Serial.println("Lector listo. Acerca una tarjeta...");
}

void loop() {

  asegurarWiFi();
  vaciarCola();
  actualizarServo();

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  if (millis() - lastScan < 2000) return;
  lastScan = millis();

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.println("Tarjeta detectada. UID: " + uid);

  bool autorizado = false;
  if (enviarEvento(uid, &autorizado)) {
    Serial.println("Evento enviado OK");
    if (autorizado) {
      Serial.println("Acceso AUTORIZADO, abriendo...");
      abrirAcceso();
    } else {
      Serial.println("Acceso DENEGADO, no se abre");
    }
  } else {
    Serial.println("Sin conexion, se encola (no se puede decidir apertura)");
    encolar(uid);
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
