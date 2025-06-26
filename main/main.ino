#include <Servo.h>

const int RADAR_SERVO_PIN = 9;
const int LASER_SERVO_PIN = 10;
const int LASER_PIN = 11;
const int SPEAKER_PIN = 6;
const int TRIG_PIN = 7;
const int ECHO_PIN = 8;

const int DETECTION_THRESHOLD = 50;
const int SWEEP_DELAY = 25;
const int TARGET_LOCK_DELAY = 2000;

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
  for (int angle = 45; angle <= 135; angle++) {
    radarServo.write(angle);
    delay(SWEEP_DELAY);

    long distance = getDistance();
    Serial.print("Angle: ");
    Serial.print(angle);
    Serial.print(", Distance: ");
    Serial.println(distance);

    if (distance < DETECTION_THRESHOLD && distance > 0) {
      Serial.println(">>> Target Detected! <<<");
      targetEngaged(angle);
      break;
    }
  }

  for (int angle = 135; angle >= 45; angle--) {
    radarServo.write(angle);
    delay(SWEEP_DELAY);

    long distance = getDistance();
    Serial.print("Angle: ");
    Serial.print(angle);
    Serial.print(", Distance: ");
    Serial.println(distance);

    if (distance < DETECTION_THRESHOLD && distance > 0) {
      Serial.println(">>> Target Detected! <<<");
      targetEngaged(angle);
      break;
    }
  }
}

long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  long distance = duration / 29 / 2;
  return distance;
}

void targetEngaged(int targetAngle) {
  laserServo.write(targetAngle);
  digitalWrite(LASER_PIN, HIGH);
  soundSiren(true);
  delay(TARGET_LOCK_DELAY);
  soundSiren(false);
  digitalWrite(LASER_PIN, LOW);
  radarServo.write(90);
  laserServo.write(90);
  delay(500);
  Serial.println("Target disengaged. Resuming scan.");
}

void soundSiren(bool play) {
  if (play) {
    tone(SPEAKER_PIN, 1200, 150);
    delay(150);
    tone(SPEAKER_PIN, 800, 150);
    delay(150);
  } else {
    noTone(SPEAKER_PIN);
  }
} 
