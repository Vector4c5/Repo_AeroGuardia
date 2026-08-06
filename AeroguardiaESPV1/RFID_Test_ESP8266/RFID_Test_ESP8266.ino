// Prueba aislada del lector MFRC522 en NodeMCU (ESP8266) — solo verifica
// que el hardware lee tarjetas correctamente. No usa WiFi, servo, LEDs ni API.
// Cableado: SDA/SS -> D4, RST -> D3 (bus SPI por hardware: SCK D5, MOSI D7, MISO D6).

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN D4
#define RST_PIN D3
MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  while (!Serial);

  SPI.begin();
  rfid.PCD_Init();

  byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("Version register RC522: 0x");
  Serial.println(version, HEX);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("SIN COMUNICACION con el RC522 (revisar cableado SPI/alimentacion)");
  } else {
    Serial.println("RC522 responde correctamente por SPI");
  }

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
