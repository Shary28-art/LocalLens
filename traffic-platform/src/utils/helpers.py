"""
Helper utility functions for the traffic management system
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import base64
import uuid

def generate_unique_id(prefix: str = "") -> str:
    """
    Generate a unique identifier
    
    Args:
        prefix: Optional prefix for the ID
        
    Returns:
        Unique identifier string
    """
    unique_id = str(uuid.uuid4())
    if prefix:
        return f"{prefix}_{unique_id}"
    return unique_id

def calculate_hash(data: str) -> str:
    """
    Calculate SHA-256 hash of data
    
    Args:
        data: String data to hash
        
    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(data.encode()).hexdigest()

def encode_image_base64(image_path: str) -> Optional[str]:
    """
    Encode image file to base64 string
    
    Args:
        image_path: Path to image file
        
    Returns:
        Base64 encoded string or None if error
    """
    try:
        with open(image_path, 'rb') as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_string
    except Exception:
        return None

def decode_base64_image(base64_string: str, output_path: str) -> bool:
    """
    Decode base64 string to image file
    
    Args:
        base64_string: Base64 encoded image data
        output_path: Path to save decoded image
        
    Returns:
        True if successful, False otherwise
    """
    try:
        image_data = base64.b64decode(base64_string)
        with open(output_path, 'wb') as image_file:
            image_file.write(image_data)
        return True
    except Exception:
        return False

def validate_coordinates(lat: float, lng: float) -> bool:
    """
    Validate latitude and longitude coordinates
    
    Args:
        lat: Latitude value
        lng: Longitude value
        
    Returns:
        True if valid coordinates, False otherwise
    """
    return -90 <= lat <= 90 and -180 <= lng <= 180

def format_duration(seconds: int) -> str:
    """
    Format duration in seconds to human-readable string
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        Formatted duration string (e.g., "2m 30s")
    """
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        minutes = seconds // 60
        remaining_seconds = seconds % 60
        if remaining_seconds > 0:
            return f"{minutes}m {remaining_seconds}s"
        return f"{minutes}m"
    else:
        hours = seconds // 3600
        remaining_minutes = (seconds % 3600) // 60
        if remaining_minutes > 0:
            return f"{hours}h {remaining_minutes}m"
        return f"{hours}h"

def format_distance(distance_km: float) -> str:
    """
    Format distance in kilometers to human-readable string
    
    Args:
        distance_km: Distance in kilometers
        
    Returns:
        Formatted distance string
    """
    if distance_km < 1:
        meters = int(distance_km * 1000)
        return f"{meters}m"
    else:
        return f"{distance_km:.1f}km"

def calculate_eta(distance_km: float, speed_kmh: float) -> datetime:
    """
    Calculate estimated time of arrival
    
    Args:
        distance_km: Distance in kilometers
        speed_kmh: Speed in kilometers per hour
        
    Returns:
        Estimated arrival datetime
    """
    travel_time_hours = distance_km / speed_kmh
    travel_time_seconds = travel_time_hours * 3600
    
    return datetime.utcnow() + timedelta(seconds=travel_time_seconds)

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing invalid characters
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Remove multiple consecutive underscores
    while '__' in filename:
        filename = filename.replace('__', '_')
    
    return filename.strip('_')

def create_directory_if_not_exists(directory_path: str) -> bool:
    """
    Create directory if it doesn't exist
    
    Args:
        directory_path: Path to directory
        
    Returns:
        True if directory exists or was created, False otherwise
    """
    try:
        if not os.path.exists(directory_path):
            os.makedirs(directory_path)
        return True
    except Exception:
        return False

def load_json_file(file_path: str) -> Optional[Dict]:
    """
    Load JSON data from file
    
    Args:
        file_path: Path to JSON file
        
    Returns:
        Parsed JSON data or None if error
    """
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except Exception:
        return None

