import cv2
import numpy as np
from ultralytics import YOLO
import os
import logging
from typing import Dict, List, Tuple, Optional
from PIL import Image
import io
from datetime import datetime

class EmergencyVehicleDetector:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Load YOLOv8 model
        model_path = os.getenv('MODEL_PATH', 'models/yolov8n.pt')
        try:
            self.model = YOLO(model_path)
            self.logger.info(f"Loaded YOLO model from {model_path}")
        except Exception as e:
            self.logger.error(f"Failed to load YOLO model: {e}")
            # Fallback to default model
            self.model = YOLO('yolov8n.pt')
        
        # Detection parameters
        self.confidence_threshold = float(os.getenv('DETECTION_CONFIDENCE_THRESHOLD', 0.85))
        self.emergency_colors = os.getenv('EMERGENCY_VEHICLE_COLORS', 'blue,red,white').split(',')
        
        # Vehicle classes that could be emergency vehicles
        self.vehicle_classes = ['car', 'truck', 'bus', 'motorcycle']
        
        # Emergency vehicle patterns and characteristics
        self.emergency_patterns = {
            'ambulance': {
                'colors': ['white', 'red', 'blue'],
                'text_patterns': ['ambulance', 'medical', 'emergency'],
                'shape_features': ['cross', 'medical_symbol']
            },
            'police': {
                'colors': ['blue', 'white', 'black'],
                'text_patterns': ['police', 'patrol', 'sheriff'],
                'shape_features': ['badge', 'light_bar']
            },
            'fire_truck': {
                'colors': ['red', 'yellow'],
                'text_patterns': ['fire', 'rescue', 'department'],
                'shape_features': ['ladder', 'hose', 'large_vehicle']
            }
        }
    
    def detect_emergency_vehicle(self, image_input) -> Dict:
        """
        Main detection function for emergency vehicles
        
        Args:
            image_input: Image file or numpy array
            
        Returns:
            Dict containing detection results
        """
        try:
            # Convert input to OpenCV format
            image = self._prepare_image(image_input)
            
            if image is None:
                return {
                    'is_emergency': False,
                    'error': 'Invalid image input',
                    'confidence': 0.0,
                    'vehicle_type': None
                }
            
            # Run YOLO detection
            results = self.model(image)
            
            # Process detections
            emergency_detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get class name and confidence
                        class_id = int(box.cls[0])
                        class_name = self.model.names[class_id]
                        confidence = float(box.conf[0])
                        
                        # Check if it's a vehicle
                        if class_name in self.vehicle_classes and confidence > self.confidence_threshold:
                            # Extract bounding box
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            vehicle_crop = image[int(y1):int(y2), int(x1):int(x2)]
                            
                            # Analyze if it's an emergency vehicle
                            emergency_analysis = self._analyze_emergency_features(vehicle_crop)
                            
                            if emergency_analysis['is_emergency']:
                                emergency_detections.append({
                                    'bbox': [int(x1), int(y1), int(x2), int(y2)],
                                    'confidence': confidence,
                                    'vehicle_type': emergency_analysis['vehicle_type'],
                                    'emergency_confidence': emergency_analysis['confidence'],
                                    'features_detected': emergency_analysis['features']
                                })
            
            # Return best detection
            if emergency_detections:
                best_detection = max(emergency_detections, 
                                   key=lambda x: x['emergency_confidence'])
                
                return {
                    'is_emergency': True,
                    'vehicle_type': best_detection['vehicle_type'],
                    'confidence': best_detection['emergency_confidence'],
                    'bbox': best_detection['bbox'],
                    'features_detected': best_detection['features_detected'],
                    'detection_time': datetime.utcnow().isoformat(),
                    'all_detections': emergency_detections
                }
            else:
                return {
                    'is_emergency': False,
                    'vehicle_type': None,
                    'confidence': 0.0,
                    'detection_time': datetime.utcnow().isoformat(),
                    'message': 'No emergency vehicles detected'
                }
                
        except Exception as e:
            self.logger.error(f"Error in emergency vehicle detection: {e}")
            return {
                'is_emergency': False,
                'error': str(e),
                'confidence': 0.0,
                'vehicle_type': None
            }
    
    def _prepare_image(self, image_input):
        """Convert various image inputs to OpenCV format"""
        try:
            if hasattr(image_input, 'read'):
                # File-like object
                image_bytes = image_input.read()
                image_array = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            elif isinstance(image_input, np.ndarray):
                # Already a numpy array
                image = image_input
            elif isinstance(image_input, str):
                # File path
                image = cv2.imread(image_input)
            else:
                return None
            
            return image
            
        except Exception as e:
            self.logger.error(f"Error preparing image: {e}")
            return None
    
    def _analyze_emergency_features(self, vehicle_crop) -> Dict:
        """
        Analyze vehicle crop for emergency vehicle features
        
        Args:
            vehicle_crop: Cropped image of detected vehicle
            
        Returns:
            Dict with emergency analysis results
        """
        try:
            if vehicle_crop is None or vehicle_crop.size == 0:
                return {
                    'is_emergency': False,
                    'vehicle_type': None,
                    'confidence': 0.0,
                    'features': []
                }
            
            # Color analysis
            color_score, dominant_colors = self._analyze_colors(vehicle_crop)
            
            # Shape and pattern analysis
            pattern_score, detected_patterns = self._analyze_patterns(vehicle_crop)
            
            # Light bar detection (for police/emergency vehicles)
            light_score, has_light_bar = self._detect_light_bar(vehicle_crop)
            
            # Combine scores
            total_score = (color_score * 0.4 + pattern_score * 0.4 + light_score * 0.2)
            
            # Determine vehicle type based on features
            vehicle_type = self._classify_emergency_type(
                dominant_colors, detected_patterns, has_light_bar
            )
            
            features_detected = []
            if color_score > 0.3:
                features_detected.extend([f"emergency_color_{color}" for color in dominant_colors])
            if pattern_score > 0.3:
                features_detected.extend(detected_patterns)
            if has_light_bar:
                features_detected.append("light_bar")
            
            is_emergency = total_score > 0.5
            
            return {
                'is_emergency': is_emergency,
                'vehicle_type': vehicle_type if is_emergency else None,
                'confidence': total_score,
                'features': features_detected,
                'color_score': color_score,
                'pattern_score': pattern_score,
                'light_score': light_score
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing emergency features: {e}")
            return {
                'is_emergency': False,
                'vehicle_type': None,
                'confidence': 0.0,
                'features': []
            }
    
    def _analyze_colors(self, image) -> Tuple[float, List[str]]:
        """Analyze dominant colors in the vehicle"""
        try:
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Define color ranges for emergency vehicles
            color_ranges = {
                'red': [(0, 50, 50), (10, 255, 255), (170, 50, 50), (180, 255, 255)],
                'blue': [(100, 50, 50), (130, 255, 255)],
                'white': [(0, 0, 200), (180, 30, 255)],
                'yellow': [(20, 50, 50), (30, 255, 255)]
            }
            
            detected_colors = []
            color_percentages = {}
            
            total_pixels = image.shape[0] * image.shape[1]
            
            for color_name, ranges in color_ranges.items():
                mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
                
                for i in range(0, len(ranges), 2):
                    lower = np.array(ranges[i])
                    upper = np.array(ranges[i + 1])
                    color_mask = cv2.inRange(hsv, lower, upper)
                    mask = cv2.bitwise_or(mask, color_mask)
                
                color_pixels = cv2.countNonZero(mask)
                percentage = color_pixels / total_pixels
                
                if percentage > 0.1:  # At least 10% of the vehicle
                    detected_colors.append(color_name)
                    color_percentages[color_name] = percentage
            
            # Calculate score based on emergency color presence
            emergency_color_score = 0.0
            for color in detected_colors:
                if color in self.emergency_colors:
                    emergency_color_score += color_percentages[color]
            
            return min(emergency_color_score, 1.0), detected_colors
            
        except Exception as e:
            self.logger.error(f"Error in color analysis: {e}")
            return 0.0, []
    
    def _analyze_patterns(self, image) -> Tuple[float, List[str]]:
        """Analyze patterns and text that indicate emergency vehicles"""
        try:
            # Convert to grayscale for pattern detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            detected_patterns = []
            pattern_score = 0.0
            
            # Edge detection for geometric patterns
            edges = cv2.Canny(gray, 50, 150)
            
            # Look for rectangular patterns (light bars, signs)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            rectangular_patterns = 0
            for contour in contours:
                # Approximate contour to polygon
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # Check if it's roughly rectangular
                if len(approx) == 4:
                    area = cv2.contourArea(contour)
                    if area > 100:  # Minimum size threshold
                        rectangular_patterns += 1
            
            if rectangular_patterns > 2:
                detected_patterns.append("rectangular_patterns")
                pattern_score += 0.3
            
            # Look for cross patterns (ambulance symbol)
            # Simple template matching could be implemented here
            
            # Text detection could be added using OCR
            # For now, we'll use basic pattern recognition
            
            return pattern_score, detected_patterns
            
        except Exception as e:
            self.logger.error(f"Error in pattern analysis: {e}")
            return 0.0, []
    
    def _detect_light_bar(self, image) -> Tuple[float, bool]:
        """Detect emergency light bars on top of vehicles"""
        try:
            # Focus on the top portion of the vehicle
            height = image.shape[0]
            top_portion = image[:height//3, :]
            
            # Convert to HSV
            hsv = cv2.cvtColor(top_portion, cv2.COLOR_BGR2HSV)
            
            # Look for bright, saturated colors (emergency lights)
            # High saturation and value indicate bright colored lights
            bright_mask = cv2.inRange(hsv, (0, 100, 200), (180, 255, 255))
            
            # Find contours of bright areas
            contours, _ = cv2.findContours(bright_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Look for horizontal patterns (light bars are typically horizontal)
            horizontal_patterns = 0
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h if h > 0 else 0
                
                # Light bars are typically wider than they are tall
                if aspect_ratio > 2 and w > 20:
                    horizontal_patterns += 1
            
            has_light_bar = horizontal_patterns > 0
            light_score = min(horizontal_patterns * 0.3, 1.0)
            
            return light_score, has_light_bar
            
        except Exception as e:
            self.logger.error(f"Error in light bar detection: {e}")
            return 0.0, False
    
    def _classify_emergency_type(self, colors: List[str], patterns: List[str], 
                                has_light_bar: bool) -> Optional[str]:
        """Classify the type of emergency vehicle based on detected features"""
        try:
            scores = {
                'ambulance': 0.0,
                'police': 0.0,
                'fire_truck': 0.0
            }
            
            # Color-based scoring
            if 'white' in colors and ('red' in colors or 'blue' in colors):
                scores['ambulance'] += 0.4
            
            if 'blue' in colors and 'white' in colors:
                scores['police'] += 0.4
            
            if 'red' in colors:
                scores['fire_truck'] += 0.3
                scores['ambulance'] += 0.2
            
            # Pattern-based scoring
            if 'rectangular_patterns' in patterns:
                scores['ambulance'] += 0.2
                scores['police'] += 0.2
            
            # Light bar scoring
            if has_light_bar:
                scores['police'] += 0.3
                scores['ambulance'] += 0.2
                scores['fire_truck'] += 0.1
            
            # Return the type with highest score if above threshold
            max_score = max(scores.values())
            if max_score > 0.4:
                return max(scores, key=scores.get)
            
            return 'emergency_vehicle'  # Generic emergency vehicle
            
        except Exception as e:
            self.logger.error(f"Error classifying emergency type: {e}")
            return None
    
    def get_system_status(self) -> Dict:
        """Get the current status of the detection system"""
        return {
            'model_loaded': self.model is not None,
            'confidence_threshold': self.confidence_threshold,
            'emergency_colors': self.emergency_colors,
            'supported_vehicle_types': list(self.emergency_patterns.keys()),
            'system_time': datetime.utcnow().isoformat(),
            'status': 'operational'
        }
    
    def update_confidence_threshold(self, new_threshold: float):
        """Update the confidence threshold for detections"""
        if 0.0 <= new_threshold <= 1.0:
            self.confidence_threshold = new_threshold
            self.logger.info(f"Updated confidence threshold to {new_threshold}")
            return True
        return False
