#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include "secrets.h"

// -------- WIFI --------
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// -------- RFID --------
#define SS_PIN 5
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

// -------- LEDS --------
#define LED_VERDE 2
#define LED_ROJO 4

// -------- SERVO --------
Servo servo;
int servoPin = 15;

// -------- TARJETAS --------
String uid1 = "32AA5421";
String nombre1 = "Carlo";

String uid2 = "60DB8E21";
String nombre2 = "Hector";

// -------- API --------
String apiURL = "http://192.168.100.25:3000/api/acceso";

// ID de Mongo del hangar al que pertenece este lector (se ve en la URL
// /hangar/<id> dentro de la web). El servidor lo usa para saber contra
// qué roster de tarjetas validar el UID.
String hangarId = "6a682b431175610649250f73";

unsigned long lastScan = 0;

void setup() {
  Serial.begin(115200);

  SPI.begin();
  rfid.PCD_Init();

  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);

  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_ROJO, LOW);

  // SERVO
  servo.attach(servoPin);
  servo.write(0); // puerta cerrada

  // WIFI
  WiFi.begin(ssid, password);

  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado");
}

void loop() {

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  if (millis() - lastScan < 2000) return;
  lastScan = millis();

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.println("UID: " + uid);

  String nombre = "DESCONOCIDO";

  if (uid == uid1) {
    nombre = nombre1;
  } else if (uid == uid2) {
    nombre = nombre2;
  }

  if (nombre != "DESCONOCIDO") {
    accesoPermitido();
    abrirPuerta();
  } else {
    accesoDenegado();
  }

  enviarEvento(uid);

  rfid.PICC_HaltA();
}

// -------- LED VERDE --------
void accesoPermitido() {
  digitalWrite(LED_VERDE, HIGH);
  delay(500);
  digitalWrite(LED_VERDE, LOW);
}

// -------- LED ROJO --------
void accesoDenegado() {
  digitalWrite(LED_ROJO, HIGH);
  delay(500);
  digitalWrite(LED_ROJO, LOW);
}

// -------- SERVO --------
void abrirPuerta() {
  Serial.println("Abriendo puerta");

  servo.write(90); // abrir
  delay(3000);

  servo.write(0); // cerrar
  Serial.println("Cerrando puerta");
}

// -------- ENVIAR A WEB --------
void enviarEvento(String uid) {

  HTTPClient http;
  http.begin(apiURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_API_KEY);

  String body = "{\"uid\":\"" + uid + "\", \"hangarId\":\"" + hangarId + "\"}";
  http.POST(body);

  http.end();
}