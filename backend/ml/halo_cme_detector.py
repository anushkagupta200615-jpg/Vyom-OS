import random
import time
from typing import Dict

class HaloCMEDetector:
    def __init__(self):
        # We simulate a pre-trained ML model (e.g. IsolationForest) logic here
        self.baseline_density = 5.0   # particles/cm3
        self.baseline_speed = 400.0   # km/s
        self.baseline_temp = 1e5      # Kelvin
        self.is_halo_cme = False

    def scan_plasma_stream(self) -> Dict:
        """
        Simulates SWIS-ASPEX high-dimensional space plasma streams.
        Occasionally spikes to simulate an incoming Halo CME anomaly signature.
        """
        # Introduce a high probability spike every 60 seconds (simulated)
        current_time = int(time.time())
        if current_time % 60 < 15:
            # Anomaly Signature: Massive shockwave
            density = self.baseline_density * random.uniform(5.0, 10.0)
            speed = self.baseline_speed * random.uniform(2.0, 3.5)
            temp = self.baseline_temp * random.uniform(10.0, 25.0)
        else:
            # Normal background solar wind
            density = self.baseline_density * random.uniform(0.8, 1.2)
            speed = self.baseline_speed * random.uniform(0.9, 1.1)
            temp = self.baseline_temp * random.uniform(0.8, 1.2)

        # ML Detection Logic (Simulated Anomaly Scoring)
        # In reality, this would be `model.predict([[density, speed, temp]])`
        anomaly_score = (density / 10.0) + (speed / 800.0) + (temp / 1e6)
        
        # Threshold for Earth-directed HALO CME signature
        classification = "NORMAL"
        probability = min(1.0, anomaly_score / 5.0)
        
        if anomaly_score > 3.0:
            classification = "HALO_CME_DETECTED"
            probability = min(0.99, probability + 0.3)
            self.is_halo_cme = True
        else:
            self.is_halo_cme = False

        return {
            "timestamp": current_time,
            "plasma_parameters": {
                "particle_density_cm3": round(density, 2),
                "proton_speed_kms": round(speed, 2),
                "kinetic_temperature_K": round(temp, 2)
            },
            "ml_classification": classification,
            "anomaly_probability": round(probability * 100, 2)
        }

halo_detector_instance = HaloCMEDetector()

def get_live_swis_aspex_data():
    return halo_detector_instance.scan_plasma_stream()
