const int EMG_PIN = A0;    // EMG sensor on analog pin 0
const int VOLTAGE_PIN = A1; // Voltage sensor on analog pin 1
const int GYRO_X_PIN = A2;  // Gyroscope X-axis
const int GYRO_Y_PIN = A3;  // Gyroscope Y-axis
const int GYRO_Z_PIN = A4;  // Gyroscope Z-axis

void setup() {
  Serial.begin(9600);
  pinMode(EMG_PIN, INPUT);
  pinMode(VOLTAGE_PIN, INPUT);
  pinMode(GYRO_X_PIN, INPUT);
  pinMode(GYRO_Y_PIN, INPUT);
  pinMode(GYRO_Z_PIN, INPUT);
}

void loop() {
  // Read sensor values
  int emgValue = analogRead(EMG_PIN);
  float voltage = analogRead(VOLTAGE_PIN) * (5.0 / 1023.0);
  int gyroX = analogRead(GYRO_X_PIN);
  int gyroY = analogRead(GYRO_Y_PIN);
  int gyroZ = analogRead(GYRO_Z_PIN);

  // Send data in format: "EMG:123 Voltage:3.5 GyroX:345 GyroY:456 GyroZ:567"
  Serial.print("EMG:");
  Serial.print(emgValue);
  Serial.print(" Voltage:");
  Serial.print(voltage);
  Serial.print(" GyroX:");
  Serial.print(gyroX);
  Serial.print(" GyroY:");
  Serial.print(gyroY);
  Serial.print(" GyroZ:");
  Serial.println(gyroZ);

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