#include <Servo.h>

const int RADAR_SERVO_PIN = 9;
const int LASER_SERVO_PIN = 10;
const int LASER_PIN = 11;
const int SPEAKER_PIN = 6;
const int TRIG_PIN = 7;
const int ECHO_PIN = 8;

const int DETECTION_THRESHOLD = 70;
const int SWEEP_DELAY = 70;  // Increased for better readings
const int TARGET_LOCK_DELAY = 1000;
const int CONFIRMATION_READINGS = 3;  // Number of readings to confirm target

Servo radarServo;
Servo laserServo;

void setup() {
  Serial.begin(9600);
  Serial.println("System Initializing...");

  radarServo.attach(RADAR_SERVO_PIN);
  laserServo.attach(LASER_SERVO_PIN);

  pinMode(LASER_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(SPEAKER_PIN, OUTPUT);

  digitalWrite(LASER_PIN, LOW);
  radarServo.write(90);
  laserServo.write(90);
  delay(1000);

  Serial.println("System Ready. Starting Scan...");
}

void loop() {
  scanForTargets();
}

void scanForTargets() {
  // Forward sweep
  for (int angle = 45; angle <= 135; angle += 2) {
    radarServo.write(angle);
    delay(SWEEP_DELAY);
    
    if (confirmTarget(angle)) {
      targetEngaged(angle);
      return;  // Exit completely and restart scan
    }
  }

  // Backward sweep
  for (int angle = 135; angle >= 45; angle -= 2) {
    radarServo.write(angle);
    delay(SWEEP_DELAY);
    
    if (confirmTarget(angle)) {
      targetEngaged(angle);
      return;  // Exit completely and restart scan
    }
  }
}

bool confirmTarget(int angle) {
  int validReadings = 0;
  long totalDistance = 0;
  
  // Take multiple readings for confirmation
  for (int i = 0; i < CONFIRMATION_READINGS; i++) {
    long distance = getDistance();
    
    if (distance < DETECTION_THRESHOLD && distance > 5) {  // Minimum 5cm to avoid false readings
      validReadings++;
      totalDistance += distance;
    }
    delay(10);  // Small delay between readings
  }
  
  // Require at least 2 out of 3 readings to be valid
  if (validReadings >= 2) {
    long avgDistance = totalDistance / validReadings;
    Serial.print("Target confirmed at angle: ");
    Serial.print(angle);
    Serial.print(", Distance: ");
    Serial.println(avgDistance);
    return true;
  }
  
  return false;
}

long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout
  
  if (duration == 0) {
    return 999;  // Return large value if no echo
  }
  
  long distance = duration * 0.034 / 2;  // More accurate calculation
  return distance;
}

void targetEngaged(int targetAngle) {
  Serial.println(">>> ENGAGING TARGET <<<");
  
  // Point laser at target
  laserServo.write(targetAngle);
  delay(300);  // Allow servo to reach position
  
  // Activate laser and sound alarm
  digitalWrite(LASER_PIN, HIGH);
  soundSiren();
  
  // Keep target locked for specified time
  delay(TARGET_LOCK_DELAY);
  
  // Disengage
  digitalWrite(LASER_PIN, LOW);
  noTone(SPEAKER_PIN);
  
  // Return to center positions
  radarServo.write(90);
  laserServo.write(90);
  delay(500);
  
  Serial.println("Target disengaged. Resuming scan...");
}

void soundSiren() {
  for (int i = 0; i < 5; i++) {
    tone(SPEAKER_PIN, 1200, 100);
    delay(100);
    tone(SPEAKER_PIN, 800, 100);
    delay(100);
  }
}
