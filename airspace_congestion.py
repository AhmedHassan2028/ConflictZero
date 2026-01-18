"""
Airspace Congestion Detection Module

Detects airspace congestion hotspots by analyzing flight trajectories
across 1°×1° grid sectors and 15-minute time windows.
"""

import math
from collections import defaultdict
from dataclasses import dataclass
from typing import List, Tuple, Dict, Set
from datetime import datetime, timezone

# Import Flight from flight_loader if available
try:
    from flight_loader import Flight
except ImportError:
    # Fallback for standalone use
    from dataclasses import dataclass
    @dataclass
    class Flight:
        acid: str
        plane_type: str
        route: str
        altitude: int
        departure_airport: str
        arrival_airport: str
        departure_time: int
        aircraft_speed: float
        passengers: int
        is_cargo: bool


@dataclass
class PositionSample:
    """Represents a single position sample along a flight trajectory."""
    timestamp: int  # Unix timestamp (UTC)
    latitude: float
    longitude: float
    acid: str  # Flight callsign


def parse_route(route_str: str) -> List[Tuple[float, float]]:
    """
    Converts a route string into a list of (latitude, longitude) tuples.
    
    Route format: space-separated waypoints like "49.97N/110.935W 50.12N/111.2W"
    
    Args:
        route_str: Space-separated waypoints in format "latN/lonW" or "latS/lonE"
        
    Returns:
        List of (latitude, longitude) tuples as floats.
        North/South: N = positive, S = negative
        East/West: E = positive, W = negative
    """
    if not route_str or not route_str.strip():
        return []
    
    waypoints = []
    parts = route_str.strip().split()
    
    for part in parts:
        if '/' not in part:
            continue
            
        try:
            lat_str, lon_str = part.split('/', 1)
            
            # Parse latitude
            lat_val = float(lat_str[:-1])  # Remove N/S/E/W
            if lat_str[-1].upper() == 'S':
                lat_val = -lat_val
            elif lat_str[-1].upper() != 'N':
                # If no direction specified, assume N
                pass
            
            # Parse longitude
            lon_val = float(lon_str[:-1])  # Remove N/S/E/W
            if lon_str[-1].upper() == 'W':
                lon_val = -lon_val
            elif lon_str[-1].upper() != 'E':
                # If no direction specified, assume E
                pass
            
            waypoints.append((lat_val, lon_val))
            
        except (ValueError, IndexError) as e:
            # Skip malformed waypoints
            continue
    
    return waypoints


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two points in nautical miles.
    
    Args:
        lat1, lon1: First point coordinates (degrees)
        lat2, lon2: Second point coordinates (degrees)
        
    Returns:
        Distance in nautical miles
    """
    # Earth radius in nautical miles
    R = 3440.065  # nautical miles
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def estimate_trajectory(flight: Flight) -> List[PositionSample]:
    """
    Reconstructs approximate aircraft positions over time using straight-line
    motion between waypoints.
    
    Samples the trajectory every 1-2 minutes based on aircraft speed.
    
    Args:
        flight: Flight object with route, departure_time, and aircraft_speed
        
    Returns:
        List of PositionSample objects representing the flight path over time
    """
    waypoints = parse_route(flight.route)
    
    if len(waypoints) < 2:
        # Need at least 2 waypoints to form a segment
        return []
    
    samples = []
    current_time = flight.departure_time
    speed_knots = flight.aircraft_speed
    
    if speed_knots <= 0:
        # Invalid speed, skip this flight
        return []
    
    # Sample interval: 1.5 minutes (90 seconds) for good coverage
    sample_interval = 90  # seconds
    
    # Process each segment between consecutive waypoints
    for i in range(len(waypoints) - 1):
        lat1, lon1 = waypoints[i]
        lat2, lon2 = waypoints[i + 1]
        
        # Calculate distance in nautical miles
        distance_nm = haversine_distance(lat1, lon1, lat2, lon2)
        
        # Calculate time to traverse this segment (in seconds)
        # Speed is in knots (nautical miles per hour)
        time_for_segment = (distance_nm / speed_knots) * 3600  # seconds
        
        if time_for_segment <= 0:
            continue
        
        # Sample along this segment
        num_samples = max(1, int(time_for_segment / sample_interval))
        
        for j in range(num_samples + 1):  # +1 to include endpoint
            t = j / num_samples if num_samples > 0 else 0
            t = min(t, 1.0)  # Clamp to [0, 1]
            
            # Linear interpolation between waypoints
            lat = lat1 + t * (lat2 - lat1)
            lon = lon1 + t * (lon2 - lon1)
            
            # Calculate timestamp for this sample
            sample_time = current_time + int(t * time_for_segment)
            
            samples.append(PositionSample(
                timestamp=sample_time,
                latitude=lat,
                longitude=lon,
                acid=flight.acid
            ))
        
        # Update current time for next segment
        current_time += int(time_for_segment)
    
    return samples


def get_sector(lat: float, lon: float) -> Tuple[int, int]:
    """
    Assigns a position to a 1°×1° grid sector.
    
    Args:
        lat: Latitude in degrees
        lon: Longitude in degrees
        
    Returns:
        Tuple of (sector_lat, sector_lon) where sector represents
        the floor of the coordinates
    """
    return (math.floor(lat), math.floor(lon))


def get_time_window(timestamp: int) -> int:
    """
    Converts a timestamp to the start of its 15-minute time window.
    
    Args:
        timestamp: Unix timestamp in seconds (UTC)
        
    Returns:
        Start timestamp of the 15-minute window (Unix timestamp)
    """
    # 15 minutes = 900 seconds
    return (timestamp // 900) * 900


def detect_congestion(flights: List[Flight]) -> List[Dict]:
    """
    Detects airspace congestion hotspots.
    
    A hotspot is flagged if more than 5 unique flights pass through
    the same sector within a 15-minute window.
    
    Args:
        flights: List of Flight objects
        
    Returns:
        List of dictionaries containing hotspot information:
        {
            'sector_lat': int,
            'sector_lon': int,
            'window_start': int,
            'flight_count': int,
            'flights': Set[str]
        }
    """
    # Track unique flights per (sector, time_window)
    # Structure: {(sector_lat, sector_lon, window_start): Set[acid]}
    sector_window_flights: Dict[Tuple[int, int, int], Set[str]] = defaultdict(set)
    
    # Process all flights
    for flight in flights:
        samples = estimate_trajectory(flight)
        
        for sample in samples:
            sector_lat, sector_lon = get_sector(sample.latitude, sample.longitude)
            window_start = get_time_window(sample.timestamp)
            
            key = (sector_lat, sector_lon, window_start)
            sector_window_flights[key].add(flight.acid)
    
    # Find hotspots (more than 5 unique flights)
    hotspots = []
    for (sector_lat, sector_lon, window_start), flight_set in sector_window_flights.items():
        flight_count = len(flight_set)
        
        if flight_count > 5:
            hotspots.append({
                'sector_lat': sector_lat,
                'sector_lon': sector_lon,
                'window_start': window_start,
                'flight_count': flight_count,
                'flights': flight_set
            })
    
    # Sort by time, then by sector
    hotspots.sort(key=lambda x: (x['window_start'], x['sector_lat'], x['sector_lon']))
    
    return hotspots


def format_hotspot_output(hotspot: Dict) -> str:
    """
    Formats a hotspot dictionary into a human-readable string.
    
    Args:
        hotspot: Hotspot dictionary from detect_congestion()
        
    Returns:
        Formatted string for display
    """
    sector_lat = hotspot['sector_lat']
    sector_lon = hotspot['sector_lon']
    window_start = hotspot['window_start']
    flight_count = hotspot['flight_count']
    
    # Format sector bounds
    lat_bound = f"{sector_lat}–{sector_lat + 1}N" if sector_lat >= 0 else f"{abs(sector_lat + 1)}–{abs(sector_lat)}S"
    lon_bound = f"{abs(sector_lon)}–{abs(sector_lon + 1)}W" if sector_lon < 0 else f"{sector_lon}–{sector_lon + 1}E"
    
    # Format time window
    start_dt = datetime.fromtimestamp(window_start, tz=timezone.utc)
    end_dt = datetime.fromtimestamp(window_start + 900, tz=timezone.utc)
    time_str = f"{start_dt.strftime('%H:%M')}–{end_dt.strftime('%H:%M')} UTC"
    
    # Determine risk level
    if flight_count > 10:
        risk = "Critical: Severe controller overload"
    elif flight_count > 7:
        risk = "High: Controller workload saturation"
    else:
        risk = "Moderate: Controller workload saturation"
    
    output = f"""🔥 Airspace congestion detected
