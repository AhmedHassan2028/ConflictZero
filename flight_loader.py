import json
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Flight:
    """
    Represents a single flight with its details.
    """
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

    @classmethod
    def from_dict(cls, data: dict) -> Optional['Flight']:
        """
        Creates a Flight object from a dictionary, handling missing fields safely.
        Returns None if critical data is missing.
        """
        try:
            # Check for required fields (you can adjust which are strictly required)
            # For now, we'll try to get everything and return None if key fields are missing
            if not data.get("ACID"):
                return None
            
            return cls(
                acid=data.get("ACID", "Unknown"),
                plane_type=data.get("Plane type", "Unknown"),
                route=data.get("route", ""),
                altitude=int(data.get("altitude", 0)),
                departure_airport=data.get("departure airport", "Unknown"),
                arrival_airport=data.get("arrival airport", "Unknown"),
                departure_time=int(data.get("departure time", 0)),
                aircraft_speed=float(data.get("aircraft speed", 0.0)),
                passengers=int(data.get("passengers", 0)),
                is_cargo=bool(data.get("is_cargo", False))
            )
        except (ValueError, TypeError) as e:
            print(f"Error parsing flight data for ACID {data.get('ACID', 'Unknown')}: {e}")
            return None

def load_flights(filepath: str) -> List[Flight]:
    """
    Loads flights from a JSON file.
    
    Args:
        filepath: Path to the JSON file.
        
    Returns:
        A list of Flight objects.
    """
    flights = []
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            print(f"Error: Expected a list of flights in {filepath}, but got {type(data)}")
            return []
            
        for item in data:
            flight = Flight.from_dict(item)
            if flight:
                flights.append(flight)
                
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
    except json.JSONDecodeError:
        print(f"Error: Failed to decode JSON from {filepath}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        
    return flights

if __name__ == "__main__":
    # Example usage using one of the available files
    filename = "canadian_flights_250.json"
    print(f"Attempting to load flights from {filename}...")
    
    loaded_flights = load_flights(filename)
    
    print(f"Successfully loaded {len(loaded_flights)} flights.")
    
    if loaded_flights:
        print("\nExample flight:")
        print(loaded_flights[0])
