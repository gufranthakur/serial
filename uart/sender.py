import serial
import time
import random

# Serial port config
PORT = 'COM2'
BAUD_RATE = 9600

# === Mode: Choose "random" or "custom" ===
MODE = "custom"  # options: "random" or "custom"

# === If using custom mode, define your array here ===
custom_data = [
    [1],
    [10],
    [20],
    [30],
    [40],
    [50],
    [40],
    [30],
    [20],
    [10],
    [1]
]

try:
    ser = serial.Serial(PORT, BAUD_RATE, timeout=1)
    print(f"[OK] Connected to {PORT} at {BAUD_RATE} baud")
except serial.SerialException as e:
    print(f"[ERROR] Could not open {PORT}: {e}")
    exit()

try:
    if MODE == "random":
        while True:
            value1 = round(random.uniform(0, 100), 2)
            value2 = round(random.uniform(0, 100), 2)
            data_line = f"{value1},{value2}\n"
            ser.write(data_line.encode('utf-8'))
            print(f"[SENT - random] {data_line.strip()}")
            time.sleep(1)

    elif MODE == "custom":
        while True:
            for entry in custom_data:
                # Convert list to CSV string
                data_line = ",".join(map(str, entry)) + "\n"
                ser.write(data_line.encode('utf-8'))
                print(f"[SENT - custom] {data_line.strip()}")
                time.sleep(1)

except KeyboardInterrupt:
    print("\n[STOPPED] User interrupted")

finally:
    ser.close()
    print("[CLOSED] Serial port closed")