Sector ({lat_bound}, {lon_bound})
Time window: {time_str}
Flights: {flight_count}
Risk: {risk}"""
    
    return output


def suggest_prioritization(hotspot: Dict, flight_lookup: Dict[str, Flight]) -> str:
    """
    Suggests cargo vs passenger prioritization for a congestion hotspot.
    
    Args:
        hotspot: Hotspot dictionary from detect_congestion()
        flight_lookup: Dictionary mapping flight ACID to Flight objects
        
    Returns:
        Human-readable recommendation string
    """
    # Extract all flights involved in the hotspot
    flight_acids = hotspot.get('flights', set())
    
    # Split flights into cargo and passenger
    cargo_flights = []
    passenger_flights = []
    
    for acid in flight_acids:
        flight = flight_lookup.get(acid)
        if flight is None:
            continue
        
        if flight.is_cargo:
            cargo_flights.append(flight)
        else:
            passenger_flights.append(flight)
    
    # If no cargo flights exist, return message
    if not cargo_flights:
        return "💡 Optimization suggestion\nOnly passenger flights involved. Consider minor delays for lower-priority routes."
    
    # If cargo flights exist, recommend delaying a cargo flight
    # Find the passenger flight with highest passenger count to protect
    if passenger_flights:
        # Sort passenger flights by passenger count (descending)
        passenger_flights.sort(key=lambda f: f.passengers, reverse=True)
        top_passenger_flight = passenger_flights[0]
        
        # Pick a cargo flight to delay (preferably the first one)
        cargo_to_delay = cargo_flights[0]
        
        passenger_count = top_passenger_flight.passengers
        return f"💡 Optimization suggestion\nDelay cargo flight {cargo_to_delay.acid} instead of passenger flight {top_passenger_flight.acid} ({passenger_count} passengers)."
    else:
        # Only cargo flights (unlikely but handle it)
        cargo_to_delay = cargo_flights[0]
        return f"💡 Optimization suggestion\nConsider delaying cargo flight {cargo_to_delay.acid} to reduce congestion."


if __name__ == "__main__":
    # Demo block
    try:
        from flight_loader import load_flights
        
        print("Loading flight data...")
        flights = load_flights("canadian_flights_1000.json")
        print(f"Loaded {len(flights)} flights.\n")
        
        print("Analyzing airspace congestion...")
        hotspots = detect_congestion(flights)
        
        # Create flight lookup dictionary
        flight_lookup = {flight.acid: flight for flight in flights}
        
        if not hotspots:
            print("No congestion hotspots detected.")
        else:
            print(f"\nFound {len(hotspots)} congestion hotspot(s):\n")
            for i, hotspot in enumerate(hotspots, 1):
                print(f"--- Hotspot {i} ---")
                print(format_hotspot_output(hotspot))
                print(suggest_prioritization(hotspot, flight_lookup))
                print()
        
    except FileNotFoundError:
        print("Error: Flight data file not found.")
        print("Please ensure 'canadian_flights_1000.json' exists in the current directory.")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
