import math
import datetime
from typing import List, Tuple, Optional, Dict, Any
from flight_loader import Flight, load_flights

# Reference Data: Canadian Airports (ICAO Codes)
AIRPORT_LOCATIONS = {
    "CYYZ": (43.68, -79.63),   # Toronto Pearson
    "CYVR": (49.19, -123.18),  # Vancouver International
    "CYUL": (45.47, -73.74),   # Montreal-Trudeau
    "CYYC": (51.11, -114.02),  # Calgary International
    "CYOW": (45.32, -75.67),   # Ottawa Macdonald-Cartier
    "CYWG": (49.91, -97.24),   # Winnipeg Richardson
    "CYHZ": (44.88, -63.51),   # Halifax Stanfield
    "CYEG": (53.31, -113.58),  # Edmonton International
    "CYQB": (46.79, -71.39),   # Quebec City Jean Lesage
    "CYYJ": (48.65, -123.43),  # Victoria International
    "CYYT": (47.62, -52.75),   # St. John's International
    "CYXE": (52.17, -106.70)   # Saskatoon International
}

# Aircraft Classification
AIRCRAFT_CATEGORIES = {
    "Wide-body": ["Boeing 787-9", "Boeing 777-300ER", "Airbus A330"],
    "Narrow-body": ["Boeing 737-800", "Boeing 737 MAX 8", "Airbus A320", "Airbus A321", "Airbus A220-300"],
    "Regional": ["Dash 8-400", "Embraer E195-E2"],
    "Cargo": ["Boeing 767-300F", "Boeing 757-200F", "Airbus A300-600F"]
}

# Altitude Constraints (Min, Max) in feet
ALTITUDE_RANGES = {
    "Regional": (22000, 28000),
    "Narrow-body": (28000, 39000),
    "Wide-body": (31000, 43000),
    "Cargo": (28000, 41000)
}

# Speed Constraints (Min, Max) in knots
SPEED_CONSTRAINTS = {
    "Dash 8-400": (310, 410),       # Turboprops
    "Embraer E195-E2": (370, 500),  # Regional jets
    "Airbus A220-300": (370, 500),  # Listed as Regional in speed rules
    "Narrow-body": (415, 505),
    "Wide-body": (430, 505),
    "Cargo": (410, 505)
}

def get_aircraft_category(plane_type: str) -> str:
    """Returns the general category for a specific plane type."""
    if plane_type is None:
        return "Unknown"
    for category, types in AIRCRAFT_CATEGORIES.items():
        if plane_type in types:
            return category
    return "Unknown"

def validate_flight(flight: Flight) -> List[Dict[str, Any]]:
    """Checks if a flight adheres to operational constraints (Altitude & Speed)."""
    issues = []
    
    if flight.plane_type is None:
        issues.append({"flight": flight.acid, "issue": "Missing plane type"})
        return issues 

    category = get_aircraft_category(flight.plane_type)
    
    # Check Altitude
    if flight.altitude is not None and category in ALTITUDE_RANGES:
        min_alt, max_alt = ALTITUDE_RANGES[category]
        if not (min_alt <= flight.altitude <= max_alt):
            issues.append({
                "flight": flight.acid,
                "issue": f"Altitude {flight.altitude} ft out of allowed range ({min_alt}-{max_alt}) for {category} aircraft"
            })
            
    # Check Speed
    if flight.aircraft_speed is not None:
        speed_range = None
        if flight.plane_type in SPEED_CONSTRAINTS:
            speed_range = SPEED_CONSTRAINTS[flight.plane_type]
        elif category in SPEED_CONSTRAINTS:
            speed_range = SPEED_CONSTRAINTS[category]
            
        if speed_range:
            min_spd, max_spd = speed_range
            if not (min_spd <= flight.aircraft_speed <= max_spd):
                issues.append({
                    "flight": flight.acid,
                    "issue": f"Speed {flight.aircraft_speed} knots out of allowed range ({min_spd}-{max_spd}) for {flight.plane_type}"
                })
            
    return issues

def parse_route(route_str: Optional[str]) -> List[Tuple[float, float]]:
    """Parses a route string into a list of (latitude, longitude) tuples."""
    coordinates = []
    if not route_str:
        return coordinates

    parts = route_str.strip().split()
    for part in parts:
        try:
            if '/' not in part: continue
            lat_str, lon_str = part.split('/')
            def parse_coord(c_str):
                val = float(c_str[:-1])
                return -val if c_str[-1].upper() in ('S', 'W') else val
            coordinates.append((parse_coord(lat_str), parse_coord(lon_str)))
        except (ValueError, IndexError):
            continue
    return coordinates

def get_full_flight_path(flight: Flight) -> List[Tuple[float, float]]:
    """Constructs path including Departure, Route Waypoints, Arrival."""
    path = []
    if flight.departure_airport and flight.departure_airport in AIRPORT_LOCATIONS:
        path.append(AIRPORT_LOCATIONS[flight.departure_airport])
    path.extend(parse_route(flight.route))
    if flight.arrival_airport and flight.arrival_airport in AIRPORT_LOCATIONS:
        path.append(AIRPORT_LOCATIONS[flight.arrival_airport])
    return path

