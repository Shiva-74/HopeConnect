from geopy.distance import geodesic
import numpy as np

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Calculates distance in kilometers between two lat/lon points."""
    if None in [lat1, lon1, lat2, lon2]:
        return np.inf # Or handle as an error / very large distance
    point1 = (lat1, lon1)
    point2 = (lat2, lon2)
    try:
        return geodesic(point1, point2).km
    except Exception:
        return np.inf

def distance_factor(distance_km, max_effective_distance=1000):
    """
    Calculates a distance factor (0 to 1), where lower distance is better (higher factor).
    1.0 for 0 distance, decreasing towards 0 as distance approaches max_effective_distance.
    """
    if distance_km == np.inf:
        return 0.0
    if distance_km <= 0:
        return 1.0
    
    factor = 1.0 - (distance_km / max_effective_distance)
    return max(0.0, min(factor, 1.0))


if __name__ == '__main__':
    # New York to Los Angeles (approx)
    lat1, lon1 = 40.7128, -74.0060  # NYC
    lat2, lon2 = 34.0522, -118.2437 # LA
    dist = calculate_distance_km(lat1, lon1, lat2, lon2)
    print(f"Distance between NYC and LA: {dist:.2f} km")
    print(f"Distance factor for {dist:.2f} km: {distance_factor(dist):.2f}")

    dist_short = 50
    print(f"Distance factor for {dist_short} km: {distance_factor(dist_short):.2f}")