
import os
import logging
import math
import heapq
import requests
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import json
from dataclasses import dataclass
from geopy.distance import geodesic
import networkx as nx

@dataclass
class Location:
    latitude: float
    longitude: float
    name: str = ""
    
    def to_dict(self):
        return {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'name': self.name
        }

@dataclass
class RouteSegment:
    start_location: Location
    end_location: Location
    distance: float  # in kilometers
    estimated_time: int  # in seconds
    traffic_signals: List[str]
    road_type: str = "city_road"

@dataclass
class Hospital:
    id: str
    name: str
    location: Location
    type: str
    capacity: int
    contact: str

@dataclass
class Route:
    start: Location
    end: Location
    distance: float
    duration: float
    waypoints: List[Location]
    traffic_signals: List[str]
    estimated_arrival: datetime

@dataclass
class EmergencyRoute:
    route_id: str
    vehicle_type: str
    start_location: Location
    end_location: Location
    waypoints: List[Location]
    segments: List[RouteSegment]
    total_distance: float
    estimated_duration: int
    signals_to_coordinate: List[str]
    priority_level: int = 1
    created_at: datetime = None
class RouteOptimizer:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Hospitals database
        self.hospitals = self._initialize_hospitals()
        
        # Traffic signals database
        self.traffic_signals = self._initialize_traffic_signals()
        
        # Road network (simplified graph representation)
        self.road_network = self._initialize_road_network()
        
        # Real-time traffic data integration
        self.traffic_api_enabled = os.getenv('TRAFFIC_API_ENABLED', 'false').lower() == 'true'
        self.traffic_update_interval = int(os.getenv('TRAFFIC_UPDATE_INTERVAL', 300))  # 5 minutes
        
        self.maps_api_key = os.getenv('MAPS_API_KEY')
        
        # Cache for traffic data
        self.traffic_cache = {}
        self.last_traffic_update = None
    
    def _initialize_hospitals(self) -> List[Hospital]:
        """Initialize Dehradun hospitals database"""
        hospitals = [
            Hospital(
                id="doon_hospital",
                name="Doon Hospital",
                location=Location(30.3165, 78.0322, "Doon Hospital"),
                type="general",
                capacity=200,
                contact="+91-135-2715001"
            ),
            Hospital(
                id="max_hospital",
                name="Max Super Speciality Hospital",
                location=Location(30.3293, 78.0428, "Max Hospital"),
                type="specialty",
                capacity=300,
                contact="+91-135-6712000"
            ),
            Hospital(
                id="himalayan_hospital",
                name="Himalayan Hospital",
                location=Location(30.3742, 78.0664, "Himalayan Hospital"),
                type="general",
                capacity=150,
                contact="+91-135-2770000"
            ),
            Hospital(
                id="synergy_hospital",
                name="Synergy Hospital",
                location=Location(30.3456, 78.0512, "Synergy Hospital"),
                type="emergency",
                capacity=100,
                contact="+91-135-2749999"
            ),
            Hospital(
                id="govt_hospital",
                name="Government Doon Medical College Hospital",
                location=Location(30.3203, 78.0389, "Govt Hospital"),
                type="general",
                capacity=400,
                contact="+91-135-2528888"
            ),
            Hospital(
                id="shri_mahant_hospital",
                name="Shri Mahant Indiresh Hospital",
                location=Location(30.3678, 78.0598, "Shri Mahant Hospital"),
                type="general",
                capacity=250,
                contact="+91-135-2770000"
            )
        ]
        
        self.logger.info(f"Initialized {len(hospitals)} hospitals in Dehradun")
        return hospitals
    
    def _initialize_traffic_signals(self) -> Dict[str, Location]:
        """Initialize traffic signals locations in Dehradun"""
        signals = {
            "clock_tower": Location(30.3165, 78.0322, "Clock Tower"),
            "paltan_bazaar": Location(30.3203, 78.0389, "Paltan Bazaar"),
            "rispana_bridge": Location(30.3456, 78.0512, "Rispana Bridge"),
            "gandhi_road": Location(30.3293, 78.0428, "Gandhi Road"),
            "rajpur_road": Location(30.3742, 78.0664, "Rajpur Road"),
            "saharanpur_road": Location(30.3678, 78.0598, "Saharanpur Road"),
            "haridwar_road": Location(30.2987, 78.0234, "Haridwar Road"),
            "mussoorie_road": Location(30.3567, 78.0789, "Mussoorie Road"),
            "chakrata_road": Location(30.3234, 78.0456, "Chakrata Road"),
            "ballupur": Location(30.3445, 78.0623, "Ballupur Chowk")
        }
        
        self.logger.info(f"Initialized {len(signals)} traffic signals")
        return signals
    
    def _initialize_road_network(self) -> Dict:
        """Initialize simplified road network graph for Dehradun"""
        # Simplified road network with major intersections and connections
        network = {
            "clock_tower": {
                "connections": ["paltan_bazaar", "gandhi_road", "chakrata_road"],
                "distances": [1.2, 0.8, 1.5]  # km
            },
            "paltan_bazaar": {
                "connections": ["clock_tower", "rispana_bridge", "haridwar_road"],
                "distances": [1.2, 2.1, 1.8]
            },
            "rispana_bridge": {
                "connections": ["paltan_bazaar", "ballupur", "rajpur_road"],
                "distances": [2.1, 1.5, 2.3]
            },
            "gandhi_road": {
                "connections": ["clock_tower", "chakrata_road", "mussoorie_road"],
                "distances": [0.8, 1.1, 2.7]
            },
            "rajpur_road": {
                "connections": ["rispana_bridge", "saharanpur_road", "mussoorie_road"],
                "distances": [2.3, 1.9, 1.4]
            },
            "saharanpur_road": {
                "connections": ["rajpur_road", "ballupur"],
                "distances": [1.9, 1.2]
            },
            "haridwar_road": {
                "connections": ["paltan_bazaar", "chakrata_road"],
                "distances": [1.8, 2.4]
            },
            "mussoorie_road": {
                "connections": ["gandhi_road", "rajpur_road", "ballupur"],
                "distances": [2.7, 1.4, 1.8]
            },
            "chakrata_road": {
                "connections": ["clock_tower", "gandhi_road", "haridwar_road"],
                "distances": [1.5, 1.1, 2.4]
            },
            "ballupur": {
                "connections": ["rispana_bridge", "saharanpur_road", "mussoorie_road"],
                "distances": [1.5, 1.2, 1.8]
            }
        }
        
        return network
    
    def calculate_emergency_route(self, current_location: Dict = None, 
                                vehicle_type: str = "ambulance") -> Dict:
        """
        Calculate optimal emergency route to nearest hospital
        
        Args:
            current_location: Dict with 'lat' and 'lng' keys
            vehicle_type: Type of emergency vehicle
            
        Returns:
            Dict containing route information
        """
        try:
            if not current_location:
                return {'error': 'Current location is required'}
            
            start_loc = Location(
                current_location['lat'], 
                current_location['lng'], 
                "Current Location"
            )
            
            # Find nearest hospitals
            nearby_hospitals = self.get_nearby_hospitals(
                start_loc.lat, start_loc.lng, radius=15
            )
            
            if not nearby_hospitals:
                return {'error': 'No hospitals found within range'}
            
            # Calculate routes to top 3 nearest hospitals
            route_options = []
            
            for hospital in nearby_hospitals[:3]:
                route = self._calculate_route_dijkstra(start_loc, hospital['location'])
                
                if route:
                    # Add traffic signal coordination
                    signals_on_route = self._get_signals_on_route(route)
                    
                    route_options.append({
                        'hospital': hospital,
                        'route': route,
                        'signals_to_coordinate': signals_on_route,
                        'estimated_time_saved': len(signals_on_route) * 30  # seconds saved per signal
                    })
            
            # Select best route (shortest time with signal coordination)
            if route_options:
                best_route = min(route_options, key=lambda x: x['route'].duration)
                
                return {
                    'success': True,
                    'recommended_route': best_route,
                    'alternative_routes': route_options[1:],
                    'vehicle_type': vehicle_type,
                    'calculation_time': datetime.utcnow().isoformat()
                }
            else:
                return {'error': 'No valid routes found'}
                
        except Exception as e:
            self.logger.error(f"Error calculating emergency route: {e}")
            return {'error': str(e)}
    
    def _calculate_route_dijkstra(self, start: Location, end: Location) -> Optional[Route]:
        """
        Calculate shortest route using Dijkstra's algorithm
        """
        try:
            # Find nearest traffic signals to start and end points
            start_signal = self._find_nearest_signal(start)
            end_signal = self._find_nearest_signal(end)
            
            if not start_signal or not end_signal:
                return None
            
            # Run Dijkstra's algorithm
            distances = {signal: float('infinity') for signal in self.road_network}
            distances[start_signal] = 0
            previous = {}
            unvisited = list(self.road_network.keys())
            
            while unvisited:
                current = min(unvisited, key=lambda x: distances[x])
                unvisited.remove(current)
                
                if current == end_signal:
                    break
                
                if distances[current] == float('infinity'):
                    break
                
                # Check neighbors
                if current in self.road_network:
                    connections = self.road_network[current]['connections']
                    connection_distances = self.road_network[current]['distances']
                    
                    for i, neighbor in enumerate(connections):
                        if neighbor in unvisited:
                            alt_distance = distances[current] + connection_distances[i]
                            if alt_distance < distances[neighbor]:
                                distances[neighbor] = alt_distance
                                previous[neighbor] = current
            
            # Reconstruct path
            path = []
            current = end_signal
            while current in previous:
                path.append(current)
                current = previous[current]
            path.append(start_signal)
            path.reverse()
            
            # Convert to waypoints
            waypoints = [self.traffic_signals[signal] for signal in path]
            
            # Calculate total distance and duration
            total_distance = distances[end_signal]
            # Add distance from start to first signal and last signal to end
            total_distance += self._calculate_distance(start, self.traffic_signals[start_signal])
            total_distance += self._calculate_distance(self.traffic_signals[end_signal], end)
            
            # Estimate duration (assuming average speed of 40 km/h for emergency vehicles)
            duration = (total_distance / 40) * 60  # minutes
            
            # Estimate arrival time
            estimated_arrival = datetime.utcnow()
            estimated_arrival = estimated_arrival.replace(
                minute=estimated_arrival.minute + int(duration)
            )
            
            return Route(
                start=start,
                end=end,
                distance=total_distance,
                duration=duration,
                waypoints=waypoints,
                traffic_signals=path,
                estimated_arrival=estimated_arrival
            )
            
        except Exception as e:
            self.logger.error(f"Error in Dijkstra calculation: {e}")
            return None
    
    def _find_nearest_signal(self, location: Location) -> Optional[str]:
        """Find the nearest traffic signal to a given location"""
        min_distance = float('infinity')
        nearest_signal = None
        
        for signal_id, signal_location in self.traffic_signals.items():
            distance = self._calculate_distance(location, signal_location)
            if distance < min_distance:
                min_distance = distance
                nearest_signal = signal_id
        
        return nearest_signal
    
    def _calculate_distance(self, loc1: Location, loc2: Location) -> float:
        """Calculate distance between two locations using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(loc1.latitude)
        lat2_rad = math.radians(loc2.latitude)
        delta_lat = math.radians(loc2.latitude - loc1.latitude)
        delta_lng = math.radians(loc2.longitude - loc1.longitude)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _get_signals_on_route(self, route: Route) -> List[str]:
        """Get list of traffic signals that need coordination for the route"""
        return route.traffic_signals
    
    def get_nearby_hospitals(self, lat: float, lng: float, radius: int = 10) -> List[Dict]:
        """
        Get hospitals within specified radius
        
        Args:
            lat: Latitude
            lng: Longitude  
            radius: Search radius in kilometers
            
        Returns:
            List of nearby hospitals sorted by distance
        """
        try:
            current_location = Location(lat, lng)
            nearby_hospitals = []
            
            for hospital in self.hospitals:
                distance = self._calculate_distance(current_location, hospital.location)
                
                if distance <= radius:
                    nearby_hospitals.append({
                        'id': hospital.id,
                        'name': hospital.name,
                        'location': {
                            'lat': hospital.location.latitude,
                            'lng': hospital.location.longitude
                        },
                        'type': hospital.type,
                        'capacity': hospital.capacity,
                        'contact': hospital.contact,
                        'distance': round(distance, 2),
                        'estimated_travel_time': round((distance / 40) * 60, 1)  # minutes at 40 km/h
                    })
            
            # Sort by distance
            nearby_hospitals.sort(key=lambda x: x['distance'])
            
            return nearby_hospitals
            
        except Exception as e:
            self.logger.error(f"Error getting nearby hospitals: {e}")
            return []
    
    def get_traffic_density_route(self, route_signals: List[str]) -> Dict:
        """
        Get current traffic density for signals on route
        This would integrate with real traffic monitoring systems
        """
        try:
            # Simulated traffic density data
            # In real implementation, this would query traffic monitoring systems
            density_data = {}
            
            for signal_id in route_signals:
                # Simulate traffic density (0.0 to 1.0)
                import random
                density = random.uniform(0.2, 0.9)
                
                density_data[signal_id] = {
                    'density': density,
                    'status': 'heavy' if density > 0.7 else 'moderate' if density > 0.4 else 'light',
                    'estimated_delay': density * 60,  # seconds
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            return {
                'route_signals': route_signals,
                'traffic_density': density_data,
                'average_density': sum(d['density'] for d in density_data.values()) / len(density_data),
                'total_estimated_delay': sum(d['estimated_delay'] for d in density_data.values())
            }
            
        except Exception as e:
            self.logger.error(f"Error getting traffic density: {e}")
            return {}
    
    def optimize_signal_timing(self, signal_id: str, emergency_direction: str) -> Dict:
        """
        Calculate optimal signal timing for emergency vehicle passage
        
        Args:
            signal_id: Traffic signal identifier
            emergency_direction: Direction of emergency vehicle approach
            
        Returns:
            Optimized timing configuration
        """
        try:
            # Get current traffic density
            current_density = self.get_traffic_density_route([signal_id])
            
            if signal_id in current_density.get('traffic_density', {}):
                density = current_density['traffic_density'][signal_id]['density']
            else:
                density = 0.5  # Default moderate density
            
            # Calculate optimal timing
            base_green_time = 30  # seconds
            emergency_green_time = 60  # seconds for emergency vehicle
            
            # Adjust based on traffic density
            if density > 0.7:  # Heavy traffic
                cross_traffic_compensation = 45
            elif density > 0.4:  # Moderate traffic
                cross_traffic_compensation = 30
            else:  # Light traffic
                cross_traffic_compensation = 15
            
            return {
                'signal_id': signal_id,
                'emergency_direction': emergency_direction,
                'recommended_timing': {
                    'emergency_green_duration': emergency_green_time,
                    'cross_traffic_red_duration': emergency_green_time + 5,
                    'post_emergency_compensation': cross_traffic_compensation,
                    'yellow_duration': 5
                },
                'traffic_density': density,
                'estimated_delay_reduction': 45,  # seconds saved
                'calculation_time': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error optimizing signal timing: {e}")
            return {}
    
    def calculate_green_corridor(self, route_signals: List[str], 
                               vehicle_speed: float = 40) -> Dict:
        """
        Calculate timing for green corridor coordination
        
        Args:
            route_signals: List of signal IDs on the route
            vehicle_speed: Emergency vehicle speed in km/h
            
        Returns:
            Green corridor timing plan
        """
        try:
            corridor_plan = []
            current_time = 0  # seconds from start
            
            for i, signal_id in enumerate(route_signals):
                if i == 0:
                    # First signal - immediate green
                    corridor_plan.append({
                        'signal_id': signal_id,
                        'green_start_time': 0,
                        'green_duration': 60,
                        'action': 'immediate_green'
                    })
                else:
                    # Calculate travel time to next signal
                    prev_signal = route_signals[i-1]
                    
                    # Get distance between signals (simplified)
                    if (prev_signal in self.road_network and 
                        signal_id in self.road_network[prev_signal]['connections']):
                        
                        idx = self.road_network[prev_signal]['connections'].index(signal_id)
                        distance = self.road_network[prev_signal]['distances'][idx]
                    else:
                        distance = 1.5  # Default 1.5 km between signals
                    
                    # Calculate travel time
                    travel_time = (distance / vehicle_speed) * 3600  # seconds
                    current_time += travel_time
                    
                    corridor_plan.append({
                        'signal_id': signal_id,
                        'green_start_time': current_time - 10,  # Start green 10s before arrival
                        'green_duration': 60,
                        'travel_time_from_previous': travel_time,
                        'action': 'timed_green'
                    })
            
            return {
                'success': True,
                'corridor_plan': corridor_plan,
                'total_corridor_time': current_time + 60,
                'signals_count': len(route_signals),
                'estimated_time_savings': len(route_signals) * 30,  # 30s saved per signal
                'created_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating green corridor: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_real_time_traffic_data(self) -> Dict:
        """
        Update real-time traffic data from external sources
        This would integrate with traffic monitoring APIs in production
        """
        try:
            current_time = datetime.utcnow()
            
            # Check if update is needed
            if (self.last_traffic_update and 
                (current_time - self.last_traffic_update).total_seconds() < self.traffic_update_interval):
                return {
                    'success': True,
                    'message': 'Traffic data is up to date',
                    'last_update': self.last_traffic_update.isoformat()
                }
            
            # Simulate real-time traffic data update
            # In production, this would call traffic monitoring APIs
            updated_signals = []
            
            for signal_id in self.traffic_signals.keys():
                # Simulate traffic conditions
                import random
                
                # Generate realistic traffic patterns based on time of day
                hour = current_time.hour
                if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
                    base_flow = random.randint(800, 1500)  # vehicles/hour
                    congestion_level = random.uniform(0.6, 0.9)
                elif 10 <= hour <= 16:  # Daytime
                    base_flow = random.randint(400, 800)
                    congestion_level = random.uniform(0.3, 0.6)
                else:  # Off-peak
                    base_flow = random.randint(100, 400)
                    congestion_level = random.uniform(0.1, 0.4)
                
                # Calculate traffic metrics
                traffic_data = {
                    'signal_id': signal_id,
                    'vehicle_flow': base_flow,
                    'congestion_level': congestion_level,
                    'average_speed': max(10, 50 - (congestion_level * 40)),  # km/h
                    'queue_length': int(congestion_level * 20),  # vehicles
                    'incident_reported': random.random() < 0.05,  # 5% chance of incident
                    'weather_impact': random.choice(['none', 'light_rain', 'heavy_rain', 'fog']),
                    'timestamp': current_time.isoformat()
                }
                
                # Store in cache
                self.traffic_cache[signal_id] = traffic_data
                updated_signals.append(signal_id)
            
            self.last_traffic_update = current_time
            
            self.logger.info(f"Updated real-time traffic data for {len(updated_signals)} signals")
            
            return {
                'success': True,
                'updated_signals': updated_signals,
                'update_time': current_time.isoformat(),
                'next_update': (current_time + timedelta(seconds=self.traffic_update_interval)).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error updating real-time traffic data: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_real_time_traffic_conditions(self, signal_ids: List[str] = None) -> Dict:
        """
        Get current real-time traffic conditions
        
        Args:
            signal_ids: List of signal IDs to get data for (None for all)
            
        Returns:
            Current traffic conditions
        """
        try:
            # Update traffic data if needed
            self.update_real_time_traffic_data()
            
            if signal_ids is None:
                signal_ids = list(self.traffic_signals.keys())
            
            traffic_conditions = {}
            
            for signal_id in signal_ids:
                if signal_id in self.traffic_cache:
                    traffic_conditions[signal_id] = self.traffic_cache[signal_id]
                else:
                    # Provide default data if no cached data available
                    traffic_conditions[signal_id] = {
                        'signal_id': signal_id,
                        'vehicle_flow': 300,
                        'congestion_level': 0.3,
                        'average_speed': 35,
                        'queue_length': 5,
                        'incident_reported': False,
                        'weather_impact': 'none',
                        'timestamp': datetime.utcnow().isoformat(),
                        'data_source': 'default'
                    }
            
            return {
                'success': True,
                'traffic_conditions': traffic_conditions,
                'total_signals': len(traffic_conditions),
                'last_update': self.last_traffic_update.isoformat() if self.last_traffic_update else None
            }
            
        except Exception as e:
            self.logger.error(f"Error getting real-time traffic conditions: {e}")
            return {'success': False, 'error': str(e)}
    
    def calculate_dynamic_route_weights(self, route_signals: List[str]) -> Dict:
        """
        Calculate dynamic route weights based on real-time traffic conditions
        
        Args:
            route_signals: List of signal IDs on the route
            
        Returns:
            Dynamic weights for route optimization
        """
        try:
            # Get current traffic conditions
            traffic_data = self.get_real_time_traffic_conditions(route_signals)
            
            if not traffic_data.get('success'):
                return {'success': False, 'error': 'Failed to get traffic data'}
            
            route_weights = {}
            total_delay = 0
            
            for signal_id in route_signals:
                if signal_id in traffic_data['traffic_conditions']:
                    conditions = traffic_data['traffic_conditions'][signal_id]
                    
                    # Calculate weight based on multiple factors
                    congestion_weight = conditions['congestion_level'] * 2.0
                    speed_weight = (50 - conditions['average_speed']) / 50.0
                    queue_weight = min(conditions['queue_length'] / 20.0, 1.0)
                    
                    # Incident penalty
                    incident_weight = 2.0 if conditions['incident_reported'] else 0.0
                    
                    # Weather penalty
                    weather_weights = {
                        'none': 0.0,
                        'light_rain': 0.3,
                        'heavy_rain': 0.8,
                        'fog': 0.5
                    }
                    weather_weight = weather_weights.get(conditions['weather_impact'], 0.0)
                    
                    # Combined weight (higher = more delay)
                    total_weight = congestion_weight + speed_weight + queue_weight + incident_weight + weather_weight
                    
                    # Estimated delay in seconds
                    estimated_delay = total_weight * 30  # Base delay factor
                    
                    route_weights[signal_id] = {
                        'total_weight': total_weight,
                        'estimated_delay': estimated_delay,
                        'congestion_factor': congestion_weight,
                        'speed_factor': speed_weight,
                        'queue_factor': queue_weight,
                        'incident_factor': incident_weight,
                        'weather_factor': weather_weight,
                        'conditions': conditions
                    }
                    
                    total_delay += estimated_delay
                else:
                    # Default weight for unknown signals
                    route_weights[signal_id] = {
                        'total_weight': 1.0,
                        'estimated_delay': 30,
                        'conditions': None
                    }
                    total_delay += 30
            
            return {
                'success': True,
                'route_signals': route_signals,
                'signal_weights': route_weights,
                'total_estimated_delay': total_delay,
                'average_weight': total_delay / len(route_signals) if route_signals else 0,
                'calculation_time': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating dynamic route weights: {e}")
            return {'success': False, 'error': str(e)}
    
    def find_optimal_emergency_route_with_traffic(self, current_location: Dict, 
                                                 vehicle_type: str = "ambulance",
                                                 destination_type: str = "hospital") -> Dict:
        """
        Find optimal emergency route considering real-time traffic conditions
        
        Args:
            current_location: Dict with 'lat' and 'lng' keys
            vehicle_type: Type of emergency vehicle
            destination_type: Type of destination ('hospital', 'police_station', 'fire_station')
            
        Returns:
            Optimal route with traffic-aware optimization
        """
        try:
            if not current_location:
                return {'error': 'Current location is required'}
            
            start_loc = Location(
                current_location['lat'], 
                current_location['lng'], 
                "Current Location"
            )
            
            # Get destinations based on type
            if destination_type == "hospital":
                destinations = self.get_nearby_hospitals(
                    start_loc.latitude, start_loc.longitude, radius=20
                )
            else:
                # For other destination types, use hospitals as fallback
                destinations = self.get_nearby_hospitals(
                    start_loc.latitude, start_loc.longitude, radius=20
                )
            
            if not destinations:
                return {'error': f'No {destination_type}s found within range'}
            
            # Calculate routes to multiple destinations with traffic consideration
            route_options = []
            
            for destination in destinations[:5]:  # Consider top 5 nearest
                # Calculate base route
                dest_location = Location(
                    destination['location']['lat'],
                    destination['location']['lng'],
                    destination['name']
                )
                
                base_route = self._calculate_route_dijkstra(start_loc, dest_location)
                
                if base_route:
                    # Get traffic-aware weights for this route
                    traffic_weights = self.calculate_dynamic_route_weights(base_route.traffic_signals)
                    
                    if traffic_weights.get('success'):
                        # Adjust route score based on traffic
                        traffic_delay = traffic_weights['total_estimated_delay']
                        base_time = base_route.duration * 60  # Convert to seconds
                        total_time = base_time + traffic_delay
                        
                        route_options.append({
                            'destination': destination,
                            'base_route': base_route,
                            'traffic_weights': traffic_weights,
                            'base_travel_time': base_time,
                            'traffic_delay': traffic_delay,
                            'total_estimated_time': total_time,
                            'signals_to_coordinate': base_route.traffic_signals,
                            'route_score': total_time + (base_route.distance * 10)  # Distance penalty
                        })
            
            if not route_options:
                return {'error': 'No valid routes found'}
            
            # Select best route (lowest total time)
            best_route = min(route_options, key=lambda x: x['route_score'])
            
            # Calculate time savings with signal coordination
            coordination_savings = len(best_route['signals_to_coordinate']) * 25  # 25s saved per signal
            optimized_time = best_route['total_estimated_time'] - coordination_savings
            
            return {
                'success': True,
                'recommended_route': {
                    'destination': best_route['destination'],
                    'route_details': {
                        'start_location': start_loc.to_dict(),
                        'end_location': dest_location.to_dict(),
                        'waypoints': [wp.to_dict() for wp in best_route['base_route'].waypoints],
                        'total_distance': best_route['base_route'].distance,
                        'base_travel_time': best_route['base_travel_time'],
                        'traffic_delay': best_route['traffic_delay'],
                        'coordination_savings': coordination_savings,
                        'optimized_travel_time': optimized_time
                    },
                    'signals_to_coordinate': best_route['signals_to_coordinate'],
                    'traffic_analysis': best_route['traffic_weights']
                },
                'alternative_routes': [
                    {
                        'destination': route['destination'],
                        'total_time': route['total_estimated_time'],
                        'distance': route['base_route'].distance,
                        'traffic_delay': route['traffic_delay']
                    }
                    for route in route_options[1:3]  # Top 2 alternatives
                ],
                'vehicle_type': vehicle_type,
                'destination_type': destination_type,
                'calculation_time': datetime.utcnow().isoformat(),
                'traffic_data_age': (datetime.utcnow() - self.last_traffic_update).total_seconds() 
                                  if self.last_traffic_update else None
            }
            
        except Exception as e:
            self.logger.error(f"Error finding optimal emergency route with traffic: {e}")
            return {'error': str(e)}
    
    def get_route_alternatives(self, start_location: Dict, end_location: Dict, 
                             max_alternatives: int = 3) -> Dict:
        """
        Get multiple route alternatives between two points
        
        Args:
            start_location: Starting point with 'lat' and 'lng'
            end_location: Destination point with 'lat' and 'lng'
            max_alternatives: Maximum number of alternative routes
            
        Returns:
            Multiple route options with traffic analysis
        """
        try:
            start_loc = Location(start_location['lat'], start_location['lng'], "Start")
            end_loc = Location(end_location['lat'], end_location['lng'], "End")
            
            # Generate alternative routes by varying intermediate waypoints
            route_alternatives = []
            
            # Primary route (direct)
            primary_route = self._calculate_route_dijkstra(start_loc, end_loc)
            if primary_route:
                traffic_analysis = self.calculate_dynamic_route_weights(primary_route.traffic_signals)
                route_alternatives.append({
                    'route_type': 'primary',
                    'route': primary_route,
                    'traffic_analysis': traffic_analysis,
                    'estimated_time': primary_route.duration * 60 + traffic_analysis.get('total_estimated_delay', 0)
                })
            
            # Alternative routes (simplified - in production would use more sophisticated algorithms)
            for i in range(min(max_alternatives - 1, 2)):
                # Create slight variations by avoiding certain signals
                if primary_route and len(primary_route.traffic_signals) > 2:
                    # Skip some signals to create alternative path
                    modified_signals = primary_route.traffic_signals[:]
                    if i < len(modified_signals) - 1:
                        modified_signals.pop(i + 1)
                    
                    # Create alternative route
                    alt_route = Route(
                        start=start_loc,
                        end=end_loc,
                        distance=primary_route.distance * (1.1 + i * 0.1),  # Slightly longer
                        duration=primary_route.duration * (1.1 + i * 0.1),
                        waypoints=primary_route.waypoints,
                        traffic_signals=modified_signals,
                        estimated_arrival=primary_route.estimated_arrival
                    )
                    
                    traffic_analysis = self.calculate_dynamic_route_weights(alt_route.traffic_signals)
                    route_alternatives.append({
                        'route_type': f'alternative_{i + 1}',
                        'route': alt_route,
                        'traffic_analysis': traffic_analysis,
                        'estimated_time': alt_route.duration * 60 + traffic_analysis.get('total_estimated_delay', 0)
                    })
            
            # Sort by estimated time
            route_alternatives.sort(key=lambda x: x['estimated_time'])
            
            return {
                'success': True,
                'total_alternatives': len(route_alternatives),
                'routes': route_alternatives,
                'recommended_route': route_alternatives[0] if route_alternatives else None,
                'calculation_time': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting route alternatives: {e}")
            return {'success': False, 'error': str(e)}