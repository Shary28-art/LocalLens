#!/usr/bin/env python3
"""
Test script to verify the traffic management system structure
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test that all modules can be imported"""
    try:
        from detection.vehicle_detector import EmergencyVehicleDetector
        print("✓ EmergencyVehicleDetector imported successfully")
        
        from routing.route_optimizer import RouteOptimizer
        print("✓ RouteOptimizer imported successfully")
        
        from signals.signal_controller import SignalController
        print("✓ SignalController imported successfully")
        
        from config.database import DatabaseManager
        print("✓ DatabaseManager imported successfully")
        
        from utils.logger import setup_logger
        print("✓ Logger utilities imported successfully")
        
        from utils.helpers import generate_unique_id, calculate_hash
        print("✓ Helper utilities imported successfully")
        
        return True
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False

def test_class_initialization():
    """Test that classes can be initialized without external dependencies"""
    try:
        # Test detector (should work without external models)
        detector = EmergencyVehicleDetector()
        print("✓ EmergencyVehicleDetector initialized")
        
        # Test route optimizer
        optimizer = RouteOptimizer()
        print("✓ RouteOptimizer initialized")
        
        # Test signal controller (should work without Redis)
        controller = SignalController()
        print("✓ SignalController initialized")
        
        return True
    except Exception as e:
        print(f"✗ Initialization error: {e}")
        return False

def test_basic_functionality():
    """Test basic functionality without external dependencies"""
    try:
        from detection.vehicle_detector import EmergencyVehicleDetector
        from routing.route_optimizer import RouteOptimizer
        from signals.signal_controller import SignalController
        
        detector = EmergencyVehicleDetector()
        optimizer = RouteOptimizer()
        controller = SignalController()
        
        # Test detector status
        status = detector.get_system_status()
        assert 'status' in status
        print("✓ Detector system status working")
        
        # Test distance calculation
        distance = optimizer.calculate_distance(30.3165, 78.0322, 30.3203, 78.0389)
        assert distance > 0
        print("✓ Distance calculation working")
        
        # Test signal creation
        result = controller.create_signal_if_not_exists('test_signal', 'Test Signal')
        assert result['success']
        print("✓ Signal creation working")
        
        return True
    except Exception as e:
        print(f"✗ Functionality test error: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Traffic Management System Structure...")
    print("=" * 50)
    
    tests = [
        ("Module Imports", test_imports),
        ("Class Initialization", test_class_initialization),
        ("Basic Functionality", test_basic_functionality)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 30)
        success = test_func()
        results.append((test_name, success))
    
    print("\n" + "=" * 50)
    print("Test Results Summary:")
    print("=" * 50)
    
    all_passed = True
    for test_name, success in results:
        status = "PASS" if success else "FAIL"
        print(f"{test_name}: {status}")
        if not success:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! Traffic management system structure is complete.")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)