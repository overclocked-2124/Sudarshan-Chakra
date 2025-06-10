### **A Quick Word on Safety**

*   **LASER:** Even a small laser module can be harmful to your eyes. **NEVER** look directly into the laser beam or point it at anyone's face. Treat it with respect.
*   **POWER:** We will be using a 9V battery and an LM2596 power converter. Make sure your connections are correct before plugging in the battery to avoid damaging your components.

---

### **Part 1: Understanding Your Components**

Before we wire, let's understand *why* you have some of these parts.

*   **Arduino Uno:** This is the brain of your project. It will read the sensor, control the servos, and send signals to the laser and speaker.
*   **Servos (x2):** These are your motors that allow precise rotation. One will sweep the ultrasonic sensor (your "radar"), and the other will aim the laser.
*   **HC-SR04 Ultrasonic Sensor:** This is your "radar." It sends out a sound pulse and measures how long it takes for the echo to return, calculating distance.
*   **Laser Module:** Your "interceptor." It points at the detected target.
*   **9V Battery:** Your power source. **BUT**, a 9V battery cannot safely power two servos and an Arduino by itself. The servos draw too much current. This leads us to...
*   **LM2596 Buck Converter (Voltage Regulator):** This is a very important component! Its job is to take the 9V from the battery and efficiently "step it down" to a stable 5V. We will use this stable 5V to power the servos, which prevents your Arduino from crashing or behaving erratically.
*   **PAM8403 Audio Amplifier:** The speaker is too quiet to be driven directly by the Arduino. This small amplifier board takes the weak audio signal from the Arduino and makes it much louder for the speaker.

---

### **Part 2: Adjusting the LM2596 (Critical First Step!)**

Before you connect this to your main circuit, you **must** set its output voltage to 5V.

1.  Connect the 9V battery snap to your LM2596's **IN+** (Input Positive) and **IN-** (Input Negative) terminals.
2.  Take a multimeter, set it to measure DC Voltage (V⎓).
3.  Place the multimeter's red probe on the **OUT+** (Output Positive) terminal and the black probe on the **OUT-** (Output Negative) terminal.
4.  You will see a small, blue, square component on the LM2596 with a brass screw on top. This is the potentiometer. Use a small screwdriver to **gently** turn this screw.
5.  Turn it until the multimeter reads as close to **5.0V** as possible.

**Once this is set to 5V, disconnect the battery.** You are now ready to wire everything up.

---

### **Part 3: Wiring Everything Together**

Get your breadboard and jumper wires ready. Follow these connections precisely.

**Step A: Setting up the Power Rails on the Breadboard**
This is the foundation for our circuit.

1.  Connect the **OUT+** of the LM2596 to the **RED (+) rail** of your breadboard.
2.  Connect the **OUT-** of the LM2596 to the **BLUE (-) rail** of your breadboard.
3.  Connect the **5V pin** on the Arduino to the **RED (+) rail** of the breadboard.
4.  Connect a **GND pin** on the Arduino to the **BLUE (-) rail** of the breadboard. (This is very important - it creates a "common ground" so all components can communicate).

**Step B: Connecting the Radar Servo (with Ultrasonic Sensor)**
*   **Red wire (Power):** Connect to the **RED (+) rail** on the breadboard.
*   **Black/Brown wire (Ground):** Connect to the **BLUE (-) rail** on the breadboard.
*   **Yellow/Orange wire (Signal):** Connect to Arduino Digital Pin **9**.

**Step C: Connecting the Laser Servo**
*   **Red wire (Power):** Connect to the **RED (+) rail** on the breadboard.
*   **Black/Brown wire (Ground):** Connect to the **BLUE (-) rail** on the breadboard.
*   **Yellow/Orange wire (Signal):** Connect to Arduino Digital Pin **10**.

**Step D: Connecting the Ultrasonic Sensor (HC-SR04)**
The sensor has 4 pins.
*   **VCC pin:** Connect to the **RED (+) rail** on the breadboard.
*   **GND pin:** Connect to the **BLUE (-) rail** on the breadboard.
*   **Trig pin:** Connect to Arduino Digital Pin **7**.
*   **Echo pin:** Connect to Arduino Digital Pin **8**.

**Step E: Connecting the Laser Module**
The laser module typically has 2 or 3 pins.
*   **Power/VCC/+ pin:** Connect to Arduino Digital Pin **11**. (We connect it to a pin so we can turn it on/off with code).
*   **Ground/GND/- pin:** Connect to the **BLUE (-) rail** on the breadboard.
*   *If it has a third (Signal) pin, leave it disconnected.*

**Step F: Connecting the Sound System (Arduino -> Amplifier -> Speaker)**
1.  **Power the Amplifier (PAM8403):**
    *   Connect the **5V** pin on the PAM8403 board to the **RED (+) rail** of the breadboard.
    *   Connect the **GND** pin on the PAM8403 board to the **BLUE (-) rail** of the breadboard.
2.  **Connect the Audio Signal:**
    *   The PAM8403 has audio inputs, often marked `L`, `R`, and `GND`. We only have one signal.
    *   Connect Arduino Digital Pin **6** to the **L (Left) input** on the PAM8403.
3.  **Connect the Speaker:**
    *   The amplifier has speaker outputs, often marked `ROUT+`, `ROUT-`, `LOUT+`, `LOUT-`.
    *   Connect the two wires from your small speaker to the **LOUT+** and **LOUT-** terminals. The polarity doesn't matter for this speaker.

### **Part 4: Wiring Diagram**

Here is a visual representation of all the connections you just made.



### **Part 5: Physical Assembly**

This is where you get creative. The goal is to mount the sensors on the servos.

1.  **Radar Turret:** Mount the HC-SR04 ultrasonic sensor onto the top of the "Radar Servo." You can use hot glue, double-sided tape, or a custom 3D-printed bracket. Make sure it's secure.
2.  **Laser Turret:** Mount the laser module onto the top of the "Laser Servo" in the same way.
3.  **Placement:** Place the two servo turrets next to each other so that when they are both at 90 degrees, they are pointing in the same forward direction.

### **Part 6: Uploading the Code**

The code you have is perfect for this hardware setup. The pin numbers in the code match the connections we just made.

1.  Open the Arduino IDE on your computer.
2.  Connect your Arduino Uno to the computer with a USB cable.
3.  In the IDE, go to **Tools -> Board** and select **"Arduino Uno"**.
4.  Go to **Tools -> Port** and select the port your Arduino is connected to (e.g., COM3, /dev/ttyACM0).
5.  Copy and paste the entire code you provided into the Arduino IDE sketch window.
6.  Click the **"Upload"** button (the arrow pointing to the right).

### **Part 7: Power On and Operation!**

1.  **Disconnect the USB cable** from the Arduino. The code is now stored on the board.
2.  Connect the 9V battery to its snap, which should be connected to the IN+ and IN- terminals of your (already adjusted) LM2596.
3.  **The system will boot up!**

**What to Expect:**
1.  Both servos will move to their center position (90 degrees).
2.  The radar servo will begin sweeping from side to side.
3.  Place your hand or an object about 30-40 cm in front of the system.
4.  When the sweeping radar sensor "sees" your hand, it will stop.
5.  The laser servo will immediately point to the same angle.
6.  The laser will turn ON, and the speaker will play a siren sound.
7.  After 2 seconds (`TARGET_LOCK_DELAY`), the laser and sound will turn off.
8.  The servos will return to the center, and the radar will resume scanning.

You have now built your very own missile intercept system! Congratulations! If anything doesn't work, double-check your wiring connections against the diagram one by one. This is the most common source of problems.