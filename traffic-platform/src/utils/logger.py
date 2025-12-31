"""
Logging Configuration Module
Sets up structured logging for the traffic management system
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
import json

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
        
        return json.dumps(log_entry)

def setup_logger(name: str, level: str = None) -> logging.Logger:
    """
    Set up a logger with both console and file handlers
    
    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Configured logger instance
    """
    
    # Get log level from environment or default to INFO
    if level is None:
        level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level))
    
    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger
    
    # Create formatters
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    json_formatter = JSONFormatter()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level))
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler (if log directory exists or can be created)
    log_dir = os.getenv('LOG_DIR', 'logs')
    if not os.path.exists(log_dir):
        try:
            os.makedirs(log_dir)
        except OSError:
            # If we can't create log directory, skip file logging
            log_dir = None
    
    if log_dir:
        # Application log file
        app_log_file = os.path.join(log_dir, 'traffic_management.log')
        file_handler = logging.handlers.RotatingFileHandler(
            app_log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(getattr(logging, level))
        file_handler.setFormatter(json_formatter)
        logger.addHandler(file_handler)
        
        # Error log file (ERROR and CRITICAL only)
        error_log_file = os.path.join(log_dir, 'traffic_management_errors.log')
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=3
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(json_formatter)
        logger.addHandler(error_handler)
    
    return logger

def log_with_extra(logger: logging.Logger, level: str, message: str, **extra_fields):
    """
    Log a message with extra fields for structured logging
    
    Args:
        logger: Logger instance
        level: Log level (debug, info, warning, error, critical)
        message: Log message
        **extra_fields: Additional fields to include in log entry
    """
    
    # Create a log record with extra fields
    log_method = getattr(logger, level.lower())
    
    # Add extra fields to the record
    class ExtraAdapter(logging.LoggerAdapter):
        def process(self, msg, kwargs):
            kwargs['extra'] = {'extra_fields': extra_fields}
            return msg, kwargs
    
    adapter = ExtraAdapter(logger, {})
    log_method(message)

# Performance monitoring decorator
def log_performance(logger: logging.Logger):
    """
    Decorator to log function performance metrics
    
    Args:
        logger: Logger instance to use
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                log_with_extra(
                    logger, 'info',
                    f"Function {func.__name__} completed successfully",
                    function_name=func.__name__,
                    execution_time_ms=round(execution_time * 1000, 2),
                    status='success'
                )
                
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                
                log_with_extra(
                    logger, 'error',
                    f"Function {func.__name__} failed with error: {str(e)}",
                    function_name=func.__name__,
                    execution_time_ms=round(execution_time * 1000, 2),
                    status='error',
                    error_message=str(e),
                    error_type=type(e).__name__
                )
                
                raise
        
        return wrapper
    return decorator

# Emergency detection logging helper
def log_emergency_detection(logger: logging.Logger, signal_id: str, 
                          vehicle_type: str, confidence: float, 
                          action_taken: str = None, response_time_ms: int = None):
    """
    Log emergency vehicle detection with structured data
    
    Args:
        logger: Logger instance
        signal_id: Traffic signal ID
        vehicle_type: Type of emergency vehicle detected
        confidence: Detection confidence score
        action_taken: Action taken in response
        response_time_ms: Response time in milliseconds
    """
    
    log_with_extra(
        logger, 'info',
        f"Emergency vehicle detected at signal {signal_id}",
        event_type='emergency_detection',
        signal_id=signal_id,
        vehicle_type=vehicle_type,
        confidence=confidence,
        action_taken=action_taken,
        response_time_ms=response_time_ms
    )

# Signal state change logging helper
def log_signal_state_change(logger: logging.Logger, signal_id: str, 
                          old_state: str, new_state: str, 
                          is_emergency_override: bool = False,
                          override_reason: str = None):
    """
    Log traffic signal state changes
    
    Args:
        logger: Logger instance
        signal_id: Traffic signal ID
        old_state: Previous signal state
        new_state: New signal state
        is_emergency_override: Whether this is an emergency override
        override_reason: Reason for override if applicable
    """
    
    log_with_extra(
        logger, 'info',
        f"Signal {signal_id} state changed from {old_state} to {new_state}",
        event_type='signal_state_change',
        signal_id=signal_id,
        old_state=old_state,
        new_state=new_state,
        is_emergency_override=is_emergency_override,
        override_reason=override_reason
    )

# Route calculation logging helper
def log_route_calculation(logger: logging.Logger, route_id: str, 
                        vehicle_type: str, start_location: dict, 
                        end_location: dict, distance: float, 
                        estimated_duration: int, signals_count: int):
    """
    Log emergency route calculations
    
    Args:
        logger: Logger instance
        route_id: Unique route identifier
        vehicle_type: Type of emergency vehicle
        start_location: Starting location coordinates
        end_location: Destination coordinates
        distance: Total route distance in km
        estimated_duration: Estimated travel time in minutes
        signals_count: Number of signals on route
    """
    
    log_with_extra(
        logger, 'info',
        f"Emergency route calculated for {vehicle_type}",
        event_type='route_calculation',
        route_id=route_id,
        vehicle_type=vehicle_type,
        start_location=start_location,
        end_location=end_location,
        distance_km=distance,
        estimated_duration_minutes=estimated_duration,
        signals_on_route=signals_count
    )

# System health logging
def log_system_health(logger: logging.Logger, component: str, 
                     status: str, metrics: dict = None):
    """
    Log system health and performance metrics
    
    Args:
        logger: Logger instance
        component: System component name
        status: Health status (healthy, degraded, unhealthy)
        metrics: Performance metrics dictionary
    """
    
    extra_fields = {
        'event_type': 'system_health',
        'component': component,
        'status': status
    }
    
    if metrics:
        extra_fields.update(metrics)
    
    log_level = 'info' if status == 'healthy' else 'warning' if status == 'degraded' else 'error'
    
    log_with_extra(
        logger, log_level,
        f"System component {component} status: {status}",
        **extra_fields
    )

# Configure root logger for the application
def configure_root_logger():
    """Configure the root logger for the entire application"""
    
    # Set up root logger
    root_logger = logging.getLogger()
    
    # Remove default handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Set up application logger
    app_logger = setup_logger('traffic_management')
    
    # Configure third-party loggers
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('PIL').setLevel(logging.WARNING)
    logging.getLogger('matplotlib').setLevel(logging.WARNING)
    
    return app_logger

# Initialize logging when module is imported
if __name__ != '__main__':
    configure_root_logger()