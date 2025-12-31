"""
Database Management Module
Handles PostgreSQL database operations for traffic management system
"""

import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json

class DatabaseManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Database connection parameters
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5436/local_lens_traffic')
        
        # Connection pool
        self.connection_pool = None
        self._initialize_connection_pool()
    
    def _initialize_connection_pool(self):
        """Initialize database connection pool"""
        try:
            self.connection_pool = SimpleConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=self.db_url
            )
            self.logger.info("Database connection pool initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize database connection pool: {e}")
            raise
    
    def get_connection(self):
        """Get a connection from the pool"""
        try:
            return self.connection_pool.getconn()
        except Exception as e:
            self.logger.error(f"Failed to get database connection: {e}")
            raise
    
    def return_connection(self, conn):
        """Return a connection to the pool"""
        try:
            self.connection_pool.putconn(conn)
        except Exception as e:
            self.logger.error(f"Failed to return database connection: {e}")
    
    def initialize_database(self):
        """Initialize database tables"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Create tables
            self._create_tables(cursor)
            
            # Insert initial data
            self._insert_initial_data(cursor)
            
            conn.commit()
            cursor.close()
            self.return_connection(conn)
            
            self.logger.info("Database initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize database: {e}")
            if conn:
                conn.rollback()
                cursor.close()
                self.return_connection(conn)
            raise
    
    def _create_tables(self, cursor):
        """Create database tables"""
        
        # Traffic signals table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS traffic_signals (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                location_description TEXT,
                signal_type VARCHAR(20) DEFAULT 'standard',
                status VARCHAR(20) DEFAULT 'active',
                installation_date DATE,
                last_maintenance DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Emergency detections table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS emergency_detections (
                id SERIAL PRIMARY KEY,
                signal_id VARCHAR(50) REFERENCES traffic_signals(id),
                vehicle_type VARCHAR(20) NOT NULL,
                confidence DECIMAL(5, 4) NOT NULL,
                detection_time TIMESTAMP NOT NULL,
                image_path VARCHAR(255),
                bbox_coordinates JSONB,
                features_detected JSONB,
                action_taken VARCHAR(50),
                response_time_ms INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Signal state history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS signal_state_history (
                id SERIAL PRIMARY KEY,
                signal_id VARCHAR(50) REFERENCES traffic_signals(id),
                state VARCHAR(10) NOT NULL,
                state_duration INTEGER NOT NULL,
                is_emergency_override BOOLEAN DEFAULT FALSE,
                override_reason TEXT,
                traffic_density DECIMAL(3, 2),
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Emergency routes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS emergency_routes (
                id SERIAL PRIMARY KEY,
                route_id VARCHAR(50) UNIQUE NOT NULL,
                vehicle_type VARCHAR(20) NOT NULL,
                start_location JSONB NOT NULL,
                end_location JSONB NOT NULL,
                route_waypoints JSONB,
                signals_coordinated JSONB,
                total_distance DECIMAL(8, 2),
                estimated_duration INTEGER,
                actual_duration INTEGER,
                time_saved INTEGER,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        
        # Traffic analytics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS traffic_analytics (
                id SERIAL PRIMARY KEY,
                signal_id VARCHAR(50) REFERENCES traffic_signals(id),
                date DATE NOT NULL,
                hour INTEGER NOT NULL,
                vehicle_count INTEGER DEFAULT 0,
                average_wait_time DECIMAL(5, 2) DEFAULT 0,
                emergency_overrides INTEGER DEFAULT 0,
                traffic_density DECIMAL(3, 2) DEFAULT 0,
                efficiency_score DECIMAL(3, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(signal_id, date, hour)
            )
        """)
        
        # Hospitals table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hospitals (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                hospital_type VARCHAR(20) NOT NULL,
                capacity INTEGER,
                contact_number VARCHAR(20),
                emergency_services BOOLEAN DEFAULT TRUE,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # System events log table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_events (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                event_source VARCHAR(50) NOT NULL,
                event_data JSONB,
                severity VARCHAR(10) DEFAULT 'info',
                message TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for better performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_emergency_detections_signal_time ON emergency_detections(signal_id, detection_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_signal_history_signal_time ON signal_state_history(signal_id, start_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_traffic_analytics_signal_date ON traffic_analytics(signal_id, date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_events_type_time ON system_events(event_type, timestamp)")
    
    def _insert_initial_data(self, cursor):
        """Insert initial data into tables"""
        
        # Insert traffic signals
        signals_data = [
            ('clock_tower', 'Clock Tower', 30.3165, 78.0322, 'Main city center intersection'),
            ('paltan_bazaar', 'Paltan Bazaar', 30.3203, 78.0389, 'Commercial area intersection'),
            ('rispana_bridge', 'Rispana Bridge', 30.3456, 78.0512, 'Bridge crossing intersection'),
            ('gandhi_road', 'Gandhi Road', 30.3293, 78.0428, 'Gandhi Road main intersection'),
            ('rajpur_road', 'Rajpur Road', 30.3742, 78.0664, 'Rajpur Road intersection'),
            ('saharanpur_road', 'Saharanpur Road', 30.3678, 78.0598, 'Saharanpur Road intersection'),
            ('haridwar_road', 'Haridwar Road', 30.2987, 78.0234, 'Haridwar Road intersection'),
            ('mussoorie_road', 'Mussoorie Road', 30.3567, 78.0789, 'Mussoorie Road intersection'),
            ('chakrata_road', 'Chakrata Road', 30.3234, 78.0456, 'Chakrata Road intersection'),
            ('ballupur', 'Ballupur Chowk', 30.3445, 78.0623, 'Ballupur main chowk')
        ]
        
        for signal_data in signals_data:
            cursor.execute("""
                INSERT INTO traffic_signals (id, name, latitude, longitude, location_description, installation_date)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (*signal_data, datetime.now().date()))
        
        # Insert hospitals
        hospitals_data = [
            ('doon_hospital', 'Doon Hospital', 30.3165, 78.0322, 'general', 200, '+91-135-2715001'),
            ('max_hospital', 'Max Super Speciality Hospital', 30.3293, 78.0428, 'specialty', 300, '+91-135-6712000'),
            ('himalayan_hospital', 'Himalayan Hospital', 30.3742, 78.0664, 'general', 150, '+91-135-2770000'),
            ('synergy_hospital', 'Synergy Hospital', 30.3456, 78.0512, 'emergency', 100, '+91-135-2749999'),
            ('govt_hospital', 'Government Doon Medical College Hospital', 30.3203, 78.0389, 'general', 400, '+91-135-2528888'),
            ('shri_mahant_hospital', 'Shri Mahant Indiresh Hospital', 30.3678, 78.0598, 'general', 250, '+91-135-2770000')
        ]
        
        for hospital_data in hospitals_data:
            cursor.execute("""
                INSERT INTO hospitals (id, name, latitude, longitude, hospital_type, capacity, contact_number)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, hospital_data)
    
    def log_emergency_detection(self, signal_id: str, vehicle_type: str, 
                              confidence: float, detection_time: datetime,
                              bbox_coordinates: Dict = None, features_detected: List = None,
                              action_taken: str = None, response_time_ms: int = None) -> int:
        """Log emergency vehicle detection"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO emergency_detections 
                (signal_id, vehicle_type, confidence, detection_time, bbox_coordinates, 
                 features_detected, action_taken, response_time_ms)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                signal_id, vehicle_type, confidence, detection_time,
                json.dumps(bbox_coordinates) if bbox_coordinates else None,
                json.dumps(features_detected) if features_detected else None,
                action_taken, response_time_ms
            ))
            
            detection_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            self.return_connection(conn)
            
            return detection_id
            
        except Exception as e:
            self.logger.error(f"Failed to log emergency detection: {e}")
            if conn:
                conn.rollback()
                cursor.close()
                self.return_connection(conn)
            raise
    
    def log_signal_state_change(self, signal_id: str, state: str, duration: int,
                              is_emergency_override: bool = False, override_reason: str = None,
                              traffic_density: float = None) -> int:
        """Log signal state change"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            start_time = datetime.utcnow()
            end_time = start_time + timedelta(seconds=duration)
            
            cursor.execute("""
                INSERT INTO signal_state_history 
                (signal_id, state, state_duration, is_emergency_override, override_reason, 
                 traffic_density, start_time, end_time)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                signal_id, state, duration, is_emergency_override, override_reason,
                traffic_density, start_time, end_time
            ))
            
            history_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            self.return_connection(conn)
            
            return history_id
            
        except Exception as e:
            self.logger.error(f"Failed to log signal state change: {e}")
            if conn:
                conn.rollback()
                cursor.close()
                self.return_connection(conn)
            raise
    
    def create_emergency_route(self, route_id: str, vehicle_type: str,
                             start_location: Dict, end_location: Dict,
                             route_waypoints: List = None, signals_coordinated: List = None,
                             total_distance: float = None, estimated_duration: int = None) -> int:
        """Create emergency route record"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO emergency_routes 
                (route_id, vehicle_type, start_location, end_location, route_waypoints,
                 signals_coordinated, total_distance, estimated_duration)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                route_id, vehicle_type, json.dumps(start_location), json.dumps(end_location),
                json.dumps(route_waypoints) if route_waypoints else None,
                json.dumps(signals_coordinated) if signals_coordinated else None,
                total_distance, estimated_duration
            ))
            
            route_db_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            self.return_connection(conn)
            
            return route_db_id
            
        except Exception as e:
            self.logger.error(f"Failed to create emergency route: {e}")
            if conn:
                conn.rollback()
                cursor.close()
                self.return_connection(conn)
            raise
    
    def update_route_completion(self, route_id: str, actual_duration: int, 
                              time_saved: int, status: str = 'completed'):
        """Update emergency route with completion data"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE emergency_routes 
                SET actual_duration = %s, time_saved = %s, status = %s, completed_at = %s
                WHERE route_id = %s
            """, (actual_duration, time_saved, status, datetime.utcnow(), route_id))
            
            conn.commit()
            cursor.close()
            self.return_connection(conn)
            
        except Exception as e:
            self.logger.error(f"Failed to update route completion: {e}")
            if conn:
                conn.rollback()
                cursor.close()
                self.return_connection(conn)
            raise
    
    def get_all_signals(self) -> List[Dict]:
        """Get all traffic signals"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT id, name, latitude, longitude, location_description, 
                       signal_type, status, installation_date, last_maintenance
                FROM traffic_signals 
                WHERE status = 'active'
                ORDER BY name
            """)
            
            signals = cursor.fetchall()
            cursor.close()
            self.return_connection(conn)
            
            return [dict(signal) for signal in signals]
            
        except Exception as e:
            self.logger.error(f"Failed to get all signals: {e}")
            if conn:
                cursor.close()
                self.return_connection(conn)
            return []
    
    def get_signal_by_id(self, signal_id: str) -> Optional[Dict]:
        """Get specific traffic signal by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT id, name, latitude, longitude, location_description, 
                       signal_type, status, installation_date, last_maintenance
                FROM traffic_signals 
                WHERE id = %s
            """, (signal_id,))
            
            signal = cursor.fetchone()
            cursor.close()
            self.return_connection(conn)
            
            return dict(signal) if signal else None
            
        except Exception as e:
            self.logger.error(f"Failed to get signal {signal_id}: {e}")
            if conn:
                cursor.close()
                self.return_connection(conn)
            return None
    
    def get_traffic_analytics(self, start_date: str = None, end_date: str = None) -> Dict:
        """Get traffic analytics data"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Default to last 7 days if no dates provided
            if not start_date:
                start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y-%m-%d')
            
            # Get overall analytics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_detections,
                    COUNT(DISTINCT signal_id) as signals_with_detections,
                    AVG(confidence) as avg_confidence,
                    COUNT(CASE WHEN vehicle_type = 'ambulance' THEN 1 END) as ambulance_detections,
                    COUNT(CASE WHEN vehicle_type = 'police' THEN 1 END) as police_detections,
                    COUNT(CASE WHEN vehicle_type = 'fire_truck' THEN 1 END) as fire_truck_detections
                FROM emergency_detections 
                WHERE detection_time::date BETWEEN %s AND %s
            """, (start_date, end_date))
            
            overall_stats = cursor.fetchone()
            
            # Get daily breakdown
            cursor.execute("""
                SELECT 
                    detection_time::date as date,
                    COUNT(*) as detections,
                    COUNT(DISTINCT signal_id) as signals_involved,
                    AVG(confidence) as avg_confidence
                FROM emergency_detections 
                WHERE detection_time::date BETWEEN %s AND %s
                GROUP BY detection_time::date
                ORDER BY date
            """, (start_date, end_date))
            
            daily_stats = cursor.fetchall()
            
            # Get signal-wise statistics
            cursor.execute("""
                SELECT 
                    s.id, s.name,
                    COUNT(ed.id) as detections,
                    AVG(ed.confidence) as avg_confidence,
                    MAX(ed.detection_time) as last_detection
                FROM traffic_signals s
                LEFT JOIN emergency_detections ed ON s.id = ed.signal_id 
                    AND ed.detection_time::date BETWEEN %s AND %s
                GROUP BY s.id, s.name
                ORDER BY detections DESC
            """, (start_date, end_date))
            
            signal_stats = cursor.fetchall()
            
            cursor.close()
            self.return_connection(conn)
            
            return {
                'period': {'start_date': start_date, 'end_date': end_date},
                'overall': dict(overall_stats) if overall_stats else {},
                'daily_breakdown': [dict(day) for day in daily_stats],
                'signal_statistics': [dict(signal) for signal in signal_stats]
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get traffic analytics: {e}")
            if conn:
                cursor.close()
                self.return_connection(conn)
            return {}
    
    def get_emergency_analytics(self, start_date: str = None, end_date: str = None) -> Dict:
        """Get emergency response analytics"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Default to last 30 days if no dates provided
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y-%m-%d')
            
            # Get emergency route statistics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_routes,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_routes,
                    AVG(total_distance) as avg_distance,
                    AVG(estimated_duration) as avg_estimated_duration,
                    AVG(actual_duration) as avg_actual_duration,
                    AVG(time_saved) as avg_time_saved,
                    COUNT(CASE WHEN vehicle_type = 'ambulance' THEN 1 END) as ambulance_routes,
                    COUNT(CASE WHEN vehicle_type = 'police' THEN 1 END) as police_routes
                FROM emergency_routes 
                WHERE created_at::date BETWEEN %s AND %s
            """, (start_date, end_date))
            
            route_stats = cursor.fetchone()
            
            # Get response time statistics
            cursor.execute("""
                SELECT 
                    AVG(response_time_ms) as avg_response_time,
                    MIN(response_time_ms) as min_response_time,
                    MAX(response_time_ms) as max_response_time,
                    COUNT(CASE WHEN response_time_ms < 1000 THEN 1 END) as fast_responses,
                    COUNT(CASE WHEN response_time_ms >= 1000 AND response_time_ms < 3000 THEN 1 END) as medium_responses,
                    COUNT(CASE WHEN response_time_ms >= 3000 THEN 1 END) as slow_responses
                FROM emergency_detections 
                WHERE detection_time::date BETWEEN %s AND %s 
                AND response_time_ms IS NOT NULL
            """, (start_date, end_date))
            
            response_stats = cursor.fetchone()
            
            # Get hourly distribution
            cursor.execute("""
                SELECT 
                    EXTRACT(hour FROM detection_time) as hour,
                    COUNT(*) as detections
                FROM emergency_detections 
                WHERE detection_time::date BETWEEN %s AND %s
                GROUP BY EXTRACT(hour FROM detection_time)
                ORDER BY hour
            """, (start_date, end_date))
            
            hourly_distribution = cursor.fetchall()
            
            cursor.close()
            self.return_connection(conn)
            
            return {
                'period': {'start_date': start_date, 'end_date': end_date},
                'route_statistics': dict(route_stats) if route_stats else {},
                'response_time_statistics': dict(response_stats) if response_stats else {},
                'hourly_distribution': [dict(hour) for hour in hourly_distribution]
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get emergency analytics: {e}")
            if conn:
                cursor.close()
                self.return_connection(conn)
            return {}
    
    def log_system_event(self, event_type: str, event_source: str, 
                        event_data: Dict = None, severity: str = 'info', 
                        message: str = None):
        """Log system events"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO system_events (event_type, event_source, event_data, severity, message)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                event_type, event_source, 
                json.dumps(event_data) if event_data else None,
                severity, message
            ))
            
            conn.commit()
            cursor.close()
            self.return_connection(conn)
            
        except Exception as e:
            self.logger.error(f"Failed to log system event: {e}")
            if conn:
                conn.rollback()
                cursor.close()
                self.return_connection(conn)
    
    def cleanup_old_data(self, days_to_keep: int = 90):
        """Clean up old data to maintain database performance"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            # Clean old emergency detections
            cursor.execute("""
                DELETE FROM emergency_detections 
                WHERE detection_time < %s
            """, (cutoff_date,))
            
            # Clean old signal state history
            cursor.execute("""
                DELETE FROM signal_state_history 
                WHERE start_time < %s
            """, (cutoff_date,))
            
            # Clean old system events
            cursor.execute("""
                DELETE FROM system_events 
                WHERE timestamp < %s
            """, (cutoff_date,))
            
            conn.commit()
            cursor.close()
            self.return_connection(conn)
            
            self.logger.info(f"Cleaned up data older than {days_to_keep} days")
            
        except Exception as e:
            self.logger.error(f"Failed to cleanup old data: {e}")
            if conn:
                conn.rollback()
                cursor.close()
                self.return_connection(conn)
    
    def close_all_connections(self):
        """Close all database connections"""
        if self.connection_pool:
            self.connection_pool.closeall()
            self.logger.info("All database connections closed")