def save_json_file(data: Dict, file_path: str) -> bool:
    """
    Save data to JSON file
    
    Args:
        data: Data to save
        file_path: Path to save file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=2, default=str)
        return True
    except Exception:
        return False

def get_file_size(file_path: str) -> Optional[int]:
    """
    Get file size in bytes
    
    Args:
        file_path: Path to file
        
    Returns:
        File size in bytes or None if error
    """
    try:
        return os.path.getsize(file_path)
    except Exception:
        return None

def is_image_file(file_path: str) -> bool:
    """
    Check if file is an image based on extension
    
    Args:
        file_path: Path to file
        
    Returns:
        True if image file, False otherwise
    """
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp'}
    _, ext = os.path.splitext(file_path.lower())
    return ext in image_extensions

def calculate_confidence_score(individual_scores: List[float], weights: List[float] = None) -> float:
    """
    Calculate weighted confidence score from individual scores
    
    Args:
        individual_scores: List of individual confidence scores (0.0 to 1.0)
        weights: Optional weights for each score (defaults to equal weights)
        
    Returns:
        Combined confidence score (0.0 to 1.0)
    """
    if not individual_scores:
        return 0.0
    
    if weights is None:
        weights = [1.0] * len(individual_scores)
    
    if len(weights) != len(individual_scores):
        raise ValueError("Weights and scores must have the same length")
    
    weighted_sum = sum(score * weight for score, weight in zip(individual_scores, weights))
    total_weight = sum(weights)
    
    return min(1.0, weighted_sum / total_weight)

def parse_time_string(time_str: str) -> Optional[datetime]:
    """
    Parse time string in various formats to datetime
    
    Args:
        time_str: Time string to parse
        
    Returns:
        Parsed datetime or None if error
    """
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%d %H:%M:%S.%f',
        '%Y-%m-%dT%H:%M:%S.%f',
        '%Y-%m-%dT%H:%M:%S.%fZ'
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(time_str, fmt)
        except ValueError:
            continue
    
    return None

def get_system_info() -> Dict[str, Any]:
    """
    Get system information for debugging and monitoring
    
    Returns:
        Dictionary containing system information
    """
    import platform
    import psutil
    
    try:
        return {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'cpu_count': psutil.cpu_count(),
            'memory_total': psutil.virtual_memory().total,
            'memory_available': psutil.virtual_memory().available,
            'disk_usage': psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:').percent,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception:
        return {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'timestamp': datetime.utcnow().isoformat()
        }

def retry_operation(func, max_retries: int = 3, delay_seconds: float = 1.0):
    """
    Retry operation with exponential backoff
    
    Args:
        func: Function to retry
        max_retries: Maximum number of retries
        delay_seconds: Initial delay between retries
        
    Returns:
        Function result or raises last exception
    """
    import time
    
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return func()
        except Exception as e:
            last_exception = e
            if attempt < max_retries:
                time.sleep(delay_seconds * (2 ** attempt))  # Exponential backoff
            else:
                raise last_exception

def validate_emergency_vehicle_type(vehicle_type: str) -> bool:
    """
    Validate emergency vehicle type
    
    Args:
        vehicle_type: Vehicle type string
        
    Returns:
        True if valid emergency vehicle type, False otherwise
    """
    valid_types = {'ambulance', 'police', 'fire_truck', 'emergency_vehicle'}
    return vehicle_type.lower() in valid_types

def calculate_response_time_score(response_time_ms: int) -> float:
    """
    Calculate response time score (0.0 to 1.0, higher is better)
    
    Args:
        response_time_ms: Response time in milliseconds
        
    Returns:
        Response time score
    """
    if response_time_ms <= 500:
        return 1.0
    elif response_time_ms <= 1000:
        return 0.8
    elif response_time_ms <= 2000:
        return 0.6
    elif response_time_ms <= 3000:
        return 0.4
    elif response_time_ms <= 5000:
        return 0.2
    else:
        return 0.1

def format_coordinates(lat: float, lng: float, precision: int = 6) -> str:
    """
    Format coordinates to string with specified precision
    
    Args:
        lat: Latitude
        lng: Longitude
        precision: Decimal places
        
    Returns:
        Formatted coordinate string
    """
    return f"{lat:.{precision}f}, {lng:.{precision}f}"

def calculate_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate bearing between two points
    
    Args:
        lat1, lng1: First point coordinates
        lat2, lng2: Second point coordinates
        
    Returns:
        Bearing in degrees (0-360)
    """
    import math
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lng_rad = math.radians(lng2 - lng1)
    
    y = math.sin(delta_lng_rad) * math.cos(lat2_rad)
    x = (math.cos(lat1_rad) * math.sin(lat2_rad) - 
         math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(delta_lng_rad))
    
    bearing_rad = math.atan2(y, x)
    bearing_deg = math.degrees(bearing_rad)
    
    return (bearing_deg + 360) % 360

def get_cardinal_direction(bearing: float) -> str:
    """
    Convert bearing to cardinal direction
    
    Args:
        bearing: Bearing in degrees
        
    Returns:
        Cardinal direction string
    """
    directions = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ]
    
    index = round(bearing / 22.5) % 16
    return directions[index]