const int EMG_PIN = A0;    // EMG sensor on analog pin 0
const int VOLTAGE_PIN = A1; // Voltage sensor on analog pin 1

void setup() {
  Serial.begin(9600);
  pinMode(EMG_PIN, INPUT);
  pinMode(VOLTAGE_PIN, INPUT);
}

void loop() {
  // Read sensor values
  int emgValue = analogRead(EMG_PIN);
  float voltage = analogRead(VOLTAGE_PIN) * (5.0 / 1023.0);

  // Send data in format: "EMG:123 Voltage:3.5"
  Serial.print("EMG:");
  Serial.print(emgValue);
  Serial.print(" Voltage:");
  Serial.println(voltage);

  // Check for incoming commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    if (command.startsWith("ANGLE:")) {
      int angle = command.substring(6).toInt();
      // TODO: Add code to control hardware based on angle
      Serial.print("Received angle: ");
      Serial.println(angle);
    }
  }

  delay(100); // Sample every 100ms
} 