def haversine_distance_km(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Calculates great-circle distance in kilometers."""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371.0 
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def horizontal_distance_nm(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Calculates distance in nautical miles."""
    km = haversine_distance_km(coord1, coord2)
    return km / 1.852

def interpolate_position(start: Tuple[float, float], end: Tuple[float, float], fraction: float) -> Tuple[float, float]:
    """Linear interpolation between two lat/lon points."""
    lat1, lon1 = start
    lat2, lon2 = end
    return (lat1 + (lat2 - lat1) * fraction, lon1 + (lon2 - lon1) * fraction)

def generate_4d_trajectory(flight: Flight, path: List[Tuple[float, float]], time_step_sec: int = 60) -> Dict[int, Tuple[float, float]]:
    """
    Generates a 4D trajectory (Time -> Lat/Lon mapping) for the flight.
    This simulates where the aircraft is at specific timestamps.
    Returns: Dict[timestamp_rounded_to_minute, (lat, lon)]
    """
    if not flight.departure_time or not flight.aircraft_speed or flight.aircraft_speed <= 0:
        return {}

    trajectory = {}
    current_time = float(flight.departure_time)
    speed_nm_per_sec = flight.aircraft_speed / 3600.0
    
    # Start point
    if not path: return {}
    
    # We simulate segment by segment
    for i in range(len(path) - 1):
        p1 = path[i]
        p2 = path[i+1]
        
        dist_nm = horizontal_distance_nm(p1, p2)
        if dist_nm == 0: continue
        
        duration_sec = dist_nm / speed_nm_per_sec
        
        # Determine number of steps in this segment
        steps = int(duration_sec / time_step_sec)
        
        for s in range(steps + 1):
            fraction = (s * time_step_sec) / duration_sec
            if fraction > 1.0: fraction = 1.0
            
            pos = interpolate_position(p1, p2, fraction)
            
            # Store position at this timestamp (rounded to nearest minute for comparison)
            t_stamp = int(current_time + (s * time_step_sec))
            # Round to nearest minute to align with other flights
            t_minute = (t_stamp // 60) * 60 
            
            trajectory[t_minute] = pos
            
        current_time += duration_sec
        
    return trajectory

def detect_loss_of_separation(flights: List[Flight]) -> List[Dict[str, Any]]:
    """
    Detects separation conflicts using 4D trajectory simulation.
    Checks if aircraft are at the same location at the same time.
    """
    conflicts = []
    
    # 1. Preprocessing: Validate and Generate Trajectories
    flight_trajectories = {} # ACID -> Dict[timestamp, (lat, lon)]
    flight_objects = {}      # ACID -> Flight object
    
    print(f"Generating 4D trajectories for {len(flights)} flights (this may take a moment)...")
    for f in flights:
        flight_objects[f.acid] = f
        path = get_full_flight_path(f)
        if not path: continue
        
        traj = generate_4d_trajectory(f, path)
        if traj:
            flight_trajectories[f.acid] = traj

    # 2. Check for Conflicts
    sorted_flights = sorted(flights, key=lambda x: x.departure_time if x.departure_time else 0)
    print(f"Checking for conflicts among {len(sorted_flights)} flights (4D simulation)...")
    
    HORIZ_SEP_NM = 5.0
    VERT_SEP_FT = 2000
    
    # Optimize: Invert the trajectory map to Time -> List[(ACID, Pos)]
    # This allows us to only check flights active at the same minute
    position_by_time = {}
    for acid, traj in flight_trajectories.items():
        for t, pos in traj.items():
            if t not in position_by_time:
                position_by_time[t] = []
            position_by_time[t].append((acid, pos))
            
    # Iterate through time steps (minutes)
    sorted_times = sorted(position_by_time.keys())
    
    # To avoid duplicate reports for the same conflict (e.g. minute 1, 2, 3), we track active conflicts
    active_conflicts = set() # (acid1, acid2)
    
    for t in sorted_times:
        aircraft_at_t = position_by_time[t]
        
        # Compare all pairs at this minute
        for i in range(len(aircraft_at_t)):
            acid1, pos1 = aircraft_at_t[i]
            flight1 = flight_objects[acid1]
            
            for j in range(i + 1, len(aircraft_at_t)):
                acid2, pos2 = aircraft_at_t[j]
                flight2 = flight_objects[acid2]
                
                # Check Vertical
                if flight1.altitude is not None and flight2.altitude is not None:
                    if abs(flight1.altitude - flight2.altitude) >= VERT_SEP_FT:
                        continue
                
                # Check Horizontal
                dist_nm = horizontal_distance_nm(pos1, pos2)
                
                if dist_nm < HORIZ_SEP_NM:
                    pair_key = tuple(sorted((acid1, acid2)))
                    if pair_key not in active_conflicts:
                        # New conflict detected
                        conflicts.append({
                            "flight1": acid1,
                            "flight2": acid2,
                            "horizontal_nm": round(dist_nm, 2),
                            "vertical_ft": abs(flight1.altitude - flight2.altitude),
                            "reason": "Loss-of-separation detected",
                            "start_time_overlap": datetime.datetime.fromtimestamp(t, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M")
                        })
                        active_conflicts.add(pair_key)
                else:
                    # If they are separated now, remove from active set so we can report a new conflict later if they converge again?
                    # Or keep it simple: report once per pair. 
                    # Let's assume one report per pair is sufficient for "conflict detected".
                    pass

    return conflicts

if __name__ == "__main__":
    try:
        flights = load_flights("canadian_flights_1000.json")
        print(f"Loaded total {len(flights)} flights.")
        
        if len(flights) > 0:
            results = detect_loss_of_separation(flights)
            print(f"\nAnalysis Complete. Found {len(results)} actual conflicts (4D check):")
            for item in results[:10]:
                print(item)
    except Exception as e:
        print(f"Error running analysis: {e}")
