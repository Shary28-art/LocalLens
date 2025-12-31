# Local Lens Multi-Platform System

A unified web application providing access to four specialized platforms: Blood Donation Management, Government Complaint System, Architecture Platform, and Traffic Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Redis (for traffic management)
- PostgreSQL (for traffic management)

### 1. Start the Main Web Application

```bash
cd web-frontend
npm install
npm run dev
```

The main application will be available at `http://localhost:3000`

**Login credentials:** `admin` / `admin`

### 2. Start the Traffic Management System (Fully Functional)

```bash
cd traffic-platform
pip install -r requirements.txt
python scripts/download_models.py  # Download YOLO models
python src/main.py
```

The traffic dashboard will be available at `http://localhost:5000`

## 🏗️ System Architecture

### Main Web Application (Next.js)
- **Location:** `web-frontend/`
- **Port:** 3000
- **Status:** ✅ Fully Implemented
- **Features:**
  - Authentication system
  - Platform selection dashboard
  - Navigation to all four platforms
  - Responsive design

### Traffic Management System (Python/Flask)
- **Location:** `traffic-platform/`
- **Port:** 5000
- **Status:** ✅ Fully Implemented
- **Features:**
  - AI-powered emergency vehicle detection (YOLOv8 + OpenCV)
  - Real-time traffic signal control
  - Route optimization with Dijkstra's algorithm
  - Multi-signal coordination for green corridors
  - Interactive dashboard with Dehradun map
  - Property-based testing with Hypothesis

### Other Platforms (Placeholder Pages)
- **Blood Donation Platform:** 🚧 Coming Soon
- **Government Complaint Management:** 🚧 Coming Soon  
- **Architecture Platform:** 🚧 Coming Soon

## 🎯 Platform Features

### Traffic Management System (Active)

#### Emergency Vehicle Detection
- YOLOv8-based computer vision
- Blue/red color analysis for ambulances/police cars
- Real-time confidence scoring
- Automatic signal override triggering

#### Traffic Signal Control
- Webster's algorithm for optimal timing
- Adaptive timing based on traffic density
- Emergency priority algorithms
- Multi-signal coordination

#### Route Optimization
- Dijkstra's shortest path algorithm
- Real-time traffic data integration
- Hospital location database for Dehradun
- Dynamic route weights based on conditions

#### Dashboard Features
- Real-time traffic monitoring
- Interactive Dehradun map with signal locations
- Emergency detection logs
- Manual signal override controls
- Traffic analytics and charts
- System health monitoring

## 🧪 Testing

The traffic management system includes comprehensive testing:

### Property-Based Tests (Hypothesis)
- Emergency vehicle detection accuracy
- Signal override functionality  
- Route optimization properties
- Multi-signal coordination (with known failure case)

### Unit Tests
- Component-level testing
- Integration testing
- Mock-based testing for external dependencies

```bash
cd traffic-platform
python -m pytest tests/ -v
```

## 🔧 Configuration

### Traffic Management System
Edit `traffic-platform/.env`:
```env
MODEL_PATH=models/yolov8n.pt
DETECTION_CONFIDENCE_THRESHOLD=0.85
EMERGENCY_OVERRIDE_DURATION=60
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/traffic_db
```

### Web Frontend
The main application uses simple authentication (admin/admin) and connects to the traffic system at localhost:5000.

## 📱 Usage Flow

1. **Access Main Application:** Visit `http://localhost:3000`
2. **Login:** Use `admin` / `admin`
3. **Select Platform:** Choose from four available platforms
4. **Traffic Management:** Click "Traffic Management System" to access the fully functional traffic dashboard
5. **Other Platforms:** Other platforms show "Coming Soon" pages with feature descriptions

## 🚦 Traffic Management Features

### Real-Time Monitoring
- Live traffic signal status
- Emergency vehicle detection alerts
- Route calculation and optimization
- Signal coordination for emergency corridors

### Manual Controls
- Override individual signals
- Set custom timing configurations
- Coordinate multiple signals
- Monitor system health

### Analytics
- Hourly detection patterns
- Response time metrics
- Signal performance data
- Traffic flow analysis

## 🔮 Future Development

The system is designed for incremental development:

1. **Blood Donation Platform:** Real-time donor-recipient matching
2. **Complaint Management:** Government complaint filing and tracking
3. **Architecture Platform:** DevOps templates and deployment automation

Each platform will integrate with the main authentication system and maintain the unified user experience.

## 🛠️ Development Notes

- **Traffic System:** Fully implemented with AI/ML capabilities
- **Web Frontend:** Complete with authentication and navigation
- **Database:** PostgreSQL schema ready for traffic management
- **Testing:** Property-based testing ensures correctness
- **Scalability:** Microservices architecture for independent scaling

## 📞 Support

For technical issues or questions about the traffic management system implementation, refer to the comprehensive test suite and documentation in the `traffic-platform/` directory.

The system demonstrates a production-ready traffic management solution with AI-powered emergency vehicle detection, intelligent signal control, and real-time route optimization.