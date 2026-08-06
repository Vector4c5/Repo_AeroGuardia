// Prueba aislada del lector MFRC522 — solo verifica que el hardware
// lee tarjetas correctamente. No usa WiFi, servo, LEDs ni API.
// Mismo cableado que AeroguardiaV1.ino: SS_PIN 5, RST_PIN 22 (bus SPI
// por hardware del ESP32: MISO 19, MOSI 23, SCK 18).

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 5
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  while (!Serial);

  SPI.begin();
  rfid.PCD_Init();

  Serial.println("Lector listo. Acerca una tarjeta...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.println("Tarjeta detectada. UID: " + uid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
