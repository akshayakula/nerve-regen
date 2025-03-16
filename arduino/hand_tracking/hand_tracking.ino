#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// Initialize ADC & MPU6050
Adafruit_ADS1115 ads;
Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);  // Match the higher baud rate
  Wire.begin();

  // Initialize ADS1115
  if (!ads.begin()) {
    Serial.println("Failed to find ADS1115!");
    while (1);
  }

  // Initialize MPU6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050!");
    while (1);
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_250_DEG);
}

void loop() {
  // Read EMG values from ADS1115
  int16_t emg1 = ads.readADC_SingleEnded(0);
  int16_t emg2 = ads.readADC_SingleEnded(1);
  float emg1_voltage = ads.computeVolts(emg1);
  float emg2_voltage = ads.computeVolts(emg2);

  // Read MPU6050 data
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Format data for our application
  Serial.print("EMG1:");
  Serial.print(emg1);
  Serial.print(" EMG2:");
  Serial.print(emg2);
  Serial.print(" Voltage1:");
  Serial.print(emg1_voltage);
  Serial.print(" Voltage2:");
  Serial.print(emg2_voltage);
  Serial.print(" GyroX:");
  Serial.print(g.gyro.x);
  Serial.print(" GyroY:");
  Serial.print(g.gyro.y);
  Serial.print(" GyroZ:");
  Serial.println(g.gyro.z);

  // Check for incoming angle commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    if (command.startsWith("ANGLE:")) {
      float angle = command.substring(6).toFloat();
      Serial.print("Received angle: ");
      Serial.println(angle);
    }
  }

  delay(100);  // 10Hz sampling rate
} 